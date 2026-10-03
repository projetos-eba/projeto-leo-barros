import { AdminSettingsView } from "./admin-settings-view";
import { AccessBlocked } from "@/components/auth/access-blocked";
import { requireAdminCapability } from "@/lib/admin/authorization/application/admin-authorization-service";
import { fetchAdminSettingsData } from "@/lib/admin/settings-data";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const authorization = await requireAdminCapability("settings.manage");
  if (!authorization) {
    return (
      <AccessBlocked
        title="Conta sem acesso ao Admin"
        description="Somente Owners podem alterar configurações administrativas."
      />
    );
  }

  const settings = await fetchAdminSettingsData();

  return <AdminSettingsView settings={settings} />;
}
