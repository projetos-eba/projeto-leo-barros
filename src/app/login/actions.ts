"use server";

import { redirect } from "next/navigation";

import { SAFE_AUTH_ERROR_MESSAGES } from "@/lib/auth/auth-errors";
import {
  type OfficialRole,
  isKnownRole,
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
    logLoginAttemptIssue("AUTH_PROVIDER_REJECTED", {
      errorCode: authError && "code" in authError ? authError.code : undefined,
      errorName: authError?.name,
      errorStatus: authError && "status" in authError ? authError.status : undefined,
      message: authError?.message,
    });

    return {
      ok: false,
      message: mapAuthProviderLoginError(authError),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email_confirmed_at, role, status")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    logLoginAttemptIssue("LOGIN_PROFILE_MISSING", {
      hasProfileError: Boolean(profileError),
    });

    return {
      ok: false,
      message: SAFE_AUTH_ERROR_MESSAGES.missingProfile,
    };
  }

  if (!isKnownRole(profile.role)) {
    await supabase.auth.signOut();
    logLoginAttemptIssue("LOGIN_ROLE_INVALID", {
      role: profile.role,
    });

    return {
      ok: false,
      message: SAFE_AUTH_ERROR_MESSAGES.invalidAccountType,
    };
  }

  const destination = resolvePostLoginDestination({
    role: profile.role,
    status: profile.status,
  });

  if (!destination.allowed) {
    await supabase.auth.signOut();
    logLoginAttemptIssue("LOGIN_ACCOUNT_NOT_ALLOWED", {
      reason: destination.reason,
      role: profile.role,
      status: profile.status,
    });

    return {
      ok: false,
      message: destination.reason === "unknown_role"
        ? SAFE_AUTH_ERROR_MESSAGES.invalidAccountType
        : SAFE_AUTH_ERROR_MESSAGES.inactiveAccount,
    };
  }

  if (destination.role !== normalized.expectedRole) {
    await supabase.auth.signOut();
    logLoginAttemptIssue("LOGIN_WRONG_AREA", {
      expectedRole: normalized.expectedRole,
      role: destination.role,
    });

    return {
      ok: false,
      message: SAFE_AUTH_ERROR_MESSAGES.wrongArea,
    };
  }

  if (
    destination.role !== "admin" &&
    !profile.email_confirmed_at
  ) {
    await supabase.auth.signOut();
    logLoginAttemptIssue("LOGIN_EMAIL_NOT_CONFIRMED", {
      role: destination.role,
    });

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

function mapAuthProviderLoginError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";

  if (
    message.includes("email not confirmed") ||
    message.includes("not confirmed") ||
    message.includes("email_not_confirmed")
  ) {
    return SAFE_AUTH_ERROR_MESSAGES.emailNotConfirmed;
  }

  return SAFE_AUTH_ERROR_MESSAGES.genericLogin;
}

function logLoginAttemptIssue(
  code: string,
  details: Record<string, unknown>,
) {
  console.error(JSON.stringify({
    code,
    ...details,
  }));
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

export async function logoutPartner() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login/parceiros");
}

export async function logoutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login/admin");
}
