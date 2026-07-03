import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AccessBlocked } from "@/components/auth/access-blocked";
import { AuthenticatedShell } from "@/components/shells/authenticated-shell";
import { requireShellRole } from "@/lib/auth/next-guards";
import { fetchClientShellIdentity } from "@/lib/clients/home-data";

type ClienteLayoutProps = {
  children: ReactNode;
};

export const dynamic = "force-dynamic";

export default async function ClienteLayout({ children }: ClienteLayoutProps) {
  const access = await requireShellRole("cliente");

  if (!access.allowed && access.action === "redirect") {
    redirect(access.destination);
  }

  if (!access.allowed) {
    return (
      <AccessBlocked
        title="Conta sem acesso ao Cliente"
        description="Sua conta não está ativa ou não possui um perfil reconhecido para acessar o shell Cliente."
      />
    );
  }

  const clientIdentity = await fetchClientShellIdentity();

  return (
    <AuthenticatedShell clientIdentity={clientIdentity} profile="cliente">
      {children}
    </AuthenticatedShell>
  );
}
