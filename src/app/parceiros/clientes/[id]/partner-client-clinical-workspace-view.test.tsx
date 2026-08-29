import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PartnerClientClinicalWorkspaceData } from "@/lib/partners/client-clinical-workspace-data";
import type { PartnerClientOverviewData } from "@/lib/partners/client-profile/overview";

import { PartnerClientClinicalWorkspaceView } from "./partner-client-clinical-workspace-view";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("./_actions/clinical", () => ({
  saveClientAnamnesisEntry: vi.fn(),
  saveClientPrescriptionNote: vi.fn(),
  sendExistingFormToClient: vi.fn(),
  setClientPrescriptionStatus: vi.fn(),
}));
vi.mock("./partner-client-profile-header", () => ({
  PartnerClientProfileHeader: ({ activeTab }: { activeTab: string }) => <div data-testid="profile-header">{activeTab}</div>,
}));

const overview = { client: { id: "a1000000-0000-4000-8000-000000000301" } } as PartnerClientOverviewData;
const data: PartnerClientClinicalWorkspaceData = {
  anamnesis: { current: null, history: [], state: "available" },
  forms: { assignments: [], clients: [], state: "available", templates: [] },
  prescriptions: { history: [], state: "available" },
};

describe("PartnerClientClinicalWorkspaceView", () => {
  afterEach(cleanup);

  it("renderiza apenas a subtab clínica ativa e preserva o header compartilhado", () => {
    const { rerender } = render(<PartnerClientClinicalWorkspaceView activeTab="anamnese" data={data} overview={overview} />);
    expect(screen.getByTestId("profile-header")).toHaveTextContent("anamnese");
    expect(screen.getByRole("heading", { name: "Anamnese" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Condutas e orientações" })).not.toBeInTheDocument();

    rerender(<PartnerClientClinicalWorkspaceView activeTab="prescricoes" data={data} overview={overview} />);
    expect(screen.getByTestId("profile-header")).toHaveTextContent("prescricoes");
    expect(screen.getByRole("heading", { name: "Condutas e orientações" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Anamnese" })).not.toBeInTheDocument();

    rerender(<PartnerClientClinicalWorkspaceView activeTab="formularios" data={data} overview={overview} />);
    expect(screen.getByTestId("profile-header")).toHaveTextContent("formularios");
    expect(screen.getByRole("heading", { name: "Formulários e respostas" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Condutas e orientações" })).not.toBeInTheDocument();
  });
});
