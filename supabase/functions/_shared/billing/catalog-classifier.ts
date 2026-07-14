import type Stripe from "npm:stripe@22.3.1";

import {
  ADDON_LOOKUP_KEY,
  OFFICIAL_STRIPE_PRICES,
  OFFICIAL_STRIPE_PRODUCTS,
  PLAN_LOOKUP_KEYS,
  type BillingPlanSlug,
} from "./stripe.ts";

export type BillingCatalogRole =
  | "complete-plan"
  | "active-client-addon"
  | "hml-plan";
export type BillingCatalogPriceKind =
  | { kind: "plan"; role: "complete-plan"; slug: BillingPlanSlug }
  | { kind: "addon"; role: "active-client-addon"; slug: "active-client-monthly" }
  | { kind: "fixture"; role: "hml-plan"; slug: "hml-catalog-fixture" };

const allowedProductMetadata = new Set([
  "application",
  "catalog_role",
  "public_label",
  "purpose",
  "test_run_id",
]);

const allowedPriceMetadata = new Set([
  "application",
  "catalog_role",
  "public_label",
  "purpose",
  "test_run_id",
]);

function metadataValue(
  metadata: Stripe.Metadata | null | undefined,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function homologationFixturesEnabled() {
  const deno = globalThis as typeof globalThis & {
    Deno?: { env?: { get: (key: string) => string | undefined } };
  };
  return deno.Deno?.env?.get("BILLING_ALLOW_HML_CATALOG_FIXTURES") === "1";
}

export function sanitizeCatalogMetadata(
  metadata: Stripe.Metadata | null | undefined,
  allowed = allowedProductMetadata,
) {
  return Object.fromEntries(
    Object.entries(metadata ?? {})
      .filter(([key, value]) => allowed.has(key) && typeof value === "string")
      .map(([key, value]) => [key, String(value).slice(0, 160)]),
  );
}

export function sanitizePriceMetadata(metadata: Stripe.Metadata | null | undefined) {
  return sanitizeCatalogMetadata(metadata, allowedPriceMetadata);
}

export function productCatalogRole(
  product: Stripe.Product | Stripe.DeletedProduct | null | undefined,
): BillingCatalogRole | null {
  if (!product || "deleted" in product) return null;

  const application = metadataValue(product.metadata, "application");
  const catalogRole = metadataValue(product.metadata, "catalog_role");
  if (application === "leo-barros") {
    if (catalogRole === "complete-plan") return "complete-plan";
    if (catalogRole === "active-client-addon") return "active-client-addon";
    if (catalogRole === "hml-plan" && homologationFixturesEnabled()) {
      return "hml-plan";
    }
  }

  if (product.id === OFFICIAL_STRIPE_PRODUCTS.complete.id) {
    return "complete-plan";
  }
  if (product.id === OFFICIAL_STRIPE_PRODUCTS.activeClientAddon.id) {
    return "active-client-addon";
  }
  return null;
}

export function isLeoBillingCatalogProduct(
  product: Stripe.Product | Stripe.DeletedProduct | null | undefined,
) {
  return Boolean(productCatalogRole(product));
}

export function planSlugFromLookupKey(lookupKey: string | null | undefined) {
  if (lookupKey === PLAN_LOOKUP_KEYS["complete-monthly"]) {
    return "complete-monthly";
  }
  if (lookupKey === PLAN_LOOKUP_KEYS["complete-annual"]) {
    return "complete-annual";
  }
  return null;
}

export function priceCatalogKind(
  price: Stripe.Price,
  product?: Stripe.Product | Stripe.DeletedProduct | null,
): BillingCatalogPriceKind | null {
  const lookupKey = price.lookup_key ?? null;
  const planSlug = planSlugFromLookupKey(lookupKey);
  if (planSlug) return { kind: "plan", role: "complete-plan", slug: planSlug };
  if (lookupKey === ADDON_LOOKUP_KEY) {
    return {
      kind: "addon",
      role: "active-client-addon",
      slug: "active-client-monthly",
    };
  }

  if (price.id === OFFICIAL_STRIPE_PRICES["complete-monthly"].id) {
    return { kind: "plan", role: "complete-plan", slug: "complete-monthly" };
  }
  if (price.id === OFFICIAL_STRIPE_PRICES["complete-annual"].id) {
    return { kind: "plan", role: "complete-plan", slug: "complete-annual" };
  }
  if (price.id === OFFICIAL_STRIPE_PRICES["active-client-monthly"].id) {
    return {
      kind: "addon",
      role: "active-client-addon",
      slug: "active-client-monthly",
    };
  }

  const role = productCatalogRole(product);
  if (role === "hml-plan") {
    return {
      kind: "fixture",
      role,
      slug: "hml-catalog-fixture",
    };
  }
  if (role === "active-client-addon") {
    return {
      kind: "addon",
      role,
      slug: "active-client-monthly",
    };
  }

  return null;
}

export function isLeoBillingCatalogPrice(
  price: Stripe.Price,
  product?: Stripe.Product | Stripe.DeletedProduct | null,
) {
  return Boolean(priceCatalogKind(price, product));
}

export function productFromPrice(
  price: Stripe.Price,
): Stripe.Product | Stripe.DeletedProduct | null {
  return typeof price.product === "string" ? null : price.product;
}
