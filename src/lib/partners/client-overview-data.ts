import { createClient } from "@/lib/supabase/server";

import {
  buildPartnerClientOverview,
  type PartnerClientOverviewData,
  type PartnerClientOverviewRawData,
} from "./client-overview-metrics";

type PartnerClientRealAdherenceRpc = {
  rpc(
    functionName: "partner_client_real_adherence",
    params: { p_patient_id: string; p_reference_date?: string; p_weeks?: number },
  ): PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }>;
};

function isMissingRpc(error: { code?: string; message: string } | null) {
  if (!error) return false;
  return error.code === "42883" || /schema cache|Could not find the function|does not exist/i.test(error.message);
}

async function fetchRealAdherence(supabase: unknown, patientId: string) {
  const { data, error } = await (supabase as PartnerClientRealAdherenceRpc).rpc("partner_client_real_adherence", {
    p_patient_id: patientId,
    p_weeks: 6,
  });

  if (isMissingRpc(error)) return null;
  if (error) {
    throw new Error(`Falha ao carregar a adesão real do Cliente: ${error.message}`);
  }

  return Array.isArray(data) ? data : null;
}

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

  const realAdherence = await fetchRealAdherence(supabase, patientId);

  return buildPartnerClientOverview({
    ...raw,
    adherence: realAdherence ?? raw.adherence,
  } as PartnerClientOverviewRawData);
}
