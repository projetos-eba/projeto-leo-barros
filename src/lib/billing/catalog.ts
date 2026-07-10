export const STRIPE_API_VERSION = "2026-06-24.dahlia";

export const BILLING_TRIAL_DAYS = 7;
export const ACTIVE_CLIENT_ADDON_UNIT_CENTS = 199;

export type BillingPlanSlug = "complete-monthly" | "complete-annual";

export type BillingPlan = {
  billingInterval: "monthly" | "yearly";
  displayPrice: string;
  equivalentMonthlyCents: number;
  lookupKey: string;
  name: string;
  priceCents: number;
  slug: BillingPlanSlug;
  stripeInterval: "month" | "year";
};

export const BILLING_PLANS: Record<BillingPlanSlug, BillingPlan> = {
  "complete-monthly": {
    billingInterval: "monthly",
    displayPrice: "R$ 119,90",
    equivalentMonthlyCents: 11990,
    lookupKey: "complete_monthly_brl",
    name: "Plano Completo - Nutricao + Treinamento",
    priceCents: 11990,
    slug: "complete-monthly",
    stripeInterval: "month",
  },
  "complete-annual": {
    billingInterval: "yearly",
    displayPrice: "R$ 99,90/mes",
    equivalentMonthlyCents: 9990,
    lookupKey: "complete_annual_brl",
    name: "Plano Completo - Nutricao + Treinamento",
    priceCents: 119880,
    slug: "complete-annual",
    stripeInterval: "year",
  },
};

export const ACTIVE_CLIENT_ADDON = {
  lookupKey: "active_client_monthly_brl",
  name: "Cliente ativo adicional",
  priceCents: ACTIVE_CLIENT_ADDON_UNIT_CENTS,
  slug: "active-client-monthly",
  stripeInterval: "month",
} as const;

export function isBillingPlanSlug(value: unknown): value is BillingPlanSlug {
  return value === "complete-monthly" || value === "complete-annual";
}

export function normalizeBillingPlanSlug(value: unknown): BillingPlanSlug {
  return isBillingPlanSlug(value) ? value : "complete-annual";
}
