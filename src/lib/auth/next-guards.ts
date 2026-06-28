import type { OfficialRole } from "./identity-contracts";
import {
  type ProtectedShellAccessResult,
  resolveProtectedShellAccess,
} from "./next-access-control";
import { createClient } from "@/lib/supabase/server";

type ShellGuardResult =
  | ProtectedShellAccessResult
  | {
      allowed: false;
      action: "redirect";
      destination: string;
      reason: "missing_session" | "missing_profile";
    };

const LOGIN_ROUTE = "/login";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return {
      profile: null,
      reason: "missing_session" as const,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      profile: null,
      reason: "missing_profile" as const,
    };
  }

  return {
    profile,
    reason: null,
  };
}

export async function requireShellRole(
  requiredRole: OfficialRole,
): Promise<ShellGuardResult> {
  const { profile, reason } = await getCurrentProfile();

  if (!profile) {
    return {
      allowed: false,
      action: "redirect",
      destination:
        reason === "missing_profile"
          ? `${LOGIN_ROUTE}?error=profile_unavailable`
          : LOGIN_ROUTE,
      reason,
    };
  }

  return resolveProtectedShellAccess({
    requiredRole,
    role: profile.role,
    status: profile.status,
  });
}

