import { describe, expect, it } from "vitest";

import {
  type PartnerDashboardRawData,
  buildPartnerDashboardData,
  monthlyizeCustomPlanPrice,
} from "./dashboard-metrics";

const now = new Date("2026-06-28T12:00:00.000Z");

const rawFixture: PartnerDashboardRawData = {
  clientPlanSubscriptions: [
    {
      cancel_at_period_end: false,
      canceled_at: null,
      created_at: "2026-06-01T10:00:00.000Z",
      current_period_end: "2026-07-05T10:00:00.000Z",
      current_period_start: "2026-06-05T10:00:00.000Z",
      custom_plan_id: "custom-plan-1",
      id: "client-sub-1",
      partner_id: "partner-1",
      patient_id: "patient-1",
      status: "active",
    },
    {
      cancel_at_period_end: false,
      canceled_at: null,
      created_at: "2026-06-01T10:00:00.000Z",
      current_period_end: "2026-06-20T10:00:00.000Z",
      current_period_start: "2026-05-20T10:00:00.000Z",
      custom_plan_id: "custom-plan-2",
      id: "client-sub-2",
      partner_id: "partner-1",
      patient_id: "patient-2",
      status: "past_due",
    },
    {
      cancel_at_period_end: true,
      canceled_at: null,
      created_at: "2026-06-01T10:00:00.000Z",
      current_period_end: "2026-07-10T10:00:00.000Z",
      current_period_start: "2026-06-10T10:00:00.000Z",
      custom_plan_id: "custom-plan-1",
      id: "client-sub-3",
      partner_id: "partner-1",
      patient_id: "patient-3",
      status: "active",
    },
  ],
  customPlans: [
    {
      billing_interval: "monthly",
      currency: "brl",
      id: "custom-plan-1",
      is_active: true,
      name: "Acompanhamento Premium",
      partner_id: "partner-1",
      price_cents: 49000,
    },
    {
      billing_interval: "quarterly",
      currency: "brl",
      id: "custom-plan-2",
      is_active: true,
      name: "Retorno Trimestral",
      partner_id: "partner-1",
      price_cents: 90000,
    },
  ],
  documents: [
    {
      created_at: "2026-06-10T10:00:00.000Z",
      document_type: "contract",
      id: "doc-1",
      status: "pending",
      title: "Contrato",
    },
  ],
  events: [
    {
      created_at: "2026-06-28T10:00:00.000Z",
      detail: "Cliente vinculado ao plano Premium",
      event_type: "subscription_started",
      id: "event-1",
      title: "Plano iniciado",
    },
  ],
  partner: {
    created_at: "2026-05-01T10:00:00.000Z",
    id: "partner-1",
    professional_name: "Dra. Parceira",
    professional_type: "nutricionista",
    profile_id: "profile-1",
  },
  partnerClients: [
    {
      created_at: "2026-05-10T10:00:00.000Z",
      ended_at: null,
      id: "link-1",
      partner_id: "partner-1",
      patient_id: "patient-1",
      service_scope: "nutrition",
      started_at: "2026-05-10T10:00:00.000Z",
      status: "active",
    },
    {
      created_at: "2026-06-02T10:00:00.000Z",
      ended_at: null,
      id: "link-2",
      partner_id: "partner-1",
      patient_id: "patient-2",
      service_scope: "nutrition",
      started_at: "2026-06-02T10:00:00.000Z",
      status: "active",
    },
    {
      created_at: "2026-06-03T10:00:00.000Z",
      ended_at: null,
      id: "link-3",
      partner_id: "partner-1",
      patient_id: "patient-2",
      service_scope: "training",
      started_at: "2026-06-03T10:00:00.000Z",
      status: "active",
    },
  ],
  manualReceivables: [
    {
      amount_cents: 120000,
      due_date: "2026-06-10",
      paid_at: "2026-06-11T10:00:00.000Z",
      status: "paid",
    },
    {
      amount_cents: 50000,
      due_date: "2026-05-10",
      paid_at: "2026-05-11T10:00:00.000Z",
      status: "paid",
    },
  ],
  platformPlans: [
    {
      billing_interval: "monthly",
      id: "platform-plan-1",
      name: "Pro Mensal",
      price_cents: 29900,
    },
  ],
  platformSubscriptions: [
    {
      canceled_at: null,
      created_at: "2026-05-01T10:00:00.000Z",
      current_period_end: "2026-07-01T00:00:00.000Z",
      current_period_start: "2026-06-01T00:00:00.000Z",
      id: "platform-sub-1",
      partner_id: "partner-1",
      plan_id: "platform-plan-1",
      status: "active",
    },
  ],
  profile: {
    display_name: "Parceira",
    email: "partner@example.invalid",
    id: "profile-1",
    status: "active",
  },
  tickets: [
    {
      created_at: "2026-06-10T10:00:00.000Z",
      id: "ticket-1",
      priority: "medium",
      resolved_at: null,
      sla_due_at: "2026-06-30T10:00:00.000Z",
      status: "open",
      subject: "Ajuda",
      ticket_number: "TKT-1",
    },
  ],
};

describe("partner dashboard metrics", () => {
  it("mensaliza planos personalizados trimestrais e anuais", () => {
    expect(monthlyizeCustomPlanPrice(rawFixture.customPlans[1])).toBe(30000);
    expect(monthlyizeCustomPlanPrice({ ...rawFixture.customPlans[1], billing_interval: "yearly", price_cents: 120000 })).toBe(10000);
  });

  it("calcula KPIs e renovações a partir dos dados do parceiro", () => {
    const dashboard = buildPartnerDashboardData(rawFixture, now);

    expect(dashboard.partnerName).toBe("Dra. Parceira");
    expect(dashboard.platformPlanLabel).toBe("Pro Mensal · ativo");
    expect(dashboard.kpis.find((item) => item.id === "activeClients")?.value).toBe("2");
    expect(dashboard.kpis.find((item) => item.id === "newClients")?.value).toBe("1");
    expect(dashboard.kpis.find((item) => item.id === "forecastMrr")?.value).toBe("R$ 1.280");
    expect(dashboard.kpis.find((item) => item.id === "renewalsNext30")?.value).toBe("2");
    expect(dashboard.kpis.find((item) => item.id === "openTickets")?.value).toBe("1");
    expect(dashboard.planDistribution).toEqual([
      expect.objectContaining({ count: 2, label: "Acompanhamento Premium" }),
    ]);
    expect(dashboard.summaryMetrics.find((item) => item.id === "forecastMrr")?.label).toBe("Receita do Mês");
    expect(dashboard.summaryMetrics.find((item) => item.id === "clinicalAlerts")?.value).toBe("3");
    expect(dashboard.performanceMetrics).toEqual([
      expect.objectContaining({ id: "adherenceRate", value: "100%" }),
      expect.objectContaining({ id: "adherentClients", value: "2" }),
      expect.objectContaining({ id: "adherenceTarget", value: "R$ 1.200" }),
    ]);
    expect(dashboard.growth.at(-1)).toEqual(
      expect.objectContaining({
        adherenceRate: 100,
        adherenceTarget: 80,
        adherentClients: 2,
        forecastMrrCents: 128000,
        inactiveClients: 0,
        monthlyRevenueCents: 120000,
      }),
    );
    expect(dashboard.objectiveDistribution[0]).toEqual(expect.objectContaining({ label: "Acompanhamento Premium", value: 100 }));
    expect(dashboard.adherence).toEqual([
      expect.objectContaining({ id: "planCoverage", value: 100 }),
      expect.objectContaining({ id: "renewalHealth", value: 100 }),
    ]);
    expect(dashboard.pendingUpdates).toEqual([
      expect.objectContaining({ actionLabel: "Atualizar", daysLateLabel: "9 dias" }),
    ]);
    expect(dashboard.todayAgenda.length).toBeGreaterThan(0);
    expect(dashboard.renewals).toEqual([
      expect.objectContaining({ status: "Atrasada" }),
      expect.objectContaining({ status: "A renovar" }),
      expect.objectContaining({ status: "Encerramento programado" }),
    ]);
    expect(dashboard.alerts.find((item) => item.id === "overdue-renewals")?.tone).toBe("danger");
    expect(dashboard.movements[0]).toEqual(expect.objectContaining({ title: "Plano iniciado" }));
  });

  it("agrupa cardio dentro do escopo treino quando usa vínculos como distribuição", () => {
    const dashboard = buildPartnerDashboardData(
      {
        ...rawFixture,
        clientPlanSubscriptions: [],
        customPlans: [],
        partnerClients: [
          {
            ...rawFixture.partnerClients[0],
            id: "link-cardio",
            patient_id: "patient-cardio",
            service_scope: "cardio",
          },
          {
            ...rawFixture.partnerClients[1],
            id: "link-treino",
            patient_id: "patient-treino",
            service_scope: "treino",
          },
        ],
      },
      now,
    );

    expect(dashboard.objectiveDistribution).toEqual([
      expect.objectContaining({ count: 2, label: "Treino", value: 100 }),
    ]);
    expect(dashboard.objectiveDistribution.map((item) => item.label)).not.toContain("Cardio");
  });
});
