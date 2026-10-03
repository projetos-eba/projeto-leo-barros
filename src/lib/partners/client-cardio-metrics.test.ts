import { describe, expect, it } from "vitest";

import {
  buildHeartRateZones,
  buildPartnerClientCardio,
  buildCardioComparison,
  cardioActivities,
  cardioActivityOptions,
  calculateCardioKcal,
  calculateCardioKcalPerMinute,
  getApprovedCardioMet,
  type PartnerClientCardioRawData,
} from "./client-cardio-metrics";

const raw: PartnerClientCardioRawData = {
  calculations: [
    {
      activityKey: "caminhada_leve",
      comparisonActivityKey: "corrida_moderada",
      comparisonKcalEstimate: 221,
      comparisonKcalPerMin: 7.4,
      comparisonMet: 6,
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
      kcalEstimate: 441,
      met: 6,
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

  it("expõe as atividades do print com MET aprovado", () => {
    expect(cardioActivityOptions.map((activity) => activity.label)).toEqual(expect.arrayContaining([
      "Caminhada — Leve (3,2 km/h)",
      "Corrida — Intenso (9,7 km/h)",
      "Natação — Moderado (Livre)",
      "Ciclismo — Intenso (25 km/h)",
      "Musculação — Moderado (Moderado esforço)",
      "Futebol — Geral (Partida recreacional)",
      "Jiu-Jitsu — Intenso (Competição)",
      "Assistir TV — Sedentário (Sentado)",
      "Dormir — Descanso (Dormindo)",
      "Sexo — Variável (Relação sexual típica)",
    ]));
    expect(cardioActivities.caminhada_leve_32).toMatchObject({
      group: "Caminhada",
      met: 2.5,
      metClassification: "Leve (1,6-2,9 METs)",
      metStatus: "approved",
    });
  });

  it("mantém os valores MET das 20 atividades de referência do módulo", () => {
    expect(cardioActivities).toEqual(expect.objectContaining({
      assistir_tv_sedentario: expect.objectContaining({ met: 1.1 }),
      caminhada_leve_32: expect.objectContaining({ met: 2.5 }),
      caminhada_leve_40: expect.objectContaining({ met: 2.9 }),
      caminhada_moderada_48: expect.objectContaining({ met: 3.3 }),
      caminhada_moderada_60: expect.objectContaining({ met: 3.9 }),
      ciclismo_intenso_25: expect.objectContaining({ met: 12 }),
      ciclismo_leve_16: expect.objectContaining({ met: 4 }),
      ciclismo_moderado_20: expect.objectContaining({ met: 6 }),
      corrida_intenso_97: expect.objectContaining({ met: 9.8 }),
      corrida_moderada_65: expect.objectContaining({ met: 6 }),
      dormir_descanso: expect.objectContaining({ met: 0.9 }),
      futebol_geral_recreacional: expect.objectContaining({ met: 8.5 }),
      jiu_jitsu_intenso_competicao: expect.objectContaining({ met: 10 }),
      musculacao_intenso_vigoroso: expect.objectContaining({ met: 6 }),
      musculacao_leve_baixo_esforco: expect.objectContaining({ met: 3 }),
      musculacao_moderado_esforco: expect.objectContaining({ met: 3.75 }),
      natacao_intenso_competicao: expect.objectContaining({ met: 11 }),
      natacao_leve_lento: expect.objectContaining({ met: 4.5 }),
      natacao_moderado_livre: expect.objectContaining({ met: 5.9 }),
      sexo_variavel_tipica: expect.objectContaining({ met: 4 }),
    }));
    expect(cardioActivities.corrida_moderada).toMatchObject({
      label: "Corrida — Moderado (6,5 km/h)",
      met: 6,
    });
  });

  it("calcula atividades aprovadas da tabela MET do módulo", () => {
    expect(getApprovedCardioMet("caminhada_leve")).toBe(2.5);
    expect(getApprovedCardioMet("natacao_moderado_livre")).toBe(5.9);
    expect(getApprovedCardioMet("dormir_descanso")).toBe(0.9);
    expect(getApprovedCardioMet("ciclismo_intenso_25")).toBe(12);
    expect(calculateCardioKcal(70, cardioActivities.ciclismo_intenso_25.met ?? 0, 30)).toBe(441);
    expect(buildCardioComparison(70, "dormir_descanso", "ciclismo_intenso_25").find((point) => point.minutes === 30)).toMatchObject({
      comparisonKcal: 441,
      primaryKcal: 33,
    });
  });

  it("divide o comparativo em quatro partes da meta semanal", () => {
    const comparison = buildCardioComparison(70, "caminhada_leve", "corrida_moderada", 180);

    expect(comparison.map((point) => point.minutes)).toEqual([0, 45, 90, 135, 180]);
    expect(comparison.at(-1)).toMatchObject({
      comparisonKcal: 1323,
      primaryKcal: 551,
    });
  });

  it("monta resumo semanal, zona predominante e comparação", () => {
    const data = buildPartnerClientCardio(raw, new Date("2026-07-02T12:00:00.000Z"));

    expect(data.plan?.title).toBe("Cardio base");
    expect(data.weekSummary.completedMinutes).toBe(162);
    expect(data.weekSummary.progressPct).toBe(90);
    expect(data.weekSummary.completedKcal).toBe(1005);
    expect(data.weekSummary.targetZoneLabel).toBe("Z2");
    expect(data.comparison.find((point) => point.minutes === 90)).toMatchObject({
      comparisonKcal: 662,
      primaryKcal: 276,
    });
    expect(data.comparison.at(-1)?.minutes).toBe(180);
  });
});
