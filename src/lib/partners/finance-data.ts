import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

type QueryResult<T> = {
  data: T[] | null;
  error: { code?: string; message: string } | null;
};

type SupabaseReadQuery = PromiseLike<QueryResult<unknown>> & {
  eq(column: string, value: string): SupabaseReadQuery;
  in(column: string, values: string[]): SupabaseReadQuery;
  order(column: string, options?: { ascending?: boolean }): SupabaseReadQuery;
};

type SupabaseReadClient = {
  from(table: string): {
    select(columns: string): SupabaseReadQuery;
  };
  rpc(functionName: "partner_clients_list"): PromiseLike<QueryResult<unknown>>;
};

export type PartnerFinanceClient = {
  email: string;
  id: string;
  name: string;
  status: string;
};

export type PartnerServicePlan = {
  billing_interval: string;
  category: string;
  created_at: string;
  description: string | null;
  duration_cycles: number;
  id: string;
  includes_diet: boolean;
  includes_training: boolean;
  interval_count: number;
  name: string;
  notes: string | null;
  partner_id: string;
  price_cents: number;
  status: "active" | "archived";
  updated_at: string;
};

export type PartnerClientPlanContract = {
  billing_interval_snapshot: string;
  category_snapshot: string;
  created_at: string;
  duration_cycles_snapshot: number;
  first_due_date: string;
  id: string;
  includes_diet_snapshot: boolean;
  includes_training_snapshot: boolean;
  notes: string | null;
  partner_id: string;
  patient_id: string;
  plan_name_snapshot: string;
  price_cents_snapshot: number;
  service_plan_id: string | null;
  start_date: string;
  status: "active" | "paused" | "completed" | "cancelled";
  updated_at: string;
};

export type PartnerClientReceivable = {
  amount_cents: number;
  contract_id: string;
  due_date: string;
  id: string;
  installment_number: number;
  paid_at: string | null;
  partner_id: string;
  patient_id: string;
  payment_method: string | null;
  payment_notes: string | null;
  payment_reference: string | null;
  status: "pending" | "paid" | "cancelled";
};

export type PartnerFinanceSummary = {
  activePlans: number;
  clientsWithPlan: number;
  overdueCents: number;
  pendingCents: number;
  receivedMonthCents: number;
};

export type PartnerFinanceData = {
  clients: PartnerFinanceClient[];
  contracts: PartnerClientPlanContract[];
  receivables: PartnerClientReceivable[];
  servicePlans: PartnerServicePlan[];
  summary: PartnerFinanceSummary;
};

type PartnerRecord = {
  id: string;
  profile_id: string;
};

type PartnerClientListRow = {
  display_name: string;
  email: string;
  patient_id: string;
  relationship_status: string;
};

function asQuery<T>(query: SupabaseReadQuery | PromiseLike<QueryResult<unknown>>) {
  return query as PromiseLike<QueryResult<T>>;
}

function isMissingFinanceStructure(error: { code?: string; message: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || /schema cache|Could not find the table|does not exist/i.test(error.message);
}

async function expectData<T>(result: PromiseLike<QueryResult<T>>, label: string) {
  const { data, error } = await result;
  if (error) throw new Error(`Falha ao carregar ${label}: ${error.message}`);
  return data ?? [];
}

async function safeFinanceData<T>(result: PromiseLike<QueryResult<T>>) {
  const { data, error } = await result;
  if (isMissingFinanceStructure(error)) return [];
  if (error) throw new Error(`Falha ao carregar Planos & Financeiro: ${error.message}`);
  return data ?? [];
}

function calculateSummary(
  servicePlans: PartnerServicePlan[],
  contracts: PartnerClientPlanContract[],
  receivables: PartnerClientReceivable[],
): PartnerFinanceSummary {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const activeContractClients = new Set(
    contracts
      .filter((contract) => contract.status === "active")
      .map((contract) => contract.patient_id),
  );

  return receivables.reduce<PartnerFinanceSummary>(
    (summary, receivable) => {
      const dueDate = new Date(`${receivable.due_date}T00:00:00`);
      const paidDate = receivable.paid_at ? new Date(receivable.paid_at) : null;

      if (receivable.status === "pending" && dueDate >= monthStart && dueDate <= monthEnd) {
        summary.pendingCents += receivable.amount_cents;
      }

      if (receivable.status === "pending" && dueDate < new Date(today.toDateString())) {
        summary.overdueCents += receivable.amount_cents;
      }

      if (receivable.status === "paid" && paidDate && paidDate >= monthStart && paidDate <= monthEnd) {
        summary.receivedMonthCents += receivable.amount_cents;
      }

      return summary;
    },
    {
      activePlans: servicePlans.filter((plan) => plan.status === "active").length,
      clientsWithPlan: activeContractClients.size,
      overdueCents: 0,
      pendingCents: 0,
      receivedMonthCents: 0,
    },
  );
}

export async function fetchPartnerFinanceData(): Promise<PartnerFinanceData> {
  const supabase = (await createClient()) as unknown as SupabaseReadClient;
  const { profile } = await getCurrentProfile();

  if (!profile) {
    throw new Error("Falha ao carregar Planos & Financeiro: sessão do parceiro indisponível.");
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
    return {
      clients: [],
      contracts: [],
      receivables: [],
      servicePlans: [],
      summary: { activePlans: 0, clientsWithPlan: 0, overdueCents: 0, pendingCents: 0, receivedMonthCents: 0 },
    };
  }

  const [clientRows, servicePlans, contracts, receivables] = await Promise.all([
    expectData(asQuery<PartnerClientListRow>(supabase.rpc("partner_clients_list")), "clientes do parceiro"),
    safeFinanceData(
      asQuery<PartnerServicePlan>(
        supabase
          .from("partner_service_plans")
          .select("id, partner_id, name, description, category, price_cents, billing_interval, interval_count, duration_cycles, includes_diet, includes_training, notes, status, created_at, updated_at")
          .eq("partner_id", partner.id)
          .order("updated_at", { ascending: false }),
      ),
    ),
    safeFinanceData(
      asQuery<PartnerClientPlanContract>(
        supabase
          .from("partner_client_plan_contracts")
          .select("id, partner_id, patient_id, service_plan_id, plan_name_snapshot, category_snapshot, price_cents_snapshot, billing_interval_snapshot, duration_cycles_snapshot, includes_diet_snapshot, includes_training_snapshot, start_date, first_due_date, status, notes, created_at, updated_at")
          .eq("partner_id", partner.id)
          .order("updated_at", { ascending: false }),
      ),
    ),
    safeFinanceData(
      asQuery<PartnerClientReceivable>(
        supabase
          .from("partner_client_receivables")
          .select("id, partner_id, patient_id, contract_id, installment_number, amount_cents, due_date, status, paid_at, payment_method, payment_reference, payment_notes")
          .eq("partner_id", partner.id)
          .order("due_date", { ascending: true }),
      ),
    ),
  ]);

  const clients = clientRows
    .filter((row) => row.relationship_status === "active")
    .map((row) => ({
      email: row.email,
      id: row.patient_id,
      name: row.display_name,
      status: row.relationship_status,
    }));

  return {
    clients,
    contracts,
    receivables,
    servicePlans,
    summary: calculateSummary(servicePlans, contracts, receivables),
  };
}
