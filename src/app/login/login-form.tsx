"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { LoginView, type LoginCredentials } from "@/components/auth/login-view";

import { loginWithPassword } from "./actions";

type NextLoginFormProps = {
  initialErrorMessage?: string | null;
};

export function NextLoginForm({
  initialErrorMessage = null,
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
      const result = await loginWithPassword(credentials);

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
      loginIdLabel="E-mail"
      loginIdPlaceholder="seu@email.com"
      supportText="Acesso local por e-mail e senha"
      onLoginIdChange={setLoginId}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  );
}

