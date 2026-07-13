import { describe, expect, it } from "vitest";

import {
  buildPartnerClientExams,
  calculateExamDeltaPct,
  classifyExamValue,
  convertExamValueToDefault,
  selectExamReference,
  type PartnerClientExamsRawData,
} from "./client-exams-metrics";

const raw: PartnerClientExamsRawData = {
  categories: [
    { iconKey: "droplet", id: "category-1", name: "Perfil lipídico", slug: "perfil_lipidico", sortOrder: 1, status: "active" },
  ],
  collections: [
    {
      collectedAt: "2026-07-01",
      createdAt: "2026-07-01T12:00:00.000Z",
      id: "collection-2",
      notes: null,
      results: [
        {
          collectionId: "collection-2",
          conversionFactorFromDefault: null,
          defaultUnit: "mg/dL",
          examId: "exam-1",
          id: "result-2",
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
      id: "collection-1",
      notes: null,
      results: [
        {
          collectionId: "collection-1",
          conversionFactorFromDefault: null,
          defaultUnit: "mg/dL",
          examId: "exam-1",
          id: "result-1",
          inputUnit: "mg/dL",
          inputValue: 120,
          notes: null,
          referenceHigh: 100,
          referenceLow: 0,
          referenceSex: "unisex",
          snapshotCategoryName: "Perfil lipídico",
          snapshotCategorySlug: "perfil_lipidico",
          snapshotExamName: "LDL-colesterol",
          snapshotExamSlug: "ldl_colesterol",
          status: "high",
          valueDefault: 120,
        },
      ],
      status: "saved",
      title: "Anterior",
      updatedAt: "2026-06-01T12:00:00.000Z",
    },
  ],
  definitions: [
    {
      alternativeUnits: [{ factorFromDefault: 0.02586, id: "unit-1", status: "active", unit: "mmol/L" }],
      categoryId: "category-1",
      categoryName: "Perfil lipídico",
      categorySlug: "perfil_lipidico",
      defaultUnit: "mg/dL",
      id: "exam-1",
      name: "LDL-colesterol",
      references: [{ highValue: 100, id: "ref-1", label: null, lowValue: 0, sex: "unisex", sortOrder: 1, status: "active" }],
      slug: "ldl_colesterol",
      sortOrder: 1,
      status: "active",
    },
  ],
  events: [],
  generatedAt: "2026-07-02T12:00:00.000Z",
  patient: { birthDate: "1997-07-02", gender: "female" },
};

describe("client exams metrics", () => {
  it("converte unidade alternativa para unidade padrão", () => {
    const data = buildPartnerClientExams(raw);
    const definition = data.definitions[0];

    expect(convertExamValueToDefault(2.586, "mmol/L", definition).valueDefault).toBeCloseTo(100);
    expect(convertExamValueToDefault(100, "mg/dL", definition).valueDefault).toBe(100);
  });

  it("classifica valores conforme a faixa de referência", () => {
    expect(classifyExamValue(101, { highValue: 100, lowValue: 0 })).toBe("high");
    expect(classifyExamValue(40, { highValue: 100, lowValue: 50 })).toBe("low");
    expect(classifyExamValue(80, { highValue: 100, lowValue: 50 })).toBe("normal");
    expect(classifyExamValue(80, null)).toBe("unknown");
  });

  it("seleciona referência por gênero com fallback unissex", () => {
    const data = buildPartnerClientExams({
      ...raw,
      definitions: [{
        ...raw.definitions[0],
        references: [
          { highValue: 100, id: "ref-u", label: null, lowValue: 0, sex: "unisex", sortOrder: 2, status: "active" },
          { highValue: 90, id: "ref-f", label: null, lowValue: 10, sex: "female", sortOrder: 1, status: "active" },
        ],
      }],
    });

    expect(selectExamReference(data.definitions[0], "female")?.highValue).toBe(90);
    expect(selectExamReference(data.definitions[0], "male")?.highValue).toBe(100);
  });

  it("agrupa dashboard, alertas e delta histórico", () => {
    const data = buildPartnerClientExams(raw);

    expect(data.summary.totalExams).toBe(1);
    expect(data.summary.alertCount).toBe(1);
    expect(data.dashboard[0].resultCount).toBe(1);
    expect(data.latestCollection?.results[0].deltaPct).toBe(-10);
    expect(calculateExamDeltaPct(108, 120)).toBe(-10);
  });
});
