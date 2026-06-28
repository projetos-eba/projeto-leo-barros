"use server";

import { normalizeEmailPasswordLogin } from "@/lib/auth/login-contracts";
import { resolvePostLoginDestination } from "@/lib/auth/identity-contracts";
import { createClient } from "@/lib/supabase/server";

export type LoginActionResult =
  | {
      ok: true;
      destination: string;
    }
  | {
      ok: false;
      message: string;
    };

export async function loginWithPassword(credentials: {
  loginId: string;
  password: string;
}): Promise<LoginActionResult> {
  const normalized = normalizeEmailPasswordLogin(credentials);

  if (!normalized.ok) {
    return normalized;
  }

  const supabase = await createClient();
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: normalized.email,
      password: normalized.password,
    });

  if (authError || !authData.user) {
    return {
      ok: false,
      message: "E-mail ou senha inválidos.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();

    return {
      ok: false,
      message: "Conta autenticada, mas sem perfil ativo configurado.",
    };
  }

  const destination = resolvePostLoginDestination({
    role: profile.role,
    status: profile.status,
  });

  if (!destination.allowed) {
    await supabase.auth.signOut();

    return {
      ok: false,
      message: "Conta indisponível para acesso neste momento.",
    };
  }

  return {
    ok: true,
    destination: destination.destination,
  };
}

