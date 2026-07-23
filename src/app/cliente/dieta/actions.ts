"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ActionResult = {
  error?: string;
  ok: boolean;
};

type DietActionRpc = {
  rpc(name: "client_diet_set_meal_status", params: { p_log_date: string; p_meal_id: string; p_status: ClientDietMealStatus }): PromiseLike<{ error: { message: string } | null }>;
  rpc(name: "client_diet_add_water", params: { p_amount_ml: number; p_log_date: string }): PromiseLike<{ error: { message: string } | null }>;
  rpc(name: "client_diet_apply_substitution", params: { p_food_id: string; p_item_id: string; p_log_date: string; p_meal_id: string }): PromiseLike<{ error: { message: string } | null }>;
  rpc(name: "client_diet_save_meal_note", params: { p_log_date: string; p_meal_id: string; p_notes: string }): PromiseLike<{ error: { message: string } | null }>;
  rpc(name: "client_diet_request_substitution", params: { p_detail: string; p_log_date: string; p_meal_id: string }): PromiseLike<{ error: { message: string } | null }>;
  rpc(name: "client_diet_attach_meal_photo", params: { p_log_date: string; p_meal_id: string; p_mime_type: string; p_original_filename: string; p_storage_path: string }): PromiseLike<{ error: { message: string } | null }>;
  rpc(name: "current_active_patient_id", params?: Record<string, never>): PromiseLike<{ data: string | null; error: { message: string } | null }>;
};

export type ClientDietMealStatus = "completed" | "partial" | "pending" | "skipped";

function revalidateDiet() {
  revalidatePath("/cliente/dieta");
  revalidatePath("/cliente/inicio");
}

export async function applyClientDietMealSubstitution(formData: FormData): Promise<ActionResult> {
  const mealId = stringField(formData, "mealId");
  const itemId = stringField(formData, "itemId");
  const foodId = stringField(formData, "foodId");
  const logDate = stringField(formData, "logDate");
  const fieldError = validateActionFields(mealId, logDate);
  if (fieldError) return { error: fieldError, ok: false };
  if (!itemId || !foodId) return { error: "Escolha um alimento para substituir.", ok: false };

  const supabase = await createClient();
  const { error } = await (supabase as unknown as DietActionRpc).rpc("client_diet_apply_substitution", {
    p_food_id: foodId,
    p_item_id: itemId,
    p_log_date: logDate,
    p_meal_id: mealId,
  });

  if (error) return { error: error.message, ok: false };
  revalidateDiet();
  return { ok: true };
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validateActionFields(mealId: string, logDate: string) {
  if (!mealId || !logDate) return "Dados da refeição incompletos.";
  return null;
}

function safeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "foto-refeicao";
}

export async function markClientDietMeal(mealId: string, logDate: string, completed: boolean): Promise<ActionResult> {
  return setClientDietMealStatus(mealId, logDate, completed ? "completed" : "pending");
}

export async function setClientDietMealStatus(mealId: string, logDate: string, status: ClientDietMealStatus): Promise<ActionResult> {
  const fieldError = validateActionFields(mealId, logDate);
  if (fieldError) return { error: fieldError, ok: false };
  if (!["completed", "partial", "pending", "skipped"].includes(status)) {
    return { error: "Status da refeição inválido.", ok: false };
  }

  const supabase = await createClient();
  const { error } = await (supabase as unknown as DietActionRpc).rpc("client_diet_set_meal_status", {
    p_log_date: logDate,
    p_meal_id: mealId,
    p_status: status,
  });

  if (error) return { error: error.message, ok: false };
  revalidateDiet();
  return { ok: true };
}

export async function addClientDietWater(logDate: string, amountMl = 250): Promise<ActionResult> {
  if (!logDate) return { error: "Data inválida para hidratação.", ok: false };

  const supabase = await createClient();
  const { error } = await (supabase as unknown as DietActionRpc).rpc("client_diet_add_water", {
    p_amount_ml: amountMl,
    p_log_date: logDate,
  });

  if (error) return { error: error.message, ok: false };
  revalidateDiet();
  return { ok: true };
}

export async function saveClientDietMealNote(formData: FormData): Promise<ActionResult> {
  const mealId = stringField(formData, "mealId");
  const logDate = stringField(formData, "logDate");
  const notes = stringField(formData, "notes").slice(0, 1000);
  const fieldError = validateActionFields(mealId, logDate);
  if (fieldError) return { error: fieldError, ok: false };

  const supabase = await createClient();
  const { error } = await (supabase as unknown as DietActionRpc).rpc("client_diet_save_meal_note", {
    p_log_date: logDate,
    p_meal_id: mealId,
    p_notes: notes,
  });

  if (error) return { error: error.message, ok: false };
  revalidateDiet();
  return { ok: true };
}

export async function requestClientDietMealSubstitution(formData: FormData): Promise<ActionResult> {
  const mealId = stringField(formData, "mealId");
  const logDate = stringField(formData, "logDate");
  const detail = stringField(formData, "detail").slice(0, 700) || "Cliente solicitou substituição nesta refeição.";
  const fieldError = validateActionFields(mealId, logDate);
  if (fieldError) return { error: fieldError, ok: false };

  const supabase = await createClient();
  const { error } = await (supabase as unknown as DietActionRpc).rpc("client_diet_request_substitution", {
    p_detail: detail,
    p_log_date: logDate,
    p_meal_id: mealId,
  });

  if (error) return { error: error.message, ok: false };
  revalidateDiet();
  return { ok: true };
}

export async function attachClientDietMealPhoto(formData: FormData): Promise<ActionResult> {
  const mealId = stringField(formData, "mealId");
  const planId = stringField(formData, "planId");
  const logDate = stringField(formData, "logDate");
  const fieldError = validateActionFields(mealId, logDate);
  if (fieldError) return { error: fieldError, ok: false };
  if (!planId) return { error: "Plano alimentar não encontrado.", ok: false };

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Selecione uma foto da refeição.", ok: false };
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
    return { error: "Use uma imagem JPG, PNG ou WebP.", ok: false };
  }

  if (photo.size > 5 * 1024 * 1024) {
    return { error: "A foto deve ter até 5MB.", ok: false };
  }

  const supabase = await createClient();
  const rpc = supabase as unknown as DietActionRpc;
  const { data: patientId, error: patientError } = await rpc.rpc("current_active_patient_id");
  if (patientError || !patientId) {
    return { error: patientError?.message ?? "Cliente não autenticado.", ok: false };
  }

  const filename = safeFileName(photo.name);
  const storagePath = `${patientId}/${planId}/${logDate}/${mealId}/${crypto.randomUUID()}-${filename}`;
  const upload = await supabase.storage.from("client-diet-meal-photos").upload(storagePath, photo, {
    contentType: photo.type,
    upsert: false,
  });

  if (upload.error) return { error: upload.error.message, ok: false };

  const { error } = await rpc.rpc("client_diet_attach_meal_photo", {
    p_log_date: logDate,
    p_meal_id: mealId,
    p_mime_type: photo.type,
    p_original_filename: photo.name,
    p_storage_path: storagePath,
  });

  if (error) {
    await supabase.storage.from("client-diet-meal-photos").remove([storagePath]);
    return { error: error.message, ok: false };
  }

  revalidateDiet();
  return { ok: true };
}
