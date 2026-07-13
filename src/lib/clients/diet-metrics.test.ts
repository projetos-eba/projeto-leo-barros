import { describe, expect, it } from "vitest";

import { buildClientDiet, type ClientDietRawData } from "./diet-metrics";

const raw: ClientDietRawData = {
  client: {
    avatarUrl: "/avatars/ana-ribeiro-seed.png",
    id: "a1000000-0000-4000-8000-000000000301",
    name: "Ana Ribeiro",
    objective: "Hipertrofia",
  },
  dailyLog: { waterMl: 750 },
  generatedAt: "2026-07-03T12:00:00.000Z",
  mealLogs: [
    {
      completedAt: "2026-07-03T10:10:00.000Z",
      mealId: "meal-breakfast",
      notes: "Boa adesão.",
      photoMimeType: null,
      photoOriginalFilename: null,
      photoStoragePath: null,
      status: "completed",
    },
  ],
  plan: {
    calorieStrategy: "surplus",
    id: "plan-1",
    meals: [
      {
        id: "meal-breakfast",
        items: [
          { carbsG: 20, fatG: 2, foodId: null, householdMeasure: null, id: "item-1", kcal: 118, name: "Aveia", proteinG: 4, quantity: 40, quantityUnit: "g", sortOrder: 0 },
        ],
        mealTime: "07:00",
        sortOrder: 0,
        title: "Café da manhã",
      },
      {
        id: "meal-lunch",
        items: [
          { carbsG: 0, fatG: 3.6, fiberG: 0, foodId: null, householdMeasure: null, id: "item-2", kcal: 165, name: "Frango grelhado", proteinG: 31, quantity: 150, quantityUnit: "g", sortOrder: 0 },
          { carbsG: 28, fatG: 0.2, fiberG: 1.6, foodId: null, householdMeasure: null, id: "item-3", kcal: 130, name: "Arroz", proteinG: 2.5, quantity: 150, quantityUnit: "g", sortOrder: 1 },
        ],
        mealTime: "12:30",
        sortOrder: 1,
        title: "Almoço",
      },
    ],
    partnerId: "partner-1",
    sentAt: null,
    status: "published",
    targetCarbsG: 240,
    targetFatG: 70,
    targetKcal: 2200,
    targetProteinG: 180,
    title: "Dieta de definição",
    updatedAt: "2026-07-02T12:00:00.000Z",
    waterLiters: 2,
  },
  selectedDate: "2026-07-03",
  suggestions: [
    { carbsG: 20, category: "cereal", fatG: 1, fiberG: 3, id: "food-1", kcal: 130, name: "Batata-doce", proteinG: 2, servingSize: 100, servingUnit: "g" },
  ],
  substitutions: [
    {
      appliedAt: "2026-07-03T12:00:00.000Z",
      foodId: "food-1",
      itemId: "item-3",
      mealId: "meal-lunch",
      replacementCarbsG: 20,
      replacementFatG: 1,
      replacementFiberG: 3,
      replacementKcal: 130,
      replacementName: "Batata-doce",
      replacementProteinG: 2,
      replacementServingSize: 100,
      replacementServingUnit: "g",
    },
  ],
  weekLogs: [
    { completedMeals: 1, consumedKcal: 400, date: "2026-06-27", totalMeals: 4, waterMl: 2000 },
    { completedMeals: 2, consumedKcal: 800, date: "2026-06-28", totalMeals: 4, waterMl: 2200 },
    { completedMeals: 0, consumedKcal: 0, date: "2026-06-29", totalMeals: 4, waterMl: 1000 },
    { completedMeals: 3, consumedKcal: 1200, date: "2026-06-30", totalMeals: 4, waterMl: 2500 },
    { completedMeals: 1, consumedKcal: 500, date: "2026-07-01", totalMeals: 4, waterMl: 1500 },
    { completedMeals: 4, consumedKcal: 1900, date: "2026-07-02", totalMeals: 4, waterMl: 3000 },
    { completedMeals: 1, consumedKcal: 118, date: "2026-07-03", totalMeals: 4, waterMl: 750 },
  ],
};

describe("buildClientDiet", () => {
  it("calcula próxima refeição, progresso e hidratação do Cliente", () => {
    const diet = buildClientDiet(raw, new Date("2026-07-03T11:00:00.000Z"));

    expect(diet.client.firstName).toBe("Ana");
    expect(diet.nextMeal?.title).toBe("Almoço");
    expect(diet.progress.consumed.kcal).toBe(118);
    expect(diet.progress.remainingKcal).toBe(2082);
    expect(diet.hydration.label).toBe("0,8L / 2L");
    expect(diet.hydration.remainingCups).toBe(5);
    expect(diet.week.adherenceDays).toBe(6);
    expect(diet.week.registeredMeals).toBe(12);
    expect(diet.suggestions[0]?.name).toBe("Batata-doce");
    expect(diet.meals[1]?.items[1]?.name).toBe("Batata-doce");
    expect(diet.meals[1]?.items[1]?.replacementLabel).toBe("Substitui Arroz");
    expect(diet.meals[1]?.totals.fiber).toBe(3);
  });
});
