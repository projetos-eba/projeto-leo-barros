import { fetchPartnerMaterialsData } from "@/lib/partners/materials-data";
import { fetchPartnerFormLibrary } from "@/lib/partners/form-library-data";
import type { PartnerFormTemplate } from "@/lib/partners/form-library";

import { PartnerMaterialsView } from "./partner-materials-view";
import { PartnerFormLibrary } from "./partner-form-library";

export const dynamic = "force-dynamic";

type FormsResult = {
  templates: PartnerFormTemplate[];
  unavailable: boolean;
};

export default async function ParceirosMateriaisPage() {
  const [data, formsResult] = await Promise.all([
    fetchPartnerMaterialsData(),
    fetchPartnerFormLibrary()
      .then((templates): FormsResult => ({ templates, unavailable: false }))
      .catch((): FormsResult => ({ templates: [], unavailable: true })),
  ]);
  return (
    <PartnerMaterialsView
      data={data}
      formsActiveCount={formsResult.templates.filter((template) => template.status === "active").length}
      formsSection={<PartnerFormLibrary clients={data.clients} mode="cards" templates={formsResult.templates} unavailable={formsResult.unavailable} />}
    />
  );
}
