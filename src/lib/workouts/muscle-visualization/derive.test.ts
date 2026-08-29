import { describe, expect, it } from "vitest";

import { deriveWorkoutMusclePreview, normalizeMuscleGroup } from "./index";

describe("workout muscle visualization", () => {
  it("normaliza grupos canônicos, aliases e entradas desconhecidas", () => {
    expect(normalizeMuscleGroup(" Ombro ")).toBe("ombros");
    expect(normalizeMuscleGroup("Abdominal")).toBe("core");
    expect(normalizeMuscleGroup("Glúteos")).toBe("gluteos");
    expect(normalizeMuscleGroup("desconhecido")).toBeNull();
  });

  it("inclui músculos primários e secundários uma única vez por layer", () => {
    const preview = deriveWorkoutMusclePreview([
      { group: "peito", level: 1, score: 1 },
      { group: "ombros", level: 2, score: 2 },
      { group: "triceps", level: 1, score: 1 },
    ]);

    expect(preview.view).toBe("upper-front");
    expect(preview.groups).toEqual(["peito", "ombros"]);
    expect(preview.layers.map((layer) => layer.id)).toEqual(["front-chest", "front-shoulders"]);
  });

  it("usa a vista posterior quando o estímulo posterior é dominante", () => {
    const preview = deriveWorkoutMusclePreview([
      { group: "costas", level: 2, score: 3 },
      { group: "biceps", level: 1, score: 1 },
      { group: "triceps", level: 1, score: 1 },
    ]);

    expect(preview.view).toBe("upper-back");
    expect(preview.layers.map((layer) => layer.id)).toEqual(["back-corners", "back-triceps"]);
  });

  it("prioriza o grupo primário na vista sem alterar o cálculo de calor", () => {
    const preview = deriveWorkoutMusclePreview([
      { group: "costas", level: 1, score: 1 },
      { group: "biceps", level: 1, score: 1 },
    ], { primaryGroups: ["costas"] });

    expect(preview.view).toBe("upper-back");
    expect(preview.layers.map((layer) => layer.id)).toEqual(["back-corners"]);
  });

  it("mantém a anatomia posterior quando estabilizadores frontais somam mais heat", () => {
    const preview = deriveWorkoutMusclePreview([
      { group: "costas", level: 2, score: 2 },
      { group: "biceps", level: 2, score: 2 },
      { group: "core", level: 2, score: 2 },
    ], { primaryGroups: ["costas", "costas"] });

    expect(preview.view).toBe("upper-back");
    expect(preview.layers.map((layer) => layer.id)).toEqual(["back-corners"]);
  });

  it("compõe simultaneamente camadas inferiores e seleciona costas quando glúteos inclinam a vista", () => {
    const preview = deriveWorkoutMusclePreview([
      { group: "pernas", level: 2, score: 2 },
      { group: "gluteos", level: 1, score: 1 },
    ]);

    expect(preview.view).toBe("lower-back");
    expect(preview.layers.map((layer) => layer.id)).toEqual(["back-thighs", "back-calves", "back-glutes"]);
  });

  it("não cria prévia para treino vazio ou grupos sem asset", () => {
    expect(deriveWorkoutMusclePreview([])).toEqual({ groups: [], layers: [], view: null });
    expect(deriveWorkoutMusclePreview([{ group: "mobilidade", level: 1, score: 1 }])).toEqual({ groups: [], layers: [], view: null });
  });

  it("remove duplicação de layers e mantém o maior estímulo recebido", () => {
    const preview = deriveWorkoutMusclePreview([
      { group: "peito", level: 3, score: 5 },
      { group: "peito", level: 1, score: 1 },
    ]);

    expect(preview.layers).toHaveLength(1);
    expect(preview.layers[0]).toMatchObject({ id: "front-chest", level: 3, opacity: 1, score: 5 });
  });
});
