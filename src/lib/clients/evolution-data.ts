import { createClient } from "@/lib/supabase/server";

import { buildClientEvolution, type ClientEvolutionData, type ClientEvolutionRawData } from "./evolution-metrics";

type ClientEvolutionRpc = {
  rpc(
    name: "client_evolution_dashboard",
    params?: { p_end_date?: string; p_start_date?: string | null },
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

export async function fetchClientEvolution(): Promise<ClientEvolutionData | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as ClientEvolutionRpc).rpc("client_evolution_dashboard");

  if (error) {
    throw new Error(`Falha ao carregar Minha Evolução: ${error.message}`);
  }

  if (!data) return null;

  return buildClientEvolution(data as ClientEvolutionRawData);
}
