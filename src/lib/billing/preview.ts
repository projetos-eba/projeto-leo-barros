import type { BillingPlanSlug } from "./catalog";

export type BillingPromotionPreview = {
  activeClients: {
    quantity: number;
    subtotalCents: number;
    unitAmountCents: number;
  };
  plan: {
    baseAmountCents: number;
    slug: BillingPlanSlug;
  };
  promotion: {
    code: string;
    discountCents: number;
    duration: string;
    label: string;
  };
  subtotalCents: number;
  totalAfterDiscountCents: number;
};

export type BillingCheckoutSummary = {
  activeClientCount: number;
  addonCents: number;
  addonUnitCents: number;
  billingInterval: "monthly" | "yearly";
  cycleCents: number;
  monthlyEquivalentCents: number;
  planCents: number;
  planSlug: BillingPlanSlug;
};
