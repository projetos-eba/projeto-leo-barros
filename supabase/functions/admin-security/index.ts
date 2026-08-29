import { createClient } from "npm:@supabase/supabase-js@2.98.0";

const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function reply(status: number, body: Record<string, unknown>) { return new Response(JSON.stringify(body), { status, headers }); }

Deno.serve(async (request) => {
  if (request.method !== "POST") return reply(405, { error: { code: "METHOD_NOT_ALLOWED" } });
  const authorization = request.headers.get("authorization");
  const url = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY"), serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authorization || !url || !anonKey || !serviceRoleKey) return reply(401, { error: { code: "AUTH_REQUIRED" } });
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData } = await caller.auth.getUser();
  const { data: allowed } = await caller.rpc("admin_has_capability", { p_capability: "security.sessions.revoke" });
  const { data: actor } = await caller.from("profiles").select("id").eq("user_id", userData.user?.id ?? "").maybeSingle();
  if (!userData.user || allowed !== true || !actor) return reply(403, { error: { code: "FORBIDDEN" } });
  const body = await request.json().catch(() => null) as { action?: unknown; targetProfileId?: unknown } | null;
  const targetProfileId = typeof body?.targetProfileId === "string" ? body.targetProfileId : "";
  if (body?.action !== "revoke_global_session" || !uuid.test(targetProfileId)) return reply(400, { error: { code: "INVALID_PAYLOAD" } });
  const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: target } = await admin.from("profiles").select("id, user_id").eq("id", targetProfileId).maybeSingle();
  if (!target) return reply(404, { error: { code: "NOT_FOUND" } });
  const { error } = await admin.auth.admin.signOut(target.user_id, "global");
  if (error) return reply(500, { error: { code: "REVOCATION_FAILED" } });
  await admin.rpc("admin_record_audit_event", { p_actor_profile_id: actor.id, p_action_key: "security.session.revoked", p_resource_type: "auth_session", p_target_profile_id: targetProfileId, p_outcome: "succeeded", p_metadata: { scope: "global" } });
  return reply(200, { ok: true });
});
