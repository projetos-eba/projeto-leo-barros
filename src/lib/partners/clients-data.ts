import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

import {
  buildPartnerClientsData,
  type PartnerClientListRow,
  type PartnerClientPlan,
  type PartnerClientPlanSubscription,
  type PartnerClientServicePlan,
  type PartnerClientsData,
} from "./clients-metrics";

type QueryResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

type SupabaseReadQuery = PromiseLike<QueryResult<unknown>> & {
  eq(column: string, value: string): SupabaseReadQuery;
  order(column: string, options?: { ascending?: boolean }): SupabaseReadQuery;
};

type SupabaseReadClient = {
  from(table: string): {
    select(columns: string): SupabaseReadQuery;
  };
  rpc(functionName: "partner_clients_list"): PromiseLike<QueryResult<unknown>>;
};

type PartnerRecord = {
  id: string;
  profile_id: string;
};

function asQuery<T>(query: SupabaseReadQuery | PromiseLike<QueryResult<unknown>>) {
  return query as PromiseLike<QueryResult<T>>;
}

async function expectData<T>(result: PromiseLike<QueryResult<T>>, label: string) {
  const { data, error } = await result;

  if (error) {
    throw new Error(`Falha ao carregar ${label}: ${error.message}`);
  }

  return data ?? [];
}

export async function fetchPartnerClientsData(): Promise<PartnerClientsData> {
  const supabase = (await createClient()) as unknown as SupabaseReadClient;
  const { profile } = await getCurrentProfile();

  if (!profile) {
    throw new Error("Falha ao carregar clientes: sessão do parceiro indisponível.");
  }

  const partnerRows = await expectData(
    asQuery<PartnerRecord>(
      supabase
        .from("partners")
        .select("id, profile_id")
        .eq("profile_id", profile.id),
    ),
    "cadastro do parceiro",
  );
  const partner = partnerRows[0] ?? null;

  if (!partner) {
    return buildPartnerClientsData({
      clientPlanSubscriptions: [],
      customPlans: [],
      rows: [],
      servicePlans: [],
    });
  }

  const [rows, customPlans, clientPlanSubscriptions, servicePlans] = await Promise.all([
    expectData(
      asQuery<PartnerClientListRow>(supabase.rpc("partner_clients_list")),
      "clientes do parceiro",
    ),
    expectData(
      asQuery<PartnerClientPlan>(
        supabase
          .from("partner_custom_plans")
          .select("id, partner_id, name, billing_interval, price_cents, is_active")
          .eq("partner_id", partner.id)
          .order("created_at", { ascending: false }),
      ),
      "planos personalizados",
    ),
    expectData(
      asQuery<PartnerClientPlanSubscription>(
        supabase
          .from("partner_client_plan_subscriptions")
          .select("id, partner_id, patient_id, custom_plan_id, status, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at")
          .eq("partner_id", partner.id)
          .order("current_period_end", { ascending: true }),
      ),
      "assinaturas de clientes",
    ),
    expectData(
      asQuery<PartnerClientServicePlan>(
        supabase
          .from("partner_service_plans")
          .select("id, name, price_cents, billing_interval, duration_cycles, includes_diet, includes_training, status")
          .eq("partner_id", partner.id)
          .order("created_at", { ascending: false }),
      ),
      "planos financeiros",
    ),
  ]);

  return buildPartnerClientsData({
    clientPlanSubscriptions,
    customPlans,
    rows,
    servicePlans,
  });
}
