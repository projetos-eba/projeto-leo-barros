import { createClient } from "@/lib/supabase/server";

import {
  type AdminFinancialData,
  buildAdminFinancialData,
} from "./financial-metrics";

type QueryResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

type SupabaseReadQuery = PromiseLike<QueryResult<unknown>> & {
  eq(column: string, value: string): SupabaseReadQuery;
  limit(count: number): SupabaseReadQuery;
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

export async function fetchAdminFinancialData(): Promise<AdminFinancialData> {
  const supabase = (await createClient()) as unknown as SupabaseReadClient;

  const [
    plans,
    subscriptions,
    payments,
    profiles,
    partners,
  ] = await Promise.all([
    expectData(
      asQuery<import("./financial-metrics").FinancialPlan>(
        supabase
          .from("billing_plans")
          .select("id, slug, name, billing_interval, price_cents, currency, is_active")
          .order("price_cents", { ascending: true }),
      ),
      "planos financeiros",
    ),
    expectData(
      asQuery<import("./financial-metrics").FinancialSubscription>(
        supabase
          .from("partner_subscriptions")
          .select("id, partner_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at")
          .order("created_at", { ascending: false }),
      ),
      "assinaturas financeiras",
    ),
    expectData(
      asQuery<import("./financial-metrics").FinancialPayment>(
        supabase
          .from("billing_payments")
          .select("id, subscription_id, partner_id, amount_cents, currency, status, payment_kind, due_at, paid_at, stripe_payment_intent_id")
          .order("due_at", { ascending: false }),
      ),
      "pagamentos financeiros",
    ),
    expectData(
      asQuery<import("./financial-metrics").FinancialProfile>(
        supabase
          .from("profiles")
          .select("id, email, display_name, role, status, created_at")
          .eq("role", "parceiro"),
      ),
      "profiles de parceiros",
    ),
    expectData(
      asQuery<import("./financial-metrics").FinancialPartner>(
        supabase
          .from("partners")
          .select("id, profile_id, professional_name, professional_type, created_at"),
      ),
      "parceiros",
    ),
  ]);

  return buildAdminFinancialData({
    partners,
    payments,
    plans,
    profiles,
    subscriptions,
  });
}
