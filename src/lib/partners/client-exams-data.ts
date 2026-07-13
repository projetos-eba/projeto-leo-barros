import { createClient } from "@/lib/supabase/server";

import {
  buildPartnerClientExams,
  type PartnerClientExamsData,
  type PartnerClientExamsRawData,
} from "./client-exams-metrics";

type ExamsRpcClient = {
  rpc(name: "partner_client_exams", params: { p_patient_id: string }): PromiseLike<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

export async function fetchPartnerClientExams(patientId: string): Promise<PartnerClientExamsData | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as ExamsRpcClient).rpc("partner_client_exams", {
    p_patient_id: patientId,
  });

  if (error) {
    throw new Error(`Falha ao carregar Exames do Cliente: ${error.message}`);
  }

  if (!data) return null;

  return buildPartnerClientExams(data as PartnerClientExamsRawData);
}
