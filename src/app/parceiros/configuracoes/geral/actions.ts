"use server";

import { revalidatePath } from "next/cache";

import {
  normalizePartnerPhone,
  partnerAccountSchema,
  type PartnerAccountData,
  type PartnerAccountInput,
} from "@/lib/auth/partner-account-contracts";
import { requirePartnerBillingContext } from "@/lib/billing/data";

export type PartnerAccountActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function loadPartnerAccount(): Promise<{ data?: PartnerAccountData; error?: string }> {
  const { supabase } = await requirePartnerBillingContext();
  const { data, error } = await supabase.rpc("get_partner_account_profile");

  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    return { error: "Não foi possível carregar os dados da conta." };
  }

  const parsed = partnerAccountSchema.safeParse({
    ...(data as Record<string, unknown>),
    displayName: (data as Record<string, unknown>).displayName ?? "",
    email: (data as Record<string, unknown>).email ?? "",
    phone: (data as Record<string, unknown>).phone ?? "",
    professionalRegistryNumber: (data as Record<string, unknown>).professionalRegistryNumber ?? "",
    professionalRegistryType: (data as Record<string, unknown>).professionalRegistryType ?? "",
    professionalType: (data as Record<string, unknown>).professionalType ?? "",
  });

  if (!parsed.success) return { error: "Não foi possível carregar os dados da conta." };

  return {
    data: {
      ...parsed.data,
      email: String((data as Record<string, unknown>).email ?? ""),
    },
  };
}

export async function savePartnerAccount(input: PartnerAccountInput): Promise<PartnerAccountActionResult> {
  const parsed = partnerAccountSchema.safeParse({
    ...input,
    phone: normalizePartnerPhone(input.phone),
  });

  if (!parsed.success) {
    return { ok: false, error: "Revise os dados destacados antes de salvar." };
  }

  const { supabase } = await requirePartnerBillingContext();
  const { error } = await supabase.rpc("update_partner_account_profile", {
    p_display_name: parsed.data.displayName,
    p_phone: parsed.data.phone,
    p_professional_type: parsed.data.professionalType,
    p_professional_registry_type: parsed.data.professionalRegistryType,
    p_professional_registry_number: parsed.data.professionalRegistryNumber,
  });

  if (error) {
    return { ok: false, error: "Não foi possível atualizar os dados da conta." };
  }

  revalidatePath("/parceiros", "layout");
  revalidatePath("/parceiros/configuracoes/geral");
  revalidatePath("/parceiros/dashboard");
  return { ok: true, message: "Dados da conta atualizados." };
}
