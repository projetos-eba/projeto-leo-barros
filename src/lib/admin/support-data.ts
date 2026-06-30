import { createClient } from "@/lib/supabase/server";

import {
  type AdminSupportData,
  buildAdminSupportData,
} from "./support-metrics";

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

export async function fetchAdminSupportData(): Promise<AdminSupportData> {
  const supabase = (await createClient()) as unknown as SupabaseReadClient;

  const [tickets, partners, profiles] = await Promise.all([
    expectData(
      asQuery<import("./support-metrics").SupportTicketRecord>(
        supabase
          .from("support_tickets")
          .select("id, partner_id, opened_by_profile_id, ticket_number, subject, status, priority, sla_due_at, resolved_at, created_at, updated_at")
          .order("updated_at", { ascending: false }),
      ),
      "tickets de suporte",
    ),
    expectData(
      asQuery<import("./support-metrics").SupportPartnerRecord>(
        supabase
          .from("partners")
          .select("id, profile_id, professional_name, professional_type"),
      ),
      "profissionais de suporte",
    ),
    expectData(
      asQuery<import("./support-metrics").SupportProfileRecord>(
        supabase
          .from("profiles")
          .select("id, email, display_name, status")
          .eq("role", "parceiro"),
      ),
      "profiles de suporte",
    ),
  ]);

  return buildAdminSupportData({ partners, profiles, tickets });
}
