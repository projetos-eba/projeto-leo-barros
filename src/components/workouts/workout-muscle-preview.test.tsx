import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PartnerClientWorkoutExercise } from "@/lib/partners/client-workout-metrics";

import { WorkoutMusclePreview } from "./workout-muscle-preview";

const exercise: PartnerClientWorkoutExercise = {
  bisetGroupId: null,
  bisetPosition: null,
  cadence: null,
  exerciseId: "exercise-library-id",
  id: "prescribed-exercise-id",
  muscleGroup: "peito",
  name: "Supino reto",
  notes: null,
  restSeconds: 90,
  secondaryMuscleGroups: ["triceps", "ombros"],
  sets: [],
  sortOrder: 0,
  technique: "normal",
  thumbnailUrl: null,
  variationName: null,
};

describe("WorkoutMusclePreview", () => {
  it("renderiza a base e as layers da vista dominante com paths centralizados", () => {
    const { container } = render(<WorkoutMusclePreview exercises={[exercise]} />);

    expect(screen.getByRole("img", { name: /vista frontal superior/i })).toHaveAttribute("data-view", "upper-front");
    expect(container.querySelector('img[src="/workout-body/base/upper-front.png"]')).toBeInTheDocument();
    expect(container.querySelector('[data-layer="front-chest"]')).toHaveAttribute("src", "/workout-body/muscles/front/peito.png");
    expect(container.querySelector('[data-layer="front-shoulders"]')).toHaveAttribute("src", "/workout-body/muscles/front/ombros.png");
    expect(container.querySelector('[data-layer="back-triceps"]')).not.toBeInTheDocument();
  });

  it("não tenta renderizar assets em exercícios sem grupo anatômico mapeado", () => {
    const { container } = render(<WorkoutMusclePreview exercises={[{ ...exercise, muscleGroup: "mobilidade", secondaryMuscleGroups: [] }]} />);

    expect(screen.getByRole("img", { name: /indisponível/i })).toHaveAttribute("data-view", "none");
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("mostra anatomia frontal e posterior simultaneamente no resumo", () => {
    const { container } = render(<WorkoutMusclePreview exercises={[{ ...exercise, muscleGroup: "costas", secondaryMuscleGroups: ["peito", "pernas"] }]} mode="summary" />);

    expect(container.querySelector('[data-workout-muscle-preview][data-view="front-back"]')).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /vista frontal/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /vista posterior/i })).toBeInTheDocument();
    expect(container.querySelector('[data-layer="full-front-chest"]')).toBeInTheDocument();
    expect(container.querySelector('[data-layer="full-back-corners"]')).toBeInTheDocument();
    expect(container.querySelector('[data-layer="full-front-thighs"]')).toBeInTheDocument();
    expect(container.querySelector('[data-layer="full-front-left-calf"]')).toHaveStyle({ transform: "rotate(-6deg)" });
    expect(container.querySelector('[data-layer="full-front-right-calf"]')).toHaveStyle({ transform: "rotate(6deg)" });
    expect(container.querySelector('[data-layer="full-back-thighs"]')).toBeInTheDocument();
    expect(container.querySelector('[data-layer="full-back-left-calf"]')).toHaveStyle({ transform: "rotate(8deg)" });
    expect(container.querySelector('[data-layer="full-back-right-calf"]')).toHaveStyle({ transform: "rotate(-8deg)" });
    expect(container.querySelector('img[src="/workout-body/base/full-front.png"]')).toBeInTheDocument();
    expect(container.querySelector('img[src="/workout-body/base/full-back.png"]')).toBeInTheDocument();
    expect(container.querySelector('[data-pose-canvas="front"]')).toHaveClass("h-full");
    expect(container.querySelector('[data-pose-upper="front"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-pose-lower="back"]')).not.toBeInTheDocument();
  });
});
