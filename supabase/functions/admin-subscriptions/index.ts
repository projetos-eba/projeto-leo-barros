import { createClient } from "npm:@supabase/supabase-js@2.98.0";
import { getStripeClient } from "../_shared/billing/stripe.ts";

const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function reply(status: number, body: Record<string, unknown>) { return new Response(JSON.stringify(body), { status, headers }); }

Deno.serve(async (request) => {
  if (request.method !== "POST") return reply(405, { error: { code: "METHOD_NOT_ALLOWED" } });
  const authorization = request.headers.get("authorization"), url = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY"), serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authorization || !url || !anonKey || !serviceRoleKey) return reply(401, { error: { code: "AUTH_REQUIRED" } });
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData } = await caller.auth.getUser();
  const { data: allowed } = await caller.rpc("admin_has_capability", { p_capability: "subscription.cancel.manage" });
  const { data: actor } = await caller.from("profiles").select("id").eq("user_id", userData.user?.id ?? "").maybeSingle();
  if (!userData.user || allowed !== true || !actor) return reply(403, { error: { code: "FORBIDDEN" } });
  const body = await request.json().catch(() => null) as { action?: unknown; subscriptionId?: unknown } | null;
  const subscriptionId = typeof body?.subscriptionId === "string" ? body.subscriptionId : "";
  if ((body?.action !== "schedule_cancel" && body?.action !== "reverse_cancel") || !uuid.test(subscriptionId)) return reply(400, { error: { code: "INVALID_PAYLOAD" } });
  const stripe = getStripeClient();
  if (!stripe) return reply(503, { error: { code: "STRIPE_NOT_CONFIGURED" } });
  const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: subscription } = await admin.from("partner_subscriptions").select("id, stripe_subscription_id").eq("id", subscriptionId).maybeSingle();
  if (!subscription?.stripe_subscription_id) return reply(404, { error: { code: "SUBSCRIPTION_NOT_FOUND" } });
  const cancelling = body.action === "schedule_cancel";
  await stripe.subscriptions.update(subscription.stripe_subscription_id, { cancel_at_period_end: cancelling });
  await admin.rpc("admin_record_audit_event", { p_actor_profile_id: actor.id, p_action_key: cancelling ? "subscription.cancellation.scheduled" : "subscription.cancellation.reverted", p_resource_type: "partner_subscription", p_resource_id: subscriptionId, p_outcome: "succeeded", p_metadata: { reconciledBy: "webhook" } });
  return reply(200, { ok: true, pendingReconciliation: true });
});
