import {
  getAdminClient,
  getStripeClient,
  jsonHeaders,
  jsonResponse,
  parsePlanSlug,
  requirePartner,
  stripeNotConfiguredResponse,
} from "../_shared/billing/stripe.ts";

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

    const body = await request.json().catch(() => ({}));
    const planSlug = parsePlanSlug(body.planSlug);
    if (!planSlug) {
      return jsonResponse(400, { error: { code: "INVALID_PLAN", message: "Plano invalido." } });
    }

    const { data: existingSubscription } = await supabase
      .from("partner_subscriptions")
      .select("id")
      .eq("partner_id", partnerAccess.partner.id)
      .in("status", ["trialing", "active", "past_due", "incomplete"])
      .maybeSingle();

    if (existingSubscription) {
      return jsonResponse(409, { error: { code: "SUBSCRIPTION_EXISTS", message: "Ja existe uma assinatura comercial para este Parceiro." } });
    }

    let customerId: string | null = null;
    const { data: lastSubscription } = await supabase
      .from("partner_subscriptions")
      .select("stripe_customer_id")
      .eq("partner_id", partnerAccess.partner.id)
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    customerId = lastSubscription?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: partnerAccess.profile.email,
        metadata: {
          partner_id: partnerAccess.partner.id,
          profile_id: partnerAccess.profile.id,
        },
        name: partnerAccess.profile.display_name,
      });
      customerId = customer.id;
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      metadata: {
        partner_id: partnerAccess.partner.id,
        plan_slug: planSlug,
      },
      payment_method_types: ["card"],
      usage: "off_session",
    }, {
      idempotencyKey: `setup-intent:${partnerAccess.partner.id}:${planSlug}`,
    });

    return jsonResponse(200, {
      clientSecret: setupIntent.client_secret,
      customerId,
      setupIntentId: setupIntent.id,
    });
  } catch (error) {
    console.error(JSON.stringify({ code: "BILLING_CREATE_SETUP_INTENT_FAILED", message: error instanceof Error ? error.message : "UNKNOWN" }));
    return jsonResponse(500, { error: { code: "SETUP_INTENT_FAILED", message: "Nao foi possivel preparar o checkout." } });
  }
});
