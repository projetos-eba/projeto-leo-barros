import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

type QueryResult<T> = {
  data: T[] | null;
  error: { code?: string; message: string } | null;
};

type QueryBuilder = PromiseLike<QueryResult<unknown>> & {
  eq(column: string, value: string): QueryBuilder;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder;
};

type LooseClient = {
  from(table: string): {
    select(columns: string): QueryBuilder;
  };
  rpc(functionName: "partner_clients_list"): PromiseLike<QueryResult<unknown>>;
};

type PartnerRecord = {
  id: string;
  profile_id: string;
};

export type PartnerClientNoteRecord = {
  body: string;
  created_at: string;
  id: string;
  note_type: "anamnesis" | "prescription";
  title: string;
};

export type PartnerFormTemplateRecord = {
  description: string | null;
  id: string;
  questions: Array<{ id: string; label: string; type: "long_text" | "short_text" }>;
  status: string;
  title: string;
};

export type PartnerFormAssignmentClientRecord = {
  assignment_id: string;
  created_at: string;
  id: string;
  patient_id: string;
  status: "sent" | "answered" | "closed";
};

export type PartnerFormAssignmentRecord = {
  created_at: string;
  description_snapshot: string | null;
  id: string;
  questions_snapshot: Array<{ id: string; label: string; type: "long_text" | "short_text" }>;
  status: string;
  title_snapshot: string;
};

export type PartnerFormResponseRecord = {
  answers: Record<string, string>;
  assignment_client_id: string;
  id: string;
  submitted_at: string;
};

export type PartnerClinicalClient = {
  email: string;
  id: string;
  name: string;
  status: string;
};

export type PartnerClientClinicalData = {
  assignmentClients: PartnerFormAssignmentClientRecord[];
  assignments: PartnerFormAssignmentRecord[];
  clients: PartnerClinicalClient[];
  notes: PartnerClientNoteRecord[];
  responses: PartnerFormResponseRecord[];
  templates: PartnerFormTemplateRecord[];
};

type PartnerClientListRow = {
  display_name: string;
  email: string;
  patient_id: string;
  relationship_status: string;
};

function asQuery<T>(query: QueryBuilder | PromiseLike<QueryResult<unknown>>) {
  return query as PromiseLike<QueryResult<T>>;
}

function isMissingClinicalStructure(error: { code?: string; message: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || /schema cache|Could not find the table|does not exist/i.test(error.message);
}

async function expectData<T>(result: PromiseLike<QueryResult<T>>, label: string) {
  const { data, error } = await result;
  if (error) throw new Error(`Falha ao carregar ${label}: ${error.message}`);
  return data ?? [];
}

async function safeClinicalData<T>(result: PromiseLike<QueryResult<T>>) {
  const { data, error } = await result;
  if (isMissingClinicalStructure(error)) return [];
  if (error) throw new Error(`Falha ao carregar área clínica: ${error.message}`);
  return data ?? [];
}

export async function fetchPartnerClientClinicalData(patientId: string): Promise<PartnerClientClinicalData> {
  const supabase = (await createClient()) as unknown as LooseClient;
  const { profile } = await getCurrentProfile();

  if (!profile) {
    throw new Error("Falha ao carregar área clínica: sessão do parceiro indisponível.");
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
    return { assignmentClients: [], assignments: [], clients: [], notes: [], responses: [], templates: [] };
  }

  const [clientRows, notes, templates, assignmentClients, assignments, responses] = await Promise.all([
    expectData(asQuery<PartnerClientListRow>(supabase.rpc("partner_clients_list")), "clientes do parceiro"),
    safeClinicalData(
      asQuery<PartnerClientNoteRecord>(
        supabase
          .from("partner_client_notes")
          .select("id, title, body, note_type, created_at")
          .eq("partner_id", partner.id)
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
      ),
    ),
    safeClinicalData(
      asQuery<PartnerFormTemplateRecord>(
        supabase
          .from("partner_form_templates")
          .select("id, title, description, questions, status")
          .eq("partner_id", partner.id)
          .order("updated_at", { ascending: false }),
      ),
    ),
    safeClinicalData(
      asQuery<PartnerFormAssignmentClientRecord>(
        supabase
          .from("partner_form_assignment_clients")
          .select("id, assignment_id, patient_id, status, created_at")
          .eq("partner_id", partner.id)
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
      ),
    ),
    safeClinicalData(
      asQuery<PartnerFormAssignmentRecord>(
        supabase
          .from("partner_form_assignments")
          .select("id, title_snapshot, description_snapshot, questions_snapshot, status, created_at")
          .eq("partner_id", partner.id)
          .order("created_at", { ascending: false }),
      ),
    ),
    safeClinicalData(
      asQuery<PartnerFormResponseRecord>(
        supabase
          .from("partner_form_responses")
          .select("id, assignment_client_id, answers, submitted_at")
          .eq("partner_id", partner.id)
          .eq("patient_id", patientId)
          .order("submitted_at", { ascending: false }),
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

  return { assignmentClients, assignments, clients, notes, responses, templates };
}
