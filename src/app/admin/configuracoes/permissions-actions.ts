"use server";

import { revalidatePath } from "next/cache";

import { requireAdminCapability } from "@/lib/admin/authorization/application/admin-authorization-service";
import { isAdminRole } from "@/lib/admin/authorization/domain/capabilities";
import { createClient } from "@/lib/supabase/server";

export async function assignAdminRoleAction(targetProfileId: string, role: string) {
  const authorization = await requireAdminCapability("permissions.manage");
  if (!authorization || !isAdminRole(role)) return { ok: false, message: "Você não possui permissão para alterar esta função." };
  const client = (await createClient()) as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
  const { error } = await client.rpc("admin_assign_role", { p_actor_profile_id: authorization.profileId, p_target_profile_id: targetProfileId, p_role_key: role });
  if (error) return { ok: false, message: "Não foi possível atualizar a função administrativa." };
  revalidatePath("/admin/configuracoes");
  return { ok: true, message: "Função administrativa atualizada." };
}
