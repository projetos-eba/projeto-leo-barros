import { createClient } from "@/lib/supabase/server";

import { sanitizeAuditMetadata, type AdminAuditOutcome } from "../domain/admin-audit";

type AuditInput = {
  actorProfileId: string;
  actionKey: string;
  resourceType: string;
  resourceId?: string | null;
  targetProfileId?: string | null;
  outcome?: AdminAuditOutcome;
  requestId?: string | null;
  metadata?: unknown;
};

/** Server-only gateway. Browser code never writes audit events directly. */
export async function recordAdminAuditEvent(input: AuditInput) {
  const supabase = await createClient();
  const client = supabase as unknown as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: string | null; error: { message: string } | null }>;
  };

  const { data, error } = await client.rpc("admin_record_audit_event", {
    p_actor_profile_id: input.actorProfileId,
    p_action_key: input.actionKey,
    p_resource_type: input.resourceType,
    p_resource_id: input.resourceId ?? null,
    p_target_profile_id: input.targetProfileId ?? null,
    p_outcome: input.outcome ?? "succeeded",
    p_request_id: input.requestId ?? null,
    p_metadata: sanitizeAuditMetadata(input.metadata),
  });

  if (error) throw new Error(`Falha ao registrar auditoria: ${error.message}`);
  return data;
}
