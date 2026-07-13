import { describe, expect, it } from "vitest";

import {
  type AdminClientsRawData,
  buildAdminClientsData,
} from "./clients-metrics";

const now = new Date("2026-06-28T12:00:00.000Z");

const rawFixture: AdminClientsRawData = {
  clientProfiles: [
    {
      created_at: "2026-06-01T10:00:00.000Z",
      display_name: "Cliente Ativo",
      email: "ativo@example.invalid",
      id: "client-profile-1",
      role: "cliente",
      status: "active",
      updated_at: "2026-06-20T10:00:00.000Z",
    },
    {
      created_at: "2026-06-02T10:00:00.000Z",
      display_name: "Cliente Sem Vinculo",
      email: "sem-vinculo@example.invalid",
      id: "client-profile-2",
      role: "cliente",
      status: "active",
      updated_at: "2026-06-20T10:00:00.000Z",
    },
    {
      created_at: "2026-06-03T10:00:00.000Z",
      display_name: "Cliente Profissional Inativo",
      email: "inativo@example.invalid",
      id: "client-profile-3",
      role: "cliente",
      status: "active",
      updated_at: "2026-06-20T10:00:00.000Z",
    },
  ],
  partnerProfiles: [
    {
      created_at: "2026-05-01T10:00:00.000Z",
      display_name: "Ana Profissional",
      email: "ana@example.invalid",
      id: "partner-profile-1",
      role: "parceiro",
      status: "active",
      updated_at: "2026-06-20T10:00:00.000Z",
    },
    {
      created_at: "2026-05-01T10:00:00.000Z",
      display_name: "Bruno Inativo",
      email: "bruno@example.invalid",
      id: "partner-profile-2",
      role: "parceiro",
      status: "disabled",
      updated_at: "2026-06-20T10:00:00.000Z",
    },
  ],
  partners: [
    {
      created_at: "2026-05-01T10:00:00.000Z",
      id: "partner-1",
      professional_name: "Ana Profissional",
      professional_type: "nutricionista",
      profile_id: "partner-profile-1",
    },
    {
      created_at: "2026-05-01T10:00:00.000Z",
      id: "partner-2",
      professional_name: "Bruno Inativo",
      professional_type: "personal_trainer",
      profile_id: "partner-profile-2",
    },
  ],
  patients: [
    {
      birth_date: null,
      created_at: "2026-06-01T10:00:00.000Z",
      id: "patient-1",
      objective: null,
      phone: "+5511999990001",
      profile_id: "client-profile-1",
      updated_at: "2026-06-20T10:00:00.000Z",
    },
    {
      birth_date: null,
      created_at: "2026-06-02T10:00:00.000Z",
      id: "patient-2",
      objective: null,
      phone: null,
      profile_id: "client-profile-2",
      updated_at: "2026-06-20T10:00:00.000Z",
    },
    {
      birth_date: null,
      created_at: "2026-06-03T10:00:00.000Z",
      id: "patient-3",
      objective: null,
      phone: null,
      profile_id: "client-profile-3",
      updated_at: "2026-06-20T10:00:00.000Z",
    },
  ],
  relationships: [
    {
      created_at: "2026-06-05T10:00:00.000Z",
      ended_at: null,
      id: "link-1",
      partner_id: "partner-1",
      patient_id: "patient-1",
      service_scope: "dieta",
      started_at: "2026-06-05T10:00:00.000Z",
      status: "active",
      updated_at: "2026-06-05T10:00:00.000Z",
    },
    {
      created_at: "2026-06-06T10:00:00.000Z",
      ended_at: null,
      id: "link-2",
      partner_id: "partner-1",
      patient_id: "patient-1",
      service_scope: "treino",
      started_at: "2026-06-06T10:00:00.000Z",
      status: "active",
      updated_at: "2026-06-06T10:00:00.000Z",
    },
    {
      created_at: "2026-06-07T10:00:00.000Z",
      ended_at: null,
      id: "link-3",
      partner_id: "partner-2",
      patient_id: "patient-3",
      service_scope: "dieta",
      started_at: "2026-06-07T10:00:00.000Z",
      status: "active",
      updated_at: "2026-06-07T10:00:00.000Z",
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
  ],
};

describe("clients metrics", () => {
  it("conta clientes distintos apenas em profissionais efetivamente ativos", () => {
    const data = buildAdminClientsData(rawFixture, now);

    expect(data.kpis.find((item) => item.id === "activeClients")?.value).toBe("1");
    expect(data.kpis.find((item) => item.id === "newClients")?.value).toBe("1");
    expect(data.tabCounts.active).toBe(1);
    expect(data.tabCounts.unassigned).toBe(2);
    expect(data.clients.find((client) => client.id === "patient-1")).toEqual(expect.objectContaining({
      activeLinksCount: 2,
      statusLabel: "Ativo",
    }));
    expect(data.clients.find((client) => client.id === "patient-3")).toEqual(expect.objectContaining({
      primaryPartnerLabel: "Bruno Inativo",
      statusLabel: "Sem vínculo ativo",
    }));
  });

  it("monta distribuição e ranking sem expor domínio clínico", () => {
    const data = buildAdminClientsData(rawFixture, now);

    expect(data.statusDistribution).toEqual([
      expect.objectContaining({ count: 1, label: "Ativo" }),
      expect.objectContaining({ count: 2, label: "Sem vínculo ativo" }),
      expect.objectContaining({ count: 0, label: "Inativo" }),
    ]);
    expect(data.topProfessionals).toEqual([
      expect.objectContaining({ clientsCount: 1, name: "Ana Profissional", specialtyLabel: "Nutrição" }),
    ]);
  });
});
