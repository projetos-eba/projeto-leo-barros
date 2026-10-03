import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildPartnerClientPhotos, type PartnerClientPhotosRawData } from "@/lib/partners/client-profile/photos";
import type { PartnerClientOverviewData } from "@/lib/partners/client-profile/overview";

import {
  removeClientPhotoSession,
  saveClientPhotoComparisonNote,
  saveClientPhotoSession,
} from "./_actions/photos";
import { PartnerClientPhotosView } from "./partner-client-photos-view";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        remove: vi.fn().mockResolvedValue({ error: null }),
        upload: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  }),
}));

vi.mock("./_actions/photos", () => ({
  removeClientPhotoSession: vi.fn(),
  saveClientPhotoComparisonNote: vi.fn(),
  saveClientPhotoSession: vi.fn(),
}));

const overview: PartnerClientOverviewData = {
  adherenceTarget: 80,
  adherenceWeeks: [],
  alerts: [],
  bodyFat: { delta: -1, targetLabel: "12-15%", value: 14.7 },
  bodyMeasurements: [],
  client: {
    ageLabel: "29 anos",
    avatarUrl: null,
    birthDateLabel: "02/07/1997",
    email: "ana@example.invalid",
    biologicalSexLabel: "Feminino",
    id: "a1000000-0000-4000-8000-000000000301",
    initial: "A",
    name: "Ana Ribeiro",
    objectiveLabel: "Hipertrofia",
    phoneDigits: "5511999999999",
    phoneLabel: "+5511999999999",
    planPeriodLabel: "10/06/2026 – 08/07/2026",
    serviceScopes: ["dieta", "treino"],
    status: "active",
    statusLabel: "Ativo",
  },
  generalAdherence: { delta: 0, value: 80 },
  generatedAt: "2026-07-02T12:00:00.000Z",
  history: [],
  nextAppointment: null,
  plan: null,
  recentRecords: [],
  tasks: [],
  weight: { delta: 1.2, target: 80, value: 78.4 },
};

const raw: PartnerClientPhotosRawData = {
  comparisonNotes: [{
    afterSessionId: "f4000000-0000-4000-8000-000000000102",
    beforeSessionId: "f4000000-0000-4000-8000-000000000101",
    id: "f4000000-0000-4000-8000-000000000301",
    notes: "Boa evolução.",
    updatedAt: "2026-07-01T12:00:00.000Z",
  }],
  events: [],
  generatedAt: "2026-07-02T12:00:00.000Z",
  partnerId: "a1000000-0000-4000-8000-000000000201",
  patientId: overview.client.id,
  sessions: [
    {
      capturedAt: "2026-05-01T10:00:00.000Z",
      createdAt: "2026-05-01T10:00:00.000Z",
      id: "f4000000-0000-4000-8000-000000000101",
      measurements: { armCm: 28, calfCm: 34, hipCm: 96, thighCm: 54, waistCm: 74, weightKg: 65 },
      notes: null,
      photos: [
        { angle: "front", createdAt: "2026-05-01T10:00:00.000Z", cropData: {}, heightPx: 1448, id: "f4000000-0000-4000-8000-000000000201", mimeType: "image/png", originalFilename: "front.png", sizeBytes: 1000, storagePath: "partner/client/session/front.png", widthPx: 1086 },
        { angle: "back", createdAt: "2026-05-01T10:00:00.000Z", cropData: {}, heightPx: 1448, id: "f4000000-0000-4000-8000-000000000202", mimeType: "image/png", originalFilename: "back.png", sizeBytes: 1000, storagePath: "partner/client/session/back.png", widthPx: 1086 },
        { angle: "left", createdAt: "2026-05-01T10:00:00.000Z", cropData: {}, heightPx: 1448, id: "f4000000-0000-4000-8000-000000000203", mimeType: "image/png", originalFilename: "left.png", sizeBytes: 1000, storagePath: "partner/client/session/left.png", widthPx: 1086 },
        { angle: "right", createdAt: "2026-05-01T10:00:00.000Z", cropData: {}, heightPx: 1448, id: "f4000000-0000-4000-8000-000000000204", mimeType: "image/png", originalFilename: "right.png", sizeBytes: 1000, storagePath: "partner/client/session/right.png", widthPx: 1086 },
      ],
      status: "complete",
      title: "6ª sessão",
      updatedAt: "2026-05-01T10:00:00.000Z",
    },
    {
      capturedAt: "2026-06-01T10:00:00.000Z",
      createdAt: "2026-06-01T10:00:00.000Z",
      id: "f4000000-0000-4000-8000-000000000102",
      measurements: { armCm: 27, calfCm: 33.5, hipCm: 93, thighCm: 52, waistCm: 71, weightKg: 63.4 },
      notes: "Depois",
      photos: [
        { angle: "front", createdAt: "2026-06-01T10:00:00.000Z", cropData: {}, heightPx: 1448, id: "f4000000-0000-4000-8000-000000000205", mimeType: "image/png", originalFilename: "front.png", sizeBytes: 1000, storagePath: "partner/client/session2/front.png", widthPx: 1086 },
        { angle: "back", createdAt: "2026-06-01T10:00:00.000Z", cropData: {}, heightPx: 1448, id: "f4000000-0000-4000-8000-000000000206", mimeType: "image/png", originalFilename: "back.png", sizeBytes: 1000, storagePath: "partner/client/session2/back.png", widthPx: 1086 },
        { angle: "left", createdAt: "2026-06-01T10:00:00.000Z", cropData: {}, heightPx: 1448, id: "f4000000-0000-4000-8000-000000000207", mimeType: "image/png", originalFilename: "left.png", sizeBytes: 1000, storagePath: "partner/client/session2/left.png", widthPx: 1086 },
        { angle: "right", createdAt: "2026-06-01T10:00:00.000Z", cropData: {}, heightPx: 1448, id: "f4000000-0000-4000-8000-000000000208", mimeType: "image/png", originalFilename: "right.png", sizeBytes: 1000, storagePath: "partner/client/session2/right.png", widthPx: 1086 },
      ],
      status: "complete",
      title: "8ª sessão",
      updatedAt: "2026-06-01T10:00:00.000Z",
    },
    {
      capturedAt: "2026-07-01T10:00:00.000Z",
      createdAt: "2026-07-01T10:00:00.000Z",
      id: "f4000000-0000-4000-8000-000000000103",
      measurements: { armCm: null, calfCm: null, hipCm: null, thighCm: null, waistCm: null, weightKg: null },
      notes: "Rascunho",
      photos: [
        { angle: "front", createdAt: "2026-07-01T10:00:00.000Z", cropData: {}, heightPx: 1448, id: "f4000000-0000-4000-8000-000000000209", mimeType: "image/png", originalFilename: "front.png", sizeBytes: 1000, storagePath: "partner/client/session3/front.png", widthPx: 1086 },
      ],
      status: "draft",
      title: "9ª sessão",
      updatedAt: "2026-07-01T10:00:00.000Z",
    },
  ],
};

const photos = buildPartnerClientPhotos(raw);

describe("PartnerClientPhotosView", () => {
  beforeEach(() => {
    vi.mocked(removeClientPhotoSession).mockResolvedValue({ ok: true });
    vi.mocked(saveClientPhotoComparisonNote).mockResolvedValue({ ok: true });
    vi.mocked(saveClientPhotoSession).mockResolvedValue({ ok: true });
    refresh.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("exige a seleção de uma sessão completa antes de comparar", () => {
    render(<PartnerClientPhotosView overview={overview} photos={photos} />);

    expect(screen.getByRole("heading", { name: "Ana Ribeiro" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Fotos" })).toHaveAttribute("href", expect.stringContaining("tab=fotos"));
    expect(screen.getByRole("heading", { name: "Nova sessão de fotos" })).toBeInTheDocument();
    expect(screen.getByText("Linha do tempo")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Fotos da sessão" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Comparação de evolução" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Comparar" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Selecionar sessão 01/06/2026" }));
    expect(screen.getByRole("heading", { name: "Fotos da sessão" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Comparar" }));
    expect(screen.getByRole("heading", { name: "Comparação de evolução" })).toBeInTheDocument();
    const comparisonSelect = screen.getByLabelText("Comparar com");
    expect(within(comparisonSelect).getByRole("option", { name: "01/05/2026" })).toBeInTheDocument();
    expect(within(comparisonSelect).queryByRole("option", { name: "01/06/2026" })).not.toBeInTheDocument();
    expect(within(comparisonSelect).queryByRole("option", { name: "01/07/2026" })).not.toBeInTheDocument();
    expect(screen.getByText("Sessão A - 01/05/2026")).toBeInTheDocument();
    expect(screen.getByText("Sessão B - 01/06/2026")).toBeInTheDocument();
    expect(screen.getAllByText("-3 cm").length).toBeGreaterThan(0);
    expect(screen.queryByText("Pacientes")).not.toBeInTheDocument();
    expect(screen.queryByText(/CPF/i)).not.toBeInTheDocument();
  });

  it("não oferece comparação para rascunhos e oferece o modo revelador", () => {
    render(<PartnerClientPhotosView overview={overview} photos={photos} />);

    fireEvent.click(screen.getByRole("radio", { name: "Selecionar sessão 01/07/2026" }));
    expect(screen.queryByRole("button", { name: "Comparar" })).not.toBeInTheDocument();
    expect(screen.getByText("Complete os quatro ângulos para comparar esta sessão.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Selecionar sessão 01/06/2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Comparar" }));
    expect(screen.getByRole("button", { name: "Lado a lado" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Revelador" }));
    expect(screen.getByRole("button", { name: "Revelador" })).toHaveAttribute("aria-pressed", "true");

    const slider = screen.getByRole("slider", { name: "Posição do revelador" });
    fireEvent.change(slider, { target: { value: "75" } });
    expect(slider).toHaveValue("75");
    expect(slider).toHaveAttribute("aria-valuetext", "75% revelado");
    expect(screen.getByAltText("Antes - Frente")).toHaveStyle({ clipPath: "inset(0 25% 0 0)" });
    expect(screen.getByAltText("Depois - Frente")).toHaveStyle({ clipPath: "inset(0 0 0 75%)" });
  });

  it("permite redimensionar e alinhar cada foto de forma independente", () => {
    render(<PartnerClientPhotosView overview={overview} photos={photos} />);

    fireEvent.click(screen.getByRole("radio", { name: "Selecionar sessão 01/06/2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Comparar" }));
    expect(screen.queryByRole("heading", { name: "Ajuste de alinhamento" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ajustar imagem" }));
    expect(screen.getByRole("heading", { name: "Ajuste de alinhamento" })).toBeInTheDocument();

    const beforeScale = screen.getByRole("slider", { name: "Escala Antes" });
    const afterScale = screen.getByRole("slider", { name: "Escala Depois" });
    const beforeHorizontal = screen.getByRole("slider", { name: "Posição horizontal Antes" });
    fireEvent.change(beforeScale, { target: { value: "120" } });
    fireEvent.change(afterScale, { target: { value: "90" } });
    fireEvent.change(beforeHorizontal, { target: { value: "-10" } });

    expect(screen.getByAltText("Antes - Frente")).toHaveStyle({ transform: "translate(-10%, 0%) scale(1.2)" });
    expect(screen.getByAltText("Depois - Frente")).toHaveStyle({ transform: "translate(0%, 0%) scale(0.9)" });

    fireEvent.click(screen.getByRole("button", { name: "Restaurar ajustes" }));
    expect(beforeScale).toHaveValue("100");
    expect(afterScale).toHaveValue("100");
    expect(beforeHorizontal).toHaveValue("0");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("heading", { name: "Ajuste de alinhamento" })).not.toBeInTheDocument();
  });

  it("salva observação e remove sessão", async () => {
    render(<PartnerClientPhotosView overview={overview} photos={photos} />);

    fireEvent.click(screen.getByRole("radio", { name: "Selecionar sessão 01/06/2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Comparar" }));
    fireEvent.change(screen.getByDisplayValue("Boa evolução."), { target: { value: "Manter conduta." } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(saveClientPhotoComparisonNote).toHaveBeenCalledWith({
      afterSessionId: "f4000000-0000-4000-8000-000000000102",
      beforeSessionId: "f4000000-0000-4000-8000-000000000101",
      notes: "Manter conduta.",
      patientId: overview.client.id,
    }));

    fireEvent.click(screen.getByLabelText("Remover sessão 01/06/2026"));
    await waitFor(() => expect(removeClientPhotoSession).toHaveBeenCalledWith({
      patientId: overview.client.id,
      sessionId: "f4000000-0000-4000-8000-000000000102",
    }));
  });
});
