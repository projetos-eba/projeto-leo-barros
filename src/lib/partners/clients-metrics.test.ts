import { describe, expect, it } from "vitest";

import { buildPartnerClientsData } from "./clients-metrics";
import type { PartnerClientsRawData } from "./clients-metrics";

const now = new Date("2026-06-30T12:00:00.000Z");

const raw: PartnerClientsRawData = {
  customPlans: [
    {
      billing_interval: "monthly",
      id: "plan-1",
      is_active: true,
      name: "Mensal Performance",
      partner_id: "partner-1",
      price_cents: 39000,
    },
  ],
  clientPlanSubscriptions: [
    {
      cancel_at_period_end: false,
      canceled_at: null,
      created_at: "2026-06-01T00:00:00.000Z",
      current_period_end: "2026-07-08T00:00:00.000Z",
      current_period_start: "2026-06-08T00:00:00.000Z",
      custom_plan_id: "plan-1",
      id: "sub-1",
      partner_id: "partner-1",
      patient_id: "patient-1",
      status: "active",
    },
    {
      cancel_at_period_end: false,
      canceled_at: null,
      created_at: "2026-06-01T00:00:00.000Z",
      current_period_end: "2026-07-20T00:00:00.000Z",
      current_period_start: "2026-06-20T00:00:00.000Z",
      custom_plan_id: "plan-other",
      id: "sub-other",
      partner_id: "partner-other",
      patient_id: "patient-other",
      status: "active",
    },
  ],
  rows: [
    {
      age_years: 28,
      display_name: "Carlos Eduardo Santos",
      email: "carlos@example.invalid",
      last_update_at: "2026-06-30T09:30:00.000Z",
      objective: "Hipertrofia",
      patient_id: "patient-1",
      phone: "+5511999999999",
      profile_id: "profile-1",
      relationship_status: "active",
      service_scopes: ["treino", "cardio"],
      started_at: "2026-06-01T00:00:00.000Z",
    },
    {
      age_years: null,
      display_name: "Mariana Costa",
      email: "mariana@example.invalid",
      last_update_at: "2026-06-26T09:30:00.000Z",
      objective: null,
      patient_id: "patient-2",
      phone: null,
      profile_id: "profile-2",
      relationship_status: "disabled",
      service_scopes: ["dieta"],
      started_at: "2026-05-01T00:00:00.000Z",
    },
  ],
};

describe("buildPartnerClientsData", () => {
  it("monta clientes do parceiro com idade, escopos, renovação e status", () => {
    const data = buildPartnerClientsData(raw, now);

    expect(data.totalCount).toBe(2);
    expect(data.activeCount).toBe(1);
    expect(data.tabCounts.inactive).toBe(1);
    expect(data.rows[0]).toMatchObject({
      ageLabel: "28 anos",
      email: "carlos@example.invalid",
      name: "Carlos Eduardo Santos",
      objectiveLabel: "Hipertrofia",
      planSummaryLabel: "Mensal Performance",
      renewalLabel: "8 dias",
      serviceScopeLabel: "Treino",
      status: "active",
    });
  });

  it("usa escopo como fallback de objetivo e ignora assinaturas de outro parceiro sem plano conhecido", () => {
    const data = buildPartnerClientsData(raw, now);
    const mariana = data.rows.find((row) => row.name === "Mariana Costa");

    expect(mariana).toMatchObject({
      ageLabel: "Sem idade",
      objectiveLabel: "Dieta",
      phoneLabel: "Sem telefone",
      planSummaryLabel: "Sem plano",
      renewalLabel: "Sem renovação",
      status: "inactive",
    });
    expect(data.rows.map((row) => row.name)).not.toContain("Cliente de outro parceiro");
  });
});
