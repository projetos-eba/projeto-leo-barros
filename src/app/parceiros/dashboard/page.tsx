import { PartnerDashboardView } from "./partner-dashboard-view";
import { fetchPartnerDashboardData } from "@/lib/partners/dashboard-data";

export const dynamic = "force-dynamic";

export default async function ParceirosDashboardPage() {
  const dashboard = await fetchPartnerDashboardData();

  return <PartnerDashboardView dashboard={dashboard} />;
}
