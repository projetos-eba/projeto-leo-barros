import { AdminFinancialView } from "./admin-financial-view";
import { fetchAdminFinancialData } from "@/lib/admin/financial-data";

export const dynamic = "force-dynamic";

export default async function AdminFinancialPage() {
  const financial = await fetchAdminFinancialData();

  return <AdminFinancialView financial={financial} />;
}
