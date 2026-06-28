import { redirect } from "next/navigation";

import { resolvePostLoginDestination } from "@/lib/auth/identity-contracts";
import { createClient } from "@/lib/supabase/server";

import { NextLoginForm } from "./login-form.next";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const safeErrorMessages: Record<string, string> = {
  profile_unavailable: "Conta autenticada, mas sem perfil ativo configurado.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
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

  const params = await searchParams;
  const initialErrorMessage = params?.error
    ? safeErrorMessages[params.error] ?? null
    : null;

  return <NextLoginForm initialErrorMessage={initialErrorMessage} />;
}

