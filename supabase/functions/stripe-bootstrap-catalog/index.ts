import {
  ADDON_LOOKUP_KEY,
  forbiddenOriginResponse,
  getAdminClient,
  getStripeClient,
  getValidatedBillingCatalog,
  jsonResponse,
  optionsResponse,
  originIsAllowed,
  PLAN_LOOKUP_KEYS,
  requireAdmin,
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
    const adminAccess = await requireAdmin(request, supabase);
    if ("error" in adminAccess) return adminAccess.error as Response;

    const catalog = await getValidatedBillingCatalog(stripe, {
      reconcileProductNames: true,
    });

    await supabase.from("billing_plans").update({
      stripe_price_id: catalog.planPrices["complete-monthly"].id,
      stripe_product_id: catalog.products.complete.id,
    }).eq("slug", "complete-monthly");

    await supabase.from("billing_plans").update({
      stripe_price_id: catalog.planPrices["complete-annual"].id,
      stripe_product_id: catalog.products.complete.id,
    }).eq("slug", "complete-annual");

    await supabase.from("billing_plan_addons").update({
      stripe_price_id: catalog.addonPrice.id,
      stripe_product_id: catalog.products.activeClientAddon.id,
    }).eq("slug", "active-client-monthly");

    return jsonResponse(200, {
      catalog: {
        addon: catalog.addonPrice.id,
        annual: catalog.planPrices["complete-annual"].id,
        monthly: catalog.planPrices["complete-monthly"].id,
      },
      lookupKeys: [
        PLAN_LOOKUP_KEYS["complete-monthly"],
        PLAN_LOOKUP_KEYS["complete-annual"],
        ADDON_LOOKUP_KEY,
      ],
      success: true,
    }, request);
  } catch (error) {
    console.error(
      JSON.stringify({
        code: "STRIPE_BOOTSTRAP_CATALOG_FAILED",
        message: error instanceof Error ? error.message : "UNKNOWN",
      }),
    );
    return jsonResponse(500, {
      error: {
        code: "BOOTSTRAP_FAILED",
        message: "Nao foi possivel reconciliar o catalogo Stripe.",
      },
    }, request);
  }
});
