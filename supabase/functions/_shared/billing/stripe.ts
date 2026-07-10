import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.98.0";
import Stripe from "npm:stripe";

export const STRIPE_API_VERSION = "2025-06-30.basil";
export const TRIAL_DAYS = 7;
export const ACTIVE_CLIENT_UNIT_CENTS = 199;

export type BillingPlanSlug = "complete-monthly" | "complete-annual";

export const PLAN_LOOKUP_KEYS: Record<BillingPlanSlug, string> = {
  "complete-monthly": "complete_monthly_brl",
  "complete-annual": "complete_annual_brl",
};

export const ADDON_LOOKUP_KEY = "active_client_monthly_brl";

export const jsonHeaders = {
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": Deno.env.get("BILLING_ALLOWED_ORIGINS")?.split(",")[0]?.trim() || "http://localhost:3000",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

export function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: jsonHeaders,
    status,
  });
}

export function stripeNotConfiguredResponse() {
  return jsonResponse(503, {
    error: {
      code: "STRIPE_NOT_CONFIGURED",
      message: "O provedor de pagamento ainda nao esta configurado.",
    },
  });
}

export function getStripeClient() {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
  if (!secretKey) return null;

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
  });
}

export function getAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_ADMIN_NOT_CONFIGURED");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getAuthenticatedProfile(request: Request, supabase: SupabaseClient) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status, email, display_name")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  return profile;
}

export async function requirePartner(request: Request, supabase: SupabaseClient) {
  const profile = await getAuthenticatedProfile(request, supabase);
  if (!profile || profile.role !== "parceiro" || profile.status !== "active") {
    return { error: jsonResponse(403, { error: { code: "FORBIDDEN", message: "Acesso nao autorizado." } }) };
  }

  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!partner) {
    return { error: jsonResponse(403, { error: { code: "PARTNER_NOT_FOUND", message: "Parceiro nao encontrado." } }) };
  }

  return { partner, profile };
}

export async function requireAdmin(request: Request, supabase: SupabaseClient) {
  const profile = await getAuthenticatedProfile(request, supabase);
  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return { error: jsonResponse(403, { error: { code: "FORBIDDEN", message: "Acesso nao autorizado." } }) };
  }

  return { profile };
}

export function parsePlanSlug(value: unknown): BillingPlanSlug | null {
  return value === "complete-monthly" || value === "complete-annual" ? value : null;
}

export async function activeClientCount(supabase: SupabaseClient, partnerId: string) {
  const { data, error } = await supabase.rpc("billing_active_client_count", {
    target_partner_id: partnerId,
  });
  if (error) throw error;
  return typeof data === "number" ? data : 0;
}

export async function resolvePriceByLookupKey(stripe: Stripe, lookupKey: string) {
  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
    limit: 1,
    lookup_keys: [lookupKey],
  });
  return prices.data[0] ?? null;
}
