import { createClient } from "@/lib/supabase/server";

import { sanitizeAuditMetadata, type AdminAuditEvent, type AdminAuditOutcome } from "../domain/admin-audit";

type AuditRow = { id: string; action_key: string; resource_type: string; resource_id: string | null; target_profile_id: string | null; actor_profile_id: string | null; outcome: AdminAuditOutcome; created_at: string; metadata: unknown };
type AuditQuery = PromiseLike<{ data: AuditRow[] | null; error: { message: string } | null }> & { order(column: string, options?: { ascending?: boolean }): AuditQuery; limit(value: number): AuditQuery };
type AuditClient = { from(table: string): { select(columns: string): AuditQuery } };

export async function fetchAdminAuditEvents(limit = 100): Promise<AdminAuditEvent[]> {
  const supabase = (await createClient()) as unknown as AuditClient;
  const { data, error } = await supabase.from("admin_audit_events").select("id, action_key, resource_type, resource_id, target_profile_id, actor_profile_id, outcome, created_at, metadata").order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`Falha ao carregar auditoria: ${error.message}`);
  return (data ?? []).map((row) => ({ id: row.id, actionKey: row.action_key, resourceType: row.resource_type, resourceId: row.resource_id, targetProfileId: row.target_profile_id, actorProfileId: row.actor_profile_id, outcome: row.outcome, createdAt: row.created_at, metadata: sanitizeAuditMetadata(row.metadata) }));
}
