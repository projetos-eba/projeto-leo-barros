import { fetchPartnerMaterialsData } from "@/lib/partners/materials-data";
import { fetchPartnerFormLibrary } from "@/lib/partners/form-library-data";

import { PartnerMaterialsView } from "./partner-materials-view";
import { PartnerFormLibrary } from "./partner-form-library";

export const dynamic = "force-dynamic";

export default async function ParceirosMateriaisPage() {
  const [data, formsResult] = await Promise.all([
    fetchPartnerMaterialsData(),
    fetchPartnerFormLibrary()
      .then((templates) => ({ templates, unavailable: false }))
      .catch(() => ({ templates: [], unavailable: true })),
  ]);
  return <PartnerMaterialsView data={data} formsSection={<PartnerFormLibrary clients={data.clients} templates={formsResult.templates} unavailable={formsResult.unavailable} />} />;
}
