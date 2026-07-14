import type {
  SupabaseClient,
} from "npm:@supabase/supabase-js@2.98.0";
import type Stripe from "npm:stripe@22.3.1";

import {
  markCatalogProductDeleted,
  upsertCatalogProduct,
  type CatalogSyncResult,
} from "./catalog-repository.ts";

export async function handleStripeProductCatalogEvent({
  eventType,
  eventCreatedAt,
  product,
  supabase,
}: {
  eventType: "product.created" | "product.updated" | "product.deleted";
  eventCreatedAt: number;
  product: Stripe.Product | Stripe.DeletedProduct;
  supabase: SupabaseClient;
}): Promise<CatalogSyncResult> {
  if (eventType === "product.deleted" || ("deleted" in product && product.deleted)) {
    return await markCatalogProductDeleted(
      supabase,
      product.id,
      eventCreatedAt,
    );
  }

  return await upsertCatalogProduct(supabase, product, eventCreatedAt);
}
