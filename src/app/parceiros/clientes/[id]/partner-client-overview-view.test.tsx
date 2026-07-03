import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";

import { createClientAppointment, createClientTask, setClientTaskCompleted } from "./actions";
import { PartnerClientOverviewView } from "./partner-client-overview-view";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("./client-overview-chart", () => ({
  ClientOverviewChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="mock-client-overview-chart">chart:{data.length}</div>
  ),
}));

vi.mock("./actions", () => ({
  createClientAppointment: vi.fn(),
  createClientTask: vi.fn(),
  setClientTaskCompleted: vi.fn(),
}));

const overview: PartnerClientOverviewData = {
  adherenceTarget: 80,
  adherenceWeeks: [
    {
      dietDelta: -3,
      dietPercentage: 70,
      id: "week-1",
      label: "Esta semana",
      periodStart: "2026-06-22",
      trainingDelta: 6,
      trainingPercentage: 86,
    },
  ],
  alerts: [
    {
      dateLabel: "29/06/2026",
      detail: "Pressão oscilou no último registro.",
      id: "alert-1",
      severity: "attention",
      title: "Pressão arterial em atenção",
    },
  ],
  bodyFat: {
    delta: -0.8,
    targetLabel: "12–15%",
    value: 14.7,
  },
  bodyMeasurements: [
    {
      bodyFatPercentage: 16.1,
      fatMassKg: 12.5,
      id: "measurement-1",
      label: "mai. de 26",
      leanMassKg: 65.2,
      measuredAt: "2026-05-01T12:00:00.000Z",
      weightKg: 77.7,
    },
    {
      bodyFatPercentage: 14.7,
      fatMassKg: 11.5,
      id: "measurement-2",
      label: "jun. de 26",
      leanMassKg: 66.9,
      measuredAt: "2026-06-01T12:00:00.000Z",
      weightKg: 78.4,
    },
  ],
  client: {
    ageLabel: "35 anos",
    avatarUrl: "/avatars/ana-ribeiro-seed.png",
    birthDateLabel: "12/05/1991",
    email: "ana@example.invalid",
    genderLabel: "Feminino",
    id: "a1000000-0000-4000-8000-000000000301",
    initial: "A",
    name: "Ana Ribeiro",
    objectiveLabel: "Hipertrofia",
    phoneDigits: "5511999999999",
    phoneLabel: "+5511999999999",
    planPeriodLabel: "08/06/2026 – 08/07/2026",
    serviceScopes: ["dieta", "treino"],
    status: "active",
    statusLabel: "Ativo",
  },
  generalAdherence: {
    delta: 3,
    value: 78,
  },
  generatedAt: "2026-06-30T12:00:00.000Z",
  history: [
    {
      dateLabel: "29/06/2026",
      detail: "Pressão oscilou no último registro.",
      id: "history-1",
      occurredAt: "2026-06-29T09:00:00.000Z",
      title: "Pressão arterial em atenção",
      tone: "amber",
    },
  ],
  nextAppointment: {
    dateLabel: "05/07/2026",
    daysLabel: "05/07/2026",
    id: "appt-1",
    startsAt: "2026-07-05T10:30:00.000Z",
    timeLabel: "domingo • 10:30",
    title: "Consulta de acompanhamento",
  },
  plan: {
    description: "Plano personalizado de treino e dieta.",
    modules: [
      {
        id: "module-1",
        primarySummary: "Treinos 4x por semana",
        secondarySummary: "Progressão semanal",
        title: "Treino",
        type: "treino",
      },
    ],
    name: "Performance Mensal",
    renewalLabel: "8 dias",
  },
  recentRecords: [
    {
      dateLabel: "29/06/2026 • 09:00",
      id: "record-1",
      severity: "attention",
      title: "Pressão arterial em atenção",
      type: "blood_pressure",
      value: "135/88",
    },
  ],
  tasks: [
    {
      dueLabel: "Hoje",
      id: "task-1",
      priority: "high",
      priorityLabel: "Alta",
      status: "pending",
      title: "Enviar check-in",
    },
  ],
  weight: {
    delta: 0.7,
    target: 80,
    value: 78.4,
  },
};

describe("PartnerClientOverviewView", () => {
  beforeEach(() => {
    vi.mocked(createClientAppointment).mockResolvedValue({ ok: true });
    vi.mocked(createClientTask).mockResolvedValue({ ok: true });
    vi.mocked(setClientTaskCompleted).mockResolvedValue({ ok: true });
    refresh.mockReset();
  });

  afterEach(() => {
    cleanup();
    document.body.removeAttribute("data-scroll-locked");
    document.body.style.pointerEvents = "";
    vi.restoreAllMocks();
  });

  it("renderiza Visão Geral com abas futuras bloqueadas e Cardio implementado", () => {
    render(<PartnerClientOverviewView overview={overview} />);

    expect(screen.getByRole("heading", { name: "Ana Ribeiro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Visão Geral" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver plano" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Anamnese/ })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Cardio" })).toHaveAttribute("href", expect.stringContaining("tab=cardio"));
    expect(screen.getByTestId("mock-client-overview-chart")).toHaveTextContent("chart:2");
    expect(screen.getByRole("link", { name: "Mensagem" })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5511999999999"),
    );
  });

  it("abre histórico e alertas e aciona impressão", () => {
    const print = vi.fn();
    Object.defineProperty(window, "print", { configurable: true, value: print });

    render(<PartnerClientOverviewView overview={overview} />);
    fireEvent.click(screen.getByRole("button", { name: "Histórico completo" }));
    expect(screen.getByRole("heading", { name: "Histórico completo" })).toBeInTheDocument();

    cleanup();
    render(<PartnerClientOverviewView overview={overview} />);
    fireEvent.click(screen.getByRole("button", { name: /Alertas/i }));
    expect(screen.getByRole("heading", { name: "Alertas do Cliente" })).toBeInTheDocument();

    cleanup();
    render(<PartnerClientOverviewView overview={overview} />);
    fireEvent.click(screen.getByRole("button", { name: "Exportar PDF" }));
    expect(print).toHaveBeenCalled();
  });

  it("agenda consulta, cria tarefa e conclui tarefa com ações reais mockadas", async () => {
    render(<PartnerClientOverviewView overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: "Agendar consulta" }));
    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2026-07-10" } });
    fireEvent.change(screen.getByLabelText("Horário"), { target: { value: "10:30" } });
    fireEvent.click(screen.getByRole("button", { name: "Agendar" }));

    await waitFor(() => expect(createClientAppointment).toHaveBeenCalled());
    expect(createClientAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: overview.client.id,
        title: "Consulta de acompanhamento",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Tarefa" }));
    fireEvent.change(screen.getByLabelText("Tarefa"), { target: { value: "Revisar diário alimentar" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => expect(createClientTask).toHaveBeenCalled());
    expect(createClientTask).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: overview.client.id,
        title: "Revisar diário alimentar",
      }),
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Concluir tarefa" }));

    await waitFor(() => expect(setClientTaskCompleted).toHaveBeenCalled());
    expect(setClientTaskCompleted).toHaveBeenCalledWith({
      completed: true,
      patientId: overview.client.id,
      taskId: "task-1",
    });
  });
});
