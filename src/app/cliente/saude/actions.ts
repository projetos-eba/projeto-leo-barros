"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ActionResult = {
  error?: string;
  ok: boolean;
};

type HealthActionRpc = {
  rpc(name: "client_health_mark_medication", params: { p_log_date: string; p_medication_id: string; p_taken: boolean }): PromiseLike<{ error: { message: string } | null }>;
  rpc(name: "client_health_complete_action", params: { p_action_key: string; p_log_date: string }): PromiseLike<{ error: { message: string } | null }>;
};

function revalidateHealth() {
  revalidatePath("/cliente/saude");
  revalidatePath("/cliente/inicio");
}

export async function markClientHealthMedication(medicationId: string, logDate: string, taken: boolean): Promise<ActionResult> {
  if (!medicationId || !logDate) return { error: "Medicação não encontrada.", ok: false };

  const supabase = await createClient();
  const { error } = await (supabase as unknown as HealthActionRpc).rpc("client_health_mark_medication", {
    p_log_date: logDate,
    p_medication_id: medicationId,
    p_taken: taken,
  });

  if (error) return { error: error.message, ok: false };
  revalidateHealth();
  return { ok: true };
}

export async function completeClientHealthAction(actionKey: string, logDate: string): Promise<ActionResult> {
  if (!actionKey || !logDate) return { error: "Ação não encontrada.", ok: false };

  const supabase = await createClient();
  const { error } = await (supabase as unknown as HealthActionRpc).rpc("client_health_complete_action", {
    p_action_key: actionKey,
    p_log_date: logDate,
  });

  if (error) return { error: error.message, ok: false };
  revalidateHealth();
  return { ok: true };
}
