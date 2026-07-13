import { ClientDietView } from "./client-diet-view";
import { fetchClientDiet } from "@/lib/clients/diet-data";

export const dynamic = "force-dynamic";

export default async function ClienteDietaPage() {
  const diet = await fetchClientDiet();

  return <ClientDietView diet={diet} />;
}
