import { AdminDashboardView } from "./admin-dashboard-view";
import { fetchAdminDashboardData } from "@/lib/admin/dashboard-data";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const dashboard = await fetchAdminDashboardData();

  return <AdminDashboardView dashboard={dashboard} />;
}
