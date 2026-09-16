"use server";

import { z } from "zod";

import { getPartnerActionContext, revalidatePartnerClients, type ClientProfileActionResult } from "./[id]/_actions/shared";

const removePartnerClientSchema = z.object({
  patientId: z.string().uuid(),
});

export async function removePartnerClient(
  input: z.input<typeof removePartnerClientSchema>,
): Promise<ClientProfileActionResult> {
  const parsed = removePartnerClientSchema.safeParse(input);
  if (!parsed.success) return { error: "Cliente inválido.", ok: false };

  const context = await getPartnerActionContext();
  if (!context.partnerId) return { error: "Acesso indisponível.", ok: false };

  const { data, error } = await context.supabase.rpc("remove_partner_client", {
    p_patient_id: parsed.data.patientId,
  });

  if (error || !data) {
    return { error: "Não foi possível excluir o Cliente da sua carteira.", ok: false };
  }

  revalidatePartnerClients();
  return { message: "Cliente excluído da sua carteira.", ok: true };
}
