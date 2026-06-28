import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AccessBlocked } from "@/components/auth/access-blocked.next";
import { AuthenticatedShell } from "@/components/shells/authenticated-shell.next";
import { requireShellRole } from "@/lib/auth/next-guards";

type AdminLayoutProps = {
  children: ReactNode;
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const access = await requireShellRole("admin");

  if (!access.allowed && access.action === "redirect") {
    redirect(access.destination);
  }

  if (!access.allowed) {
    return (
      <AccessBlocked
        title="Conta sem acesso ao Admin"
        description="Sua conta não está ativa ou não possui um perfil reconhecido para acessar o shell Admin."
      />
    );
  }

  return <AuthenticatedShell profile="admin">{children}</AuthenticatedShell>;
}
