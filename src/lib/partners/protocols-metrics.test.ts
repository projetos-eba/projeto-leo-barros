import { describe, expect, it } from "vitest";

import { buildPartnerProtocolsData, normalizeProtocolVideoUrl, parseFoodImportTable } from "./protocols-metrics";

describe("protocols-metrics", () => {
  it("calcula métricas, rankings e pendências da base", () => {
    const data = buildPartnerProtocolsData({
      clients: [],
      exercises: [
        {
          cadence: null,
          created_at: "2026-07-01T10:00:00.000Z",
          default_reps: "8-12",
          default_sets: 4,
          equipment: "barra",
          id: "exercise-1",
          instructions: null,
          level: "intermediario",
          muscle_group: "pernas",
          name: "Agachamento livre",
          objective: "forca",
          rest_seconds: 90,
          status: "active",
          tags: [],
          thumbnail_url: null,
          updated_at: "2026-07-01T10:00:00.000Z",
          usage_count: 42,
          variations: [],
          video_url: null,
        },
      ],
      foods: [
        {
          carbs_g: 28.1,
          category: "cereal",
          created_at: "2026-07-01T10:00:00.000Z",
          fat_g: 0.2,
          fiber_g: 1.6,
          household_measure: null,
          id: "food-1",
          kcal: 130,
          name: "Arroz branco cozido",
          notes: null,
          protein_g: 2.5,
          serving_size: 100,
          serving_unit: "g",
          sodium_mg: 1,
          source: "taco",
          status: "active",
          suggested_uses: ["refeicao_principal"],
          tags: ["almoço"],
          updated_at: "2026-07-01T10:00:00.000Z",
          usage_count: 42,
        },
        {
          carbs_g: 15,
          category: "outros",
          created_at: "2026-07-01T10:00:00.000Z",
          fat_g: 1,
          fiber_g: 2,
          household_measure: null,
          id: "food-2",
          kcal: 90,
          name: "Importado sem categoria",
          notes: null,
          protein_g: 4,
          serving_size: 100,
          serving_unit: "g",
          sodium_mg: 20,
          source: "imported",
          status: "active",
          suggested_uses: [],
          tags: [],
          updated_at: "2026-07-01T10:00:00.000Z",
          usage_count: 1,
        },
      ],
      partner: null,
    });

    expect(data.metrics.activeFoods).toBe(2);
    expect(data.metrics.importedFoods).toBe(2);
    expect(data.metrics.foodWithoutCategory).toBe(1);
    expect(data.metrics.exerciseWithoutVideo).toBe(1);
    expect(data.topFoods[0]?.name).toBe("Arroz branco cozido");
  });

  it("normaliza vídeos e importa tabela CSV/TSV de alimentos", () => {
    expect(normalizeProtocolVideoUrl("https://youtu.be/abc123")).toBe("https://www.youtube.com/watch?v=abc123");
    expect(normalizeProtocolVideoUrl("http://youtube.com/watch?v=abc123")).toBeNull();

    const rows = parseFoodImportTable([
      "nome;categoria;origem;porcao;unidade;kcal;carboidratos;proteinas;gorduras;fibras;sodio",
      "Aveia;cereal;taco;30;g;118;20;4.3;2.2;3;1",
    ].join("\n"));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ category: "cereal", name: "Aveia", protein_g: 4.3 });
  });
});
