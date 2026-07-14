import {
  forbiddenOriginResponse,
  getAdminClient,
  getStripeClient,
  jsonResponse,
  optionsResponse,
  originIsAllowed,
  requireAdmin,
  stripeNotConfiguredResponse,
} from "../_shared/billing/stripe.ts";
import {
  isLeoBillingCatalogProduct,
  priceCatalogKind,
  productFromPrice,
} from "../_shared/billing/catalog-classifier.ts";
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

    const syntheticEventCreatedAt = Math.floor(Date.now() / 1000);
    const report = {
      ignoredPrices: 0,
      ignoredProducts: 0,
      prices: 0,
      products: 0,
    };

    const products = await stripe.products.list({ limit: 100 });
    for (const product of products.data) {
      if (!isLeoBillingCatalogProduct(product)) {
        report.ignoredProducts += 1;
        continue;
      }
      const result = await upsertCatalogProduct(
        supabase,
        product,
        syntheticEventCreatedAt,
      );
      if (result.decision === "applied") report.products += 1;
    }

    const prices = await stripe.prices.list({
      expand: ["data.product"],
      limit: 100,
    });
    for (const price of prices.data) {
      if (!priceCatalogKind(price, productFromPrice(price))) {
        report.ignoredPrices += 1;
        continue;
      }
      const result = await upsertCatalogPrice(
        supabase,
        price,
        syntheticEventCreatedAt,
      );
      if (result.decision === "applied") report.prices += 1;
    }

    return jsonResponse(200, {
      report,
      success: true,
    }, request);
  } catch (error) {
    console.error(
      JSON.stringify({
        code: "STRIPE_RECONCILE_CATALOG_FAILED",
        message: error instanceof Error ? error.message : "UNKNOWN",
      }),
    );
    return jsonResponse(500, {
      error: {
        code: "RECONCILE_FAILED",
        message: "Nao foi possivel reconciliar o catalogo.",
      },
    }, request);
  }
});
