export const ADMIN_ROLES = ["owner", "operator", "viewer"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_CAPABILITIES = [
  "dashboard.read",
  "professional.read",
  "professional.status.write",
  "client.read",
  "finance.read",
  "support.read",
  "support.write",
  "permissions.manage",
  "settings.manage",
  "audit.read",
  "security.read",
  "security.sessions.revoke",
  "subscription.cancel.manage",
] as const;

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];

const operatorCapabilities = new Set<AdminCapability>([
  "dashboard.read",
  "professional.read",
  "professional.status.write",
  "client.read",
  "finance.read",
  "support.read",
  "support.write",
]);

const viewerCapabilities = new Set<AdminCapability>([
  "dashboard.read",
  "professional.read",
  "client.read",
  "finance.read",
  "support.read",
]);

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && ADMIN_ROLES.includes(value as AdminRole);
}

export function roleHasCapability(role: AdminRole | null, capability: AdminCapability) {
  if (role === "owner") return true;
  if (role === "operator") return operatorCapabilities.has(capability);
  return role === "viewer" && viewerCapabilities.has(capability);
}
