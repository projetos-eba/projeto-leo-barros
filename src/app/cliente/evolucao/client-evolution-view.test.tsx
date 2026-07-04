import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { buildClientEvolution } from "@/lib/clients/evolution-metrics";
import type { ClientEvolutionRawData } from "@/lib/clients/evolution-metrics";

import { ClientEvolutionView } from "./client-evolution-view";

vi.mock("recharts", () => ({
  CartesianGrid: () => null,
  Line: () => null,
  LineChart: ({ children }: { children: ReactNode }) => <div data-testid="mock-line-chart">{children}</div>,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

vi.mock("@/components/workouts/muscle-map", () => ({
  WorkoutMuscleMap: ({ title }: { title: string }) => <section>{title}</section>,
}));

const evolution = buildClientEvolution({
  assessments: [
    { assessedAt: "2026-05-01T12:00:00.000Z", bodyFatPercentage: 18, bmi: 24.5, fatMassKg: 13.5, heightCm: 170, id: "a1", muscleMassKg: 45, title: "Inicial", weightKg: 78 },
    { assessedAt: "2026-06-01T12:00:00.000Z", bodyFatPercentage: 16, bmi: 24, fatMassKg: 12, heightCm: 170, id: "a2", muscleMassKg: 47, title: "Atual", weightKg: 76 },
  ],
  client: { avatarUrl: null, id: "client-1", name: "Ana Ribeiro", objective: "Hipertrofia" },
  generatedAt: "2026-06-02T12:00:00.000Z",
  nutrition: {
    logs: [{ consumedKcal: 2000, date: "2026-06-01", waterMl: 2200 }],
    plan: { calorieStrategy: "maintenance", id: "diet-1", targetCarbsG: 250, targetFatG: 60, targetKcal: 2000, targetProteinG: 140, title: "Plano", updatedAt: "2026-06-01T12:00:00.000Z", waterLiters: 2.5 },
  },
  period: { endDate: "2026-06-30", startDate: "2026-05-01" },
  photos: {
    comparisonNotes: [],
    events: [],
    generatedAt: "2026-06-02T12:00:00.000Z",
    partnerId: "partner-1",
    patientId: "client-1",
    sessions: [
      {
        capturedAt: "2026-05-01T10:00:00.000Z",
        createdAt: "2026-05-01T10:00:00.000Z",
        id: "photo-session-1",
        measurements: { armCm: 30, calfCm: 36, hipCm: 96, thighCm: 54, waistCm: 78, weightKg: 78 },
        notes: null,
        photos: [{ angle: "front", createdAt: "2026-05-01T10:00:00.000Z", cropData: {}, heightPx: 1200, id: "photo-1", mimeType: "image/png", originalFilename: "front.png", sizeBytes: 1000, storagePath: "partner/client/session/front.png", widthPx: 900 }],
        status: "complete",
        title: "Sessão inicial",
        updatedAt: "2026-05-01T10:00:00.000Z",
      },
    ],
  },
  workout: {
    program: { id: "program-1", sessions: [], status: "active", title: "Programa", updatedAt: "2026-06-01T12:00:00.000Z", version: 1 },
    sessions: [{ durationMinutes: 58, id: "w1", prescribedSessionId: "s1", status: "completed", totalVolumeKg: 1160, workoutDate: "2026-06-01" }],
    setLogs: [{ completedAt: "2026-06-01T12:00:00.000Z", loadKg: 40, reps: 10, status: "completed" }],
  },
} satisfies ClientEvolutionRawData);

describe("ClientEvolutionView", () => {
  it("renderiza as seções principais da página longa", () => {
    render(<ClientEvolutionView evolution={evolution} />);

    expect(screen.getByRole("heading", { name: "Minha Evolução" })).toBeInTheDocument();
    expect(screen.getAllByText("Peso atual").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Avaliação Antropométrica" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Métricas de Treinamento" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nutrição & Balanço energético" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Evolução Visual com Fotos" })).toBeInTheDocument();
    expect(screen.getByAltText("Depois Frente")).toHaveAttribute("src", "/cliente/evolucao/fotos/photo-1/arquivo");
  });

  it("permite alternar o ângulo da comparação de fotos e mostra estado vazio", () => {
    render(<ClientEvolutionView evolution={evolution} />);

    fireEvent.click(screen.getByRole("button", { name: "Costas" }));

    expect(screen.getAllByText("Ângulo indisponível.")).toHaveLength(2);
  });
});
