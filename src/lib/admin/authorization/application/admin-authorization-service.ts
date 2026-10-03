import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

import {
  type AdminCapability,
  type AdminRole,
  isAdminRole,
  roleHasCapability,
} from "../domain/capabilities";

export type AdminAuthorization = {
  profileId: string;
  role: AdminRole;
  can: (capability: AdminCapability) => boolean;
};

export async function getAdminAuthorization(): Promise<AdminAuthorization | null> {
  const { profile } = await getCurrentProfile();
  if (!profile || profile.role !== "admin" || profile.status !== "active") return null;

  const supabase = await createClient();
  const client = supabase as unknown as { rpc: (name: string) => Promise<{ data: unknown; error: { message: string } | null }> };
  const { data, error } = await client.rpc("current_admin_role");
  if (error || !isAdminRole(data)) return null;

  return {
    profileId: profile.id,
    role: data,
    can: (capability) => roleHasCapability(data, capability),
  };
}

export async function requireAdminCapability(capability: AdminCapability) {
  const authorization = await getAdminAuthorization();
  if (!authorization || !authorization.can(capability)) return null;
  return authorization;
}
