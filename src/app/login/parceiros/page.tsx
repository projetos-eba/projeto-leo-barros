import { redirect } from "next/navigation";

import { resolvePostLoginDestination } from "@/lib/auth/identity-contracts";
import { partnerHasActivePlan } from "@/lib/auth/partner-plan-access";
import { createClient } from "@/lib/supabase/server";

import { NextLoginForm } from "../login-form";

export const dynamic = "force-dynamic";

export default async function PartnerLoginPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile) {
      const destination = resolvePostLoginDestination({
        role: profile.role,
        status: profile.status,
      });

      if (destination.allowed) {
        if (destination.role === "parceiro") {
          const hasActivePlan = await partnerHasActivePlan({
            profileId: profile.id,
            supabase,
          });

          redirect(hasActivePlan ? destination.destination : "/planos");
        }

        redirect(destination.destination);
      }
    }
  }

  return (
    <NextLoginForm
      expectedRole="parceiro"
      forgotPasswordHref="/login/parceiros/esqueci-senha"
      primaryAuxiliaryHref="/login/parceiros/cadastro"
      primaryAuxiliaryLabel="Não tenho cadastro"
      roleLabel="Parceiro"
      subtitle="Acesse sua área profissional para acompanhar clientes"
      supportText="Parceiros sem plano ativo serão direcionados para planos"
      title="Login do Parceiro"
    />
  );
}
