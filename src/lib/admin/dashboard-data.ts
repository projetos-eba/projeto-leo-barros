import { createClient } from "@/lib/supabase/server";

import {
  type AdminDashboardData,
  buildAdminDashboardData,
} from "./dashboard-metrics";

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

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = (await createClient()) as unknown as SupabaseReadClient;

  const [
    plans,
    subscriptions,
    payments,
    profiles,
    partners,
    partnerClients,
    tickets,
    documents,
    events,
  ] = await Promise.all([
    expectData(
      asQuery<import("./dashboard-metrics").BillingPlan>(
        supabase
          .from("billing_plans")
          .select("id, slug, name, billing_interval, price_cents, currency")
          .order("price_cents", { ascending: true }),
      ),
      "planos",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").PartnerSubscription>(
        supabase
          .from("partner_subscriptions")
          .select("id, partner_id, plan_id, status, current_period_start, current_period_end, canceled_at, created_at"),
      ),
      "assinaturas",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").BillingPayment>(
        supabase
          .from("billing_payments")
          .select("id, subscription_id, partner_id, amount_cents, status, payment_kind, due_at, paid_at")
          .order("due_at", { ascending: false }),
      ),
      "pagamentos",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").PartnerProfile>(
        supabase
          .from("profiles")
          .select("id, email, display_name, role, status, created_at")
          .eq("role", "parceiro"),
      ),
      "profiles de parceiros",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").PartnerRecord>(
        supabase
          .from("partners")
          .select("id, profile_id, professional_name, professional_type, created_at"),
      ),
      "parceiros",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").PartnerClientRecord>(
        supabase
          .from("partner_clients")
          .select("partner_id, patient_id, status, started_at, ended_at, created_at"),
      ),
      "vínculos de clientes",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").SupportTicket>(
        supabase
          .from("support_tickets")
          .select("id, partner_id, ticket_number, subject, status, priority, sla_due_at, resolved_at, created_at")
          .order("created_at", { ascending: false }),
      ),
      "tickets",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").PartnerDocument>(
        supabase
          .from("partner_documents")
          .select("id, partner_id, document_type, status, title, created_at")
          .order("created_at", { ascending: false }),
      ),
      "documentos",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").PlatformActivityEvent>(
        supabase
          .from("platform_activity_events")
          .select("id, event_type, partner_id, title, detail, created_at")
          .order("created_at", { ascending: false })
          .limit(12),
      ),
      "movimentações",
    ),
  ]);

  return buildAdminDashboardData({
    documents,
    events,
    partnerClients,
    partners,
    payments,
    plans,
    profiles,
    subscriptions,
    tickets,
  });
}
