"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/auth/next-guards";
<<<<<<< HEAD
import type { LooseDb, LooseQueryResult } from "@/lib/supabase/loose-db";
import { createClient } from "@/lib/supabase/server";

type ClinicalActionResult = {
  error?: string;
  id?: string;
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

function asRows<T>(result: LooseQueryResult): T[] {
  if (result.error) return [];
  return Array.isArray(result.data) ? result.data as T[] : [];
}

function asSingle<T>(result: LooseQueryResult): T | null {
  if (result.error || !result.data) return null;
  return result.data as T;
}

function normalizeNullable(value: string | null | undefined) {
=======
import { createClient } from "@/lib/supabase/server";

export type ClinicalActionResult = {
  error?: string;
  message?: string;
  ok: boolean;
};

const uuidSchema = z.string().uuid();

const noteSchema = z.object({
  body: z.string().trim().min(1).max(12000),
  noteType: z.enum(["anamnesis", "prescription"]),
  patientId: uuidSchema,
  title: z.string().trim().min(2).max(140),
});

const formTemplateSchema = z.object({
  description: z.string().trim().max(500).nullable(),
  patientIds: z.array(uuidSchema).min(1).max(100),
  questions: z.array(z.object({
    id: z.string().trim().min(1).max(80),
    label: z.string().trim().min(2).max(220),
    type: z.enum(["short_text", "long_text"]),
  })).min(1).max(24),
  title: z.string().trim().min(2).max(140),
});

type LooseSupabase = {
  from(table: string): {
    insert(values: Record<string, unknown> | Array<Record<string, unknown>>): PromiseLike<{ data?: unknown; error: { message: string } | null }> & {
      select(columns: string): { single(): Promise<{ data: { id: string }; error: { message: string } | null }> };
    };
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: { id: string } | null; error: { message: string } | null }>;
      };
    };
  };
};

async function getPartnerContext() {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile();

  if (!profile) {
    return { error: "Sessão do parceiro indisponível.", partnerId: null, supabase: supabase as unknown as LooseSupabase };
  }

  const { data: partner, error } = await supabase
    .from("partners")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (error || !partner) {
    return { error: "Cadastro do parceiro indisponível.", partnerId: null, supabase: supabase as unknown as LooseSupabase };
  }

  return { error: null, partnerId: partner.id, supabase: supabase as unknown as LooseSupabase };
}

function normalizeNullable(value: string | null) {
>>>>>>> origin/main
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

<<<<<<< HEAD
async function getPartnerContext() {
  const supabase = await createClient();
  const db = supabase as unknown as LooseDb;
  const { profile } = await getCurrentProfile();

  if (!profile) {
    return { db, error: "Sessão do parceiro indisponível.", partner: null, profileId: null };
  }

  const partner = asSingle<PartnerRow>(
    await db
      .from("partners")
      .select("id, profile_id, professional_name")
      .eq("profile_id", profile.id)
      .maybeSingle(),
  );

  if (!partner) {
    return { db, error: "Cadastro do parceiro indisponível.", partner: null, profileId: profile.id };
  }

  return { db, error: null, partner, profileId: profile.id };
}

async function nextVersion(db: LooseDb, table: string, partnerId: string, patientId: string) {
  const rows = asRows<VersionRow>(
    await db
      .from(table)
      .select("version_number")
      .eq("partner_id", partnerId)
      .eq("patient_id", patientId)
      .order("version_number", { ascending: false })
      .limit(1),
  );
  return (rows[0]?.version_number ?? 0) + 1;
=======
function friendlyError(error: unknown) {
  const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
  if (/schema cache|Could not find the table|does not exist/i.test(message)) {
    return "A estrutura da área clínica ainda precisa ser ativada antes de salvar.";
  }
  return "Não foi possível concluir a ação.";
>>>>>>> origin/main
}

function revalidateClient(patientId: string) {
  revalidatePath(`/parceiros/clientes/${patientId}`);
}

<<<<<<< HEAD
export async function saveClientAnamnesisEntry(
  input: z.input<typeof anamnesisSchema>,
): Promise<ClinicalActionResult> {
  const parsed = anamnesisSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise a anamnese antes de salvar.", ok: false };

  const context = await getPartnerContext();
  if (!context.partner) return { error: context.error ?? "Acesso indisponível.", ok: false };

  await context.db
    .from("partner_client_anamnesis_entries")
    .update({ is_current: false })
    .eq("partner_id", context.partner.id)
    .eq("patient_id", parsed.data.patientId)
    .eq("is_current", true);

  const version = await nextVersion(context.db, "partner_client_anamnesis_entries", context.partner.id, parsed.data.patientId);
  const result = await context.db
    .from("partner_client_anamnesis_entries")
    .insert({
      content: parsed.data.content,
      created_by_profile_id: context.profileId,
      is_current: true,
      partner_id: context.partner.id,
      patient_id: parsed.data.patientId,
      sections: {},
      summary: normalizeNullable(parsed.data.summary),
      title: parsed.data.title,
      version_number: version,
    })
    .select("id")
    .single();
  const row = asSingle<IdRow>(result);

  if (!row) return { error: "Não foi possível salvar a anamnese.", ok: false };

  revalidateClient(parsed.data.patientId);
  return { id: row.id, ok: true };
}

export async function saveClientPrescriptionNote(
  input: z.input<typeof prescriptionSchema>,
): Promise<ClinicalActionResult> {
  const parsed = prescriptionSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise a prescrição antes de salvar.", ok: false };

  const context = await getPartnerContext();
  if (!context.partner) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const version = await nextVersion(context.db, "partner_client_prescription_notes", context.partner.id, parsed.data.patientId);
  const status = parsed.data.status;
  const result = await context.db
    .from("partner_client_prescription_notes")
    .insert({
      archived_at: null,
      content: parsed.data.content,
      created_by_profile_id: context.profileId,
      instructions: normalizeNullable(parsed.data.instructions),
      partner_id: context.partner.id,
      patient_id: parsed.data.patientId,
      prescription_type: parsed.data.prescriptionType,
      published_at: status === "published" ? new Date().toISOString() : null,
      status,
      title: parsed.data.title,
      version_number: version,
    })
    .select("id")
    .single();
  const row = asSingle<IdRow>(result);

  if (!row) return { error: "Não foi possível salvar a prescrição.", ok: false };

  revalidateClient(parsed.data.patientId);
  return { id: row.id, ok: true };
}

export async function setClientPrescriptionStatus(
  input: z.input<typeof prescriptionStatusSchema>,
): Promise<ClinicalActionResult> {
  const parsed = prescriptionStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Prescrição inválida.", ok: false };

  const context = await getPartnerContext();
  if (!context.partner) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const status = parsed.data.status;
  const result = await context.db
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

  if (!asSingle<IdRow>(result)) return { error: "Não foi possível atualizar a prescrição.", ok: false };

  revalidateClient(parsed.data.patientId);
  return { ok: true };
}

export async function createAndSendClientForm(
  input: z.input<typeof formAssignmentSchema>,
): Promise<ClinicalActionResult> {
  const parsed = formAssignmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise o formulário antes de enviar.", ok: false };

  const context = await getPartnerContext();
  if (!context.partner) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const templateResult = await context.db
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
  const template = asSingle<IdRow>(templateResult);
  if (!template) return { error: "Não foi possível criar o formulário.", ok: false };

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
  const questionResult = await context.db.from("partner_form_questions").insert(questionRows);
  if (questionResult.error) return { error: "Não foi possível salvar as perguntas.", ok: false };

  const assignmentResult = await context.db
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
  const assignment = asSingle<IdRow>(assignmentResult);
  if (!assignment) return { error: "Não foi possível enviar o formulário.", ok: false };

  const uniquePatientIds = Array.from(new Set(parsed.data.patientIds));
  const assignedResult = await context.db.from("partner_form_assignment_clients").insert(
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
  return { id: assignment.id, ok: true };
=======
export async function createPartnerClientNote(input: z.input<typeof noteSchema>): Promise<ClinicalActionResult> {
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise a anotação.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  try {
    const { error } = await context.supabase.from("partner_client_notes").insert({
      body: parsed.data.body,
      note_type: parsed.data.noteType,
      partner_id: context.partnerId,
      patient_id: parsed.data.patientId,
      title: parsed.data.title,
    });
    if (error) throw error;
    revalidateClient(parsed.data.patientId);
    return { message: "Registro salvo.", ok: true };
  } catch (error) {
    return { error: friendlyError(error), ok: false };
  }
}

export async function createAndSendPartnerForm(input: z.input<typeof formTemplateSchema>): Promise<ClinicalActionResult> {
  const parsed = formTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise o formulário.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  try {
    const { data: template, error: templateError } = await context.supabase
      .from("partner_form_templates")
      .insert({
        description: normalizeNullable(parsed.data.description),
        partner_id: context.partnerId,
        questions: parsed.data.questions,
        status: "active",
        title: parsed.data.title,
      })
      .select("id")
      .single();
    if (templateError) throw templateError;

    const { data: assignment, error: assignmentError } = await context.supabase
      .from("partner_form_assignments")
      .insert({
        description_snapshot: normalizeNullable(parsed.data.description),
        partner_id: context.partnerId,
        questions_snapshot: parsed.data.questions,
        status: "sent",
        template_id: template.id,
        title_snapshot: parsed.data.title,
      })
      .select("id")
      .single();
    if (assignmentError) throw assignmentError;

    const rows = parsed.data.patientIds.map((patientId) => ({
      assignment_id: assignment.id,
      partner_id: context.partnerId,
      patient_id: patientId,
      status: "sent",
    }));
    const { error: clientsError } = await context.supabase.from("partner_form_assignment_clients").insert(rows);
    if (clientsError) throw clientsError;

    parsed.data.patientIds.forEach(revalidateClient);
    revalidatePath("/cliente/formularios");
    return { message: "Formulário enviado.", ok: true };
  } catch (error) {
    return { error: friendlyError(error), ok: false };
  }
>>>>>>> origin/main
}
