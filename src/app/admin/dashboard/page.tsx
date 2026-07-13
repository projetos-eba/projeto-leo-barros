import { redirect } from "next/navigation";

import { AdminDashboardView } from "./admin-dashboard-view";
import { AccessBlocked } from "@/components/auth/access-blocked";
import { requireShellRole } from "@/lib/auth/next-guards";
import { fetchAdminDashboardData } from "@/lib/admin/dashboard-data";
import { fetchPlatformBranding } from "@/lib/branding/platform-branding";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
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

  const [dashboard, branding] = await Promise.all([
    fetchAdminDashboardData(),
    fetchPlatformBranding(),
  ]);

  return <AdminDashboardView dashboard={dashboard} platformName={branding.platformName} />;
}
