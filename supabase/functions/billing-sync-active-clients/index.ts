import {
  activeClientCount,
  ACTIVE_CLIENT_UNIT_CENTS,
  ADDON_LOOKUP_KEY,
  getAdminClient,
  getStripeClient,
  jsonHeaders,
  jsonResponse,
  resolvePriceByLookupKey,
  stripeNotConfiguredResponse,
} from "../_shared/billing/stripe.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: jsonHeaders, status: 204 });
  if (request.method !== "POST") {
    return jsonResponse(405, { error: { code: "METHOD_NOT_ALLOWED", message: "Metodo nao permitido." } });
  }

  const stripe = getStripeClient();
  if (!stripe) return stripeNotConfiguredResponse();

  try {
    const supabase = getAdminClient();
    const { data: jobs } = await supabase
      .from("billing_sync_outbox")
      .select("id, partner_id")
      .in("status", ["pending", "failed"])
      .lte("available_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(10);

    const addonPrice = await resolvePriceByLookupKey(stripe, ADDON_LOOKUP_KEY);
    if (!addonPrice) {
      return jsonResponse(409, { error: { code: "CATALOG_NOT_READY", message: "Catalogo Stripe ainda nao preparado." } });
    }

    let processed = 0;
    for (const job of jobs ?? []) {
      const { data: subscription } = await supabase
        .from("partner_subscriptions")
        .select("id, stripe_subscription_id")
        .eq("partner_id", job.partner_id)
        .in("status", ["trialing", "active", "past_due", "incomplete"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!subscription?.stripe_subscription_id) {
        await supabase.from("billing_sync_outbox").update({ processed_at: new Date().toISOString(), status: "succeeded" }).eq("id", job.id);
        continue;
      }

      const quantity = await activeClientCount(supabase, job.partner_id);
      const remoteSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id, {
        expand: ["items.data.price"],
      });
      const addonItem = remoteSubscription.items.data.find((item) => item.price.lookup_key === ADDON_LOOKUP_KEY);

      if (addonItem) {
        await stripe.subscriptionItems.update(addonItem.id, {
          proration_behavior: "none",
          quantity,
        });
      } else if (quantity > 0) {
        await stripe.subscriptionItems.create({
          price: addonPrice.id,
          proration_behavior: "none",
          quantity,
          subscription: subscription.stripe_subscription_id,
        });
      }

      await supabase.from("partner_subscriptions").update({
        active_client_quantity: quantity,
        last_quantity_synced_at: new Date().toISOString(),
      }).eq("id", subscription.id);

      await supabase.from("billing_active_client_snapshots").insert({
        active_client_quantity: quantity,
        amount_cents: quantity * ACTIVE_CLIENT_UNIT_CENTS,
        partner_id: job.partner_id,
        reason: "quantity_sync",
        stripe_subscription_id: subscription.stripe_subscription_id,
        subscription_id: subscription.id,
        unit_amount_cents: ACTIVE_CLIENT_UNIT_CENTS,
      });

      await supabase.from("billing_sync_outbox").update({
        processed_at: new Date().toISOString(),
        status: "succeeded",
      }).eq("id", job.id);
      processed += 1;
    }

    return jsonResponse(200, { processed });
  } catch (error) {
    console.error(JSON.stringify({ code: "BILLING_SYNC_ACTIVE_CLIENTS_FAILED", message: error instanceof Error ? error.message : "UNKNOWN" }));
    return jsonResponse(500, { error: { code: "SYNC_FAILED", message: "Nao foi possivel reconciliar Clientes ativos." } });
  }
});
