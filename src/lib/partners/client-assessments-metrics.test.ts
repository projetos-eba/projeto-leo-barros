import { describe, expect, it } from "vitest";

import {
  buildCalorieProjection,
  buildDynamicNumberDomain,
  buildPartnerClientAssessments,
  calculateBmi,
  calculateBmr,
  calculateCalories,
  calculateFatMass,
  calculateLeanMass,
  type PartnerClientAssessmentRawData,
} from "./client-assessments-metrics";

const raw: PartnerClientAssessmentRawData = {
  assessments: [
    {
      activityLevel: "moderate",
      assessedAt: "2026-04-01T12:00:00.000Z",
      bodyFatPercentage: 18,
      calculations: [],
      assessmentMethod: "pollock_7",
      circumferences: [
        { id: "c1", metricKey: "waist", valueCm: 78 },
        { id: "c2", metricKey: "chest", valueCm: 92 },
      ],
      heightCm: 174,
      id: "a1",
      muscleMassKg: 60,
      notes: null,
      skinfolds: [
        { id: "s1", metricKey: "abdominal", valueMm: 18 },
        { id: "s2", metricKey: "triceps", valueMm: 14 },
      ],
      targetDays: 90,
      targetWeightKg: 80,
      title: "Inicial",
      weightKg: 76,
    },
    {
      activityLevel: "moderate",
      assessedAt: "2026-06-01T12:00:00.000Z",
      bodyFatPercentage: 14.7,
      calculations: [],
      assessmentMethod: "pollock_7",
      circumferences: [
        { id: "c3", metricKey: "waist", valueCm: 73 },
        { id: "c4", metricKey: "chest", valueCm: 94 },
      ],
      heightCm: 174,
      id: "a2",
      muscleMassKg: 62.1,
      notes: "Evolução consistente.",
      skinfolds: [
        { id: "s3", metricKey: "abdominal", valueMm: 14.7 },
        { id: "s4", metricKey: "triceps", valueMm: 11.9 },
      ],
      targetDays: 90,
      targetWeightKg: 80,
      title: "Completa",
      weightKg: 78.4,
    },
  ],
  calculations: [
    {
      activityFactor: 1.55,
      assessmentId: "a2",
      bmrKcal: 1510,
      createdAt: "2026-06-01T12:10:00.000Z",
      dailyEnergyDeltaKcal: 137,
      formula: "mifflin",
      id: "calc1",
      inputs: {},
      projectedWeightDeltaKg: 1.6,
      status: "applied",
      targetDays: 90,
      targetKcal: 2478,
      targetWeightKg: 80,
      tdeeKcal: 2341,
      weeklyEnergyDeltaKcal: 959,
    },
  ],
  goals: {
    adherenceTargetPct: 80,
    targetBodyFatMaxPct: 15,
    targetBodyFatMinPct: 12,
    targetWeightKg: 80,
  },
  identity: {
    birthDate: "1997-06-30",
    displayName: "Ana Ribeiro",
    email: "ana@example.invalid",
    gender: "female",
    objective: "Hipertrofia",
    patientId: "patient-1",
    serviceScopes: ["dieta", "treino"],
    status: "active",
  },
};

describe("client assessments metrics", () => {
  it("calcula IMC e composicao corporal", () => {
    expect(calculateBmi(78.4, 174)).toBe(25.9);
    expect(calculateFatMass(78.4, 14.7)).toBe(11.5);
    expect(calculateLeanMass(78.4, 14.7)).toBe(66.9);
  });

  it("calcula formulas caloricas com fatores dinamicos", () => {
    const base = {
      activityLevel: "moderate" as const,
      age: 29,
      bodyFatPercentage: 14.7,
      gender: "female" as const,
      heightCm: 174,
      targetDays: 90,
      targetWeightKg: 80,
      weightKg: 78.4,
    };

    expect(calculateBmr({ ...base, formula: "mifflin" })).toBe(1566);
    expect(calculateBmr({ ...base, formula: "harris_benedict" })).toBe(1586);
    expect(calculateBmr({ ...base, formula: "cunningham" })).toBe(1972);
    expect(calculateBmr({ ...base, formula: "tinsley" })).toBe(1954);

    const calculation = calculateCalories({ ...base, formula: "mifflin" });
    expect(calculation.tdeeKcal).toBe(2427);
    expect(calculation.targetKcal).toBe(2564);
    expect(calculation.projectedWeightDeltaKg).toBe(1.6);
  });

  it("gera projecao de calorias e peso ao longo do prazo", () => {
    const input = {
      activityLevel: "moderate" as const,
      age: 29,
      bodyFatPercentage: 14.7,
      formula: "mifflin" as const,
      gender: "female" as const,
      heightCm: 174,
      targetDays: 90,
      targetWeightKg: 80,
      weightKg: 78.4,
    };
    const calculation = calculateCalories(input);
    const projection = buildCalorieProjection(input, calculation);

    expect(projection[0]).toMatchObject({ day: 0, weightKg: 78.4 });
    expect(projection.at(-1)).toMatchObject({ day: 90, weightKg: 80 });
    expect(projection.length).toBeGreaterThan(4);
  });

  it("calcula dominio dinamico sem prender o eixo em zero", () => {
    expect(buildDynamicNumberDomain([2427, 2564, 2588], 0.1)).toEqual([2406, 2609]);
  });

  it("monta KPIs, historico e series de avaliacao fisica", () => {
    const data = buildPartnerClientAssessments(raw, new Date("2026-07-01T12:00:00.000Z"));

    expect(data.client.name).toBe("Ana Ribeiro");
    expect(data.kpis.weight.value).toBe(78.4);
    expect(data.kpis.weight.delta).toBe(2.4);
    expect(data.kpis.bodyFat.delta).toBe(-3.3);
    expect(data.kpis.bmi.classification).toBe("Sobrepeso");
    expect(data.circumferences.latest.find((item) => item.key === "waist")?.delta).toBe(-5);
    expect(data.charts.circumferenceSeries).toHaveLength(2);
    expect(data.charts.skinfoldSeries).toHaveLength(2);
    expect(data.skinfolds.latest.find((item) => item.key === "abdominal")?.delta).toBe(-3.3);
    expect(data.calorie.latestApplied?.id).toBe("calc1");
  });
});
