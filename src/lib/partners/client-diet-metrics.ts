import { foodCategoryLabels, foodSourceLabels, type PartnerProtocolFoodCategory, type PartnerProtocolFoodSource } from "./protocols-metrics";

export type DietPlanStatus = "archived" | "draft" | "published" | "sent";
export type DietCalorieStrategy = "deficit" | "maintenance" | "surplus";
export type DietFoodTab = "favorites" | "recent" | "suggestions";

export type PartnerClientDietFoodRecord = {
  carbsG: number;
  category: string;
  fatG: number;
  fiberG: number;
  householdMeasure: string | null;
  id: string;
  kcal: number;
  name: string;
  proteinG: number;
  servingSize: number;
  servingUnit: string;
  sodiumMg: number;
  source: string;
  suggestedUses: string[];
  tags: string[];
  updatedAt: string;
  usageCount: number;
};

export type PartnerClientDietRawData = {
  drafts: Array<{
    createdAt: string;
    food: PartnerClientDietFoodRecord;
    id: string;
    notes: string | null;
  }>;
  events: Array<{
    actorName: string | null;
    createdAt: string;
    detail: string;
    eventType: string;
    id: string;
    version: number;
  }>;
  foods: PartnerClientDietFoodRecord[];
  generatedAt: string;
  plan: {
    calorieStrategy: string;
    createdAt: string;
    id: string;
    meals: Array<{
      dayOfWeek: number;
      id: string;
      items: Array<{
        foodId: string | null;
        householdMeasure: string | null;
        id: string;
        quantity: number;
        quantityUnit: string;
        snapshotCarbsG: number;
        snapshotFatG: number;
        snapshotFiberG: number;
        snapshotKcal: number;
        snapshotName: string;
        snapshotProteinG: number;
        snapshotServingSize: number;
        snapshotServingUnit: string;
        snapshotSodiumMg: number;
        sortOrder: number;
      }>;
      mealTime: string;
      sortOrder: number;
      title: string;
    }>;
    notes: string | null;
    publishedAt: string | null;
    sentAt: string | null;
    status: string;
    targetCarbsG: number;
    targetFatG: number;
    targetKcal: number;
    targetProteinG: number;
    title: string;
    updatedAt: string;
    version: number;
    waterLiters: number;
  } | null;
};

export type DietNutritionTotals = {
  carbs: number;
  fat: number;
  fiber: number;
  kcal: number;
  protein: number;
  sodium: number;
};

export type PartnerClientDietFood = DietNutritionTotals & {
  category: PartnerProtocolFoodCategory;
  categoryLabel: string;
  householdMeasure: string | null;
  id: string;
  name: string;
  searchText: string;
  servingLabel: string;
  servingSize: number;
  servingUnit: string;
  source: PartnerProtocolFoodSource;
  sourceLabel: string;
  suggestedUses: string[];
  tags: string[];
  updatedAt: string;
  usageCount: number;
};

export type PartnerClientDietItem = DietNutritionTotals & {
  foodId: string | null;
  householdMeasure: string | null;
  id: string;
  name: string;
  quantity: number;
  quantityLabel: string;
  quantityUnit: string;
  sortOrder: number;
};

export type PartnerClientDietMeal = {
  dayOfWeek: number;
  id: string;
  items: PartnerClientDietItem[];
  mealTime: string;
  sortOrder: number;
  title: string;
  totals: DietNutritionTotals;
};

export type PartnerClientDietDay = {
  dayOfWeek: number;
  label: string;
  meals: PartnerClientDietMeal[];
  shortLabel: string;
  totals: DietNutritionTotals;
};

export type PartnerClientDietPlan = {
  calorieStrategy: DietCalorieStrategy;
  calorieStrategyLabel: string;
  createdAt: string;
  createdLabel: string;
  id: string;
  notes: string | null;
  publishedAt: string | null;
  sentAt: string | null;
  status: DietPlanStatus;
  statusLabel: string;
  targetCarbs: number;
  targetFat: number;
  targetKcal: number;
  targetProtein: number;
  title: string;
  updatedAt: string;
  version: number;
  waterLiters: number;
  weekDays: PartnerClientDietDay[];
  weekTotals: DietNutritionTotals;
};

export type PartnerClientDietDraft = {
  createdAt: string;
  food: PartnerClientDietFood;
  id: string;
  notes: string | null;
};

export type PartnerClientDietEvent = {
  actorName: string | null;
  createdAt: string;
  dateLabel: string;
  detail: string;
  eventType: string;
  id: string;
  version: number;
};

export type PartnerClientDietData = {
  drafts: PartnerClientDietDraft[];
  events: PartnerClientDietEvent[];
  foods: PartnerClientDietFood[];
  generatedAt: string;
  library: {
    favorites: PartnerClientDietFood[];
    recent: PartnerClientDietFood[];
    suggestions: PartnerClientDietFood[];
  };
  plan: PartnerClientDietPlan | null;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export const dietDayLabels = [
  { dayOfWeek: 1, label: "Segunda-feira", shortLabel: "Seg" },
  { dayOfWeek: 2, label: "Terça-feira", shortLabel: "Ter" },
  { dayOfWeek: 3, label: "Quarta-feira", shortLabel: "Qua" },
  { dayOfWeek: 4, label: "Quinta-feira", shortLabel: "Qui" },
  { dayOfWeek: 5, label: "Sexta-feira", shortLabel: "Sex" },
  { dayOfWeek: 6, label: "Sábado", shortLabel: "Sáb" },
  { dayOfWeek: 7, label: "Domingo", shortLabel: "Dom" },
] as const;

const zeroTotals: DietNutritionTotals = { carbs: 0, fat: 0, fiber: 0, kcal: 0, protein: 0, sodium: 0 };
const validFoodCategories = Object.keys(foodCategoryLabels) as PartnerProtocolFoodCategory[];
const validFoodSources = Object.keys(foodSourceLabels) as PartnerProtocolFoodSource[];

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function roundInt(value: number) {
  return Math.round(value);
}

function numberValue(value: number | string | null | undefined) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(value: string): DietPlanStatus {
  return value === "published" || value === "sent" || value === "archived" ? value : "draft";
}

function normalizeStrategy(value: string): DietCalorieStrategy {
  if (value === "deficit" || value === "surplus") return value;
  return "maintenance";
}

export function dietStatusLabel(status: DietPlanStatus) {
  return {
    archived: "Arquivada",
    draft: "Rascunho",
    published: "Publicada",
    sent: "Enviada",
  }[status];
}

export function calorieStrategyLabel(strategy: DietCalorieStrategy) {
  return {
    deficit: "Déficit moderado",
    maintenance: "Manutenção",
    surplus: "Superávit controlado",
  }[strategy];
}

function asFoodCategory(value: string): PartnerProtocolFoodCategory {
  return validFoodCategories.includes(value as PartnerProtocolFoodCategory) ? value as PartnerProtocolFoodCategory : "outros";
}

function asFoodSource(value: string): PartnerProtocolFoodSource {
  return validFoodSources.includes(value as PartnerProtocolFoodSource) ? value as PartnerProtocolFoodSource : "custom";
}

export function addDietTotals(left: DietNutritionTotals, right: DietNutritionTotals): DietNutritionTotals {
  return {
    carbs: roundOne(left.carbs + right.carbs),
    fat: roundOne(left.fat + right.fat),
    fiber: roundOne(left.fiber + right.fiber),
    kcal: roundInt(left.kcal + right.kcal),
    protein: roundOne(left.protein + right.protein),
    sodium: roundOne(left.sodium + right.sodium),
  };
}

export function scaleDietNutrition(
  base: {
    carbs: number;
    fat: number;
    fiber: number;
    kcal: number;
    protein: number;
    servingSize: number;
    sodium: number;
  },
  quantity: number,
): DietNutritionTotals {
  const servingSize = Math.max(0.01, numberValue(base.servingSize));
  const factor = Math.max(0, numberValue(quantity)) / servingSize;
  return {
    carbs: roundOne(numberValue(base.carbs) * factor),
    fat: roundOne(numberValue(base.fat) * factor),
    fiber: roundOne(numberValue(base.fiber) * factor),
    kcal: roundInt(numberValue(base.kcal) * factor),
    protein: roundOne(numberValue(base.protein) * factor),
    sodium: roundOne(numberValue(base.sodium) * factor),
  };
}

export function macroDistribution(totals: DietNutritionTotals) {
  const proteinKcal = totals.protein * 4;
  const carbsKcal = totals.carbs * 4;
  const fatKcal = totals.fat * 9;
  const total = proteinKcal + carbsKcal + fatKcal;
  if (total <= 0) return { carbsPct: 0, fatPct: 0, proteinPct: 0 };
  return {
    carbsPct: Math.round((carbsKcal / total) * 100),
    fatPct: Math.round((fatKcal / total) * 100),
    proteinPct: Math.round((proteinKcal / total) * 100),
  };
}

function mapFood(row: PartnerClientDietFoodRecord): PartnerClientDietFood {
  const category = asFoodCategory(row.category);
  const source = asFoodSource(row.source);
  const servingSize = numberValue(row.servingSize);
  const food = {
    carbs: numberValue(row.carbsG),
    fat: numberValue(row.fatG),
    fiber: numberValue(row.fiberG),
    kcal: numberValue(row.kcal),
    protein: numberValue(row.proteinG),
    sodium: numberValue(row.sodiumMg),
  };

  return {
    ...food,
    category,
    categoryLabel: foodCategoryLabels[category],
    householdMeasure: row.householdMeasure,
    id: row.id,
    name: row.name,
    searchText: `${row.name} ${foodCategoryLabels[category]} ${row.tags.join(" ")}`.toLowerCase(),
    servingLabel: `${servingSize.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${row.servingUnit}`,
    servingSize,
    servingUnit: row.servingUnit,
    source,
    sourceLabel: foodSourceLabels[source],
    suggestedUses: row.suggestedUses ?? [],
    tags: row.tags ?? [],
    updatedAt: row.updatedAt,
    usageCount: numberValue(row.usageCount),
  };
}

function mapItem(row: PartnerClientDietRawData["plan"] extends infer T ? T extends { meals: Array<infer M> } ? M extends { items: Array<infer I> } ? I : never : never : never): PartnerClientDietItem {
  const quantity = numberValue(row.quantity);
  const totals = scaleDietNutrition({
    carbs: numberValue(row.snapshotCarbsG),
    fat: numberValue(row.snapshotFatG),
    fiber: numberValue(row.snapshotFiberG),
    kcal: numberValue(row.snapshotKcal),
    protein: numberValue(row.snapshotProteinG),
    servingSize: numberValue(row.snapshotServingSize),
    sodium: numberValue(row.snapshotSodiumMg),
  }, quantity);

  return {
    ...totals,
    foodId: row.foodId,
    householdMeasure: row.householdMeasure,
    id: row.id,
    name: row.snapshotName,
    quantity,
    quantityLabel: `${quantity.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${row.quantityUnit}`,
    quantityUnit: row.quantityUnit,
    sortOrder: numberValue(row.sortOrder),
  };
}

function sumTotals(items: DietNutritionTotals[]) {
  return items.reduce((total, item) => addDietTotals(total, item), zeroTotals);
}

function mapPlan(rawPlan: NonNullable<PartnerClientDietRawData["plan"]>): PartnerClientDietPlan {
  const meals = rawPlan.meals.map((meal): PartnerClientDietMeal => {
    const items = meal.items.map(mapItem).sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      dayOfWeek: numberValue(meal.dayOfWeek),
      id: meal.id,
      items,
      mealTime: meal.mealTime,
      sortOrder: numberValue(meal.sortOrder),
      title: meal.title,
      totals: sumTotals(items),
    };
  });

  const weekDays = dietDayLabels.map(({ dayOfWeek, label, shortLabel }) => {
    const dayMeals = meals
      .filter((meal) => meal.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.mealTime.localeCompare(b.mealTime));
    return {
      dayOfWeek,
      label,
      meals: dayMeals,
      shortLabel,
      totals: sumTotals(dayMeals.map((meal) => meal.totals)),
    };
  });
  const status = normalizeStatus(rawPlan.status);
  const strategy = normalizeStrategy(rawPlan.calorieStrategy);

  return {
    calorieStrategy: strategy,
    calorieStrategyLabel: calorieStrategyLabel(strategy),
    createdAt: rawPlan.createdAt,
    createdLabel: dateFormatter.format(new Date(rawPlan.createdAt)),
    id: rawPlan.id,
    notes: rawPlan.notes,
    publishedAt: rawPlan.publishedAt,
    sentAt: rawPlan.sentAt,
    status,
    statusLabel: dietStatusLabel(status),
    targetCarbs: numberValue(rawPlan.targetCarbsG),
    targetFat: numberValue(rawPlan.targetFatG),
    targetKcal: numberValue(rawPlan.targetKcal),
    targetProtein: numberValue(rawPlan.targetProteinG),
    title: rawPlan.title,
    updatedAt: rawPlan.updatedAt,
    version: numberValue(rawPlan.version),
    waterLiters: numberValue(rawPlan.waterLiters),
    weekDays,
    weekTotals: sumTotals(weekDays.map((day) => day.totals)),
  };
}

export function buildPartnerClientDiet(raw: PartnerClientDietRawData): PartnerClientDietData {
  const foods = raw.foods.map(mapFood);
  const foodById = new Map(foods.map((food) => [food.id, food]));
  const drafts = raw.drafts
    .map((draft) => ({
      createdAt: draft.createdAt,
      food: foodById.get(draft.food.id) ?? mapFood(draft.food),
      id: draft.id,
      notes: draft.notes,
    }))
    .filter((draft) => draft.food);
  const suggestionIds = new Set(drafts.map((draft) => draft.food.id));
  const draftFoods = drafts.map((draft) => draft.food);
  const popularFoods = [...foods].sort((a, b) => b.usageCount - a.usageCount).slice(0, 8);
  const suggestions = [...draftFoods, ...popularFoods.filter((food) => !suggestionIds.has(food.id))].slice(0, 8);

  return {
    drafts,
    events: raw.events.map((event) => ({
      actorName: event.actorName,
      createdAt: event.createdAt,
      dateLabel: dateTimeFormatter.format(new Date(event.createdAt)),
      detail: event.detail,
      eventType: event.eventType,
      id: event.id,
      version: numberValue(event.version),
    })),
    foods,
    generatedAt: raw.generatedAt,
    library: {
      favorites: [...foods].sort((a, b) => b.usageCount - a.usageCount).slice(0, 8),
      recent: [...foods].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8),
      suggestions,
    },
    plan: raw.plan ? mapPlan(raw.plan) : null,
  };
}
