import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AccessBlocked } from "@/components/auth/access-blocked";
import { AuthenticatedShell } from "@/components/shells/authenticated-shell";
import { requireShellRole, getCurrentProfile } from "@/lib/auth/next-guards";
import { partnerHasActivePlan } from "@/lib/auth/partner-plan-access";
import { createClient } from "@/lib/supabase/server";

type ParceirosLayoutProps = {
  children: ReactNode;
};

export const dynamic = "force-dynamic";

export default async function ParceirosLayout({ children }: ParceirosLayoutProps) {
  const access = await requireShellRole("parceiro");

  if (!access.allowed && access.action === "redirect") {
    redirect(access.destination);
  }

  if (!access.allowed) {
    return (
      <AccessBlocked
        title="Conta sem acesso aos Parceiros"
        description="Sua conta não está ativa ou não possui um perfil reconhecido para acessar o shell Parceiros."
      />
    );
  }

  const { profile } = await getCurrentProfile();
  if (profile?.role === "parceiro") {
    const supabase = await createClient();
    const hasActivePlan = await partnerHasActivePlan({
      profileId: profile.id,
      supabase,
    });

    if (!hasActivePlan) {
      redirect("/planos");
    }
  }

  return <AuthenticatedShell profile="parceiros">{children}</AuthenticatedShell>;
}
