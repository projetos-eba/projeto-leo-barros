import { createClient } from "@/lib/supabase/server";

export type SanitizedSecurityRow = Record<string, unknown>;
type SecurityClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: SanitizedSecurityRow[] | null; error: { message: string } | null }> };

export async function fetchAdminSecurityData(targetProfileId?: string) {
  const supabase = (await createClient()) as unknown as SecurityClient;
  const [sessions, events] = await Promise.all([
    supabase.rpc("admin_security_sessions", { p_target_profile_id: targetProfileId ?? null, p_limit: 100 }),
    supabase.rpc("admin_security_auth_events", { p_target_profile_id: targetProfileId ?? null, p_limit: 200 }),
  ]);
  if (sessions.error || events.error) throw new Error("Falha ao carregar dados de segurança.");
  return { sessions: sessions.data ?? [], events: events.data ?? [] };
}
