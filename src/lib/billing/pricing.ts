import {
  ACTIVE_CLIENT_ADDON_UNIT_CENTS,
  BILLING_PLANS,
  type BillingPlanSlug,
} from "./catalog";

export function formatCurrencyCents(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
    style: "currency",
  }).format(value / 100);
}

export function monthlyizePlanCents(planSlug: BillingPlanSlug) {
  return BILLING_PLANS[planSlug].equivalentMonthlyCents;
}

export function estimateBillingCents({
  activeClientCount,
  planSlug,
}: {
  activeClientCount: number;
  planSlug: BillingPlanSlug;
}) {
  const plan = BILLING_PLANS[planSlug];
  const addonCents = Math.max(0, activeClientCount) * ACTIVE_CLIENT_ADDON_UNIT_CENTS;
  return {
    addonCents,
    cycleCents: plan.priceCents + addonCents,
    monthlyEquivalentCents: plan.equivalentMonthlyCents + addonCents,
    planCents: plan.priceCents,
  };
}

export function annualSavingsPercent() {
  const monthly = BILLING_PLANS["complete-monthly"].priceCents * 12;
  const annual = BILLING_PLANS["complete-annual"].priceCents;
  return Math.round(((monthly - annual) / monthly) * 1000) / 10;
}
