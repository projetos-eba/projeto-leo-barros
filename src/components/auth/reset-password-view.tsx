"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import {
  updatePasswordWithToken,
  verifyPasswordResetToken,
} from "@/app/login/account-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AuthCardShell } from "./auth-card-shell";

type ResetPasswordViewProps = {
  token: string | null;
};

export function ResetPasswordView({ token }: ResetPasswordViewProps) {
  const [resetSessionId, setResetSessionId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Validando link de recuperação...");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("Link invalido ou expirado.");
        return;
      }

      const result = await verifyPasswordResetToken(token);
      if (cancelled) return;

      if (!result.ok) {
        setStatus("error");
        setMessage(result.message);
        return;
      }

      setResetSessionId(result.resetSessionId);
      setStatus("ready");
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "loading" || status === "error" || status === "success") {
    const Icon = status === "success" ? CheckCircle2 : AlertCircle;

    return (
      <AuthCardShell
        backHref="/"
        backLabel="Escolher perfil"
        title={
          status === "success"
            ? "Senha redefinida"
            : status === "error"
              ? "Link inválido"
              : "Validando link"
        }
        subtitle={message}
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          {status === "success" ? (
            <Button asChild className="h-12 w-full">
              <Link href="/login">Ir para o login</Link>
            </Button>
          ) : null}
        </div>
      </AuthCardShell>
    );
  }

  return (
    <AuthCardShell
      backHref="/"
      backLabel="Escolher perfil"
      title="Criar nova senha"
      subtitle="Digite e confirme sua nova senha."
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!resetSessionId) return;

          startTransition(async () => {
            const result = await updatePasswordWithToken({
              confirmPassword,
              password,
              resetSessionId,
            });

            if (result.ok) {
              setStatus("success");
              setMessage(result.message);
            } else {
              setMessage(result.message);
            }
          });
        }}
      >
        <PasswordField
          id="password"
          label="Nova senha"
          value={password}
          onChange={setPassword}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirmar nova senha"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
        <Button type="submit" className="h-12 w-full" disabled={isPending}>
          {isPending ? "Redefinindo..." : "Redefinir senha"}
        </Button>
        {message && message !== "Validando link de recuperação..." ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {message}
          </p>
        ) : null}
      </form>
    </AuthCardShell>
  );
}

function PasswordField({
  id,
  label,
  onChange,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type="password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Mínimo 8 caracteres"
          className="h-12 bg-accent pl-10"
          required
        />
      </div>
    </div>
  );
}
