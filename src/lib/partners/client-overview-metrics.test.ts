import { describe, expect, it } from "vitest";

import { buildPartnerClientOverview } from "./client-overview-metrics";
import type { PartnerClientOverviewRawData } from "./client-overview-metrics";

const now = new Date("2026-06-30T12:00:00.000Z");

const raw: PartnerClientOverviewRawData = {
  adherence: [
    {
      dietPercentage: 78,
      id: "adh-1",
      periodEnd: "2026-06-21",
      periodStart: "2026-06-15",
      trainingPercentage: 72,
    },
    {
      dietPercentage: 61,
      id: "adh-2",
      periodEnd: "2026-06-28",
      periodStart: "2026-06-22",
      trainingPercentage: 59,
    },
  ],
  appointments: [
    {
      endsAt: "2026-07-05T11:20:00.000Z",
      id: "appt-1",
      notes: "Acompanhamento",
      startsAt: "2026-07-05T10:30:00.000Z",
      status: "scheduled",
      title: "Consulta de acompanhamento",
    },
  ],
  events: [
    {
      createdAt: "2026-06-08T10:00:00.000Z",
      detail: "Plano renovado.",
      id: "event-1",
      title: "Renovação",
      type: "renewal",
    },
  ],
  goals: {
    adherenceTargetPct: 80,
    targetBodyFatMaxPct: 15,
    targetBodyFatMinPct: 12,
    targetWeightKg: 80,
  },
  identity: {
    avatarUrl: "/avatars/ana-ribeiro-seed.png",
    birthDate: "1991-05-12",
    displayName: "Ana Ribeiro",
    email: "ana@example.invalid",
    gender: "female",
    objective: "Hipertrofia",
    patientId: "patient-1",
    phone: "+5511999999999",
    profileId: "profile-1",
    serviceScopes: ["cardio", "dieta"],
    startedAt: "2026-06-01T00:00:00.000Z",
    status: "active",
  },
  measurements: [
    {
      bodyFatPercentage: 18,
      id: "measurement-1",
      measuredAt: "2026-05-01T12:00:00.000Z",
      notes: null,
      weightKg: 75,
    },
    {
      bodyFatPercentage: 15,
      id: "measurement-2",
      measuredAt: "2026-06-01T12:00:00.000Z",
      notes: null,
      weightKg: 78,
    },
  ],
  observations: [
    {
      detail: "Pressão oscilou no último registro.",
      id: "observation-1",
      occurredAt: "2026-06-29T09:00:00.000Z",
      severity: "attention",
      title: "Pressão arterial em atenção",
      type: "blood_pressure",
      value: "135/88",
    },
  ],
  planModules: [
    {
      id: "module-1",
      primarySummary: "Treinos 4x por semana",
      secondarySummary: "Condicionamento tratado dentro de Treino",
      title: "Cardio",
      type: "cardio",
    },
  ],
  subscription: {
    cancelAtPeriodEnd: false,
    currentPeriodEnd: "2026-07-08T00:00:00.000Z",
    currentPeriodStart: "2026-06-08T00:00:00.000Z",
    id: "subscription-1",
    planDescription: "Plano personalizado",
    planId: "plan-1",
    planName: "Performance Mensal",
    status: "active",
  },
  tasks: [
    {
      completedAt: null,
      createdAt: "2026-06-20T10:00:00.000Z",
      dueAt: "2026-06-29T12:00:00.000Z",
      id: "task-1",
      priority: "high",
      status: "pending",
      title: "Enviar check-in",
    },
  ],
};

describe("buildPartnerClientOverview", () => {
  it("monta identidade, composição corporal, adesão e alertas", () => {
    const overview = buildPartnerClientOverview(raw, now);

    expect(overview.client).toMatchObject({
      ageLabel: "35 anos",
      genderLabel: "Feminino",
      name: "Ana Ribeiro",
      serviceScopes: ["dieta", "treino"],
      statusLabel: "Ativo",
    });
    expect(overview.weight).toMatchObject({ delta: 3, target: 80, value: 78 });
    expect(overview.bodyFat).toMatchObject({ delta: -3, targetLabel: "12–15%", value: 15 });
    expect(overview.bodyMeasurements[1]).toMatchObject({
      fatMassKg: 11.7,
      leanMassKg: 66.3,
    });
    expect(overview.generalAdherence).toMatchObject({ delta: -15, value: 60 });
    expect(overview.alerts.map((alert) => alert.title)).toEqual(
      expect.arrayContaining(["Pressão arterial em atenção", "Adesão abaixo da meta", "Enviar check-in"]),
    );
  });

  it("agrupa cardio dentro de Treino e mantém histórico ordenado", () => {
    const overview = buildPartnerClientOverview(raw, now);

    expect(overview.plan?.modules[0]).toMatchObject({
      title: "Treino",
      type: "treino",
    });
    expect(overview.history.map((item) => item.title)).toEqual(
      expect.arrayContaining(["Consulta de acompanhamento", "Pressão arterial em atenção", "Renovação"]),
    );
    expect(JSON.stringify(overview)).not.toContain("Cardio");
  });
});
