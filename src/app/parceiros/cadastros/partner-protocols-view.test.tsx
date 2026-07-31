import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PartnerProtocolsData } from "@/lib/partners/protocols-metrics";

import {
  createPartnerProtocolFood,
  createPartnerProtocolUseDraft,
  importPartnerProtocolFoods,
  importSystemExercisesToPartner,
  importSystemFoodsToPartner,
} from "./actions";
import { PartnerProtocolsView } from "./partner-protocols-view";

const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("./actions", () => ({
  createPartnerProtocolExercise: vi.fn(),
  createPartnerProtocolFood: vi.fn(),
  createPartnerProtocolUseDraft: vi.fn(),
  importPartnerProtocolFoods: vi.fn(),
  importSystemExercisesToPartner: vi.fn(),
  importSystemFoodsToPartner: vi.fn(),
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
      systemExerciseId: null,
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
      systemFoodId: "system-food-1",
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
    systemExercises: 1,
    systemFoods: 2,
  },
  partner: { id: "partner-1", professionalName: "Antonio Ferrari", professionalType: "personal_trainer" },
  systemExercises: [
    {
      alreadyImported: false,
      description: null,
      equipment: "outros",
      equipmentLabel: "Não informado",
      gifUrl: "/storage/v1/object/public/system-exercise-media/exercise-library/EX-ABDOMINAL-BICICLETA/c3bddd30/preview.webp",
      id: "system-exercise-1",
      instructions: null,
      level: "intermediario",
      levelLabel: "Não informado",
      mediaFrameCount: 60,
      mediaHeight: 1080,
      mediaIsAnimated: true,
      mediaWidth: 1080,
      muscleGroup: "outros",
      muscleGroupLabel: "Não informado",
      name: "Abdominal bicicleta",
      posterUrl: "/storage/v1/object/public/system-exercise-media/exercise-library/EX-ABDOMINAL-BICICLETA/c3bddd30/poster.webp",
      previewUrl: "/storage/v1/object/public/system-exercise-media/exercise-library/EX-ABDOMINAL-BICICLETA/c3bddd30/preview.webp",
      secondaryMuscleGroups: [],
      slug: "abdominal-bicicleta",
      sourceChecksum: "c3bddd30f1253ee5dbf85d400675767241c9172d6273b50ae1623a0a1b187d48",
      sourceGifUrl: "/storage/v1/object/public/system-exercise-media/exercise-library/EX-ABDOMINAL-BICICLETA/c3bddd30/source.gif",
      sourceName: "Biblioteca oficial de exercícios",
      sourceVersion: "exercise-gifs-2026-07-31",
    },
  ],
  systemFoodCategories: ["Cereais e derivados"],
  systemFoodMacros: ["Carboidrato"],
  systemFoods: [
    {
      alreadyImported: true,
      carbsPerG: 0.281,
      carbsPer100g: 28.1,
      categoryTaco: "Cereais e derivados",
      energyKcalPerG: 1.28,
      energyKcalPer100g: 128,
      fatPerG: 0.002,
      fatPer100g: 0.2,
      fiberPerG: null,
      fiberPer100g: null,
      foodNumber: 1,
      id: "system-food-1",
      name: "Arroz branco cozido",
      partnerCategory: "cereal",
      predominantMacro: "Carboidrato",
      proteinPerG: 0.025,
      proteinPer100g: 2.5,
      sourceChecksum: "checksum",
      sourceName: "TACO 4a ed. (2011) - NEPA/UNICAMP",
      sourceVersion: "TACO 4a ed. (2011)",
    },
    {
      alreadyImported: false,
      carbsPerG: 0.2,
      carbsPer100g: 20,
      categoryTaco: "Cereais e derivados",
      energyKcalPerG: 0.86,
      energyKcalPer100g: 86,
      fatPerG: 0.001,
      fatPer100g: 0.1,
      fiberPerG: 0.03,
      fiberPer100g: 3,
      foodNumber: 2,
      id: "system-food-2",
      name: "Batata-doce cozida",
      partnerCategory: "cereal",
      predominantMacro: "Carboidrato",
      proteinPerG: 0.006,
      proteinPer100g: 0.6,
      sourceChecksum: "checksum",
      sourceName: "TACO 4a ed. (2011) - NEPA/UNICAMP",
      sourceVersion: "TACO 4a ed. (2011)",
    },
  ],
  topExercises: [],
  topFoods: [],
};

describe("PartnerProtocolsView", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: false,
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
      })),
    });
    vi.mocked(createPartnerProtocolFood).mockResolvedValue({ id: "food-2", ok: true, message: "Alimento salvo." });
    vi.mocked(createPartnerProtocolUseDraft).mockResolvedValue({ id: "draft-1", ok: true, message: "Uso registrado." });
    vi.mocked(importPartnerProtocolFoods).mockResolvedValue({ count: 1, ok: true, message: "Tabela importada." });
    vi.mocked(importSystemExercisesToPartner).mockResolvedValue({ imported: 1, ok: true, message: "Biblioteca de exercícios importada." });
    vi.mocked(importSystemFoodsToPartner).mockResolvedValue({ imported: 1, ok: true, message: "Biblioteca TACO importada." });
    refreshMock.mockClear();
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
    fireEvent.click(screen.getByRole("button", { name: "CSV/TSV" }));
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

  it("importa alimento selecionado da biblioteca TACO sem duplicar já importado", async () => {
    render(<PartnerProtocolsView data={data} />);

    fireEvent.click(screen.getByRole("button", { name: "Importar TACO" }));
    expect(screen.getByText("Já importado")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Buscar na biblioteca TACO"), { target: { value: "batata" } });
    fireEvent.click(screen.getByLabelText("Selecionar Batata-doce cozida"));
    fireEvent.click(screen.getByRole("button", { name: "Importar selecionados" }));

    await waitFor(() => expect(importSystemFoodsToPartner).toHaveBeenCalledWith(expect.objectContaining({
      foodIds: ["system-food-2"],
      importAll: false,
      query: "batata",
    })));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("mostra poster oficial, carrega preview sob demanda e importa exercício", async () => {
    render(<PartnerProtocolsView data={data} />);

    fireEvent.click(screen.getByRole("button", { name: "Exercícios oficiais" }));
    const mediaButton = screen.getByRole("button", { name: "Visualizar movimento de Abdominal bicicleta" });
    const poster = screen.getByTestId("exercise-media-system-exercise-1");
    expect(poster).toHaveAttribute("src", expect.stringContaining("poster.webp"));

    fireEvent.mouseEnter(mediaButton);
    await waitFor(() => expect(screen.getByTestId("exercise-media-system-exercise-1")).toHaveAttribute("src", expect.stringContaining("preview.webp")));

    fireEvent.click(screen.getByLabelText("Selecionar Abdominal bicicleta"));
    fireEvent.click(screen.getByRole("button", { name: "Importar selecionados" }));

    await waitFor(() => expect(importSystemExercisesToPartner).toHaveBeenCalledWith(expect.objectContaining({
      exerciseIds: ["system-exercise-1"],
      importAll: false,
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
