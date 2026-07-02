import { describe, expect, it } from "vitest";

import {
  buildPartnerClientWorkout,
  parseDefaultReps,
  workoutMuscleHeat,
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

  it("atribui intensidade maior ao músculo principal", () => {
    const heat = workoutMuscleHeat(exercises);
    expect(heat.find((item) => item.group === "peito")?.level).toBe(3);
    expect(heat.find((item) => item.group === "triceps")?.score).toBeLessThan(heat[0].score);
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
