import { ClientEvolutionView } from "./client-evolution-view";
import { fetchClientEvolution } from "@/lib/clients/evolution-data";

export default async function ClienteEvolucaoPage() {
  const evolution = await fetchClientEvolution();

  return <ClientEvolutionView evolution={evolution} />;
}
