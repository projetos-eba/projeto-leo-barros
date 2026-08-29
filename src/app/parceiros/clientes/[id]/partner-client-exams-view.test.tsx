import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildPartnerClientExams, type PartnerClientExamsRawData } from "@/lib/partners/client-profile/exams";
import type { PartnerClientOverviewData } from "@/lib/partners/client-profile/overview";

import {
  archivePartnerExamDefinition,
  removeClientExamCollection,
  saveClientExamCollection,
  savePartnerExamDefinition,
} from "./_actions/exams";
import { ExamChartTooltip, PartnerClientExamsView } from "./partner-client-exams-view";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("./_actions/exams", () => ({
  archivePartnerExamDefinition: vi.fn(),
  removeClientExamCollection: vi.fn(),
  saveClientExamCollection: vi.fn(),
  savePartnerExamDefinition: vi.fn(),
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
  generatedAt: "2026-07-02T12:00:00.000Z",
  history: [],
  nextAppointment: null,
  plan: null,
  recentRecords: [],
  tasks: [],
  weight: { delta: 1.2, target: 80, value: 78.4 },
};

const raw: PartnerClientExamsRawData = {
  categories: [
    { iconKey: "droplet", id: "b3000000-0000-4000-8000-000000000001", name: "Perfil lipídico", slug: "perfil_lipidico", sortOrder: 1, status: "active" },
  ],
  collections: [
    {
      collectedAt: "2026-07-01",
      createdAt: "2026-07-01T12:00:00.000Z",
      id: "b3000000-0000-4000-8000-000000000101",
      notes: null,
      results: [
        {
          collectionId: "b3000000-0000-4000-8000-000000000101",
          conversionFactorFromDefault: null,
          defaultUnit: "mg/dL",
          examId: "b3000000-0000-4000-8000-000000000201",
          id: "b3000000-0000-4000-8000-000000000301",
          inputUnit: "mg/dL",
          inputValue: 108,
          notes: null,
          referenceHigh: 100,
          referenceLow: 0,
          referenceSex: "unisex",
          snapshotCategoryName: "Perfil lipídico",
          snapshotCategorySlug: "perfil_lipidico",
          snapshotExamName: "LDL-colesterol",
          snapshotExamSlug: "ldl_colesterol",
          status: "high",
          valueDefault: 108,
        },
      ],
      status: "saved",
      title: "Atual",
      updatedAt: "2026-07-01T12:00:00.000Z",
    },
    {
      collectedAt: "2026-06-01",
      createdAt: "2026-06-01T12:00:00.000Z",
      id: "b3000000-0000-4000-8000-000000000102",
      notes: null,
      results: [
        {
          collectionId: "b3000000-0000-4000-8000-000000000102",
          conversionFactorFromDefault: null,
          defaultUnit: "mg/dL",
          examId: "b3000000-0000-4000-8000-000000000201",
          id: "b3000000-0000-4000-8000-000000000302",
          inputUnit: "mg/dL",
          inputValue: 100,
          notes: null,
          referenceHigh: 100,
          referenceLow: 0,
          referenceSex: "unisex",
          snapshotCategoryName: "Perfil lipídico",
          snapshotCategorySlug: "perfil_lipidico",
          snapshotExamName: "LDL-colesterol",
          snapshotExamSlug: "ldl_colesterol",
          status: "normal",
          valueDefault: 100,
        },
      ],
      status: "saved",
      title: "Anterior",
      updatedAt: "2026-06-01T12:00:00.000Z",
    },
  ],
  definitions: [
    {
      alternativeUnits: [{ factorFromDefault: 0.02586, id: "b3000000-0000-4000-8000-000000000401", status: "active", unit: "mmol/L" }],
      categoryId: "b3000000-0000-4000-8000-000000000001",
      categoryName: "Perfil lipídico",
      categorySlug: "perfil_lipidico",
      defaultUnit: "mg/dL",
      id: "b3000000-0000-4000-8000-000000000201",
      name: "LDL-colesterol",
      references: [{ highValue: 100, id: "b3000000-0000-4000-8000-000000000501", label: null, lowValue: 0, sex: "unisex", sortOrder: 1, status: "active" }],
      slug: "ldl_colesterol",
      sortOrder: 1,
      status: "active",
    },
  ],
  events: [],
  generatedAt: "2026-07-02T12:00:00.000Z",
  patient: { birthDate: "1997-07-02", gender: "female" },
};

const exams = buildPartnerClientExams(raw);

describe("PartnerClientExamsView", () => {
  beforeEach(() => {
    vi.mocked(archivePartnerExamDefinition).mockResolvedValue({ ok: true });
    vi.mocked(removeClientExamCollection).mockResolvedValue({ ok: true });
    vi.mocked(saveClientExamCollection).mockResolvedValue({ ok: true });
    vi.mocked(savePartnerExamDefinition).mockResolvedValue({ ok: true });
    refresh.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renderiza Exames com subabas sem CPF ou Pacientes", () => {
    render(<PartnerClientExamsView exams={exams} overview={overview} />);

    expect(screen.getByRole("heading", { name: "Ana Ribeiro" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Exames" })).toHaveAttribute("href", expect.stringContaining("tab=exames"));
    expect(screen.getByRole("button", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resultados/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Configurações/i })).toBeInTheDocument();
    expect(screen.getByText("Catálogo ativo")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Histórico de LDL-colesterol por data: 01\/06\/2026, 01\/07\/2026/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Registro de Coleta" })).not.toBeInTheDocument();
    expect(screen.queryByText("Pacientes")).not.toBeInTheDocument();
    expect(screen.queryByText(/CPF/i)).not.toBeInTheDocument();
  });

  it("classifica o valor digitado, mantém campos separados e exibe tooltip completo", () => {
    render(<PartnerClientExamsView exams={exams} overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: /Resultados/i }));
    const valueInput = screen.getByLabelText("Valor");
    expect(valueInput).toHaveClass("w-full", "min-w-0");
    expect(screen.getByLabelText("Unidade")).toHaveClass("w-full", "min-w-0");

    fireEvent.change(valueInput, { target: { value: "100" } });
    expect(valueInput).toHaveClass("border-[#22c55e]", "bg-[#102d21]");
    expect(screen.getByText("Dentro da normalidade")).toBeInTheDocument();

    fireEvent.change(valueInput, { target: { value: "110" } });
    expect(valueInput).toHaveClass("border-[#eab308]", "bg-[#2c2614]");
    expect(screen.getByText("Alteração leve")).toBeInTheDocument();

    fireEvent.change(valueInput, { target: { value: "125" } });
    expect(valueInput).toHaveClass("border-[#f97316]", "bg-[#321b0f]");
    expect(screen.getByText("Alteração moderada")).toBeInTheDocument();

    fireEvent.change(valueInput, { target: { value: "126" } });
    expect(valueInput).toHaveClass("border-[#ef4444]", "bg-[#34141b]");
    expect(screen.getByText("Alteração importante")).toBeInTheDocument();

    const tooltip = render(<ExamChartTooltip active payload={[{ payload: exams.collections[0].results[0] }]} />);
    const tooltipView = within(tooltip.container);
    expect(tooltipView.getByText("Data da coleta")).toBeInTheDocument();
    expect(tooltipView.getByText("Valor atual")).toBeInTheDocument();
    expect(tooltipView.getByText(/Referência:/)).toBeInTheDocument();
    expect(tooltipView.getByText("Alteração leve")).toBeInTheDocument();
  });

  it("salva resultados e remove coleta", async () => {
    render(<PartnerClientExamsView exams={exams} overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: /Resultados/i }));
    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "2.586" } });
    fireEvent.change(screen.getByLabelText("Unidade"), { target: { value: "mmol/L" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(saveClientExamCollection).toHaveBeenCalledWith(expect.objectContaining({
      patientId: overview.client.id,
      results: [expect.objectContaining({
        examId: raw.definitions[0].id,
        unit: "mmol/L",
        value: 2.586,
      })],
    })));

    fireEvent.click(screen.getByLabelText("Remover coleta 01/07/2026"));
    await waitFor(() => expect(removeClientExamCollection).toHaveBeenCalledWith({
      collectionId: raw.collections[0].id,
      patientId: overview.client.id,
    }));
  });

  it("edita configuração e arquiva exame", async () => {
    render(<PartnerClientExamsView exams={exams} overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: /Configurações/i }));
    expect(screen.getByLabelText("Filtrar por categoria")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "LDL ajustado" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(savePartnerExamDefinition).toHaveBeenCalledWith(expect.objectContaining({
      definitionId: raw.definitions[0].id,
      name: "LDL ajustado",
      references: [expect.objectContaining({ highValue: 100, lowValue: 0, sex: "unisex" })],
    })));

    fireEvent.click(screen.getByRole("button", { name: "Arquivar" }));
    await waitFor(() => expect(archivePartnerExamDefinition).toHaveBeenCalledWith({
      definitionId: raw.definitions[0].id,
      patientId: overview.client.id,
    }));
  });
});
