import { createClient } from "@/lib/supabase/server";

import {
  buildPartnerClientAssessments,
  type PartnerClientAssessmentRawData,
  type PartnerClientAssessmentsData,
} from "./client-assessments-metrics";

export async function fetchPartnerClientAssessments(
  patientId: string,
): Promise<PartnerClientAssessmentsData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("partner_client_assessments", {
    p_patient_id: patientId,
  });

  if (error) {
    throw new Error(`Falha ao carregar Avaliações do Cliente: ${error.message}`);
  }

  if (!data) return null;

  const raw = data as unknown as PartnerClientAssessmentRawData;
  if (!raw.identity?.patientId || !raw.identity.displayName || !Array.isArray(raw.assessments)) {
    throw new Error("Falha ao carregar Avaliações do Cliente: resposta inválida.");
  }

  return buildPartnerClientAssessments(raw);
}
