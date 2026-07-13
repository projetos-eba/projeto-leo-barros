import { createClient } from "@/lib/supabase/server";

import {
  buildPartnerClientWorkout,
  type PartnerClientWorkoutData,
  type PartnerClientWorkoutRawData,
} from "./client-workout-metrics";

type WorkoutRpcClient = {
  rpc(name: string, params: { p_patient_id: string }): PromiseLike<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

export async function fetchPartnerClientWorkout(patientId: string): Promise<PartnerClientWorkoutData | null> {
  const supabase = (await createClient()) as unknown as WorkoutRpcClient;
  const { data, error } = await supabase.rpc("partner_client_workouts", { p_patient_id: patientId });
  if (error) throw new Error(`Falha ao carregar Treinos do Cliente: ${error.message}`);
  if (!data) return null;
  return buildPartnerClientWorkout(data as PartnerClientWorkoutRawData);
}
