import {
  activeClientCount,
  describeCoupon,
  forbiddenOriginResponse,
  getAdminClient,
  getStripeClient,
  hasForbiddenClientDiscountField,
  jsonResponse,
  normalizePromotionCode,
  optionsResponse,
  originIsAllowed,
  parsePlanSlug,
  requirePartner,
  resolveLocalCheckoutCatalog,
  resolveActivePromotionCode,
  resolvePartnerStripeCustomer,
  stripeInvoiceDiscountCents,
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
    if (hasForbiddenClientDiscountField(body)) {
      return jsonResponse(400, {
        error: {
          code: "INVALID_DISCOUNT_PAYLOAD",
          message: "Dados de desconto invalidos.",
        },
      }, request);
    }

    const planSlug = parsePlanSlug(body.planSlug);
    if (!planSlug) {
      return jsonResponse(400, {
        error: { code: "INVALID_PLAN", message: "Plano invalido." },
      }, request);
    }

    const promotionCodeInput = normalizePromotionCode(body.promotionCode);
    if ("error" in promotionCodeInput) {
      return jsonResponse(400, { error: promotionCodeInput.error }, request);
    }
    const promotionCodeText = promotionCodeInput.code;
    if (!promotionCodeText) {
      return jsonResponse(400, {
        error: {
          code: "PROMOTION_CODE_REQUIRED",
          message: "Informe um codigo promocional.",
        },
      }, request);
    }

    const promotionCode = await resolveActivePromotionCode(
      stripe,
      promotionCodeText,
    );
    if (!promotionCode) {
      return jsonResponse(400, {
        error: {
          code: "INVALID_PROMOTION_CODE",
          message: "Codigo promocional invalido ou indisponivel.",
        },
      }, request);
    }
    const coupon = promotionCode.promotion.coupon;
    if (!coupon || typeof coupon === "string") {
      return jsonResponse(400, {
        error: {
          code: "INVALID_PROMOTION_CODE",
          message: "Codigo promocional invalido ou indisponivel.",
        },
      }, request);
    }

    const catalog = await resolveLocalCheckoutCatalog(
      supabase,
      stripe,
      planSlug,
    );
    const quantity = await activeClientCount(
      supabase,
      partnerAccess.partner.id,
    );
    const customerId = await resolvePartnerStripeCustomer(
      stripe,
      partnerAccess,
    );
    const basePrice = catalog.basePrice;
    const items = [
      { price: basePrice.id, quantity: 1 },
    ];
    if (quantity > 0) {
      items.push({ price: catalog.addonPrice.id, quantity });
    }

    const invoice = await stripe.invoices.createPreview({
      customer: customerId,
      discounts: [{ promotion_code: promotionCode.id }],
      subscription_details: {
        billing_mode: { type: "flexible" },
        items,
        proration_behavior: "none",
      },
    });

    const baseAmountCents = catalog.localPlan.price_cents;
    const activeClientSubtotalCents = quantity *
      catalog.localAddon.price_cents;
    const subtotalCents = baseAmountCents + activeClientSubtotalCents;
    const discountCents = stripeInvoiceDiscountCents(invoice);
    const totalAfterDiscountCents = invoice.total ??
      Math.max(0, subtotalCents - discountCents);

    return jsonResponse(200, {
      activeClients: {
        quantity,
        subtotalCents: activeClientSubtotalCents,
        unitAmountCents: catalog.localAddon.price_cents,
      },
      plan: {
        baseAmountCents,
        slug: planSlug,
      },
      promotion: {
        code: promotionCode.code,
        discountCents,
        duration: coupon.duration,
        label: describeCoupon(coupon),
      },
      subtotalCents,
      totalAfterDiscountCents,
    }, request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    console.error(
      JSON.stringify({ code: "BILLING_PREVIEW_SUBSCRIPTION_FAILED", message }),
    );
    return jsonResponse(400, {
      error: {
        code: "PROMOTION_PREVIEW_FAILED",
        message: "Este codigo nao pode ser aplicado ao plano selecionado.",
      },
    }, request);
  }
});
