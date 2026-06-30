import type { Json } from "@/lib/supabase/database.types";

export type SettingsSection = "general" | "integrations" | "security" | "users";

export type PlatformSettingRecord = {
  key: string;
  value: Json;
  updated_at: string;
  updated_by_profile_id: string | null;
};

export type PlatformIntegrationRecord = {
  category: string;
  config: Json;
  created_at: string;
  id: string;
  integration_key: string;
  last_test_message: string | null;
  last_test_status: "success" | "failed" | "untested" | null;
  last_tested_at: string | null;
  name: string;
  status: "active" | "inactive" | "needs_config";
  updated_at: string;
};

export type PlatformSettingsActivityRecord = {
  action: string;
  actor_profile_id: string | null;
  created_at: string;
  detail: string;
  id: string;
  metadata: Json;
  title: string;
};

export type SettingsAdminProfileRecord = {
  display_name: string;
  email: string;
  id: string;
  status: string;
};

export type SettingsRawData = {
  activities: PlatformSettingsActivityRecord[];
  admins: SettingsAdminProfileRecord[];
  integrations: PlatformIntegrationRecord[];
  settings: PlatformSettingRecord[];
};

export type GeneralSettings = {
  maintenanceMessage: string;
  maintenanceMode: boolean;
  platformDomain: string;
  platformName: string;
};

export type SecuritySettings = {
  auditTrailEnabled: boolean;
  require2fa: boolean;
  restrictByIp: boolean;
  sessionTimeoutMinutes: number;
};

export type SettingsIntegration = {
  category: string;
  configuredFields: string[];
  config: Record<string, string>;
  id: string;
  key: string;
  lastTestLabel: string;
  lastTestMessage: string;
  name: string;
  status: PlatformIntegrationRecord["status"];
  statusLabel: string;
  statusTone: "danger" | "neutral" | "success" | "warning";
};

export type SettingsActivity = {
  action: string;
  actor: string;
  createdAt: string;
  detail: string;
  id: string;
  title: string;
  tone: "danger" | "info" | "success" | "warning";
};

export type SettingsAdminUser = {
  email: string;
  id: string;
  name: string;
  status: string;
  statusLabel: string;
};

export type AdminSettingsData = {
  activities: SettingsActivity[];
  admins: SettingsAdminUser[];
  generatedAt: string;
  general: GeneralSettings;
  integrations: SettingsIntegration[];
  security: SecuritySettings;
};

export const defaultGeneralSettings: GeneralSettings = {
  maintenanceMessage: "Estamos realizando manutencoes programadas. Voltaremos em breve.",
  maintenanceMode: false,
  platformDomain: "app.leonardobarros.com.br",
  platformName: "Leonardo Barros",
};

export const defaultSecuritySettings: SecuritySettings = {
  auditTrailEnabled: true,
  require2fa: true,
  restrictByIp: false,
  sessionTimeoutMinutes: 120,
};

export const defaultIntegrations = [
  {
    category: "Pagamentos",
    config: { mode: "test", publicKeyRef: "" },
    integration_key: "stripe_billing",
    name: "Stripe Billing",
    status: "needs_config" as const,
  },
  {
    category: "Comunicação",
    config: { provider: "resend", senderDomain: "" },
    integration_key: "transactional_email",
    name: "E-mail transacional",
    status: "needs_config" as const,
  },
  {
    category: "Atendimento",
    config: { provider: "whatsapp_business", phoneNumberId: "" },
    integration_key: "whatsapp_support",
    name: "WhatsApp / Atendimento",
    status: "needs_config" as const,
  },
  {
    category: "Arquivos",
    config: { bucket: "platform-assets", region: "local" },
    integration_key: "storage",
    name: "Storage",
    status: "active" as const,
  },
  {
    category: "API",
    config: { endpoint: "", signingKeyRef: "" },
    integration_key: "webhooks_api",
    name: "Webhooks / API",
    status: "needs_config" as const,
  },
];

function isRecord(value: unknown): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: Json, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function booleanValue(value: Json, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function numberValue(value: Json, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function jsonToStringRecord(value: Json): Record<string, string> {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      typeof item === "string" || typeof item === "number" || typeof item === "boolean"
        ? String(item)
        : "",
    ]),
  );
}

export function mergeGeneralSettings(value: Json | undefined): GeneralSettings {
  if (!isRecord(value)) return defaultGeneralSettings;

  return {
    maintenanceMessage: stringValue(value.maintenanceMessage, defaultGeneralSettings.maintenanceMessage),
    maintenanceMode: booleanValue(value.maintenanceMode, defaultGeneralSettings.maintenanceMode),
    platformDomain: stringValue(value.platformDomain, defaultGeneralSettings.platformDomain),
    platformName: stringValue(value.platformName, defaultGeneralSettings.platformName),
  };
}

export function mergeSecuritySettings(value: Json | undefined): SecuritySettings {
  if (!isRecord(value)) return defaultSecuritySettings;

  return {
    auditTrailEnabled: booleanValue(value.auditTrailEnabled, defaultSecuritySettings.auditTrailEnabled),
    require2fa: booleanValue(value.require2fa, defaultSecuritySettings.require2fa),
    restrictByIp: booleanValue(value.restrictByIp, defaultSecuritySettings.restrictByIp),
    sessionTimeoutMinutes: Math.max(15, Math.min(720, numberValue(value.sessionTimeoutMinutes, defaultSecuritySettings.sessionTimeoutMinutes))),
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status: PlatformIntegrationRecord["status"]) {
  if (status === "active") return "Conectado";
  if (status === "inactive") return "Inativo";
  return "Configurar";
}

function statusTone(status: PlatformIntegrationRecord["status"]): SettingsIntegration["statusTone"] {
  if (status === "active") return "success";
  if (status === "inactive") return "neutral";
  return "warning";
}

function activityTone(action: string): SettingsActivity["tone"] {
  if (action.includes("security")) return "danger";
  if (action.includes("integration")) return "info";
  if (action.includes("restore")) return "warning";
  return "success";
}

export function buildAdminSettingsData(raw: SettingsRawData, now = new Date()): AdminSettingsData {
  const settingsByKey = new Map(raw.settings.map((setting) => [setting.key, setting.value]));
  const integrationsByKey = new Map(raw.integrations.map((integration) => [integration.integration_key, integration]));

  const integrations = defaultIntegrations.map((fallback) => {
    const saved = integrationsByKey.get(fallback.integration_key);
    const config = jsonToStringRecord(saved?.config ?? fallback.config);
    const configuredFields = Object.entries(config)
      .filter(([, value]) => value.trim().length > 0)
      .map(([key]) => key);

    return {
      category: saved?.category ?? fallback.category,
      config,
      configuredFields,
      id: saved?.id ?? fallback.integration_key,
      key: fallback.integration_key,
      lastTestLabel: saved?.last_tested_at ? formatDateTime(saved.last_tested_at) : "Ainda não testado",
      lastTestMessage: saved?.last_test_message ?? "Nenhum teste executado.",
      name: saved?.name ?? fallback.name,
      status: saved?.status ?? fallback.status,
      statusLabel: statusLabel(saved?.status ?? fallback.status),
      statusTone: statusTone(saved?.status ?? fallback.status),
    };
  });

  return {
    activities: raw.activities.map((activity) => ({
      action: activity.action,
      actor: "Super Admin",
      createdAt: formatDateTime(activity.created_at),
      detail: activity.detail,
      id: activity.id,
      title: activity.title,
      tone: activityTone(activity.action),
    })),
    admins: raw.admins.map((admin) => ({
      email: admin.email,
      id: admin.id,
      name: admin.display_name,
      status: admin.status,
      statusLabel: admin.status === "active" ? "Ativo" : admin.status === "suspended" ? "Suspenso" : "Inativo",
    })),
    generatedAt: now.toISOString(),
    general: mergeGeneralSettings(settingsByKey.get("general")),
    integrations,
    security: mergeSecuritySettings(settingsByKey.get("security")),
  };
}
