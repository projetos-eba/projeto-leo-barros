import { describe, expect, it } from "vitest";

import {
  buildDietSummary,
  ENERGY_BALANCE_IDEAL_TOLERANCE_PERCENT,
  macroEnergyPercent,
  macroGramsPerKg,
} from "./client-diet-summary";
import type { PartnerClientDietMeal } from "./client-diet-metrics";

function meal(id: string, title: string, kcal: number): PartnerClientDietMeal {
  return {
    alternativeOrder: 1,
    dayOfWeek: 1,
    id,
    items: kcal > 0 ? [{ carbs: 0, fat: 0, fiber: 0, foodId: null, householdMeasure: null, id: `${id}-item`, kcal, name: title, protein: 0, quantity: 1, quantityLabel: "1 g", quantityUnit: "g", sodium: 0, sortOrder: 0 }] : [],
    mealTime: "12:00",
    mealGroupId: id,
    menuOption: 1,
    optionLabel: "Cardápio 1",
    sortOrder: 0,
    title,
    totals: { carbs: 0, fat: 0, fiber: 0, kcal, protein: 0, sodium: 0 },
  };
}

describe("client-diet-summary", () => {
  it("calcula déficit, percentual e marcador limitado na escala", () => {
    const summary = buildDietSummary({
      fiberTargetMaxG: 30,
      fiberTargetMinG: 25,
      getKcal: 2420,
      meals: [meal("breakfast", "Café da manhã", 2180)],
      weightKg: 76,
    });

    expect(summary.balance).toEqual({ kcal: -240, label: "Déficit", percent: -9.9 });
    expect(summary.gauge.vetMarkerPercent).toBeCloseTo(33.5, 1);
  });

  it("trata a tolerância central como equilíbrio", () => {
    const summary = buildDietSummary({ fiberTargetMaxG: null, fiberTargetMinG: null, getKcal: 2000, meals: [meal("meal", "Almoço", 2099)], weightKg: 80 });

    expect(ENERGY_BALANCE_IDEAL_TOLERANCE_PERCENT).toBe(5);
    expect(summary.balance.label).toBe("Equilíbrio");
    expect(summary.balance.percent).toBe(5);
  });

  it("calcula g/kg e percentuais energéticos a partir do VET", () => {
    expect(macroGramsPerKg(137, 76)).toBe(1.8);
    expect(macroEnergyPercent(137, 4, 2180)).toBe(25.1);
    expect(macroEnergyPercent(258, 4, 2180)).toBe(47.3);
    expect(macroEnergyPercent(68, 9, 2180)).toBe(28.1);
    expect(macroGramsPerKg(137, null)).toBeNull();
    expect(macroEnergyPercent(137, 4, 0)).toBeNull();
  });

  it("distribui calorias de qualquer quantidade de refeições", () => {
    const summary = buildDietSummary({
      fiberTargetMaxG: 30,
      fiberTargetMinG: 25,
      getKcal: null,
      meals: [meal("a", "Café da manhã", 436), meal("b", "Almoço", 765), meal("c", "Lanche", 325), meal("d", "Jantar", 654)],
      weightKg: 76,
    });

    expect(summary.totals.kcal).toBe(2180);
    expect(summary.meals.map((item) => item.percent)).toEqual([20, 35.1, 14.9, 30]);
  });

  it("não produz percentuais inválidos sem GET, peso ou calorias", () => {
    const summary = buildDietSummary({ fiberTargetMaxG: null, fiberTargetMinG: null, getKcal: null, meals: [meal("empty", "Ceia", 0)], weightKg: null });

    expect(summary.balance).toEqual({ kcal: null, label: "Indisponível", percent: null });
    expect(summary.gauge.vetMarkerPercent).toBeNull();
    expect(summary.meals[0]?.percent).toBeNull();
    expect(summary.hasFoods).toBe(false);
  });
});
