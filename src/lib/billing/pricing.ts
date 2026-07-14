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

export function monthlyEquivalentCents({
  billingInterval,
  priceCents,
}: {
  billingInterval: "monthly" | "yearly" | string;
  priceCents: number;
}) {
  return billingInterval === "yearly" ? Math.round(priceCents / 12) : priceCents;
}

export function estimateBillingCentsFromCatalog({
  activeClientCount,
  addonUnitCents,
  billingInterval,
  planPriceCents,
}: {
  activeClientCount: number;
  addonUnitCents: number;
  billingInterval: "monthly" | "yearly" | string;
  planPriceCents: number;
}) {
  const addonCents = Math.max(0, activeClientCount) * Math.max(0, addonUnitCents);
  return {
    addonCents,
    cycleCents: planPriceCents + addonCents,
    monthlyEquivalentCents:
      monthlyEquivalentCents({ billingInterval, priceCents: planPriceCents }) +
      addonCents,
    planCents: planPriceCents,
  };
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

export function annualSavingsPercentFromPrices({
  annualPriceCents,
  monthlyPriceCents,
}: {
  annualPriceCents: number;
  monthlyPriceCents: number;
}) {
  if (monthlyPriceCents <= 0 || annualPriceCents <= 0) return 0;
  const yearlyMonthly = monthlyPriceCents * 12;
  return Math.max(
    0,
    Math.round(((yearlyMonthly - annualPriceCents) / yearlyMonthly) * 1000) /
      10,
  );
}
