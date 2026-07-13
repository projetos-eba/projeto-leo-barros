import {
  forbiddenOriginResponse,
  getAdminClient,
  getStripeClient,
  jsonResponse,
  optionsResponse,
  originIsAllowed,
  parsePlanSlug,
  requirePartner,
  resolvePartnerStripeCustomer,
  stripeNotConfiguredResponse,
} from "../_shared/billing/stripe.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return optionsResponse(request);
  if (request.method !== "POST") {
    return jsonResponse(405, {
      error: { code: "METHOD_NOT_ALLOWED", message: "Metodo nao permitido." },
    }, request);
  }
  if (!originIsAllowed(request)) return forbiddenOriginResponse(request);

  const stripe = getStripeClient();
  if (!stripe) return stripeNotConfiguredResponse();

  try {
    const supabase = getAdminClient();
    const partnerAccess = await requirePartner(request, supabase);
    if ("error" in partnerAccess) return partnerAccess.error as Response;

    const body = await request.json().catch(() => ({}));
    const planSlug = parsePlanSlug(body.planSlug);
    if (!planSlug) {
      return jsonResponse(400, {
        error: { code: "INVALID_PLAN", message: "Plano invalido." },
      }, request);
    }
    const bodyCheckoutAttemptId = typeof body.checkoutAttemptId === "string"
      ? body.checkoutAttemptId.trim()
      : "";
    const checkoutAttemptId = /^[A-Za-z0-9_-]{8,80}$/.test(bodyCheckoutAttemptId)
      ? bodyCheckoutAttemptId
      : crypto.randomUUID();

    const { data: existingSubscription } = await supabase
      .from("partner_subscriptions")
      .select("id")
      .eq("partner_id", partnerAccess.partner.id)
      .in("status", ["trialing", "active", "past_due", "incomplete"])
      .maybeSingle();

    if (existingSubscription) {
      return jsonResponse(409, {
        error: {
          code: "SUBSCRIPTION_EXISTS",
          message: "Ja existe uma assinatura comercial para este Parceiro.",
        },
      }, request);
    }

    const customerId = await resolvePartnerStripeCustomer(
      stripe,
      partnerAccess,
    );

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      metadata: {
        checkout_attempt_id: checkoutAttemptId,
        partner_id: partnerAccess.partner.id,
        plan_slug: planSlug,
      },
      usage: "off_session",
    }, {
      idempotencyKey:
        `setup-intent:${partnerAccess.partner.id}:${planSlug}:${checkoutAttemptId}`,
    });

    return jsonResponse(200, {
      clientSecret: setupIntent.client_secret,
      customerId,
      setupIntentId: setupIntent.id,
    }, request);
  } catch (error) {
    console.error(
      JSON.stringify({
        code: "BILLING_CREATE_SETUP_INTENT_FAILED",
        message: error instanceof Error ? error.message : "UNKNOWN",
      }),
    );
    return jsonResponse(500, {
      error: {
        code: "SETUP_INTENT_FAILED",
        message: "Nao foi possivel preparar o checkout.",
      },
    }, request);
  }
});
