import { getCurrentProfile } from "@/lib/auth/next-guards";
import type { LooseDb, LooseQueryResult } from "@/lib/supabase/loose-db";
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
  responseAnswers: Array<{
    label: string;
    value: string;
  }>;
  status: string;
  submittedAt: string | null;
  title: string;
};

export type PartnerClientClinicalWorkspaceData = {
  anamnesis: {
    current: PartnerClientClinicalEntry | null;
    history: PartnerClientClinicalEntry[];
  };
  forms: {
    assignments: PartnerClientFormAssignment[];
    clients: PartnerClientFormClient[];
  };
  prescriptions: {
    history: PartnerClientClinicalEntry[];
  };
};

type PartnerRow = {
  id: string;
  profile_id: string;
};

type ClientListRow = {
  display_name: string;
  email: string;
  patient_id: string;
  relationship_status: string;
};

type AnamnesisRow = {
  content: string;
  created_at: string;
  id: string;
  is_current: boolean;
  summary: string | null;
  title: string;
  version_number: number;
};

type PrescriptionRow = {
  content: string;
  created_at: string;
  id: string;
  prescription_type: string;
  status: string;
  summary?: string | null;
  title: string;
  version_number: number;
};

type TemplateRow = {
  id: string;
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

type AssignmentRow = {
  created_at: string;
  id: string;
  message: string | null;
  template_id: string;
  title: string;
};

type AssignmentClientRow = {
  assignment_id: string;
  created_at: string;
  id: string;
  patient_id: string;
  status: string;
  submitted_at: string | null;
};

type ResponseRow = {
  assignment_client_id: string;
  id: string;
  status: string;
};

type AnswerRow = {
  question_id: string;
  response_id: string;
  value_json: unknown;
};

type ReadRpc = {
  rpc(functionName: "partner_clients_list"): PromiseLike<{ data: unknown; error: { message: string } | null }>;
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
  if (!value || typeof value !== "object") return "Sem resposta";
  const payload = value as { value?: unknown };
  if (Array.isArray(payload.value)) return payload.value.map((item) => String(item)).join(", ");
  if (payload.value === true) return "Sim";
  if (payload.value === false) return "Não";
  return payload.value === undefined || payload.value === null || payload.value === ""
    ? "Sem resposta"
    : String(payload.value);
}

function mapEntry(row: AnamnesisRow): PartnerClientClinicalEntry {
  return {
    content: row.content,
    createdAt: row.created_at,
    id: row.id,
    isCurrent: row.is_current,
    summary: row.summary,
    title: row.title,
    version: row.version_number,
  };
}

function mapPrescription(row: PrescriptionRow): PartnerClientClinicalEntry {
  return {
    content: row.content,
    createdAt: row.created_at,
    id: row.id,
    status: row.status,
    summary: row.summary ?? null,
    title: row.title,
    type: row.prescription_type,
    version: row.version_number,
  };
}

export async function fetchPartnerClientClinicalWorkspace(
  patientId: string,
): Promise<PartnerClientClinicalWorkspaceData | null> {
  const supabase = await createClient();
  const db = supabase as unknown as LooseDb;
  const { profile } = await getCurrentProfile();

  if (!profile) throw new Error("Falha ao carregar área clínica: sessão do parceiro indisponível.");

  const partner = asSingle<PartnerRow>(
    await db.from("partners").select("id, profile_id").eq("profile_id", profile.id).maybeSingle(),
    "cadastro do parceiro",
  );

  if (!partner) return null;

  const [
    clientRowsResult,
    anamnesisResult,
    prescriptionsResult,
    templatesResult,
    questionsResult,
    assignmentsResult,
    assignmentClientsResult,
    responsesResult,
    answersResult,
  ] = await Promise.all([
    (supabase as unknown as ReadRpc).rpc("partner_clients_list"),
    db.from("partner_client_anamnesis_entries").select("id, title, summary, content, version_number, is_current, created_at").eq("partner_id", partner.id).eq("patient_id", patientId).order("version_number", { ascending: false }),
    db.from("partner_client_prescription_notes").select("id, title, prescription_type, status, content, version_number, created_at").eq("partner_id", partner.id).eq("patient_id", patientId).order("created_at", { ascending: false }),
    db.from("partner_form_templates").select("id, title").eq("partner_id", partner.id).order("created_at", { ascending: false }),
    db.from("partner_form_questions").select("id, template_id, sort_order, question_type, prompt, help_text, required, options").eq("partner_id", partner.id).order("sort_order", { ascending: true }),
    db.from("partner_form_assignments").select("id, template_id, title, message, created_at").eq("partner_id", partner.id).order("created_at", { ascending: false }),
    db.from("partner_form_assignment_clients").select("id, assignment_id, patient_id, status, submitted_at, created_at").eq("partner_id", partner.id).eq("patient_id", patientId).order("created_at", { ascending: false }),
    db.from("partner_form_responses").select("id, assignment_client_id, status").eq("partner_id", partner.id).eq("patient_id", patientId),
    db.from("partner_form_response_answers").select("response_id, question_id, value_json").eq("partner_id", partner.id).eq("patient_id", patientId),
  ]);

  const clients = asRows<ClientListRow>(clientRowsResult as LooseQueryResult, "Clientes disponíveis")
    .filter((row) => row.relationship_status === "active")
    .map((row) => ({
      email: row.email,
      id: row.patient_id,
      name: row.display_name,
      selected: row.patient_id === patientId,
      status: row.relationship_status,
    }));

  if (!clients.some((client) => client.id === patientId)) return null;

  const anamnesis = asRows<AnamnesisRow>(anamnesisResult, "Anamnese").map(mapEntry);
  const prescriptions = asRows<PrescriptionRow>(prescriptionsResult, "Prescrições").map(mapPrescription);
  const templates = asRows<TemplateRow>(templatesResult, "modelos de formulário");
  const questions = asRows<QuestionRow>(questionsResult, "perguntas dos formulários");
  const assignments = asRows<AssignmentRow>(assignmentsResult, "formulários enviados");
  const assignmentClients = asRows<AssignmentClientRow>(assignmentClientsResult, "envios do Cliente");
  const responses = asRows<ResponseRow>(responsesResult, "respostas do Cliente");
  const answers = asRows<AnswerRow>(answersResult, "respostas preenchidas");

  const templateTitleById = new Map(templates.map((template) => [template.id, template.title]));
  const questionsByTemplate = new Map<string, PartnerClientFormQuestion[]>();
  questions.forEach((question) => {
    const list = questionsByTemplate.get(question.template_id) ?? [];
    list.push({
      helpText: question.help_text,
      id: question.id,
      options: optionsFromJson(question.options),
      prompt: question.prompt,
      required: question.required,
      sortOrder: question.sort_order,
      type: question.question_type,
    });
    questionsByTemplate.set(question.template_id, list);
  });
  const responseByAssignmentClient = new Map(responses.map((response) => [response.assignment_client_id, response]));
  const answersByResponse = new Map<string, AnswerRow[]>();
  answers.forEach((answer) => {
    const list = answersByResponse.get(answer.response_id) ?? [];
    list.push(answer);
    answersByResponse.set(answer.response_id, list);
  });

  const formAssignments: PartnerClientFormAssignment[] = assignmentClients
    .map((assigned) => {
      const assignment = assignments.find((item) => item.id === assigned.assignment_id);
      if (!assignment) return null;
      const assignmentQuestions = questionsByTemplate.get(assignment.template_id) ?? [];
      const response = responseByAssignmentClient.get(assigned.id);
      const responseAnswers = (response ? answersByResponse.get(response.id) ?? [] : []).map((answer) => ({
        label: assignmentQuestions.find((question) => question.id === answer.question_id)?.prompt ?? "Resposta",
        value: answerValue(answer.value_json),
      }));

      return {
        assignmentClientId: assigned.id,
        assignmentId: assignment.id,
        createdAt: assigned.created_at,
        message: assignment.message,
        questions: assignmentQuestions,
        responseAnswers,
        status: assigned.status,
        submittedAt: assigned.submitted_at,
        title: assignment.title || templateTitleById.get(assignment.template_id) || "Formulário",
      };
    })
    .filter((item): item is PartnerClientFormAssignment => item !== null);

  return {
    anamnesis: {
      current: anamnesis.find((entry) => entry.isCurrent) ?? anamnesis[0] ?? null,
      history: anamnesis,
    },
    forms: {
      assignments: formAssignments,
      clients,
    },
    prescriptions: {
      history: prescriptions,
    },
  };
}
