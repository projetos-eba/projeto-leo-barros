import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildPartnerClientCardio, type PartnerClientCardioRawData } from "@/lib/partners/client-cardio-metrics";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";

import {
  applyClientCardioCalculation,
  registerClientCardioSession,
  removeClientCardioSession,
  saveClientCardioCalculation,
  updateClientCardioPlan,
} from "./actions";
import { PartnerClientCardioView } from "./partner-client-cardio-view";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("./actions", () => ({
  applyClientCardioCalculation: vi.fn(),
  registerClientCardioSession: vi.fn(),
  removeClientCardioSession: vi.fn(),
  saveClientCardioCalculation: vi.fn(),
  updateClientCardioPlan: vi.fn(),
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

const raw: PartnerClientCardioRawData = {
  calculations: [
    {
      activityKey: "caminhada_leve",
      comparisonActivityKey: "corrida_moderada",
      comparisonKcalEstimate: 184,
      comparisonKcalPerMin: 6.1,
      comparisonMet: 5,
      createdAt: "2026-07-01T12:00:00.000Z",
      durationMinutes: 30,
      id: "calculation-1",
      kcalEstimate: 92,
      kcalPerMin: 3.1,
      met: 2.5,
      parameters: { weeklyTargetMinutes: 180 },
      targetZone: "z2",
      weightKg: 70,
    },
  ],
  events: [],
  generatedAt: "2026-07-02T12:00:00.000Z",
  patient: { birthDate: "1997-07-02" },
  plan: {
    activityKey: "caminhada_leve",
    comparisonActivityKey: "corrida_moderada",
    createdAt: "2026-06-20T12:00:00.000Z",
    id: "c3000000-0000-4000-8000-000000000101",
    notes: "Manter Z2.",
    publishedAt: null,
    sentAt: null,
    status: "published",
    targetZone: "z2",
    title: "Cardio base",
    updatedAt: "2026-07-01T12:00:00.000Z",
    version: 2,
    weeklyTargetMinutes: 180,
    weightKg: 70,
  },
  sessions: [
    {
      activityKey: "corrida_moderada",
      createdAt: "2026-07-01T10:00:00.000Z",
      durationMinutes: 60,
      id: "session-1",
      kcalEstimate: 368,
      met: 5,
      notes: null,
      performedAt: "2026-07-01T10:00:00.000Z",
      targetZone: "z2",
    },
  ],
};

const cardio = buildPartnerClientCardio(raw, new Date("2026-07-02T12:00:00.000Z"));

describe("PartnerClientCardioView", () => {
  beforeEach(() => {
    vi.mocked(applyClientCardioCalculation).mockResolvedValue({ ok: true });
    vi.mocked(registerClientCardioSession).mockResolvedValue({ ok: true });
    vi.mocked(removeClientCardioSession).mockResolvedValue({ ok: true });
    vi.mocked(saveClientCardioCalculation).mockResolvedValue({ ok: true });
    vi.mocked(updateClientCardioPlan).mockResolvedValue({ ok: true });
    refresh.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renderiza a aba Cardio sem CPF ou Pacientes", () => {
    render(<PartnerClientCardioView cardio={cardio} overview={overview} />);

    expect(screen.getByRole("heading", { name: "Ana Ribeiro" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cardio" })).toHaveAttribute("href", expect.stringContaining("tab=cardio"));
    expect(screen.getByRole("heading", { name: "Calculadora de Cardio" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Comparativo Calórico" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Zonas de Frequência Cardíaca" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Zona-alvo")).not.toBeInTheDocument();
    expect(screen.getByText("Realizado na semana")).toBeInTheDocument();
    expect(screen.queryByText("Pacientes")).not.toBeInTheDocument();
    expect(screen.queryByText(/CPF/i)).not.toBeInTheDocument();
  });

  it("recalcula visualmente e executa ações do cálculo", async () => {
    render(<PartnerClientCardioView cardio={cardio} overview={overview} />);

    fireEvent.change(screen.getByLabelText("Peso corporal"), { target: { value: "80" } });
    fireEvent.change(screen.getByLabelText("Tipo de atividade"), { target: { value: "corrida_forte" } });
    expect(screen.getAllByText("336 kcal").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Salvar cálculo/i }));
    await waitFor(() => expect(saveClientCardioCalculation).toHaveBeenCalledWith(expect.objectContaining({
      activityKey: "corrida_forte",
      patientId: overview.client.id,
      planId: raw.plan?.id,
      weightKg: 80,
    })));

    fireEvent.click(screen.getByRole("button", { name: /Calcular e aplicar plano/i }));
    await waitFor(() => expect(applyClientCardioCalculation).toHaveBeenCalledWith(expect.objectContaining({
      activityKey: "corrida_forte",
      weeklyTargetMinutes: 180,
    })));

    expect(screen.queryByRole("button", { name: /Atualizar meta/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Registrar sessão/i })).not.toBeInTheDocument();
  });

  it("mantém leitura de sessões realizadas e permite remover registro existente", async () => {
    render(<PartnerClientCardioView cardio={cardio} overview={overview} />);

    fireEvent.click(screen.getByLabelText("Remover sessão Corrida moderada"));
    await waitFor(() => expect(removeClientCardioSession).toHaveBeenCalledWith({
      patientId: overview.client.id,
      planId: raw.plan?.id,
      sessionId: "session-1",
    }));
  });
});
