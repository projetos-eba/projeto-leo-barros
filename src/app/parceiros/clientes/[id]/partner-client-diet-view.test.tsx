import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildPartnerClientDiet, type PartnerClientDietRawData } from "@/lib/partners/client-diet-metrics";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";

import {
  addClientDietMealItem,
  createClientDietMeal,
  createClientDietPlan,
  duplicateClientDietPlan,
  publishClientDietPlan,
  removeClientDietMealItem,
  saveClientDietNotes,
  sendClientDietPlan,
  updateClientDietMealItem,
  updateClientDietPlanTargets,
} from "./actions";
import { PartnerClientDietView } from "./partner-client-diet-view";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("./actions", () => ({
  addClientDietMealItem: vi.fn(),
  archiveClientDietPlan: vi.fn(),
  createClientDietMeal: vi.fn(),
  createClientDietPlan: vi.fn(),
  duplicateClientDietPlan: vi.fn(),
  publishClientDietPlan: vi.fn(),
  removeClientDietMeal: vi.fn(),
  removeClientDietMealItem: vi.fn(),
  saveClientDietNotes: vi.fn(),
  sendClientDietPlan: vi.fn(),
  updateClientDietMealItem: vi.fn(),
  updateClientDietPlanTargets: vi.fn(),
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
    birthDateLabel: "30/06/1997",
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
  generatedAt: "2026-07-01T12:00:00.000Z",
  history: [],
  nextAppointment: null,
  plan: null,
  recentRecords: [],
  tasks: [],
  weight: { delta: 1.2, target: 80, value: 78.4 },
};

const chicken = {
  carbsG: 0,
  category: "carne",
  fatG: 3.6,
  fiberG: 0,
  householdMeasure: "1 filé médio",
  id: "d1000000-0000-4000-8000-000000000102",
  kcal: 165,
  name: "Peito de frango grelhado",
  proteinG: 31,
  servingSize: 100,
  servingUnit: "g",
  sodiumMg: 74,
  source: "taco",
  suggestedUses: ["refeicao_principal"],
  tags: ["proteína"],
  updatedAt: "2026-07-01T12:00:00.000Z",
  usageCount: 96,
};

const rice = {
  carbsG: 28.1,
  category: "cereal",
  fatG: 0.2,
  fiberG: 1.6,
  householdMeasure: "4 colheres de sopa",
  id: "d1000000-0000-4000-8000-000000000101",
  kcal: 130,
  name: "Arroz branco cozido",
  proteinG: 2.5,
  servingSize: 100,
  servingUnit: "g",
  sodiumMg: 1,
  source: "taco",
  suggestedUses: ["refeicao_principal"],
  tags: ["carboidrato"],
  updatedAt: "2026-06-30T12:00:00.000Z",
  usageCount: 42,
};

const rawDiet: PartnerClientDietRawData = {
  drafts: [{ createdAt: "2026-07-01T12:00:00.000Z", food: chicken, id: "draft-1", notes: "Usar como proteína" }],
  events: [{ actorName: "Dr. Leo", createdAt: "2026-07-01T12:00:00.000Z", detail: "Dieta criada.", eventType: "created", id: "event-1", version: 1 }],
  foods: [chicken, rice],
  generatedAt: "2026-07-01T12:00:00.000Z",
  plan: {
    calorieStrategy: "surplus",
    createdAt: "2026-06-20T12:00:00.000Z",
    id: "e1000000-0000-4000-8000-000000000101",
    meals: [
      {
        dayOfWeek: 1,
        id: "meal-1",
        items: [
          {
            foodId: rice.id,
            householdMeasure: rice.householdMeasure,
            id: "item-1",
            quantity: 150,
            quantityUnit: "g",
            snapshotCarbsG: rice.carbsG,
            snapshotFatG: rice.fatG,
            snapshotFiberG: rice.fiberG,
            snapshotKcal: rice.kcal,
            snapshotName: rice.name,
            snapshotProteinG: rice.proteinG,
            snapshotServingSize: rice.servingSize,
            snapshotServingUnit: rice.servingUnit,
            snapshotSodiumMg: rice.sodiumMg,
            sortOrder: 0,
          },
        ],
        mealTime: "12:30",
        sortOrder: 0,
        title: "Almoço",
      },
    ],
    notes: "Manter hidratação adequada.",
    publishedAt: "2026-06-20T12:00:00.000Z",
    sentAt: null,
    status: "published",
    targetCarbsG: 240,
    targetFatG: 70,
    targetKcal: 2450,
    targetProteinG: 190,
    title: "Dieta de definição",
    updatedAt: "2026-07-01T12:00:00.000Z",
    version: 2,
    waterLiters: 3,
  },
};

const diet = buildPartnerClientDiet(rawDiet);

describe("PartnerClientDietView", () => {
  beforeEach(() => {
    vi.mocked(addClientDietMealItem).mockResolvedValue({ ok: true });
    vi.mocked(createClientDietMeal).mockResolvedValue({ ok: true });
    vi.mocked(createClientDietPlan).mockResolvedValue({ ok: true });
    vi.mocked(duplicateClientDietPlan).mockResolvedValue({ ok: true });
    vi.mocked(publishClientDietPlan).mockResolvedValue({ ok: true });
    vi.mocked(removeClientDietMealItem).mockResolvedValue({ ok: true });
    vi.mocked(saveClientDietNotes).mockResolvedValue({ ok: true });
    vi.mocked(sendClientDietPlan).mockResolvedValue({ ok: true });
    vi.mocked(updateClientDietMealItem).mockResolvedValue({ ok: true });
    vi.mocked(updateClientDietPlanTargets).mockResolvedValue({ ok: true });
    refresh.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renderiza a aba Dietas fiel ao fluxo do Figma sem termos proibidos", () => {
    render(<PartnerClientDietView diet={diet} overview={overview} />);

    expect(screen.getByRole("heading", { name: "Ana Ribeiro" })).toBeInTheDocument();
    expect(screen.getByText("Dieta atual")).toBeInTheDocument();
    expect(screen.getByText("Resumo geral")).toBeInTheDocument();
    expect(screen.getByText("Água")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plano alimentar" })).toBeInTheDocument();
    expect(screen.getByText("Adicionar alimentos")).toBeInTheDocument();
    expect(screen.getAllByText("Considerações sobre a dieta").length).toBeGreaterThan(0);
    expect(screen.queryByText("Pacientes")).not.toBeInTheDocument();
    expect(screen.queryByText("Cardio")).not.toBeInTheDocument();
  });

  it("adiciona alimento sugerido e consome rascunho do Cadastro", async () => {
    render(<PartnerClientDietView diet={diet} overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: "Adicionar Peito de frango grelhado" }));

    await waitFor(() => expect(addClientDietMealItem).toHaveBeenCalledWith({
      draftId: "draft-1",
      foodId: chicken.id,
      mealId: "meal-1",
      patientId: overview.client.id,
      planId: rawDiet.plan?.id,
      quantity: 100,
    }));
  });

  it("edita porção, salva considerações e executa ações do plano", async () => {
    const print = vi.fn();
    Object.defineProperty(window, "print", { configurable: true, value: print });

    render(<PartnerClientDietView diet={diet} overview={overview} />);

    fireEvent.change(screen.getByLabelText("Quantidade de Arroz branco cozido"), { target: { value: "180" } });
    fireEvent.blur(screen.getByLabelText("Quantidade de Arroz branco cozido"));
    await waitFor(() => expect(updateClientDietMealItem).toHaveBeenCalledWith({ itemId: "item-1", patientId: overview.client.id, planId: rawDiet.plan?.id, quantity: 180 }));

    fireEvent.change(screen.getByLabelText("Considerações sobre a dieta"), { target: { value: "Ajustar saladas conforme rotina." } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar considerações/i }));
    await waitFor(() => expect(saveClientDietNotes).toHaveBeenCalledWith({ notes: "Ajustar saladas conforme rotina.", patientId: overview.client.id, planId: rawDiet.plan?.id }));

    fireEvent.click(screen.getByRole("button", { name: /Duplicar/i }));
    await waitFor(() => expect(duplicateClientDietPlan).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /Publicar/i }));
    await waitFor(() => expect(publishClientDietPlan).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /Enviar ao Cliente/i }));
    await waitFor(() => expect(sendClientDietPlan).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /Exportar PDF/i }));
    expect(print).toHaveBeenCalled();
  });

  it("configura e salva o objetivo calórico do plano atual", async () => {
    render(<PartnerClientDietView diet={diet} overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: "Configurar objetivo calórico" }));
    fireEvent.change(screen.getByLabelText("Calorias do objetivo"), { target: { value: "2600" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar objetivo/i }));

    await waitFor(() => expect(updateClientDietPlanTargets).toHaveBeenCalledWith(expect.objectContaining({
      patientId: overview.client.id,
      planId: rawDiet.plan?.id,
      targetKcal: 2600,
    })));
  });
});
