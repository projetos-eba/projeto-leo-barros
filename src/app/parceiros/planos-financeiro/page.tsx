import { fetchPartnerFinanceData } from "@/lib/partners/finance-data";

import { PartnerPlansFinancialView } from "./partner-plans-financial-view";

export const dynamic = "force-dynamic";

export default async function ParceirosPlanosFinanceiroPage() {
  const data = await fetchPartnerFinanceData();
  return <PartnerPlansFinancialView data={data} />;
}
