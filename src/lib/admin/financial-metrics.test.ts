import { describe, expect, it } from "vitest";

import {
  type FinancialRawData,
  buildAdminFinancialData,
  monthlyizePlanPrice,
} from "./financial-metrics";

const now = new Date("2026-06-28T12:00:00.000Z");

const rawFixture: FinancialRawData = {
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
    {
      created_at: "2026-05-01T10:00:00.000Z",
      id: "partner-3",
      professional_name: "Parceiro Inativo",
      professional_type: "medico",
      profile_id: "profile-3",
    },
  ],
  payments: [
    {
      amount_cents: 29900,
      currency: "brl",
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
      currency: "brl",
      due_at: "2026-06-07T10:00:00.000Z",
      id: "payment-2",
      paid_at: null,
      partner_id: "partner-2",
      payment_kind: "renewal",
      status: "failed",
      subscription_id: "sub-2",
    },
    {
      amount_cents: 19900,
      currency: "brl",
      due_at: "2026-05-07T10:00:00.000Z",
      id: "payment-3",
      paid_at: "2026-05-07T10:00:00.000Z",
      partner_id: "partner-2",
      payment_kind: "renewal",
      status: "succeeded",
      subscription_id: "sub-2",
    },
    {
      amount_cents: 19900,
      currency: "brl",
      due_at: "2026-06-12T10:00:00.000Z",
      id: "payment-4",
      paid_at: "2026-06-12T10:00:00.000Z",
      partner_id: "partner-2",
      payment_kind: "initial",
      status: "succeeded",
      subscription_id: "sub-2",
    },
    {
      amount_cents: 5000,
      currency: "brl",
      due_at: "2026-06-13T10:00:00.000Z",
      id: "payment-5",
      paid_at: "2026-06-13T10:00:00.000Z",
      partner_id: "partner-1",
      payment_kind: "manual_adjustment",
      status: "succeeded",
      subscription_id: "sub-1",
    },
  ],
  plans: [
    {
      billing_interval: "monthly",
      currency: "brl",
      id: "plan-pro",
      is_active: true,
      name: "Pro Mensal",
      price_cents: 29900,
      slug: "pro",
    },
    {
      billing_interval: "yearly",
      currency: "brl",
      id: "plan-premium",
      is_active: true,
      name: "Premium Anual",
      price_cents: 238800,
      slug: "premium",
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
    {
      created_at: "2026-05-01T10:00:00.000Z",
      display_name: "Parceiro Inativo",
      email: "inactive@example.invalid",
      id: "profile-3",
      role: "parceiro",
      status: "disabled",
    },
  ],
  subscriptions: [
    {
      cancel_at_period_end: false,
      canceled_at: null,
      created_at: "2026-05-01T10:00:00.000Z",
      current_period_end: "2026-07-01T00:00:00.000Z",
      current_period_start: "2026-06-01T00:00:00.000Z",
      id: "sub-1",
      partner_id: "partner-1",
      plan_id: "plan-pro",
      status: "active",
    },
    {
      cancel_at_period_end: false,
      canceled_at: null,
      created_at: "2026-05-01T10:00:00.000Z",
      current_period_end: "2026-07-01T00:00:00.000Z",
      current_period_start: "2026-06-01T00:00:00.000Z",
      id: "sub-2",
      partner_id: "partner-2",
      plan_id: "plan-premium",
      status: "active",
    },
    {
      cancel_at_period_end: false,
      canceled_at: null,
      created_at: "2026-06-01T10:00:00.000Z",
      current_period_end: "2026-07-01T00:00:00.000Z",
      current_period_start: "2026-06-01T00:00:00.000Z",
      id: "sub-3",
      partner_id: "partner-3",
      plan_id: "plan-pro",
      status: "trialing",
    },
  ],
};

describe("financial metrics", () => {
  it("mensaliza plano anual para MRR financeiro", () => {
    expect(monthlyizePlanPrice(rawFixture.plans[1])).toBe(19900);
  });

  it("calcula KPIs financeiros usando apenas profissionais efetivamente ativos", () => {
    const financial = buildAdminFinancialData(rawFixture, now);

    expect(financial.kpis.find((item) => item.id === "mrr")?.value).toBe("R$ 498");
    expect(financial.kpis.find((item) => item.id === "arr")?.value).toBe("R$ 5.976");
    expect(financial.kpis.find((item) => item.id === "activeSubscriptions")?.value).toBe("2");
    expect(financial.kpis.find((item) => item.id === "delinquency")?.value).toBe("50%");
    expect(financial.recentRows.find((item) => item.id === "sub-3")?.status).toBe("Pendente");
    expect(financial.recentRows.some((item) => item.status === "Teste")).toBe(false);
    expect(financial.revenueByKind).toEqual([
      expect.objectContaining({ label: "Renovações", value: 29900 }),
      expect.objectContaining({ label: "Assinaturas do mês", value: 19900 }),
    ]);
    expect(financial.revenueByKind.some((item) => item.label === "Ajustes manuais")).toBe(false);
    expect(financial.planDistribution).toEqual([
      expect.objectContaining({ count: 1, label: "Pro Mensal" }),
      expect.objectContaining({ count: 1, label: "Premium Anual" }),
    ]);
  });
});
