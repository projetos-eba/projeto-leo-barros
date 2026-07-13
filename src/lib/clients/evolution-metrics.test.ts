import { describe, expect, it } from "vitest";

import { buildClientEvolution, type ClientEvolutionRawData } from "./evolution-metrics";

const raw: ClientEvolutionRawData = {
  assessments: [
    {
      assessedAt: "2026-05-01T12:00:00.000Z",
      bodyFatPercentage: 18,
      bmi: 24.5,
      fatMassKg: 13.5,
      heightCm: 170,
      id: "assessment-1",
      muscleMassKg: 45,
      title: "Inicial",
      weightKg: 78,
    },
    {
      assessedAt: "2026-06-01T12:00:00.000Z",
      bodyFatPercentage: 16,
      bmi: 24,
      fatMassKg: 12,
      heightCm: 170,
      id: "assessment-2",
      muscleMassKg: 47,
      title: "Atual",
      weightKg: 76,
    },
  ],
  client: { avatarUrl: null, id: "client-1", name: "Ana Ribeiro", objective: "Hipertrofia" },
  generatedAt: "2026-06-02T12:00:00.000Z",
  nutrition: {
    logs: [
      { consumedKcal: 2100, date: "2026-06-01", waterMl: 2300 },
      { consumedKcal: 1900, date: "2026-06-02", waterMl: 2100 },
    ],
    plan: {
      calorieStrategy: "maintenance",
      id: "diet-1",
      targetCarbsG: 250,
      targetFatG: 60,
      targetKcal: 2000,
      targetProteinG: 140,
      title: "Plano atual",
      updatedAt: "2026-06-01T12:00:00.000Z",
      waterLiters: 2.5,
    },
  },
  period: { endDate: "2026-06-30", startDate: "2026-05-01" },
  photos: {
    comparisonNotes: [],
    events: [],
    generatedAt: "2026-06-02T12:00:00.000Z",
    partnerId: "partner-1",
    patientId: "client-1",
    sessions: [
      {
        capturedAt: "2026-05-01T10:00:00.000Z",
        createdAt: "2026-05-01T10:00:00.000Z",
        id: "photo-session-1",
        measurements: { armCm: 30, calfCm: 36, hipCm: 96, thighCm: 54, waistCm: 78, weightKg: 78 },
        notes: null,
        photos: [
          { angle: "front", createdAt: "2026-05-01T10:00:00.000Z", cropData: {}, heightPx: 1200, id: "photo-1", mimeType: "image/png", originalFilename: "front.png", sizeBytes: 1000, storagePath: "partner/client/session/front.png", widthPx: 900 },
        ],
        status: "complete",
        title: "Sessão inicial",
        updatedAt: "2026-05-01T10:00:00.000Z",
      },
    ],
  },
  workout: {
    program: {
      id: "program-1",
      sessions: [
        {
          durationMinutes: 60,
          exercises: [
            {
              id: "exercise-1",
              muscleGroup: "chest",
              name: "Supino",
              secondaryMuscleGroups: ["triceps"],
              sets: [
                { id: "set-1", intensity: "moderate", loadKg: 40, reps: 10, setNumber: 1 },
                { id: "set-2", intensity: "moderate", loadKg: 45, reps: 8, setNumber: 2 },
              ],
            },
          ],
          frequencyPerWeek: 2,
          id: "session-1",
          objective: "Força",
          sortOrder: 1,
          title: "Treino A",
        },
      ],
      status: "active",
      title: "Programa atual",
      updatedAt: "2026-06-01T12:00:00.000Z",
      version: 1,
    },
    sessions: [
      { durationMinutes: 58, id: "workout-1", prescribedSessionId: "session-1", status: "completed", totalVolumeKg: 1160, workoutDate: "2026-06-01" },
      { durationMinutes: 62, id: "workout-2", prescribedSessionId: "session-1", status: "completed", totalVolumeKg: 1280, workoutDate: "2026-06-03" },
    ],
    setLogs: [
      { completedAt: "2026-06-01T12:00:00.000Z", loadKg: 40, reps: 10, status: "completed" },
      { completedAt: "2026-06-03T12:00:00.000Z", loadKg: 45, reps: 8, status: "completed" },
    ],
  },
};

describe("buildClientEvolution", () => {
  it("monta métricas, variações e gráficos a partir dos dados do Cliente", () => {
    const data = buildClientEvolution(raw);

    expect(data.client.firstName).toBe("Ana");
    expect(data.anthropometry.cards.find((card) => card.label === "Peso atual")).toMatchObject({
      deltaLabel: "-2 kg",
      positive: true,
      value: "76 kg",
    });
    expect(data.nutrition.summary).toMatchObject({ balanceAverage: 0, kcal: 2000, proteinG: 140 });
    expect(data.workout.programRows[0]).toMatchObject({ letter: "A", sets: 2, volumeLabel: "760 kg" });
    expect(data.workout.heat[0]).toMatchObject({ group: "chest", level: 3 });
    expect(data.photos.sessions[0].photos[0].imageUrl).toBe("/cliente/evolucao/fotos/photo-1/arquivo");
  });

  it("mantém estados vazios sem quebrar contratos da tela", () => {
    const data = buildClientEvolution({
      ...raw,
      assessments: [],
      nutrition: { logs: [], plan: null },
      photos: { ...raw.photos, sessions: [] },
      workout: { program: null, sessions: [], setLogs: [] },
    });

    expect(data.anthropometry.points).toEqual([]);
    expect(data.anthropometry.cards[0]).toMatchObject({ deltaLabel: "Sem variação", value: "Sem dados" });
    expect(data.nutrition.balance).toEqual([]);
    expect(data.photos.sessions).toEqual([]);
    expect(data.workout.programRows).toEqual([]);
  });
});
