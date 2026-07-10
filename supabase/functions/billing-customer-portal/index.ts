import {
  getAdminClient,
  getStripeClient,
  jsonHeaders,
  jsonResponse,
  requirePartner,
  stripeNotConfiguredResponse,
} from "../_shared/billing/stripe.ts";
import { buildAppUrl } from "../_shared/env.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: jsonHeaders, status: 204 });
  if (request.method !== "POST") {
    return jsonResponse(405, { error: { code: "METHOD_NOT_ALLOWED", message: "Metodo nao permitido." } });
  }

  const stripe = getStripeClient();
  if (!stripe) return stripeNotConfiguredResponse();

  try {
    const supabase = getAdminClient();
    const partnerAccess = await requirePartner(request, supabase);
    if ("error" in partnerAccess) return partnerAccess.error as Response;

    const { data: subscription } = await supabase
      .from("partner_subscriptions")
      .select("stripe_customer_id")
      .eq("partner_id", partnerAccess.partner.id)
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription?.stripe_customer_id) {
      return jsonResponse(404, { error: { code: "CUSTOMER_NOT_FOUND", message: "Customer Stripe nao encontrado." } });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: buildAppUrl("/parceiros/configuracoes/assinatura", {}),
    });

    return jsonResponse(200, { url: portalSession.url });
  } catch (error) {
    console.error(JSON.stringify({ code: "BILLING_CUSTOMER_PORTAL_FAILED", message: error instanceof Error ? error.message : "UNKNOWN" }));
    return jsonResponse(500, { error: { code: "PORTAL_FAILED", message: "Nao foi possivel abrir o portal de cobranca." } });
  }
});
