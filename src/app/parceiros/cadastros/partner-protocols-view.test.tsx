import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PartnerProtocolsData } from "@/lib/partners/protocols-metrics";

import {
  createPartnerProtocolFood,
  createPartnerProtocolUseDraft,
  importPartnerProtocolFoods,
} from "./actions";
import { PartnerProtocolsView } from "./partner-protocols-view";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("./actions", () => ({
  createPartnerProtocolExercise: vi.fn(),
  createPartnerProtocolFood: vi.fn(),
  createPartnerProtocolUseDraft: vi.fn(),
  importPartnerProtocolFoods: vi.fn(),
  setPartnerProtocolArchived: vi.fn(),
  updatePartnerProtocolExercise: vi.fn(),
  updatePartnerProtocolFood: vi.fn(),
}));

const data: PartnerProtocolsData = {
  clients: [{ displayName: "Ana Ribeiro", email: "ana@example.invalid", id: "client-1", status: "active" }],
  exercises: [
    {
      cadence: "2-0-2-0",
      defaultReps: "8-12",
      defaultSets: 4,
      equipment: "barra",
      equipmentLabel: "Barra",
      id: "exercise-1",
      instructions: "Manter postura.",
      level: "intermediario",
      levelLabel: "Intermediário",
      muscleGroup: "pernas",
      muscleGroupLabel: "Pernas",
      name: "Agachamento livre",
      objective: "forca",
      objectiveLabel: "Força",
      restSeconds: 90,
      status: "active",
      tags: ["base"],
      thumbnailUrl: null,
      updatedAt: "2026-07-01T10:00:00.000Z",
      usageCount: 42,
      variations: [],
      videoUrl: null,
    },
  ],
  foods: [
    {
      carbs: 28.1,
      category: "cereal",
      categoryLabel: "Cereal",
      fat: 0.2,
      fiber: 1.6,
      householdMeasure: "4 colheres",
      id: "food-1",
      kcal: 130,
      name: "Arroz branco cozido",
      notes: null,
      protein: 2.5,
      servingLabel: "100 g",
      servingSize: 100,
      servingUnit: "g",
      sodium: 1,
      source: "taco",
      sourceLabel: "TACO",
      status: "active",
      suggestedUses: ["refeicao_principal"],
      tags: ["almoço"],
      updatedAt: "2026-07-01T10:00:00.000Z",
      usageCount: 42,
    },
  ],
  metrics: {
    activeExercises: 1,
    activeFoods: 1,
    customFoods: 0,
    exerciseWithoutVideo: 1,
    foodWithoutCategory: 0,
    importedFoods: 1,
  },
  partner: { id: "partner-1", professionalName: "Antonio Ferrari", professionalType: "personal_trainer" },
  topExercises: [],
  topFoods: [],
};

describe("PartnerProtocolsView", () => {
  beforeEach(() => {
    vi.mocked(createPartnerProtocolFood).mockResolvedValue({ id: "food-2", ok: true, message: "Alimento salvo." });
    vi.mocked(createPartnerProtocolUseDraft).mockResolvedValue({ id: "draft-1", ok: true, message: "Uso registrado." });
    vi.mocked(importPartnerProtocolFoods).mockResolvedValue({ count: 1, ok: true, message: "Tabela importada." });
  });

  afterEach(() => {
    cleanup();
    document.body.removeAttribute("data-scroll-locked");
    document.body.style.pointerEvents = "";
    vi.restoreAllMocks();
  });

  it("renderiza Cadastro sem Pacientes ou Cardio e alterna para exercícios", () => {
    render(<PartnerProtocolsView data={data} />);

    expect(screen.getByRole("heading", { name: "Base de Protocolos" })).toBeInTheDocument();
    expect(screen.queryByText("Pacientes")).not.toBeInTheDocument();
    expect(screen.queryByText("Cardio")).not.toBeInTheDocument();
    expect(screen.getByText("Arroz branco cozido")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Biblioteca de Exercícios · 1" }));
    expect(screen.getByText("Agachamento livre")).toBeInTheDocument();
  });

  it("cria alimento e importa tabela de alimentos", async () => {
    render(<PartnerProtocolsView data={data} />);

    fireEvent.click(screen.getByRole("button", { name: "Novo alimento" }));
    fireEvent.change(screen.getByLabelText("Nome do alimento"), { target: { value: "Batata doce cozida" } });
    fireEvent.change(screen.getByLabelText("Kcal"), { target: { value: "86" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alimento" }));

    await waitFor(() => expect(createPartnerProtocolFood).toHaveBeenCalledWith(expect.objectContaining({
      kcal: 86,
      name: "Batata doce cozida",
    })));

    cleanup();
    render(<PartnerProtocolsView data={data} />);
    fireEvent.click(screen.getByRole("button", { name: "Importar base" }));
    fireEvent.change(screen.getByLabelText("Conteúdo da tabela"), {
      target: {
        value: "nome;categoria;origem;porcao;unidade;kcal;carboidratos;proteinas;gorduras;fibras;sodio\nAveia;cereal;taco;30;g;118;20;4.3;2.2;3;1",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Importar alimentos" }));

    await waitFor(() => expect(importPartnerProtocolFoods).toHaveBeenCalledWith(expect.objectContaining({
      rows: [expect.objectContaining({ name: "Aveia", protein_g: 4.3 })],
    })));
  });

  it("registra uso em plano para Cliente", async () => {
    render(<PartnerProtocolsView data={data} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Usar em plano" })[0]);
    fireEvent.change(screen.getByLabelText("Cliente"), { target: { value: "client-1" } });
    fireEvent.change(screen.getByLabelText("Observações"), { target: { value: "Usar no próximo ajuste." } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar uso" }));

    await waitFor(() => expect(createPartnerProtocolUseDraft).toHaveBeenCalledWith(expect.objectContaining({
      foodId: "food-1",
      itemType: "food",
      patientId: "client-1",
      planContext: "dieta",
    })));
  });
});
