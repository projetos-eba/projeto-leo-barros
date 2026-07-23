import { createClient } from "@/lib/supabase/server";

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

export async function fetchPartnerClientDiet(patientId: string): Promise<PartnerClientDietData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("partner_client_diet", {
    p_patient_id: patientId,
  });

  if (error) {
    throw new Error(`Falha ao carregar Dietas do Cliente: ${error.message}`);
  }

  if (!data) return null;

  const rawData = data as unknown as PartnerClientDietRawData;
  const planId = rawData.plan?.id;
  if (!planId) return buildPartnerClientDiet(rawData);

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

  return buildPartnerClientDiet({
    ...rawData,
    tracking: {
      dailyLogs: Array.isArray(dailyLogsResult.data) ? dailyLogsResult.data : [],
      events: Array.isArray(eventsResult.data) ? eventsResult.data : [],
      mealLogs: Array.isArray(mealLogsResult.data) ? mealLogsResult.data : [],
      today,
    },
  } as PartnerClientDietRawData);
}
