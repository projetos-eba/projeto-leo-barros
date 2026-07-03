import { ClientHomeView } from "./client-home-view";
import { fetchClientHome } from "@/lib/clients/home-data";
import { buildClientHome } from "@/lib/clients/home-metrics";

export default async function ClienteInicioPage() {
  const home =
    (await fetchClientHome()) ??
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

  return <ClientHomeView home={home} />;
}
