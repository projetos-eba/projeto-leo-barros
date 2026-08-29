import { notFound } from "next/navigation";

import { fetchPartnerClientAssessments } from "@/lib/partners/client-assessments-data";
import { fetchPartnerClientCardio } from "@/lib/partners/client-cardio-data";
import { fetchPartnerClientClinicalWorkspace } from "@/lib/partners/client-clinical-workspace-data";
import { fetchPartnerClientDiet } from "@/lib/partners/client-diet-data";
import { fetchPartnerClientExams } from "@/lib/partners/client-exams-data";
import { fetchPartnerClientOverview } from "@/lib/partners/client-overview-data";
import { fetchPartnerClientPhotos } from "@/lib/partners/client-photos-data";
import { fetchPartnerClientWorkout } from "@/lib/partners/client-workout-data";
import { fetchPartnerClientFinanceData } from "@/lib/partners/finance-data";

import { PartnerClientAssessmentsView } from "./partner-client-assessments-view";
import { PartnerClientCardioView } from "./partner-client-cardio-view";
import { PartnerClientClinicalWorkspaceView } from "./partner-client-clinical-workspace-view";
import { PartnerClientDietView } from "./partner-client-diet-view";
import { PartnerClientExamsView } from "./partner-client-exams-view";
import { PartnerClientFinanceView } from "./partner-client-finance-view";
import { PartnerClientOverviewView } from "./partner-client-overview-view";
import { PartnerClientPhotosView } from "./partner-client-photos-view";
import { PartnerClientWorkoutView } from "./partner-client-workout-view";

type ClienteOverviewPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    plan?: string;
    tab?: string;
  }>;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export default async function ParceirosClienteOverviewPage({ params, searchParams }: ClienteOverviewPageProps) {
  const { id } = await params;
  const { plan, tab } = await searchParams;

  if (!uuidPattern.test(id)) {
    notFound();
  }

  if (tab === "anamnese" || tab === "prescricoes" || tab === "formularios") {
    const [overview, clinicalWorkspace] = await Promise.all([
      fetchPartnerClientOverview(id),
      fetchPartnerClientClinicalWorkspace(id, tab),
    ]);
    if (!overview || !clinicalWorkspace) {
      notFound();
    }

    return (
      <PartnerClientClinicalWorkspaceView
        activeTab={tab}
        data={clinicalWorkspace}
        overview={overview}
      />
    );
  }

  if (tab === "dietas") {
    const selectedPlanId = plan && uuidPattern.test(plan) ? plan : undefined;
    const [overview, diet] = await Promise.all([fetchPartnerClientOverview(id), fetchPartnerClientDiet(id, selectedPlanId)]);
    if (!overview || !diet) {
      notFound();
    }

    return <PartnerClientDietView diet={diet} overview={overview} />;
  }

  if (tab === "avaliacoes") {
    const [overview, assessments] = await Promise.all([fetchPartnerClientOverview(id), fetchPartnerClientAssessments(id)]);
    if (!overview || !assessments) {
      notFound();
    }

    return <PartnerClientAssessmentsView assessments={assessments} overview={overview} />;
  }

  if (tab === "treinos") {
    const [overview, workout] = await Promise.all([fetchPartnerClientOverview(id), fetchPartnerClientWorkout(id)]);
    if (!overview || !workout) {
      notFound();
    }

    return <PartnerClientWorkoutView overview={overview} workout={workout} />;
  }

  if (tab === "cardio") {
    const [overview, cardio] = await Promise.all([fetchPartnerClientOverview(id), fetchPartnerClientCardio(id)]);
    if (!overview || !cardio) {
      notFound();
    }

    return <PartnerClientCardioView cardio={cardio} overview={overview} />;
  }

  if (tab === "exames") {
    const [overview, exams] = await Promise.all([fetchPartnerClientOverview(id), fetchPartnerClientExams(id)]);
    if (!overview || !exams) {
      notFound();
    }

    return <PartnerClientExamsView exams={exams} overview={overview} />;
  }

  if (tab === "fotos") {
    const [overview, photos] = await Promise.all([fetchPartnerClientOverview(id), fetchPartnerClientPhotos(id)]);
    if (!overview || !photos) {
      notFound();
    }

    return <PartnerClientPhotosView overview={overview} photos={photos} />;
  }

  if (tab === "planos-financeiro") {
    const [overview, finance] = await Promise.all([fetchPartnerClientOverview(id), fetchPartnerClientFinanceData(id)]);
    if (!overview) notFound();
    return <PartnerClientFinanceView finance={finance} overview={overview} />;
  }

  const overview = await fetchPartnerClientOverview(id);
  if (!overview) notFound();
  return <PartnerClientOverviewView overview={overview} />;
}
