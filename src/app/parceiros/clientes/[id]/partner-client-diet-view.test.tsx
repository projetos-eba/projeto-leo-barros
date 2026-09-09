import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildPartnerClientDiet, type PartnerClientDietRawData } from "@/lib/partners/client-profile/diet";
import type { PartnerClientOverviewData } from "@/lib/partners/client-profile/overview";

import {
  addClientDietMealItem,
  createClientDietMealAlternative,
  createClientDietMeal,
  createClientDietPlan,
  duplicateClientDietPlan,
  publishClientDietPlan,
  removeClientDietMealItem,
  saveClientDietNotes,
  sendClientDietPlan,
  updateClientDietMealItem,
  updateClientDietPlanTargets,
} from "./_actions/diet";
import { PartnerClientDietView } from "./partner-client-diet-view";

const refresh = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("./_actions/diet", () => ({
  addClientDietMealItem: vi.fn(),
  archiveClientDietPlan: vi.fn(),
  createClientDietMealAlternative: vi.fn(),
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
    reviewOn: "2026-07-30",
    startsOn: "2026-06-20",
    status: "active",
    targetCarbsG: 240,
    targetFatG: 70,
    targetKcal: 2450,
    targetProteinG: 190,
    title: "Dieta de definição",
    updatedAt: "2026-07-01T12:00:00.000Z",
    version: 2,
    waterLiters: 3,
  },
  tracking: {
    dailyLogs: [
      { logDate: "2026-07-20", waterMl: 2250 },
      { logDate: "2026-07-19", waterMl: 1500 },
    ],
    events: [
      { createdAt: "2026-07-20T12:40:00.000Z", detail: "Refeição marcada como parcial.", eventType: "meal_partial", id: "client-event-1", logDate: "2026-07-20", mealId: "meal-1" },
    ],
    mealLogs: [
      {
        completedAt: "2026-07-20T12:40:00.000Z",
        id: "log-1",
        logDate: "2026-07-20",
        mealId: "meal-1",
        notes: "Almoço parcial por falta de apetite.",
        photoOriginalFilename: "almoco.webp",
        photoStoragePath: "ana/almoco.webp",
        status: "partial",
        updatedAt: "2026-07-20T12:45:00.000Z",
      },
    ],
    today: "2026-07-20",
  },
};

const diet = buildPartnerClientDiet(rawDiet);

describe("PartnerClientDietView", () => {
  beforeEach(() => {
    vi.mocked(addClientDietMealItem).mockResolvedValue({ ok: true });
    vi.mocked(createClientDietMealAlternative).mockResolvedValue({ id: "meal-option-new", ok: true });
    vi.mocked(createClientDietMeal).mockResolvedValue({ ok: true });
    vi.mocked(createClientDietPlan).mockResolvedValue({ ok: true });
    vi.mocked(duplicateClientDietPlan).mockResolvedValue({ id: "diet-copy", ok: true });
    vi.mocked(publishClientDietPlan).mockResolvedValue({ ok: true });
    vi.mocked(removeClientDietMealItem).mockResolvedValue({ ok: true });
    vi.mocked(saveClientDietNotes).mockResolvedValue({ ok: true });
    vi.mocked(sendClientDietPlan).mockResolvedValue({ ok: true });
    vi.mocked(updateClientDietMealItem).mockResolvedValue({ ok: true });
    vi.mocked(updateClientDietPlanTargets).mockResolvedValue({ ok: true });
    refresh.mockReset();
    push.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renderiza a aba Dietas fiel ao fluxo do Figma sem termos proibidos", () => {
    render(<PartnerClientDietView diet={diet} overview={overview} />);

    expect(screen.getByRole("heading", { name: "Ana Ribeiro" })).toBeInTheDocument();
    expect(screen.getByText("Dieta atual")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Balanço energético" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Macronutrientes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Distribuição calórica por refeição" })).toBeInTheDocument();
    expect(screen.getAllByText("GET estimado").length).toBeGreaterThan(0);
    expect(screen.getByText("A meta da dieta define o VET. Aplique o cálculo energético para definir o GET.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir Avaliações" })).toHaveAttribute("href", `/parceiros/clientes/${overview.client.id}?tab=avaliacoes`);
    expect(screen.getByText("Meta não definida")).toBeInTheDocument();
    expect(screen.getByText("Acompanhamento da execução")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Acompanhamento da execução/i })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Compatibilidade dos registros")).not.toBeInTheDocument();
    expect(screen.queryByText("Últimos registros do Cliente")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Acompanhamento da execução/i }));
    expect(screen.getByRole("button", { name: /Acompanhamento da execução/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Dados do Cliente")).toBeInTheDocument();
    expect(screen.getByText("Últimos registros do Cliente")).toBeInTheDocument();
    expect(screen.getAllByText("98 kcal").length).toBeGreaterThan(0);
    expect(screen.getByText("Parcial")).toBeInTheDocument();
    expect(screen.getByText("Água: 3 L")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plano alimentar" })).toBeInTheDocument();
    expect(screen.getByText("Adicionar alimentos")).toBeInTheDocument();
    expect(screen.getAllByText("Considerações sobre a dieta").length).toBeGreaterThan(0);
    expect(screen.queryByText("Pacientes")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cardio" })).toHaveAttribute("href", expect.stringContaining("tab=cardio"));
  });

  it("abre observação de registro em dialog sem alongar a lista", () => {
    render(<PartnerClientDietView diet={diet} overview={overview} />);

    expect(screen.queryByText("Almoço parcial por falta de apetite.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Acompanhamento da execução/i }));
    fireEvent.click(screen.getByRole("button", { name: "Ver nota" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Almoço parcial por falta de apetite.")).toBeInTheDocument();
  });

  it("atualiza o resumo quando a dieta recebida muda", () => {
    const configuredDiet = buildPartnerClientDiet({
      ...rawDiet,
      plan: { ...rawDiet.plan!, targetFiberMaxG: 30, targetFiberMinG: 25 },
    });
    const { rerender } = render(<PartnerClientDietView diet={{ ...configuredDiet, energy: { getKcal: 2420 } }} overview={overview} />);

    expect(screen.getByText(/Déficit/)).toBeInTheDocument();
    expect(screen.getByText("Meta 25–30 g")).toBeInTheDocument();
    expect(screen.getAllByText("195 kcal").length).toBeGreaterThan(0);

    const updatedDiet = buildPartnerClientDiet({
      ...rawDiet,
      plan: {
        ...rawDiet.plan!,
        meals: rawDiet.plan!.meals.map((meal) => ({
          ...meal,
          items: meal.items.map((item) => ({ ...item, quantity: 180 })),
        })),
        targetFiberMaxG: 30,
        targetFiberMinG: 25,
      },
    });
    rerender(<PartnerClientDietView diet={{ ...updatedDiet, energy: { getKcal: 2420 } }} overview={overview} />);

    expect(screen.getAllByText("234 kcal").length).toBeGreaterThan(0);
  });

  it("segue a alternativa selecionada no resumo", () => {
    const dietWithAlternative = buildPartnerClientDiet({
      ...rawDiet,
      plan: {
        ...rawDiet.plan!,
        meals: [
          ...rawDiet.plan!.meals,
          {
            ...rawDiet.plan!.meals[0]!,
            id: "meal-option-2",
            items: rawDiet.plan!.meals[0]!.items.map((item) => ({ ...item, quantity: 100 })),
            menuOption: 2,
            optionLabel: "Cardápio 2",
          },
        ],
      },
    });
    render(<PartnerClientDietView diet={{ ...dietWithAlternative, energy: { getKcal: 2420 } }} overview={overview} />);

    expect(screen.getAllByText("195 kcal").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Opções de Almoço" }));
    fireEvent.click(screen.getByRole("button", { name: "Almoço 2" }));
    expect(screen.getAllByText("130 kcal").length).toBeGreaterThan(0);
  });

  it("cria uma alternativa vazia a partir das opções da refeição", async () => {
    render(<PartnerClientDietView diet={diet} overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: "Opções de Almoço" }));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar opção" }));

    await waitFor(() => expect(createClientDietMealAlternative).toHaveBeenCalledWith({
      mealId: "meal-1",
      patientId: overview.client.id,
      planId: rawDiet.plan?.id,
    }));
  });

  it("oferece refeições pré-cadastradas e usa seletor nativo de horário ao adicionar uma refeição", async () => {
    render(<PartnerClientDietView diet={diet} overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: "Adicionar refeição" }));
    expect(screen.getByRole("option", { name: "Café da manhã" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Almoço" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Lanche da tarde" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ceia" })).toBeInTheDocument();
    expect(screen.getByLabelText("Horário da refeição")).toHaveAttribute("type", "time");

    fireEvent.change(screen.getByLabelText("Tipo de refeição"), { target: { value: "Ceia" } });
    fireEvent.change(screen.getByLabelText("Horário da refeição"), { target: { value: "21:30" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => expect(createClientDietMeal).toHaveBeenCalledWith(expect.objectContaining({
      mealTime: "21:30",
      patientId: overview.client.id,
      planId: rawDiet.plan?.id,
      title: "Ceia",
    })));
  });

  it("pagina alimentos e limita sugestões sem salvar durante a digitação", () => {
    const foods = Array.from({ length: 65 }, (_, id) => ({ ...diet.foods[0], id: `food-${id}`, name: `Pão ${id}`, searchText: `pão ${id}` }));
    render(<PartnerClientDietView overview={overview} diet={{ ...diet, foods, library: { ...diet.library, suggestions: foods } }} />);
    expect(screen.getAllByRole("button", { name: /^Adicionar Pão / })).toHaveLength(30);
    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(screen.getAllByRole("button", { name: /^Adicionar Pão / })).toHaveLength(60);
    fireEvent.change(screen.getByPlaceholderText("Buscar alimentos... (ex.: frango, arroz, whey)"), { target: { value: "pao 64" } });
    expect(screen.getAllByRole("button", { name: /^Adicionar Pão / })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar alimento" }));
    const input = screen.getByLabelText("Buscar alimento para Almoço");
    fireEvent.change(input, { target: { value: "pao" } });
    expect(screen.getAllByRole("button", { name: /à refeição Almoço$/ })).toHaveLength(6);
    expect(addClientDietMealItem).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByLabelText("Buscar alimento para Almoço")).not.toBeInTheDocument();
  });

  it("adiciona alimento sugerido e consome rascunho do Cadastro", async () => {
    render(<PartnerClientDietView diet={diet} overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: "Adicionar alimento" }));
    fireEvent.change(screen.getByLabelText("Buscar alimento para Almoço"), { target: { value: "frango" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar Peito de frango grelhado à refeição Almoço" }));

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
    render(<PartnerClientDietView diet={diet} overview={overview} />);

    fireEvent.change(screen.getByLabelText("Quantidade de Arroz branco cozido"), { target: { value: "180" } });
    fireEvent.blur(screen.getByLabelText("Quantidade de Arroz branco cozido"));
    await waitFor(() => expect(updateClientDietMealItem).toHaveBeenCalledWith({ itemId: "item-1", patientId: overview.client.id, planId: rawDiet.plan?.id, quantity: 180 }));

    fireEvent.change(screen.getByLabelText("Considerações sobre a dieta"), { target: { value: "Ajustar saladas conforme rotina." } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar considerações/i }));
    await waitFor(() => expect(saveClientDietNotes).toHaveBeenCalledWith({ notes: "Ajustar saladas conforme rotina.", patientId: overview.client.id, planId: rawDiet.plan?.id }));

    fireEvent.click(screen.getByRole("button", { name: "Mais ações" }));
    expect(screen.getByRole("button", { name: /Duplicar dieta/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Exportar PDF/i }).length).toBeGreaterThan(1);
    fireEvent.click(screen.getByRole("button", { name: /Duplicar dieta/i }));
    await waitFor(() => expect(duplicateClientDietPlan).toHaveBeenCalledWith({ patientId: overview.client.id, planId: rawDiet.plan?.id }));

    fireEvent.click(screen.getByRole("button", { name: /Ativar plano/i }));
    await waitFor(() => expect(publishClientDietPlan).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /Enviar aviso/i }));
    await waitFor(() => expect(sendClientDietPlan).toHaveBeenCalled());

  });

  it("permite selecionar e ativar um rascunho sem alterar o plano ativo", async () => {
    const draftPlanId = "e1000000-0000-4000-8000-000000000102";
    const draftDiet = buildPartnerClientDiet({
      ...rawDiet,
      plan: {
        ...rawDiet.plan!,
        id: draftPlanId,
        publishedAt: null,
        startsOn: null,
        status: "draft",
        title: "Dieta nova",
      },
      plans: [
        { createdAt: rawDiet.plan!.createdAt, id: rawDiet.plan!.id, status: "active", title: rawDiet.plan!.title, updatedAt: rawDiet.plan!.updatedAt },
        { createdAt: "2026-07-02T12:00:00.000Z", id: draftPlanId, status: "draft", title: "Dieta nova", updatedAt: "2026-07-02T12:00:00.000Z" },
      ],
    });

    render(<PartnerClientDietView diet={draftDiet} overview={overview} />);

    expect(screen.getByLabelText("Selecionar dieta")).toHaveValue(draftPlanId);
    expect(screen.getByText("Este rascunho ainda não está disponível ao Cliente.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Selecionar dieta"), { target: { value: rawDiet.plan!.id } });
    expect(push).toHaveBeenCalledWith(`/parceiros/clientes/${overview.client.id}?tab=dietas&plan=${rawDiet.plan!.id}`);

    fireEvent.click(screen.getByRole("button", { name: "Ativar plano" }));
    await waitFor(() => expect(publishClientDietPlan).toHaveBeenCalledWith({
      patientId: overview.client.id,
      planId: draftPlanId,
    }));
  });

  it("abre o rascunho recém-criado para edição", async () => {
    const draftPlanId = "e1000000-0000-4000-8000-000000000102";
    vi.mocked(createClientDietPlan).mockResolvedValue({ id: draftPlanId, ok: true });
    render(<PartnerClientDietView diet={diet} overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: "Nova dieta" }));
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Dieta do rascunho" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar dieta" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/parceiros/clientes/${overview.client.id}?tab=dietas&plan=${draftPlanId}`));
  });

  it("sincroniza a refeição de destino ao trocar para outro plano", async () => {
    const draftPlanId = "e1000000-0000-4000-8000-000000000102";
    const draftMealId = "meal-draft-1";
    const draftDiet = buildPartnerClientDiet({
      ...rawDiet,
      plan: {
        ...rawDiet.plan!,
        id: draftPlanId,
        meals: rawDiet.plan!.meals.map((meal) => ({ ...meal, id: draftMealId, items: [] })),
        publishedAt: null,
        startsOn: null,
        status: "draft",
        title: "Dieta nova",
      },
      plans: [
        { createdAt: rawDiet.plan!.createdAt, id: rawDiet.plan!.id, status: "active", title: rawDiet.plan!.title, updatedAt: rawDiet.plan!.updatedAt },
        { createdAt: "2026-07-02T12:00:00.000Z", id: draftPlanId, status: "draft", title: "Dieta nova", updatedAt: "2026-07-02T12:00:00.000Z" },
      ],
    });
    const { rerender } = render(<PartnerClientDietView diet={diet} overview={overview} />);

    rerender(<PartnerClientDietView diet={draftDiet} overview={overview} />);
    await waitFor(() => expect(screen.getByLabelText("Selecionar dieta")).toHaveValue(draftPlanId));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar Peito de frango grelhado" }));

    await waitFor(() => expect(addClientDietMealItem).toHaveBeenCalledWith(expect.objectContaining({
      mealId: draftMealId,
      planId: draftPlanId,
    })));
  });

  it("configura e salva o objetivo calórico do plano atual", async () => {
    render(<PartnerClientDietView diet={diet} overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: "Configurar objetivo calórico" }));
    const calorieSlider = screen.getByRole("slider", { name: "Selecionar meta calórica" });
    expect(calorieSlider).toHaveAttribute("min", "100");
    expect(calorieSlider).toHaveAttribute("max", "8000");
    fireEvent.change(calorieSlider, { target: { value: "2600" } });
    expect(screen.getByLabelText("Calorias do objetivo")).toHaveValue(2600);
    fireEvent.click(screen.getByRole("button", { name: /Salvar objetivo/i }));

    await waitFor(() => expect(updateClientDietPlanTargets).toHaveBeenCalledWith(expect.objectContaining({
      patientId: overview.client.id,
      planId: rawDiet.plan?.id,
      targetKcal: 2600,
    })));
  });
});
