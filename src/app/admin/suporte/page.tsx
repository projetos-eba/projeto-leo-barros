import { redirect } from "next/navigation";

import { AdminSupportView } from "./admin-support-view";
import { AccessBlocked } from "@/components/auth/access-blocked";
import { requireShellRole } from "@/lib/auth/next-guards";
import { fetchAdminSupportData } from "@/lib/admin/support-data";
import { fetchPlatformBranding } from "@/lib/branding/platform-branding";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const access = await requireShellRole("admin");

  if (!access.allowed && access.action === "redirect") {
    redirect(access.destination);
  }

  if (!access.allowed) {
    return (
      <AccessBlocked
        title="Conta sem acesso ao Admin"
        description="Sua conta não está ativa ou não possui permissão para acessar esta área."
      />
    );
  }

  const [support, branding] = await Promise.all([
    fetchAdminSupportData(),
    fetchPlatformBranding(),
  ]);

  return <AdminSupportView support={support} platformName={branding.platformName} />;
}
