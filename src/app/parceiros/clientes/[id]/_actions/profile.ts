"use server";

import { z } from "zod";
import { clientProfileEditorSchema, type ClientProfileEditorData } from "@/lib/partners/client-profile-editor";
import { getPartnerActionContext, revalidateClientProfile, revalidatePartnerClients, type ClientProfileActionResult } from "./shared";

export async function loadPartnerClientProfile(patientId: string): Promise<{ data?: ClientProfileEditorData; error?: string }> {
  if (!z.string().uuid().safeParse(patientId).success) return { error: "Cliente inválido." };
  const context = await getPartnerActionContext();
  if (!context.partnerId) return { error: "Acesso indisponível." };
  const { data, error } = await context.supabase.rpc("get_partner_client_profile", { p_patient_id: patientId });
  if (error || !data) return { error: "Não foi possível carregar o cadastro." };
  return { data: data as unknown as ClientProfileEditorData };
}

export async function savePartnerClientProfile(input: z.input<typeof clientProfileEditorSchema>): Promise<ClientProfileActionResult> {
  const parsed = clientProfileEditorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revise os dados do cadastro e informe o telefone com código do país." };
  const context = await getPartnerActionContext();
  if (!context.partnerId) return { ok: false, error: "Acesso indisponível." };
  const { data, error } = await context.supabase.rpc("update_partner_client_profile", {
    p_patient_id: parsed.data.patientId,
    p_display_name: parsed.data.displayName,
    p_phone: parsed.data.phone,
    p_birth_date: parsed.data.birthDate,
    p_biological_sex: parsed.data.biologicalSex,
    p_objective: parsed.data.objective,
  });
  if (error || !data) return { ok: false, error: "Não foi possível atualizar o cadastro." };
  revalidateClientProfile(parsed.data.patientId);
  revalidatePartnerClients();
  return { ok: true, message: "Cadastro atualizado." };
}
