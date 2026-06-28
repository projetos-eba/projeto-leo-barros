import {
  ROLE_HOME_ROUTES,
  type OfficialRole,
  resolvePostLoginDestination,
} from "./identity-contracts";

export type ProtectedShellAccessResult =
  | {
      allowed: true;
      role: OfficialRole;
    }
  | {
      allowed: false;
      action: "redirect";
      destination: string;
      reason: "wrong_role";
    }
  | {
      allowed: false;
      action: "block";
      reason: "inactive_account" | "unknown_role";
    };

export function resolveProtectedShellAccess({
  requiredRole,
  role,
  status,
}: {
  requiredRole: OfficialRole;
  role: unknown;
  status: unknown;
}): ProtectedShellAccessResult {
  const destination = resolvePostLoginDestination({ role, status });

  if (!destination.allowed) {
    return {
      allowed: false,
      action: "block",
      reason: destination.reason,
    };
  }

  if (destination.role !== requiredRole) {
    return {
      allowed: false,
      action: "redirect",
      destination: ROLE_HOME_ROUTES[destination.role],
      reason: "wrong_role",
    };
  }

  return {
    allowed: true,
    role: destination.role,
  };
}

