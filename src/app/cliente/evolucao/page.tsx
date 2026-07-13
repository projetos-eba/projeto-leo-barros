import { ClientEvolutionView } from "./client-evolution-view";
import { fetchPlatformBranding } from "@/lib/branding/platform-branding";
import { fetchClientEvolution } from "@/lib/clients/evolution-data";

export default async function ClienteEvolucaoPage() {
  const [evolution, branding] = await Promise.all([
    fetchClientEvolution(),
    fetchPlatformBranding(),
  ]);

  return <ClientEvolutionView evolution={evolution} platformName={branding.platformName} />;
}
