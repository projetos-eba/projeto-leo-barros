import { describe, expect, it } from "vitest";

import {
  buildHeartRateZones,
  buildPartnerClientCardio,
  calculateCardioKcal,
  calculateCardioKcalPerMinute,
  type PartnerClientCardioRawData,
} from "./client-cardio-metrics";

const raw: PartnerClientCardioRawData = {
  calculations: [
    {
      activityKey: "caminhada_leve",
      comparisonActivityKey: "corrida_moderada",
      comparisonKcalEstimate: 184,
      comparisonKcalPerMin: 6.1,
      comparisonMet: 5,
      createdAt: "2026-07-01T12:00:00.000Z",
      durationMinutes: 30,
      id: "calculation-1",
      kcalEstimate: 92,
      kcalPerMin: 3.1,
      met: 2.5,
      parameters: { weeklyTargetMinutes: 180 },
      targetZone: "z2",
      weightKg: 70,
    },
  ],
  events: [
    { actorName: "Dr. Leo", createdAt: "2026-07-01T13:00:00.000Z", detail: "Cálculo salvo.", eventType: "calculation_saved", id: "event-1", version: 2 },
  ],
  generatedAt: "2026-07-02T12:00:00.000Z",
  patient: { birthDate: "1986-07-02" },
  plan: {
    activityKey: "caminhada_leve",
    comparisonActivityKey: "corrida_moderada",
    createdAt: "2026-06-20T12:00:00.000Z",
    id: "plan-1",
    notes: "Manter Z2.",
    publishedAt: null,
    sentAt: null,
    status: "published",
    targetZone: "z2",
    title: "Cardio base",
    updatedAt: "2026-07-01T12:00:00.000Z",
    version: 2,
    weeklyTargetMinutes: 180,
    weightKg: 70,
  },
  sessions: [
    {
      activityKey: "corrida_moderada",
      createdAt: "2026-07-01T10:00:00.000Z",
      durationMinutes: 60,
      id: "session-1",
      kcalEstimate: 368,
      met: 5,
      notes: null,
      performedAt: "2026-06-30T10:00:00.000Z",
      targetZone: "z2",
    },
    {
      activityKey: "eliptico",
      createdAt: "2026-07-01T10:00:00.000Z",
      durationMinutes: 52,
      id: "session-2",
      kcalEstimate: 319,
      met: 5,
      notes: null,
      performedAt: "2026-07-01T10:00:00.000Z",
      targetZone: "z2",
    },
    {
      activityKey: "bicicleta_leve",
      createdAt: "2026-07-02T10:00:00.000Z",
      durationMinutes: 50,
      id: "session-3",
      kcalEstimate: 245,
      met: 4,
      notes: null,
      performedAt: "2026-07-02T10:00:00.000Z",
      targetZone: "z3",
    },
  ],
};

describe("client-cardio-metrics", () => {
  it("calcula kcal por MET e kcal por minuto", () => {
    expect(calculateCardioKcal(70, 2.5, 30)).toBe(92);
    expect(calculateCardioKcal(70, 5, 30)).toBe(184);
    expect(calculateCardioKcalPerMinute(70, 5)).toBe(6.1);
  });

  it("calcula zonas cardíacas por idade", () => {
    const zones = buildHeartRateZones(40);

    expect(zones[1]).toMatchObject({
      bpmEnd: 126,
      bpmStart: 108,
      key: "z2",
      percentLabel: "60-70%",
    });
  });

  it("monta resumo semanal, zona predominante e comparação", () => {
    const data = buildPartnerClientCardio(raw, new Date("2026-07-02T12:00:00.000Z"));

    expect(data.plan?.title).toBe("Cardio base");
    expect(data.weekSummary.completedMinutes).toBe(162);
    expect(data.weekSummary.progressPct).toBe(90);
    expect(data.weekSummary.completedKcal).toBe(932);
    expect(data.weekSummary.targetZoneLabel).toBe("Z2");
    expect(data.comparison.find((point) => point.minutes === 30)).toMatchObject({
      comparisonKcal: 184,
      primaryKcal: 92,
    });
  });
});
