"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { LoginView, type LoginCredentials } from "@/components/auth/login-view";
import type { OfficialRole } from "@/lib/auth/identity-contracts";

import { loginWithPassword } from "./actions";

type NextLoginFormProps = {
  expectedRole?: OfficialRole;
  forgotPasswordHref?: string;
  initialErrorMessage?: string | null;
  primaryAuxiliaryHref?: string;
  primaryAuxiliaryLabel?: string;
  roleLabel?: string;
  next?: string;
  subtitle?: string;
  supportText?: string;
  title?: string;
};

export function NextLoginForm({
  expectedRole = "cliente",
  forgotPasswordHref = "/login/esqueci-senha",
  initialErrorMessage = null,
  primaryAuxiliaryHref = "/login/primeiro-acesso",
  primaryAuxiliaryLabel = "Primeiro acesso",
  roleLabel = "Cliente",
  next,
  subtitle = "Acesse sua área de cliente para continuar",
  supportText = "Clientes acessam somente contas ja vinculadas por um parceiro",
  title = "Login do Cliente",
}: NextLoginFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialErrorMessage,
  );
  const [isPending, startTransition] = useTransition();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(credentials: LoginCredentials) {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await loginWithPassword({
        ...credentials,
        expectedRole,
        next,
      });

      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      router.replace(result.destination);
      router.refresh();
    });
  }

  return (
    <LoginView
      loginId={loginId}
      password={password}
      isLoading={isPending}
      errorMessage={errorMessage}
      forgotPasswordHref={forgotPasswordHref}
      loginIdLabel="E-mail"
      loginIdPlaceholder="seu@email.com"
      primaryAuxiliaryHref={primaryAuxiliaryHref}
      primaryAuxiliaryLabel={primaryAuxiliaryLabel}
      roleLabel={roleLabel}
      subtitle={subtitle}
      supportText={supportText}
      title={title}
      onLoginIdChange={setLoginId}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  );
}

