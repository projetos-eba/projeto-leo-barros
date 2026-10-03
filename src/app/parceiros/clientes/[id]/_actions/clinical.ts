"use server";

import { z } from "zod";

import {
  getPartnerActionContext,
  normalizeNullable,
  revalidateClientProfile,
  type ClientProfileActionResult,
} from "./shared";

export type ClinicalActionResult = ClientProfileActionResult;

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

const existingFormSchema = z.object({ dueAt: z.string().datetime().nullable(), message: z.string().trim().max(700), patientId: patientIdSchema, templateId: z.string().uuid() });

export async function saveClientAnamnesisEntry(
  input: z.input<typeof anamnesisSchema>,
): Promise<ClinicalActionResult> {
  const parsed = anamnesisSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise a anamnese antes de salvar.", ok: false };

  const context = await getPartnerActionContext();
  if (!context.partner) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { data: entryId, error } = await context.supabase.rpc("save_partner_client_anamnesis_entry", {
    p_content: parsed.data.content,
    p_patient_id: parsed.data.patientId,
    p_summary: parsed.data.summary ?? "",
    p_title: parsed.data.title,
  });
  if (error || !entryId) return { error: "Não foi possível salvar a anamnese.", ok: false };

  revalidateClientProfile(parsed.data.patientId);
  return { id: entryId, message: "Anamnese salva.", ok: true };
}

export async function saveClientPrescriptionNote(
  input: z.input<typeof prescriptionSchema>,
): Promise<ClinicalActionResult> {
  const parsed = prescriptionSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise a prescrição antes de salvar.", ok: false };

  const context = await getPartnerActionContext();
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

  revalidateClientProfile(parsed.data.patientId);
  return { id: noteId, message: "Prescrição salva.", ok: true };
}

export async function setClientPrescriptionStatus(
  input: z.input<typeof prescriptionStatusSchema>,
): Promise<ClinicalActionResult> {
  const parsed = prescriptionStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Prescrição inválida.", ok: false };

  const context = await getPartnerActionContext();
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

  revalidateClientProfile(parsed.data.patientId);
  return { message: "Prescrição atualizada.", ok: true };
}

export async function sendExistingFormToClient(input: z.input<typeof existingFormSchema>): Promise<ClinicalActionResult> {
  const parsed = existingFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise o modelo e o prazo.", ok: false };
  const context = await getPartnerActionContext();
  if (!context.partner) return { error: context.error ?? "Acesso indisponível.", ok: false };
  // Supabase's generated function type does not encode nullable SQL arguments.
  const nullableDueAt: string = parsed.data.dueAt!;
  const { data, error } = await context.supabase.rpc("send_partner_form_template", { p_due_at: nullableDueAt, p_message: parsed.data.message, p_patient_ids: [parsed.data.patientId], p_request_key: crypto.randomUUID(), p_template_id: parsed.data.templateId });
  if (error || !data) return { error: "Não foi possível enviar o formulário.", ok: false };
  revalidateClientProfile(parsed.data.patientId);
  return { id: data, message: "Formulário enviado.", ok: true };
}
