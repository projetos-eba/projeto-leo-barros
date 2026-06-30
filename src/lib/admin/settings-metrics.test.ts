import { describe, expect, it } from "vitest";

import {
  buildAdminSettingsData,
  defaultGeneralSettings,
  defaultSecuritySettings,
  mergeGeneralSettings,
  mergeSecuritySettings,
  type SettingsRawData,
} from "./settings-metrics";

const raw: SettingsRawData = {
  activities: [
    {
      action: "settings_general_saved",
      actor_profile_id: "profile-admin",
      created_at: "2026-06-29T12:00:00.000Z",
      detail: "Domínio principal atualizado.",
      id: "activity-1",
      metadata: {},
      title: "Configurações gerais atualizadas",
    },
  ],
  admins: [
    {
      display_name: "Super Admin",
      email: "admin@example.invalid",
      id: "profile-admin",
      status: "active",
    },
  ],
  integrations: [
    {
      category: "Pagamentos",
      config: { mode: "test", publicKeyRef: "pk_live_ref" },
      created_at: "2026-06-29T12:00:00.000Z",
      id: "integration-1",
      integration_key: "stripe_billing",
      last_test_message: "Configuração mínima presente.",
      last_test_status: "success",
      last_tested_at: "2026-06-29T12:30:00.000Z",
      name: "Stripe Billing",
      status: "active",
      updated_at: "2026-06-29T12:30:00.000Z",
    },
  ],
  settings: [
    {
      key: "general",
      updated_at: "2026-06-29T12:00:00.000Z",
      updated_by_profile_id: "profile-admin",
      value: {
        maintenanceMessage: "Voltamos em breve.",
        maintenanceMode: true,
        platformDomain: "admin.leonardobarros.com.br",
        platformName: "LB Performance",
      },
    },
  ],
};

describe("settings-metrics", () => {
  it("mescla defaults quando valores salvos não existem", () => {
    expect(mergeGeneralSettings(undefined)).toEqual(defaultGeneralSettings);
    expect(mergeSecuritySettings(undefined)).toEqual(defaultSecuritySettings);
  });

  it("normaliza dados administrativos, integrações e histórico", () => {
    const settings = buildAdminSettingsData(raw, new Date("2026-06-29T13:00:00.000Z"));

    expect(settings.general).toMatchObject({
      maintenanceMode: true,
      platformDomain: "admin.leonardobarros.com.br",
      platformName: "LB Performance",
    });
    expect(settings.security).toEqual(defaultSecuritySettings);
    expect(settings.integrations.find((item) => item.key === "stripe_billing")).toMatchObject({
      configuredFields: ["mode", "publicKeyRef"],
      statusLabel: "Conectado",
      statusTone: "success",
    });
    expect(settings.activities[0]).toMatchObject({
      detail: "Domínio principal atualizado.",
      title: "Configurações gerais atualizadas",
    });
    expect(settings.admins[0]).toMatchObject({
      email: "admin@example.invalid",
      statusLabel: "Ativo",
    });
  });
});
