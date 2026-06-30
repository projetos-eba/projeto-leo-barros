"use client";

import {
  Activity,
  CheckCircle2,
  Copy,
  Download,
  Dumbbell,
  Eye,
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

type NewClientFields = {
  birthDate: string;
  cpf: string;
  displayName: string;
  email: string;
  phone: string;
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
  phone: "",
  serviceScopes: ["treino"],
};

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

function ScopeIcon({ scope }: { scope: string }) {
  const Icon = scopeIcons[scope] ?? Activity;
  const active = scope === "treino" || scope === "dieta";

  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-full border",
        active
          ? "border-[#3b97e3]/60 bg-[#12375a] text-[#68afe9]"
          : "border-[#303746] bg-[#1d212b]/50 text-[#6f7c89]",
      )}
      title={scopeLabels[scope as ServiceScope] ?? scope}
    >
      <Icon className="size-4" />
    </span>
  );
}

function ClientDetailsDrawer({
  client,
  onOpenChange,
}: {
  client: PartnerClientRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={Boolean(client)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-l border-[#303746] bg-[#0b1720] p-0 text-[#f3f4f7] sm:max-w-[460px]" side="right">
        {client ? (
          <>
            <SheetHeader className="border-b border-[#303746] px-6 py-5 text-left">
              <SheetTitle className="text-[22px] font-bold text-[#f3f4f7]">Cliente selecionado</SheetTitle>
              <SheetDescription className="text-[13px] text-[#8b92a3]">
                Dados operacionais mínimos para acompanhamento.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-6 px-6 py-5">
              <section className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#fce4e7] text-[18px] font-bold text-[#121722]">
                  {client.initial}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-[20px] font-bold">{client.name}</h3>
                  <p className="truncate text-[13px] text-[#bac1ce]">{client.email}</p>
                  <p className="mt-1 text-[12px] text-[#8b92a3]">{client.phoneLabel}</p>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3">
                {[
                  ["Status", client.statusLabel],
                  ["Objetivo", client.objectiveLabel],
                  ["Idade", client.ageLabel],
                  ["Escopos", client.serviceScopeLabel],
                  ["Plano", client.planSummaryLabel],
                  ["Renovação", client.renewalLabel],
                  ["Início", client.startedAtLabel],
                  ["Atualização", client.lastUpdateLabel],
                ].map(([label, value]) => (
                  <div className="rounded-[8px] border border-[#303746] bg-[#161a22] p-3" key={label}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b92a3]">{label}</p>
                    <p className="mt-1 text-[13px] font-semibold text-[#f3f4f7]">{value}</p>
                  </div>
                ))}
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function validateNewClient(fields: NewClientFields): FieldErrors {
  const errors: FieldErrors = {};

  if (!fields.displayName.trim()) {
    errors.displayName = "Informe o nome do Cliente.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = "Informe um e-mail válido.";
  }

  if (!/^\+[1-9][0-9]{7,14}$/.test(fields.phone.trim())) {
    errors.phone = "Use telefone em E.164, como +5511999999999.";
  }

  if (fields.cpf.trim() && !/^[0-9]{11}$/.test(fields.cpf.trim())) {
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
      phone: fields.phone.trim(),
      serviceScopes: [...fields.serviceScopes].sort(),
      ...(fields.birthDate ? { birthDate: fields.birthDate } : {}),
      ...(fields.cpf.trim() ? { cpf: fields.cpf.trim() } : {}),
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
            <input
              className="h-10 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none transition-colors placeholder:text-[#6f7c89] focus:border-[#3b97e3]"
              id="client-phone"
              value={fields.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="+5511999999999"
            />
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
            <Field label="CPF opcional" error={fieldErrors.cpf} htmlFor="client-cpf">
              <input
                className="h-10 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none transition-colors placeholder:text-[#6f7c89] focus:border-[#3b97e3]"
                id="client-cpf"
                inputMode="numeric"
                value={fields.cpf}
                onChange={(event) => updateField("cpf", event.target.value)}
                placeholder="Somente números"
              />
            </Field>
          </div>

          <div>
            <p className="text-[13px] font-semibold text-[#d7dae0]">Escopos</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(Object.keys(scopeLabels) as ServiceScope[]).map((scope) => (
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
                  <ScopeIcon scope={scope} />
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<PartnerClientRow | null>(null);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
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
    } catch {
      setActionMessage("Não foi possível copiar o e-mail.");
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b1720] px-5 py-8 font-['Rethink_Sans',sans-serif] text-[#f3f4f7] lg:px-6 lg:py-[74px]">
      <div className="mx-auto min-w-0 max-w-[1202px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[32px] font-bold leading-10 text-[#f3f4f7]">Clientes</h1>
            <p className="mt-1 text-[14px] leading-5 text-[#bac1ce]">
              Gerencie seus clientes. <span className="font-semibold text-[#f3f4f7]">Total: {clients.activeCount} ativos</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#303746] bg-[#161a22] px-4 text-[14px] font-medium text-[#f3f4f7]"
              type="button"
              onClick={() => downloadClientsCsv(filteredRows)}
            >
              <Download className="size-[18px]" />
              Exportar
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#3b97e3] px-4 text-[14px] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
              type="button"
              onClick={() => setNewClientOpen(true)}
            >
              <Plus className="size-[18px]" />
              Novo Cliente
            </button>
          </div>
        </header>

        <section className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 lg:w-[447px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#bac1ce]" />
            <span className="sr-only">Buscar clientes</span>
            <input
              className="h-10 w-full rounded-[10px] border border-[#303746] bg-[#161a22] pl-9 pr-3 text-[14px] text-[#f3f4f7] outline-none placeholder:text-[#bac1ce] focus:border-[#3b97e3]"
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#303746] bg-[#161a22] px-4 text-[14px] font-medium text-[#bac1ce]"
            type="button"
            onClick={() => setAdvancedOpen((current) => !current)}
          >
            <SlidersHorizontal className="size-4" />
            Filtros Avançados
          </button>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#303746] bg-[#161a22] px-4 text-[14px] font-medium text-[#bac1ce]"
            type="button"
            onClick={() => setStatus(statusFilter === "active" ? "all" : "active")}
          >
            <Filter className="size-4" />
            Status: {statusLabels[statusFilter]}
          </button>
        </section>

        {advancedOpen ? (
          <PartnerPanel className="mt-3 p-3">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(statusLabels) as StatusFilter[]).map((status) => (
                <button
                  className={cn(
                    "h-9 rounded-[8px] border px-3 text-[13px] font-semibold",
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

        <PartnerPanel className="mt-6 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full table-fixed text-left md:min-w-[980px] md:table-auto">
              <thead className="bg-[rgba(29,33,43,0.5)] text-[12px] uppercase leading-4 tracking-[0.05em] text-[#bac1ce]">
                <tr className="border-b border-[#303746]">
                  <th className="w-[54%] px-3 py-4 font-medium md:w-auto md:px-6">Cliente</th>
                  <th className="hidden px-4 py-4 font-medium md:table-cell">Objetivo</th>
                  <th className="hidden px-4 py-4 font-medium md:table-cell">Idade</th>
                  <th className="hidden px-4 py-4 font-medium md:table-cell">Última Atualização</th>
                  <th className="hidden px-4 py-4 text-center font-medium md:table-cell">Planos contratados</th>
                  <th className="w-[22%] px-2 py-4 font-medium md:w-auto md:px-4">Renovação</th>
                  <th className="w-[24%] px-3 py-4 text-right font-medium md:w-auto md:px-6">Ações</th>
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
                    <tr className="text-[14px] text-[#f3f4f7]" key={row.id}>
                      <td className="px-3 py-4 md:px-6">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fce4e7] text-[13px] font-bold text-[#121722]">
                            {row.initial}
                          </span>
                          <div className="min-w-0">
                            <button
                              className="block truncate text-left text-[14px] font-semibold leading-5 text-[#f3f4f7] hover:text-[#68afe9]"
                              type="button"
                              onClick={() => setSelectedClient(row)}
                            >
                              {row.name}
                            </button>
                            <p className="truncate text-[12px] leading-4 text-[#bac1ce]">{row.email}</p>
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
                          {row.serviceScopes.slice(0, 4).map((scope) => (
                            <ScopeIcon key={scope} scope={scope} />
                          ))}
                          {row.serviceScopes.length === 0 ? (
                            <span className="text-[12px] text-[#8b92a3]">Sem escopo</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-2 py-4 md:px-4">
                        <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[12px] font-medium", renewalToneClasses[row.renewalTone])}>
                          {row.renewalLabel}
                        </span>
                      </td>
                      <td className="px-3 py-4 md:px-6">
                        <div className="flex items-center justify-end gap-1">
                          <span className="hidden lg:inline-flex">
                            <StatusBadge label={row.statusLabel} status={row.status} />
                          </span>
                          <button className="rounded-[8px] p-2 text-[#bac1ce] hover:bg-[#0a2c48] hover:text-white" type="button" onClick={() => setSelectedClient(row)}>
                            <Eye className="size-4" />
                            <span className="sr-only">Ver Cliente</span>
                          </button>
                          <button className="rounded-[8px] p-2 text-[#bac1ce] hover:bg-[#0a2c48] hover:text-white" type="button" onClick={() => copyEmail(row)}>
                            <Copy className="size-4" />
                            <span className="sr-only">Copiar e-mail</span>
                          </button>
                          <button
                            className="rounded-[8px] p-2 text-[#bac1ce] hover:bg-[#0a2c48] hover:text-white"
                            type="button"
                            onClick={() => setActionMessage(`Renovação de ${row.name}: ${row.renewalDateLabel}.`)}
                          >
                            <MoreVertical className="size-4" />
                            <span className="sr-only">Revisar renovação</span>
                          </button>
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

      <ClientDetailsDrawer client={selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)} />
      <NewClientDrawer
        open={newClientOpen}
        onCreated={setActionMessage}
        onOpenChange={setNewClientOpen}
      />
    </div>
  );
}
