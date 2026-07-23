import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

import {
  type PartnerDashboardData,
  type PartnerDashboardRawData,
  buildPartnerDashboardData,
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

function isMissingManualFinanceTable(error: { message: string } | null) {
  if (!error) return false;
  return /schema cache|Could not find the table|does not exist/i.test(error.message);
}

async function safeManualFinanceData<T>(result: PromiseLike<QueryResult<T>>) {
  const { data, error } = await result;
  if (isMissingManualFinanceTable(error)) return [];
  if (error) throw new Error(`Falha ao carregar financeiro manual: ${error.message}`);
  return data ?? [];
}

export async function fetchPartnerDashboardData(): Promise<PartnerDashboardData> {
  const supabase = (await createClient()) as unknown as SupabaseReadClient;
  const { profile } = await getCurrentProfile();

  if (!profile) {
    throw new Error("Falha ao carregar dashboard: sessão do parceiro indisponível.");
  }

  const [profileRows, partnerRows] = await Promise.all([
    expectData(
      asQuery<import("./dashboard-metrics").PartnerProfile>(
        supabase
          .from("profiles")
          .select("id, email, display_name, status")
          .eq("id", profile.id),
      ),
      "profile do parceiro",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").PartnerRecord>(
        supabase
          .from("partners")
          .select("id, profile_id, professional_name, professional_type, created_at")
          .eq("profile_id", profile.id),
      ),
      "cadastro do parceiro",
    ),
  ]);

  const partner = partnerRows[0] ?? null;

  if (!partner) {
    return buildPartnerDashboardData({
      clientPlanSubscriptions: [],
      customPlans: [],
      documents: [],
      events: [],
      manualReceivables: [],
      partner,
      partnerClients: [],
      platformPlans: [],
      platformSubscriptions: [],
      profile: profileRows[0] ?? null,
      tickets: [],
    });
  }

  const [
    partnerClients,
    platformPlans,
    platformSubscriptions,
    customPlans,
    clientPlanSubscriptions,
    tickets,
    documents,
    events,
    manualReceivables,
  ] = await Promise.all([
    expectData(
      asQuery<import("./dashboard-metrics").PartnerClientLink>(
        supabase
          .from("partner_clients")
          .select("id, partner_id, patient_id, service_scope, status, started_at, ended_at, created_at")
          .eq("partner_id", partner.id)
          .order("created_at", { ascending: false }),
      ),
      "vínculos de clientes",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").PlatformPlan>(
        supabase
          .from("billing_plans")
          .select("id, name, billing_interval, price_cents")
          .order("price_cents", { ascending: true }),
      ),
      "planos da plataforma",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").PlatformSubscription>(
        supabase
          .from("partner_subscriptions")
          .select("id, partner_id, plan_id, status, current_period_start, current_period_end, canceled_at, created_at")
          .eq("partner_id", partner.id)
          .order("created_at", { ascending: false }),
      ),
      "assinatura do parceiro",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").PartnerCustomPlan>(
        supabase
          .from("partner_custom_plans")
          .select("id, partner_id, name, billing_interval, price_cents, currency, is_active")
          .eq("partner_id", partner.id)
          .order("created_at", { ascending: false }),
      ),
      "planos personalizados",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").ClientPlanSubscription>(
        supabase
          .from("partner_client_plan_subscriptions")
          .select("id, partner_id, patient_id, custom_plan_id, status, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at")
          .eq("partner_id", partner.id)
          .order("current_period_end", { ascending: true }),
      ),
      "assinaturas de clientes",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").PartnerSupportTicket>(
        supabase
          .from("support_tickets")
          .select("id, ticket_number, subject, status, priority, sla_due_at, resolved_at, created_at")
          .eq("partner_id", partner.id)
          .order("created_at", { ascending: false }),
      ),
      "tickets",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").PartnerDocument>(
        supabase
          .from("partner_documents")
          .select("id, document_type, status, title, created_at")
          .eq("partner_id", partner.id)
          .order("created_at", { ascending: false }),
      ),
      "documentos",
    ),
    expectData(
      asQuery<import("./dashboard-metrics").PartnerActivityEvent>(
        supabase
          .from("platform_activity_events")
          .select("id, event_type, title, detail, created_at")
          .eq("partner_id", partner.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ),
      "movimentações",
    ),
    safeManualFinanceData(
      asQuery<import("./dashboard-metrics").PartnerManualReceivable>(
        supabase
          .from("partner_client_receivables")
          .select("amount_cents, due_date, paid_at, status")
          .eq("partner_id", partner.id)
          .order("due_date", { ascending: false }),
      ),
    ),
  ]);

  const raw: PartnerDashboardRawData = {
    clientPlanSubscriptions,
    customPlans,
    documents,
    events,
    manualReceivables,
    partner,
    partnerClients,
    platformPlans,
    platformSubscriptions,
    profile: profileRows[0] ?? null,
    tickets,
  };

  return buildPartnerDashboardData(raw);
}
