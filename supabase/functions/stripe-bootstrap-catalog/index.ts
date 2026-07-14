import {
  ADDON_LOOKUP_KEY,
  ACTIVE_CLIENT_UNIT_CENTS,
  forbiddenOriginResponse,
  getAdminClient,
  getStripeClient,
  getValidatedBillingCatalog,
  jsonResponse,
  OFFICIAL_STRIPE_PRICES,
  OFFICIAL_STRIPE_PRODUCTS,
  optionsResponse,
  originIsAllowed,
  PLAN_LOOKUP_KEYS,
  requireAdmin,
  stripeNotConfiguredResponse,
  TRIAL_DAYS,
} from "../_shared/billing/stripe.ts";
import {
  upsertCatalogPrice,
  upsertCatalogProduct,
} from "../_shared/billing/catalog-repository.ts";

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
    const syntheticEventCreatedAt = Math.floor(Date.now() / 1000);

    await upsertCatalogProduct(
      supabase,
      catalog.products.complete,
      syntheticEventCreatedAt,
    );
    await upsertCatalogProduct(
      supabase,
      catalog.products.activeClientAddon,
      syntheticEventCreatedAt,
    );
    await upsertCatalogPrice(
      supabase,
      catalog.planPrices["complete-monthly"],
      syntheticEventCreatedAt,
    );
    await upsertCatalogPrice(
      supabase,
      catalog.planPrices["complete-annual"],
      syntheticEventCreatedAt,
    );
    await upsertCatalogPrice(
      supabase,
      catalog.addonPrice,
      syntheticEventCreatedAt,
    );

    const { error: plansError } = await supabase.from("billing_plans").upsert([
      {
        billing_interval: "monthly",
        currency: OFFICIAL_STRIPE_PRICES["complete-monthly"].currency,
        is_active: true,
        lookup_key: PLAN_LOOKUP_KEYS["complete-monthly"],
        name: OFFICIAL_STRIPE_PRODUCTS.complete.name,
        price_cents: OFFICIAL_STRIPE_PRICES["complete-monthly"].unitAmount,
        public_metadata: { commercial: true },
        slug: "complete-monthly",
        sort_order: 10,
        stripe_price_id: catalog.planPrices["complete-monthly"].id,
        stripe_product_id: catalog.products.complete.id,
        trial_days: TRIAL_DAYS,
      },
      {
        billing_interval: "yearly",
        currency: OFFICIAL_STRIPE_PRICES["complete-annual"].currency,
        is_active: true,
        lookup_key: PLAN_LOOKUP_KEYS["complete-annual"],
        name: OFFICIAL_STRIPE_PRODUCTS.complete.name,
        price_cents: OFFICIAL_STRIPE_PRICES["complete-annual"].unitAmount,
        public_metadata: {
          annual_charge_cents: OFFICIAL_STRIPE_PRICES["complete-annual"]
            .unitAmount,
          commercial: true,
          monthly_equivalent_cents: 9990,
        },
        slug: "complete-annual",
        sort_order: 20,
        stripe_price_id: catalog.planPrices["complete-annual"].id,
        stripe_product_id: catalog.products.complete.id,
        trial_days: TRIAL_DAYS,
      },
    ], { onConflict: "slug" });

    if (plansError) throw plansError;

    const { error: addonError } = await supabase.from("billing_plan_addons")
      .upsert({
        billing_interval: "monthly",
        currency: OFFICIAL_STRIPE_PRICES["active-client-monthly"].currency,
        is_active: true,
        lookup_key: ADDON_LOOKUP_KEY,
        name: OFFICIAL_STRIPE_PRODUCTS.activeClientAddon.name,
        price_cents: ACTIVE_CLIENT_UNIT_CENTS,
        slug: "active-client-monthly",
        stripe_interval: OFFICIAL_STRIPE_PRICES["active-client-monthly"]
          .interval,
        stripe_price_id: catalog.addonPrice.id,
        stripe_product_id: catalog.products.activeClientAddon.id,
        usage_type: OFFICIAL_STRIPE_PRICES["active-client-monthly"].usageType,
      }, { onConflict: "slug" });

    if (addonError) throw addonError;

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
