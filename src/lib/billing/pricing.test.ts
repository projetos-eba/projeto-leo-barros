import { describe, expect, it } from "vitest";

import {
  annualSavingsPercent,
  annualSavingsPercentFromPrices,
  estimateBillingCents,
  estimateBillingCentsFromCatalog,
  formatCurrencyCents,
  monthlyEquivalentCents,
} from "./pricing";

describe("billing pricing", () => {
  it("mantem adicional zerado quando Parceiro nao tem Clientes ativos", () => {
    expect(estimateBillingCents({ activeClientCount: 0, planSlug: "complete-monthly" })).toMatchObject({
      addonCents: 0,
      cycleCents: 11990,
      monthlyEquivalentCents: 11990,
      planCents: 11990,
    });

    expect(estimateBillingCents({ activeClientCount: 0, planSlug: "complete-annual" })).toMatchObject({
      addonCents: 0,
      cycleCents: 119880,
      monthlyEquivalentCents: 9990,
      planCents: 119880,
    });
  });

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

  it("calcula valores a partir do catalogo sincronizado", () => {
    expect(monthlyEquivalentCents({ billingInterval: "yearly", priceCents: 144000 })).toBe(12000);
    expect(estimateBillingCentsFromCatalog({
      activeClientCount: 3,
      addonUnitCents: 250,
      billingInterval: "yearly",
      planPriceCents: 144000,
    })).toMatchObject({
      addonCents: 750,
      cycleCents: 144750,
      monthlyEquivalentCents: 12750,
      planCents: 144000,
    });
    expect(annualSavingsPercentFromPrices({
      annualPriceCents: 144000,
      monthlyPriceCents: 15000,
    })).toBe(20);
  });
});
