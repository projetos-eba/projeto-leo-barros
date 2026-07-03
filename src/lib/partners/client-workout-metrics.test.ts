import { describe, expect, it } from "vitest";

import {
  buildPartnerClientWorkout,
  parseDefaultReps,
  workoutMuscleHeat,
  workoutTrainingTypeLabel,
  workoutVolume,
  type PartnerClientWorkoutExercise,
} from "./client-workout-metrics";

const exercises: PartnerClientWorkoutExercise[] = [
  {
    bisetGroupId: null,
    bisetPosition: null,
    cadence: "2-0-2-0",
    exerciseId: "library-1",
    id: "prescribed-1",
    muscleGroup: "peito",
    name: "Supino reto",
    notes: null,
    restSeconds: 90,
    secondaryMuscleGroups: ["triceps", "ombros"],
    sets: [
      { id: "set-1", intensity: "moderate", loadKg: 50, reps: 10, setNumber: 1 },
      { id: "set-2", intensity: "maximum", loadKg: 60, reps: 8, setNumber: 2 },
    ],
    sortOrder: 0,
    technique: "normal",
    thumbnailUrl: null,
    variationName: null,
  },
];

describe("client workout metrics", () => {
  it("calcula volume apenas com séries completas", () => {
    expect(workoutVolume(exercises)).toBe(980);
    expect(workoutVolume([{ ...exercises[0], sets: [{ ...exercises[0].sets[0], loadKg: null }] }])).toBe(0);
  });

  it("conta exercícios por músculo e usa níveis fixos de azul", () => {
    const heat = workoutMuscleHeat([
      exercises[0],
      { ...exercises[0], id: "prescribed-2", muscleGroup: "peito", secondaryMuscleGroups: ["triceps"] },
      { ...exercises[0], id: "prescribed-3", muscleGroup: "peito", secondaryMuscleGroups: [] },
      { ...exercises[0], id: "prescribed-4", muscleGroup: "peito", secondaryMuscleGroups: [] },
      { ...exercises[0], id: "prescribed-5", muscleGroup: "peito", secondaryMuscleGroups: [] },
    ]);
    expect(heat.find((item) => item.group === "ombros")).toMatchObject({ level: 1, score: 1 });
    expect(heat.find((item) => item.group === "triceps")).toMatchObject({ level: 2, score: 2 });
    expect(heat.find((item) => item.group === "peito")).toMatchObject({ level: 3, score: 5 });
  });

  it("deriva tipo de treino pelos grupos musculares", () => {
    expect(workoutTrainingTypeLabel({
      durationMinutes: 60,
      exercises,
      frequencyPerWeek: 2,
      id: "session-1",
      objective: "hipertrofia",
      sortOrder: 0,
      title: "Treino A",
      volumeKg: 980,
    })).toBe("Peito e Tríceps");
    expect(workoutTrainingTypeLabel({
      durationMinutes: 60,
      exercises: [],
      frequencyPerWeek: 2,
      id: "session-2",
      objective: "hipertrofia",
      sortOrder: 1,
      title: "Treino B",
      volumeKg: 0,
    })).toBe("Costas e Bíceps");
  });

  it("seleciona programa publicado e normaliza reps padrão", () => {
    const data = buildPartnerClientWorkout({
      events: [],
      exercises: [],
      programs: [{
        createdAt: "2026-07-01T00:00:00Z",
        id: "program-1",
        notes: null,
        publishedAt: "2026-07-01T00:00:00Z",
        sentAt: null,
        sessions: [{
          durationMinutes: 60,
          exercises,
          frequencyPerWeek: 2,
          id: "session-1",
          objective: "hipertrofia",
          sortOrder: 0,
          title: "Treino A",
        }],
        status: "published",
        title: "Programa",
        updatedAt: "2026-07-01T00:00:00Z",
        version: 1,
      }],
      templates: [],
    });
    expect(data.activeProgram?.id).toBe("program-1");
    expect(data.activeProgram?.sessions[0].volumeKg).toBe(980);
    expect(parseDefaultReps("8-12")).toBe(8);
  });
});
