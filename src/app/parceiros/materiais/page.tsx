import { fetchPartnerMaterialsData } from "@/lib/partners/materials-data";

import { PartnerMaterialsView } from "./partner-materials-view";

export const dynamic = "force-dynamic";

export default async function ParceirosMateriaisPage() {
  const data = await fetchPartnerMaterialsData();
  return <PartnerMaterialsView data={data} />;
}
