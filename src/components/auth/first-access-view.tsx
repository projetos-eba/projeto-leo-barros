"use client";

import { Lock, Mail } from "lucide-react";
import { useState, useTransition } from "react";

import { requestFirstAccess } from "@/app/login/account-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AuthCardShell } from "./auth-card-shell";
import { EmailVerificationPendingView } from "./email-verification-pending-view";

export function FirstAccessView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    loginHref: string;
    message: string;
    password: string;
    profileId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (pendingVerification) {
    return (
      <EmailVerificationPendingView
        autoLogin={{
          password: pendingVerification.password,
        }}
        email={pendingVerification.email}
        loginHref={pendingVerification.loginHref}
        message={pendingVerification.message}
        profileId={pendingVerification.profileId}
        role="cliente"
        title="Senha criada"
      />
    );
  }

  return (
    <AuthCardShell
      backHref="/login"
      backLabel="Voltar para o login"
      title="Primeiro acesso"
      subtitle="Ative sua conta de Cliente já vinculada por um parceiro."
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await requestFirstAccess({
              confirmPassword,
              email,
              password,
            });

            if (result.ok) {
              const submittedPassword = password;
              setPendingVerification({
                email: result.verification?.email ?? email,
                loginHref: result.verification?.loginHref ?? "/login",
                message: result.message,
                password: submittedPassword,
                profileId: result.verification?.profileId ?? "",
              });
            } else {
              setError(result.message);
            }
          });
        }}
      >
        <Field
          icon="mail"
          id="email"
          label="E-mail"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="seu@email.com"
        />
        <Field
          icon="lock"
          id="password"
          label="Senha"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Mínimo 8 caracteres"
        />
        <Field
          icon="lock"
          id="confirmPassword"
          label="Confirmar senha"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repita a senha"
        />
        <Button type="submit" className="h-12 w-full" disabled={isPending}>
          {isPending ? "Criando senha..." : "Criar senha"}
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
  id,
  label,
  onChange,
  placeholder,
  type,
  value,
}: {
  icon: "lock" | "mail";
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
  value: string;
}) {
  const Icon = icon === "mail" ? Mail : Lock;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-12 bg-accent pl-10"
          required
        />
      </div>
    </div>
  );
}
