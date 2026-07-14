import type {
  SupabaseClient,
} from "npm:@supabase/supabase-js@2.98.0";
import type Stripe from "npm:stripe@22.3.1";

import {
  ADDON_LOOKUP_KEY,
  OFFICIAL_STRIPE_PRICES,
  PLAN_LOOKUP_KEYS,
  TRIAL_DAYS,
  type BillingPlanSlug,
} from "./stripe.ts";
import {
  priceCatalogKind,
  productCatalogRole,
  productFromPrice,
  sanitizeCatalogMetadata,
  sanitizePriceMetadata,
} from "./catalog-classifier.ts";

type CatalogDecision =
  | "applied"
  | "ignored_not_catalog"
  | "ignored_out_of_order";

export type CatalogSyncResult = {
  decision: CatalogDecision;
  stripeObjectId: string;
};

function stripeDate(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function eventDate(eventCreatedAt: number) {
  return new Date(eventCreatedAt * 1000).toISOString();
}

function isOutOfOrder(
  current: { last_stripe_event_created_at?: string | null } | null | undefined,
  eventCreatedAt: number,
) {
  if (!current?.last_stripe_event_created_at) return false;
  return new Date(current.last_stripe_event_created_at).getTime() >
    eventCreatedAt * 1000;
}

function productIdFromPrice(price: Stripe.Price) {
  return typeof price.product === "string" ? price.product : price.product.id;
}

async function getBillingProduct(
  supabase: SupabaseClient,
  stripeProductId: string,
) {
  const { data, error } = await supabase
    .from("billing_products")
    .select("id, active, catalog_role, last_stripe_event_created_at, name")
    .eq("stripe_product_id", stripeProductId)
    .maybeSingle();
  if (error) throw error;
  return data as {
    active: boolean;
    catalog_role: string;
    id: string;
    last_stripe_event_created_at: string | null;
    name: string;
  } | null;
}

async function syncCompatibleProductRows(
  supabase: SupabaseClient,
  input: {
    active: boolean;
    catalogRole: "complete-plan" | "active-client-addon" | "hml-plan";
    name: string;
    stripeProductId: string;
  },
) {
  if (input.catalogRole === "hml-plan") return;

  if (input.catalogRole === "complete-plan") {
    const { error } = await supabase
      .from("billing_plans")
      .update({
        is_active: input.active,
        name: input.name,
        stripe_product_id: input.stripeProductId,
      })
      .in("lookup_key", [
        PLAN_LOOKUP_KEYS["complete-monthly"],
        PLAN_LOOKUP_KEYS["complete-annual"],
      ]);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("billing_plan_addons")
    .update({
      is_active: input.active,
      name: input.name,
      stripe_product_id: input.stripeProductId,
    })
    .eq("lookup_key", ADDON_LOOKUP_KEY);
  if (error) throw error;
}

export async function upsertCatalogProduct(
  supabase: SupabaseClient,
  product: Stripe.Product,
  eventCreatedAt: number,
): Promise<CatalogSyncResult> {
  const catalogRole = productCatalogRole(product);
  if (!catalogRole) {
    return { decision: "ignored_not_catalog", stripeObjectId: product.id };
  }

  const current = await getBillingProduct(supabase, product.id);
  if (isOutOfOrder(current, eventCreatedAt)) {
    return { decision: "ignored_out_of_order", stripeObjectId: product.id };
  }

  const { error } = await supabase.from("billing_products").upsert({
    active: product.active,
    catalog_role: catalogRole,
    deleted_at: null,
    description: product.description ?? null,
    last_stripe_event_created_at: eventDate(eventCreatedAt),
    livemode: product.livemode,
    metadata: sanitizeCatalogMetadata(product.metadata),
    name: product.name,
    stripe_created_at: stripeDate(product.created),
    stripe_product_id: product.id,
    stripe_updated_at: stripeDate(product.updated),
  }, { onConflict: "stripe_product_id" });
  if (error) throw error;

  await syncCompatibleProductRows(supabase, {
    active: product.active,
    catalogRole,
    name: product.name,
    stripeProductId: product.id,
  });

  return { decision: "applied", stripeObjectId: product.id };
}

export async function markCatalogProductDeleted(
  supabase: SupabaseClient,
  stripeProductId: string,
  eventCreatedAt: number,
): Promise<CatalogSyncResult> {
  const current = await getBillingProduct(supabase, stripeProductId);
  if (!current) {
    return { decision: "ignored_not_catalog", stripeObjectId: stripeProductId };
  }
  if (isOutOfOrder(current, eventCreatedAt)) {
    return { decision: "ignored_out_of_order", stripeObjectId: stripeProductId };
  }

  const { error } = await supabase
    .from("billing_products")
    .update({
      active: false,
      deleted_at: new Date().toISOString(),
      last_stripe_event_created_at: eventDate(eventCreatedAt),
    })
    .eq("stripe_product_id", stripeProductId);
  if (error) throw error;

  await syncCompatibleProductRows(supabase, {
    active: false,
    catalogRole: current.catalog_role as
      | "complete-plan"
      | "active-client-addon"
      | "hml-plan",
    name: current.catalog_role === "active-client-addon"
      ? "Cliente ativo adicional"
      : "Plano Completo",
    stripeProductId,
  });

  return { decision: "applied", stripeObjectId: stripeProductId };
}

async function ensureProductForPrice(
  supabase: SupabaseClient,
  price: Stripe.Price,
  eventCreatedAt: number,
) {
  const product = productFromPrice(price);
  if (product && !("deleted" in product)) {
    await upsertCatalogProduct(supabase, product, eventCreatedAt);
  }

  const stripeProductId = productIdFromPrice(price);
  const current = await getBillingProduct(supabase, stripeProductId);
  if (!current) return null;
  return current;
}

async function currentPriceById(
  supabase: SupabaseClient,
  stripePriceId: string,
) {
  const { data, error } = await supabase
    .from("billing_prices")
    .select("id, last_stripe_event_created_at")
    .eq("stripe_price_id", stripePriceId)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; last_stripe_event_created_at: string | null } | null;
}

async function updateCompatiblePriceRow(
  supabase: SupabaseClient,
  input: {
    billingProductActive: boolean;
    billingProductName: string;
    kind: ReturnType<typeof priceCatalogKind>;
    price: Stripe.Price;
    stripeProductId: string;
  },
) {
  if (!input.kind) return;
  if (input.kind.kind === "fixture") return;

  const unitAmount = input.price.unit_amount;
  if (typeof unitAmount !== "number") return;

  const active = input.price.active && input.billingProductActive;
  const common = {
    currency: input.price.currency,
    is_active: active,
    lookup_key: input.price.lookup_key,
    price_cents: unitAmount,
    stripe_price_id: input.price.id,
    stripe_product_id: input.stripeProductId,
  };

  if (input.kind.kind === "plan") {
    const billingInterval = input.kind.slug === "complete-annual"
      ? "yearly"
      : "monthly";
    const { error } = await supabase
      .from("billing_plans")
      .upsert({
        ...common,
        billing_interval: billingInterval,
        name: input.billingProductName,
        public_metadata: input.kind.slug === "complete-annual"
          ? {
            annual_charge_cents: unitAmount,
            commercial: true,
            monthly_equivalent_cents: Math.round(unitAmount / 12),
          }
          : { commercial: true },
        slug: input.kind.slug,
        sort_order: input.kind.slug === "complete-monthly" ? 10 : 20,
        trial_days: TRIAL_DAYS,
      }, { onConflict: "slug" });
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("billing_plan_addons")
    .upsert({
      ...common,
      billing_interval: "monthly",
      name: input.billingProductName,
      slug: "active-client-monthly",
      stripe_interval: input.price.recurring?.interval ?? "month",
      usage_type: input.price.recurring?.usage_type ?? "licensed",
    }, { onConflict: "slug" });
  if (error) throw error;
}

export async function upsertCatalogPrice(
  supabase: SupabaseClient,
  price: Stripe.Price,
  eventCreatedAt: number,
): Promise<CatalogSyncResult> {
  const product = productFromPrice(price);
  const kind = priceCatalogKind(price, product);
  if (!kind) {
    return { decision: "ignored_not_catalog", stripeObjectId: price.id };
  }

  const currentPrice = await currentPriceById(supabase, price.id);
  if (isOutOfOrder(currentPrice, eventCreatedAt)) {
    return { decision: "ignored_out_of_order", stripeObjectId: price.id };
  }

  const productRow = await ensureProductForPrice(supabase, price, eventCreatedAt);
  if (!productRow) {
    return { decision: "ignored_not_catalog", stripeObjectId: price.id };
  }

  const stripeProductId = productIdFromPrice(price);
  const { error } = await supabase.from("billing_prices").upsert({
    active: price.active,
    billing_product_id: productRow.id,
    billing_scheme: price.billing_scheme,
    billing_type: price.type,
    currency: price.currency,
    deleted_at: null,
    last_stripe_event_created_at: eventDate(eventCreatedAt),
    livemode: price.livemode,
    lookup_key: price.lookup_key ?? null,
    metadata: sanitizePriceMetadata(price.metadata),
    recurring_interval: price.recurring?.interval ?? null,
    recurring_interval_count: price.recurring?.interval_count ?? null,
    stripe_created_at: stripeDate(price.created),
    stripe_price_id: price.id,
    stripe_product_id: stripeProductId,
    stripe_updated_at: null,
    tax_behavior: price.tax_behavior ?? null,
    unit_amount_cents: price.unit_amount ?? null,
    unit_amount_decimal: price.unit_amount_decimal ?? null,
    usage_type: price.recurring?.usage_type ?? null,
  }, { onConflict: "stripe_price_id" });
  if (error) throw error;

  await updateCompatiblePriceRow(supabase, {
    billingProductActive: productRow.active && productRow.catalog_role === kind.role,
    billingProductName: productRow.name,
    kind,
    price,
    stripeProductId,
  });

  return { decision: "applied", stripeObjectId: price.id };
}

export async function markCatalogPriceDeleted(
  supabase: SupabaseClient,
  stripePriceId: string,
  eventCreatedAt: number,
): Promise<CatalogSyncResult> {
  const current = await currentPriceById(supabase, stripePriceId);
  if (!current) {
    return { decision: "ignored_not_catalog", stripeObjectId: stripePriceId };
  }
  if (isOutOfOrder(current, eventCreatedAt)) {
    return { decision: "ignored_out_of_order", stripeObjectId: stripePriceId };
  }

  const { error } = await supabase
    .from("billing_prices")
    .update({
      active: false,
      deleted_at: new Date().toISOString(),
      last_stripe_event_created_at: eventDate(eventCreatedAt),
    })
    .eq("stripe_price_id", stripePriceId);
  if (error) throw error;

  await supabase
    .from("billing_plans")
    .update({ is_active: false })
    .eq("stripe_price_id", stripePriceId);
  await supabase
    .from("billing_plan_addons")
    .update({ is_active: false })
    .eq("stripe_price_id", stripePriceId);

  return { decision: "applied", stripeObjectId: stripePriceId };
}

export async function activeLookupConflictCount(
  supabase: SupabaseClient,
  lookupKey: string,
  livemode: boolean,
) {
  const { count, error } = await supabase
    .from("billing_prices")
    .select("id", { count: "exact", head: true })
    .eq("lookup_key", lookupKey)
    .eq("livemode", livemode)
    .eq("active", true)
    .is("deleted_at", null);
  if (error) throw error;
  return count ?? 0;
}
