import {
  ADDON_LOOKUP_KEY,
  ACTIVE_CLIENT_UNIT_CENTS,
  getAdminClient,
  getStripeClient,
  jsonHeaders,
  jsonResponse,
  PLAN_LOOKUP_KEYS,
  requireAdmin,
  resolvePriceByLookupKey,
  stripeNotConfiguredResponse,
} from "../_shared/billing/stripe.ts";

const productName = "Plano Completo - Nutricao + Treinamento";
const addonName = "Cliente ativo adicional";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: jsonHeaders, status: 204 });
  if (request.method !== "POST") {
    return jsonResponse(405, { error: { code: "METHOD_NOT_ALLOWED", message: "Metodo nao permitido." } });
  }

  const stripe = getStripeClient();
  if (!stripe) return stripeNotConfiguredResponse();

  try {
    const supabase = getAdminClient();
    const adminAccess = await requireAdmin(request, supabase);
    if ("error" in adminAccess) return adminAccess.error as Response;

    const baseProduct = await stripe.products.create({ name: productName }, { idempotencyKey: "product:complete-plan" });
    const addonProduct = await stripe.products.create({ name: addonName }, { idempotencyKey: "product:active-client-addon" });

    const desiredPrices = [
      { interval: "month" as const, lookupKey: PLAN_LOOKUP_KEYS["complete-monthly"], product: baseProduct.id, slug: "complete-monthly", unitAmount: 11990 },
      { interval: "year" as const, lookupKey: PLAN_LOOKUP_KEYS["complete-annual"], product: baseProduct.id, slug: "complete-annual", unitAmount: 119880 },
      { interval: "month" as const, lookupKey: ADDON_LOOKUP_KEY, product: addonProduct.id, slug: "active-client-monthly", unitAmount: ACTIVE_CLIENT_UNIT_CENTS },
    ];

    for (const desired of desiredPrices) {
      let price = await resolvePriceByLookupKey(stripe, desired.lookupKey);
      if (price && (price.currency !== "brl" || price.unit_amount !== desired.unitAmount || price.recurring?.interval !== desired.interval)) {
        return jsonResponse(409, {
          error: {
            code: "PRICE_DIVERGENCE",
            message: `Price incompatível para lookup key ${desired.lookupKey}.`,
          },
        });
      }

      if (!price) {
        price = await stripe.prices.create({
          currency: "brl",
          lookup_key: desired.lookupKey,
          product: desired.product,
          recurring: { interval: desired.interval, usage_type: "licensed" },
          unit_amount: desired.unitAmount,
        });
      }

      if (desired.slug === "active-client-monthly") {
        await supabase.from("billing_plan_addons").update({
          stripe_price_id: price.id,
          stripe_product_id: desired.product,
        }).eq("slug", desired.slug);
      } else {
        await supabase.from("billing_plans").update({
          stripe_price_id: price.id,
          stripe_product_id: desired.product,
        }).eq("slug", desired.slug);
      }
    }

    return jsonResponse(200, { success: true });
  } catch (error) {
    console.error(JSON.stringify({ code: "STRIPE_BOOTSTRAP_CATALOG_FAILED", message: error instanceof Error ? error.message : "UNKNOWN" }));
    return jsonResponse(500, { error: { code: "BOOTSTRAP_FAILED", message: "Nao foi possivel preparar o catalogo Stripe." } });
  }
});
