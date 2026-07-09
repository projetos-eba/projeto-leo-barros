import { redirect } from "next/navigation";

import { resolvePostLoginDestination } from "@/lib/auth/identity-contracts";
import { createClient } from "@/lib/supabase/server";

import { NextLoginForm } from "../login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile) {
      const destination = resolvePostLoginDestination({
        role: profile.role,
        status: profile.status,
      });

      if (destination.allowed) {
        redirect(destination.destination);
      }
    }
  }

  return (
    <NextLoginForm
      expectedRole="admin"
      forgotPasswordHref="/login/admin/esqueci-senha"
      primaryAuxiliaryHref={undefined}
      primaryAuxiliaryLabel={undefined}
      roleLabel="Administrador"
      subtitle="Acesso restrito à gestão da plataforma"
      supportText="Administradores são provisionados pela operação"
      title="Login Admin"
    />
  );
}
