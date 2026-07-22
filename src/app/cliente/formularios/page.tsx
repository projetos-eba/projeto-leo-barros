import { fetchClientForms } from "@/lib/clients/forms-data";

import { ClientFormsView } from "./client-forms-view";

export const dynamic = "force-dynamic";

export default async function ClienteFormulariosPage() {
  const forms = await fetchClientForms();
  return <ClientFormsView forms={forms} />;
}
