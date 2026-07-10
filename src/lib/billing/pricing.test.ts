import { describe, expect, it } from "vitest";

import { annualSavingsPercent, estimateBillingCents, formatCurrencyCents } from "./pricing";

describe("billing pricing", () => {
  it("calcula mensal com adicional por cliente ativo", () => {
    expect(estimateBillingCents({ activeClientCount: 10, planSlug: "complete-monthly" })).toMatchObject({
      addonCents: 1990,
      cycleCents: 13980,
      monthlyEquivalentCents: 13980,
      planCents: 11990,
    });
  });

  it("calcula anual usando cobranca anual real e equivalente mensal", () => {
    expect(estimateBillingCents({ activeClientCount: 2, planSlug: "complete-annual" })).toMatchObject({
      addonCents: 398,
      cycleCents: 120278,
      monthlyEquivalentCents: 10388,
      planCents: 119880,
    });
  });

  it("formata BRL e usa desconto real aproximado", () => {
    expect(formatCurrencyCents(119880)).toBe("R$ 1.198,80");
    expect(annualSavingsPercent()).toBe(16.7);
  });
});
