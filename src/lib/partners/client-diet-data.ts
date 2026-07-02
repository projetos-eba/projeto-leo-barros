import { createClient } from "@/lib/supabase/server";

import {
  buildPartnerClientDiet,
  type PartnerClientDietData,
  type PartnerClientDietRawData,
} from "./client-diet-metrics";

export async function fetchPartnerClientDiet(patientId: string): Promise<PartnerClientDietData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("partner_client_diet", {
    p_patient_id: patientId,
  });

  if (error) {
    throw new Error(`Falha ao carregar Dietas do Cliente: ${error.message}`);
  }

  if (!data) return null;

  return buildPartnerClientDiet(data as unknown as PartnerClientDietRawData);
}
