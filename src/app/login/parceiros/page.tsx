import { redirect } from "next/navigation";

import { resolvePostLoginDestination } from "@/lib/auth/identity-contracts";
import { partnerHasActivePlan } from "@/lib/auth/partner-plan-access";
import { createClient } from "@/lib/supabase/server";

import { NextLoginForm } from "../login-form";

export const dynamic = "force-dynamic";

export default async function PartnerLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const requestedNext = params?.next;
  const safeNext = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : undefined;
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

          redirect(hasActivePlan ? destination.destination : safeNext ?? "/planos");
        }

        redirect(destination.destination);
      }
    }
  }

  const signupHref = safeNext
    ? `/login/parceiros/cadastro?next=${encodeURIComponent(safeNext)}`
    : "/login/parceiros/cadastro";

  return (
    <NextLoginForm
      expectedRole="parceiro"
      forgotPasswordHref="/login/parceiros/esqueci-senha"
      next={safeNext}
      primaryAuxiliaryHref={signupHref}
      primaryAuxiliaryLabel="Não tenho cadastro"
      roleLabel="Parceiro"
      subtitle="Acesse sua área profissional para acompanhar clientes"
      supportText="Parceiros sem plano ativo serão direcionados para planos"
      title="Login do Parceiro"
    />
  );
}
