import { PartnerClientsView } from "./partner-clients-view";
import { fetchPartnerClientsData } from "@/lib/partners/clients-data";

export const dynamic = "force-dynamic";

export default async function ParceirosClientesPage() {
  const clients = await fetchPartnerClientsData();

  return <PartnerClientsView clients={clients} />;
}
