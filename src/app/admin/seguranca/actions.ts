"use server";

import { revalidatePath } from "next/cache";

import { requireAdminCapability } from "@/lib/admin/authorization/application/admin-authorization-service";

export async function revokeGlobalSession(_previousState: { ok: boolean; message: string }, formData: FormData) {
  const targetProfileId = String(formData.get("targetProfileId") ?? "");
  const authorization = await requireAdminCapability("security.sessions.revoke");
  if (!authorization) return { ok: false, message: "Você não possui permissão para revogar sessões." };
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke("admin-security", { body: { action: "revoke_global_session", targetProfileId } });
  if (error || !data?.ok) return { ok: false, message: "Não foi possível revogar as sessões." };
  revalidatePath("/admin/seguranca");
  return { ok: true, message: "Sessões revogadas." };
}
