import { notFound } from "next/navigation";

import { fetchPartnerClientAssessments } from "@/lib/partners/client-assessments-data";
import { fetchPartnerClientDiet } from "@/lib/partners/client-diet-data";
import { fetchPartnerClientOverview } from "@/lib/partners/client-overview-data";
import { fetchPartnerClientWorkout } from "@/lib/partners/client-workout-data";

import { PartnerClientAssessmentsView } from "./partner-client-assessments-view";
import { PartnerClientDietView } from "./partner-client-diet-view";
import { PartnerClientOverviewView } from "./partner-client-overview-view";
import { PartnerClientWorkoutView } from "./partner-client-workout-view";

type ClienteOverviewPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export default async function ParceirosClienteOverviewPage({ params, searchParams }: ClienteOverviewPageProps) {
  const { id } = await params;
  const { tab } = await searchParams;

  if (!uuidPattern.test(id)) {
    notFound();
  }

  const overview = await fetchPartnerClientOverview(id);

  if (!overview) {
    notFound();
  }


  if (tab === "dietas") {
    const diet = await fetchPartnerClientDiet(id);
    if (!diet) {
      notFound();
    }

    return <PartnerClientDietView diet={diet} overview={overview} />;
  }

  if (tab === "avaliacoes") {
    const assessments = await fetchPartnerClientAssessments(id);
    if (!assessments) {
      notFound();
    }

    return <PartnerClientAssessmentsView assessments={assessments} overview={overview} />;
  }

  if (tab === "treinos") {
    const workout = await fetchPartnerClientWorkout(id);
    if (!workout) {
      notFound();
    }

    return <PartnerClientWorkoutView overview={overview} workout={workout} />;
  }

  return <PartnerClientOverviewView overview={overview} />;
}
