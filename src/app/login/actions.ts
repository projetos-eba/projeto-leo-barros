"use server";

import { redirect } from "next/navigation";

import { SAFE_AUTH_ERROR_MESSAGES } from "@/lib/auth/auth-errors";
import {
  type OfficialRole,
  resolvePostLoginDestination,
} from "@/lib/auth/identity-contracts";
import { normalizeEmailPasswordLogin } from "@/lib/auth/login-contracts";
import { partnerHasActivePlan } from "@/lib/auth/partner-plan-access";
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
  expectedRole?: OfficialRole;
  loginId: string;
  next?: string;
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
      message: SAFE_AUTH_ERROR_MESSAGES.genericLogin,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email_confirmed_at, role, status")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();

    return {
      ok: false,
      message: SAFE_AUTH_ERROR_MESSAGES.missingProfile,
    };
  }

  if (profile.role !== normalized.expectedRole) {
    await supabase.auth.signOut();

    return {
      ok: false,
      message: SAFE_AUTH_ERROR_MESSAGES.wrongArea,
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
      message: SAFE_AUTH_ERROR_MESSAGES.inactiveAccount,
    };
  }

  if (
    destination.role !== "admin" &&
    !profile.email_confirmed_at
  ) {
    await supabase.auth.signOut();

    return {
      ok: false,
      message: SAFE_AUTH_ERROR_MESSAGES.emailNotConfirmed,
    };
  }

  if (destination.role === "parceiro") {
    const hasActivePlan = await partnerHasActivePlan({
      profileId: profile.id,
      supabase,
    });

    return {
      ok: true,
      destination: hasActivePlan
        ? safePostLoginPath(credentials.next, destination.destination)
        : safePostLoginPath(credentials.next, "/planos"),
    };
  }

  return {
    ok: true,
    destination: destination.destination,
  };
}

function safePostLoginPath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (value.startsWith("/parceiros/checkout") || value.startsWith("/parceiros/configuracoes/assinatura")) {
    return value;
  }

  return fallback;
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
