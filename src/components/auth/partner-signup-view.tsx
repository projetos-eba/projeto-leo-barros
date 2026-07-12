"use client";

import { Lock, Mail, Phone, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import { signupPartner } from "@/app/login/account-actions";
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
import type {
  PartnerSignupFieldErrors,
  PartnerSignupInput,
} from "@/lib/auth/partner-signup-contracts";
import type { OfficialRole } from "@/lib/auth/identity-contracts";

import { AuthCardShell } from "./auth-card-shell";
import { EmailVerificationPendingView } from "./email-verification-pending-view";

type PendingVerification = {
  email: string;
  loginHref: string;
  message: string;
  password: string;
  profileId: string;
  role: Exclude<OfficialRole, "admin">;
};

type PartnerSignupViewProps = {
  next?: string;
};

export function PartnerSignupView({ next }: PartnerSignupViewProps) {
  const [form, setForm] = useState<PartnerSignupInput>({
    confirmPassword: "",
    displayName: "",
    email: "",
    password: "",
    phone: "",
    professionalRegistryNumber: "",
    professionalRegistryType: "",
    professionalType: "personal_trainer",
  });
  const [pendingVerification, setPendingVerification] =
    useState<PendingVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<PartnerSignupFieldErrors>({});
  const [isPending, startTransition] = useTransition();

  if (pendingVerification) {
    return (
      <EmailVerificationPendingView
        autoLogin={{
          next,
          password: pendingVerification.password,
        }}
        email={pendingVerification.email}
        loginHref={pendingVerification.loginHref}
        message={pendingVerification.message}
        profileId={pendingVerification.profileId}
        role={pendingVerification.role}
        title="Cadastro recebido"
      />
    );
  }

  function update<K extends keyof PartnerSignupInput>(
    key: K,
    value: PartnerSignupInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  return (
    <AuthCardShell
      backHref="/login/parceiros"
      backLabel="Voltar para o login"
      title="Cadastro de Parceiro"
      subtitle="Crie sua conta profissional. Depois da confirmação, você será direcionado para planos se ainda não houver assinatura ativa."
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setFieldErrors({});
          startTransition(async () => {
            const result = await signupPartner(form);

            if (result.ok) {
              const submittedPassword = form.password;
              setPendingVerification({
                email: result.verification?.email ?? form.email,
                loginHref: result.verification?.loginHref ?? "/login/parceiros",
                message: result.message,
                password: submittedPassword,
                profileId: result.verification?.profileId ?? "",
                role: "parceiro",
              });
            } else {
              setError(result.message);
              setFieldErrors(result.fieldErrors ?? {});
            }
          });
        }}
      >
        <Field
          icon={<UserRound className="h-4 w-4" />}
          id="displayName"
          label="Nome"
          value={form.displayName}
          error={fieldErrors.displayName}
          onChange={(value) => update("displayName", value)}
          placeholder="Seu nome completo"
        />
        <Field
          icon={<Mail className="h-4 w-4" />}
          id="email"
          label="E-mail"
          type="email"
          value={form.email}
          error={fieldErrors.email}
          onChange={(value) => update("email", value)}
          placeholder="seu@email.com"
        />
        <Field
          icon={<Phone className="h-4 w-4" />}
          id="phone"
          label="Telefone"
          value={form.phone}
          error={fieldErrors.phone}
          onChange={(value) => update("phone", value)}
          placeholder="+5511999999999"
        />

        <div className="space-y-2">
          <Label htmlFor="professionalType">Tipo profissional</Label>
          <Select
            value={form.professionalType}
            onValueChange={(value) =>
              update(
                "professionalType",
                value as PartnerSignupInput["professionalType"],
              )
            }
          >
            <SelectTrigger
              aria-describedby={fieldErrors.professionalType ? "professionalType-error" : undefined}
              aria-invalid={Boolean(fieldErrors.professionalType)}
              className="h-12 bg-accent"
              id="professionalType"
            >
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal_trainer">Personal trainer</SelectItem>
              <SelectItem value="nutricionista">Nutricionista</SelectItem>
              <SelectItem value="medico">Médico</SelectItem>
            </SelectContent>
          </Select>
          {fieldErrors.professionalType ? (
            <p className="text-sm text-destructive" id="professionalType-error">
              {fieldErrors.professionalType}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="professionalRegistryType"
            label="Tipo do registro"
            value={form.professionalRegistryType ?? ""}
            error={fieldErrors.professionalRegistryType}
            onChange={(value) => update("professionalRegistryType", value)}
            placeholder="CREF, CRN, CRM"
          />
          <Field
            id="professionalRegistryNumber"
            label="Número do registro"
            value={form.professionalRegistryNumber ?? ""}
            error={fieldErrors.professionalRegistryNumber}
            onChange={(value) => update("professionalRegistryNumber", value)}
            placeholder="Opcional"
          />
        </div>

        <Field
          icon={<Lock className="h-4 w-4" />}
          id="password"
          label="Senha"
          type="password"
          value={form.password}
          error={fieldErrors.password}
          onChange={(value) => update("password", value)}
          placeholder="Mínimo 8 caracteres"
        />
        <Field
          icon={<Lock className="h-4 w-4" />}
          id="confirmPassword"
          label="Confirmar senha"
          type="password"
          value={form.confirmPassword}
          error={fieldErrors.confirmPassword}
          onChange={(value) => update("confirmPassword", value)}
          placeholder="Repita a senha"
        />
        <Button type="submit" className="h-12 w-full" disabled={isPending}>
          {isPending ? "Enviando..." : "Criar cadastro"}
        </Button>
        {error ? (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </form>
    </AuthCardShell>
  );
}

function Field({
  icon,
  error,
  id,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  icon?: ReactNode;
  error?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value: string;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {icon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <Input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={icon ? "h-12 bg-accent pl-10" : "h-12 bg-accent"}
          required={
            id !== "professionalRegistryType" &&
            id !== "professionalRegistryNumber"
          }
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
