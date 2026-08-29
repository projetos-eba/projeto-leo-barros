import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

export type ClientProfileActionResult = {
  error?: string;
  id?: string;
  message?: string;
  ok: boolean;
};

type PartnerRecord = {
  id: string;
  professional_name: string;
  profile_id: string;
};

export async function getPartnerActionContext() {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile();

  if (!profile) {
    return {
      error: "Sessão do parceiro indisponível.",
      partner: null,
      partnerId: null,
      profileId: null,
      profileName: null,
      supabase,
    };
  }

  const { data: partner, error } = await supabase
    .from("partners")
    .select("id, profile_id, professional_name")
    .eq("profile_id", profile.id)
    .maybeSingle();

  const currentPartner = (error || !partner ? null : partner) as PartnerRecord | null;
  if (!currentPartner) {
    return {
      error: "Cadastro do parceiro indisponível.",
      partner: null,
      partnerId: null,
      profileId: profile.id,
      profileName: null,
      supabase,
    };
  }

  return {
    error: null,
    partner: currentPartner,
    partnerId: currentPartner.id,
    profileId: profile.id,
    profileName: currentPartner.professional_name,
    supabase,
  };
}

export function normalizeNullable(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function revalidateClientProfile(patientId: string) {
  revalidatePath(`/parceiros/clientes/${patientId}`);
}

export function revalidatePartnerClients() {
  revalidatePath("/parceiros/clientes");
}
