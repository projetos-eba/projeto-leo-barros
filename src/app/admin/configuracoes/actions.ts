"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import {
  PLATFORM_ASSETS_BUCKET,
  PLATFORM_LOGO_FOLDER,
  normalizePlatformLogo,
  type PlatformLogoSettings,
} from "@/lib/branding/platform-branding-contract";
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

type AdminUserPayload = {
  displayName?: string;
  email?: string;
  status?: string;
  targetProfileId?: string;
};

type AdminUsersEdgeResponse = {
  admin?: {
    activeAdminCount?: number;
    inviteStatus?: string;
    profileId?: string;
    status?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
  requestId?: string;
  status?: string;
};

type SupabaseWriteResult = {
  error: { message: string } | null;
};

type SupabaseWriteClient = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: { value: unknown } | null; error: { message: string } | null }>;
      };
    };
    insert(values: Record<string, unknown> | Record<string, unknown>[]): Promise<SupabaseWriteResult>;
    update(values: Record<string, unknown>): {
      eq(column: string, value: string): Promise<SupabaseWriteResult>;
    };
    upsert(values: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string }): Promise<SupabaseWriteResult>;
  };
  storage: {
    from(bucket: string): {
      remove(paths: string[]): Promise<{ error: { message: string } | null }>;
      upload(path: string, file: File, options?: { contentType?: string; upsert?: boolean }): Promise<{ error: { message: string } | null }>;
    };
  };
};

const logoMimeTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/x-icon", "ico"],
  ["image/vnd.microsoft.icon", "ico"],
]);
const maxLogoSizeBytes = 2 * 1024 * 1024;

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
    logo: normalizePlatformLogo(input.logo),
    maintenanceMessage: input.maintenanceMessage.trim().slice(0, 200),
    maintenanceMode: Boolean(input.maintenanceMode),
    platformDomain: input.platformDomain.trim().slice(0, 120),
    platformName: input.platformName.trim().slice(0, 80),
  };
}

function fileSignatureMatches(bytes: Uint8Array, contentType: string) {
  if (contentType === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }

  if (contentType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (contentType === "image/webp") {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }

  if (contentType === "image/x-icon" || contentType === "image/vnd.microsoft.icon") {
    return bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00;
  }

  return false;
}

async function uploadLogoIfPresent(
  supabase: SupabaseWriteClient,
  logoFile: File | null | undefined,
): Promise<PlatformLogoSettings | null> {
  if (!logoFile || logoFile.size === 0) return null;

  const contentType = logoFile.type;
  const extension = logoMimeTypes.get(contentType);

  if (!extension) {
    throw new Error("Formato de logo nao aceito. Envie PNG, JPG, WEBP ou ICO.");
  }

  if (logoFile.size > maxLogoSizeBytes) {
    throw new Error("Logo muito grande. Envie um arquivo de ate 2 MB.");
  }

  const bytes = new Uint8Array(await logoFile.arrayBuffer());

  if (!fileSignatureMatches(bytes, contentType)) {
    throw new Error("Arquivo de logo invalido.");
  }

  const updatedAt = new Date().toISOString();
  const path = `${PLATFORM_LOGO_FOLDER}/logo-${Date.now()}.${extension}`;
  const upload = await supabase.storage.from(PLATFORM_ASSETS_BUCKET).upload(path, logoFile, {
    contentType,
    upsert: false,
  });

  if (upload.error) throw new Error(`Falha ao enviar logo: ${upload.error.message}`);

  return {
    contentType,
    path,
    sizeBytes: logoFile.size,
    updatedAt,
  };
}

async function fetchCurrentGeneralValue(supabase: SupabaseWriteClient) {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "general")
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data?.value;
}

function revalidateBranding() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/configuracoes");
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

function adminUserErrorMessage(code?: string, fallback?: string) {
  const messages: Record<string, string> = {
    AUTH_REQUIRED: "Sua sessão expirou. Entre novamente para continuar.",
    EMAIL_DELIVERY_FAILED: "Não foi possível enviar o convite.",
    EMAIL_EXISTS: "Já existe um usuário com este e-mail.",
    FORBIDDEN: "Sua conta não possui permissão para esta operação.",
    IDENTITY_RECONCILIATION_REQUIRED: "Existe uma identidade com este e-mail que precisa de revisão manual.",
    INVALID_PAYLOAD: "Revise os dados informados.",
    LAST_ACTIVE_ADMIN: "Não é possível excluir ou inativar o único administrador ativo da plataforma.",
    NOT_FOUND: "Usuário administrativo não encontrado.",
    SELF_DEACTIVATE: "Não é possível inativar a própria conta.",
    SELF_DELETE: "Não é possível excluir a própria conta.",
  };

  return messages[code ?? ""] ?? fallback ?? "Não foi possível concluir a operação.";
}

async function invokeAdminUsersEdge(
  action: "activate" | "create" | "deactivate" | "delete" | "update",
  payload: AdminUserPayload,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (sessionError || !accessToken) {
    return { message: "Sua sessão expirou. Entre novamente para continuar.", ok: false };
  }

  const { publishableKey, url } = getSupabasePublicEnv();
  const response = await fetch(`${url}/functions/v1/admin-users`, {
    body: JSON.stringify({ action, ...payload }),
    cache: "no-store",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const body = (await response.json().catch(() => null)) as AdminUsersEdgeResponse | null;

  if (!response.ok) {
    return {
      message: adminUserErrorMessage(body?.error?.code, body?.error?.message),
      ok: false,
    };
  }

  revalidatePath("/admin/configuracoes");
  return {
    message: action === "create"
      ? "Administrador cadastrado."
      : action === "activate"
      ? "Administrador ativado."
      : action === "deactivate"
      ? "Administrador inativado."
      : action === "delete"
      ? "Usuário administrativo excluído."
      : "Administrador atualizado.",
    ok: true,
  };
}

export async function saveGeneralSettingsAction(
  input: GeneralSettings,
  logoFile?: File | null,
): Promise<ActionResult> {
  try {
    const actorProfileId = await requireAdminProfileId();
    const supabase = (await createClient()) as unknown as SupabaseWriteClient;
    const currentValue = await fetchCurrentGeneralValue(supabase);
    const currentLogo = normalizePlatformLogo(
      currentValue && typeof currentValue === "object" && !Array.isArray(currentValue)
        ? (currentValue as { logo?: unknown }).logo
        : null,
    );
    const uploadedLogo = await uploadLogoIfPresent(supabase, logoFile);
    const general = normalizeGeneral({
      ...input,
      logo: uploadedLogo ?? normalizePlatformLogo(input.logo) ?? currentLogo,
    });

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

    if (uploadedLogo && currentLogo?.path && currentLogo.path !== uploadedLogo.path) {
      await supabase.storage.from(PLATFORM_ASSETS_BUCKET).remove([currentLogo.path]);
    }

    revalidateBranding();
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

    if (section === "general") {
      revalidateBranding();
    } else {
      revalidatePath("/admin/configuracoes");
    }
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
      ? "Teste concluído. Configuração mínima presente."
      : "Teste falhou: preencha pelo menos um campo de configuração.";

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

export async function createAdminUserAction(input: {
  displayName: string;
  email: string;
  status: string;
}): Promise<ActionResult> {
  const displayName = input.displayName.trim().slice(0, 120);
  const email = input.email.trim().toLowerCase();
  const status = input.status.trim();

  if (!displayName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { message: "Revise os dados informados.", ok: false };
  }

  if (!["pending", "active", "suspended", "disabled"].includes(status)) {
    return { message: "Revise os dados informados.", ok: false };
  }

  return invokeAdminUsersEdge("create", { displayName, email, status });
}

export async function updateAdminUserAction(input: {
  displayName: string;
  status: string;
  targetProfileId: string;
}): Promise<ActionResult> {
  const displayName = input.displayName.trim().slice(0, 120);
  const status = input.status.trim();
  const targetProfileId = input.targetProfileId.trim();

  if (!displayName || !targetProfileId || !["pending", "active", "suspended", "disabled"].includes(status)) {
    return { message: "Revise os dados informados.", ok: false };
  }

  return invokeAdminUsersEdge("update", { displayName, status, targetProfileId });
}

export async function activateAdminUserAction(targetProfileId: string): Promise<ActionResult> {
  return invokeAdminUsersEdge("activate", { targetProfileId: targetProfileId.trim() });
}

export async function deactivateAdminUserAction(targetProfileId: string): Promise<ActionResult> {
  return invokeAdminUsersEdge("deactivate", { targetProfileId: targetProfileId.trim() });
}

export async function deleteAdminUserAction(targetProfileId: string): Promise<ActionResult> {
  return invokeAdminUsersEdge("delete", { targetProfileId: targetProfileId.trim() });
}
