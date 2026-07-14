import type {
  SupabaseClient,
} from "npm:@supabase/supabase-js@2.98.0";
import type Stripe from "npm:stripe@22.3.1";

import {
  markCatalogPriceDeleted,
  upsertCatalogPrice,
  type CatalogSyncResult,
} from "./catalog-repository.ts";

type DeletedStripePrice = { deleted: true; id: string };

async function retrieveExpandedPrice(stripe: Stripe, priceId: string) {
  return await stripe.prices.retrieve(priceId, {
    expand: ["product"],
  });
}

export async function handleStripePriceCatalogEvent({
  eventCreatedAt,
  price,
  stripe,
  supabase,
}: {
  eventCreatedAt: number;
  price: Stripe.Price | DeletedStripePrice;
  stripe: Stripe;
  supabase: SupabaseClient;
}): Promise<CatalogSyncResult> {
  if ("deleted" in price && price.deleted) {
    return await markCatalogPriceDeleted(supabase, price.id, eventCreatedAt);
  }

  const expandedPrice = typeof price.product === "string"
    ? await retrieveExpandedPrice(stripe, price.id)
    : price;

  return await upsertCatalogPrice(supabase, expandedPrice, eventCreatedAt);
}
