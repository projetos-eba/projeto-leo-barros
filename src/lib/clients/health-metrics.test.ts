import { describe, expect, it } from "vitest";

import { buildClientHealth, type ClientHealthRawData } from "./health-metrics";

const raw: ClientHealthRawData = {
  actions: [
    { completedAt: "2026-07-03T08:04:00.000Z", detail: "Dose única", key: "vitamin_d", status: "completed", time: "08:00", title: "Tomar Vitamina D" },
    { completedAt: "2026-07-03T20:35:00.000Z", detail: "1 cápsula", key: "omega_3", status: "completed", time: "20:30", title: "Tomar Ômega 3 à noite" },
    { completedAt: null, detail: null, key: "pressure", status: "pending", time: "12:30", title: "Registrar pressão" },
    { completedAt: null, detail: null, key: "exam_review", status: "pending", time: null, title: "Revisar exame de Vitamina D" },
    { completedAt: "2026-07-03T12:00:00.000Z", detail: "Meta: 2L de água", key: "hydration", status: "completed", time: "21:00", title: "Manter hidratação" },
  ],
  appointments: [{ id: "appointment", startsAt: "2026-07-08T13:30:00.000Z", status: "scheduled", title: "Consulta de acompanhamento" }],
  client: { avatarUrl: null, id: "ana", name: "Ana Ribeiro", objective: "Hipertrofia" },
  dailyLog: { hydrationMl: 2100, sleepDeepMinutes: 72, sleepEfficiencyPct: 84, sleepLatencyMinutes: 12, sleepMinutes: 462 },
  examResults: [
    { collectedAt: "2026-07-02", name: "Vitamina D", status: "low", unit: "ng/mL", value: 28 },
    { collectedAt: "2026-07-02", name: "Hemograma completo", status: "normal", unit: "g/dL", value: 13.1 },
  ],
  generatedAt: "2026-07-03T12:00:00.000Z",
  medications: [
    { dosage: "2000 UI", id: "med-1", logStatus: "completed", name: "Vitamina D", scheduleTime: "08:00", takenAt: "2026-07-03T08:04:00.000Z" },
    { dosage: "200 mg", id: "med-2", logStatus: null, name: "Magnésio", scheduleTime: "22:00", takenAt: null },
  ],
  observations: [{ detail: "Resultado baixo.", id: "obs", occurredAt: "2026-07-01T12:00:00.000Z", severity: "attention", title: "Vitamina D baixa", type: "exam", value: "28 ng/mL" }],
  pressureLogs: [{ diastolic: 78, measuredAt: "2026-07-03T11:30:00.000Z", systolic: 122 }],
  selectedDate: "2026-07-03",
};

describe("buildClientHealth", () => {
  it("mapeia cuidado diário, consulta, medicações e exames do Cliente", () => {
    const health = buildClientHealth(raw);

    expect(health.client.firstName).toBe("Ana");
    expect(health.care.completed).toBe(3);
    expect(health.care.total).toBe(5);
    expect(health.nextAction?.key).toBe("pressure");
    expect(health.nextAppointment?.title).toBe("Consulta de acompanhamento");
    expect(health.sleep.efficiency).toBe(84);
    expect(health.medications.pendingCount).toBe(1);
    expect(health.exams.alertCount).toBe(1);
    expect(health.timeline[0]?.tone).toBe("orange");
  });
});
