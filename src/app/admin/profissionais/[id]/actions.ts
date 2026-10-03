"use server";

import { revalidatePath } from "next/cache";

import { requireAdminCapability } from "@/lib/admin/authorization/application/admin-authorization-service";

export async function changeProfessionalStatus(_previousState: { ok: boolean; message: string }, formData: FormData) {
  const partnerId = String(formData.get("partnerId") ?? "");
  const status = String(formData.get("status") ?? "");
  const authorization = await requireAdminCapability("professional.status.write");
  if (!authorization) return { ok: false, message: "Você não possui permissão para alterar o status." };

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const client = supabase as unknown as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
  const { error } = await client.rpc("admin_set_professional_status", {
    p_actor_profile_id: authorization.profileId,
    p_partner_id: partnerId,
    p_status: status,
  });
  if (error) return { ok: false, message: "Não foi possível atualizar o status." };

  revalidatePath(`/admin/profissionais/${partnerId}`);
  revalidatePath("/admin/profissionais");
  return { ok: true, message: "Status atualizado." };
}

export async function changeSubscriptionCancellation(_previousState: { ok: boolean; message: string }, formData: FormData) {
  const partnerId = String(formData.get("partnerId") ?? "");
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const action = String(formData.get("action") ?? "");
  const authorization = await requireAdminCapability("subscription.cancel.manage");
  if (!authorization || !["schedule_cancel", "reverse_cancel"].includes(action)) return { ok: false, message: "Você não possui permissão para esta operação." };
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke("admin-subscriptions", { body: { action, subscriptionId } });
  if (error || !data?.ok) return { ok: false, message: "Não foi possível enviar a alteração de assinatura." };
  revalidatePath(`/admin/profissionais/${partnerId}`);
  return { ok: true, message: "Alteração enviada. O status será atualizado após a confirmação do pagamento." };
}
