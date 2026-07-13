import {
  ACTIVE_CLIENT_UNIT_CENTS,
  activeClientCount,
  ADDON_LOOKUP_KEY,
  forbiddenOriginResponse,
  getAdminClient,
  getStripeClient,
  getValidatedBillingCatalog,
  jsonResponse,
  optionsResponse,
  originIsAllowed,
  requireServiceRoleRequest,
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
  const internalAccess = requireServiceRoleRequest(request);
  if ("error" in internalAccess) return internalAccess.error as Response;

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

    const { addonPrice } = await getValidatedBillingCatalog(stripe);

    let processed = 0;
    let processedPartners = 0;
    const jobsByPartner = new Map<string, string[]>();
    for (const job of jobs ?? []) {
      const jobIds = jobsByPartner.get(job.partner_id) ?? [];
      jobIds.push(job.id);
      jobsByPartner.set(job.partner_id, jobIds);
    }

    for (const [partnerId, jobIds] of jobsByPartner) {
      const { data: subscription } = await supabase
        .from("partner_subscriptions")
        .select("id, stripe_subscription_id")
        .eq("partner_id", partnerId)
        .in("status", ["trialing", "active", "past_due", "incomplete"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!subscription?.stripe_subscription_id) {
        await supabase.from("billing_sync_outbox").update({
          processed_at: new Date().toISOString(),
          status: "succeeded",
        }).in("id", jobIds);
        processed += jobIds.length;
        continue;
      }

      const quantity = await activeClientCount(supabase, partnerId);
      const remoteSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id,
        {
          expand: ["items.data.price"],
        },
      );
      let addonItem = remoteSubscription.items.data.find((item) =>
        item.price.lookup_key === ADDON_LOOKUP_KEY
      );

      if (addonItem) {
        addonItem = await stripe.subscriptionItems.update(addonItem.id, {
          proration_behavior: "none",
          quantity,
        });
      } else if (quantity > 0) {
        addonItem = await stripe.subscriptionItems.create({
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

      await supabase.from("partner_subscription_items").update({
        quantity,
        stripe_subscription_item_id: addonItem?.id ?? null,
        unit_amount_cents: ACTIVE_CLIENT_UNIT_CENTS,
      }).eq("subscription_id", subscription.id).eq(
        "item_kind",
        "active_client_addon",
      );

      await supabase.from("billing_active_client_snapshots").insert({
        active_client_quantity: quantity,
        amount_cents: quantity * ACTIVE_CLIENT_UNIT_CENTS,
        partner_id: partnerId,
        reason: "quantity_sync",
        stripe_subscription_id: subscription.stripe_subscription_id,
        subscription_id: subscription.id,
        unit_amount_cents: ACTIVE_CLIENT_UNIT_CENTS,
      });

      await supabase.from("billing_sync_outbox").update({
        processed_at: new Date().toISOString(),
        status: "succeeded",
      }).in("id", jobIds);
      processed += jobIds.length;
      processedPartners += 1;
    }

    return jsonResponse(200, { processed, processedPartners }, request);
  } catch (error) {
    console.error(
      JSON.stringify({
        code: "BILLING_SYNC_ACTIVE_CLIENTS_FAILED",
        message: error instanceof Error ? error.message : "UNKNOWN",
      }),
    );
    return jsonResponse(500, {
      error: {
        code: "SYNC_FAILED",
        message: "Nao foi possivel reconciliar Clientes ativos.",
      },
    }, request);
  }
});
