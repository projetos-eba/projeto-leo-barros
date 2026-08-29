import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchPartnerClientAssessments } from "@/lib/partners/client-assessments-data";
import { fetchPartnerClientCardio } from "@/lib/partners/client-cardio-data";
import { fetchPartnerClientClinicalWorkspace } from "@/lib/partners/client-clinical-workspace-data";
import { fetchPartnerClientDiet } from "@/lib/partners/client-diet-data";
import { fetchPartnerClientExams } from "@/lib/partners/client-exams-data";
import { fetchPartnerClientOverview } from "@/lib/partners/client-overview-data";
import { fetchPartnerClientPhotos } from "@/lib/partners/client-photos-data";
import { fetchPartnerClientWorkout } from "@/lib/partners/client-workout-data";
import { fetchPartnerClientFinanceData } from "@/lib/partners/finance-data";

import ParceirosClienteOverviewPage from "./page";

const { notFound } = vi.hoisted(() => ({ notFound: vi.fn(() => {
  throw new Error("not-found");
}) }));

vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/lib/partners/client-assessments-data", () => ({ fetchPartnerClientAssessments: vi.fn() }));
vi.mock("@/lib/partners/client-cardio-data", () => ({ fetchPartnerClientCardio: vi.fn() }));
vi.mock("@/lib/partners/client-clinical-workspace-data", () => ({ fetchPartnerClientClinicalWorkspace: vi.fn() }));
vi.mock("@/lib/partners/client-diet-data", () => ({ fetchPartnerClientDiet: vi.fn() }));
vi.mock("@/lib/partners/client-exams-data", () => ({ fetchPartnerClientExams: vi.fn() }));
vi.mock("@/lib/partners/client-overview-data", () => ({ fetchPartnerClientOverview: vi.fn() }));
vi.mock("@/lib/partners/client-photos-data", () => ({ fetchPartnerClientPhotos: vi.fn() }));
vi.mock("@/lib/partners/client-workout-data", () => ({ fetchPartnerClientWorkout: vi.fn() }));
vi.mock("@/lib/partners/finance-data", () => ({ fetchPartnerClientFinanceData: vi.fn() }));

vi.mock("./partner-client-assessments-view", () => ({ PartnerClientAssessmentsView: () => null }));
vi.mock("./partner-client-cardio-view", () => ({ PartnerClientCardioView: () => null }));
vi.mock("./partner-client-clinical-workspace-view", () => ({ PartnerClientClinicalWorkspaceView: () => null }));
vi.mock("./partner-client-diet-view", () => ({ PartnerClientDietView: () => null }));
vi.mock("./partner-client-exams-view", () => ({ PartnerClientExamsView: () => null }));
vi.mock("./partner-client-finance-view", () => ({ PartnerClientFinanceView: () => null }));
vi.mock("./partner-client-overview-view", () => ({ PartnerClientOverviewView: () => null }));
vi.mock("./partner-client-photos-view", () => ({ PartnerClientPhotosView: () => null }));
vi.mock("./partner-client-workout-view", () => ({ PartnerClientWorkoutView: () => null }));

const clientId = "a1000000-0000-4000-8000-000000000301";
const overview = { client: { id: clientId } };

const domainLoaders = [
  fetchPartnerClientAssessments,
  fetchPartnerClientCardio,
  fetchPartnerClientClinicalWorkspace,
  fetchPartnerClientDiet,
  fetchPartnerClientExams,
  fetchPartnerClientPhotos,
  fetchPartnerClientWorkout,
  fetchPartnerClientFinanceData,
] as const;

function pageProps(tab?: string, plan?: string) {
  return {
    params: Promise.resolve({ id: clientId }),
    searchParams: Promise.resolve({ ...(tab ? { tab } : {}), ...(plan ? { plan } : {}) }),
  };
}

describe("ParceirosClienteOverviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchPartnerClientOverview).mockResolvedValue(overview as never);
    domainLoaders.forEach((loader) => vi.mocked(loader).mockResolvedValue({} as never));
  });

  it.each([
    ["avaliacoes", fetchPartnerClientAssessments],
    ["cardio", fetchPartnerClientCardio],
    ["dietas", fetchPartnerClientDiet],
    ["exames", fetchPartnerClientExams],
    ["fotos", fetchPartnerClientPhotos],
    ["treinos", fetchPartnerClientWorkout],
  ] as const)("carrega apenas o domínio ativo para a tab %s", async (tab, loader) => {
    await ParceirosClienteOverviewPage(pageProps(tab));

    expect(fetchPartnerClientOverview).toHaveBeenCalledWith(clientId);
    if (loader === fetchPartnerClientDiet) {
      expect(loader).toHaveBeenCalledWith(clientId, undefined);
    } else {
      expect(loader).toHaveBeenCalledWith(clientId);
    }
    domainLoaders.filter((candidate) => candidate !== loader).forEach((candidate) => {
      expect(candidate).not.toHaveBeenCalled();
    });
  });

  it("encaminha o plano selecionado somente para o loader de Dietas", async () => {
    const planId = "e1000000-0000-4000-8000-000000000102";

    await ParceirosClienteOverviewPage(pageProps("dietas", planId));

    expect(fetchPartnerClientDiet).toHaveBeenCalledWith(clientId, planId);
    domainLoaders.filter((loader) => loader !== fetchPartnerClientDiet).forEach((loader) => {
      expect(loader).not.toHaveBeenCalled();
    });
  });

  it.each(["anamnese", "prescricoes", "formularios"] as const)("encaminha %s para o workspace clínico", async (tab) => {
    await ParceirosClienteOverviewPage(pageProps(tab));

    expect(fetchPartnerClientClinicalWorkspace).toHaveBeenCalledWith(clientId, tab);
    domainLoaders.filter((loader) => loader !== fetchPartnerClientClinicalWorkspace).forEach((loader) => {
      expect(loader).not.toHaveBeenCalled();
    });
  });

  it("carrega o domínio financeiro somente para a tab financeira", async () => {
    await ParceirosClienteOverviewPage(pageProps("planos-financeiro"));

    expect(fetchPartnerClientFinanceData).toHaveBeenCalledWith(clientId);
    domainLoaders.filter((loader) => loader !== fetchPartnerClientFinanceData).forEach((loader) => {
      expect(loader).not.toHaveBeenCalled();
    });
  });

  it("usa a Visão Geral como fallback para tab ausente ou desconhecida", async () => {
    await ParceirosClienteOverviewPage(pageProps("desconhecida"));

    expect(fetchPartnerClientOverview).toHaveBeenCalledWith(clientId);
    domainLoaders.forEach((loader) => expect(loader).not.toHaveBeenCalled());
  });

  it("retorna not-found antes de consultar dados quando o id não é UUID", async () => {
    await expect(ParceirosClienteOverviewPage({
      params: Promise.resolve({ id: "invalido" }),
      searchParams: Promise.resolve({}),
    })).rejects.toThrow("not-found");

    expect(fetchPartnerClientOverview).not.toHaveBeenCalled();
  });
});
