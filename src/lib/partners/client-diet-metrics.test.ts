import { describe, expect, it } from "vitest";

import {
  buildPartnerClientDiet,
  macroDistribution,
  scaleDietNutrition,
  type PartnerClientDietRawData,
} from "./client-diet-metrics";

const food = {
  carbsG: 28.1,
  category: "cereal",
  fatG: 0.2,
  fiberG: 1.6,
  householdMeasure: "4 colheres de sopa",
  id: "food-1",
  kcal: 130,
  name: "Arroz branco cozido",
  proteinG: 2.5,
  servingSize: 100,
  servingUnit: "g",
  sodiumMg: 1,
  source: "taco",
  suggestedUses: ["refeicao_principal"],
  tags: ["carboidrato"],
  updatedAt: "2026-07-01T12:00:00.000Z",
  usageCount: 42,
};

const raw: PartnerClientDietRawData = {
  drafts: [{ createdAt: "2026-07-01T12:00:00.000Z", food, id: "draft-1", notes: "Usar no almoço" }],
  events: [{ actorName: "Dr. Leo", createdAt: "2026-07-01T12:30:00.000Z", detail: "Dieta criada", eventType: "created", id: "event-1", version: 1 }],
  foods: [food],
  generatedAt: "2026-07-01T13:00:00.000Z",
  plan: {
    calorieStrategy: "surplus",
    createdAt: "2026-06-20T12:00:00.000Z",
    id: "plan-1",
    meals: [
      {
        dayOfWeek: 1,
        id: "meal-1",
        items: [
          {
            foodId: "food-1",
            householdMeasure: "4 colheres de sopa",
            id: "item-1",
            quantity: 150,
            quantityUnit: "g",
            snapshotCarbsG: 28.1,
            snapshotFatG: 0.2,
            snapshotFiberG: 1.6,
            snapshotKcal: 130,
            snapshotName: "Arroz branco cozido",
            snapshotProteinG: 2.5,
            snapshotServingSize: 100,
            snapshotServingUnit: "g",
            snapshotSodiumMg: 1,
            sortOrder: 0,
          },
        ],
        mealTime: "12:30",
        sortOrder: 0,
        title: "Almoço",
      },
    ],
    notes: "Priorizar alimentos naturais.",
    publishedAt: null,
    sentAt: null,
    status: "published",
    targetCarbsG: 240,
    targetFatG: 70,
    targetKcal: 2450,
    targetProteinG: 190,
    title: "Dieta de definição",
    updatedAt: "2026-07-01T12:00:00.000Z",
    version: 2,
    waterLiters: 3,
  },
};

describe("client-diet-metrics", () => {
  it("escala macros pela porção informada", () => {
    expect(scaleDietNutrition({ carbs: 28, fat: 1, fiber: 2, kcal: 130, protein: 3, servingSize: 100, sodium: 5 }, 150)).toEqual({
      carbs: 42,
      fat: 1.5,
      fiber: 3,
      kcal: 195,
      protein: 4.5,
      sodium: 7.5,
    });
  });

  it("calcula distribuição de macros por kcal estimada", () => {
    expect(macroDistribution({ carbs: 240, fat: 70, fiber: 20, kcal: 2450, protein: 190, sodium: 0 })).toEqual({
      carbsPct: 41,
      fatPct: 27,
      proteinPct: 32,
    });
  });

  it("monta plano, biblioteca e rascunhos para a aba Dietas", () => {
    const data = buildPartnerClientDiet(raw);

    expect(data.plan?.title).toBe("Dieta de definição");
    expect(data.plan?.weekDays[0].meals[0].totals).toMatchObject({ kcal: 195, carbs: 42.2, protein: 3.8 });
    expect(data.library.suggestions[0].name).toBe("Arroz branco cozido");
    expect(data.drafts[0].notes).toBe("Usar no almoço");
    expect(data.events[0].detail).toBe("Dieta criada");
  });
});
