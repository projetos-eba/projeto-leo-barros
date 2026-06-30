"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";
import {
  defaultGeneralSettings,
  defaultSecuritySettings,
  type GeneralSettings,
  type SecuritySettings,
} from "@/lib/admin/settings-metrics";

type ActionResult = {
  message: string;
  ok: boolean;
};

type IntegrationPayload = {
  config: Record<string, string>;
  integrationKey: string;
  name?: string;
};

type SupabaseWriteResult = {
  error: { message: string } | null;
};

type SupabaseWriteClient = {
  from(table: string): {
    insert(values: Record<string, unknown> | Record<string, unknown>[]): Promise<SupabaseWriteResult>;
    update(values: Record<string, unknown>): {
      eq(column: string, value: string): Promise<SupabaseWriteResult>;
    };
    upsert(values: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string }): Promise<SupabaseWriteResult>;
  };
};

async function requireAdminProfileId() {
  const { profile, reason } = await getCurrentProfile();

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    throw new Error(reason === "missing_session" ? "Sessão expirada." : "Conta sem acesso admin ativo.");
  }

  return profile.id;
}

async function writeActivity(
  supabase: SupabaseWriteClient,
  actorProfileId: string,
  action: string,
  title: string,
  detail: string,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await supabase.from("platform_settings_activity").insert({
    action,
    actor_profile_id: actorProfileId,
    detail,
    metadata,
    title,
  });

  if (error) throw new Error(`Falha ao registrar histórico: ${error.message}`);
}

function normalizeGeneral(input: GeneralSettings): GeneralSettings {
  return {
    maintenanceMessage: input.maintenanceMessage.trim().slice(0, 200),
    maintenanceMode: Boolean(input.maintenanceMode),
    platformDomain: input.platformDomain.trim().slice(0, 120),
    platformName: input.platformName.trim().slice(0, 80),
  };
}

function normalizeSecurity(input: SecuritySettings): SecuritySettings {
  return {
    auditTrailEnabled: Boolean(input.auditTrailEnabled),
    require2fa: Boolean(input.require2fa),
    restrictByIp: Boolean(input.restrictByIp),
    sessionTimeoutMinutes: Math.max(15, Math.min(720, Number(input.sessionTimeoutMinutes) || 120)),
  };
}

function cleanConfig(config: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, String(value).trim().slice(0, 180)]),
  );
}

export async function saveGeneralSettingsAction(input: GeneralSettings): Promise<ActionResult> {
  try {
    const actorProfileId = await requireAdminProfileId();
    const supabase = (await createClient()) as unknown as SupabaseWriteClient;
    const general = normalizeGeneral(input);

    const { error } = await supabase.from("platform_settings").upsert({
      key: "general",
      updated_by_profile_id: actorProfileId,
      value: general,
    }, { onConflict: "key" });

    if (error) throw new Error(error.message);

    await writeActivity(
      supabase,
      actorProfileId,
      "settings_general_saved",
      "Configurações gerais atualizadas",
      `Nome da plataforma definido como ${general.platformName}.`,
      { section: "general" },
    );

    revalidatePath("/admin/configuracoes");
    return { message: "Configurações gerais salvas.", ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Falha ao salvar configurações gerais.", ok: false };
  }
}

export async function saveSecuritySettingsAction(input: SecuritySettings): Promise<ActionResult> {
  try {
    const actorProfileId = await requireAdminProfileId();
    const supabase = (await createClient()) as unknown as SupabaseWriteClient;
    const security = normalizeSecurity(input);

    const { error } = await supabase.from("platform_settings").upsert({
      key: "security",
      updated_by_profile_id: actorProfileId,
      value: security,
    }, { onConflict: "key" });

    if (error) throw new Error(error.message);

    await writeActivity(
      supabase,
      actorProfileId,
      "settings_security_saved",
      "Política de segurança atualizada",
      `Tempo de sessão definido em ${security.sessionTimeoutMinutes} minutos.`,
      { section: "security" },
    );

    revalidatePath("/admin/configuracoes");
    return { message: "Configurações de segurança salvas.", ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Falha ao salvar segurança.", ok: false };
  }
}

export async function restoreSettingsSectionAction(section: "general" | "security"): Promise<ActionResult> {
  try {
    const actorProfileId = await requireAdminProfileId();
    const supabase = (await createClient()) as unknown as SupabaseWriteClient;
    const value = section === "general" ? defaultGeneralSettings : defaultSecuritySettings;

    const { error } = await supabase.from("platform_settings").upsert({
      key: section,
      updated_by_profile_id: actorProfileId,
      value,
    }, { onConflict: "key" });

    if (error) throw new Error(error.message);

    await writeActivity(
      supabase,
      actorProfileId,
      `settings_${section}_restored`,
      "Configurações restauradas",
      section === "general" ? "Configurações gerais voltaram ao padrão." : "Configurações de segurança voltaram ao padrão.",
      { section },
    );

    revalidatePath("/admin/configuracoes");
    return { message: "Padrão restaurado.", ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Falha ao restaurar padrão.", ok: false };
  }
}

export async function saveIntegrationAction(payload: IntegrationPayload): Promise<ActionResult> {
  try {
    const actorProfileId = await requireAdminProfileId();
    const supabase = (await createClient()) as unknown as SupabaseWriteClient;
    const config = cleanConfig(payload.config);
    const hasAnyConfig = Object.values(config).some((value) => value.length > 0);

    const { error } = await supabase.from("platform_integrations").update({
      config,
      last_test_message: hasAnyConfig ? "Configuração salva. Execute um teste para validar." : "Aguardando configuração.",
      last_test_status: "untested",
      status: hasAnyConfig ? "inactive" : "needs_config",
    }).eq("integration_key", payload.integrationKey);

    if (error) throw new Error(error.message);

    await writeActivity(
      supabase,
      actorProfileId,
      "settings_integration_saved",
      "Integração configurada",
      `${payload.name ?? payload.integrationKey} teve a configuração atualizada.`,
      { integrationKey: payload.integrationKey },
    );

    revalidatePath("/admin/configuracoes");
    return { message: "Integração salva.", ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Falha ao salvar integração.", ok: false };
  }
}

export async function addIntegrationAction(input: { category: string; name: string }): Promise<ActionResult> {
  try {
    const actorProfileId = await requireAdminProfileId();
    const supabase = (await createClient()) as unknown as SupabaseWriteClient;
    const name = input.name.trim().slice(0, 80);
    const category = input.category.trim().slice(0, 60) || "Customizada";

    if (!name) {
      return { message: "Informe o nome da integração.", ok: false };
    }

    const integrationKey = `custom_${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;

    const { error } = await supabase.from("platform_integrations").upsert({
      category,
      config: {},
      integration_key: integrationKey,
      last_test_message: "Aguardando configuração.",
      last_test_status: "untested",
      name,
      status: "needs_config",
    }, { onConflict: "integration_key" });

    if (error) throw new Error(error.message);

    await writeActivity(
      supabase,
      actorProfileId,
      "settings_integration_added",
      "Integração adicionada",
      `${name} foi adicionada ao catálogo de integrações.`,
      { integrationKey },
    );

    revalidatePath("/admin/configuracoes");
    return { message: "Integração adicionada.", ok: true };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Falha ao adicionar integração.", ok: false };
  }
}

export async function testIntegrationAction(payload: IntegrationPayload): Promise<ActionResult> {
  try {
    const actorProfileId = await requireAdminProfileId();
    const supabase = (await createClient()) as unknown as SupabaseWriteClient;
    const config = cleanConfig(payload.config);
    const configuredFields = Object.values(config).filter((value) => value.length > 0).length;
    const success = configuredFields > 0 || payload.integrationKey === "storage";
    const message = success
      ? "Teste local concluído. Configuração mínima presente."
      : "Teste local falhou: preencha pelo menos um campo de configuração.";

    const { error } = await supabase.from("platform_integrations").update({
      config,
      last_test_message: message,
      last_test_status: success ? "success" : "failed",
      last_tested_at: new Date().toISOString(),
      status: success ? "active" : "needs_config",
    }).eq("integration_key", payload.integrationKey);

    if (error) throw new Error(error.message);

    await writeActivity(
      supabase,
      actorProfileId,
      "settings_integration_tested",
      success ? "Integração testada" : "Teste de integração falhou",
      `${payload.name ?? payload.integrationKey}: ${message}`,
      { integrationKey: payload.integrationKey, success },
    );

    revalidatePath("/admin/configuracoes");
    return { message, ok: success };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Falha ao testar integração.", ok: false };
  }
}
