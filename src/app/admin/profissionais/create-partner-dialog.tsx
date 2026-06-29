"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Plus } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

type CreatePartnerFields = {
  displayName: string;
  email: string;
  phone: string;
  professionalType: ProfessionalType | "";
};

type FieldErrors = Partial<Record<keyof CreatePartnerFields, string>>;

type ProvisionPartnerResponse = {
  error?: {
    code?: string;
    fields?: Record<string, string>;
    message?: string;
  };
  status?: string;
};

type SubmitState =
  | { kind: "success"; message: string; title: string }
  | { kind: "error"; message: string; title: string };

const initialFields: CreatePartnerFields = {
  displayName: "",
  email: "",
  phone: "",
  professionalType: "",
};

const professionalTypeLabels: Record<ProfessionalType, string> = {
  medico: "Medicina",
  nutricionista: "Nutrição",
  personal_trainer: "Educação Física",
};

function normalizeFields(fields: CreatePartnerFields) {
  return {
    displayName: fields.displayName.trim(),
    email: fields.email.trim().toLowerCase(),
    phone: fields.phone.trim(),
    professionalType: fields.professionalType,
  };
}

function validateFields(fields: CreatePartnerFields): FieldErrors {
  const normalized = normalizeFields(fields);
  const errors: FieldErrors = {};

  if (!normalized.displayName) errors.displayName = "Informe o nome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) errors.email = "Informe um e-mail válido.";
  if (!/^\+[1-9][0-9]{7,14}$/.test(normalized.phone)) errors.phone = "Use o telefone com DDI, como +5511999999999.";
  if (!normalized.professionalType) errors.professionalType = "Selecione o tipo profissional.";

  return errors;
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "10000000-0000-4000-8000-000000000000".replace(/[018]/g, (char) =>
    (
      Number(char) ^
      ((Math.random() * 16) >> (Number(char) / 4))
    ).toString(16),
  );
}

function mapFunctionError(code?: string) {
  const messages: Record<string, string> = {
    AUTH_REQUIRED: "Sua sessão expirou. Entre novamente para continuar.",
    EMAIL_ROLE_CONFLICT: "Este e-mail já pertence a outro perfil.",
    FORBIDDEN: "Sua conta não possui permissão para criar parceiros.",
    IDEMPOTENCY_KEY_REUSED: "Esta tentativa já foi registrada com outros dados.",
    IDENTITY_RECONCILIATION_REQUIRED: "Esta identidade precisa de regularização antes do cadastro.",
    INVALID_PAYLOAD: "Revise os campos do formulário.",
    PARTNER_DATA_CONFLICT: "Já existe um parceiro com dados diferentes para este e-mail.",
  };

  return messages[code ?? ""] ?? "Não foi possível concluir o cadastro agora.";
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

export function CreatePartnerDialog() {
  const router = useRouter();
  const [fields, setFields] = useState<CreatePartnerFields>(initialFields);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState | null>(null);

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
        message: "Revise os campos destacados antes de continuar.",
        title: "Dados incompletos",
      });
      return;
    }

    const normalized = normalizeFields(fields);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error } =
        await supabase.functions.invoke<ProvisionPartnerResponse>(
          "provision-partner",
          {
            body: {
              displayName: normalized.displayName,
              email: normalized.email,
              idempotencyKey: createIdempotencyKey(),
              phone: normalized.phone,
              professionalType: normalized.professionalType,
            },
          },
        );

      if (error) {
        setSubmitState({
          kind: "error",
          message: await readFunctionError(error),
          title: "Cadastro não concluído",
        });
        return;
      }

      const alreadyExists = data?.status === "existing";
      setSubmitState({
        kind: "success",
        message: alreadyExists
        ? "Encontramos um parceiro compatível e mantivemos o cadastro atual."
          : "O parceiro foi cadastrado e já pode ser acompanhado pela gestão da plataforma.",
        title: alreadyExists ? "Parceiro já cadastrado" : "Parceiro cadastrado",
      });
      setFields(initialFields);
      router.refresh();
    } catch {
      setSubmitState({
        kind: "error",
        message: "Não foi possível concluir o cadastro agora.",
        title: "Falha inesperada",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-[52px] rounded-[8px] bg-[#238eff] px-5 text-[15px] font-semibold text-[#f8fbff] hover:bg-[#1d7de0]">
          <Plus className="size-4" />
          Novo parceiro
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[#2b4a5d] bg-[#0d2635] text-[#f4f7fa] sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Novo parceiro</DialogTitle>
          <DialogDescription className="text-[#9eb0bd]">
            Cadastre os dados principais do profissional para ativar a gestão da conta.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldControl error={fieldErrors.displayName}>
              <Label htmlFor="displayName">Nome</Label>
              <Input
                id="displayName"
                autoComplete="name"
                className="h-11 border-[#2b4a5d] bg-[#071a25]"
                placeholder="Marina Alves"
                value={fields.displayName}
                onChange={(event) => updateField("displayName", event.target.value)}
              />
            </FieldControl>

            <FieldControl error={fieldErrors.email}>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                autoComplete="email"
                className="h-11 border-[#2b4a5d] bg-[#071a25]"
                placeholder="marina@example.invalid"
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
                className="h-11 border-[#2b4a5d] bg-[#071a25]"
                placeholder="+5511999999999"
                value={fields.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </FieldControl>

            <FieldControl error={fieldErrors.professionalType}>
              <Label htmlFor="professionalType">Tipo profissional</Label>
              <Select
                value={fields.professionalType}
                onValueChange={(value: ProfessionalType) => updateField("professionalType", value)}
              >
                <SelectTrigger id="professionalType" className="h-11 border-[#2b4a5d] bg-[#071a25]">
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
          </div>

          {submitState ? (
            <div
              className={
                submitState.kind === "success"
                  ? "rounded-[8px] border border-[#1f7a46]/70 bg-[#0f3525]/60 p-4"
                  : "rounded-[8px] border border-[#9d3b3b]/70 bg-[#401b20]/60 p-4"
              }
              role={submitState.kind === "error" ? "alert" : "status"}
            >
              <div className="flex items-start gap-3">
                {submitState.kind === "success" ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#67d982]" />
                ) : (
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-[#ffb4a8]" />
                )}
                <div>
                  <p className="font-semibold text-[#f2f7fa]">{submitState.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#b8c7d1]">{submitState.message}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button
              className="h-11 rounded-[8px] bg-[#238eff] px-5 font-semibold hover:bg-[#1d7de0]"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Cadastrar parceiro
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldControl({ children, error }: { children: ReactNode; error?: string }) {
  return (
    <div className="space-y-2">
      {children}
      {error ? <p className="text-xs font-medium text-[#ffb4a8]">{error}</p> : null}
    </div>
  );
}
