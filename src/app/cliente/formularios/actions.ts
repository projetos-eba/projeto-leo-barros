"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

type ClientFormsActionResult = {
  error?: string;
  message?: string;
  ok: boolean;
};

const answerSchema = z.object({
  answers: z.record(z.string().trim().min(1).max(4000)),
  assignmentClientId: z.string().uuid(),
});

type LooseSupabase = {
  from(table: string): {
    insert(values: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: {
          assignment_id: string;
          id: string;
          partner_id: string;
          patient_id: string;
        } | null; error: { message: string } | null }>;
      };
    };
    update(values: Record<string, unknown>): {
      eq(column: string, value: string): Promise<{ error: { message: string } | null }>;
    };
  };
};

function friendlyError(error: unknown) {
  const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
  if (/schema cache|Could not find the table|does not exist/i.test(message)) {
    return "Formulários temporariamente indisponíveis.";
  }
  return "Não foi possível enviar as respostas.";
}

export async function submitClientFormResponse(input: z.input<typeof answerSchema>): Promise<ClientFormsActionResult> {
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise suas respostas.", ok: false };

  const supabase = (await createClient()) as unknown as LooseSupabase;

  try {
    const { data: assignmentClient, error: readError } = await supabase
      .from("partner_form_assignment_clients")
      .select("id, assignment_id, partner_id, patient_id")
      .eq("id", parsed.data.assignmentClientId)
      .maybeSingle();
    if (readError) throw readError;
    if (!assignmentClient) return { error: "Formulário não encontrado.", ok: false };

    const { error: responseError } = await supabase.from("partner_form_responses").insert({
      answers: parsed.data.answers,
      assignment_client_id: assignmentClient.id,
      assignment_id: assignmentClient.assignment_id,
      partner_id: assignmentClient.partner_id,
      patient_id: assignmentClient.patient_id,
    });
    if (responseError) throw responseError;

    const { error: updateError } = await supabase
      .from("partner_form_assignment_clients")
      .update({ answered_at: new Date().toISOString(), status: "answered" })
      .eq("id", assignmentClient.id);
    if (updateError) throw updateError;

    revalidatePath("/cliente/formularios");
    return { message: "Respostas enviadas.", ok: true };
  } catch (error) {
    return { error: friendlyError(error), ok: false };
  }
}
