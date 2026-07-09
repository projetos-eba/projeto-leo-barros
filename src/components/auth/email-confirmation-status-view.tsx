import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AuthCardShell } from "./auth-card-shell";

type EmailConfirmationStatusViewProps = {
  message: string;
  ok: boolean;
};

export function EmailConfirmationStatusView({
  message,
  ok,
}: EmailConfirmationStatusViewProps) {
  const Icon = ok ? CheckCircle2 : AlertCircle;

  return (
    <AuthCardShell
      backHref="/"
      backLabel="Escolher perfil"
      title={ok ? "E-mail confirmado" : "Link inválido"}
      subtitle={message}
    >
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <Button asChild className="h-12 w-full">
          <Link href="/login">Ir para o login</Link>
        </Button>
      </div>
    </AuthCardShell>
  );
}
