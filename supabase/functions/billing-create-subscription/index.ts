import {
  activeClientCount,
  ACTIVE_CLIENT_UNIT_CENTS,
  ADDON_LOOKUP_KEY,
  forbiddenOriginResponse,
  buildBillingFinancialSummary,
  describeCoupon,
  getAdminClient,
  getStripeClient,
  getValidatedBillingCatalog,
  hasForbiddenClientDiscountField,
  jsonResponse,
  normalizePromotionCode,
  OFFICIAL_STRIPE_PRICES,
  optionsResponse,
  originIsAllowed,
  parsePlanSlug,
  requirePartner,
  resolveActivePromotionCode,
  stripeInvoiceDiscountCents,
  stripeNotConfiguredResponse,
  TRIAL_DAYS,
} from "../_shared/billing/stripe.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return optionsResponse(request);
  if (request.method !== "POST") {
    return jsonResponse(405, { error: { code: "METHOD_NOT_ALLOWED", message: "Metodo nao permitido." } }, request);
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
    const setupIntentId = typeof body.setupIntentId === "string" ? body.setupIntentId : "";
    if (hasForbiddenClientDiscountField(body)) {
      return jsonResponse(400, {
        error: {
          code: "INVALID_DISCOUNT_PAYLOAD",
          message: "Dados de desconto invalidos.",
        },
      }, request);
    }

    const promotionCodeInput = normalizePromotionCode(body.promotionCode ?? body.couponCode);
    if ("error" in promotionCodeInput) {
      return jsonResponse(400, { error: promotionCodeInput.error }, request);
    }
    const promotionCodeText = promotionCodeInput.code;

    if (!planSlug || !setupIntentId) {
      return jsonResponse(400, { error: { code: "INVALID_PAYLOAD", message: "Dados de checkout invalidos." } }, request);
    }

    const { data: existingSubscription } = await supabase
      .from("partner_subscriptions")
      .select("id")
      .eq("partner_id", partnerAccess.partner.id)
      .in("status", ["trialing", "active", "past_due", "incomplete"])
      .maybeSingle();

    if (existingSubscription) {
      return jsonResponse(409, { error: { code: "SUBSCRIPTION_EXISTS", message: "Ja existe uma assinatura comercial para este Parceiro." } }, request);
    }

    const { data: trialAvailable } = await supabase.rpc("billing_partner_trial_available", {
      target_partner_id: partnerAccess.partner.id,
    });

    if (trialAvailable === false) {
      return jsonResponse(409, { error: { code: "TRIAL_ALREADY_USED", message: "Este Parceiro ja utilizou o teste gratuito." } }, request);
    }

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    if (setupIntent.status !== "succeeded" || setupIntent.metadata?.partner_id !== partnerAccess.partner.id) {
      return jsonResponse(400, { error: { code: "INVALID_SETUP_INTENT", message: "Metodo de pagamento nao confirmado." } }, request);
    }

    const customerId = typeof setupIntent.customer === "string" ? setupIntent.customer : setupIntent.customer?.id;
    const paymentMethodId = typeof setupIntent.payment_method === "string" ? setupIntent.payment_method : setupIntent.payment_method?.id;
    if (!customerId || !paymentMethodId) {
      return jsonResponse(400, { error: { code: "PAYMENT_METHOD_MISSING", message: "Metodo de pagamento ausente." } }, request);
    }

    const catalog = await getValidatedBillingCatalog(stripe);
    const basePrice = catalog.planPrices[planSlug];
    const addonPrice = catalog.addonPrice;

    let promotionCodeId: string | undefined;
    let promotionPresentation: {
      code: string;
      couponId: string;
      duration: string;
      label: string;
      promotionCodeId: string;
    } | null = null;
    if (promotionCodeText) {
      const resolvedPromotionCode = await resolveActivePromotionCode(stripe, promotionCodeText);
      if (!resolvedPromotionCode) {
        return jsonResponse(400, { error: { code: "INVALID_PROMOTION_CODE", message: "Codigo promocional invalido ou indisponivel." } }, request);
      }
      const coupon = resolvedPromotionCode.promotion.coupon;
      if (!coupon || typeof coupon === "string") {
        return jsonResponse(400, { error: { code: "INVALID_PROMOTION_CODE", message: "Codigo promocional invalido ou indisponivel." } }, request);
      }
      promotionCodeId = resolvedPromotionCode.id;
      promotionPresentation = {
        code: resolvedPromotionCode.code,
        couponId: coupon.id,
        duration: coupon.duration,
        label: describeCoupon(coupon),
        promotionCodeId: resolvedPromotionCode.id,
      };
    }

    const quantity = await activeClientCount(supabase, partnerAccess.partner.id);
    const items = [
      { price: basePrice.id, quantity: 1 },
    ];
    if (quantity > 0) {
      items.push({ price: addonPrice.id, quantity });
    }

    const previewInvoice = await stripe.invoices.createPreview({
      customer: customerId,
      discounts: promotionCodeId ? [{ promotion_code: promotionCodeId }] : undefined,
      subscription_details: {
        billing_mode: { type: "flexible" },
        items,
        proration_behavior: "none",
      },
    });

    const subscription = await stripe.subscriptions.create({
      billing_mode: { type: "flexible" },
      collection_method: "charge_automatically",
      customer: customerId,
      default_payment_method: paymentMethodId,
      discounts: promotionCodeId ? [{ promotion_code: promotionCodeId }] : undefined,
      items,
      metadata: {
        partner_id: partnerAccess.partner.id,
        plan_slug: planSlug,
      },
      payment_behavior: "default_incomplete",
      proration_behavior: "none",
      trial_period_days: TRIAL_DAYS,
      expand: ["items.data.price"],
    }, {
      idempotencyKey: `subscription:${partnerAccess.partner.id}:${setupIntentId}`,
    });

    const localPlan = await supabase
      .from("billing_plans")
      .select("id, lookup_key, price_cents")
      .eq("slug", planSlug)
      .maybeSingle();

    if (!localPlan.data?.id) {
      return jsonResponse(409, { error: { code: "LOCAL_CATALOG_NOT_READY", message: "Catalogo local ainda nao preparado." } }, request);
    }

    const localAddon = await supabase
      .from("billing_plan_addons")
      .select("id, lookup_key, price_cents")
      .eq("slug", "active-client-monthly")
      .maybeSingle();

    if (!localAddon.data?.id) {
      return jsonResponse(409, { error: { code: "LOCAL_ADDON_NOT_READY", message: "Adicional local ainda nao preparado." } }, request);
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 86_400_000);
    const { data: localSubscription, error: insertError } = await supabase
      .from("partner_subscriptions")
      .insert({
        active_client_quantity: quantity,
        current_period_end: trialEnd.toISOString(),
        current_period_start: now.toISOString(),
        default_payment_method_id: paymentMethodId,
        last_quantity_synced_at: now.toISOString(),
        partner_id: partnerAccess.partner.id,
        plan_id: localPlan.data.id,
        status: subscription.status,
        stripe_customer_id: customerId,
        stripe_status: subscription.status,
        stripe_subscription_id: subscription.id,
        trial_end: trialEnd.toISOString(),
        trial_start: now.toISOString(),
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    const baseItem = subscription.items.data.find((item) => item.price.id === basePrice.id);
    const addonItem = subscription.items.data.find((item) => item.price.id === addonPrice.id);

    const subscriptionItems: Record<string, unknown>[] = [
      {
        billing_plan_id: localPlan.data.id,
        currency: OFFICIAL_STRIPE_PRICES[planSlug].currency,
        current_period_end: trialEnd.toISOString(),
        current_period_start: now.toISOString(),
        item_kind: "base_plan",
        lookup_key: OFFICIAL_STRIPE_PRICES[planSlug].lookupKey,
        partner_id: partnerAccess.partner.id,
        quantity: 1,
        stripe_subscription_item_id: baseItem?.id ?? null,
        subscription_id: localSubscription.id,
        unit_amount_cents: OFFICIAL_STRIPE_PRICES[planSlug].unitAmount,
      },
    ];

    if (quantity > 0 || addonItem) {
      subscriptionItems.push({
        billing_addon_id: localAddon.data.id,
        currency: "brl",
        current_period_end: trialEnd.toISOString(),
        current_period_start: now.toISOString(),
        item_kind: "active_client_addon",
        lookup_key: ADDON_LOOKUP_KEY,
        partner_id: partnerAccess.partner.id,
        quantity,
        stripe_subscription_item_id: addonItem?.id ?? null,
        subscription_id: localSubscription.id,
        unit_amount_cents: ACTIVE_CLIENT_UNIT_CENTS,
      });
    }

    await supabase.from("partner_subscription_items").upsert(subscriptionItems, { onConflict: "subscription_id,item_kind" });

    await supabase.from("partner_subscription_financial_summaries").upsert({
      ...buildBillingFinancialSummary({
        activeClientQuantity: quantity,
        currency: previewInvoice.currency,
        discountAmountCents: stripeInvoiceDiscountCents(previewInvoice),
        planSlug,
        promotion: promotionPresentation,
        source: "stripe_preview",
        stripeSubscriptionId: subscription.id,
        totalAfterDiscountCents: previewInvoice.total,
      }),
      partner_id: partnerAccess.partner.id,
      subscription_id: localSubscription.id,
    }, { onConflict: "subscription_id" });

    await supabase.from("partner_billing_trial_usage").insert({
      first_subscription_id: localSubscription.id,
      partner_id: partnerAccess.partner.id,
      stripe_subscription_id: subscription.id,
    });

    await supabase.from("billing_active_client_snapshots").insert({
      active_client_quantity: quantity,
      amount_cents: quantity * ACTIVE_CLIENT_UNIT_CENTS,
      partner_id: partnerAccess.partner.id,
      reason: "checkout",
      stripe_subscription_id: subscription.id,
      subscription_id: localSubscription.id,
      unit_amount_cents: ACTIVE_CLIENT_UNIT_CENTS,
    });

    return jsonResponse(200, {
      subscriptionId: subscription.id,
      status: subscription.status,
    }, request);
  } catch (error) {
    console.error(JSON.stringify({ code: "BILLING_CREATE_SUBSCRIPTION_FAILED", message: error instanceof Error ? error.message : "UNKNOWN" }));
    return jsonResponse(500, { error: { code: "SUBSCRIPTION_CREATE_FAILED", message: "Nao foi possivel criar a assinatura." } }, request);
  }
});
