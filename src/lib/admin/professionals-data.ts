import { createClient } from "@/lib/supabase/server";

import {
  type AdminProfessionalsData,
  buildAdminProfessionalsData,
} from "./professionals-metrics";

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

export async function fetchAdminProfessionalsData(): Promise<AdminProfessionalsData> {
  const supabase = (await createClient()) as unknown as SupabaseReadClient;

  const [
    profiles,
    professionals,
    subscriptions,
    plans,
    payments,
    relationships,
  ] = await Promise.all([
    expectData(
      asQuery<import("./professionals-metrics").ProfessionalProfile>(
        supabase
          .from("profiles")
          .select("id, email, phone, display_name, role, status, created_at, updated_at")
          .eq("role", "parceiro")
          .order("created_at", { ascending: false }),
      ),
      "profiles de profissionais",
    ),
    expectData(
      asQuery<import("./professionals-metrics").ProfessionalRecord>(
        supabase
          .from("partners")
          .select("id, profile_id, professional_name, professional_type, professional_registry_type, professional_registry_number, created_at")
          .order("created_at", { ascending: false }),
      ),
      "profissionais",
    ),
    expectData(
      asQuery<import("./professionals-metrics").ProfessionalSubscription>(
        supabase
          .from("partner_subscriptions")
          .select("id, partner_id, plan_id, status, current_period_start, current_period_end, canceled_at, created_at")
          .order("created_at", { ascending: false }),
      ),
      "assinaturas de profissionais",
    ),
    expectData(
      asQuery<import("./professionals-metrics").ProfessionalPlan>(
        supabase
          .from("billing_plans")
          .select("id, slug, name, billing_interval, price_cents, currency")
          .order("price_cents", { ascending: true }),
      ),
      "planos",
    ),
    expectData(
      asQuery<import("./professionals-metrics").ProfessionalPayment>(
        supabase
          .from("billing_payments")
          .select("id, subscription_id, partner_id, amount_cents, status, payment_kind, due_at, paid_at")
          .order("due_at", { ascending: false }),
      ),
      "pagamentos",
    ),
    expectData(
      asQuery<import("./professionals-metrics").ProfessionalClientLink>(
        supabase
          .from("partner_clients")
          .select("partner_id, patient_id, status, started_at, ended_at, created_at")
          .order("created_at", { ascending: false }),
      ),
      "clientes vinculados",
    ),
  ]);

  return buildAdminProfessionalsData({
    payments,
    plans,
    profiles,
    professionals,
    relationships,
    subscriptions,
  });
}
