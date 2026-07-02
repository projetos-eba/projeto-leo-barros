import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PartnerClientWorkoutData } from "@/lib/partners/client-workout-metrics";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";

import {
  addClientWorkoutExercise,
  addClientWorkoutSet,
  combineClientWorkoutBiset,
} from "./actions";
import { PartnerClientWorkoutView } from "./partner-client-workout-view";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("./actions", () => ({
  addClientWorkoutExercise: vi.fn(),
  addClientWorkoutSet: vi.fn(),
  applyClientWorkoutTemplate: vi.fn(),
  combineClientWorkoutBiset: vi.fn(),
  createClientWorkoutProgram: vi.fn(),
  createClientWorkoutSession: vi.fn(),
  duplicateClientWorkoutProgram: vi.fn(),
  publishClientWorkoutProgram: vi.fn(),
  removeClientWorkoutExercise: vi.fn(),
  removeClientWorkoutSet: vi.fn(),
  reorderClientWorkoutExercises: vi.fn(),
  saveClientWorkoutNotes: vi.fn(),
  saveClientWorkoutTemplate: vi.fn(),
  sendClientWorkoutProgram: vi.fn(),
  updateClientWorkoutExercise: vi.fn(),
  updateClientWorkoutSet: vi.fn(),
  uncombineClientWorkoutBiset: vi.fn(),
}));

const overview = {
  client: {
    ageLabel: "29 anos", avatarUrl: null, birthDateLabel: "02/07/1997", email: "ana@example.invalid",
    genderLabel: "Feminino", id: "a1000000-0000-4000-8000-000000000301", initial: "A",
    name: "Ana Ribeiro", objectiveLabel: "Hipertrofia", phoneLabel: "+5511999999999",
    planPeriodLabel: "01/07/2026 - 01/08/2026", serviceScopes: ["treino"], statusLabel: "Ativo",
  },
} as PartnerClientOverviewData;

const workout: PartnerClientWorkoutData = {
  activeProgram: {
    createdAt: "2026-07-01T00:00:00Z",
    id: "e2000000-0000-4000-8000-000000000101",
    notes: "Priorizar técnica.",
    publishedAt: null,
    sentAt: null,
    sessions: [{
      durationMinutes: 60,
      exercises: [
        {
          bisetGroupId: null, bisetPosition: null, cadence: "2-0-2-0",
          exerciseId: "d1000000-0000-4000-8000-000000000202", id: "e2000000-0000-4000-8000-000000000301",
          muscleGroup: "peito", name: "Supino reto", notes: null, restSeconds: 90,
          secondaryMuscleGroups: ["triceps"], sets: [{ id: "e2000000-0000-4000-8000-000000000401", intensity: "moderate", loadKg: 50, reps: 10, setNumber: 1 }],
          sortOrder: 0, technique: "normal", thumbnailUrl: null, variationName: null,
        },
        {
          bisetGroupId: null, bisetPosition: null, cadence: null,
          exerciseId: "d1000000-0000-4000-8000-000000000205", id: "e2000000-0000-4000-8000-000000000302",
          muscleGroup: "ombros", name: "Desenvolvimento", notes: null, restSeconds: 90,
          secondaryMuscleGroups: ["triceps"], sets: [{ id: "e2000000-0000-4000-8000-000000000402", intensity: "moderate", loadKg: 20, reps: 10, setNumber: 1 }],
          sortOrder: 1, technique: "normal", thumbnailUrl: null, variationName: null,
        },
      ],
      frequencyPerWeek: 2,
      id: "e2000000-0000-4000-8000-000000000201",
      objective: "hipertrofia",
      sortOrder: 0,
      title: "Treino A",
      volumeKg: 700,
    }],
    status: "draft",
    title: "Programa",
    updatedAt: "2026-07-01T00:00:00Z",
    version: 1,
  },
  events: [],
  library: [{
    cadence: "2-0-2-0", defaultReps: "8-12", defaultSets: 4, equipment: "barra",
    id: "d1000000-0000-4000-8000-000000000203", muscleGroup: "costas", name: "Remada curvada",
    objective: "hipertrofia", restSeconds: 90, secondaryMuscleGroups: ["biceps"],
    thumbnailUrl: null, usageCount: 10, variations: ["Remada baixa"], videoUrl: null,
  }],
  programs: [],
  templates: [],
};

describe("PartnerClientWorkoutView", () => {
  beforeEach(() => {
    vi.mocked(addClientWorkoutExercise).mockResolvedValue({ ok: true });
    vi.mocked(addClientWorkoutSet).mockResolvedValue({ ok: true });
    vi.mocked(combineClientWorkoutBiset).mockResolvedValue({ ok: true });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renderiza editor, biblioteca e mapa muscular sem termos proibidos", () => {
    render(<PartnerClientWorkoutView overview={overview} workout={workout} />);
    expect(screen.getByText("Prescrição de Treinos")).toBeInTheDocument();
    expect(screen.getByText("Biblioteca de exercícios")).toBeInTheDocument();
    expect(screen.getByLabelText("Mapa muscular anterior")).toBeInTheDocument();
    expect(screen.queryByText("Pacientes")).not.toBeInTheDocument();
    expect(screen.queryByText("Cardio")).not.toBeInTheDocument();
  });

  it("adiciona exercício, sugere nova série e combina Bi-set", async () => {
    render(<PartnerClientWorkoutView overview={overview} workout={workout} />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar Remada curvada" }));
    await waitFor(() => expect(addClientWorkoutExercise).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Adicionar série a Supino reto" }));
    await waitFor(() => expect(addClientWorkoutSet).toHaveBeenCalledWith(expect.objectContaining({
      exerciseId: "e2000000-0000-4000-8000-000000000301",
    })));

    fireEvent.click(screen.getByLabelText("Selecionar Supino reto"));
    fireEvent.click(screen.getByLabelText("Selecionar Desenvolvimento"));
    fireEvent.click(screen.getByRole("button", { name: /Combinar Bi-set/i }));
    await waitFor(() => expect(combineClientWorkoutBiset).toHaveBeenCalled());
  });
});
