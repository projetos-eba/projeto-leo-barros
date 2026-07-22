"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/auth/next-guards";
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
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function friendlyError(error: unknown) {
  const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
  if (/schema cache|Could not find the table|does not exist/i.test(message)) {
    return "A estrutura da área clínica ainda precisa ser ativada antes de salvar.";
  }
  return "Não foi possível concluir a ação.";
}

function revalidateClient(patientId: string) {
  revalidatePath(`/parceiros/clientes/${patientId}`);
}

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
}
