"use client";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MailCheck,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

type ProfessionalType = "personal_trainer" | "nutricionista" | "medico";
type ProfessionalRegistryType = "crm" | "crn" | "cref" | "outro";

type CreatePartnerFields = {
  displayName: string;
  email: string;
  phone: string;
  professionalRegistryNumber: string;
  professionalRegistryType: ProfessionalRegistryType | "";
  professionalType: ProfessionalType | "";
};

type FieldErrors = Partial<Record<keyof CreatePartnerFields, string>>;

type ProvisionPartnerResponse = {
  error?: {
    code?: string;
    fields?: Record<string, string>;
    message?: string;
  };
  idempotencyKey?: string;
  invite?: {
    status?: string;
  };
  partner?: {
    accountStatus?: string;
    partnerId?: string;
    profileId?: string;
  };
  requestId?: string;
  status?: string;
};

type SubmitState =
  | {
      kind: "success";
      message: string;
      response: ProvisionPartnerResponse;
      title: string;
    }
  | {
      kind: "error";
      message: string;
      title: string;
    };

const initialFields: CreatePartnerFields = {
  displayName: "",
  email: "",
  phone: "",
  professionalRegistryNumber: "",
  professionalRegistryType: "",
  professionalType: "",
};

const professionalTypeLabels: Record<ProfessionalType, string> = {
  medico: "Medico",
  nutricionista: "Nutricionista",
  personal_trainer: "Personal trainer",
};

const registryTypeLabels: Record<ProfessionalRegistryType, string> = {
  cref: "CREF",
  crm: "CRM",
  crn: "CRN",
  outro: "Outro",
};

function normalizeFields(fields: CreatePartnerFields) {
  return {
    displayName: fields.displayName.trim(),
    email: fields.email.trim().toLowerCase(),
    phone: fields.phone.trim(),
    professionalRegistryNumber: fields.professionalRegistryNumber.trim(),
    professionalRegistryType: fields.professionalRegistryType,
    professionalType: fields.professionalType,
  };
}

function validateFields(fields: CreatePartnerFields): FieldErrors {
  const normalized = normalizeFields(fields);
  const errors: FieldErrors = {};

  if (!normalized.displayName) {
    errors.displayName = "Informe o nome de exibicao.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    errors.email = "Informe um e-mail valido.";
  }

  if (!/^\+[1-9][0-9]{7,14}$/.test(normalized.phone)) {
    errors.phone = "Use telefone em formato E.164, como +5511999999999.";
  }

  if (!normalized.professionalType) {
    errors.professionalType = "Selecione o tipo profissional.";
  }

  if (!normalized.professionalRegistryType) {
    errors.professionalRegistryType = "Selecione o tipo de registro.";
  }

  if (!normalized.professionalRegistryNumber) {
    errors.professionalRegistryNumber = "Informe o numero do registro.";
  }

  return errors;
}

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

function mapFunctionError(code?: string) {
  const messages: Record<string, string> = {
    AUTH_REQUIRED: "Sua sessao expirou. Entre novamente para continuar.",
    EMAIL_ROLE_CONFLICT:
      "Este e-mail ja pertence a outro perfil e precisa de revisao antes do cadastro.",
    FORBIDDEN:
      "Sua conta nao possui permissao para criar Parceiros neste ambiente.",
    IDEMPOTENCY_KEY_REUSED:
      "Esta tentativa ja foi registrada com outros dados. Revise o formulario e tente novamente.",
    IDENTITY_RECONCILIATION_REQUIRED:
      "Existe uma identidade com este e-mail que precisa de revisao manual.",
    INVALID_PAYLOAD: "Revise os dados do formulario antes de enviar.",
    PARTNER_DATA_CONFLICT:
      "Ja existe um Parceiro com este e-mail, mas os dados informados divergem.",
  };

  return messages[code ?? ""] ?? "Nao foi possivel criar o Parceiro agora.";
}

async function readFunctionError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "context" in error &&
    error.context instanceof Response
  ) {
    try {
      const body = (await error.context.json()) as ProvisionPartnerResponse;
      return mapFunctionError(body.error?.code);
    } catch {
      return mapFunctionError();
    }
  }

  return mapFunctionError();
}

function statusLabel(status?: string) {
  if (status === "pending_delivery") return "pending_delivery";
  if (status === "not_resent") return "not_resent";
  return status ?? "nao informado";
}

export function CreatePartnerForm() {
  const [fields, setFields] = useState<CreatePartnerFields>(initialFields);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState | null>(null);

  const normalizedPreview = useMemo(() => normalizeFields(fields), [fields]);

  function updateField<Key extends keyof CreatePartnerFields>(
    key: Key,
    value: CreatePartnerFields[Key],
  ) {
    setFields((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState(null);

    const errors = validateFields(fields);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setSubmitState({
        kind: "error",
        title: "Dados incompletos",
        message: "Revise os campos destacados antes de criar o Parceiro.",
      });
      return;
    }

    const normalized = normalizeFields(fields);
    setIsSubmitting(true);

    const payload = {
      displayName: normalized.displayName,
      email: normalized.email,
      idempotencyKey: createIdempotencyKey(),
      phone: normalized.phone,
      professionalRegistryNumber: normalized.professionalRegistryNumber,
      professionalRegistryType:
        normalized.professionalRegistryType as ProfessionalRegistryType,
      professionalType: normalized.professionalType as ProfessionalType,
    };

    try {
      const supabase = createClient();
      const { data, error } =
        await supabase.functions.invoke<ProvisionPartnerResponse>(
          "provision-partner",
          {
            body: payload,
          },
        );

      if (error) {
        setSubmitState({
          kind: "error",
          title: "Criacao nao concluida",
          message: await readFunctionError(error),
        });
        return;
      }

      const response = data ?? {};
      const isExisting = response.status === "existing";

      setSubmitState({
        kind: "success",
        title: isExisting ? "Parceiro ja existente" : "Parceiro criado",
        message: isExisting
          ? "Encontramos um Parceiro compativel com estes dados. Nenhuma senha, link ou token foi exposto."
          : "O Parceiro foi criado com acesso ativo. O convite permanece pendente de envio.",
        response,
      });
    } catch {
      setSubmitState({
        kind: "error",
        title: "Falha inesperada",
        message: "Nao foi possivel criar o Parceiro agora.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <form className="glass-card p-5 md:p-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
              Novo parceiro
            </p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">
              Dados de acesso e registro
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Informe os dados cadastrais para criar o acesso do Parceiro.
            </p>
          </div>

          <Badge className="w-fit border-primary/30 bg-primary/10 text-primary hover:bg-primary/10">
            Supabase local
          </Badge>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <FieldControl error={fieldErrors.displayName}>
            <Label htmlFor="displayName">Nome de exibicao</Label>
            <Input
              id="displayName"
              autoComplete="name"
              className="h-11 bg-accent"
              placeholder="Marina Alves"
              value={fields.displayName}
              onChange={(event) =>
                updateField("displayName", event.target.value)
              }
            />
          </FieldControl>

          <FieldControl error={fieldErrors.email}>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              autoComplete="email"
              className="h-11 bg-accent"
              placeholder="parceiro.local@example.com"
              type="email"
              value={fields.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </FieldControl>

          <FieldControl error={fieldErrors.phone}>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              autoComplete="tel"
              className="h-11 bg-accent"
              placeholder="+5511999999999"
              value={fields.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />
          </FieldControl>

          <FieldControl error={fieldErrors.professionalType}>
            <Label htmlFor="professionalType">Tipo profissional</Label>
            <Select
              value={fields.professionalType}
              onValueChange={(value: ProfessionalType) =>
                updateField("professionalType", value)
              }
            >
              <SelectTrigger id="professionalType" className="h-11 bg-accent">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(professionalTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldControl>

          <FieldControl error={fieldErrors.professionalRegistryType}>
            <Label htmlFor="professionalRegistryType">Tipo de registro</Label>
            <Select
              value={fields.professionalRegistryType}
              onValueChange={(value: ProfessionalRegistryType) =>
                updateField("professionalRegistryType", value)
              }
            >
              <SelectTrigger
                id="professionalRegistryType"
                className="h-11 bg-accent"
              >
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(registryTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldControl>

          <FieldControl error={fieldErrors.professionalRegistryNumber}>
            <Label htmlFor="professionalRegistryNumber">
              Numero do registro
            </Label>
            <Input
              id="professionalRegistryNumber"
              className="h-11 bg-accent"
              placeholder="12345"
              value={fields.professionalRegistryNumber}
              onChange={(event) =>
                updateField("professionalRegistryNumber", event.target.value)
              }
            />
          </FieldControl>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-background/40 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Professional name
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Usaremos o nome de exibicao quando o nome profissional nao for informado.
              </p>
            </div>
            <p className="max-w-full truncate rounded-full border border-border bg-accent px-3 py-1 text-sm text-muted-foreground">
              {normalizedPreview.displayName || "Aguardando nome"}
            </p>
          </div>
        </div>

        {submitState ? (
          <div
            className={
              submitState.kind === "success"
                ? "mt-6 rounded-xl border border-success/30 bg-success/10 p-4"
                : "mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
            }
            role={submitState.kind === "error" ? "alert" : "status"}
          >
            <div className="flex items-start gap-3">
              {submitState.kind === "success" ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              ) : (
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {submitState.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {submitState.message}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            Nenhuma senha sera definida ou exibida nesta etapa.
          </p>
          <Button
            className="h-11 rounded-[10px] px-5 font-semibold"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <UserRoundPlus className="size-4" />
                Criar parceiro
              </>
            )}
          </Button>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                Contrato da operacao
              </h2>
              <p className="text-sm text-muted-foreground">
                A plataforma aplica as permissoes adequadas para este perfil.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <ContractRow label="Role enviada pela UI" value="Nao" />
            <ContractRow label="Senha enviada pela UI" value="Nao" />
            <ContractRow label="Service role no browser" value="Nao" />
            <ContractRow label="Ambiente" value="Local" />
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <MailCheck className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                Convite pendente
              </h2>
              <p className="text-sm text-muted-foreground">
                Envio real sera ligado futuramente.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-background/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Status atual
            </p>
            <p className="mt-2 text-xl font-bold text-foreground">
              {submitState?.kind === "success"
                ? statusLabel(submitState.response.invite?.status)
                : "pending_delivery"}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              A UI nao exibe link, token ou senha. O Parceiro definira a senha
              quando o envio de e-mail for configurado.
            </p>
          </div>

          {submitState?.kind === "success" ? (
            <div className="mt-4 grid gap-3">
              <ResultBadge
                label="Conta"
                value={submitState.response.partner?.accountStatus ?? "active"}
              />
              <ResultBadge
                label="Resultado"
                value={submitState.response.status ?? "created"}
              />
            </div>
          ) : null}
        </div>
      </aside>
    </section>
  );
}

function FieldControl({
  children,
  error,
}: {
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function ContractRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/40 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant="outline" className="border-primary/30 text-primary">
        {value}
      </Badge>
    </div>
  );
}

function ResultBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Badge className="bg-success/15 text-success hover:bg-success/15">
        {value}
      </Badge>
    </div>
  );
}
