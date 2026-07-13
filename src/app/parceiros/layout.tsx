import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { AccessBlocked } from "@/components/auth/access-blocked";
import { PartnerShellRouter } from "@/components/shells/partner-shell-router";
import { requireShellRole, getCurrentProfile } from "@/lib/auth/next-guards";
import { partnerHasActivePlan } from "@/lib/auth/partner-plan-access";
import { isBillingManagementPath, isPartnerSettingsPath } from "@/lib/billing/entitlement";
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
  let isBillingPath = false;
  let isSettingsPath = false;
  let hasActivePlan = false;

  if (profile?.role === "parceiro") {
    const headerList = await headers();
    const pathname = headerList.get("x-current-pathname") ?? "";
    isBillingPath = isBillingManagementPath(pathname);
    isSettingsPath = isPartnerSettingsPath(pathname);
    const supabase = await createClient();
    hasActivePlan = await partnerHasActivePlan({
      profileId: profile.id,
      supabase,
    });

    if (!hasActivePlan && !isBillingPath) {
      redirect("/planos");
    }
  }

  return <PartnerShellRouter hasActivePlan={hasActivePlan}>{children}</PartnerShellRouter>;
}
