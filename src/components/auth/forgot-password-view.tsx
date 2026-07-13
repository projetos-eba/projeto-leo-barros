"use client";

import { Mail } from "lucide-react";
import { useState, useTransition } from "react";

import { requestPasswordReset } from "@/app/login/account-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OfficialRole } from "@/lib/auth/identity-contracts";

import { AuthCardShell } from "./auth-card-shell";

type ForgotPasswordViewProps = {
  backHref: string;
  expectedRole: OfficialRole;
  roleLabel: string;
};

export function ForgotPasswordView({
  backHref,
  expectedRole,
  roleLabel,
}: ForgotPasswordViewProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <AuthCardShell
      backHref={backHref}
      backLabel="Voltar para o login"
      title={`Esqueceu a senha?`}
      subtitle={`Informe o e-mail do acesso ${roleLabel}.`}
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setMessage(null);
          startTransition(async () => {
            const result = await requestPasswordReset({
              email,
              expectedRole,
            });

            if (result.ok) {
              setMessage(result.message);
            } else {
              setError(result.message);
            }
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              className="h-12 bg-accent pl-10"
              required
            />
          </div>
        </div>
        <Button type="submit" className="h-12 w-full" disabled={isPending}>
          {isPending ? "Enviando..." : "Enviar instruções"}
        </Button>
        {message ? (
          <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            {message}
          </p>
        ) : null}
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
