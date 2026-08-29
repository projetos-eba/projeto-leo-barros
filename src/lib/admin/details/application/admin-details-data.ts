import { createClient } from "@/lib/supabase/server";

export const PROFESSIONAL_DETAIL_TABS = ["overview", "subscription", "payments", "clients", "usage", "tickets", "activity", "permissions"] as const;
export type ProfessionalDetailTab = (typeof PROFESSIONAL_DETAIL_TABS)[number];
export const CLIENT_DETAIL_TABS = ["overview", "access"] as const;

type DbResult<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>;
type Query = DbResult<unknown> & {
  eq(column: string, value: string): Query;
  order(column: string, options?: { ascending?: boolean }): Query;
  limit(count: number): Query;
  maybeSingle(): DbResult<unknown>;
};
type Db = { from(table: string): { select(columns: string): Query } };

async function readOne<T>(query: DbResult<T>, label: string): Promise<T | null> {
  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar ${label}: ${error.message}`);
  return data;
}
async function readMany<T>(query: DbResult<T>, label: string): Promise<T[]> {
  const value = await readOne(query, label);
  return Array.isArray(value) ? value : [];
}
function asQuery<T>(query: Query | DbResult<unknown>) { return query as DbResult<T>; }

export function isProfessionalDetailTab(value: string | undefined): value is ProfessionalDetailTab {
  return PROFESSIONAL_DETAIL_TABS.includes(value as ProfessionalDetailTab);
}

export async function fetchProfessionalDetailSummary(partnerId: string) {
  const db = (await createClient()) as unknown as Db;
  return readOne<Record<string, unknown>>(
    asQuery(db.from("partners").select("id, profile_id, professional_name, professional_type, professional_registry_type, professional_registry_number, created_at, profiles!inner(id, email, display_name, status, created_at)").eq("id", partnerId).maybeSingle()),
    "profissional",
  );
}

export async function fetchProfessionalDetailTab(partnerId: string, tab: ProfessionalDetailTab) {
  const db = (await createClient()) as unknown as Db;
  switch (tab) {
    case "subscription":
      return readMany<Record<string, unknown>>(asQuery(db.from("partner_subscriptions").select("id, status, cancel_at_period_end, current_period_start, current_period_end, canceled_at, stripe_subscription_id, billing_plans(name, billing_interval, price_cents, currency)").eq("partner_id", partnerId).order("created_at", { ascending: false }).limit(20)), "assinaturas");
    case "payments":
      return readMany<Record<string, unknown>>(asQuery(db.from("billing_payments").select("id, amount_cents, currency, status, payment_kind, due_at, paid_at, created_at").eq("partner_id", partnerId).order("due_at", { ascending: false }).limit(30)), "pagamentos");
    case "clients":
      return readMany<Record<string, unknown>>(asQuery(db.from("partner_clients").select("id, patient_id, service_scope, status, started_at, ended_at, patients(profile_id, profiles(display_name, email, status))").eq("partner_id", partnerId).order("started_at", { ascending: false }).limit(50)), "clientes vinculados");
    case "tickets":
      return readMany<Record<string, unknown>>(asQuery(db.from("support_tickets").select("id, ticket_number, subject, status, priority, created_at, resolved_at").eq("partner_id", partnerId).order("created_at", { ascending: false }).limit(30)), "tickets");
    case "activity":
      return readMany<Record<string, unknown>>(asQuery(db.from("platform_activity_events").select("id, event_type, title, detail, created_at").eq("partner_id", partnerId).order("created_at", { ascending: false }).limit(30)), "atividade");
    case "usage":
      return readMany<Record<string, unknown>>(asQuery(db.from("partner_clients").select("service_scope, status").eq("partner_id", partnerId).limit(100)), "utilizacao");
    case "permissions":
    case "overview":
      return [];
  }
}

export async function fetchClientDetailSummary(patientId: string) {
  const db = (await createClient()) as unknown as Db;
  return readOne<Record<string, unknown>>(
    asQuery(db.from("patients").select("id, profile_id, phone, birth_date, created_at, updated_at, profiles!inner(id, email, display_name, status, created_at)").eq("id", patientId).maybeSingle()),
    "cliente",
  );
}

export async function fetchClientOperationalLinks(patientId: string) {
  const db = (await createClient()) as unknown as Db;
  return readMany<Record<string, unknown>>(asQuery(db.from("partner_clients").select("id, service_scope, status, started_at, ended_at, partners(id, professional_name, professional_type, profiles(email, status))").eq("patient_id", patientId).order("started_at", { ascending: false }).limit(50)), "vinculos operacionais");
}
