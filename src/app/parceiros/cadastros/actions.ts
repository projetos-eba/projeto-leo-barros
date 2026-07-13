"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/auth/next-guards";
import {
  normalizeProtocolVideoUrl,
  parseProtocolTags,
  type PartnerProtocolExerciseEquipment,
  type PartnerProtocolExerciseLevel,
  type PartnerProtocolExerciseMuscleGroup,
  type PartnerProtocolExerciseObjective,
  type PartnerProtocolFoodCategory,
  type PartnerProtocolFoodSource,
} from "@/lib/partners/protocols-metrics";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export type PartnerProtocolsActionResult = {
  count?: number;
  error?: string;
  id?: string;
  message?: string;
  ok: boolean;
};

const uuidSchema = z.string().uuid();
const foodCategorySchema = z.enum(["cereal", "carne", "fruta", "gordura", "laticinio", "leguminosa", "suplemento", "verdura", "outros"]);
const foodSourceSchema = z.enum(["taco", "tbca", "custom", "imported"]);
const statusSchema = z.enum(["active", "archived"]);
const optionalText = z.string().trim().max(1000).nullable();
const tagArray = z.array(z.string().trim().min(1).max(40)).max(12);

const foodSchema = z.object({
  carbs: z.number().min(0).max(10000),
  category: foodCategorySchema,
  fat: z.number().min(0).max(10000),
  fiber: z.number().min(0).max(10000),
  householdMeasure: z.string().trim().max(80).nullable(),
  kcal: z.number().min(0).max(100000),
  name: z.string().trim().min(2).max(140),
  notes: optionalText,
  protein: z.number().min(0).max(10000),
  servingSize: z.number().min(0.01).max(100000),
  servingUnit: z.string().trim().min(1).max(20),
  sodium: z.number().min(0).max(1000000),
  source: foodSourceSchema,
  status: statusSchema.default("active"),
  suggestedUses: z.array(z.enum(["pre_treino", "pos_treino", "lanche", "refeicao_principal", "ceia", "outro"])).max(8),
  tags: tagArray,
});

const updateFoodSchema = foodSchema.extend({ foodId: uuidSchema });

const importFoodRowSchema = z.object({
  carbs_g: z.number().min(0).max(10000),
  category: z.string().trim().min(1).max(40),
  fat_g: z.number().min(0).max(10000),
  fiber_g: z.number().min(0).max(10000),
  household_measure: z.string().trim().max(80).nullable(),
  kcal: z.number().min(0).max(100000),
  name: z.string().trim().min(2).max(140),
  protein_g: z.number().min(0).max(10000),
  serving_size: z.number().min(0.01).max(100000),
  serving_unit: z.string().trim().min(1).max(20),
  sodium_mg: z.number().min(0).max(1000000),
  source: z.string().trim().min(1).max(40),
});

const importFoodsSchema = z.object({
  rows: z.array(importFoodRowSchema).min(1).max(300),
});

const exerciseSchema = z.object({
  cadence: z.string().trim().max(40).nullable(),
  defaultReps: z.string().trim().min(1).max(40),
  defaultSets: z.number().int().min(1).max(12),
  equipment: z.enum(["barra", "halteres", "maquina", "polia", "peso_corporal", "elastico", "kettlebell", "outros"]),
  instructions: z.string().trim().max(800).nullable(),
  level: z.enum(["iniciante", "intermediario", "avancado"]),
  muscleGroup: z.enum(["peito", "costas", "pernas", "ombros", "biceps", "triceps", "core", "gluteos", "cardio_condicionamento", "mobilidade", "outros"]),
  secondaryMuscleGroups: z.array(z.enum(["peito", "costas", "pernas", "ombros", "biceps", "triceps", "core", "gluteos"])).max(4),
  name: z.string().trim().min(2).max(140),
  objective: z.enum(["forca", "hipertrofia", "resistencia", "mobilidade", "reabilitacao", "condicionamento"]),
  restSeconds: z.number().int().min(0).max(600),
  status: statusSchema.default("active"),
  tags: tagArray,
  thumbnailUrl: z.string().trim().url().max(500).nullable(),
  variations: z.array(z.string().trim().min(1).max(80)).max(12),
  videoUrl: z.string().trim().url().max(500).nullable(),
});

const updateExerciseSchema = exerciseSchema.extend({ exerciseId: uuidSchema });

const archiveSchema = z.object({
  id: uuidSchema,
  itemType: z.enum(["food", "exercise"]),
  value: z.boolean(),
});

const useDraftSchema = z.object({
  exerciseId: uuidSchema.nullable(),
  foodId: uuidSchema.nullable(),
  itemType: z.enum(["food", "exercise"]),
  notes: z.string().trim().max(300).nullable(),
  patientId: uuidSchema.nullable(),
  planContext: z.enum(["rascunho", "dieta", "treino"]),
});

async function getPartnerContext() {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile();

  if (!profile) {
    return { error: "Sessão do parceiro indisponível.", partnerId: null, supabase };
  }

  const { data: partner, error } = await supabase
    .from("partners")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (error || !partner) {
    return { error: "Cadastro do parceiro indisponível.", partnerId: null, supabase };
  }

  return { error: null, partnerId: partner.id, supabase };
}

function nullable(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function revalidateProtocols() {
  revalidatePath("/parceiros/cadastros");
}

async function recordProtocolEvent(
  context: Awaited<ReturnType<typeof getPartnerContext>>,
  input: {
    details?: Json;
    eventType: string;
    exerciseId?: string | null;
    foodId?: string | null;
    itemType: "exercise" | "food";
  },
) {
  if (!context.partnerId) return;
  await context.supabase.from("partner_protocol_events").insert({
    details: input.details ?? {},
    event_type: input.eventType,
    exercise_id: input.itemType === "exercise" ? input.exerciseId : null,
    food_id: input.itemType === "food" ? input.foodId : null,
    item_type: input.itemType,
    partner_id: context.partnerId,
  });
}

function normalizeFoodCategory(value: string): PartnerProtocolFoodCategory {
  const normalized = value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (["cereal", "carne", "fruta", "gordura", "laticinio", "leguminosa", "suplemento", "verdura", "outros"].includes(normalized)) {
    return normalized as PartnerProtocolFoodCategory;
  }
  return "outros";
}

function normalizeFoodSource(value: string): PartnerProtocolFoodSource {
  const normalized = value.trim().toLowerCase();
  if (["taco", "tbca", "custom", "imported"].includes(normalized)) {
    return normalized as PartnerProtocolFoodSource;
  }
  return "imported";
}

function normalizeExerciseVideo(value: string | null) {
  if (!value) return null;
  return normalizeProtocolVideoUrl(value);
}

export async function createPartnerProtocolFood(input: z.input<typeof foodSchema>): Promise<PartnerProtocolsActionResult> {
  const parsed = foodSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados do alimento.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { data, error } = await context.supabase
    .from("partner_protocol_foods")
    .insert({
      carbs_g: parsed.data.carbs,
      category: parsed.data.category,
      fat_g: parsed.data.fat,
      fiber_g: parsed.data.fiber,
      household_measure: nullable(parsed.data.householdMeasure),
      kcal: parsed.data.kcal,
      name: parsed.data.name,
      notes: nullable(parsed.data.notes),
      partner_id: context.partnerId,
      protein_g: parsed.data.protein,
      serving_size: parsed.data.servingSize,
      serving_unit: parsed.data.servingUnit,
      sodium_mg: parsed.data.sodium,
      source: parsed.data.source,
      status: parsed.data.status,
      suggested_uses: parsed.data.suggestedUses,
      tags: parseProtocolTags(parsed.data.tags),
    })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível salvar o alimento.", ok: false };

  await recordProtocolEvent(context, { eventType: "created", foodId: data.id, itemType: "food" });
  revalidateProtocols();
  return { id: data.id, message: "Alimento salvo.", ok: true };
}

export async function updatePartnerProtocolFood(input: z.input<typeof updateFoodSchema>): Promise<PartnerProtocolsActionResult> {
  const parsed = updateFoodSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados do alimento.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_protocol_foods")
    .update({
      carbs_g: parsed.data.carbs,
      category: parsed.data.category,
      fat_g: parsed.data.fat,
      fiber_g: parsed.data.fiber,
      household_measure: nullable(parsed.data.householdMeasure),
      kcal: parsed.data.kcal,
      name: parsed.data.name,
      notes: nullable(parsed.data.notes),
      protein_g: parsed.data.protein,
      serving_size: parsed.data.servingSize,
      serving_unit: parsed.data.servingUnit,
      sodium_mg: parsed.data.sodium,
      source: parsed.data.source,
      status: parsed.data.status,
      suggested_uses: parsed.data.suggestedUses,
      tags: parseProtocolTags(parsed.data.tags),
    })
    .eq("id", parsed.data.foodId)
    .eq("partner_id", context.partnerId);

  if (error) return { error: "Não foi possível atualizar o alimento.", ok: false };

  await recordProtocolEvent(context, { eventType: "updated", foodId: parsed.data.foodId, itemType: "food" });
  revalidateProtocols();
  return { message: "Alimento atualizado.", ok: true };
}

export async function importPartnerProtocolFoods(input: z.input<typeof importFoodsSchema>): Promise<PartnerProtocolsActionResult> {
  const parsed = importFoodsSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise a tabela importada.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const rows = parsed.data.rows.map((row) => ({
    carbs_g: row.carbs_g,
    category: normalizeFoodCategory(row.category),
    fat_g: row.fat_g,
    fiber_g: row.fiber_g,
    household_measure: nullable(row.household_measure),
    kcal: row.kcal,
    name: row.name,
    partner_id: context.partnerId,
    protein_g: row.protein_g,
    serving_size: row.serving_size,
    serving_unit: row.serving_unit,
    sodium_mg: row.sodium_mg,
    source: normalizeFoodSource(row.source),
  }));

  const { data, error } = await context.supabase
    .from("partner_protocol_foods")
    .insert(rows)
    .select("id");

  if (error) return { error: "Não foi possível importar a tabela.", ok: false };

  for (const food of data ?? []) {
    await recordProtocolEvent(context, { details: { imported: true }, eventType: "imported", foodId: food.id, itemType: "food" });
  }

  revalidateProtocols();
  return { count: data?.length ?? rows.length, message: "Tabela importada.", ok: true };
}

export async function createPartnerProtocolExercise(input: z.input<typeof exerciseSchema>): Promise<PartnerProtocolsActionResult> {
  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados do exercício.", ok: false };

  const videoUrl = normalizeExerciseVideo(parsed.data.videoUrl);
  if (parsed.data.videoUrl && !videoUrl) return { error: "Use um link válido do YouTube ou Vimeo.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { data, error } = await context.supabase
    .from("partner_protocol_exercises")
    .insert({
      cadence: nullable(parsed.data.cadence),
      default_reps: parsed.data.defaultReps,
      default_sets: parsed.data.defaultSets,
      equipment: parsed.data.equipment,
      instructions: nullable(parsed.data.instructions),
      level: parsed.data.level,
      muscle_group: parsed.data.muscleGroup,
      secondary_muscle_groups: parsed.data.secondaryMuscleGroups.filter((group) => group !== parsed.data.muscleGroup),
      name: parsed.data.name,
      objective: parsed.data.objective,
      partner_id: context.partnerId,
      rest_seconds: parsed.data.restSeconds,
      status: parsed.data.status,
      tags: parseProtocolTags(parsed.data.tags),
      thumbnail_url: nullable(parsed.data.thumbnailUrl),
      variations: parsed.data.variations,
      video_url: videoUrl,
    })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível salvar o exercício.", ok: false };

  await recordProtocolEvent(context, { eventType: "created", exerciseId: data.id, itemType: "exercise" });
  revalidateProtocols();
  return { id: data.id, message: "Exercício salvo.", ok: true };
}

export async function updatePartnerProtocolExercise(input: z.input<typeof updateExerciseSchema>): Promise<PartnerProtocolsActionResult> {
  const parsed = updateExerciseSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados do exercício.", ok: false };

  const videoUrl = normalizeExerciseVideo(parsed.data.videoUrl);
  if (parsed.data.videoUrl && !videoUrl) return { error: "Use um link válido do YouTube ou Vimeo.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_protocol_exercises")
    .update({
      cadence: nullable(parsed.data.cadence),
      default_reps: parsed.data.defaultReps,
      default_sets: parsed.data.defaultSets,
      equipment: parsed.data.equipment,
      instructions: nullable(parsed.data.instructions),
      level: parsed.data.level,
      muscle_group: parsed.data.muscleGroup,
      secondary_muscle_groups: parsed.data.secondaryMuscleGroups.filter((group) => group !== parsed.data.muscleGroup),
      name: parsed.data.name,
      objective: parsed.data.objective,
      rest_seconds: parsed.data.restSeconds,
      status: parsed.data.status,
      tags: parseProtocolTags(parsed.data.tags),
      thumbnail_url: nullable(parsed.data.thumbnailUrl),
      variations: parsed.data.variations,
      video_url: videoUrl,
    })
    .eq("id", parsed.data.exerciseId)
    .eq("partner_id", context.partnerId);

  if (error) return { error: "Não foi possível atualizar o exercício.", ok: false };

  await recordProtocolEvent(context, { eventType: "updated", exerciseId: parsed.data.exerciseId, itemType: "exercise" });
  revalidateProtocols();
  return { message: "Exercício atualizado.", ok: true };
}

export async function setPartnerProtocolArchived(input: z.input<typeof archiveSchema>): Promise<PartnerProtocolsActionResult> {
  const parsed = archiveSchema.safeParse(input);
  if (!parsed.success) return { error: "Item inválido.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const table = parsed.data.itemType === "food" ? "partner_protocol_foods" : "partner_protocol_exercises";
  const { error } = await context.supabase
    .from(table)
    .update({ status: parsed.data.value ? "archived" : "active" })
    .eq("id", parsed.data.id)
    .eq("partner_id", context.partnerId);

  if (error) return { error: "Não foi possível alterar o status.", ok: false };

  await recordProtocolEvent(context, {
    eventType: parsed.data.value ? "archived" : "restored",
    exerciseId: parsed.data.itemType === "exercise" ? parsed.data.id : null,
    foodId: parsed.data.itemType === "food" ? parsed.data.id : null,
    itemType: parsed.data.itemType,
  });
  revalidateProtocols();
  return { message: parsed.data.value ? "Item arquivado." : "Item restaurado.", ok: true };
}

export async function createPartnerProtocolUseDraft(input: z.input<typeof useDraftSchema>): Promise<PartnerProtocolsActionResult> {
  const parsed = useDraftSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados de uso.", ok: false };

  if (parsed.data.itemType === "food" && !parsed.data.foodId) {
    return { error: "Alimento inválido.", ok: false };
  }
  if (parsed.data.itemType === "exercise" && !parsed.data.exerciseId) {
    return { error: "Exercício inválido.", ok: false };
  }

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { data, error } = await context.supabase
    .from("partner_protocol_use_drafts")
    .insert({
      exercise_id: parsed.data.itemType === "exercise" ? parsed.data.exerciseId : null,
      food_id: parsed.data.itemType === "food" ? parsed.data.foodId : null,
      item_type: parsed.data.itemType,
      notes: nullable(parsed.data.notes),
      partner_id: context.partnerId,
      patient_id: parsed.data.patientId,
      plan_context: parsed.data.planContext,
    })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível registrar o uso em plano.", ok: false };

  const table = parsed.data.itemType === "food" ? "partner_protocol_foods" : "partner_protocol_exercises";
  const id = parsed.data.itemType === "food" ? parsed.data.foodId : parsed.data.exerciseId;
  if (!id) return { error: "Item inválido.", ok: false };
  const { data: currentRows } = await context.supabase
    .from(table)
    .select("usage_count")
    .eq("id", id)
    .eq("partner_id", context.partnerId)
    .limit(1);
  const current = Array.isArray(currentRows) && currentRows[0]?.usage_count ? Number(currentRows[0].usage_count) : 0;
  await context.supabase
    .from(table)
    .update({ usage_count: current + 1 })
    .eq("id", id)
    .eq("partner_id", context.partnerId);

  await recordProtocolEvent(context, {
    details: { draftId: data.id, planContext: parsed.data.planContext },
    eventType: "used",
    exerciseId: parsed.data.exerciseId,
    foodId: parsed.data.foodId,
    itemType: parsed.data.itemType,
  });
  revalidateProtocols();
  return { id: data.id, message: "Uso registrado como rascunho.", ok: true };
}

export const protocolActionOptions = {
  equipments: ["barra", "halteres", "maquina", "polia", "peso_corporal", "elastico", "kettlebell", "outros"] satisfies PartnerProtocolExerciseEquipment[],
  foodCategories: ["cereal", "carne", "fruta", "gordura", "laticinio", "leguminosa", "suplemento", "verdura", "outros"] satisfies PartnerProtocolFoodCategory[],
  foodSources: ["taco", "tbca", "custom", "imported"] satisfies PartnerProtocolFoodSource[],
  levels: ["iniciante", "intermediario", "avancado"] satisfies PartnerProtocolExerciseLevel[],
  muscleGroups: ["peito", "costas", "pernas", "ombros", "biceps", "triceps", "core", "gluteos", "cardio_condicionamento", "mobilidade", "outros"] satisfies PartnerProtocolExerciseMuscleGroup[],
  objectives: ["forca", "hipertrofia", "resistencia", "mobilidade", "reabilitacao", "condicionamento"] satisfies PartnerProtocolExerciseObjective[],
};
