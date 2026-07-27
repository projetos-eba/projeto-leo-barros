"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

export type ClinicalActionResult = {
  error?: string;
  id?: string;
  message?: string;
  ok: boolean;
};

type PartnerRow = {
  id: string;
  professional_name: string;
  profile_id: string;
};

type IdRow = {
  id: string;
};

type VersionRow = {
  version_number: number;
};

const patientIdSchema = z.string().uuid();

const anamnesisSchema = z.object({
  content: z.string().trim().min(5).max(8000),
  patientId: patientIdSchema,
  summary: z.string().trim().max(300).optional(),
  title: z.string().trim().min(3).max(120),
});

const prescriptionSchema = z.object({
  content: z.string().trim().min(5).max(8000),
  instructions: z.string().trim().max(1000).optional(),
  patientId: patientIdSchema,
  prescriptionType: z.enum(["general", "nutrition", "training", "supplement", "exam", "behavior"]),
  summary: z.string().trim().max(300).optional(),
  status: z.enum(["draft", "published"]),
  title: z.string().trim().min(3).max(120),
});

const prescriptionStatusSchema = z.object({
  patientId: patientIdSchema,
  prescriptionId: z.string().uuid(),
  status: z.enum(["published", "archived"]),
});

const formQuestionSchema = z.object({
  helpText: z.string().trim().max(240).optional(),
  options: z.array(z.string().trim().min(1).max(120)).max(10).default([]),
  prompt: z.string().trim().min(3).max(220),
  required: z.boolean(),
  type: z.enum(["text_short", "text_long", "single_choice", "multiple_choice", "scale", "number", "date", "boolean"]),
});

const formAssignmentSchema = z.object({
  message: z.string().trim().max(700).optional(),
  patientIds: z.array(patientIdSchema).min(1).max(100),
  questions: z.array(formQuestionSchema).min(1).max(30),
  title: z.string().trim().min(3).max(140),
});

const noteSchema = z.object({
  body: z.string().trim().min(1).max(12000),
  noteType: z.enum(["anamnesis", "prescription"]),
  patientId: patientIdSchema,
  title: z.string().trim().min(2).max(140),
});

const simpleFormSchema = z.object({
  description: z.string().trim().max(500).nullable(),
  patientIds: z.array(patientIdSchema).min(1).max(100),
  questions: z.array(z.object({
    id: z.string().trim().min(1).max(80),
    label: z.string().trim().min(2).max(220),
    type: z.enum(["short_text", "long_text"]),
  })).min(1).max(24),
  title: z.string().trim().min(2).max(140),
});

function normalizeNullable(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function getPartnerContext() {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile();

  if (!profile) {
    return { error: "Sessão do parceiro indisponível.", partner: null, profileId: null, supabase };
  }

  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("id, profile_id, professional_name")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (partnerError || !partner) {
    return { error: "Cadastro do parceiro indisponível.", partner: null, profileId: profile.id, supabase };
  }

  return { error: null, partner, profileId: profile.id, supabase };
}

function revalidateClient(patientId: string) {
  revalidatePath(`/parceiros/clientes/${patientId}`);
}

export async function saveClientAnamnesisEntry(
  input: z.input<typeof anamnesisSchema>,
): Promise<ClinicalActionResult> {
  const parsed = anamnesisSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise a anamnese antes de salvar.", ok: false };

  const context = await getPartnerContext();
  if (!context.partner) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { data: entryId, error } = await context.supabase.rpc("save_partner_client_anamnesis_entry", {
    p_content: parsed.data.content,
    p_patient_id: parsed.data.patientId,
    p_summary: parsed.data.summary ?? "",
    p_title: parsed.data.title,
  });
  if (error || !entryId) return { error: "Não foi possível salvar a anamnese.", ok: false };

  revalidateClient(parsed.data.patientId);
  return { id: entryId, message: "Anamnese salva.", ok: true };
}

export async function saveClientPrescriptionNote(
  input: z.input<typeof prescriptionSchema>,
): Promise<ClinicalActionResult> {
  const parsed = prescriptionSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise a prescrição antes de salvar.", ok: false };

  const context = await getPartnerContext();
  if (!context.partner) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { data: noteId, error } = await context.supabase.rpc("save_partner_client_prescription_note", {
    p_content: parsed.data.content,
    p_instructions: parsed.data.instructions ?? "",
    p_patient_id: parsed.data.patientId,
    p_prescription_type: parsed.data.prescriptionType,
    p_status: parsed.data.status,
    p_summary: normalizeNullable(parsed.data.summary) ?? parsed.data.content.split(/\n+/)[0]?.slice(0, 300) ?? "",
    p_title: parsed.data.title,
  });
  if (error || !noteId) return { error: "Não foi possível salvar a prescrição.", ok: false };

  revalidateClient(parsed.data.patientId);
  return { id: noteId, message: "Prescrição salva.", ok: true };
}

export async function setClientPrescriptionStatus(
  input: z.input<typeof prescriptionStatusSchema>,
): Promise<ClinicalActionResult> {
  const parsed = prescriptionStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Prescrição inválida.", ok: false };

  const context = await getPartnerContext();
  if (!context.partner) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const status = parsed.data.status;
  const { data: row, error } = await context.supabase
    .from("partner_client_prescription_notes")
    .update({
      archived_at: status === "archived" ? new Date().toISOString() : null,
      published_at: status === "published" ? new Date().toISOString() : null,
      status,
    })
    .eq("id", parsed.data.prescriptionId)
    .eq("partner_id", context.partner.id)
    .eq("patient_id", parsed.data.patientId)
    .select("id")
    .maybeSingle();

  if (error || !row) return { error: "Não foi possível atualizar a prescrição.", ok: false };

  revalidateClient(parsed.data.patientId);
  return { message: "Prescrição atualizada.", ok: true };
}

export async function createAndSendClientForm(
  input: z.input<typeof formAssignmentSchema>,
): Promise<ClinicalActionResult> {
  const parsed = formAssignmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise o formulário antes de enviar.", ok: false };

  const context = await getPartnerContext();
  if (!context.partner) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const templateResult = await context.supabase
    .from("partner_form_templates")
    .insert({
      created_by_profile_id: context.profileId,
      description: normalizeNullable(parsed.data.message),
      partner_id: context.partner.id,
      status: "active",
      title: parsed.data.title,
    })
    .select("id")
    .single();
  const template = templateResult.data;
  if (templateResult.error || !template) return { error: "Não foi possível criar o formulário.", ok: false };

  const questionRows = parsed.data.questions.map((question, index) => ({
    help_text: normalizeNullable(question.helpText),
    options: question.options,
    partner_id: context.partner?.id,
    prompt: question.prompt,
    question_type: question.type,
    required: question.required,
    scale_max: question.type === "scale" ? 10 : null,
    scale_min: question.type === "scale" ? 0 : null,
    sort_order: index,
    template_id: template.id,
  }));
  const questionResult = await context.supabase.from("partner_form_questions").insert(questionRows);
  if (questionResult.error) return { error: "Não foi possível salvar as perguntas.", ok: false };

  const assignmentResult = await context.supabase
    .from("partner_form_assignments")
    .insert({
      created_by_profile_id: context.profileId,
      message: normalizeNullable(parsed.data.message),
      partner_id: context.partner.id,
      sent_at: new Date().toISOString(),
      status: "sent",
      template_id: template.id,
      title: parsed.data.title,
    })
    .select("id")
    .single();
  const assignment = assignmentResult.data;
  if (assignmentResult.error || !assignment) return { error: "Não foi possível enviar o formulário.", ok: false };

  const uniquePatientIds = Array.from(new Set(parsed.data.patientIds));
  const assignedResult = await context.supabase.from("partner_form_assignment_clients").insert(
    uniquePatientIds.map((patientId) => ({
      assignment_id: assignment.id,
      partner_id: context.partner?.id,
      patient_id: patientId,
      status: "assigned",
    })),
  );
  if (assignedResult.error) return { error: "Não foi possível entregar o formulário aos Clientes selecionados.", ok: false };

  uniquePatientIds.forEach(revalidateClient);
  revalidatePath("/cliente/formularios");
  return { id: assignment.id, message: "Formulário enviado.", ok: true };
}

export async function createPartnerClientNote(input: z.input<typeof noteSchema>): Promise<ClinicalActionResult> {
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise a anotação.", ok: false };

  if (parsed.data.noteType === "anamnesis") {
    return saveClientAnamnesisEntry({
      content: parsed.data.body,
      patientId: parsed.data.patientId,
      summary: "",
      title: parsed.data.title,
    });
  }

  return saveClientPrescriptionNote({
    content: parsed.data.body,
    instructions: "",
    patientId: parsed.data.patientId,
    prescriptionType: "general",
    status: "draft",
    title: parsed.data.title,
  });
}

export async function createAndSendPartnerForm(input: z.input<typeof simpleFormSchema>): Promise<ClinicalActionResult> {
  const parsed = simpleFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise o formulário.", ok: false };

  return createAndSendClientForm({
    message: parsed.data.description ?? "",
    patientIds: parsed.data.patientIds,
    questions: parsed.data.questions.map((question) => ({
      helpText: "",
      options: [],
      prompt: question.label,
      required: true,
      type: question.type === "long_text" ? "text_long" : "text_short",
    })),
    title: parsed.data.title,
  });
}
