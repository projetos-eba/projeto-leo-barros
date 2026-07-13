import { describe, expect, it } from "vitest";

import { buildClientWorkout, type ClientWorkoutRawData } from "./workout-metrics";

const raw: ClientWorkoutRawData = {
  client: {
    avatarUrl: "/avatars/ana-ribeiro-seed.png",
    id: "a1000000-0000-4000-8000-000000000301",
    name: "Ana Ribeiro",
    objective: "Hipertrofia",
  },
  exerciseLogs: [
    { clientSessionId: "log-1", completedAt: "2026-07-02T13:00:00.000Z", id: "exercise-log-1", notes: null, prescribedExerciseId: "exercise-1", startedAt: "2026-07-02T12:00:00.000Z", status: "completed" },
  ],
  generatedAt: "2026-07-03T12:00:00.000Z",
  program: {
    createdAt: "2026-07-01T12:00:00.000Z",
    id: "program-1",
    notes: "Priorizar técnica.",
    partnerId: "partner-1",
    patientId: "a1000000-0000-4000-8000-000000000301",
    publishedAt: "2026-07-01T12:00:00.000Z",
    sentAt: null,
    sessions: [
      {
        durationMinutes: 60,
        exercises: [
          {
            bisetGroupId: null,
            bisetPosition: null,
            cadence: "2-1-2-0",
            exerciseId: "library-1",
            id: "exercise-1",
            muscleGroup: "peito",
            name: "Supino reto",
            notes: null,
            restSeconds: 90,
            secondaryMuscleGroups: ["triceps", "ombros"],
            sets: [
              { id: "set-1", intensity: "warmup", loadKg: 40, reps: 12, setNumber: 1 },
              { id: "set-2", intensity: "moderate", loadKg: 60, reps: 10, setNumber: 2 },
            ],
            sortOrder: 0,
            technique: "normal",
            thumbnailUrl: null,
            variationName: null,
          },
        ],
        frequencyPerWeek: 2,
        id: "session-1",
        objective: "hipertrofia",
        sortOrder: 0,
        title: "Treino A",
      },
    ],
    status: "published",
    title: "Hipertrofia Upper/Lower",
    updatedAt: "2026-07-02T12:00:00.000Z",
    version: 2,
  },
  selectedDate: "2026-07-03",
  setLogs: [
    { clientSessionId: "log-1", completedAt: "2026-07-02T12:20:00.000Z", exerciseLogId: "exercise-log-1", id: "set-log-1", loadKg: 40, prescribedExerciseId: "exercise-1", prescribedSetId: "set-1", reps: 12, setNumber: 1, status: "completed" },
    { clientSessionId: "log-1", completedAt: "2026-07-02T12:30:00.000Z", exerciseLogId: "exercise-log-1", id: "set-log-2", loadKg: 60, prescribedExerciseId: "exercise-1", prescribedSetId: "set-2", reps: 10, setNumber: 2, status: "completed" },
  ],
  workoutSessions: [
    { completedAt: "2026-07-02T13:00:00.000Z", durationMinutes: 60, id: "log-1", notes: null, prescribedSessionId: "session-1", programId: "program-1", startedAt: "2026-07-02T12:00:00.000Z", status: "completed", totalVolumeKg: 1080, workoutDate: "2026-07-02" },
  ],
};

describe("buildClientWorkout", () => {
  it("calcula treino do dia, músculos trabalhados e histórico do Cliente", () => {
    const workout = buildClientWorkout(raw);

    expect(workout.client.firstName).toBe("Ana");
    expect(workout.todaySession?.title).toBe("Treino A");
    expect(workout.todaySession?.trainingLabel).toBe("Peito e Tríceps");
    expect(workout.todaySession?.muscleHeat.map((item) => item.group)).toContain("peito");
    expect(workout.summary.totalSets).toBe(2);
    expect(workout.summary.totalVolumeKg).toBe(1080);
    expect(workout.history[0]?.statusLabel).toBe("Concluído");
    expect(workout.executionSessions[0]?.currentSet).toBeNull();
  });
});
