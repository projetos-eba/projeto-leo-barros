import { createClient } from "@/lib/supabase/server";

type QueryResult<T> = {
  data: T[] | null;
  error: { code?: string; message: string } | null;
};

type QueryBuilder = PromiseLike<QueryResult<unknown>> & {
  eq(column: string, value: string): QueryBuilder;
  in(column: string, values: string[]): QueryBuilder;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder;
};

type LooseClient = {
  from(table: string): {
    select(columns: string): QueryBuilder;
  };
};

export type ClientFormQuestion = {
  id: string;
  label: string;
  type: "long_text" | "short_text";
};

export type ClientFormAssignment = {
  assignmentClientId: string;
  assignmentId: string;
  description: string | null;
  questions: ClientFormQuestion[];
  response: Record<string, string> | null;
  sentAt: string;
  status: "sent" | "answered" | "closed";
  title: string;
};

export type ClientFormsData = {
  forms: ClientFormAssignment[];
};

type ProfileRow = {
  id: string;
};

type PatientRow = {
  id: string;
};

type AssignmentClientRow = {
  assignment_id: string;
  created_at: string;
  id: string;
  status: "sent" | "answered" | "closed";
};

type AssignmentRow = {
  description_snapshot: string | null;
  id: string;
  questions_snapshot: ClientFormQuestion[];
  title_snapshot: string;
};

type ResponseRow = {
  answers: Record<string, string>;
  assignment_client_id: string;
};

function asQuery<T>(query: QueryBuilder) {
  return query as PromiseLike<QueryResult<T>>;
}

function isMissingFormsStructure(error: { code?: string; message: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || /schema cache|Could not find the table|does not exist/i.test(error.message);
}

async function safeData<T>(result: PromiseLike<QueryResult<T>>) {
  const { data, error } = await result;
  if (isMissingFormsStructure(error)) return [];
  if (error) throw new Error(`Falha ao carregar formulários: ${error.message}`);
  return data ?? [];
}

async function currentPatient() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "cliente")
    .eq("status", "active")
    .maybeSingle<ProfileRow>();
  if (profileError || !profile) return null;

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle<PatientRow>();
  if (patientError || !patient) return null;

  return { patient, supabase: supabase as unknown as LooseClient };
}

export async function fetchClientForms(): Promise<ClientFormsData> {
  const current = await currentPatient();
  if (!current) return { forms: [] };

  const assignmentClients = await safeData(
    asQuery<AssignmentClientRow>(
      current.supabase
        .from("partner_form_assignment_clients")
        .select("id, assignment_id, status, created_at")
        .eq("patient_id", current.patient.id)
        .order("created_at", { ascending: false }),
    ),
  );

  const assignmentIds = assignmentClients.map((item) => item.assignment_id);
  const assignmentClientIds = assignmentClients.map((item) => item.id);

  if (assignmentIds.length === 0) return { forms: [] };

  const [assignments, responses] = await Promise.all([
    safeData(
      asQuery<AssignmentRow>(
        current.supabase
          .from("partner_form_assignments")
          .select("id, title_snapshot, description_snapshot, questions_snapshot")
          .in("id", assignmentIds),
      ),
    ),
    safeData(
      asQuery<ResponseRow>(
        current.supabase
          .from("partner_form_responses")
          .select("assignment_client_id, answers")
          .in("assignment_client_id", assignmentClientIds),
      ),
    ),
  ]);

  const assignmentsById = Object.fromEntries(assignments.map((assignment) => [assignment.id, assignment]));
  const responsesByClientId = Object.fromEntries(responses.map((response) => [response.assignment_client_id, response]));

  return {
    forms: assignmentClients.map((assignmentClient) => {
      const assignment = assignmentsById[assignmentClient.assignment_id];
      return {
        assignmentClientId: assignmentClient.id,
        assignmentId: assignmentClient.assignment_id,
        description: assignment?.description_snapshot ?? null,
        questions: assignment?.questions_snapshot ?? [],
        response: responsesByClientId[assignmentClient.id]?.answers ?? null,
        sentAt: assignmentClient.created_at,
        status: assignmentClient.status,
        title: assignment?.title_snapshot ?? "Formulário",
      };
    }),
  };
}
