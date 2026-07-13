import { createClient } from "@/lib/supabase/server";

import {
  buildPartnerClientCardio,
  type PartnerClientCardioData,
  type PartnerClientCardioRawData,
} from "./client-cardio-metrics";

type CardioRpcClient = {
  rpc(name: "partner_client_cardio", params: { p_patient_id: string }): PromiseLike<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

export async function fetchPartnerClientCardio(patientId: string): Promise<PartnerClientCardioData | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as CardioRpcClient).rpc("partner_client_cardio", {
    p_patient_id: patientId,
  });

  if (error) {
    throw new Error(`Falha ao carregar Cardio do Cliente: ${error.message}`);
  }

  if (!data) return null;

  return buildPartnerClientCardio(data as unknown as PartnerClientCardioRawData);
}
