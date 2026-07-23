<<<<<<< HEAD
import { getCurrentProfile } from "@/lib/auth/next-guards";
import type { LooseDb, LooseQueryResult } from "@/lib/supabase/loose-db";
import { createClient } from "@/lib/supabase/server";

export type ClientFormQuestion = {
  helpText: string | null;
  id: string;
  options: string[];
  prompt: string;
  required: boolean;
  sortOrder: number;
  type: string;
};

export type ClientFormSummary = {
  assignmentClientId: string;
  createdAt: string;
  message: string | null;
  questionCount: number;
  status: string;
  submittedAt: string | null;
  title: string;
};

export type ClientFormDetail = ClientFormSummary & {
  answers: Record<string, string | string[] | number | boolean>;
  questions: ClientFormQuestion[];
=======
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
>>>>>>> origin/main
};

type PatientRow = {
  id: string;
<<<<<<< HEAD
  profile_id: string;
=======
>>>>>>> origin/main
};

type AssignmentClientRow = {
  assignment_id: string;
  created_at: string;
  id: string;
<<<<<<< HEAD
  status: string;
  submitted_at: string | null;
};

type AssignmentRow = {
  id: string;
  message: string | null;
  template_id: string;
  title: string;
};

type QuestionRow = {
  help_text: string | null;
  id: string;
  options: unknown;
  prompt: string;
  question_type: string;
  required: boolean;
  sort_order: number;
  template_id: string;
};

type AnswerRow = {
  question_id: string;
  value_json: unknown;
};

type ResponseRow = {
  assignment_client_id: string;
  id: string;
  status: string;
};

function asRows<T>(result: LooseQueryResult, label: string): T[] {
  if (result.error) throw new Error(`Falha ao carregar ${label}: ${result.error.message}`);
  return Array.isArray(result.data) ? result.data as T[] : [];
}

function asSingle<T>(result: LooseQueryResult, label: string): T | null {
  if (result.error) throw new Error(`Falha ao carregar ${label}: ${result.error.message}`);
  return result.data ? result.data as T : null;
}

function optionsFromJson(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function answerValue(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const payload = value as { value?: unknown };
  if (Array.isArray(payload.value)) return payload.value.map((item) => String(item));
  if (typeof payload.value === "number" || typeof payload.value === "boolean") return payload.value;
  return payload.value === undefined || payload.value === null ? "" : String(payload.value);
}

async function fetchCurrentPatient(db: LooseDb) {
  const { profile } = await getCurrentProfile();
  if (!profile) return null;
  return asSingle<PatientRow>(
    await db.from("patients").select("id, profile_id").eq("profile_id", profile.id).maybeSingle(),
    "perfil do Cliente",
  );
}

export async function fetchClientForms(): Promise<ClientFormSummary[]> {
  const db = (await createClient()) as unknown as LooseDb;
  const patient = await fetchCurrentPatient(db);
  if (!patient) return [];

  const assigned = asRows<AssignmentClientRow>(
    await db
      .from("partner_form_assignment_clients")
      .select("id, assignment_id, status, submitted_at, created_at")
      .eq("patient_id", patient.id)
      .neq("status", "canceled")
      .order("created_at", { ascending: false }),
    "formulários",
  );

  if (assigned.length === 0) return [];

  const assignmentIds = assigned.map((item) => item.assignment_id);
  const assignments = asRows<AssignmentRow>(
    await db
      .from("partner_form_assignments")
      .select("id, template_id, title, message")
      .in("id", assignmentIds),
    "detalhes dos formulários",
  );
  const templateIds = Array.from(new Set(assignments.map((item) => item.template_id)));
  const questions = templateIds.length > 0
    ? asRows<QuestionRow>(
      await db
        .from("partner_form_questions")
        .select("id, template_id, sort_order, question_type, prompt, help_text, required, options")
        .in("template_id", templateIds),
      "perguntas dos formulários",
    )
    : [];

  return assigned.map((item) => {
    const assignment = assignments.find((entry) => entry.id === item.assignment_id);
    const questionCount = assignment
      ? questions.filter((question) => question.template_id === assignment.template_id).length
      : 0;
    return {
      assignmentClientId: item.id,
      createdAt: item.created_at,
      message: assignment?.message ?? null,
      questionCount,
      status: item.status,
      submittedAt: item.submitted_at,
      title: assignment?.title ?? "Formulário",
    };
  });
}

export async function fetchClientFormDetail(assignmentClientId: string): Promise<ClientFormDetail | null> {
  const db = (await createClient()) as unknown as LooseDb;
  const patient = await fetchCurrentPatient(db);
  if (!patient) return null;

  const assigned = asSingle<AssignmentClientRow>(
    await db
      .from("partner_form_assignment_clients")
      .select("id, assignment_id, status, submitted_at, created_at")
      .eq("id", assignmentClientId)
      .eq("patient_id", patient.id)
      .maybeSingle(),
    "formulário",
  );
  if (!assigned || assigned.status === "canceled") return null;

  const assignment = asSingle<AssignmentRow>(
    await db
      .from("partner_form_assignments")
      .select("id, template_id, title, message")
      .eq("id", assigned.assignment_id)
      .maybeSingle(),
    "detalhes do formulário",
  );
  if (!assignment) return null;

  const questions = asRows<QuestionRow>(
    await db
      .from("partner_form_questions")
      .select("id, template_id, sort_order, question_type, prompt, help_text, required, options")
      .eq("template_id", assignment.template_id)
      .order("sort_order", { ascending: true }),
    "perguntas do formulário",
  ).map((question) => ({
    helpText: question.help_text,
    id: question.id,
    options: optionsFromJson(question.options),
    prompt: question.prompt,
    required: question.required,
    sortOrder: question.sort_order,
    type: question.question_type,
  }));

  const response = asSingle<ResponseRow>(
    await db
      .from("partner_form_responses")
      .select("id, assignment_client_id, status")
      .eq("assignment_client_id", assigned.id)
      .maybeSingle(),
    "resposta do formulário",
  );
  const answers = response
    ? asRows<AnswerRow>(
      await db
        .from("partner_form_response_answers")
        .select("question_id, value_json")
        .eq("response_id", response.id),
      "respostas salvas",
    )
    : [];

  return {
    answers: Object.fromEntries(answers.map((answer) => [answer.question_id, answerValue(answer.value_json)])),
    assignmentClientId: assigned.id,
    createdAt: assigned.created_at,
    message: assignment.message,
    questionCount: questions.length,
    questions,
    status: assigned.status,
    submittedAt: assigned.submitted_at,
    title: assignment.title,
=======
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
>>>>>>> origin/main
  };
}
