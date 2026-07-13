/**
 * Contratos conceituais da Fase 4.2.
 *
 * Estes tipos e funções puras preparam a futura autenticação no Next.js,
 * mas ainda não estão conectados ao runtime, ao Supabase, a guards ou a rotas.
 */

export const OFFICIAL_ROLES = ["cliente", "parceiro", "admin"] as const;

export type OfficialRole = (typeof OFFICIAL_ROLES)[number];

export const ACCOUNT_STATUSES = [
  "pending",
  "active",
  "suspended",
  "disabled",
] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const FUTURE_LOGIN_ROUTE = "/login" as const;

export const ROLE_LOGIN_ROUTES: Record<OfficialRole, string> = {
  cliente: "/login",
  parceiro: "/login/parceiros",
  admin: "/login/admin",
} as const;

export const ROLE_HOME_ROUTES: Record<OfficialRole, string> = {
  cliente: "/cliente/inicio",
  parceiro: "/parceiros/dashboard",
  admin: "/admin/dashboard",
} as const;

export type PostLoginDestinationResult =
  | {
      allowed: true;
      role: OfficialRole;
      destination: (typeof ROLE_HOME_ROUTES)[OfficialRole];
    }
  | {
      allowed: false;
      destination: null;
      reason: "unknown_role" | "inactive_account";
    };

export function isKnownRole(role: unknown): role is OfficialRole {
  return (
    typeof role === "string" &&
    OFFICIAL_ROLES.includes(role as OfficialRole)
  );
}

export function getLoginRouteByRole(role: unknown): string {
  return isKnownRole(role) ? ROLE_LOGIN_ROUTES[role] : ROLE_LOGIN_ROUTES.cliente;
}

export function isActiveAccountStatus(
  status: unknown,
): status is Extract<AccountStatus, "active"> {
  return status === "active";
}

export function resolvePostLoginDestination({
  role,
  status,
}: {
  role: unknown;
  status: unknown;
}): PostLoginDestinationResult {
  if (!isKnownRole(role)) {
    return {
      allowed: false,
      destination: null,
      reason: "unknown_role",
    };
  }

  if (!isActiveAccountStatus(status)) {
    return {
      allowed: false,
      destination: null,
      reason: "inactive_account",
    };
  }

  return {
    allowed: true,
    role,
    destination: ROLE_HOME_ROUTES[role],
  };
}
