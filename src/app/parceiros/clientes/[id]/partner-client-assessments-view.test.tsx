import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PartnerClientAssessmentsData } from "@/lib/partners/client-assessments-metrics";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";

import {
  applyClientCalorieCalculation,
  completePartnerClientProfile,
  saveClientAssessment,
  saveClientCalorieCalculation,
} from "./actions";
import { PartnerClientAssessmentsView } from "./partner-client-assessments-view";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("recharts", () => ({
  CartesianGrid: () => <g />,
  Line: () => <g />,
  LineChart: ({ children }: { children: ReactNode }) => <div data-testid="mock-line-chart">{children}</div>,
  PolarAngleAxis: () => <g />,
  PolarGrid: () => <g />,
  PolarRadiusAxis: () => <g />,
  Radar: () => <g />,
  RadarChart: ({ children }: { children: ReactNode }) => <div data-testid="mock-radar-chart">{children}</div>,
  Tooltip: () => <g />,
  XAxis: () => <g />,
  YAxis: () => <g />,
}));

vi.mock("./actions", () => ({
  applyClientCalorieCalculation: vi.fn(),
  completePartnerClientProfile: vi.fn(),
  saveClientAssessment: vi.fn(),
  saveClientCalorieCalculation: vi.fn(),
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

const assessments: PartnerClientAssessmentsData = {
  calculations: [],
  calorie: {
    comparison: [
      {
        activityFactor: 1.55,
        activityLabel: "Moderadamente ativo - exercicio 3-5x por semana",
        bmrKcal: 1566,
        dailyEnergyDeltaKcal: 137,
        formula: "mifflin",
        formulaLabel: "Mifflin-St Jeor",
        projectedWeightDeltaKg: 1.6,
        strategyLabel: "Superávit calórico",
        targetDays: 90,
        targetKcal: 2564,
        targetWeightKg: 80,
        tdeeKcal: 2427,
        weeklyEnergyDeltaKcal: 959,
      },
      {
        activityFactor: 1.55,
        activityLabel: "Moderadamente ativo - exercicio 3-5x por semana",
        bmrKcal: 1972,
        dailyEnergyDeltaKcal: 137,
        formula: "cunningham",
        formulaLabel: "Cunningham",
        projectedWeightDeltaKg: 1.6,
        strategyLabel: "Superávit calórico",
        targetDays: 90,
        targetKcal: 3194,
        targetWeightKg: 80,
        tdeeKcal: 3057,
        weeklyEnergyDeltaKcal: 959,
      },
    ],
    latestApplied: null,
    projection: [
      { day: 0, goalKcal: 2564, maintenanceKcal: 2427, weightKg: 78.4 },
      { day: 90, goalKcal: 2588, maintenanceKcal: 2451, weightKg: 80 },
    ],
    selected: {
      activityFactor: 1.55,
      activityLabel: "Moderadamente ativo - exercicio 3-5x por semana",
      bmrKcal: 1566,
      dailyEnergyDeltaKcal: 137,
      formula: "mifflin",
      formulaLabel: "Mifflin-St Jeor",
      projectedWeightDeltaKg: 1.6,
      strategyLabel: "Superávit calórico",
      targetDays: 90,
      targetKcal: 2564,
      targetWeightKg: 80,
      tdeeKcal: 2427,
      weeklyEnergyDeltaKcal: 959,
    },
  },
  charts: {
    compositionSeries: [
      { bodyFatPercentage: 18, date: "01/04/2026", fatMassKg: 13.7, ffmi: 20.6, leanMassKg: 62.3, muscleMassKg: 60, sumSkinfoldsMm: 32, weightKg: 76 },
      { bodyFatPercentage: 14.7, date: "01/06/2026", fatMassKg: 11.5, ffmi: 22.1, leanMassKg: 66.9, muscleMassKg: 62.1, sumSkinfoldsMm: 26.6, weightKg: 78.4 },
    ],
    circumferenceSeries: [
      { chest: 92, date: "01/04/2026", waist: 78 },
      { chest: 94, date: "01/06/2026", waist: 73 },
    ],
    skinfoldSeries: [
      { abdominal: 18, date: "01/04/2026", triceps: 14 },
      { abdominal: 14.7, date: "01/06/2026", triceps: 11.9 },
    ],
  },
  client: {
    age: 29,
    biologicalSex: "female",
    birthDate: "1997-06-30",
    gender: "female",
    id: "a1000000-0000-4000-8000-000000000301",
    name: "Ana Ribeiro",
    objective: "Hipertrofia",
  },
  formulaEligibility: {
    cunningham: { reason: null, status: "available" },
    harris_benedict: { reason: null, status: "available" },
    mifflin: { reason: null, status: "available" },
    tinsley: { reason: null, status: "available" },
  },
  circumferences: {
    availableMetrics: [
      { key: "chest", label: "Tórax" },
      { key: "waist", label: "Cintura" },
    ],
    latest: [
      { delta: 2, key: "chest", label: "Tórax", valueCm: 94 },
      { delta: -5, key: "waist", label: "Cintura", valueCm: 73 },
    ],
  },
  skinfolds: {
    availableMetrics: [
      { key: "abdominal", label: "Abdominal", region: "Tronco" },
      { key: "triceps", label: "Tricipital", region: "Membros superiores" },
    ],
    latest: [
      { delta: -3.3, key: "abdominal", label: "Abdominal", region: "Tronco", valueMm: 14.7 },
      { delta: -2.1, key: "triceps", label: "Tricipital", region: "Membros superiores", valueMm: 11.9 },
    ],
  },
  generatedAt: "2026-07-01T12:00:00.000Z",
  history: [
    {
      assessmentMethod: "jackson_pollock_7",
      assessedAt: "2026-06-01T12:00:00.000Z",
      bmi: 25.9,
      bmiClassification: "Sobrepeso",
      bodyFatPercentage: 14.7,
      dateLabel: "01/06/2026",
      fatMassKg: 11.5,
      ffmi: 22.1,
      heightCm: 174,
      id: "assessment-1",
      leanMassKg: 66.9,
      notes: "Evolução consistente.",
      sumSkinfoldsMm: 26.6,
      targetDays: 90,
      targetWeightKg: 80,
      title: "Avaliação corporal completa",
      weightKg: 78.4,
    },
  ],
  kpis: {
    bmi: { classification: "Sobrepeso", delta: 0.2, helper: "Sobrepeso", label: "IMC", value: 25.9 },
    bodyFat: { delta: -1.1, helper: "Meta 12-15%", label: "% Gordura", value: 14.7 },
    ffmi: { delta: 1.5, helper: "Massa livre de gordura/altura", label: "FFMI", value: 22.1 },
    lastAssessment: { dateLabel: "01/06/2026", daysAgoLabel: "há 30 dias", value: "01/06/2026" },
    leanMass: { delta: 1.6, helper: "Peso sem massa gorda", label: "Massa magra", value: 66.9 },
    muscleMass: { delta: 0.5, helper: "Informada na avaliação", label: "Massa muscular", value: 62.1 },
    weight: { delta: 1.2, helper: "Meta 80 kg", label: "Peso atual", value: 78.4 },
  },
  latestAssessment: {
    activityLevel: "moderate",
    assessmentMethod: "jackson_pollock_7",
    assessedAt: "2026-06-01T12:00:00.000Z",
    bmi: 25.9,
    bmiClassification: "Sobrepeso",
    bodyFatPercentage: 14.7,
    calculations: [],
    circumferences: [
      { id: "c1", label: "Tórax", metricKey: "chest", valueCm: 94 },
      { id: "c2", label: "Cintura", metricKey: "waist", valueCm: 73 },
    ],
    fatMassKg: 11.5,
    ffmi: 22.1,
    heightCm: 174,
    id: "assessment-1",
    leanMassKg: 66.9,
    muscleMassKg: 62.1,
    notes: "Evolução consistente.",
    skinfolds: [
      { id: "s1", label: "Abdominal", metricKey: "abdominal", region: "Tronco", valueMm: 14.7 },
      { id: "s2", label: "Tricipital", metricKey: "triceps", region: "Membros superiores", valueMm: 11.9 },
    ],
    sumSkinfoldsMm: 26.6,
    targetDays: 90,
    targetWeightKg: 80,
    title: "Avaliação corporal completa",
    weightKg: 78.4,
  },
  records: [
    {
      activityLevel: "moderate",
      assessmentMethod: "jackson_pollock_7",
      assessedAt: "2026-06-01T12:00:00.000Z",
      bmi: 25.9,
      bmiClassification: "Sobrepeso",
      bodyFatPercentage: 14.7,
      calculations: [],
      circumferences: [
        { id: "c1", label: "Tórax", metricKey: "chest", valueCm: 94 },
        { id: "c2", label: "Cintura", metricKey: "waist", valueCm: 73 },
      ],
      fatMassKg: 11.5,
      ffmi: 22.1,
      heightCm: 174,
      id: "assessment-1",
      leanMassKg: 66.9,
      muscleMassKg: 62.1,
      notes: "Evolução consistente.",
      skinfolds: [
        { id: "s1", label: "Abdominal", metricKey: "abdominal", region: "Tronco", valueMm: 14.7 },
        { id: "s2", label: "Tricipital", metricKey: "triceps", region: "Membros superiores", valueMm: 11.9 },
      ],
      sumSkinfoldsMm: 26.6,
      targetDays: 90,
      targetWeightKg: 80,
      title: "Avaliação corporal completa",
      weightKg: 78.4,
    },
  ],
};

describe("PartnerClientAssessmentsView", () => {
  beforeEach(() => {
    vi.mocked(saveClientAssessment).mockResolvedValue({ ok: true });
    vi.mocked(saveClientCalorieCalculation).mockResolvedValue({ id: "calc-new", ok: true });
    vi.mocked(applyClientCalorieCalculation).mockResolvedValue({ ok: true });
    vi.mocked(completePartnerClientProfile).mockResolvedValue({ ok: true });
    refresh.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renderiza a aba técnica sem termos proibidos", () => {
    render(<PartnerClientAssessmentsView assessments={assessments} overview={overview} />);

    expect(screen.getByRole("heading", { name: "Ana Ribeiro" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Avaliações" })).toHaveAttribute("href", expect.stringContaining("tab=avaliacoes"));
    expect(screen.getByText("Cálculo Calórico")).toBeInTheDocument();
    expect(screen.getByText("Avaliação Física")).toBeInTheDocument();
    expect(screen.getByText("Análise Gráfica da Avaliação")).toBeInTheDocument();
    expect(screen.getByText("Histórico de Avaliações")).toBeInTheDocument();
    expect(screen.getAllByText("7 dobras Jackson, Pollock & Ward").length).toBeGreaterThan(0);
    expect(screen.getByRole("columnheader", { name: "FFMI" })).toBeInTheDocument();
    expect(screen.queryByText("Prontidão da avaliação")).not.toBeInTheDocument();
    expect(screen.queryByText("Pacientes")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cardio" })).toHaveAttribute("href", expect.stringContaining("tab=cardio"));
  });

  it("edita a bio do Cliente pelo cabeçalho", async () => {
    render(<PartnerClientAssessmentsView assessments={assessments} overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar bio" }));
    fireEvent.change(screen.getByLabelText("Objetivo principal"), { target: { value: "Recomposição corporal" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar bio" }));

    await waitFor(() => expect(completePartnerClientProfile).toHaveBeenCalledWith({
      biologicalSex: "female",
      birthDate: "1997-06-30",
      objective: "Recomposição corporal",
      patientId: overview.client.id,
    }));
  });

  it("salva e aplica cálculo calórico", async () => {
    render(<PartnerClientAssessmentsView assessments={assessments} overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: /Salvar cálculo/i }));
    await waitFor(() => expect(saveClientCalorieCalculation).toHaveBeenCalledWith(expect.objectContaining({
      formula: "mifflin",
      patientId: overview.client.id,
      targetKcal: 2564,
    })));

    fireEvent.click(screen.getByRole("button", { name: /Aplicar ao plano/i }));
    await waitFor(() => expect(applyClientCalorieCalculation).toHaveBeenCalledWith({
      calculationId: "calc-new",
      patientId: overview.client.id,
    }));
  });

  it("recalcula e salva parâmetros editados sem alterar a avaliação", async () => {
    render(<PartnerClientAssessmentsView assessments={assessments} overview={overview} />);

    fireEvent.change(screen.getByLabelText("Altura (cm)"), { target: { value: "175" } });
    fireEvent.change(screen.getByLabelText("Peso atual (kg)"), { target: { value: "90" } });
    fireEvent.change(screen.getByLabelText("Peso meta (kg)"), { target: { value: "80" } });
    fireEvent.change(screen.getByLabelText("Fator de atividade"), { target: { value: "sedentary" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar cálculo/i }));

    await waitFor(() => expect(saveClientCalorieCalculation).toHaveBeenCalledWith(expect.objectContaining({
      inputs: expect.objectContaining({
        activityLevel: "sedentary",
        heightCm: 175,
        targetWeightKg: 80,
        weightKg: 90,
      }),
      patientId: overview.client.id,
    })));
    expect(assessments.latestAssessment?.heightCm).toBe(174);
    expect(assessments.latestAssessment?.weightKg).toBe(78.4);
  });

  it("abre drawer de nova avaliação e salva dados", async () => {
    render(<PartnerClientAssessmentsView assessments={assessments} overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: "Registrar dados" }));
    fireEvent.change(screen.getByLabelText("Método de avaliação física"), { target: { value: "guedes_3" } });
    fireEvent.change(screen.getByLabelText("Peso (kg)"), { target: { value: "79" } });
    fireEvent.change(screen.getByLabelText("Suprailíaca (mm)"), { target: { value: "13" } });
    fireEvent.change(screen.getByLabelText("Abdominal (mm)"), { target: { value: "14" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar avaliação" }));

    await waitFor(() => expect(saveClientAssessment).toHaveBeenCalledWith(expect.objectContaining({
      patientId: overview.client.id,
      assessmentMethod: "guedes_3",
      bodyFatPercentage: expect.any(Number),
      skinfolds: expect.arrayContaining([expect.objectContaining({ metricKey: "abdominal", valueMm: 14 })]),
      weightKg: 79,
    })));
  }, 40000);

  it("visualiza e edita uma avaliação do histórico", async () => {
    render(<PartnerClientAssessmentsView assessments={assessments} overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: "Visualizar avaliação 01/06/2026" }));
    expect(screen.getByRole("heading", { name: "Avaliação corporal completa" })).toBeInTheDocument();
    expect(screen.getByText("Evolução consistente.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Editar avaliação" }));
    fireEvent.change(screen.getByLabelText("Peso (kg)"), { target: { value: "80" } });
    fireEvent.click(screen.getByRole("button", { name: "Atualizar avaliação" }));

    await waitFor(() => expect(saveClientAssessment).toHaveBeenCalledWith(expect.objectContaining({
      assessmentId: "assessment-1",
      patientId: overview.client.id,
      weightKg: 80,
    })));
  });
});
