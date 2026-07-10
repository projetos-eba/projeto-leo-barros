import {
  ACTIVE_CLIENT_UNIT_CENTS,
  getAdminClient,
  getStripeClient,
  jsonResponse,
  stripeNotConfiguredResponse,
} from "../_shared/billing/stripe.ts";

type StripeInvoiceEvent = {
  amount_due?: number;
  amount_paid?: number;
  currency?: string;
  customer?: string;
  due_date?: number | null;
  id: string;
  payment_intent?: string | { id?: string } | null;
  subscription?: string | { id?: string } | null;
  total?: number;
};

function stripeId(value: string | { id?: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

const handledEvents = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.finalized",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
]);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") {
    return jsonResponse(405, { error: { code: "METHOD_NOT_ALLOWED", message: "Metodo nao permitido." } }, request);
  }

  const stripe = getStripeClient();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim();
  if (!stripe || !webhookSecret) return stripeNotConfiguredResponse();

  let stripeEventId: string | null = null;

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature") ?? "";
    const event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    stripeEventId = event.id;
    const supabase = getAdminClient();

    if (event.livemode) {
      throw new Error(`LIVE_MODE_OBJECT:${event.id}`);
    }

    const { error: ledgerError } = await supabase.from("stripe_webhook_events").insert({
      api_version: event.api_version ?? null,
      event_type: event.type,
      livemode: event.livemode,
      payload_summary: { object: event.data.object.object, stripe_created: event.created },
      status: handledEvents.has(event.type) ? "processing" : "ignored",
      stripe_event_created_at: new Date(event.created * 1000).toISOString(),
      stripe_event_id: event.id,
    });

    if (ledgerError?.code === "23505") {
      return jsonResponse(200, { duplicate: true, received: true }, request);
    }
    if (ledgerError) throw ledgerError;

    if (!handledEvents.has(event.type)) {
      await supabase.from("stripe_webhook_events").update({
        processed_at: new Date().toISOString(),
        status: "ignored",
      }).eq("stripe_event_id", event.id);
      return jsonResponse(200, { ignored: true, received: true }, request);
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as { id: string; status?: string; customer?: string; metadata?: { partner_id?: string }; current_period_start?: number; current_period_end?: number; trial_start?: number | null; trial_end?: number | null; cancel_at_period_end?: boolean; canceled_at?: number | null };
      const partnerId = subscription.metadata?.partner_id;
      if (partnerId) {
        const { data: currentSubscription } = await supabase
          .from("partner_subscriptions")
          .select("id, stripe_last_event_created_at")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();

        const previousEventAt = currentSubscription?.stripe_last_event_created_at
          ? new Date(currentSubscription.stripe_last_event_created_at).getTime()
          : 0;
        const eventAt = event.created * 1000;
        if (previousEventAt > eventAt) {
          await supabase.from("stripe_webhook_events").update({
            payload_summary: { object: event.data.object.object, decision: "ignored_out_of_order", stripe_created: event.created },
            processed_at: new Date().toISOString(),
            status: "ignored",
          }).eq("stripe_event_id", event.id);
          return jsonResponse(200, { ignored: true, outOfOrder: true, received: true }, request);
        }

        await supabase.from("partner_subscriptions").update({
          cancel_at_period_end: subscription.cancel_at_period_end ?? false,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : undefined,
          current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : undefined,
          current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : undefined,
          ended_at: event.type === "customer.subscription.deleted" ? new Date().toISOString() : undefined,
          status: subscription.status ?? "incomplete",
          stripe_last_event_created_at: new Date(eventAt).toISOString(),
          stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : undefined,
          stripe_status: subscription.status,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        }).eq("stripe_subscription_id", subscription.id);
      }
    }

    if (event.type === "invoice.finalized") {
      const invoice = event.data.object as { id: string; subscription?: string; customer?: string; total?: number; metadata?: { partner_id?: string } };
      const { data: localSubscription } = await supabase
        .from("partner_subscriptions")
        .select("id, partner_id, active_client_quantity")
        .eq("stripe_subscription_id", invoice.subscription)
        .maybeSingle();

      if (localSubscription) {
        await supabase.from("billing_active_client_snapshots").insert({
          active_client_quantity: localSubscription.active_client_quantity ?? 0,
          amount_cents: (localSubscription.active_client_quantity ?? 0) * ACTIVE_CLIENT_UNIT_CENTS,
          partner_id: localSubscription.partner_id,
          reason: "invoice_finalized",
          stripe_invoice_id: invoice.id,
          stripe_subscription_id: typeof invoice.subscription === "string" ? invoice.subscription : null,
          subscription_id: localSubscription.id,
          unit_amount_cents: ACTIVE_CLIENT_UNIT_CENTS,
        });
      }
    }

    if (event.type === "invoice.paid" || event.type === "invoice.payment_failed" || event.type === "invoice.payment_action_required") {
      const invoice = event.data.object as StripeInvoiceEvent;
      const subscriptionId = stripeId(invoice.subscription);
      const paymentIntentId = stripeId(invoice.payment_intent);
      const { data: localSubscription } = subscriptionId
        ? await supabase
            .from("partner_subscriptions")
            .select("id, partner_id")
            .eq("stripe_subscription_id", subscriptionId)
            .maybeSingle()
        : { data: null };

      if (localSubscription) {
        await supabase.from("partner_subscriptions").update({
          latest_invoice_id: invoice.id,
          status: event.type === "invoice.paid" ? "active" : "past_due",
        }).eq("id", localSubscription.id);

        if (paymentIntentId) {
          const paid = event.type === "invoice.paid";
          await supabase.from("billing_payments").upsert({
            amount_cents: paid ? invoice.amount_paid ?? invoice.total ?? 0 : invoice.amount_due ?? invoice.total ?? 0,
            currency: invoice.currency ?? "brl",
            due_at: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : new Date().toISOString(),
            paid_at: paid ? new Date().toISOString() : null,
            partner_id: localSubscription.partner_id,
            payment_kind: "renewal",
            status: paid ? "succeeded" : event.type === "invoice.payment_failed" ? "failed" : "pending",
            stripe_payment_intent_id: paymentIntentId,
            subscription_id: localSubscription.id,
          }, {
            onConflict: "stripe_payment_intent_id",
          });
        }
      }
    }

    await supabase.from("stripe_webhook_events").update({
      processed_at: new Date().toISOString(),
      status: "succeeded",
    }).eq("stripe_event_id", event.id);

    return jsonResponse(200, { received: true }, request);
  } catch (error) {
    console.error(JSON.stringify({ code: "STRIPE_WEBHOOK_FAILED", message: error instanceof Error ? error.message : "UNKNOWN" }));
    if (stripeEventId) {
      try {
        const supabase = getAdminClient();
        await supabase.from("stripe_webhook_events").update({
          last_error_code: "WEBHOOK_PROCESSING_FAILED",
          last_error_message: error instanceof Error ? error.message.slice(0, 240) : "UNKNOWN",
          processed_at: new Date().toISOString(),
          status: "failed",
        }).eq("stripe_event_id", stripeEventId);
      } catch {
        // Preserve the safe public response when ledger failure handling itself fails.
      }
      return jsonResponse(500, { error: { code: "WEBHOOK_PROCESSING_FAILED", message: "Webhook recebido, mas nao processado." } }, request);
    }
    return jsonResponse(400, { error: { code: "WEBHOOK_SIGNATURE_INVALID", message: "Webhook invalido." } }, request);
  }
});
