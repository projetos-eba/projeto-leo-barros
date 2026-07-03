import { createClient } from "@/lib/supabase/server";

import { buildClientHealth, type ClientHealthData, type ClientHealthRawData } from "./health-metrics";

type ClientHealthRpc = {
  rpc(
    name: "client_health_dashboard",
    params: { p_date?: string },
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function fetchClientHealth(date = isoDate()): Promise<ClientHealthData | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as ClientHealthRpc).rpc("client_health_dashboard", {
    p_date: date,
  });

  if (error) {
    throw new Error(`Falha ao carregar painel de saúde: ${error.message}`);
  }

  if (!data) return null;

  return buildClientHealth(data as ClientHealthRawData);
}
