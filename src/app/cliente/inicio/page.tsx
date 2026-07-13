import { ClientHomeView } from "./client-home-view";
import { fetchPlatformBranding } from "@/lib/branding/platform-branding";
import { fetchClientHome } from "@/lib/clients/home-data";
import { buildClientHome } from "@/lib/clients/home-metrics";

export default async function ClienteInicioPage() {
  const [homeData, branding] = await Promise.all([
    fetchClientHome(),
    fetchPlatformBranding(),
  ]);
  const home =
    homeData ??
    buildClientHome({
      appointments: [],
      client: {
        avatarUrl: null,
        displayName: "Cliente",
        objective: "Jornada integrada",
        patientId: "cliente",
      },
      measurements: [],
      serviceScopes: [],
      subscription: null,
    });

  return <ClientHomeView home={home} platformName={branding.platformName} />;
}
