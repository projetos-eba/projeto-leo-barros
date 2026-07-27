"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

const settingValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const questionSchema = z.object({
  helpText: z.string().max(240),
  options: z.array(z.string().trim().min(1).max(120)).max(20),
  prompt: z.string().trim().min(2).max(220),
  required: z.boolean(),
  scaleMax: z.number().optional(),
  scaleMin: z.number().optional(),
  settings: z.record(settingValue),
  type: z.enum(["text_short", "text_long", "single_choice", "multiple_choice", "scale", "number", "date", "boolean"]),
}).superRefine((value, context) => {
  if (["single_choice", "multiple_choice"].includes(value.type)) {
    const normalized = value.options.map((item) => item.toLocaleLowerCase("pt-BR"));
    if (value.options.length < 2 || new Set(normalized).size !== normalized.length) {
      context.addIssue({ code: "custom", message: "Opções inválidas" });
    }
  }
  if (value.type === "scale" && (value.scaleMin === undefined || value.scaleMax === undefined || value.scaleMin >= value.scaleMax)) {
    context.addIssue({ code: "custom", message: "Escala inválida" });
  }
  if (value.type === "number") {
    const min = value.settings.min;
    const max = value.settings.max;
    const decimals = value.settings.decimals;
    if ((typeof min === "number" && typeof max === "number" && min > max)
      || (typeof decimals === "number" && (!Number.isInteger(decimals) || decimals < 0 || decimals > 6))) {
      context.addIssue({ code: "custom", message: "Configuração numérica inválida" });
    }
  }
});

const templateSchema = z.object({
  defaultMessage: z.string().max(700),
  description: z.string().max(1000),
  questions: z.array(questionSchema).min(1).max(30),
  status: z.enum(["draft", "active"]),
  templateId: z.string().uuid().nullable(),
  title: z.string().trim().min(3).max(140),
});
const sendSchema = z.object({
  dueAt: z.string().datetime().nullable(),
  message: z.string().max(700),
  patientIds: z.array(z.string().uuid()).min(1).max(100),
  requestKey: z.string().uuid(),
  templateId: z.string().uuid(),
});
const statusSchema = z.object({ status: z.enum(["active", "archived"]), templateId: z.string().uuid() });

export async function savePartnerFormTemplate(input: z.input<typeof templateSchema>) {
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Revise o modelo e as perguntas." };
  const supabase = await createClient();
  // The generated Supabase type cannot express nullable PostgreSQL function
  // parameters. Runtime null is intentional here and validated inside the RPC.
  const nullableTemplateId: string = parsed.data.templateId!;
  const { data, error } = await supabase.rpc("save_partner_form_template", {
    p_default_message: parsed.data.defaultMessage,
    p_description: parsed.data.description,
    p_questions: parsed.data.questions as Json,
    p_status: parsed.data.status,
    p_template_id: nullableTemplateId,
    p_title: parsed.data.title,
  });
  if (error || !data) return { ok: false as const, error: "Não foi possível salvar o modelo." };
  revalidatePath("/parceiros/materiais");
  return { ok: true as const, id: data, message: parsed.data.status === "active" ? "Modelo publicado." : "Rascunho salvo." };
}

export async function sendPartnerFormTemplate(input: z.input<typeof sendSchema>) {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Revise os destinatários e o prazo." };
  const supabase = await createClient();
  // See the nullable-RPC note above. SQL accepts null for an optional deadline.
  const nullableDueAt: string = parsed.data.dueAt!;
  const { data, error } = await supabase.rpc("send_partner_form_template", {
    p_due_at: nullableDueAt,
    p_message: parsed.data.message,
    p_patient_ids: parsed.data.patientIds,
    p_request_key: parsed.data.requestKey,
    p_template_id: parsed.data.templateId,
  });
  if (error || !data) return { ok: false as const, error: "Não foi possível enviar o formulário." };
  parsed.data.patientIds.forEach((id) => revalidatePath(`/parceiros/clientes/${id}`));
  revalidatePath("/parceiros/materiais");
  return { ok: true as const, id: data, message: "Formulário enviado." };
}

export async function changePartnerFormTemplateStatus(input: z.input<typeof statusSchema>) {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Modelo inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("partner_form_templates").update({ status: parsed.data.status }).eq("id", parsed.data.templateId).select("id").maybeSingle();
  if (error) return { ok: false as const, error: "Não foi possível atualizar o modelo." };
  if (!data) return { ok: false as const, error: "Modelo não encontrado." };
  revalidatePath("/parceiros/materiais");
  return { ok: true as const, message: parsed.data.status === "archived" ? "Modelo arquivado." : "Modelo restaurado." };
}
