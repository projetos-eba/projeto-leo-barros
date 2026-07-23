"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/auth/next-guards";
import type { LooseDb, LooseQueryResult } from "@/lib/supabase/loose-db";
import { createClient } from "@/lib/supabase/server";

type ClientFormActionResult = {
  error?: string;
  message?: string;
  ok: boolean;
};

type PatientRow = {
  id: string;
};

type AssignmentClientRow = {
  assignment_id: string;
  id: string;
  partner_id: string;
  patient_id: string;
  status: string;
};

type ResponseRow = {
  id: string;
};

type AnswerRow = {
  id: string;
  question_id: string;
};

const answerSchema = z.object({
  questionId: z.string().uuid(),
  value: z.union([
    z.string().max(4000),
    z.number(),
    z.boolean(),
    z.array(z.string().max(240)).max(20),
  ]),
});

const formResponseSchema = z.object({
  answers: z.array(answerSchema).max(100),
  assignmentClientId: z.string().uuid(),
  submit: z.boolean(),
});

const legacyResponseSchema = z.object({
  answers: z.record(z.string().trim().min(1).max(4000)),
  assignmentClientId: z.string().uuid(),
});

function asSingle<T>(result: LooseQueryResult): T | null {
  if (result.error || !result.data) return null;
  return result.data as T;
}

function asRows<T>(result: LooseQueryResult): T[] {
  if (result.error) return [];
  return Array.isArray(result.data) ? result.data as T[] : [];
}

async function getClientContext() {
  const supabase = await createClient();
  const db = supabase as unknown as LooseDb;
  const { profile } = await getCurrentProfile();

  if (!profile) return { db, error: "Sessão do Cliente indisponível.", patient: null };

  const patient = asSingle<PatientRow>(
    await db.from("patients").select("id").eq("profile_id", profile.id).maybeSingle(),
  );

  if (!patient) return { db, error: "Perfil do Cliente indisponível.", patient: null };
  return { db, error: null, patient };
}

export async function saveClientFormResponse(
  input: z.input<typeof formResponseSchema>,
): Promise<ClientFormActionResult> {
  const parsed = formResponseSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise as respostas antes de continuar.", ok: false };

  const context = await getClientContext();
  if (!context.patient) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const assigned = asSingle<AssignmentClientRow>(
    await context.db
      .from("partner_form_assignment_clients")
      .select("id, assignment_id, partner_id, patient_id, status")
      .eq("id", parsed.data.assignmentClientId)
      .eq("patient_id", context.patient.id)
      .maybeSingle(),
  );

  if (!assigned || assigned.status === "submitted" || assigned.status === "canceled") {
    return { error: "Este formulário não está disponível para resposta.", ok: false };
  }

  await context.db
    .from("partner_form_assignment_clients")
    .update({
      opened_at: new Date().toISOString(),
      status: "in_progress",
    })
    .eq("id", assigned.id)
    .eq("patient_id", context.patient.id);

  let response = asSingle<ResponseRow>(
    await context.db
      .from("partner_form_responses")
      .select("id")
      .eq("assignment_client_id", assigned.id)
      .eq("patient_id", context.patient.id)
      .maybeSingle(),
  );

  if (response) {
    const responseReset = await context.db
      .from("partner_form_responses")
      .update({ status: "in_progress", submitted_at: null })
      .eq("id", response.id)
      .eq("patient_id", context.patient.id);
    if (responseReset.error) return { error: "Não foi possível salvar suas respostas.", ok: false };
  } else {
    response = asSingle<ResponseRow>(
      await context.db
        .from("partner_form_responses")
        .insert({
          assignment_client_id: assigned.id,
          assignment_id: assigned.assignment_id,
          partner_id: assigned.partner_id,
          patient_id: assigned.patient_id,
          status: "in_progress",
          submitted_at: null,
        })
        .select("id")
        .single(),
    );
  }

  if (!response) return { error: "Não foi possível salvar suas respostas.", ok: false };

  if (parsed.data.answers.length > 0) {
    const existingAnswers = asRows<AnswerRow>(
      await context.db
        .from("partner_form_response_answers")
        .select("id, question_id")
        .eq("response_id", response.id)
        .eq("patient_id", context.patient.id),
    );
    const existingByQuestion = new Map(existingAnswers.map((answer) => [answer.question_id, answer.id]));
    const newAnswers = parsed.data.answers.filter((answer) => !existingByQuestion.has(answer.questionId));
    const updatedAnswers = parsed.data.answers.filter((answer) => existingByQuestion.has(answer.questionId));

    if (newAnswers.length > 0) {
      const answersResult = await context.db.from("partner_form_response_answers").insert(
        newAnswers.map((answer) => ({
          partner_id: assigned.partner_id,
          patient_id: assigned.patient_id,
          question_id: answer.questionId,
          response_id: response.id,
          value_json: { value: answer.value },
        })),
      );

      if (answersResult.error) return { error: "Não foi possível salvar uma ou mais respostas.", ok: false };
    }

    for (const answer of updatedAnswers) {
      const answerId = existingByQuestion.get(answer.questionId);
      if (!answerId) continue;
      const answerResult = await context.db
        .from("partner_form_response_answers")
        .update({ value_json: { value: answer.value } })
        .eq("id", answerId)
        .eq("patient_id", context.patient.id);

      if (answerResult.error) return { error: "Não foi possível salvar uma ou mais respostas.", ok: false };
    }
  }

  if (parsed.data.submit) {
    const submittedAt = new Date().toISOString();
    const responseUpdate = await context.db
      .from("partner_form_responses")
      .update({ status: "submitted", submitted_at: submittedAt })
      .eq("id", response.id)
      .eq("patient_id", context.patient.id);

    if (responseUpdate.error) return { error: "Não foi possível finalizar o formulário.", ok: false };

    const assignedUpdate = await context.db
      .from("partner_form_assignment_clients")
      .update({ status: "submitted", submitted_at: submittedAt })
      .eq("id", assigned.id)
      .eq("patient_id", context.patient.id);

    if (assignedUpdate.error) return { error: "Não foi possível finalizar o formulário.", ok: false };
  }

  revalidatePath("/cliente/formularios");
  revalidatePath(`/cliente/formularios/${assigned.id}`);
  return { message: parsed.data.submit ? "Respostas enviadas." : "Respostas salvas.", ok: true };
}

export async function submitClientFormResponse(
  input: z.input<typeof legacyResponseSchema>,
): Promise<ClientFormActionResult> {
  const parsed = legacyResponseSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise suas respostas.", ok: false };

  return saveClientFormResponse({
    answers: Object.entries(parsed.data.answers).map(([questionId, value]) => ({ questionId, value })),
    assignmentClientId: parsed.data.assignmentClientId,
    submit: true,
  });
}
