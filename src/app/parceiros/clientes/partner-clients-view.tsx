"use client";

import {
  Activity,
  CheckCircle2,
  Download,
  Dumbbell,
  Filter,
  HeartPulse,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  SlidersHorizontal,
  Utensils,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import type {
  PartnerClientRow,
  PartnerClientStatus,
  PartnerClientsData,
} from "@/lib/partners/clients-metrics";
import { cn } from "@/lib/utils";

type PartnerClientsViewProps = {
  clients: PartnerClientsData;
};

type StatusFilter = "all" | PartnerClientStatus;
type ServiceScope = "dieta" | "treino" | "saude";
type PhoneCountryCode = "AR" | "BR" | "PT" | "US";

type PhoneCountry = {
  code: PhoneCountryCode;
  dialCode: string;
  flag: string;
  label: string;
  placeholder: string;
};

type NewClientFields = {
  birthDate: string;
  cpf: string;
  displayName: string;
  email: string;
  objective: string;
  phone: string;
  phoneCountry: PhoneCountryCode;
  serviceScopes: ServiceScope[];
};

type FieldErrors = Partial<Record<keyof NewClientFields, string>>;

type ProvisionClientResponse = {
  error?: {
    code?: string;
    fields?: Record<string, string>;
    message?: string;
  };
  idempotencyKey?: string;
  invite?: {
    status?: string;
  };
  status?: string;
};

const initialNewClientFields: NewClientFields = {
  birthDate: "",
  cpf: "",
  displayName: "",
  email: "",
  objective: "",
  phone: "",
  phoneCountry: "BR",
  serviceScopes: ["treino"],
};

const phoneCountries: PhoneCountry[] = [
  { code: "BR", dialCode: "+55", flag: "🇧🇷", label: "Brasil", placeholder: "(11) 99999-9999" },
  { code: "PT", dialCode: "+351", flag: "🇵🇹", label: "Portugal", placeholder: "912 345 678" },
  { code: "US", dialCode: "+1", flag: "🇺🇸", label: "Estados Unidos", placeholder: "(555) 123-4567" },
  { code: "AR", dialCode: "+54", flag: "🇦🇷", label: "Argentina", placeholder: "11 1234-5678" },
];

const objectiveSuggestions = [
  "Hipertrofia",
  "Performance",
  "Emagrecimento",
  "Condicionamento",
  "Reabilitação",
];

const statusLabels: Record<StatusFilter, string> = {
  active: "Ativos",
  all: "Todos",
  inactive: "Inativos",
  pending: "Pendentes",
  suspended: "Suspensos",
};

const scopeLabels: Record<ServiceScope, string> = {
  dieta: "Dieta",
  saude: "Saúde",
  treino: "Treino",
};

const scopeIcons: Record<string, typeof Activity> = {
  dieta: Utensils,
  saude: HeartPulse,
  treino: Dumbbell,
};

const creatableScopes: Array<Extract<ServiceScope, "dieta" | "treino">> = ["dieta", "treino"];
const visiblePlanScopes: Array<Extract<ServiceScope, "dieta" | "treino">> = ["dieta", "treino"];

const renewalToneClasses: Record<PartnerClientRow["renewalTone"], string> = {
  amber: "border-[#5a4420] bg-[#2b2417] text-[#f0c76a]",
  blue: "border-[#235f91] bg-[#0b2b46] text-[#68afe9]",
  green: "border-[#1f5f38] bg-[#0c2b1d] text-[#58d881]",
  red: "border-[#6e3535] bg-[#31151b] text-[#ff7b8e]",
  slate: "border-[#303746] bg-[#161a22] text-[#8b92a3]",
};

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "10000000-0000-4000-8000-000000000000".replace(/[018]/g, (char) =>
    (
      Number(char) ^
      (Math.random() * 16) >>
        (Number(char) / 4)
    ).toString(16),
  );
}

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll("\"", "\"\"")}"`;
}

function downloadClientsCsv(rows: PartnerClientRow[]) {
  const headers = ["Cliente", "E-mail", "Objetivo", "Idade", "Última atualização", "Escopos", "Planos", "Renovação"];
  const csvRows = rows.map((row) => [
    row.name,
    row.email,
    row.objectiveLabel,
    row.ageLabel,
    row.lastUpdateLabel,
    row.serviceScopeLabel,
    row.planSummaryLabel,
    `${row.renewalLabel} (${row.renewalDateLabel})`,
  ]);
  const csv = [headers, ...csvRows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "clientes-parceiro.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function mapFunctionError(code?: string) {
  const messages: Record<string, string> = {
    AUTH_REQUIRED: "Sua sessão expirou. Entre novamente para continuar.",
    CLIENT_DATA_CONFLICT: "Já existe um Cliente com dados divergentes.",
    CPF_CONFLICT: "Este CPF já está associado a outro Cliente.",
    EMAIL_ROLE_CONFLICT: "Este e-mail já pertence a outro tipo de perfil.",
    FORBIDDEN: "Sua conta não possui permissão para criar Clientes.",
    IDEMPOTENCY_KEY_REUSED: "Esta tentativa foi reutilizada com outros dados.",
    IDENTITY_RECONCILIATION_REQUIRED: "Existe uma identidade que precisa de revisão manual.",
    INVALID_PAYLOAD: "Revise os dados do formulário antes de enviar.",
    RELATIONSHIP_CONFLICT: "Já existe um vínculo incompatível para este Cliente.",
    SERVICE_SCOPE_CONFLICT: "Um dos escopos já está ativo com outro Parceiro.",
  };

  return messages[code ?? ""] ?? "Não foi possível criar o Cliente agora.";
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function getPhoneCountry(code: PhoneCountryCode) {
  return phoneCountries.find((country) => country.code === code) ?? phoneCountries[0];
}

function nationalPhoneDigits(value: string, countryCode: PhoneCountryCode) {
  const digits = digitsOnly(value);
  const dialDigits = digitsOnly(getPhoneCountry(countryCode).dialCode);

  if (digits.startsWith(dialDigits) && digits.length > dialDigits.length + 5) {
    return digits.slice(dialDigits.length);
  }

  return digits;
}

function formatBrazilPhone(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  const area = digits.slice(0, 2);
  const prefix = digits.slice(2, 7);
  const suffix = digits.slice(7, 11);

  if (digits.length <= 2) return area ? `(${area}` : "";
  if (digits.length <= 7) return `(${area}) ${prefix}`;
  return `(${area}) ${prefix}-${suffix}`;
}

function formatUsPhone(value: string) {
  const digits = digitsOnly(value).slice(0, 10);
  const area = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const suffix = digits.slice(6, 10);

  if (digits.length <= 3) return area ? `(${area}` : "";
  if (digits.length <= 6) return `(${area}) ${prefix}`;
  return `(${area}) ${prefix}-${suffix}`;
}

function formatGenericPhone(value: string) {
  const digits = digitsOnly(value).slice(0, 14);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function formatPhone(value: string, countryCode: PhoneCountryCode) {
  const nationalDigits = nationalPhoneDigits(value, countryCode);
  if (countryCode === "BR") return formatBrazilPhone(nationalDigits);
  if (countryCode === "US") return formatUsPhone(nationalDigits);
  return formatGenericPhone(nationalDigits);
}

function formatCpf(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 6);
  const third = digits.slice(6, 9);
  const check = digits.slice(9, 11);

  if (digits.length <= 3) return first;
  if (digits.length <= 6) return `${first}.${second}`;
  if (digits.length <= 9) return `${first}.${second}.${third}`;
  return `${first}.${second}.${third}-${check}`;
}

function phoneToE164(fields: NewClientFields) {
  const country = getPhoneCountry(fields.phoneCountry);
  return `${country.dialCode}${digitsOnly(fields.phone)}`;
}

async function readFunctionError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "context" in error &&
    error.context instanceof Response
  ) {
    try {
      const body = (await error.context.json()) as ProvisionClientResponse;
      return mapFunctionError(body.error?.code);
    } catch {
      return mapFunctionError();
    }
  }

  return mapFunctionError();
}

function PartnerPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-[12px] border border-[#303746] bg-[#181d25] shadow-[0_1px_3px_rgba(0,0,0,0.12)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function StatusBadge({ status, label }: { label: string; status: PartnerClientStatus }) {
  const className =
    status === "active"
      ? "border-[#1f5f38] bg-[#0c2b1d] text-[#58d881]"
      : status === "pending"
        ? "border-[#5a4420] bg-[#2b2417] text-[#f0c76a]"
        : status === "suspended"
          ? "border-[#5c5641] bg-[#2d2b21] text-[#d8c37f]"
          : "border-[#303746] bg-[#161a22] text-[#8b92a3]";

  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold", className)}>
      {label}
    </span>
  );
}

function ScopeIcon({ active, scope }: { active: boolean; scope: ServiceScope }) {
  const Icon = scopeIcons[scope] ?? Activity;

  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-full border",
        active
          ? "border-[#3b97e3]/60 bg-[#12375a] text-[#68afe9]"
          : "border-[#303746] bg-[#1d212b]/50 text-[#6f7c89]",
      )}
      title={scopeLabels[scope]}
    >
      <Icon className="size-4" />
    </span>
  );
}

function validateNewClient(fields: NewClientFields): FieldErrors {
  const errors: FieldErrors = {};
  const phoneDigits = digitsOnly(fields.phone);

  if (!fields.displayName.trim()) {
    errors.displayName = "Informe o nome do Cliente.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = "Informe um e-mail válido.";
  }

  if (fields.phoneCountry === "BR" && phoneDigits.length !== 11) {
    errors.phone = "Use telefone brasileiro com DDD, como (11) 99999-9999.";
  } else if (fields.phoneCountry !== "BR" && (phoneDigits.length < 6 || phoneDigits.length > 14)) {
    errors.phone = "Informe um telefone válido para o país selecionado.";
  }

  if (fields.phoneCountry === "BR" && fields.cpf.trim() && digitsOnly(fields.cpf).length !== 11) {
    errors.cpf = "CPF deve conter 11 dígitos.";
  }

  if (fields.birthDate && new Date(fields.birthDate) > new Date()) {
    errors.birthDate = "Data de nascimento não pode ser futura.";
  }

  if (fields.serviceScopes.length === 0) {
    errors.serviceScopes = "Selecione ao menos um escopo.";
  }

  return errors;
}

function NewClientDrawer({
  onCreated,
  onOpenChange,
  open,
}: {
  onCreated: (message: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const router = useRouter();
  const [fields, setFields] = useState<NewClientFields>(initialNewClientFields);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  function updateField<Key extends keyof NewClientFields>(key: Key, value: NewClientFields[Key]) {
    setFields((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitMessage(null);
  }

  function updatePhoneCountry(countryCode: PhoneCountryCode) {
    setFields((current) => ({
      ...current,
      cpf: countryCode === "BR" ? current.cpf : "",
      phone: formatPhone(current.phone, countryCode),
      phoneCountry: countryCode,
    }));
    setFieldErrors((current) => ({ ...current, cpf: undefined, phone: undefined, phoneCountry: undefined }));
    setSubmitMessage(null);
  }

  function updatePhone(value: string) {
    updateField("phone", formatPhone(value, fields.phoneCountry));
  }

  function updateCpf(value: string) {
    updateField("cpf", formatCpf(value));
  }

  function toggleScope(scope: ServiceScope) {
    updateField(
      "serviceScopes",
      fields.serviceScopes.includes(scope)
        ? fields.serviceScopes.filter((item) => item !== scope)
        : [...fields.serviceScopes, scope],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage(null);

    const errors = validateNewClient(fields);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setSubmitMessage("Revise os campos destacados antes de criar o Cliente.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      displayName: fields.displayName.trim(),
      email: fields.email.trim().toLowerCase(),
      idempotencyKey: createIdempotencyKey(),
      phone: phoneToE164(fields),
      serviceScopes: [...fields.serviceScopes].sort(),
      ...(fields.birthDate ? { birthDate: fields.birthDate } : {}),
      ...(fields.objective.trim() ? { objective: fields.objective.trim() } : {}),
      ...(fields.phoneCountry === "BR" && fields.cpf.trim() ? { cpf: digitsOnly(fields.cpf) } : {}),
    };

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke<ProvisionClientResponse>(
        "provision-client-for-partner",
        { body: payload },
      );

      if (error) {
        setSubmitMessage(await readFunctionError(error));
        return;
      }

      const status = data?.status === "existing" ? "Cliente já existente reconciliado." : "Cliente criado com convite pendente.";
      setFields(initialNewClientFields);
      onCreated(status);
      router.refresh();
      onOpenChange(false);
    } catch {
      setSubmitMessage("Não foi possível criar o Cliente agora.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-l border-[#303746] bg-[#0b1720] p-0 text-[#f3f4f7] sm:max-w-[500px]" side="right">
        <SheetHeader className="border-b border-[#303746] px-6 py-5 text-left">
          <SheetTitle className="text-[22px] font-bold text-[#f3f4f7]">Novo Cliente</SheetTitle>
          <SheetDescription className="text-[13px] text-[#8b92a3]">
            O convite será criado pelo backend e ficará pendente de envio real.
          </SheetDescription>
        </SheetHeader>

        <form className="grid gap-5 px-6 py-5" onSubmit={handleSubmit}>
          <Field label="Nome" error={fieldErrors.displayName} htmlFor="client-display-name">
            <input
              className="h-10 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none transition-colors placeholder:text-[#6f7c89] focus:border-[#3b97e3]"
              id="client-display-name"
              value={fields.displayName}
              onChange={(event) => updateField("displayName", event.target.value)}
              placeholder="Carlos Eduardo Santos"
            />
          </Field>

          <Field label="E-mail" error={fieldErrors.email} htmlFor="client-email">
            <input
              className="h-10 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none transition-colors placeholder:text-[#6f7c89] focus:border-[#3b97e3]"
              id="client-email"
              type="email"
              value={fields.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="cliente@example.com"
            />
          </Field>

          <Field label="Telefone" error={fieldErrors.phone} htmlFor="client-phone">
            <div className="grid grid-cols-[132px_minmax(0,1fr)] gap-2">
              <select
                aria-label="País do telefone"
                className="h-10 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none transition-colors focus:border-[#3b97e3]"
                value={fields.phoneCountry}
                onChange={(event) => updatePhoneCountry(event.target.value as PhoneCountryCode)}
              >
                {phoneCountries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.dialCode}
                  </option>
                ))}
              </select>
              <input
                className="h-10 min-w-0 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none transition-colors placeholder:text-[#6f7c89] focus:border-[#3b97e3]"
                id="client-phone"
                inputMode="tel"
                value={fields.phone}
                onChange={(event) => updatePhone(event.target.value)}
                placeholder={getPhoneCountry(fields.phoneCountry).placeholder}
              />
            </div>
          </Field>

          <Field label="Objetivo" error={fieldErrors.objective} htmlFor="client-objective">
            <input
              className="h-10 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none transition-colors placeholder:text-[#6f7c89] focus:border-[#3b97e3]"
              id="client-objective"
              value={fields.objective}
              onChange={(event) => updateField("objective", event.target.value)}
              placeholder="Digite ou escolha uma sugestão"
            />
            <div className="flex flex-wrap gap-1.5">
              {objectiveSuggestions.map((objective) => (
                <button
                  className="rounded-full border border-[#303746] bg-[#161a22] px-2 py-1 text-[11px] font-medium text-[#8b92a3] transition-colors hover:border-[#3b97e3] hover:text-[#d7dae0]"
                  key={objective}
                  type="button"
                  onClick={() => updateField("objective", objective)}
                >
                  {objective}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nascimento" error={fieldErrors.birthDate} htmlFor="client-birth-date">
              <input
                className="h-10 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none transition-colors focus:border-[#3b97e3]"
                id="client-birth-date"
                type="date"
                value={fields.birthDate}
                onChange={(event) => updateField("birthDate", event.target.value)}
              />
            </Field>
            {fields.phoneCountry === "BR" ? (
              <Field label="CPF opcional" error={fieldErrors.cpf} htmlFor="client-cpf">
                <input
                  className="h-10 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none transition-colors placeholder:text-[#6f7c89] focus:border-[#3b97e3]"
                  id="client-cpf"
                  inputMode="numeric"
                  value={fields.cpf}
                  onChange={(event) => updateCpf(event.target.value)}
                  placeholder="000.000.000-00"
                />
              </Field>
            ) : null}
          </div>

          <div>
            <p className="text-[13px] font-semibold text-[#d7dae0]">Escopos</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {creatableScopes.map((scope) => (
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-2 text-[13px]",
                    fields.serviceScopes.includes(scope)
                      ? "border-[#3b97e3] bg-[#0a2c48] text-white"
                      : "border-[#303746] bg-[#161a22] text-[#bac1ce]",
                  )}
                  key={scope}
                >
                  <input
                    checked={fields.serviceScopes.includes(scope)}
                    className="sr-only"
                    type="checkbox"
                    onChange={() => toggleScope(scope)}
                  />
                  <ScopeIcon active={fields.serviceScopes.includes(scope)} scope={scope} />
                  {scopeLabels[scope]}
                </label>
              ))}
            </div>
            {fieldErrors.serviceScopes ? (
              <p className="mt-2 text-[12px] text-[#ff7b8e]">{fieldErrors.serviceScopes}</p>
            ) : null}
          </div>

          {submitMessage ? (
            <div className="rounded-[10px] border border-[#5a4420] bg-[#2b2417] px-4 py-3 text-[13px] text-[#f0c76a]" role="alert">
              {submitMessage}
            </div>
          ) : null}

          <button
            className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#3b97e3] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#2890df] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Criar Cliente
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  children,
  error,
  htmlFor,
  label,
}: {
  children: ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-[13px] font-semibold text-[#d7dae0]" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <span className="text-[12px] font-normal text-[#ff7b8e]">{error}</span> : null}
    </div>
  );
}

export function PartnerClientsView({ clients }: PartnerClientsViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const pageSize = 6;

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return clients.rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!term) return true;
      return row.searchText.includes(term);
    });
  }, [clients.rows, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const start = filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filteredRows.length);

  function setStatus(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  async function copyEmail(row: PartnerClientRow) {
    try {
      await navigator.clipboard.writeText(row.email);
      setActionMessage(`E-mail de ${row.name} copiado.`);
      setOpenActionMenuId(null);
    } catch {
      setActionMessage("Não foi possível copiar o e-mail.");
    }
  }

  function editClient(row: PartnerClientRow) {
    setOpenActionMenuId(null);
    router.push(`/parceiros/clientes/${row.id}`);
  }

  function deleteClient(row: PartnerClientRow) {
    setOpenActionMenuId(null);
    setActionMessage(`Exclusão de ${row.name} ainda não está disponível nesta tela.`);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b1720] px-3 py-4 font-['Rethink_Sans',sans-serif] text-[#f3f4f7] sm:px-5 sm:py-8 lg:px-6 lg:py-[74px]">
      <div className="mx-auto min-w-0 max-w-[1202px]">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[24px] font-bold leading-8 text-[#f3f4f7] sm:text-[32px] sm:leading-10">Clientes</h1>
            <p className="mt-0.5 text-[12px] leading-4 text-[#bac1ce] sm:mt-1 sm:text-[14px] sm:leading-5">
              Gerencie seus clientes. <span className="font-semibold text-[#f3f4f7]">Total: {clients.activeCount} ativos</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <button
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-[#303746] bg-[#161a22] px-3 text-[12px] font-medium text-[#f3f4f7] sm:h-10 sm:gap-2 sm:rounded-[10px] sm:px-4 sm:text-[14px]"
              type="button"
              onClick={() => downloadClientsCsv(filteredRows)}
            >
              <Download className="size-4 sm:size-[18px]" />
              Exportar
            </button>
            <button
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-[#3b97e3] px-3 text-[12px] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] sm:h-10 sm:gap-2 sm:rounded-[10px] sm:px-4 sm:text-[14px]"
              type="button"
              onClick={() => setNewClientOpen(true)}
            >
              <Plus className="size-4 sm:size-[18px]" />
              Novo Cliente
            </button>
          </div>
        </header>

        <section className="mt-4 grid gap-2 sm:mt-7 lg:flex lg:items-center">
          <label className="relative min-w-0 lg:w-[447px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#bac1ce]" />
            <span className="sr-only">Buscar clientes</span>
            <input
              className="h-9 w-full rounded-[8px] border border-[#303746] bg-[#161a22] pl-9 pr-3 text-[12px] text-[#f3f4f7] outline-none placeholder:text-[#bac1ce] focus:border-[#3b97e3] sm:h-10 sm:rounded-[10px] sm:text-[14px]"
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <div className="grid grid-cols-2 gap-2 lg:flex lg:gap-3">
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-[#303746] bg-[#161a22] px-3 text-[12px] font-medium text-[#bac1ce] sm:h-10 sm:gap-2 sm:rounded-[10px] sm:px-4 sm:text-[14px]"
            type="button"
            onClick={() => setAdvancedOpen((current) => !current)}
          >
            <SlidersHorizontal className="size-4" />
            Filtros
          </button>
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-[#303746] bg-[#161a22] px-3 text-[12px] font-medium text-[#bac1ce] sm:h-10 sm:gap-2 sm:rounded-[10px] sm:px-4 sm:text-[14px]"
            type="button"
            onClick={() => setStatus(statusFilter === "active" ? "all" : "active")}
          >
            <Filter className="size-4" />
            Status: {statusLabels[statusFilter]}
          </button>
          </div>
        </section>

        {advancedOpen ? (
          <PartnerPanel className="mt-3 p-3">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(statusLabels) as StatusFilter[]).map((status) => (
                <button
                  className={cn(
                    "h-8 rounded-[8px] border px-2.5 text-[12px] font-semibold sm:h-9 sm:px-3 sm:text-[13px]",
                    statusFilter === status
                      ? "border-[#3b97e3] bg-[#0a2c48] text-white"
                      : "border-[#303746] bg-[#161a22] text-[#bac1ce]",
                  )}
                  key={status}
                  type="button"
                  onClick={() => setStatus(status)}
                >
                  {statusLabels[status]} ({clients.tabCounts[status]})
                </button>
              ))}
            </div>
          </PartnerPanel>
        ) : null}

        {actionMessage ? (
          <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-[#303746] bg-[#161a22] px-4 py-3 text-[13px] text-[#bac1ce]" role="status">
            <CheckCircle2 className="size-4 text-[#58d881]" />
            {actionMessage}
          </div>
        ) : null}

        <PartnerPanel className="mt-4 overflow-hidden sm:mt-6">
          <div className="w-full overflow-x-auto">
            <table className="w-full table-fixed text-left md:min-w-[980px] md:table-auto">
              <thead className="bg-[rgba(29,33,43,0.5)] text-[12px] uppercase leading-4 tracking-[0.05em] text-[#bac1ce]">
                <tr className="border-b border-[#303746]">
                  <th className="w-[54%] px-3 py-3 font-medium md:w-auto md:px-6 md:py-4">Cliente</th>
                  <th className="hidden px-4 py-4 font-medium md:table-cell">Objetivo</th>
                  <th className="hidden px-4 py-4 font-medium md:table-cell">Idade</th>
                  <th className="hidden px-4 py-4 font-medium md:table-cell">Última Atualização</th>
                  <th className="hidden px-4 py-4 text-center font-medium md:table-cell">Planos contratados</th>
                  <th className="w-[31%] px-3 py-3 font-medium md:w-[150px] md:px-4 md:py-4">Renovação</th>
                  <th className="w-[15%] px-3 py-3 text-right font-medium md:w-[112px] md:px-6 md:py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#303746]">
                {visibleRows.length === 0 ? (
                  <tr>
                    <td className="px-6 py-16 text-center text-[14px] text-[#8b92a3]" colSpan={7}>
                      Nenhum Cliente encontrado para os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr className="text-[12px] text-[#f3f4f7] sm:text-[14px]" key={row.id}>
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#fce4e7] text-[11px] font-bold text-[#121722] sm:size-10 sm:text-[13px]">
                            {row.initial}
                          </span>
                          <div className="min-w-0">
                            <button
                              className="block truncate text-left text-[12px] font-semibold leading-4 text-[#f3f4f7] hover:text-[#68afe9] sm:text-[14px] sm:leading-5"
                              type="button"
                              onClick={() => router.push(`/parceiros/clientes/${row.id}`)}
                            >
                              {row.name}
                            </button>
                            <p className="truncate text-[11px] leading-4 text-[#bac1ce] sm:text-[12px]">{row.email}</p>
                            <p className="mt-1 text-[11px] leading-4 text-[#8b92a3] md:hidden">
                              {row.objectiveLabel} · {row.ageLabel} · {row.planSummaryLabel}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-4 md:table-cell">
                        <span className="rounded-full bg-[rgba(22,26,29,0.4)] px-2.5 py-1 text-[12px] font-medium text-[#3b97e3]">
                          {row.objectiveLabel}
                        </span>
                      </td>
                      <td className="hidden px-4 py-4 text-[#f3f4f7] md:table-cell">{row.ageLabel}</td>
                      <td className="hidden px-4 py-4 text-[#bac1ce] md:table-cell">{row.lastUpdateLabel}</td>
                      <td className="hidden px-4 py-4 md:table-cell">
                        <div className="flex items-center justify-center gap-2">
                          {visiblePlanScopes.map((scope) => (
                            <ScopeIcon active={row.serviceScopes.includes(scope)} key={scope} scope={scope} />
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3 md:px-4 md:py-4">
                        <span className={cn("inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium sm:px-2.5 sm:py-1 sm:text-[12px]", renewalToneClasses[row.renewalTone])}>
                          {row.renewalLabel}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        <div className="flex items-center justify-end gap-2">
                          <span className="hidden lg:inline-flex">
                            <StatusBadge label={row.statusLabel} status={row.status} />
                          </span>
                          <div className="relative">
                            <button
                              aria-expanded={openActionMenuId === row.id}
                              aria-haspopup="menu"
                              className="rounded-[8px] p-1.5 text-[#bac1ce] hover:bg-[#0a2c48] hover:text-white sm:p-2"
                              type="button"
                              onClick={() => setOpenActionMenuId((current) => current === row.id ? null : row.id)}
                            >
                              <MoreVertical className="size-4" />
                              <span className="sr-only">Abrir ações de {row.name}</span>
                            </button>
                            {openActionMenuId === row.id ? (
                              <div
                                className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-[10px] border border-[#303746] bg-[#161a22] py-1 text-left shadow-[0_12px_32px_rgba(0,0,0,0.28)]"
                                role="menu"
                              >
                                <button
                                  className="block w-full px-3 py-2 text-left text-[13px] text-[#d7dae0] hover:bg-[#0a2c48] hover:text-white"
                                  role="menuitem"
                                  type="button"
                                  onClick={() => copyEmail(row)}
                                >
                                  Copiar e-mail
                                </button>
                                <button
                                  className="block w-full px-3 py-2 text-left text-[13px] text-[#d7dae0] hover:bg-[#0a2c48] hover:text-white"
                                  role="menuitem"
                                  type="button"
                                  onClick={() => editClient(row)}
                                >
                                  Editar
                                </button>
                                <button
                                  className="block w-full px-3 py-2 text-left text-[13px] text-[#ff7b8e] hover:bg-[#31151b]"
                                  role="menuitem"
                                  type="button"
                                  onClick={() => deleteClient(row)}
                                >
                                  Excluir
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-col gap-4 border-t border-[#303746] bg-[rgba(29,33,43,0.2)] px-6 py-4 text-[14px] text-[#bac1ce] sm:flex-row sm:items-center sm:justify-between">
            <p>
              Mostrando <span className="font-medium text-[#f3f4f7]">{start}</span> a{" "}
              <span className="font-medium text-[#f3f4f7]">{end}</span> de{" "}
              <span className="font-medium text-[#f3f4f7]">{filteredRows.length}</span> clientes
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className="h-9 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[#f3f4f7] disabled:opacity-50"
                disabled={currentPage === 1}
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Anterior
              </button>
              {Array.from({ length: Math.min(totalPages, 4) }, (_, index) => index + 1).map((item) => (
                <button
                  className={cn(
                    "h-9 min-w-9 rounded-[10px] border px-3 text-[14px] font-medium",
                    currentPage === item
                      ? "border-[#3b97e3] bg-[#3b97e3] text-[#041549]"
                      : "border-[#303746] bg-[#161a22] text-[#f3f4f7]",
                  )}
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              ))}
              <button
                className="h-9 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[#f3f4f7] disabled:opacity-50"
                disabled={currentPage === totalPages}
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                Próxima
              </button>
            </div>
          </footer>
        </PartnerPanel>

        <div className="mt-6 flex flex-wrap gap-4 text-[12px] text-[#728697]">
          <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4" /> Dados conectados ao Supabase local</span>
          <span className="inline-flex items-center gap-2"><XCircle className="size-4" /> CPF fora da listagem e exportação</span>
        </div>
      </div>

      <NewClientDrawer
        open={newClientOpen}
        onCreated={setActionMessage}
        onOpenChange={setNewClientOpen}
      />
    </div>
  );
}
