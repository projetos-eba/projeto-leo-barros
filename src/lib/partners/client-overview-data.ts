import { createClient } from "@/lib/supabase/server";

import {
  buildPartnerClientOverview,
  type PartnerClientOverviewData,
  type PartnerClientOverviewRawData,
} from "./client-overview-metrics";

export async function fetchPartnerClientOverview(
  patientId: string,
): Promise<PartnerClientOverviewData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("partner_client_overview", {
    p_patient_id: patientId,
  });

  if (error) {
    throw new Error(`Falha ao carregar a Visão Geral do Cliente: ${error.message}`);
  }

  if (!data) return null;

  const raw = data as unknown as PartnerClientOverviewRawData;
  if (!raw.identity?.patientId || !raw.identity.displayName) {
    throw new Error("Falha ao carregar a Visão Geral do Cliente: resposta inválida.");
  }

  return buildPartnerClientOverview(raw);
}
