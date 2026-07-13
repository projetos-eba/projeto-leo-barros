import { describe, expect, it } from "vitest";

import {
  type AdminProfessionalsRawData,
  buildAdminProfessionalsData,
} from "./professionals-metrics";

const now = new Date("2026-06-28T12:00:00.000Z");

const rawFixture: AdminProfessionalsRawData = {
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
  ],
  plans: [
    {
      billing_interval: "monthly",
      currency: "brl",
      id: "plan-1",
      name: "Pro Mensal",
      price_cents: 29900,
      slug: "pro-monthly",
    },
  ],
  professionals: [
    {
      created_at: "2026-05-01T10:00:00.000Z",
      id: "partner-1",
      professional_name: "Ana Local",
      professional_registry_number: null,
      professional_registry_type: null,
      professional_type: "nutricionista",
      profile_id: "profile-1",
    },
    {
      created_at: "2026-06-20T10:00:00.000Z",
      id: "partner-2",
      professional_name: "Bruno Local",
      professional_registry_number: null,
      professional_registry_type: null,
      professional_type: "personal_trainer",
      profile_id: "profile-2",
    },
    {
      created_at: "2026-05-20T10:00:00.000Z",
      id: "partner-3",
      professional_name: "Clara Local",
      professional_registry_number: null,
      professional_registry_type: null,
      professional_type: "medico",
      profile_id: "profile-3",
    },
  ],
  profiles: [
    {
      created_at: "2026-05-01T10:00:00.000Z",
      display_name: "Ana Local",
      email: "ana@example.invalid",
      id: "profile-1",
      phone: "+5511999999991",
      role: "parceiro",
      status: "active",
      updated_at: "2026-06-01T10:00:00.000Z",
    },
    {
      created_at: "2026-06-20T10:00:00.000Z",
      display_name: "Bruno Local",
      email: "bruno@example.invalid",
      id: "profile-2",
      phone: "+5511999999992",
      role: "parceiro",
      status: "suspended",
      updated_at: "2026-06-20T10:00:00.000Z",
    },
    {
      created_at: "2026-05-20T10:00:00.000Z",
      display_name: "Clara Local",
      email: "clara@example.invalid",
      id: "profile-3",
      phone: "+5511999999993",
      role: "parceiro",
      status: "disabled",
      updated_at: "2026-06-20T10:00:00.000Z",
    },
  ],
  relationships: [
    {
      created_at: "2026-06-02T10:00:00.000Z",
      ended_at: null,
      partner_id: "partner-1",
      patient_id: "patient-1",
      started_at: "2026-06-02T10:00:00.000Z",
      status: "active",
    },
    {
      created_at: "2026-06-03T10:00:00.000Z",
      ended_at: null,
      partner_id: "partner-1",
      patient_id: "patient-2",
      started_at: "2026-06-03T10:00:00.000Z",
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
      plan_id: "plan-1",
      status: "active",
    },
    {
      canceled_at: null,
      created_at: "2026-06-20T10:00:00.000Z",
      current_period_end: "2026-07-20T00:00:00.000Z",
      current_period_start: "2026-06-20T00:00:00.000Z",
      id: "sub-2",
      partner_id: "partner-2",
      plan_id: "plan-1",
      status: "past_due",
    },
  ],
};

describe("professionals metrics", () => {
  it("calcula gestão SaaS sem aprovação documental como regra central", () => {
    const data = buildAdminProfessionalsData(rawFixture, now);

    expect(data.kpis.find((item) => item.id === "active")?.value).toBe("1");
    expect(data.kpis.find((item) => item.id === "activeSubscriptions")?.value).toBe("1");
    expect(data.kpis.find((item) => item.id === "averageRevenue")?.value.replace(/\s/u, " ")).toBe("R$ 299,00");
    expect(data.professionals[0]).toEqual(expect.objectContaining({
      clientsCount: 2,
      planLabel: "Pro Mensal",
      statusLabel: "Ativo",
      subscriptionLabel: "Ativa",
    }));
    expect(data.professionals[1]).toEqual(expect.objectContaining({
      statusLabel: "Suspenso",
      subscriptionLabel: "Pagamento pendente",
    }));
    expect(data.statusDistribution).toEqual([
      expect.objectContaining({ count: 1, label: "Ativo" }),
      expect.objectContaining({ count: 1, label: "Suspenso" }),
      expect.objectContaining({ count: 1, label: "Inativo" }),
    ]);
    expect(data.recentSubscriptions[0]).toEqual(expect.objectContaining({
      name: "Bruno Local",
      status: "Pagamento pendente",
    }));
  });
});
