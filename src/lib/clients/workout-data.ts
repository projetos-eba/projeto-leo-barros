import { createClient } from "@/lib/supabase/server";

import {
  buildClientWorkout,
  type ClientWorkoutData,
  type ClientWorkoutExecution,
  type ClientWorkoutRawData,
} from "./workout-metrics";

type ClientWorkoutRpc = {
  rpc(
    name: "client_workout_dashboard",
    params: { p_date?: string },
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function fetchClientWorkout(date = isoDate()): Promise<ClientWorkoutData | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as ClientWorkoutRpc).rpc("client_workout_dashboard", {
    p_date: date,
  });

  if (error) {
    throw new Error(`Falha ao carregar painel de treino: ${error.message}`);
  }

  if (!data) return null;

  return buildClientWorkout(data as ClientWorkoutRawData);
}

export async function fetchClientWorkoutExecution(sessionId: string): Promise<{ workout: ClientWorkoutData; execution: ClientWorkoutExecution } | null> {
  const workout = await fetchClientWorkout();
  const execution = workout?.executionSessions.find((item) => item.clientSessionId === sessionId) ?? null;
  if (!workout || !execution) return null;
  return { execution, workout };
}
