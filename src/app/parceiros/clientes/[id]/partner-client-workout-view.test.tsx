import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PartnerClientWorkoutData } from "@/lib/partners/client-workout-metrics";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";

import {
  addClientWorkoutExercise,
  addClientWorkoutSet,
  combineClientWorkoutBiset,
  deleteClientWorkoutSession,
  reorderClientWorkoutExercises,
  updateClientWorkoutSession,
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
  deleteClientWorkoutSession: vi.fn(),
  duplicateClientWorkoutProgram: vi.fn(),
  publishClientWorkoutProgram: vi.fn(),
  removeClientWorkoutExercise: vi.fn(),
  removeClientWorkoutSet: vi.fn(),
  reorderClientWorkoutExercises: vi.fn(),
  saveClientWorkoutNotes: vi.fn(),
  saveClientWorkoutTemplate: vi.fn(),
  sendClientWorkoutProgram: vi.fn(),
  updateClientWorkoutExercise: vi.fn(),
  updateClientWorkoutSession: vi.fn(),
  updateClientWorkoutSet: vi.fn(),
  uncombineClientWorkoutBiset: vi.fn(),
}));

const overview = {
  client: {
    ageLabel: "29 anos", avatarUrl: null, birthDateLabel: "02/07/1997", email: "ana@example.invalid",
    biologicalSexLabel: "Feminino", id: "a1000000-0000-4000-8000-000000000301", initial: "A",
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
  execution: {
    bestLoadKg: 60,
    completedMinutes: 65,
    completedSessions: 1,
    completionPercent: 50,
    partialSessions: 1,
    recentSessions: [
      {
        bestLoadKg: 60,
        dateLabel: "qui., 02/07",
        durationMinutes: 65,
        exerciseCompletionPercent: 100,
        exercisesDone: 2,
        id: "client-session-1",
        prescribedExercises: 2,
        prescribedSets: 4,
        sessionTitle: "Treino A · Peito e Tríceps",
        setCompletionPercent: 100,
        setsDone: 4,
        skippedExercises: 0,
        status: "completed",
        statusLabel: "Concluído",
        totalVolumeKg: 1200,
      },
      {
        bestLoadKg: 0,
        dateLabel: "sex., 03/07",
        durationMinutes: 0,
        exerciseCompletionPercent: 0,
        exercisesDone: 0,
        id: "client-session-2",
        prescribedExercises: 1,
        prescribedSets: 2,
        sessionTitle: "Treino A · Peito e Tríceps",
        setCompletionPercent: 0,
        setsDone: 0,
        skippedExercises: 1,
        status: "partial",
        statusLabel: "Parcial",
        totalVolumeKg: 0,
      },
    ],
    skippedExercises: 1,
    skippedTop: [{ count: 1, name: "Desenvolvimento" }],
    totalSessions: 2,
    totalVolumeKg: 1200,
  },
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
    vi.mocked(deleteClientWorkoutSession).mockResolvedValue({ ok: true });
    vi.mocked(reorderClientWorkoutExercises).mockResolvedValue({ ok: true });
    vi.mocked(updateClientWorkoutSession).mockResolvedValue({ ok: true });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renderiza editor, biblioteca e mapa muscular sem termos proibidos", () => {
    render(<PartnerClientWorkoutView overview={overview} workout={workout} />);
    expect(screen.getByText("Prescrição de Treinos")).toBeInTheDocument();
    expect(screen.getByText("Biblioteca de exercícios")).toBeInTheDocument();
    expect(screen.getByText("Acompanhamento real")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Acompanhamento real/i })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Volume realizado")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Acompanhamento real/i }));
    expect(screen.getByText("Volume realizado")).toBeInTheDocument();
    expect(screen.getAllByText("Desenvolvimento").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tipo de treino").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Peito e Tríceps").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Mapa muscular anterior")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Selecionar Supino reto/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Pacientes")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cardio" })).toHaveAttribute("href", expect.stringContaining("tab=cardio"));
  });

  it("adiciona exercício, sugere nova série e combina Bi-set", async () => {
    render(<PartnerClientWorkoutView overview={overview} workout={workout} />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar exercício" }));
    fireEvent.change(screen.getByLabelText("Buscar exercício para Treino A"), { target: { value: "remada" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar Remada curvada ao Treino A" }));
    await waitFor(() => expect(addClientWorkoutExercise).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Criar série 2 para Supino reto" }));
    await waitFor(() => expect(addClientWorkoutSet).toHaveBeenCalledWith(expect.objectContaining({
      exerciseId: "e2000000-0000-4000-8000-000000000301",
    })));

    fireEvent.click(screen.getByRole("button", { name: "Selecionar Supino reto para Bi-set" }));
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Desenvolvimento para Bi-set" }));
    fireEvent.click(screen.getByRole("button", { name: /Combinar Bi-set/i }));
    await waitFor(() => expect(combineClientWorkoutBiset).toHaveBeenCalled());
  });

  it("reordena exercícios pelos controles de subir e descer", async () => {
    render(<PartnerClientWorkoutView overview={overview} workout={workout} />);
    fireEvent.click(screen.getByRole("button", { name: "Subir Desenvolvimento" }));
    await waitFor(() => expect(reorderClientWorkoutExercises).toHaveBeenCalledWith(expect.objectContaining({
      exerciseIds: [
        "e2000000-0000-4000-8000-000000000302",
        "e2000000-0000-4000-8000-000000000301",
      ],
    })));
  });

  it("edita e exclui divisão pelos três pontinhos", async () => {
    const workoutWithTwoSessions: PartnerClientWorkoutData = {
      ...workout,
      activeProgram: workout.activeProgram ? {
        ...workout.activeProgram,
        sessions: [
          ...workout.activeProgram.sessions,
          {
            durationMinutes: 50,
            exercises: [],
            frequencyPerWeek: 1,
            id: "e2000000-0000-4000-8000-000000000202",
            objective: "forca",
            sortOrder: 1,
            title: "Treino B",
            volumeKg: 0,
          },
        ],
      } : null,
    };
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<PartnerClientWorkoutView overview={overview} workout={workoutWithTwoSessions} />);

    fireEvent.click(screen.getByRole("button", { name: "Abrir ações de Treino A" }));
    fireEvent.click(screen.getByRole("button", { name: "Editar divisão" }));
    fireEvent.change(screen.getByLabelText("Nome da divisão"), { target: { value: "Treino Push" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar divisão" }));
    await waitFor(() => expect(updateClientWorkoutSession).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: "e2000000-0000-4000-8000-000000000201",
      title: "Treino Push",
    })));

    fireEvent.click(screen.getByRole("button", { name: "Abrir ações de Treino A" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir divisão" }));
    await waitFor(() => expect(deleteClientWorkoutSession).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: "e2000000-0000-4000-8000-000000000201",
    })));
  });
});
