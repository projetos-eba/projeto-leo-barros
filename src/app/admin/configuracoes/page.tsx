import { redirect } from "next/navigation";

import { AdminSettingsView } from "./admin-settings-view";
import { AccessBlocked } from "@/components/auth/access-blocked";
import { requireShellRole } from "@/lib/auth/next-guards";
import { fetchAdminSettingsData } from "@/lib/admin/settings-data";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
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

  const settings = await fetchAdminSettingsData();

  return <AdminSettingsView settings={settings} />;
}
