"use server";

import { z } from "zod";

import { getPartnerActionContext, revalidateClientProfile, type ClientProfileActionResult } from "./shared";

const patientIdSchema = z.string().uuid();
const appointmentSchema = z.object({ durationMinutes: z.number().int().min(15).max(240), notes: z.string().trim().max(500).optional(), patientId: patientIdSchema, startsAt: z.string().datetime(), title: z.string().trim().min(3).max(100) });
const taskSchema = z.object({ dueAt: z.string().datetime().nullable(), patientId: patientIdSchema, priority: z.enum(["low", "medium", "high"]), title: z.string().trim().min(3).max(140) });
const taskStatusSchema = z.object({ completed: z.boolean(), patientId: patientIdSchema, taskId: z.string().uuid() });

export async function createClientAppointment(input: z.input<typeof appointmentSchema>): Promise<ClientProfileActionResult> {
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados do agendamento.", ok: false };
  const context = await getPartnerActionContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const startsAt = new Date(parsed.data.startsAt);
  if (startsAt.getTime() <= Date.now()) return { error: "Escolha uma data futura para a consulta.", ok: false };
  const { error } = await context.supabase.from("partner_client_appointments").insert({ ends_at: new Date(startsAt.getTime() + parsed.data.durationMinutes * 60_000).toISOString(), notes: parsed.data.notes || null, partner_id: context.partnerId, patient_id: parsed.data.patientId, starts_at: startsAt.toISOString(), status: "scheduled", title: parsed.data.title });
  if (error) return { error: "Não foi possível agendar a consulta.", ok: false };
  revalidateClientProfile(parsed.data.patientId);
  return { message: "Consulta agendada com sucesso.", ok: true };
}

export async function createClientTask(input: z.input<typeof taskSchema>): Promise<ClientProfileActionResult> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados da tarefa.", ok: false };
  const context = await getPartnerActionContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const { error } = await context.supabase.from("partner_client_tasks").insert({ due_at: parsed.data.dueAt, partner_id: context.partnerId, patient_id: parsed.data.patientId, priority: parsed.data.priority, status: "pending", title: parsed.data.title });
  if (error) return { error: "Não foi possível adicionar a tarefa.", ok: false };
  revalidateClientProfile(parsed.data.patientId);
  return { message: "Tarefa adicionada.", ok: true };
}

export async function setClientTaskCompleted(input: z.input<typeof taskStatusSchema>): Promise<ClientProfileActionResult> {
  const parsed = taskStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Tarefa inválida.", ok: false };
  const context = await getPartnerActionContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const { error } = await context.supabase.from("partner_client_tasks").update({ completed_at: parsed.data.completed ? new Date().toISOString() : null, status: parsed.data.completed ? "completed" : "pending" }).eq("id", parsed.data.taskId).eq("partner_id", context.partnerId).eq("patient_id", parsed.data.patientId);
  if (error) return { error: "Não foi possível atualizar a tarefa.", ok: false };
  revalidateClientProfile(parsed.data.patientId);
  return { message: parsed.data.completed ? "Tarefa concluída." : "Tarefa reaberta.", ok: true };
}
