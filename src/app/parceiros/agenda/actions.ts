"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

export type PartnerAgendaActionResult = {
  error?: string;
  message?: string;
  ok: boolean;
};

const uuidSchema = z.string().uuid();
const appointmentTypeSchema = z.enum(["consulta", "avaliacao", "retorno", "reuniao", "outro"]);
const modalitySchema = z.enum(["online", "presencial"]);
const appointmentStatusSchema = z.enum(["scheduled", "pending", "completed", "canceled", "no_show"]);
const reminderSchema = z.union([
  z.literal(0),
  z.literal(10),
  z.literal(15),
  z.literal(30),
  z.literal(60),
  z.literal(120),
  z.literal(1440),
]);

const appointmentSchema = z.object({
  appointmentType: appointmentTypeSchema,
  durationMinutes: z.number().int().min(15).max(240),
  locationText: z.string().trim().max(180).nullable(),
  modality: modalitySchema,
  notes: z.string().trim().max(500).nullable(),
  patientId: uuidSchema,
  reminderMinutes: reminderSchema,
  startsAt: z.string().datetime(),
  status: appointmentStatusSchema,
  title: z.string().trim().min(3).max(100),
});

const updateAppointmentSchema = appointmentSchema.extend({
  appointmentId: uuidSchema,
});

const appointmentStatusUpdateSchema = z.object({
  appointmentId: uuidSchema,
  patientId: uuidSchema,
  status: appointmentStatusSchema,
});

const rescheduleAppointmentSchema = z.object({
  appointmentId: uuidSchema,
  durationMinutes: z.number().int().min(15).max(240),
  patientId: uuidSchema,
  startsAt: z.string().datetime(),
});

const blockSchema = z.object({
  durationMinutes: z.number().int().min(15).max(480),
  reason: z.string().trim().max(240).nullable(),
  startsAt: z.string().datetime(),
  title: z.string().trim().min(3).max(100),
});

const blockStatusSchema = z.object({
  blockId: uuidSchema,
  canceled: z.boolean(),
});

async function getPartnerContext() {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile();

  if (!profile) {
    return { error: "Sessão do parceiro indisponível.", partnerId: null, supabase };
  }

  const { data: partner, error } = await supabase
    .from("partners")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (error || !partner) {
    return { error: "Cadastro do parceiro indisponível.", partnerId: null, supabase };
  }

  return { error: null, partnerId: partner.id, supabase };
}

function buildPeriod(startsAtValue: string, durationMinutes: number) {
  const startsAt = new Date(startsAtValue);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  return { endsAt, startsAt };
}

function normalizeNullable(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function revalidateAgenda(patientId?: string) {
  revalidatePath("/parceiros/agenda");
  if (patientId) revalidatePath(`/parceiros/clientes/${patientId}`);
}

export async function createPartnerAgendaAppointment(
  input: z.input<typeof appointmentSchema>,
): Promise<PartnerAgendaActionResult> {
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados do compromisso.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { endsAt, startsAt } = buildPeriod(parsed.data.startsAt, parsed.data.durationMinutes);
  if (startsAt.getTime() <= Date.now()) {
    return { error: "Escolha uma data futura para o compromisso.", ok: false };
  }

  const { error } = await context.supabase.from("partner_client_appointments").insert({
    appointment_type: parsed.data.appointmentType,
    ends_at: endsAt.toISOString(),
    location_text: normalizeNullable(parsed.data.locationText),
    modality: parsed.data.modality,
    notes: normalizeNullable(parsed.data.notes),
    partner_id: context.partnerId,
    patient_id: parsed.data.patientId,
    reminder_minutes: parsed.data.reminderMinutes,
    starts_at: startsAt.toISOString(),
    status: parsed.data.status,
    title: parsed.data.title,
  });

  if (error) return { error: "Não foi possível criar o compromisso.", ok: false };

  revalidateAgenda(parsed.data.patientId);
  return { message: "Compromisso salvo.", ok: true };
}

export async function updatePartnerAgendaAppointment(
  input: z.input<typeof updateAppointmentSchema>,
): Promise<PartnerAgendaActionResult> {
  const parsed = updateAppointmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados do compromisso.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { endsAt, startsAt } = buildPeriod(parsed.data.startsAt, parsed.data.durationMinutes);
  const { error } = await context.supabase
    .from("partner_client_appointments")
    .update({
      appointment_type: parsed.data.appointmentType,
      ends_at: endsAt.toISOString(),
      location_text: normalizeNullable(parsed.data.locationText),
      modality: parsed.data.modality,
      notes: normalizeNullable(parsed.data.notes),
      patient_id: parsed.data.patientId,
      reminder_minutes: parsed.data.reminderMinutes,
      starts_at: startsAt.toISOString(),
      status: parsed.data.status,
      title: parsed.data.title,
    })
    .eq("id", parsed.data.appointmentId)
    .eq("partner_id", context.partnerId);

  if (error) return { error: "Não foi possível atualizar o compromisso.", ok: false };

  revalidateAgenda(parsed.data.patientId);
  return { message: "Compromisso atualizado.", ok: true };
}

export async function setPartnerAgendaAppointmentStatus(
  input: z.input<typeof appointmentStatusUpdateSchema>,
): Promise<PartnerAgendaActionResult> {
  const parsed = appointmentStatusUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: "Compromisso inválido.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_client_appointments")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.appointmentId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId);

  if (error) return { error: "Não foi possível atualizar o status.", ok: false };

  revalidateAgenda(parsed.data.patientId);
  return { message: "Status atualizado.", ok: true };
}

export async function reschedulePartnerAgendaAppointment(
  input: z.input<typeof rescheduleAppointmentSchema>,
): Promise<PartnerAgendaActionResult> {
  const parsed = rescheduleAppointmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise a nova data do compromisso.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { endsAt, startsAt } = buildPeriod(parsed.data.startsAt, parsed.data.durationMinutes);
  if (startsAt.getTime() <= Date.now()) {
    return { error: "Escolha uma data futura para remarcar.", ok: false };
  }

  const { error } = await context.supabase
    .from("partner_client_appointments")
    .update({
      ends_at: endsAt.toISOString(),
      starts_at: startsAt.toISOString(),
      status: "scheduled",
    })
    .eq("id", parsed.data.appointmentId)
    .eq("partner_id", context.partnerId)
    .eq("patient_id", parsed.data.patientId);

  if (error) return { error: "Não foi possível remarcar.", ok: false };

  revalidateAgenda(parsed.data.patientId);
  return { message: "Compromisso remarcado.", ok: true };
}

export async function createPartnerCalendarBlock(
  input: z.input<typeof blockSchema>,
): Promise<PartnerAgendaActionResult> {
  const parsed = blockSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados do bloqueio.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { endsAt, startsAt } = buildPeriod(parsed.data.startsAt, parsed.data.durationMinutes);
  if (startsAt.getTime() <= Date.now()) {
    return { error: "Escolha uma data futura para o bloqueio.", ok: false };
  }

  const { error } = await context.supabase.from("partner_calendar_blocks").insert({
    ends_at: endsAt.toISOString(),
    partner_id: context.partnerId,
    reason: normalizeNullable(parsed.data.reason),
    starts_at: startsAt.toISOString(),
    status: "active",
    title: parsed.data.title,
  });

  if (error) return { error: "Não foi possível bloquear o horário.", ok: false };

  revalidateAgenda();
  return { message: "Horário bloqueado.", ok: true };
}

export async function setPartnerCalendarBlockCanceled(
  input: z.input<typeof blockStatusSchema>,
): Promise<PartnerAgendaActionResult> {
  const parsed = blockStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Bloqueio inválido.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_calendar_blocks")
    .update({ status: parsed.data.canceled ? "canceled" : "active" })
    .eq("id", parsed.data.blockId)
    .eq("partner_id", context.partnerId);

  if (error) return { error: "Não foi possível atualizar o bloqueio.", ok: false };

  revalidateAgenda();
  return { message: parsed.data.canceled ? "Bloqueio cancelado." : "Bloqueio reaberto.", ok: true };
}
