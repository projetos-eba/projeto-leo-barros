import { PartnerAgendaView } from "./partner-agenda-view";
import { fetchPartnerAgendaData } from "@/lib/partners/agenda-data";

export const dynamic = "force-dynamic";

export default async function ParceirosAgendaPage() {
  const agenda = await fetchPartnerAgendaData();

  return <PartnerAgendaView agenda={agenda} />;
}
