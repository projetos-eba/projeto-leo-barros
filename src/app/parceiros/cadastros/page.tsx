import { PartnerProtocolsView } from "./partner-protocols-view";
import { fetchPartnerProtocolsData } from "@/lib/partners/protocols-data";

export default async function ParceirosCadastrosPage() {
  const data = await fetchPartnerProtocolsData();

  return <PartnerProtocolsView data={data} />;
}
