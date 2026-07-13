import { createClient } from "@/lib/supabase/server";

import {
  type AdminClientsData,
  buildAdminClientsData,
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
};

function asQuery<T>(query: SupabaseReadQuery) {
  return query as PromiseLike<QueryResult<T>>;
}

async function expectData<T>(result: PromiseLike<QueryResult<T>>, label: string) {
  const { data, error } = await result;

  if (error) {
    throw new Error(`Falha ao carregar ${label}: ${error.message}`);
  }

  return data ?? [];
}

export async function fetchAdminClientsData(): Promise<AdminClientsData> {
  const supabase = (await createClient()) as unknown as SupabaseReadClient;

  const [
    clientProfiles,
    partnerProfiles,
    patients,
    partners,
    relationships,
    subscriptions,
  ] = await Promise.all([
    expectData(
      asQuery<import("./clients-metrics").ClientProfile>(
        supabase
          .from("profiles")
          .select("id, email, display_name, role, status, created_at, updated_at")
          .eq("role", "cliente")
          .order("created_at", { ascending: false }),
      ),
      "profiles de clientes",
    ),
    expectData(
      asQuery<import("./clients-metrics").ClientProfile>(
        supabase
          .from("profiles")
          .select("id, email, display_name, role, status, created_at, updated_at")
          .eq("role", "parceiro")
          .order("created_at", { ascending: false }),
      ),
      "profiles de profissionais",
    ),
    expectData(
      asQuery<import("./clients-metrics").ClientPatientRecord>(
        supabase
          .from("patients")
          .select("id, profile_id, phone, birth_date, objective, created_at, updated_at")
          .order("created_at", { ascending: false }),
      ),
      "clientes",
    ),
    expectData(
      asQuery<import("./clients-metrics").ClientPartnerRecord>(
        supabase
          .from("partners")
          .select("id, profile_id, professional_name, professional_type, created_at")
          .order("created_at", { ascending: false }),
      ),
      "profissionais",
    ),
    expectData(
      asQuery<import("./clients-metrics").ClientPartnerLink>(
        supabase
          .from("partner_clients")
          .select("id, partner_id, patient_id, service_scope, status, started_at, ended_at, created_at, updated_at")
          .order("created_at", { ascending: false }),
      ),
      "vínculos de clientes",
    ),
    expectData(
      asQuery<import("./clients-metrics").ClientPartnerSubscription>(
        supabase
          .from("partner_subscriptions")
          .select("id, partner_id, plan_id, status, current_period_start, current_period_end, canceled_at, created_at")
          .order("created_at", { ascending: false }),
      ),
      "assinaturas de profissionais",
    ),
  ]);

  return buildAdminClientsData({
    clientProfiles,
    partnerProfiles,
    partners,
    patients,
    relationships,
    subscriptions,
  });
}
