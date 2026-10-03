import {
  addDietTotals,
  type DietNutritionTotals,
  type PartnerClientDietMeal,
} from "./client-diet-metrics";

export const ENERGY_BALANCE_IDEAL_TOLERANCE_PERCENT = 5;
export const ENERGY_BALANCE_GAUGE_LIMIT_PERCENT = 30;

const zeroTotals: DietNutritionTotals = {
  carbs: 0,
  fat: 0,
  fiber: 0,
  kcal: 0,
  protein: 0,
  sodium: 0,
};

export type DietSummaryInput = {
  fiberTargetMaxG: number | null;
  fiberTargetMinG: number | null;
  getKcal: number | null;
  meals: PartnerClientDietMeal[];
  weightKg: number | null;
};

export type DietSummaryData = {
  balance: {
    kcal: number | null;
    label: "Déficit" | "Equilíbrio" | "Superávit" | "Indisponível";
    percent: number | null;
  };
  getKcal: number | null;
  fiberGoal: {
    maxG: number | null;
    minG: number | null;
  };
  gauge: {
    idealEndPercent: number;
    idealStartPercent: number;
    vetMarkerPercent: number | null;
  };
  hasFoods: boolean;
  meals: Array<{
    id: string;
    kcal: number;
    percent: number | null;
    title: string;
  }>;
  totals: DietNutritionTotals;
  weightKg: number | null;
};

function finiteNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function positiveNumber(value: number | null | undefined) {
  const normalized = finiteNumber(value);
  return normalized !== null && normalized > 0 ? normalized : null;
}

function nonNegativeNumber(value: number | null | undefined) {
  const normalized = finiteNumber(value);
  return normalized !== null && normalized >= 0 ? normalized : null;
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function sumDietMealTotals(meals: PartnerClientDietMeal[]) {
  return meals.reduce((total, meal) => addDietTotals(total, meal.totals), zeroTotals);
}

export function buildDietSummary(input: DietSummaryInput): DietSummaryData {
  const totals = sumDietMealTotals(input.meals);
  const getKcal = positiveNumber(input.getKcal);
  const vetKcal = positiveNumber(totals.kcal) ?? 0;
  const balanceKcal = getKcal === null ? null : Math.round(vetKcal - getKcal);
  const balancePercent = balanceKcal === null || getKcal === null ? null : roundOne((balanceKcal / getKcal) * 100);
  const label = balancePercent === null
    ? "Indisponível"
    : Math.abs(balancePercent) <= ENERGY_BALANCE_IDEAL_TOLERANCE_PERCENT
      ? "Equilíbrio"
      : balancePercent < 0 ? "Déficit" : "Superávit";
  const idealStartPercent = ((ENERGY_BALANCE_GAUGE_LIMIT_PERCENT - ENERGY_BALANCE_IDEAL_TOLERANCE_PERCENT) / (ENERGY_BALANCE_GAUGE_LIMIT_PERCENT * 2)) * 100;
  const idealEndPercent = ((ENERGY_BALANCE_GAUGE_LIMIT_PERCENT + ENERGY_BALANCE_IDEAL_TOLERANCE_PERCENT) / (ENERGY_BALANCE_GAUGE_LIMIT_PERCENT * 2)) * 100;

  return {
    balance: { kcal: balanceKcal, label, percent: balancePercent },
    fiberGoal: {
      maxG: nonNegativeNumber(input.fiberTargetMaxG),
      minG: nonNegativeNumber(input.fiberTargetMinG),
    },
    getKcal,
    gauge: {
      idealEndPercent,
      idealStartPercent,
      vetMarkerPercent: balancePercent === null
        ? null
        : 50 + (clamp(balancePercent, -ENERGY_BALANCE_GAUGE_LIMIT_PERCENT, ENERGY_BALANCE_GAUGE_LIMIT_PERCENT) / (ENERGY_BALANCE_GAUGE_LIMIT_PERCENT * 2)) * 100,
    },
    hasFoods: input.meals.some((meal) => meal.items.length > 0),
    meals: input.meals.map((meal) => ({
      id: meal.id,
      kcal: Math.max(0, Math.round(finiteNumber(meal.totals.kcal) ?? 0)),
      percent: vetKcal > 0 ? roundOne((Math.max(0, finiteNumber(meal.totals.kcal) ?? 0) / vetKcal) * 100) : null,
      title: meal.title,
    })),
    totals,
    weightKg: positiveNumber(input.weightKg),
  };
}

export function macroEnergyPercent(grams: number, kcalPerGram: 4 | 9, vetKcal: number) {
  const normalizedGrams = positiveNumber(grams) ?? 0;
  const normalizedVet = positiveNumber(vetKcal);
  return normalizedVet === null ? null : roundOne((normalizedGrams * kcalPerGram / normalizedVet) * 100);
}

export function macroGramsPerKg(grams: number, weightKg: number | null) {
  const normalizedWeight = positiveNumber(weightKg);
  const normalizedGrams = positiveNumber(grams) ?? 0;
  return normalizedWeight === null ? null : roundOne(normalizedGrams / normalizedWeight);
}
