import { AdminFinancialView } from "./admin-financial-view";
import { fetchAdminFinancialData } from "@/lib/admin/financial-data";
import { fetchPlatformBranding } from "@/lib/branding/platform-branding";

export const dynamic = "force-dynamic";

export default async function AdminFinancialPage() {
  const [financial, branding] = await Promise.all([
    fetchAdminFinancialData(),
    fetchPlatformBranding(),
  ]);

  return <AdminFinancialView financial={financial} platformName={branding.platformName} />;
}
