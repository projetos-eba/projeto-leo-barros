import { ClientDietView } from "./client-diet-view";
import { fetchClientDiet } from "@/lib/clients/diet-data";

export const dynamic = "force-dynamic";

type ClienteDietaPageProps = {
  searchParams?: Promise<{ date?: string }> | { date?: string };
};

function safeDate(value: string | undefined) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

export default async function ClienteDietaPage({ searchParams }: ClienteDietaPageProps) {
  const resolvedSearchParams = await searchParams;
  const diet = await fetchClientDiet(safeDate(resolvedSearchParams?.date));

  return <ClientDietView diet={diet} />;
}
