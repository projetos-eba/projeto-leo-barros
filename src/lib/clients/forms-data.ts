import { getCurrentProfile } from "@/lib/auth/next-guards";
import type { LooseDb, LooseQueryResult } from "@/lib/supabase/loose-db";
import { createClient } from "@/lib/supabase/server";

export type ClientFormQuestion = {
  helpText: string | null;
  id: string;
  label?: string;
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
};

export type ClientFormAssignment = {
  assignmentClientId: string;
  assignmentId: string;
  description: string | null;
  questions: Array<{ id: string; label: string; type: "long_text" | "short_text" }>;
  response: Record<string, string> | null;
  sentAt: string;
  status: "sent" | "answered" | "closed" | string;
  title: string;
};

export type ClientFormsData = {
  forms: ClientFormAssignment[];
};

type PatientRow = {
  id: string;
  profile_id: string;
};

type AssignmentClientRow = {
  assignment_id: string;
  created_at: string;
  id: string;
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
    label: question.prompt,
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
  };
}
