import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

export type PartnerClientClinicalEntry = {
  content: string;
  createdAt: string;
  id: string;
  isCurrent?: boolean;
  status?: string;
  summary: string | null;
  title: string;
  type?: string;
  version: number;
};

export type PartnerClientFormClient = {
  email: string;
  id: string;
  name: string;
  selected: boolean;
  status: string;
};

export type PartnerClientFormQuestion = {
  helpText: string | null;
  id: string;
  options: string[];
  prompt: string;
  required: boolean;
  sortOrder: number;
  type: string;
};

export type PartnerClientFormAssignment = {
  assignmentClientId: string;
  assignmentId: string;
  createdAt: string;
  message: string | null;
  questions: PartnerClientFormQuestion[];
  responseAnswers: Array<{ label: string; value: string }>;
  status: string;
  submittedAt: string | null;
  title: string;
};

type ModuleState = "available" | "unavailable";

export type PartnerClientClinicalWorkspaceData = {
  anamnesis: {
    current: PartnerClientClinicalEntry | null;
    history: PartnerClientClinicalEntry[];
    state: ModuleState;
  };
  forms: {
    assignments: PartnerClientFormAssignment[];
    clients: PartnerClientFormClient[];
    state: ModuleState;
  };
  prescriptions: {
    history: PartnerClientClinicalEntry[];
    state: ModuleState;
  };
};

type QueryResult<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

function optionsFromJson(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function answerValue(value: unknown) {
  if (!value || typeof value !== "object") return "Sem resposta";
  const payload = value as { value?: unknown };
  if (Array.isArray(payload.value)) return payload.value.map((item) => String(item)).join(", ");
  if (payload.value === true) return "Sim";
  if (payload.value === false) return "Não";
  return payload.value === undefined || payload.value === null || payload.value === "" ? "Sem resposta" : String(payload.value);
}

async function secondaryRows<T>(query: QueryResult<T>): Promise<{ rows: T[]; state: ModuleState }> {
  const { data, error } = await query;
  if (error) return { rows: [], state: "unavailable" };
  return { rows: data ?? [], state: "available" };
}

export async function fetchPartnerClientClinicalWorkspace(patientId: string): Promise<PartnerClientClinicalWorkspaceData | null> {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile();

  if (!profile || profile.role !== "parceiro") {
    throw new Error("Sessão do parceiro indisponível.");
  }

  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (partnerError) throw new Error("Não foi possível validar o acesso ao Cliente.");
  if (!partner) return null;

  const { data: clientRows, error: clientsError } = await supabase.rpc("partner_clients_list");
  if (clientsError) throw new Error("Não foi possível validar o acesso ao Cliente.");
  const clients = clientRows
    .filter((row) => row.relationship_status === "active")
    .map((row) => ({ email: row.email, id: row.patient_id, name: row.display_name, selected: row.patient_id === patientId, status: row.relationship_status }));
  if (!clients.some((client) => client.id === patientId)) return null;

  const [anamnesisResult, prescriptionsResult, templatesResult, questionsResult, assignmentsResult, assignmentClientsResult, responsesResult, answersResult] = await Promise.all([
    secondaryRows(supabase.from("partner_client_anamnesis_entries").select("id, title, summary, content, version_number, is_current, created_at").eq("partner_id", partner.id).eq("patient_id", patientId).order("version_number", { ascending: false })),
    secondaryRows(supabase.from("partner_client_prescription_notes").select("id, title, summary, prescription_type, status, content, version_number, created_at").eq("partner_id", partner.id).eq("patient_id", patientId).order("created_at", { ascending: false })),
    secondaryRows(supabase.from("partner_form_templates").select("id, title").eq("partner_id", partner.id).order("created_at", { ascending: false })),
    secondaryRows(supabase.from("partner_form_questions").select("id, template_id, sort_order, question_type, prompt, help_text, required, options").eq("partner_id", partner.id).order("sort_order", { ascending: true })),
    secondaryRows(supabase.from("partner_form_assignments").select("id, template_id, title, message, created_at").eq("partner_id", partner.id).order("created_at", { ascending: false })),
    secondaryRows(supabase.from("partner_form_assignment_clients").select("id, assignment_id, patient_id, status, submitted_at, created_at").eq("partner_id", partner.id).eq("patient_id", patientId).order("created_at", { ascending: false })),
    secondaryRows(supabase.from("partner_form_responses").select("id, assignment_client_id, status").eq("partner_id", partner.id).eq("patient_id", patientId)),
    secondaryRows(supabase.from("partner_form_response_answers").select("response_id, question_id, value_json").eq("partner_id", partner.id).eq("patient_id", patientId)),
  ]);

  const anamnesis = anamnesisResult.rows.map((row) => ({ content: row.content, createdAt: row.created_at, id: row.id, isCurrent: row.is_current, summary: row.summary, title: row.title, version: row.version_number }));
  const prescriptions = prescriptionsResult.rows.map((row) => ({ content: row.content, createdAt: row.created_at, id: row.id, status: row.status, summary: row.summary, title: row.title, type: row.prescription_type, version: row.version_number }));
  const templateTitleById = new Map(templatesResult.rows.map((template) => [template.id, template.title]));
  const questionsByTemplate = new Map<string, PartnerClientFormQuestion[]>();
  questionsResult.rows.forEach((question) => {
    const list = questionsByTemplate.get(question.template_id) ?? [];
    list.push({ helpText: question.help_text, id: question.id, options: optionsFromJson(question.options), prompt: question.prompt, required: question.required, sortOrder: question.sort_order, type: question.question_type });
    questionsByTemplate.set(question.template_id, list);
  });
  const responseByAssignmentClient = new Map(responsesResult.rows.map((response) => [response.assignment_client_id, response]));
  const answersByResponse = new Map<string, typeof answersResult.rows>();
  answersResult.rows.forEach((answer) => answersByResponse.set(answer.response_id, [...(answersByResponse.get(answer.response_id) ?? []), answer]));

  const assignments = assignmentClientsResult.rows.flatMap((assigned) => {
    const assignment = assignmentsResult.rows.find((item) => item.id === assigned.assignment_id);
    if (!assignment) return [];
    const questions = questionsByTemplate.get(assignment.template_id) ?? [];
    const response = responseByAssignmentClient.get(assigned.id);
    return [{
      assignmentClientId: assigned.id,
      assignmentId: assignment.id,
      createdAt: assigned.created_at,
      message: assignment.message,
      questions,
      responseAnswers: (response ? answersByResponse.get(response.id) ?? [] : []).map((answer) => ({ label: questions.find((question) => question.id === answer.question_id)?.prompt ?? "Resposta", value: answerValue(answer.value_json) })),
      status: assigned.status,
      submittedAt: assigned.submitted_at,
      title: assignment.title || templateTitleById.get(assignment.template_id) || "Formulário",
    }];
  });

  return {
    anamnesis: { current: anamnesis.find((entry) => entry.isCurrent) ?? anamnesis[0] ?? null, history: anamnesis, state: anamnesisResult.state },
    forms: { assignments, clients, state: [templatesResult, questionsResult, assignmentsResult, assignmentClientsResult, responsesResult, answersResult].some((result) => result.state === "unavailable") ? "unavailable" : "available" },
    prescriptions: { history: prescriptions, state: prescriptionsResult.state },
  };
}
