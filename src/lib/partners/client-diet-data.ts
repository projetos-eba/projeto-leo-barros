import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

import {
  buildPartnerClientDiet,
  type PartnerClientDietData,
  type PartnerClientDietRawData,
} from "./client-diet-metrics";

type DietTrackingQueryResult = {
  data: unknown;
  error: { message: string } | null;
};

type DietTrackingQuery = PromiseLike<DietTrackingQueryResult> & {
  eq(column: string, value: unknown): DietTrackingQuery;
  gte(column: string, value: unknown): DietTrackingQuery;
  limit(value: number): DietTrackingQuery;
  order(column: string, options?: { ascending?: boolean }): DietTrackingQuery;
  select(columns: string): DietTrackingQuery;
};

type DietTrackingDb = {
  from(table: string): DietTrackingQuery;
};

type DietPlanRow = Database["public"]["Tables"]["partner_client_diet_plans"]["Row"];
type DietMealRow = Database["public"]["Tables"]["partner_client_diet_meals"]["Row"];
type DietMealItemRow = Database["public"]["Tables"]["partner_client_diet_meal_items"]["Row"];
type DietEventRow = Database["public"]["Tables"]["partner_client_diet_events"]["Row"];

function asRawPlan(plan: DietPlanRow, meals: DietMealRow[], items: DietMealItemRow[]): NonNullable<PartnerClientDietRawData["plan"]> {
  const itemsByMealId = new Map<string, DietMealItemRow[]>();
  for (const item of items) {
    const mealItems = itemsByMealId.get(item.meal_id) ?? [];
    mealItems.push(item);
    itemsByMealId.set(item.meal_id, mealItems);
  }

  return {
    calorieStrategy: plan.calorie_strategy,
    createdAt: plan.created_at,
    id: plan.id,
    meals: meals.map((meal) => ({
      alternativeOrder: meal.alternative_order,
      dayOfWeek: meal.day_of_week,
      id: meal.id,
      items: (itemsByMealId.get(meal.id) ?? []).map((item) => ({
        foodId: item.food_id,
        householdMeasure: item.household_measure,
        id: item.id,
        quantity: item.quantity,
        quantityUnit: item.quantity_unit,
        snapshotCarbsG: item.snapshot_carbs_g,
        snapshotFatG: item.snapshot_fat_g,
        snapshotFiberG: item.snapshot_fiber_g,
        snapshotKcal: item.snapshot_kcal,
        snapshotName: item.snapshot_name,
        snapshotProteinG: item.snapshot_protein_g,
        snapshotServingSize: item.snapshot_serving_size,
        snapshotServingUnit: item.snapshot_serving_unit,
        snapshotSodiumMg: item.snapshot_sodium_mg,
        sortOrder: item.sort_order,
      })),
      mealTime: meal.meal_time.slice(0, 5),
      mealGroupId: meal.meal_group_id,
      menuOption: meal.menu_option,
      optionLabel: meal.option_label,
      sortOrder: meal.sort_order,
      title: meal.title,
    })),
    notes: plan.notes,
    publishedAt: plan.published_at,
    reviewOn: plan.review_on,
    sentAt: plan.sent_at,
    startsOn: plan.starts_on,
    status: plan.status,
    targetCarbsG: plan.target_carbs_g,
    targetFatG: plan.target_fat_g,
    targetFiberMaxG: plan.target_fiber_max_g,
    targetFiberMinG: plan.target_fiber_min_g,
    targetKcal: plan.target_kcal,
    targetProteinG: plan.target_protein_g,
    title: plan.title,
    updatedAt: plan.updated_at,
    version: plan.version,
    waterLiters: plan.water_liters,
  };
}

function asRawEvents(events: DietEventRow[]): PartnerClientDietRawData["events"] {
  return events.map((event) => ({
    actorName: event.actor_name,
    createdAt: event.created_at,
    detail: event.detail,
    eventType: event.event_type,
    id: event.id,
    version: event.version,
  }));
}

function todayIsoDate() {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function shiftIsoDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function withEnergy(diet: PartnerClientDietData, getKcal: number | null): PartnerClientDietData {
  return { ...diet, energy: { getKcal } };
}

export async function fetchPartnerClientDiet(patientId: string, selectedPlanId?: string): Promise<PartnerClientDietData | null> {
  const supabase = await createClient();
  const [{ data, error }, planSummariesResult, getResult] = await Promise.all([
    supabase.rpc("partner_client_diet", { p_patient_id: patientId }),
    supabase
      .from("partner_client_diet_plans")
      .select("id, title, status, created_at, updated_at")
      .eq("patient_id", patientId)
      .neq("status", "archived")
      .order("updated_at", { ascending: false }),
    supabase
      .from("partner_client_calorie_calculations")
      .select("tdee_kcal")
      .eq("patient_id", patientId)
      .eq("status", "applied")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (error) {
    throw new Error(`Falha ao carregar Dietas do Cliente: ${error.message}`);
  }

  if (!data || planSummariesResult.error) {
    if (planSummariesResult.error) {
      throw new Error(`Falha ao carregar planos de Dieta: ${planSummariesResult.error.message}`);
    }
    return null;
  }
  if (getResult.error) {
    throw new Error(`Falha ao carregar o gasto energético do Cliente: ${getResult.error.message}`);
  }

  let rawData = data as unknown as PartnerClientDietRawData;
  rawData = {
    ...rawData,
    plans: (planSummariesResult.data ?? []).map((plan) => ({
      createdAt: plan.created_at,
      id: plan.id,
      status: plan.status,
      title: plan.title,
      updatedAt: plan.updated_at,
    })),
  };

  if (selectedPlanId && selectedPlanId !== rawData.plan?.id) {
    const [selectedPlanResult, mealsResult, itemsResult, eventsResult] = await Promise.all([
      supabase
        .from("partner_client_diet_plans")
        .select("*")
        .eq("id", selectedPlanId)
        .eq("patient_id", patientId)
        .maybeSingle(),
      supabase
        .from("partner_client_diet_meals")
        .select("*")
        .eq("plan_id", selectedPlanId)
        .eq("patient_id", patientId)
        .order("day_of_week", { ascending: true })
        .order("menu_option", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("meal_time", { ascending: true }),
      supabase
        .from("partner_client_diet_meal_items")
        .select("*")
        .eq("plan_id", selectedPlanId)
        .eq("patient_id", patientId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("partner_client_diet_events")
        .select("*")
        .eq("plan_id", selectedPlanId)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
    ]);

    const selectedPlanError = selectedPlanResult.error ?? mealsResult.error ?? itemsResult.error ?? eventsResult.error;
    if (selectedPlanError) {
      throw new Error(`Falha ao carregar a dieta selecionada: ${selectedPlanError.message}`);
    }

    if (selectedPlanResult.data) {
      rawData = {
        ...rawData,
        events: asRawEvents(eventsResult.data ?? []),
        plan: asRawPlan(selectedPlanResult.data, mealsResult.data ?? [], itemsResult.data ?? []),
      };
    }
  }

  const planId = rawData.plan?.id;
  const getKcal = typeof getResult.data?.tdee_kcal === "number" && Number.isFinite(getResult.data.tdee_kcal) && getResult.data.tdee_kcal > 0
    ? getResult.data.tdee_kcal
    : null;
  if (!planId) return withEnergy(buildPartnerClientDiet(rawData), getKcal);

  const today = todayIsoDate();
  const fromDate = shiftIsoDate(today, -13);
  const dietTrackingDb = supabase as unknown as DietTrackingDb;

  const [dailyLogsResult, mealLogsResult, eventsResult] = await Promise.all([
    dietTrackingDb
      .from("client_diet_daily_logs")
      .select("logDate:log_date, waterMl:water_ml")
      .eq("patient_id", patientId)
      .eq("plan_id", planId)
      .gte("log_date", fromDate),
    dietTrackingDb
      .from("client_diet_meal_logs")
      .select("id, mealId:meal_id, logDate:log_date, status, completedAt:completed_at, notes, photoOriginalFilename:photo_original_filename, photoStoragePath:photo_storage_path, updatedAt:updated_at")
      .eq("patient_id", patientId)
      .eq("plan_id", planId)
      .gte("log_date", fromDate)
      .order("log_date", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(80),
    dietTrackingDb
      .from("client_diet_events")
      .select("id, mealId:meal_id, logDate:log_date, eventType:event_type, detail, createdAt:created_at")
      .eq("patient_id", patientId)
      .eq("plan_id", planId)
      .gte("log_date", fromDate)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (dailyLogsResult.error) {
    throw new Error(`Falha ao carregar hidratação da Dieta: ${dailyLogsResult.error.message}`);
  }
  if (mealLogsResult.error) {
    throw new Error(`Falha ao carregar execução da Dieta: ${mealLogsResult.error.message}`);
  }
  if (eventsResult.error) {
    throw new Error(`Falha ao carregar histórico diário da Dieta: ${eventsResult.error.message}`);
  }

  return withEnergy(buildPartnerClientDiet({
    ...rawData,
    tracking: {
      dailyLogs: Array.isArray(dailyLogsResult.data) ? dailyLogsResult.data : [],
      events: Array.isArray(eventsResult.data) ? eventsResult.data : [],
      mealLogs: Array.isArray(mealLogsResult.data) ? mealLogsResult.data : [],
      today,
    },
  } as PartnerClientDietRawData), getKcal);
}
