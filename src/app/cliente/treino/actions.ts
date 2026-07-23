"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ActionResult = {
  clientSessionId?: string;
  error?: string;
  ok: boolean;
};

type WorkoutSetInput = {
  clientSessionId: string;
  loadKg: number | string | null;
  reps: number | string | null;
  setId: string;
};

type WorkoutActionRpc = {
  rpc(name: "client_workout_start_session", params: { p_session_id: string }): PromiseLike<{ data: unknown; error: { message: string } | null }>;
  rpc(name: "client_workout_log_set", params: { p_client_session_id: string; p_completed: boolean; p_load_kg: number | null; p_reps: number | null; p_set_id: string }): PromiseLike<{ error: { message: string } | null }>;
  rpc(name: "client_workout_skip_exercise", params: { p_client_session_id: string; p_exercise_id: string }): PromiseLike<{ error: { message: string } | null }>;
  rpc(name: "client_workout_finish_session", params: { p_client_session_id: string }): PromiseLike<{ error: { message: string } | null }>;
};

function revalidateWorkout(sessionId?: string) {
  revalidatePath("/cliente/treino");
  revalidatePath("/cliente/inicio");
  if (sessionId) revalidatePath(`/cliente/treino/executar/${sessionId}`);
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numberField(formData: FormData, key: string) {
  const value = stringField(formData, key).replace(",", ".");
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberValue(value: number | string | null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function clientSessionIdFromRpc(data: unknown) {
  if (!data || typeof data !== "object") return null;
  const value = (data as { clientSessionId?: unknown }).clientSessionId;
  return typeof value === "string" ? value : null;
}

export async function startClientWorkoutSession(prescribedSessionId: string): Promise<ActionResult> {
  if (!prescribedSessionId) return { error: "Treino não encontrado.", ok: false };

  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as WorkoutActionRpc).rpc("client_workout_start_session", {
    p_session_id: prescribedSessionId,
  });

  if (error) return { error: error.message, ok: false };
  const clientSessionId = clientSessionIdFromRpc(data);
  revalidateWorkout(clientSessionId ?? undefined);
  return { clientSessionId: clientSessionId ?? undefined, ok: true };
}

export async function logClientWorkoutSet(input: FormData | WorkoutSetInput): Promise<ActionResult> {
  const fromFormData = input instanceof FormData;
  const clientSessionId = fromFormData ? stringField(input, "clientSessionId") : input.clientSessionId.trim();
  const setId = fromFormData ? stringField(input, "setId") : input.setId.trim();
  const loadKg = fromFormData ? numberField(input, "loadKg") : numberValue(input.loadKg);
  const reps = fromFormData ? numberField(input, "reps") : numberValue(input.reps);

  if (!clientSessionId || !setId) return { error: "Dados da série incompletos.", ok: false };

  const supabase = await createClient();
  const { error } = await (supabase as unknown as WorkoutActionRpc).rpc("client_workout_log_set", {
    p_client_session_id: clientSessionId,
    p_completed: true,
    p_load_kg: loadKg,
    p_reps: reps === null ? null : Math.round(reps),
    p_set_id: setId,
  });

  if (error) return { error: error.message, ok: false };
  revalidateWorkout(clientSessionId);
  return { clientSessionId, ok: true };
}

export async function skipClientWorkoutExercise(clientSessionId: string, exerciseId: string): Promise<ActionResult> {
  if (!clientSessionId || !exerciseId) return { error: "Exercício não encontrado.", ok: false };

  const supabase = await createClient();
  const { error } = await (supabase as unknown as WorkoutActionRpc).rpc("client_workout_skip_exercise", {
    p_client_session_id: clientSessionId,
    p_exercise_id: exerciseId,
  });

  if (error) return { error: error.message, ok: false };
  revalidateWorkout(clientSessionId);
  return { clientSessionId, ok: true };
}

export async function finishClientWorkoutSession(clientSessionId: string): Promise<ActionResult> {
  if (!clientSessionId) return { error: "Sessão de treino não encontrada.", ok: false };

  const supabase = await createClient();
  const { error } = await (supabase as unknown as WorkoutActionRpc).rpc("client_workout_finish_session", {
    p_client_session_id: clientSessionId,
  });

  if (error) return { error: error.message, ok: false };
  revalidateWorkout(clientSessionId);
  return { clientSessionId, ok: true };
}
