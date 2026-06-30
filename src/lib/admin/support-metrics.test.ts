import { describe, expect, it } from "vitest";

import { buildAdminSupportData, type SupportRawData } from "./support-metrics";

const now = new Date("2026-06-29T12:00:00.000Z");

const raw: SupportRawData = {
  partners: [
    {
      id: "partner-1",
      professional_name: "Patricia Lima",
      professional_type: "nutricionista",
      profile_id: "profile-1",
    },
    {
      id: "partner-2",
      professional_name: "Bruno Lima",
      professional_type: "personal_trainer",
      profile_id: "profile-2",
    },
  ],
  profiles: [
    {
      display_name: "Patricia Lima",
      email: "patricia@example.invalid",
      id: "profile-1",
      status: "active",
    },
    {
      display_name: "Bruno Lima",
      email: "bruno@example.invalid",
      id: "profile-2",
      status: "active",
    },
  ],
  tickets: [
    {
      created_at: "2026-06-29T08:00:00.000Z",
      id: "ticket-1",
      opened_by_profile_id: "profile-1",
      partner_id: "partner-1",
      priority: "urgent",
      resolved_at: null,
      sla_due_at: "2026-06-29T10:00:00.000Z",
      status: "open",
      subject: "Integração com Google Ads",
      ticket_number: "TKT-001",
      updated_at: "2026-06-29T08:20:00.000Z",
    },
    {
      created_at: "2026-06-28T08:00:00.000Z",
      id: "ticket-2",
      opened_by_profile_id: "profile-2",
      partner_id: "partner-2",
      priority: "medium",
      resolved_at: null,
      sla_due_at: "2026-06-30T10:00:00.000Z",
      status: "in_progress",
      subject: "Relatório de funil não carrega",
      ticket_number: "TKT-002",
      updated_at: "2026-06-28T09:00:00.000Z",
    },
  ],
};

describe("buildAdminSupportData", () => {
  it("calcula SLA, atraso e enriquece tickets com dados do profissional", () => {
    const support = buildAdminSupportData(raw, now);

    expect(support.delayedCount).toBe(1);
    expect(support.kpis.find((item) => item.id === "openTickets")?.value).toBe("2");
    expect(support.kpis.find((item) => item.id === "sla")?.value).toBe("50%");
    expect(support.tickets[0]).toMatchObject({
      category: "Integrações",
      email: "patricia@example.invalid",
      priorityLabel: "Crítica",
      professionalName: "Patricia Lima",
      slaLabel: "Atrasado",
      statusLabel: "Novo",
    });
  });
});
