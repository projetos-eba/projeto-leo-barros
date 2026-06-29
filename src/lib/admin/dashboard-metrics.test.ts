import { describe, expect, it } from "vitest";

import {
  type DashboardRawData,
  buildAdminDashboardData,
  isSubscriptionActiveAt,
  monthlyizePlanPrice,
} from "./dashboard-metrics";

const now = new Date("2026-06-28T12:00:00.000Z");

const rawFixture: DashboardRawData = {
  documents: [
    {
      created_at: "2026-06-15T10:00:00.000Z",
      document_type: "professional_registry",
      id: "doc-1",
      partner_id: "partner-1",
      status: "pending",
      title: "Registro profissional",
    },
  ],
  events: [
    {
      created_at: "2026-06-28T10:00:00.000Z",
      detail: "Plano Pro Mensal",
      event_type: "subscription_started",
      id: "event-1",
      partner_id: "partner-1",
      title: "Assinatura ativada",
    },
  ],
  partnerClients: [
    {
      created_at: "2026-06-03T10:00:00.000Z",
      ended_at: null,
      partner_id: "partner-1",
      patient_id: "patient-1",
      started_at: "2026-06-03T10:00:00.000Z",
      status: "active",
    },
    {
      created_at: "2026-06-04T10:00:00.000Z",
      ended_at: null,
      partner_id: "partner-1",
      patient_id: "patient-1",
      started_at: "2026-06-04T10:00:00.000Z",
      status: "active",
    },
    {
      created_at: "2026-05-10T10:00:00.000Z",
      ended_at: null,
      partner_id: "partner-2",
      patient_id: "patient-2",
      started_at: "2026-05-10T10:00:00.000Z",
      status: "active",
    },
  ],
  partners: [
    {
      created_at: "2026-05-01T10:00:00.000Z",
      id: "partner-1",
      professional_name: "Parceira Um",
      professional_type: "nutricionista",
      profile_id: "profile-1",
    },
    {
      created_at: "2026-05-01T10:00:00.000Z",
      id: "partner-2",
      professional_name: "Parceiro Dois",
      professional_type: "personal_trainer",
      profile_id: "profile-2",
    },
  ],
  payments: [
    {
      amount_cents: 29900,
      due_at: "2026-06-05T10:00:00.000Z",
      id: "payment-1",
      paid_at: "2026-06-05T10:00:00.000Z",
      partner_id: "partner-1",
      payment_kind: "renewal",
      status: "succeeded",
      subscription_id: "sub-1",
    },
    {
      amount_cents: 19900,
      due_at: "2026-06-06T10:00:00.000Z",
      id: "payment-2",
      paid_at: null,
      partner_id: "partner-2",
      payment_kind: "renewal",
      status: "failed",
      subscription_id: "sub-2",
    },
    {
      amount_cents: 19900,
      due_at: "2026-05-06T10:00:00.000Z",
      id: "payment-3",
      paid_at: "2026-05-06T10:00:00.000Z",
      partner_id: "partner-2",
      payment_kind: "renewal",
      status: "succeeded",
      subscription_id: "sub-2",
    },
  ],
  plans: [
    {
      billing_interval: "monthly",
      currency: "brl",
      id: "plan-monthly",
      name: "Pro Mensal",
      price_cents: 29900,
      slug: "pro-monthly",
    },
    {
      billing_interval: "yearly",
      currency: "brl",
      id: "plan-yearly",
      name: "Pro Anual",
      price_cents: 238800,
      slug: "pro-yearly",
    },
  ],
  profiles: [
    {
      created_at: "2026-05-01T10:00:00.000Z",
      display_name: "Parceira Um",
      email: "partner-1@example.invalid",
      id: "profile-1",
      role: "parceiro",
      status: "active",
    },
    {
      created_at: "2026-05-01T10:00:00.000Z",
      display_name: "Parceiro Dois",
      email: "partner-2@example.invalid",
      id: "profile-2",
      role: "parceiro",
      status: "active",
    },
  ],
  subscriptions: [
    {
      canceled_at: null,
      created_at: "2026-05-01T10:00:00.000Z",
      current_period_end: "2026-07-01T00:00:00.000Z",
      current_period_start: "2026-06-01T00:00:00.000Z",
      id: "sub-1",
      partner_id: "partner-1",
      plan_id: "plan-monthly",
      status: "active",
    },
    {
      canceled_at: null,
      created_at: "2026-05-01T10:00:00.000Z",
      current_period_end: "2026-07-01T00:00:00.000Z",
      current_period_start: "2026-06-01T00:00:00.000Z",
      id: "sub-2",
      partner_id: "partner-2",
      plan_id: "plan-yearly",
      status: "active",
    },
  ],
  tickets: [
    {
      created_at: "2026-06-10T10:00:00.000Z",
      id: "ticket-1",
      partner_id: "partner-1",
      priority: "medium",
      resolved_at: null,
      sla_due_at: "2026-06-30T10:00:00.000Z",
      status: "open",
      subject: "Dúvida",
      ticket_number: "TKT-1",
    },
    {
      created_at: "2026-06-08T10:00:00.000Z",
      id: "ticket-2",
      partner_id: "partner-2",
      priority: "medium",
      resolved_at: "2026-06-09T10:00:00.000Z",
      sla_due_at: "2026-06-10T10:00:00.000Z",
      status: "resolved",
      subject: "Resolvido",
      ticket_number: "TKT-2",
    },
  ],
};

describe("dashboard metrics", () => {
  it("mensaliza planos anuais para MRR", () => {
    expect(monthlyizePlanPrice(rawFixture.plans[1])).toBe(19900);
  });

  it("detecta assinatura ativa por período e status comercial", () => {
    expect(isSubscriptionActiveAt(rawFixture.subscriptions[0], now)).toBe(true);
    expect(
      isSubscriptionActiveAt(
        { ...rawFixture.subscriptions[0], status: "canceled", canceled_at: "2026-06-02T00:00:00.000Z" },
        now,
      ),
    ).toBe(false);
  });

  it("calcula KPIs reais a partir das tabelas operacionais", () => {
    const dashboard = buildAdminDashboardData(rawFixture, now);

    expect(dashboard.kpis.find((item) => item.id === "activePartners")?.value).toBe("2");
    expect(dashboard.kpis.find((item) => item.id === "activeClients")?.value).toBe("2");
    expect(dashboard.kpis.find((item) => item.id === "mrr")?.value).toBe("R$ 498");
    expect(dashboard.kpis.find((item) => item.id === "openTickets")?.value).toBe("1");
    expect(dashboard.kpis.find((item) => item.id === "renewalRate")?.value).toBe("50%");
    expect(dashboard.health.find((item) => item.id === "ticketsSla")?.value).toBe("100%");
    expect(dashboard.planDistribution).toEqual([
      expect.objectContaining({ count: 1, label: "Pro Mensal" }),
      expect.objectContaining({ count: 1, label: "Pro Anual" }),
    ]);
    expect(dashboard.approvals[0]).toEqual(expect.objectContaining({ email: "partner-1@example.invalid" }));
    expect(dashboard.movements[0]).toEqual(expect.objectContaining({ title: "Assinatura ativada" }));
  });
});
