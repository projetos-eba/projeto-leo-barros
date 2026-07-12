import { redirect } from "next/navigation";

import {
  ACTIVE_CLIENT_ADDON_UNIT_CENTS,
  BILLING_PLANS,
  BILLING_TRIAL_DAYS,
  type BillingPlanSlug,
} from "./catalog";
import { estimateBillingCents } from "./pricing";
import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

type PartnerSubscriptionRow = {
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  current_period_end: string;
  current_period_start: string;
  id: string;
  partner_id: string;
  plan_id: string;
  status: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  trial_end?: string | null;
  trial_start?: string | null;
};

type BillingPaymentRow = {
  amount_cents: number;
  due_at: string;
  id: string;
  paid_at: string | null;
  payment_kind: string;
  status: string;
};

type BillingPlanRow = {
  billing_interval: string;
  id: string;
  name: string;
  price_cents: number;
  slug: string;
};

type BillingFinancialSummaryRow = {
  active_client_quantity: number;
  active_client_subtotal_cents: number;
  active_client_unit_amount_cents: number;
  currency: string;
  discount_amount_cents: number;
  discount_code: string | null;
  discount_duration: string | null;
  discount_label: string | null;
  plan_base_amount_cents: number;
  source: string;
  stripe_invoice_id: string | null;
  stripe_subscription_id: string | null;
  subtotal_cents: number;
  synced_at: string;
  total_after_discount_cents: number;
};

export type PartnerBillingOverview = {
  activeClientCount: number;
  addonUnitCents: number;
  currentPlanSlug: BillingPlanSlug | null;
  estimate: ReturnType<typeof estimateBillingCents> | null;
  financialSummary: BillingFinancialSummaryRow | null;
  partnerId: string;
  payments: BillingPaymentRow[];
  plan: BillingPlanRow | null;
  stripeConfigured: boolean;
  subscription: PartnerSubscriptionRow | null;
  trialDays: number;
};

export function stripeIsConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.trim(),
  );
}

export async function requirePartnerBillingContext() {
  const { profile } = await getCurrentProfile();
  if (!profile || profile.role !== "parceiro" || profile.status !== "active") {
    redirect("/login/parceiros");
  }

  const supabase = await createClient();
  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!partner) {
    redirect("/login/parceiros?error=profile_unavailable");
  }

  return { partnerId: partner.id, profileId: profile.id, supabase };
}

export async function getBillableActiveClientCount(partnerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("billing_active_client_count", {
    target_partner_id: partnerId,
  });

  if (error || typeof data !== "number") {
    return 0;
  }

  return data;
}

export async function getPartnerBillingOverview(): Promise<PartnerBillingOverview> {
  const { partnerId, supabase } = await requirePartnerBillingContext();

  const activeClientCount = await getBillableActiveClientCount(partnerId);
  const { data: subscriptions } = await supabase
    .from("partner_subscriptions")
    .select("id, partner_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end, canceled_at, stripe_customer_id, stripe_subscription_id, trial_start, trial_end")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false })
    .limit(1);

  const subscription = (subscriptions?.[0] ?? null) as PartnerSubscriptionRow | null;
  const { data: plans } = await supabase
    .from("billing_plans")
    .select("id, slug, name, billing_interval, price_cents")
    .eq("is_active", true);

  const plan = subscription
    ? ((plans ?? []).find((candidate) => candidate.id === subscription.plan_id) as BillingPlanRow | undefined) ?? null
    : null;
  const currentPlanSlug = plan?.slug === "complete-monthly" || plan?.slug === "complete-annual"
    ? plan.slug
    : null;

  const { data: payments } = subscription
    ? await supabase
        .from("billing_payments")
        .select("id, amount_cents, status, payment_kind, due_at, paid_at")
        .eq("subscription_id", subscription.id)
        .order("due_at", { ascending: false })
        .limit(8)
    : { data: [] };

  const { data: financialSummary } = subscription
    ? await supabase
        .from("partner_subscription_financial_summaries")
        .select("active_client_quantity, active_client_subtotal_cents, active_client_unit_amount_cents, currency, discount_amount_cents, discount_code, discount_duration, discount_label, plan_base_amount_cents, source, stripe_invoice_id, stripe_subscription_id, subtotal_cents, synced_at, total_after_discount_cents")
        .eq("subscription_id", subscription.id)
        .maybeSingle()
    : { data: null };

  return {
    activeClientCount,
    addonUnitCents: ACTIVE_CLIENT_ADDON_UNIT_CENTS,
    currentPlanSlug,
    estimate: currentPlanSlug ? estimateBillingCents({ activeClientCount, planSlug: currentPlanSlug }) : null,
    financialSummary: financialSummary as BillingFinancialSummaryRow | null,
    partnerId,
    payments: (payments ?? []) as BillingPaymentRow[],
    plan,
    stripeConfigured: stripeIsConfigured(),
    subscription,
    trialDays: BILLING_TRIAL_DAYS,
  };
}

export function getPublicPlans() {
  return Object.values(BILLING_PLANS);
}
