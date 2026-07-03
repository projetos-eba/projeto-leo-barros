import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildPartnerClientPhotos, type PartnerClientPhotosRawData } from "@/lib/partners/client-photos-metrics";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";

import {
  removeClientPhotoSession,
  saveClientPhotoComparisonNote,
  saveClientPhotoSession,
} from "./actions";
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

vi.mock("./actions", () => ({
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
    genderLabel: "Feminino",
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

  it("renderiza Fotos com perfil, linha do tempo e comparação sob demanda", () => {
    render(<PartnerClientPhotosView overview={overview} photos={photos} />);

    expect(screen.getByRole("heading", { name: "Ana Ribeiro" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Fotos" })).toHaveAttribute("href", expect.stringContaining("tab=fotos"));
    expect(screen.getByRole("heading", { name: "Nova sessão de fotos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fotos da sessão" })).toBeInTheDocument();
    expect(screen.getByText("Linha do tempo")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Comparação de evolução" })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Comparar" })[0]);
    expect(screen.getByRole("heading", { name: "Comparação de evolução" })).toBeInTheDocument();
    expect(screen.getAllByText("-3 cm").length).toBeGreaterThan(0);
    expect(screen.queryByText("Pacientes")).not.toBeInTheDocument();
    expect(screen.queryByText(/CPF/i)).not.toBeInTheDocument();
  });

  it("salva observação e remove sessão", async () => {
    render(<PartnerClientPhotosView overview={overview} photos={photos} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Comparar" })[0]);
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
