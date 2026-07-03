import { createClient } from "@/lib/supabase/server";

import { buildClientDiet, type ClientDietData, type ClientDietRawData } from "./diet-metrics";

type ClientDietRpc = {
  rpc(
    name: "client_diet_dashboard",
    params: { p_date?: string },
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function fetchClientDiet(date = isoDate()): Promise<ClientDietData | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as ClientDietRpc).rpc("client_diet_dashboard", {
    p_date: date,
  });

  if (error) {
    throw new Error(`Falha ao carregar painel de dieta: ${error.message}`);
  }

  if (!data) return null;

  return buildClientDiet(data as ClientDietRawData);
}
