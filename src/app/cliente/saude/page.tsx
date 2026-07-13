import { fetchClientHealth } from "@/lib/clients/health-data";

import { ClientHealthView } from "./client-health-view";

export const dynamic = "force-dynamic";

export default async function ClienteSaudePage() {
  const health = await fetchClientHealth();

  return <ClientHealthView health={health} />;
}
