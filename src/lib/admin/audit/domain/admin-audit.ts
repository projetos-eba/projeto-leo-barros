export const ADMIN_AUDIT_ACTIONS = [
  "professional.created",
  "professional.status.changed",
  "admin.role.changed",
  "subscription.cancellation.scheduled",
  "subscription.cancellation.reverted",
  "security.session.revoked",
  "admin.exported",
  "admin.critical_data.viewed",
] as const;

export type AdminAuditOutcome = "attempted" | "succeeded" | "failed" | "denied";

export type AdminAuditEvent = {
  id: string;
  actionKey: string;
  resourceType: string;
  resourceId: string | null;
  targetProfileId: string | null;
  actorProfileId: string | null;
  outcome: AdminAuditOutcome;
  createdAt: string;
  metadata: Record<string, string | number | boolean | null>;
};

const blockedMetadataKeys = /(token|secret|password|cpf|clinical|snapshot)/i;

export function sanitizeAuditMetadata(value: unknown): Record<string, string | number | boolean | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      if (blockedMetadataKeys.test(key)) return [];
      if (typeof item === "string" || typeof item === "number" || typeof item === "boolean" || item === null) {
        return [[key, item]];
      }
      return [];
    }),
  );
}
