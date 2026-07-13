import { describe, expect, it } from "vitest";

import { buildPartnerAgendaData } from "./agenda-metrics";
import type { PartnerAgendaRawData } from "./agenda-metrics";

const raw: PartnerAgendaRawData = {
  appointments: [
    {
      appointment_type: "consulta",
      avatar_url: null,
      birth_date: "1991-05-12",
      display_name: "Ana Ribeiro",
      email: "ana@example.invalid",
      ends_at: "2026-06-30T15:00:00.000Z",
      gender: "female",
      id: "appt-1",
      location_text: null,
      modality: "online",
      notes: "Revisar adesão.",
      objective: "Hipertrofia",
      patient_id: "a1000000-0000-4000-8000-000000000301",
      phone: "+5511999999999",
      reminder_minutes: 30,
      starts_at: "2026-06-30T14:00:00.000Z",
      status: "pending",
      title: "Consulta de acompanhamento",
    },
    {
      appointment_type: "retorno",
      avatar_url: null,
      birth_date: "1992-01-10",
      display_name: "Bruno Carvalho",
      email: "bruno@example.invalid",
      ends_at: "2026-07-01T11:00:00.000Z",
      gender: "male",
      id: "appt-2",
      location_text: "Clínica Salvador",
      modality: "presencial",
      notes: null,
      objective: "Emagrecimento",
      patient_id: "a1000000-0000-4000-8000-000000000302",
      phone: null,
      reminder_minutes: 60,
      starts_at: "2026-07-01T10:00:00.000Z",
      status: "scheduled",
      title: "Retorno presencial",
    },
  ],
  blocks: [
    {
      ends_at: "2026-06-30T13:00:00.000Z",
      id: "block-1",
      reason: "Pausa",
      starts_at: "2026-06-30T12:00:00.000Z",
      status: "active",
      title: "Intervalo",
    },
  ],
  clients: [
    {
      age_years: 35,
      display_name: "Ana Ribeiro",
      email: "ana@example.invalid",
      patient_id: "a1000000-0000-4000-8000-000000000301",
      phone: "+5511999999999",
      relationship_status: "active",
      service_scopes: ["dieta", "cardio"],
    },
  ],
  partner: {
    id: "partner-1",
    professionalName: "Antonio Ferrari",
    professionalType: "nutricionista",
  },
};

describe("buildPartnerAgendaData", () => {
  it("agrupa compromissos por mês, semana e dia sem expor Cardio", () => {
    const agenda = buildPartnerAgendaData(raw, new Date("2026-06-30T09:00:00.000Z"));

    expect(agenda.partnerName).toBe("Antonio Ferrari");
    expect(agenda.selectedDate).toBe("2026-06-30");
    expect(agenda.selectedDayAppointments).toHaveLength(1);
    expect(agenda.selectedDayBlocks).toHaveLength(1);
    expect(agenda.monthDays.some((day) => day.date === "2026-06-30" && day.appointments.length === 1)).toBe(true);
    expect(agenda.weekDays.some((day) => day.date === "2026-06-30" && day.blocks.length === 1)).toBe(true);
    expect(agenda.clients[0].scopeLabel).toBe("Dieta + Treino");
  });

  it("calcula resumo e próximos atendimentos", () => {
    const agenda = buildPartnerAgendaData(raw, new Date("2026-06-30T09:00:00.000Z"));

    expect(agenda.summary.totalCount).toBe(2);
    expect(agenda.summary.pendingCount).toBe(1);
    expect(agenda.summary.onlineCount).toBe(1);
    expect(agenda.summary.presencialCount).toBe(1);
    expect(agenda.nextAppointments.map((appointment) => appointment.id)).toEqual(["appt-1", "appt-2"]);
  });
});
