import { notFound } from "next/navigation";

import { fetchPartnerClientAssessments } from "@/lib/partners/client-assessments-data";
import { fetchPartnerClientCardio } from "@/lib/partners/client-cardio-data";
import { fetchPartnerClientDiet } from "@/lib/partners/client-diet-data";
import { fetchPartnerClientExams } from "@/lib/partners/client-exams-data";
import { fetchPartnerClientOverview } from "@/lib/partners/client-overview-data";
import { fetchPartnerClientPhotos } from "@/lib/partners/client-photos-data";
import { fetchPartnerClientWorkout } from "@/lib/partners/client-workout-data";
import { fetchPartnerClientClinicalData } from "@/lib/partners/client-clinical-data";
import { fetchPartnerFinanceData } from "@/lib/partners/finance-data";

import { PartnerClientAssessmentsView } from "./partner-client-assessments-view";
import { PartnerClientCardioView } from "./partner-client-cardio-view";
import { PartnerClientDietView } from "./partner-client-diet-view";
import { PartnerClientExamsView } from "./partner-client-exams-view";
import { PartnerClientFinanceView } from "./partner-client-finance-view";
import { PartnerClientNotesWorkspaceView } from "./partner-client-notes-workspace-view";
import { PartnerClientOverviewView } from "./partner-client-overview-view";
import { PartnerClientPhotosView } from "./partner-client-photos-view";
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

  if (tab === "cardio") {
    const cardio = await fetchPartnerClientCardio(id);
    if (!cardio) {
      notFound();
    }

    return <PartnerClientCardioView cardio={cardio} overview={overview} />;
  }

  if (tab === "exames") {
    const exams = await fetchPartnerClientExams(id);
    if (!exams) {
      notFound();
    }

    return <PartnerClientExamsView exams={exams} overview={overview} />;
  }

  if (tab === "fotos") {
    const photos = await fetchPartnerClientPhotos(id);
    if (!photos) {
      notFound();
    }

    return <PartnerClientPhotosView overview={overview} photos={photos} />;
  }

  if (tab === "anamnese" || tab === "prescricoes" || tab === "formularios") {
    const clinical = await fetchPartnerClientClinicalData(id);
    return <PartnerClientNotesWorkspaceView clinical={clinical} overview={overview} tab={tab} />;
  }

  if (tab === "planos-financeiro") {
    const finance = await fetchPartnerFinanceData();
    return <PartnerClientFinanceView finance={finance} overview={overview} />;
  }

  return <PartnerClientOverviewView overview={overview} />;
}
