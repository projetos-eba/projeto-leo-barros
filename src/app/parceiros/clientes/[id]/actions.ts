"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export type ClientOverviewActionResult = {
  error?: string;
  id?: string;
  message?: string;
  ok: boolean;
};

const patientIdSchema = z.string().uuid();

const appointmentSchema = z.object({
  durationMinutes: z.number().int().min(15).max(240),
  notes: z.string().trim().max(500).optional(),
  patientId: patientIdSchema,
  startsAt: z.string().datetime(),
  title: z.string().trim().min(3).max(100),
});

const taskSchema = z.object({
  dueAt: z.string().datetime().nullable(),
  patientId: patientIdSchema,
  priority: z.enum(["low", "medium", "high"]),
  title: z.string().trim().min(3).max(140),
});

const taskStatusSchema = z.object({
  completed: z.boolean(),
  patientId: patientIdSchema,
  taskId: z.string().uuid(),
});

const circumferenceKeys = [
  "chest",
  "waist",
  "abdomen",
  "hip",
  "right_arm_relaxed",
  "right_arm_contracted",
  "left_arm_relaxed",
  "left_arm_contracted",
  "right_forearm",
  "left_forearm",
  "right_thigh",
  "left_thigh",
  "right_calf",
  "left_calf",
] as const;

const skinfoldKeys = [
  "pectoral",
  "abdominal",
  "triceps",
  "subscapular",
  "axillary",
  "suprailiac",
  "thigh",
  "medial_calf",
] as const;

const activityLevelSchema = z.enum(["sedentary", "light", "moderate", "active", "athlete"]);
const formulaSchema = z.enum(["mifflin", "harris_benedict", "cunningham", "tinsley"]);
const assessmentMethodSchema = z.enum(["pollock_7", "pollock_3", "bioimpedance", "manual"]);

const assessmentSchema = z.object({
  activityLevel: activityLevelSchema,
  assessmentMethod: assessmentMethodSchema,
  assessedAt: z.string().datetime(),
  assessmentId: z.string().uuid().optional(),
  bodyFatPercentage: z.number().min(1).max(80).nullable(),
  circumferences: z.array(z.object({
    metricKey: z.enum(circumferenceKeys),
    valueCm: z.number().min(5).max(250),
  })).max(circumferenceKeys.length),
  heightCm: z.number().min(80).max(260),
  muscleMassKg: z.number().min(5).max(200).nullable(),
  notes: z.string().trim().max(700).nullable(),
  patientId: patientIdSchema,
  skinfolds: z.array(z.object({
    metricKey: z.enum(skinfoldKeys),
    valueMm: z.number().min(1).max(100),
  })).max(skinfoldKeys.length),
  targetDays: z.number().int().min(7).max(730),
  targetWeightKg: z.number().min(20).max(350).nullable(),
  title: z.string().trim().min(3).max(100),
  weightKg: z.number().min(20).max(350),
});

const calorieCalculationSchema = z.object({
  activityFactor: z.number().min(1).max(2.5),
  assessmentId: z.string().uuid().nullable(),
  bmrKcal: z.number().int().positive(),
  dailyEnergyDeltaKcal: z.number().int(),
  formula: formulaSchema,
  inputs: z.record(z.unknown()),
  patientId: patientIdSchema,
  projectedWeightDeltaKg: z.number().min(-200).max(200),
  targetDays: z.number().int().min(7).max(730),
  targetKcal: z.number().int().positive(),
  targetWeightKg: z.number().min(20).max(350).nullable(),
  tdeeKcal: z.number().int().positive(),
  weeklyEnergyDeltaKcal: z.number().int(),
});

const applyCalculationSchema = z.object({
  calculationId: z.string().uuid(),
  patientId: patientIdSchema,
});

const workoutObjectiveSchema = z.enum(["forca", "hipertrofia", "resistencia", "mobilidade", "reabilitacao", "condicionamento"]);
const workoutTechniqueSchema = z.enum(["normal", "biset", "dropset", "rest_pause", "superset", "cluster", "isometria"]);
const workoutIntensitySchema = z.enum(["warmup", "moderate", "maximum"]);
const workoutProgramSchema = z.object({
  patientId: patientIdSchema,
  title: z.string().trim().min(2).max(140),
});
const workoutSessionSchema = z.object({
  durationMinutes: z.number().int().min(5).max(300),
  frequencyPerWeek: z.number().int().min(1).max(14),
  objective: workoutObjectiveSchema,
  patientId: patientIdSchema,
  programId: z.string().uuid(),
  title: z.string().trim().min(1).max(80),
});
const workoutExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  patientId: patientIdSchema,
  sessionId: z.string().uuid(),
  variationName: z.string().trim().max(140).nullable(),
});
const workoutSetSchema = z.object({
  intensity: workoutIntensitySchema,
  loadKg: z.number().min(0).max(2000).nullable(),
  patientId: patientIdSchema,
  reps: z.number().int().min(1).max(500).nullable(),
  setId: z.string().uuid(),
});
const workoutExerciseUpdateSchema = z.object({
  cadence: z.string().trim().max(40).nullable(),
  exerciseId: z.string().uuid(),
  notes: z.string().trim().max(300).nullable(),
  patientId: patientIdSchema,
  restSeconds: z.number().int().min(0).max(600),
  technique: workoutTechniqueSchema.exclude(["biset"]),
  variationName: z.string().trim().max(140).nullable(),
});
const workoutIdSchema = z.object({
  patientId: patientIdSchema,
  programId: z.string().uuid(),
});
const workoutNotesSchema = workoutIdSchema.extend({
  notes: z.string().trim().max(2000).nullable(),
});
const workoutBisetSchema = z.object({
  firstExerciseId: z.string().uuid(),
  patientId: patientIdSchema,
  secondExerciseId: z.string().uuid(),
});
const workoutReorderSchema = z.object({
  exerciseIds: z.array(z.string().uuid()).min(1).max(100),
  patientId: patientIdSchema,
  sessionId: z.string().uuid(),
});

type WorkoutQueryResult = {
  data: unknown;
  error: { message: string } | null;
};

type WorkoutQuery = PromiseLike<WorkoutQueryResult> & {
  delete(): WorkoutQuery;
  eq(column: string, value: unknown): WorkoutQuery;
  in(column: string, values: unknown[]): WorkoutQuery;
  insert(values: unknown): WorkoutQuery;
  limit(value: number): WorkoutQuery;
  maybeSingle(): WorkoutQuery;
  order(column: string, options?: { ascending?: boolean }): WorkoutQuery;
  select(columns?: string): WorkoutQuery;
  single(): WorkoutQuery;
  update(values: unknown): WorkoutQuery;
};

type WorkoutDb = {
  from(table: string): WorkoutQuery;
  rpc(name: string, params: Record<string, unknown>): PromiseLike<WorkoutQueryResult>;
};

function workoutDb(context: Awaited<ReturnType<typeof getPartnerContext>>) {
  return context.supabase as unknown as WorkoutDb;
}

function parseExerciseDefaultReps(value: unknown) {
  const parsed = Number(String(value ?? "").match(/\d+/)?.[0] ?? 10);
  return Math.max(1, Math.min(500, parsed));
}

async function getPartnerContext() {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile();

  if (!profile) {
    return { error: "Sessão do parceiro indisponível.", partnerId: null, profileName: null, supabase };
  }

  const { data: partner, error } = await supabase
    .from("partners")
    .select("id, professional_name")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (error || !partner) {
    return { error: "Cadastro do parceiro indisponível.", partnerId: null, profileName: null, supabase };
  }

  return { error: null, partnerId: partner.id, profileName: partner.professional_name, supabase };
}

export async function createClientAppointment(
  input: z.input<typeof appointmentSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados do agendamento.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const startsAt = new Date(parsed.data.startsAt);
  if (startsAt.getTime() <= Date.now()) {
    return { error: "Escolha uma data futura para a consulta.", ok: false };
  }

  const endsAt = new Date(startsAt.getTime() + parsed.data.durationMinutes * 60_000);
  const { error } = await context.supabase.from("partner_client_appointments").insert({
    ends_at: endsAt.toISOString(),
    notes: parsed.data.notes || null,
    partner_id: context.partnerId,
    patient_id: parsed.data.patientId,
    starts_at: startsAt.toISOString(),
    status: "scheduled",
    title: parsed.data.title,
  });

  if (error) return { error: "Não foi possível agendar a consulta.", ok: false };

  revalidatePath(`/parceiros/clientes/${parsed.data.patientId}`);
  return { message: "Consulta agendada com sucesso.", ok: true };
}

export async function createClientTask(
  input: z.input<typeof taskSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados da tarefa.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase.from("partner_client_tasks").insert({
    due_at: parsed.data.dueAt,
    partner_id: context.partnerId,
    patient_id: parsed.data.patientId,
    priority: parsed.data.priority,
    status: "pending",
    title: parsed.data.title,
  });

  if (error) return { error: "Não foi possível adicionar a tarefa.", ok: false };

  revalidatePath(`/parceiros/clientes/${parsed.data.patientId}`);
  return { message: "Tarefa adicionada.", ok: true };
}

export async function setClientTaskCompleted(
  input: z.input<typeof taskStatusSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = taskStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Tarefa inválida.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_client_tasks")
    .update({
      completed_at: parsed.data.completed ? new Date().toISOString() : null,
      status: parsed.data.completed ? "completed" : "pending",
    })
    .eq("id", parsed.data.taskId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId);

  if (error) return { error: "Não foi possível atualizar a tarefa.", ok: false };

  revalidatePath(`/parceiros/clientes/${parsed.data.patientId}`);
  return { message: parsed.data.completed ? "Tarefa concluída." : "Tarefa reaberta.", ok: true };
}

function normalizeNullable(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function revalidateClient(patientId: string) {
  revalidatePath(`/parceiros/clientes/${patientId}`);
}

export async function saveClientAssessment(
  input: z.input<typeof assessmentSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = assessmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados da avaliação.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const assessmentPayload = {
    activity_level: parsed.data.activityLevel,
    assessment_method: parsed.data.assessmentMethod,
    assessed_at: parsed.data.assessedAt,
    body_fat_percentage: parsed.data.bodyFatPercentage,
    height_cm: parsed.data.heightCm,
    muscle_mass_kg: parsed.data.muscleMassKg,
    notes: normalizeNullable(parsed.data.notes),
    partner_id: context.partnerId,
    patient_id: parsed.data.patientId,
    target_days: parsed.data.targetDays,
    target_weight_kg: parsed.data.targetWeightKg,
    title: parsed.data.title,
    weight_kg: parsed.data.weightKg,
  };

  let assessmentId = parsed.data.assessmentId ?? null;

  if (assessmentId) {
    const { error } = await context.supabase
      .from("partner_client_assessments")
      .update(assessmentPayload)
      .eq("id", assessmentId)
      .eq("partner_id", context.partnerId)
      .eq("patient_id", parsed.data.patientId);

    if (error) return { error: "Não foi possível atualizar a avaliação.", ok: false };

    const { error: deleteError } = await context.supabase
      .from("partner_client_assessment_circumferences")
      .delete()
      .eq("assessment_id", assessmentId)
      .eq("partner_id", context.partnerId)
      .eq("patient_id", parsed.data.patientId);

    if (deleteError) return { error: "Não foi possível atualizar as medidas.", ok: false };

    const { error: skinfoldDeleteError } = await context.supabase
      .from("partner_client_assessment_skinfolds")
      .delete()
      .eq("assessment_id", assessmentId)
      .eq("partner_id", context.partnerId)
      .eq("patient_id", parsed.data.patientId);

    if (skinfoldDeleteError) return { error: "Não foi possível atualizar as dobras cutâneas.", ok: false };
  } else {
    const { data, error } = await context.supabase
      .from("partner_client_assessments")
      .insert(assessmentPayload)
      .select("id")
      .single();

    if (error || !data) return { error: "Não foi possível salvar a avaliação.", ok: false };
    assessmentId = data.id;
  }

  if (parsed.data.circumferences.length > 0) {
    const { error } = await context.supabase.from("partner_client_assessment_circumferences").insert(
      parsed.data.circumferences.map((circumference) => ({
        assessment_id: assessmentId,
        metric_key: circumference.metricKey,
        partner_id: context.partnerId,
        patient_id: parsed.data.patientId,
        value_cm: circumference.valueCm,
      })),
    );

    if (error) return { error: "Não foi possível salvar as circunferências.", ok: false };
  }

  if (parsed.data.skinfolds.length > 0) {
    const { error } = await context.supabase.from("partner_client_assessment_skinfolds").insert(
      parsed.data.skinfolds.map((skinfold) => ({
        assessment_id: assessmentId,
        metric_key: skinfold.metricKey,
        partner_id: context.partnerId,
        patient_id: parsed.data.patientId,
        value_mm: skinfold.valueMm,
      })),
    );

    if (error) return { error: "Não foi possível salvar as dobras cutâneas.", ok: false };
  }

  if (!parsed.data.assessmentId) {
    const { error } = await context.supabase.from("partner_client_body_measurements").insert({
      body_fat_percentage: parsed.data.bodyFatPercentage,
      measured_at: parsed.data.assessedAt,
      notes: normalizeNullable(parsed.data.notes),
      partner_id: context.partnerId,
      patient_id: parsed.data.patientId,
      weight_kg: parsed.data.weightKg,
    });

    if (error) return { error: "Avaliação salva, mas a Visão Geral não foi sincronizada.", ok: false };
  }

  revalidateClient(parsed.data.patientId);
  return { message: parsed.data.assessmentId ? "Avaliação atualizada." : "Avaliação salva.", ok: true };
}

export async function saveClientCalorieCalculation(
  input: z.input<typeof calorieCalculationSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = calorieCalculationSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise o cálculo calórico.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { data, error } = await context.supabase
    .from("partner_client_calorie_calculations")
    .insert({
      activity_factor: parsed.data.activityFactor,
      assessment_id: parsed.data.assessmentId,
      bmr_kcal: parsed.data.bmrKcal,
      daily_energy_delta_kcal: parsed.data.dailyEnergyDeltaKcal,
      formula: parsed.data.formula,
      inputs: parsed.data.inputs as Json,
      partner_id: context.partnerId,
      patient_id: parsed.data.patientId,
      projected_weight_delta_kg: parsed.data.projectedWeightDeltaKg,
      status: "saved",
      target_days: parsed.data.targetDays,
      target_kcal: parsed.data.targetKcal,
      target_weight_kg: parsed.data.targetWeightKg,
      tdee_kcal: parsed.data.tdeeKcal,
      weekly_energy_delta_kcal: parsed.data.weeklyEnergyDeltaKcal,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível salvar o cálculo.", ok: false };

  revalidateClient(parsed.data.patientId);
  return { id: data.id, message: "Cálculo salvo.", ok: true };
}

export async function applyClientCalorieCalculation(
  input: z.input<typeof applyCalculationSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = applyCalculationSchema.safeParse(input);
  if (!parsed.success) return { error: "Cálculo inválido.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error: resetError } = await context.supabase
    .from("partner_client_calorie_calculations")
    .update({ status: "saved" })
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId)
    .eq("status", "applied");

  if (resetError) return { error: "Não foi possível atualizar o plano.", ok: false };

  const { error } = await context.supabase
    .from("partner_client_calorie_calculations")
    .update({ status: "applied" })
    .eq("id", parsed.data.calculationId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId);

  if (error) return { error: "Não foi possível aplicar o cálculo.", ok: false };

  revalidateClient(parsed.data.patientId);
  return { message: "Cálculo aplicado ao plano atual.", ok: true };
}

async function recordWorkoutEvent(
  context: Awaited<ReturnType<typeof getPartnerContext>>,
  input: { detail: string; eventType: string; patientId: string | null; programId: string; version?: number },
) {
  if (!context.partnerId) return;
  await workoutDb(context).from("partner_workout_events").insert({
    actor_name: context.profileName,
    detail: input.detail,
    event_type: input.eventType,
    partner_id: context.partnerId,
    patient_id: input.patientId,
    program_id: input.programId,
    version: input.version ?? 1,
  });
}

export async function createClientWorkoutProgram(input: z.input<typeof workoutProgramSchema>): Promise<ClientOverviewActionResult> {
  const parsed = workoutProgramSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados do treino.", ok: false };
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const db = workoutDb(context);
  const { data, error } = await db.from("partner_workout_programs").insert({
    partner_id: context.partnerId,
    patient_id: parsed.data.patientId,
    program_kind: "client",
    status: "draft",
    title: parsed.data.title,
  }).select("id").single();
  const program = data as { id: string } | null;
  if (error || !program) return { error: "Não foi possível criar o programa.", ok: false };
  const { error: sessionError } = await db.from("partner_workout_sessions").insert({
    duration_minutes: 60,
    frequency_per_week: 2,
    objective: "hipertrofia",
    partner_id: context.partnerId,
    program_id: program.id,
    sort_order: 0,
    title: "Treino A",
  });
  if (sessionError) return { error: "Programa criado, mas não foi possível criar o Treino A.", ok: false };
  await recordWorkoutEvent(context, { detail: "Programa de treinos criado.", eventType: "created", patientId: parsed.data.patientId, programId: program.id });
  revalidateClient(parsed.data.patientId);
  return { id: program.id, message: "Programa criado.", ok: true };
}

export async function createClientWorkoutSession(input: z.input<typeof workoutSessionSchema>): Promise<ClientOverviewActionResult> {
  const parsed = workoutSessionSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados da divisão.", ok: false };
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const db = workoutDb(context);
  const { data: rows } = await db.from("partner_workout_sessions").select("sort_order")
    .eq("partner_id", context.partnerId).eq("program_id", parsed.data.programId)
    .order("sort_order", { ascending: false }).limit(1);
  const last = (rows as Array<{ sort_order: number }> | null)?.[0]?.sort_order ?? -1;
  const { data, error } = await db.from("partner_workout_sessions").insert({
    duration_minutes: parsed.data.durationMinutes,
    frequency_per_week: parsed.data.frequencyPerWeek,
    objective: parsed.data.objective,
    partner_id: context.partnerId,
    program_id: parsed.data.programId,
    sort_order: last + 1,
    title: parsed.data.title,
  }).select("id").single();
  const session = data as { id: string } | null;
  if (error || !session) return { error: "Não foi possível criar a divisão.", ok: false };
  await recordWorkoutEvent(context, { detail: `${parsed.data.title} criado.`, eventType: "updated", patientId: parsed.data.patientId, programId: parsed.data.programId });
  revalidateClient(parsed.data.patientId);
  return { id: session.id, message: "Divisão criada.", ok: true };
}

export async function addClientWorkoutExercise(input: z.input<typeof workoutExerciseSchema>): Promise<ClientOverviewActionResult> {
  const parsed = workoutExerciseSchema.safeParse(input);
  if (!parsed.success) return { error: "Exercício inválido.", ok: false };
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const db = workoutDb(context);
  const { data: exerciseData, error: exerciseError } = await db.from("partner_protocol_exercises")
    .select("id,name,muscle_group,secondary_muscle_groups,default_sets,default_reps,rest_seconds,cadence,thumbnail_url")
    .eq("id", parsed.data.exerciseId).eq("partner_id", context.partnerId).maybeSingle();
  const library = exerciseData as {
    cadence: string | null; default_reps: string; default_sets: number; id: string;
    muscle_group: string; name: string; rest_seconds: number;
    secondary_muscle_groups: string[]; thumbnail_url: string | null;
  } | null;
  if (exerciseError || !library) return { error: "Exercício não encontrado em Cadastros.", ok: false };
  const { data: orderRows } = await db.from("partner_workout_exercises").select("sort_order")
    .eq("partner_id", context.partnerId).eq("session_id", parsed.data.sessionId)
    .order("sort_order", { ascending: false }).limit(1);
  const lastOrder = (orderRows as Array<{ sort_order: number }> | null)?.[0]?.sort_order ?? -1;
  const { data, error } = await db.from("partner_workout_exercises").insert({
    cadence: library.cadence,
    exercise_id: library.id,
    partner_id: context.partnerId,
    rest_seconds: library.rest_seconds,
    session_id: parsed.data.sessionId,
    snapshot_muscle_group: library.muscle_group,
    snapshot_name: library.name,
    snapshot_secondary_muscle_groups: library.secondary_muscle_groups ?? [],
    snapshot_thumbnail_url: library.thumbnail_url,
    sort_order: lastOrder + 1,
    technique: "normal",
    variation_name: parsed.data.variationName,
  }).select("id").single();
  const prescribed = data as { id: string } | null;
  if (error || !prescribed) return { error: "Não foi possível adicionar o exercício.", ok: false };
  const reps = parseExerciseDefaultReps(library.default_reps);
  const setCount = Math.max(1, Math.min(6, library.default_sets));
  const { error: setError } = await db.from("partner_workout_sets").insert(
    Array.from({ length: setCount }, (_, index) => ({
      intensity: index === 0 ? "warmup" : "moderate",
      partner_id: context.partnerId,
      prescribed_exercise_id: prescribed.id,
      reps,
      set_number: index + 1,
    })),
  );
  if (setError) return { error: "Exercício adicionado, mas as séries não foram criadas.", ok: false };
  revalidateClient(parsed.data.patientId);
  return { id: prescribed.id, message: "Exercício adicionado.", ok: true };
}

export async function updateClientWorkoutSet(input: z.input<typeof workoutSetSchema>): Promise<ClientOverviewActionResult> {
  const parsed = workoutSetSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise a série.", ok: false };
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const { error } = await workoutDb(context).from("partner_workout_sets").update({
    intensity: parsed.data.intensity,
    load_kg: parsed.data.loadKg,
    reps: parsed.data.reps,
  }).eq("id", parsed.data.setId).eq("partner_id", context.partnerId);
  if (error) return { error: "Não foi possível atualizar a série.", ok: false };
  revalidateClient(parsed.data.patientId);
  return { message: "Série atualizada.", ok: true };
}

export async function addClientWorkoutSet(input: { exerciseId: string; patientId: string }): Promise<ClientOverviewActionResult> {
  const parsed = z.object({ exerciseId: z.string().uuid(), patientId: patientIdSchema }).safeParse(input);
  if (!parsed.success) return { error: "Exercício inválido.", ok: false };
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const db = workoutDb(context);
  const { data } = await db.from("partner_workout_sets").select("set_number,reps,load_kg,intensity")
    .eq("partner_id", context.partnerId).eq("prescribed_exercise_id", parsed.data.exerciseId)
    .order("set_number", { ascending: false }).limit(1);
  const previous = (data as Array<{ intensity: string; load_kg: number | null; reps: number | null; set_number: number }> | null)?.[0];
  if (previous && previous.set_number >= 12) return { error: "Limite de séries atingido.", ok: false };
  const { error } = await db.from("partner_workout_sets").insert({
    intensity: previous?.intensity ?? "moderate",
    load_kg: previous?.load_kg ?? null,
    partner_id: context.partnerId,
    prescribed_exercise_id: parsed.data.exerciseId,
    reps: previous?.reps ?? null,
    set_number: (previous?.set_number ?? 0) + 1,
  });
  if (error) return { error: "Não foi possível adicionar a série.", ok: false };
  revalidateClient(parsed.data.patientId);
  return { message: "Série adicionada com a sugestão anterior.", ok: true };
}

export async function removeClientWorkoutSet(input: { patientId: string; setId: string }): Promise<ClientOverviewActionResult> {
  const parsed = z.object({ patientId: patientIdSchema, setId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { error: "Série inválida.", ok: false };
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const { error } = await workoutDb(context).from("partner_workout_sets").delete()
    .eq("id", parsed.data.setId).eq("partner_id", context.partnerId);
  if (error) return { error: "Não foi possível remover a série.", ok: false };
  revalidateClient(parsed.data.patientId);
  return { message: "Série removida.", ok: true };
}

export async function updateClientWorkoutExercise(input: z.input<typeof workoutExerciseUpdateSchema>): Promise<ClientOverviewActionResult> {
  const parsed = workoutExerciseUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise o exercício.", ok: false };
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const { error } = await workoutDb(context).from("partner_workout_exercises").update({
    cadence: parsed.data.cadence,
    notes: parsed.data.notes,
    rest_seconds: parsed.data.restSeconds,
    technique: parsed.data.technique,
    variation_name: parsed.data.variationName,
  }).eq("id", parsed.data.exerciseId).eq("partner_id", context.partnerId);
  if (error) return { error: "Não foi possível atualizar o exercício.", ok: false };
  revalidateClient(parsed.data.patientId);
  return { message: "Exercício atualizado.", ok: true };
}

export async function removeClientWorkoutExercise(input: { exerciseId: string; patientId: string }): Promise<ClientOverviewActionResult> {
  const parsed = z.object({ exerciseId: z.string().uuid(), patientId: patientIdSchema }).safeParse(input);
  if (!parsed.success) return { error: "Exercício inválido.", ok: false };
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const { error } = await workoutDb(context).from("partner_workout_exercises").delete()
    .eq("id", parsed.data.exerciseId).eq("partner_id", context.partnerId);
  if (error) return { error: "Não foi possível remover o exercício.", ok: false };
  revalidateClient(parsed.data.patientId);
  return { message: "Exercício removido.", ok: true };
}

export async function combineClientWorkoutBiset(input: z.input<typeof workoutBisetSchema>): Promise<ClientOverviewActionResult> {
  const parsed = workoutBisetSchema.safeParse(input);
  if (!parsed.success || parsed.data.firstExerciseId === parsed.data.secondExerciseId) return { error: "Selecione dois exercícios.", ok: false };
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const db = workoutDb(context);
  const { data: pairData } = await db.from("partner_workout_exercises").select("id,session_id,sort_order")
    .eq("partner_id", context.partnerId)
    .in("id", [parsed.data.firstExerciseId, parsed.data.secondExerciseId]);
  const pair = pairData as Array<{ id: string; session_id: string; sort_order: number }> | null;
  if (!pair || pair.length !== 2 || pair[0].session_id !== pair[1].session_id || Math.abs(pair[0].sort_order - pair[1].sort_order) !== 1) {
    return { error: "O Bi-set exige dois exercícios adjacentes da mesma divisão.", ok: false };
  }
  const groupId = crypto.randomUUID();
  const first = await db.from("partner_workout_exercises").update({ biset_group_id: groupId, biset_position: 1, technique: "biset" })
    .eq("id", parsed.data.firstExerciseId).eq("partner_id", context.partnerId);
  if (first.error) return { error: "Não foi possível criar o Bi-set.", ok: false };
  const second = await db.from("partner_workout_exercises").update({ biset_group_id: groupId, biset_position: 2, technique: "biset" })
    .eq("id", parsed.data.secondExerciseId).eq("partner_id", context.partnerId);
  if (second.error) return { error: "Não foi possível concluir o Bi-set.", ok: false };
  revalidateClient(parsed.data.patientId);
  return { message: "Bi-set criado.", ok: true };
}

export async function uncombineClientWorkoutBiset(input: z.input<typeof workoutBisetSchema>): Promise<ClientOverviewActionResult> {
  const parsed = workoutBisetSchema.safeParse(input);
  if (!parsed.success) return { error: "Bi-set inválido.", ok: false };
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const { error } = await workoutDb(context).from("partner_workout_exercises").update({
    biset_group_id: null,
    biset_position: null,
    technique: "normal",
  }).eq("partner_id", context.partnerId).in("id", [parsed.data.firstExerciseId, parsed.data.secondExerciseId]);
  if (error) return { error: "Não foi possível desfazer o Bi-set.", ok: false };
  revalidateClient(parsed.data.patientId);
  return { message: "Bi-set desfeito.", ok: true };
}

export async function reorderClientWorkoutExercises(input: z.input<typeof workoutReorderSchema>): Promise<ClientOverviewActionResult> {
  const parsed = workoutReorderSchema.safeParse(input);
  if (!parsed.success) return { error: "Ordem inválida.", ok: false };
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const db = workoutDb(context);
  for (const [sortOrder, id] of parsed.data.exerciseIds.entries()) {
    const { error } = await db.from("partner_workout_exercises").update({ sort_order: sortOrder })
      .eq("id", id).eq("session_id", parsed.data.sessionId).eq("partner_id", context.partnerId);
    if (error) return { error: "Não foi possível salvar a ordem.", ok: false };
  }
  revalidateClient(parsed.data.patientId);
  return { message: "Ordem atualizada.", ok: true };
}

export async function saveClientWorkoutNotes(input: z.input<typeof workoutNotesSchema>): Promise<ClientOverviewActionResult> {
  const parsed = workoutNotesSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise as observações.", ok: false };
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const { error } = await workoutDb(context).from("partner_workout_programs")
    .update({ notes: normalizeNullable(parsed.data.notes), status: "draft" })
    .eq("id", parsed.data.programId).eq("partner_id", context.partnerId).eq("patient_id", parsed.data.patientId);
  if (error) return { error: "Não foi possível salvar as observações.", ok: false };
  await recordWorkoutEvent(context, { detail: "Observações do treino atualizadas.", eventType: "updated", patientId: parsed.data.patientId, programId: parsed.data.programId });
  revalidateClient(parsed.data.patientId);
  return { message: "Observações salvas.", ok: true };
}

export async function duplicateClientWorkoutProgram(input: z.input<typeof workoutIdSchema>): Promise<ClientOverviewActionResult> {
  const parsed = workoutIdSchema.safeParse(input);
  if (!parsed.success) return { error: "Programa inválido.", ok: false };
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const { data, error } = await workoutDb(context).rpc("partner_clone_workout_program", {
    p_as_template: false, p_patient_id: parsed.data.patientId, p_source_program_id: parsed.data.programId,
  });
  if (error || !data) return { error: "Não foi possível duplicar o programa.", ok: false };
  await recordWorkoutEvent(context, { detail: "Programa duplicado.", eventType: "duplicated", patientId: parsed.data.patientId, programId: String(data) });
  revalidateClient(parsed.data.patientId);
  return { id: String(data), message: "Programa duplicado.", ok: true };
}

export async function saveClientWorkoutTemplate(input: z.input<typeof workoutIdSchema>): Promise<ClientOverviewActionResult> {
  const parsed = workoutIdSchema.safeParse(input);
  if (!parsed.success) return { error: "Programa inválido.", ok: false };
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const { data, error } = await workoutDb(context).rpc("partner_clone_workout_program", {
    p_as_template: true, p_patient_id: parsed.data.patientId, p_source_program_id: parsed.data.programId,
  });
  if (error || !data) return { error: "Não foi possível salvar o template.", ok: false };
  revalidateClient(parsed.data.patientId);
  return { id: String(data), message: "Template salvo.", ok: true };
}

export async function applyClientWorkoutTemplate(input: { patientId: string; templateId: string }): Promise<ClientOverviewActionResult> {
  const parsed = z.object({ patientId: patientIdSchema, templateId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { error: "Template inválido.", ok: false };
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const { data, error } = await workoutDb(context).rpc("partner_clone_workout_program", {
    p_as_template: false, p_patient_id: parsed.data.patientId, p_source_program_id: parsed.data.templateId,
  });
  if (error || !data) return { error: "Não foi possível aplicar o template.", ok: false };
  await recordWorkoutEvent(context, { detail: "Template aplicado ao Cliente.", eventType: "template_applied", patientId: parsed.data.patientId, programId: String(data) });
  revalidateClient(parsed.data.patientId);
  return { id: String(data), message: "Template aplicado.", ok: true };
}

async function setWorkoutProgramStatus(input: z.input<typeof workoutIdSchema>, status: "published" | "sent") {
  const parsed = workoutIdSchema.safeParse(input);
  if (!parsed.success) return { error: "Programa inválido.", ok: false } satisfies ClientOverviewActionResult;
  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false } satisfies ClientOverviewActionResult;
  const db = workoutDb(context);
  if (status === "published") {
    await db.from("partner_workout_programs").update({ status: "archived" })
      .eq("partner_id", context.partnerId).eq("patient_id", parsed.data.patientId).in("status", ["published", "sent"]);
  }
  const payload = status === "sent"
    ? { sent_at: new Date().toISOString(), status }
    : { published_at: new Date().toISOString(), status };
  const { error } = await db.from("partner_workout_programs").update(payload)
    .eq("id", parsed.data.programId).eq("partner_id", context.partnerId).eq("patient_id", parsed.data.patientId);
  if (error) return { error: "Não foi possível atualizar o programa.", ok: false } satisfies ClientOverviewActionResult;
  await recordWorkoutEvent(context, {
    detail: status === "sent" ? "Programa enviado ao Cliente." : "Programa publicado.",
    eventType: status, patientId: parsed.data.patientId, programId: parsed.data.programId,
  });
  revalidateClient(parsed.data.patientId);
  return { message: status === "sent" ? "Programa enviado." : "Programa publicado.", ok: true } satisfies ClientOverviewActionResult;
}

export async function publishClientWorkoutProgram(input: z.input<typeof workoutIdSchema>) {
  return setWorkoutProgramStatus(input, "published");
}

export async function sendClientWorkoutProgram(input: z.input<typeof workoutIdSchema>) {
  return setWorkoutProgramStatus(input, "sent");
}


const dietPlanSchema = z.object({
  calorieStrategy: z.enum(["deficit", "maintenance", "surplus"]),
  notes: z.string().trim().max(2000).nullable(),
  patientId: patientIdSchema,
  targetCarbsG: z.number().min(0).max(2000),
  targetFatG: z.number().min(0).max(1000),
  targetKcal: z.number().int().min(0).max(20000),
  targetProteinG: z.number().min(0).max(2000),
  title: z.string().trim().min(2).max(140),
  waterLiters: z.number().min(0).max(15),
});

const dietPlanIdSchema = z.object({
  patientId: patientIdSchema,
  planId: z.string().uuid(),
});

const dietPlanTargetsSchema = dietPlanSchema
  .pick({
    calorieStrategy: true,
    targetCarbsG: true,
    targetFatG: true,
    targetKcal: true,
    targetProteinG: true,
    waterLiters: true,
  })
  .extend({
    patientId: patientIdSchema,
    planId: z.string().uuid(),
  });

const dietNotesSchema = z.object({
  notes: z.string().trim().max(2000).nullable(),
  patientId: patientIdSchema,
  planId: z.string().uuid(),
});

const dietMealSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  mealTime: z.string().regex(/^\d{2}:\d{2}$/),
  patientId: patientIdSchema,
  planId: z.string().uuid(),
  title: z.string().trim().min(2).max(80),
});

const dietMealIdSchema = z.object({
  mealId: z.string().uuid(),
  patientId: patientIdSchema,
  planId: z.string().uuid(),
});

const dietItemSchema = z.object({
  draftId: z.string().uuid().nullable(),
  foodId: z.string().uuid(),
  mealId: z.string().uuid(),
  patientId: patientIdSchema,
  planId: z.string().uuid(),
  quantity: z.number().min(0.01).max(100000),
});

const dietItemUpdateSchema = z.object({
  itemId: z.string().uuid(),
  patientId: patientIdSchema,
  planId: z.string().uuid(),
  quantity: z.number().min(0.01).max(100000),
});

const dietItemIdSchema = z.object({
  itemId: z.string().uuid(),
  patientId: patientIdSchema,
  planId: z.string().uuid(),
});

async function recordDietEvent(
  context: Awaited<ReturnType<typeof getPartnerContext>>,
  input: {
    detail: string;
    eventType: string;
    patientId: string;
    planId: string;
    version?: number;
    details?: Json;
  },
) {
  if (!context.partnerId) return;
  await context.supabase.from("partner_client_diet_events").insert({
    actor_name: context.profileName,
    detail: input.detail,
    details: input.details ?? {},
    event_type: input.eventType,
    partner_id: context.partnerId,
    patient_id: input.patientId,
    plan_id: input.planId,
    version: input.version ?? 1,
  });
}

async function bumpDietPlan(
  context: Awaited<ReturnType<typeof getPartnerContext>>,
  patientId: string,
  planId: string,
) {
  if (!context.partnerId) return 1;
  const { data } = await context.supabase
    .from("partner_client_diet_plans")
    .select("version")
    .eq("id", planId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", patientId)
    .maybeSingle();
  const nextVersion = Number(data?.version ?? 1) + 1;
  await context.supabase
    .from("partner_client_diet_plans")
    .update({ version: nextVersion })
    .eq("id", planId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", patientId);
  return nextVersion;
}

async function syncDietPlanModule(
  context: Awaited<ReturnType<typeof getPartnerContext>>,
  patientId: string,
  planId: string,
) {
  if (!context.partnerId) return;

  const { data: plan } = await context.supabase
    .from("partner_client_diet_plans")
    .select("title, target_kcal, target_protein_g, target_carbs_g, target_fat_g")
    .eq("id", planId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", patientId)
    .maybeSingle();

  const { data: subscription } = await context.supabase
    .from("partner_client_plan_subscriptions")
    .select("id")
    .eq("partner_id", context.partnerId)
    .eq("patient_id", patientId)
    .in("status", ["active", "past_due", "pending"])
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan || !subscription) return;

  const { count } = await context.supabase
    .from("partner_client_diet_meals")
    .select("id", { count: "exact", head: true })
    .eq("partner_id", context.partnerId)
    .eq("patient_id", patientId)
    .eq("plan_id", planId);

  await context.supabase.from("partner_client_plan_modules").upsert({
    module_type: "dieta",
    partner_id: context.partnerId,
    patient_id: patientId,
    primary_summary: `${Number(plan.target_kcal).toLocaleString("pt-BR")} kcal/dia`,
    secondary_summary: `P ${Number(plan.target_protein_g).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}g · C ${Number(plan.target_carbs_g).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}g · G ${Number(plan.target_fat_g).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}g · ${count ?? 0} refeições`,
    subscription_id: subscription.id,
    title: plan.title,
  }, { onConflict: "subscription_id,module_type" });
}

export async function createClientDietPlan(
  input: z.input<typeof dietPlanSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = dietPlanSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados da dieta.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { data, error } = await context.supabase
    .from("partner_client_diet_plans")
    .insert({
      calorie_strategy: parsed.data.calorieStrategy,
      notes: normalizeNullable(parsed.data.notes),
      partner_id: context.partnerId,
      patient_id: parsed.data.patientId,
      status: "draft",
      target_carbs_g: parsed.data.targetCarbsG,
      target_fat_g: parsed.data.targetFatG,
      target_kcal: parsed.data.targetKcal,
      target_protein_g: parsed.data.targetProteinG,
      title: parsed.data.title,
      water_liters: parsed.data.waterLiters,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível criar a dieta.", ok: false };

  const starterMeals = [
    { day_of_week: 1, meal_time: "07:00", sort_order: 0, title: "Café da manhã" },
    { day_of_week: 1, meal_time: "12:30", sort_order: 1, title: "Almoço" },
    { day_of_week: 1, meal_time: "16:30", sort_order: 2, title: "Lanche da tarde" },
    { day_of_week: 1, meal_time: "19:30", sort_order: 3, title: "Jantar" },
  ];

  const { error: mealError } = await context.supabase.from("partner_client_diet_meals").insert(
    starterMeals.map((meal) => ({
      ...meal,
      partner_id: context.partnerId,
      patient_id: parsed.data.patientId,
      plan_id: data.id,
    })),
  );

  if (mealError) return { error: "Dieta criada, mas não foi possível criar as refeições.", ok: false };

  await recordDietEvent(context, {
    detail: "Dieta criada.",
    eventType: "created",
    patientId: parsed.data.patientId,
    planId: data.id,
    version: 1,
  });
  revalidateClient(parsed.data.patientId);
  return { id: data.id, message: "Dieta criada.", ok: true };
}

export async function updateClientDietPlanTargets(
  input: z.input<typeof dietPlanTargetsSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = dietPlanTargetsSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise as metas da dieta.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_client_diet_plans")
    .update({
      calorie_strategy: parsed.data.calorieStrategy,
      target_carbs_g: parsed.data.targetCarbsG,
      target_fat_g: parsed.data.targetFatG,
      target_kcal: parsed.data.targetKcal,
      target_protein_g: parsed.data.targetProteinG,
      water_liters: parsed.data.waterLiters,
    })
    .eq("id", parsed.data.planId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId);

  if (error) return { error: "Não foi possível atualizar o objetivo calórico.", ok: false };

  const version = await bumpDietPlan(context, parsed.data.patientId, parsed.data.planId);
  await recordDietEvent(context, {
    detail: "Objetivo calórico e metas de macronutrientes atualizados.",
    eventType: "targets_updated",
    patientId: parsed.data.patientId,
    planId: parsed.data.planId,
    version,
  });
  await syncDietPlanModule(context, parsed.data.patientId, parsed.data.planId);
  revalidateClient(parsed.data.patientId);
  return { message: "Objetivo calórico atualizado.", ok: true };
}

export async function saveClientDietNotes(
  input: z.input<typeof dietNotesSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = dietNotesSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise as considerações.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_client_diet_plans")
    .update({ notes: normalizeNullable(parsed.data.notes), status: "draft" })
    .eq("id", parsed.data.planId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId);

  if (error) return { error: "Não foi possível salvar as considerações.", ok: false };
  const version = await bumpDietPlan(context, parsed.data.patientId, parsed.data.planId);
  await recordDietEvent(context, {
    detail: "Considerações atualizadas.",
    eventType: "notes_saved",
    patientId: parsed.data.patientId,
    planId: parsed.data.planId,
    version,
  });
  revalidateClient(parsed.data.patientId);
  return { message: "Considerações salvas.", ok: true };
}

export async function createClientDietMeal(
  input: z.input<typeof dietMealSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = dietMealSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados da refeição.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { count } = await context.supabase
    .from("partner_client_diet_meals")
    .select("id", { count: "exact", head: true })
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId)
    .eq("plan_id", parsed.data.planId)
    .eq("day_of_week", parsed.data.dayOfWeek);

  const { data, error } = await context.supabase
    .from("partner_client_diet_meals")
    .insert({
      day_of_week: parsed.data.dayOfWeek,
      meal_time: parsed.data.mealTime,
      partner_id: context.partnerId,
      patient_id: parsed.data.patientId,
      plan_id: parsed.data.planId,
      sort_order: count ?? 0,
      title: parsed.data.title,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível criar a refeição.", ok: false };
  const version = await bumpDietPlan(context, parsed.data.patientId, parsed.data.planId);
  await recordDietEvent(context, {
    detail: `Refeição ${parsed.data.title} adicionada.`,
    eventType: "meal_added",
    patientId: parsed.data.patientId,
    planId: parsed.data.planId,
    version,
  });
  revalidateClient(parsed.data.patientId);
  return { id: data.id, message: "Refeição adicionada.", ok: true };
}

export async function removeClientDietMeal(
  input: z.input<typeof dietMealIdSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = dietMealIdSchema.safeParse(input);
  if (!parsed.success) return { error: "Refeição inválida.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_client_diet_meals")
    .delete()
    .eq("id", parsed.data.mealId)
    .eq("plan_id", parsed.data.planId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId);

  if (error) return { error: "Não foi possível remover a refeição.", ok: false };
  const version = await bumpDietPlan(context, parsed.data.patientId, parsed.data.planId);
  await recordDietEvent(context, {
    detail: "Refeição removida.",
    eventType: "meal_removed",
    patientId: parsed.data.patientId,
    planId: parsed.data.planId,
    version,
  });
  revalidateClient(parsed.data.patientId);
  return { message: "Refeição removida.", ok: true };
}

export async function addClientDietMealItem(
  input: z.input<typeof dietItemSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = dietItemSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise o alimento selecionado.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { data: food, error: foodError } = await context.supabase
    .from("partner_protocol_foods")
    .select("id, name, serving_size, serving_unit, household_measure, kcal, carbs_g, protein_g, fat_g, fiber_g, sodium_mg")
    .eq("id", parsed.data.foodId)
    .eq("partner_id", context.partnerId)
    .eq("status", "active")
    .maybeSingle();

  if (foodError || !food) return { error: "Alimento indisponível na base de Cadastro.", ok: false };

  const { count } = await context.supabase
    .from("partner_client_diet_meal_items")
    .select("id", { count: "exact", head: true })
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId)
    .eq("meal_id", parsed.data.mealId);

  const { data, error } = await context.supabase
    .from("partner_client_diet_meal_items")
    .insert({
      food_id: food.id,
      household_measure: normalizeNullable(food.household_measure),
      meal_id: parsed.data.mealId,
      partner_id: context.partnerId,
      patient_id: parsed.data.patientId,
      plan_id: parsed.data.planId,
      quantity: parsed.data.quantity,
      quantity_unit: food.serving_unit,
      snapshot_carbs_g: food.carbs_g,
      snapshot_fat_g: food.fat_g,
      snapshot_fiber_g: food.fiber_g,
      snapshot_kcal: food.kcal,
      snapshot_name: food.name,
      snapshot_protein_g: food.protein_g,
      snapshot_serving_size: food.serving_size,
      snapshot_serving_unit: food.serving_unit,
      snapshot_sodium_mg: food.sodium_mg,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível adicionar o alimento.", ok: false };

  if (parsed.data.draftId) {
    await context.supabase
      .from("partner_protocol_use_drafts")
      .update({ status: "used" })
      .eq("id", parsed.data.draftId)
      .eq("partner_id", context.partnerId)
      .eq("patient_id", parsed.data.patientId)
      .eq("plan_context", "dieta");
  }

  await context.supabase
    .from("partner_protocol_foods")
    .update({ usage_count: Number((food as { usage_count?: number }).usage_count ?? 0) + 1 })
    .eq("id", food.id)
    .eq("partner_id", context.partnerId);

  const version = await bumpDietPlan(context, parsed.data.patientId, parsed.data.planId);
  await recordDietEvent(context, {
    detail: `${food.name} adicionado à dieta.`,
    details: { itemId: data.id },
    eventType: "item_added",
    patientId: parsed.data.patientId,
    planId: parsed.data.planId,
    version,
  });
  revalidateClient(parsed.data.patientId);
  return { id: data.id, message: "Alimento adicionado.", ok: true };
}

export async function updateClientDietMealItem(
  input: z.input<typeof dietItemUpdateSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = dietItemUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise a porção.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_client_diet_meal_items")
    .update({ quantity: parsed.data.quantity })
    .eq("id", parsed.data.itemId)
    .eq("plan_id", parsed.data.planId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId);

  if (error) return { error: "Não foi possível atualizar a porção.", ok: false };
  const version = await bumpDietPlan(context, parsed.data.patientId, parsed.data.planId);
  await recordDietEvent(context, {
    detail: "Porção atualizada.",
    eventType: "item_updated",
    patientId: parsed.data.patientId,
    planId: parsed.data.planId,
    version,
  });
  revalidateClient(parsed.data.patientId);
  return { message: "Porção atualizada.", ok: true };
}

export async function removeClientDietMealItem(
  input: z.input<typeof dietItemIdSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = dietItemIdSchema.safeParse(input);
  if (!parsed.success) return { error: "Alimento inválido.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_client_diet_meal_items")
    .delete()
    .eq("id", parsed.data.itemId)
    .eq("plan_id", parsed.data.planId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId);

  if (error) return { error: "Não foi possível remover o alimento.", ok: false };
  const version = await bumpDietPlan(context, parsed.data.patientId, parsed.data.planId);
  await recordDietEvent(context, {
    detail: "Alimento removido.",
    eventType: "item_removed",
    patientId: parsed.data.patientId,
    planId: parsed.data.planId,
    version,
  });
  revalidateClient(parsed.data.patientId);
  return { message: "Alimento removido.", ok: true };
}

export async function duplicateClientDietPlan(
  input: z.input<typeof dietPlanIdSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = dietPlanIdSchema.safeParse(input);
  if (!parsed.success) return { error: "Dieta inválida.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { data: plan, error: planError } = await context.supabase
    .from("partner_client_diet_plans")
    .select("title, target_kcal, target_protein_g, target_carbs_g, target_fat_g, water_liters, calorie_strategy, notes")
    .eq("id", parsed.data.planId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId)
    .maybeSingle();
  if (planError || !plan) return { error: "Dieta original não encontrada.", ok: false };

  const { data: newPlan, error } = await context.supabase
    .from("partner_client_diet_plans")
    .insert({
      calorie_strategy: plan.calorie_strategy,
      notes: plan.notes,
      partner_id: context.partnerId,
      patient_id: parsed.data.patientId,
      status: "draft",
      target_carbs_g: plan.target_carbs_g,
      target_fat_g: plan.target_fat_g,
      target_kcal: plan.target_kcal,
      target_protein_g: plan.target_protein_g,
      title: `${plan.title} (cópia)`,
      water_liters: plan.water_liters,
    })
    .select("id")
    .single();
  if (error || !newPlan) return { error: "Não foi possível duplicar a dieta.", ok: false };

  const { data: meals } = await context.supabase
    .from("partner_client_diet_meals")
    .select("id, day_of_week, title, meal_time, sort_order")
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId)
    .eq("plan_id", parsed.data.planId)
    .order("sort_order");

  for (const meal of meals ?? []) {
    const { data: createdMeal } = await context.supabase
      .from("partner_client_diet_meals")
      .insert({
        day_of_week: meal.day_of_week,
        meal_time: meal.meal_time,
        partner_id: context.partnerId,
        patient_id: parsed.data.patientId,
        plan_id: newPlan.id,
        sort_order: meal.sort_order,
        title: meal.title,
      })
      .select("id")
      .single();

    if (!createdMeal) continue;
    const { data: items } = await context.supabase
      .from("partner_client_diet_meal_items")
      .select("food_id, quantity, quantity_unit, household_measure, snapshot_name, snapshot_serving_size, snapshot_serving_unit, snapshot_kcal, snapshot_carbs_g, snapshot_protein_g, snapshot_fat_g, snapshot_fiber_g, snapshot_sodium_mg, sort_order")
      .eq("partner_id", context.partnerId)
      .eq("patient_id", parsed.data.patientId)
      .eq("meal_id", meal.id)
      .order("sort_order");

    if (items?.length) {
      await context.supabase.from("partner_client_diet_meal_items").insert(items.map((item) => ({
        ...item,
        meal_id: createdMeal.id,
        partner_id: context.partnerId,
        patient_id: parsed.data.patientId,
        plan_id: newPlan.id,
      })));
    }
  }

  await recordDietEvent(context, {
    detail: "Dieta duplicada a partir de versão anterior.",
    details: { sourcePlanId: parsed.data.planId },
    eventType: "duplicated",
    patientId: parsed.data.patientId,
    planId: newPlan.id,
    version: 1,
  });
  revalidateClient(parsed.data.patientId);
  return { id: newPlan.id, message: "Dieta duplicada.", ok: true };
}

export async function publishClientDietPlan(
  input: z.input<typeof dietPlanIdSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = dietPlanIdSchema.safeParse(input);
  if (!parsed.success) return { error: "Dieta inválida.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_client_diet_plans")
    .update({ published_at: new Date().toISOString(), status: "published" })
    .eq("id", parsed.data.planId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId);
  if (error) return { error: "Não foi possível publicar a dieta.", ok: false };

  const version = await bumpDietPlan(context, parsed.data.patientId, parsed.data.planId);
  await syncDietPlanModule(context, parsed.data.patientId, parsed.data.planId);
  await recordDietEvent(context, {
    detail: "Dieta publicada internamente.",
    eventType: "published",
    patientId: parsed.data.patientId,
    planId: parsed.data.planId,
    version,
  });
  revalidateClient(parsed.data.patientId);
  return { message: "Dieta publicada.", ok: true };
}

export async function sendClientDietPlan(
  input: z.input<typeof dietPlanIdSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = dietPlanIdSchema.safeParse(input);
  if (!parsed.success) return { error: "Dieta inválida.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_client_diet_plans")
    .update({ sent_at: new Date().toISOString(), status: "sent" })
    .eq("id", parsed.data.planId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId);
  if (error) return { error: "Não foi possível registrar o envio.", ok: false };

  const version = await bumpDietPlan(context, parsed.data.patientId, parsed.data.planId);
  await syncDietPlanModule(context, parsed.data.patientId, parsed.data.planId);
  await recordDietEvent(context, {
    detail: "Dieta marcada como enviada ao Cliente.",
    eventType: "sent",
    patientId: parsed.data.patientId,
    planId: parsed.data.planId,
    version,
  });
  revalidateClient(parsed.data.patientId);
  return { message: "Envio registrado.", ok: true };
}

export async function archiveClientDietPlan(
  input: z.input<typeof dietPlanIdSchema>,
): Promise<ClientOverviewActionResult> {
  const parsed = dietPlanIdSchema.safeParse(input);
  if (!parsed.success) return { error: "Dieta inválida.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_client_diet_plans")
    .update({ status: "archived" })
    .eq("id", parsed.data.planId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId);
  if (error) return { error: "Não foi possível arquivar a dieta.", ok: false };

  await recordDietEvent(context, {
    detail: "Dieta arquivada.",
    eventType: "archived",
    patientId: parsed.data.patientId,
    planId: parsed.data.planId,
  });
  revalidateClient(parsed.data.patientId);
  return { message: "Dieta arquivada.", ok: true };
}
