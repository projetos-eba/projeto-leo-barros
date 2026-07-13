import { createClient } from "npm:@supabase/supabase-js@2.98.0";

import {
  type AuthRole,
  buildAppUrl,
  getAuthEmailFlags,
  getEmailAdmin,
  getSupabaseAdminEnv,
} from "../_shared/env.ts";
import { sendAuthEmail } from "../_shared/email/email-gateway.ts";
import {
  adminApprovalSubject,
  adminApprovalTemplate,
  emailConfirmationSubject,
  emailConfirmationTemplate,
} from "../_shared/email/email-templates.ts";
import type { EdgeDatabase } from "../_shared/edge-database.ts";
import { resolvePlatformEmailBranding } from "../_shared/platform-branding.ts";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const allowedFields = new Set([
  "displayName",
  "email",
  "password",
  "phone",
  "professionalRegistryNumber",
  "professionalRegistryType",
  "professionalType",
]);

const professionalTypes = new Set([
  "personal_trainer",
  "nutricionista",
  "medico",
]);

const professionalRegistryTypes = new Set(["cref", "crm", "crn", "outro"]);

type JsonRecord = Record<string, unknown>;
type AdminSupabaseClient = ReturnType<typeof createClient<EdgeDatabase>>;

type SignupRecordIds = {
  authUserId?: string;
  partnerId?: string;
  profileId?: string;
};

function allowedOrigins() {
  const configured = Deno.env.get("PROVISIONING_ALLOWED_ORIGINS")?.trim();

  return new Set(
    (configured ||
      "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (origin && allowedOrigins().has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function response(
  status: number,
  requestId: string,
  body: JsonRecord,
  origin: string | null,
) {
  return new Response(JSON.stringify({ requestId, ...body }), {
    status,
    headers: {
      ...jsonHeaders,
      ...corsHeaders(origin),
    },
  });
}

function errorResponse(
  status: number,
  requestId: string,
  code: string,
  message: string,
  origin: string | null,
  fields?: Record<string, string>,
) {
  return response(
    status,
    requestId,
    { success: false, error: { code, message, fields } },
    origin,
  );
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  return /^\+[1-9][0-9]{7,14}$/.test(value);
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function rollbackSignup(
  supabase: AdminSupabaseClient,
  { authUserId, partnerId, profileId }: SignupRecordIds,
) {
  const rollbackErrors: string[] = [];
  const runRollbackStep = async (
    label: string,
    step: () => Promise<unknown>,
  ) => {
    try {
      await step();
    } catch (error) {
      rollbackErrors.push(label);
      console.error(JSON.stringify({
        code: "SIGNUP_PARTNER_ROLLBACK_STEP_FAILED",
        label,
        message: error instanceof Error ? error.message : "UNKNOWN",
      }));
    }
  };

  if (profileId) {
    await runRollbackStep("email_verification_tokens", async () => {
      await supabase
        .from("email_verification_tokens")
        .delete()
        .eq("profile_id", profileId);
    });
  }

  if (partnerId) {
    await runRollbackStep("platform_activity_events", async () => {
      await supabase
        .from("platform_activity_events")
        .delete()
        .eq("partner_id", partnerId)
        .eq("event_type", "partner_created");
    });
    await runRollbackStep("partners", async () => {
      await supabase.from("partners").delete().eq("id", partnerId);
    });
  }

  if (profileId) {
    await runRollbackStep("profiles", async () => {
      await supabase.from("profiles").delete().eq("id", profileId);
    });
  }

  if (authUserId) {
    await runRollbackStep("auth_user", async () => {
      await supabase.auth.admin.deleteUser(authUserId);
    });
  }

  if (rollbackErrors.length > 0) {
    throw new Error("SIGNUP_PARTNER_ROLLBACK_INCOMPLETE");
  }
}

async function sendVerification({
  displayName,
  email,
  profileId,
  requestId,
  role,
  supabase,
  userId,
}: {
  displayName: string;
  email: string;
  profileId: string;
  requestId: string;
  role: AuthRole;
  supabase: AdminSupabaseClient;
  userId: string;
}) {
  const now = new Date().toISOString();
  const flags = getAuthEmailFlags();

  if (flags.automaticallyConfirmed) {
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      { email_confirm: true },
    );

    if (authError) {
      throw new Error("AUTH_EMAIL_CONFIRM_FAILED");
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        email_confirmed_at: now,
        last_auth_flow_at: now,
      })
      .eq("id", profileId);

    if (profileError) {
      throw new Error("PROFILE_EMAIL_CONFIRM_FAILED");
    }

    return "bypassed";
  }

  await supabase
    .from("email_verification_tokens")
    .update({ consumed_at: now })
    .eq("profile_id", profileId)
    .eq("purpose", "partner_signup")
    .is("consumed_at", null);

  const token = randomToken();
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error: tokenError } = await supabase
    .from("email_verification_tokens")
    .insert({
      auth_user_id: userId,
      expires_at: expiresAt,
      profile_id: profileId,
      purpose: "partner_signup",
      token_hash: tokenHash,
    });

  if (tokenError) {
    console.error(JSON.stringify({
      code: "SIGNUP_PARTNER_TOKEN_INSERT_FAILED",
      databaseCode: tokenError.code,
      requestId,
    }));
    throw new Error("TOKEN_INSERT_FAILED");
  }

  const approvalMode = flags.adminApprovalEnabled;
  const branding = await resolvePlatformEmailBranding(supabase);
  const verificationUrl = buildAppUrl("/auth/confirmar-email", { token });
  const to = approvalMode ? getEmailAdmin() : email;
  const subject = approvalMode
    ? adminApprovalSubject({
      accountEmail: email,
      platformName: branding.platformName,
    })
    : emailConfirmationSubject(branding.platformName);
  const html = approvalMode
    ? adminApprovalTemplate({
      accountEmail: email,
      platformName: branding.platformName,
      role,
      verificationUrl,
    })
    : emailConfirmationTemplate({
      displayName,
      platformName: branding.platformName,
      verificationUrl,
    });

  await sendAuthEmail({
    authUserId: userId,
    flow: approvalMode ? "admin_account_approval" : "email_confirmation",
    html,
    profileId,
    requestId,
    role,
    subject,
    supabase,
    to,
  });

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ last_auth_flow_at: now })
    .eq("id", profileId);

  if (profileError) {
    throw new Error("PROFILE_LAST_AUTH_FLOW_UPDATE_FAILED");
  }

  return approvalMode ? "admin" : "account_owner";
}

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();
  const origin = request.headers.get("origin");

  if (origin && !allowedOrigins().has(origin)) {
    return errorResponse(
      403,
      requestId,
      "ORIGIN_NOT_ALLOWED",
      "Origem nao permitida.",
      null,
    );
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  if (request.method !== "POST") {
    return errorResponse(
      405,
      requestId,
      "METHOD_NOT_ALLOWED",
      "Metodo nao permitido.",
      origin,
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse(
      400,
      requestId,
      "INVALID_JSON",
      "Requisicao invalida.",
      origin,
    );
  }

  if (!isRecord(rawBody)) {
    return errorResponse(
      400,
      requestId,
      "INVALID_PAYLOAD",
      "Revise os dados informados para concluir o cadastro.",
      origin,
    );
  }

  const unknownFields = Object.keys(rawBody).filter(
    (field) => !allowedFields.has(field),
  );
  const fields: Record<string, string> = Object.fromEntries(
    unknownFields.map((field) => [field, "unknown"]),
  );

  const displayName = stringValue(rawBody.displayName);
  const email = stringValue(rawBody.email).toLowerCase();
  const password = stringValue(rawBody.password);
  const phone = stringValue(rawBody.phone);
  const professionalRegistryNumber = stringValue(
    rawBody.professionalRegistryNumber,
  );
  const professionalRegistryType = stringValue(rawBody.professionalRegistryType)
    .toLowerCase();
  const professionalType = stringValue(rawBody.professionalType);
  const hasRegistryNumber = professionalRegistryNumber.length > 0;
  const hasRegistryType = professionalRegistryType.length > 0;

  if (!displayName || displayName.length > 120) {
    fields.displayName = "invalid";
  }
  if (!isValidEmail(email)) fields.email = "invalid";
  if (password.length < 8 || password.length > 72) fields.password = "invalid";
  if (!isValidPhone(phone)) fields.phone = "invalid";
  if (!professionalTypes.has(professionalType)) {
    fields.professionalType = "invalid";
  }
  if (
    hasRegistryType &&
    !professionalRegistryTypes.has(professionalRegistryType)
  ) {
    fields.professionalRegistryType = "invalid";
  }
  if (hasRegistryNumber !== hasRegistryType) {
    fields.professionalRegistryType = hasRegistryType
      ? fields.professionalRegistryType ?? "invalid"
      : "required";
    fields.professionalRegistryNumber = hasRegistryNumber
      ? fields.professionalRegistryNumber ?? "invalid"
      : "required";
  }
  if (professionalRegistryNumber.length > 64) {
    fields.professionalRegistryNumber = "invalid";
  }

  if (Object.keys(fields).length > 0) {
    return errorResponse(
      400,
      requestId,
      "INVALID_PAYLOAD",
      "Revise os dados informados para concluir o cadastro.",
      origin,
      fields,
    );
  }

  let ids: SignupRecordIds = {};

  try {
    const { serviceRoleKey, supabaseUrl } = getSupabaseAdminEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existingProfile, error: existingProfileError } =
      await supabase
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

    if (existingProfileError) {
      throw new Error("PROFILE_LOOKUP_FAILED");
    }

    if (existingProfile) {
      return errorResponse(
        409,
        requestId,
        "EMAIL_ALREADY_REGISTERED",
        "Este e-mail ja possui cadastro.",
        origin,
      );
    }

    const { data: authUser, error: authError } = await supabase.auth.admin
      .createUser({
        email,
        email_confirm: false,
        password,
      });

    if (authError || !authUser.user) {
      const message = authError?.message?.toLowerCase() ?? "";
      const isExistingEmail = message.includes("already") ||
        message.includes("registered") ||
        message.includes("exists");

      return errorResponse(
        isExistingEmail ? 409 : 500,
        requestId,
        isExistingEmail ? "EMAIL_ALREADY_REGISTERED" : "AUTH_CREATE_FAILED",
        isExistingEmail
          ? "Este e-mail ja possui cadastro."
          : "Nao foi possivel concluir o cadastro. Tente novamente.",
        origin,
      );
    }
    ids = { authUserId: authUser.user.id };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        display_name: displayName,
        email,
        phone,
        role: "parceiro",
        status: "active",
        user_id: authUser.user.id,
      })
      .select("id")
      .single();

    if (profileError || !profile) {
      throw new Error("PROFILE_INSERT_FAILED");
    }
    ids = { ...ids, profileId: profile.id };

    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .insert({
        professional_name: displayName,
        professional_registry_number: hasRegistryNumber
          ? professionalRegistryNumber
          : null,
        professional_registry_type: hasRegistryType
          ? professionalRegistryType
          : null,
        professional_type: professionalType,
        profile_id: profile.id,
      })
      .select("id")
      .single();

    if (partnerError || !partner) {
      throw new Error("PARTNER_INSERT_FAILED");
    }
    ids = { ...ids, partnerId: partner.id };

    const delivery = await sendVerification({
      displayName,
      email,
      profileId: profile.id,
      requestId,
      role: "parceiro",
      supabase,
      userId: authUser.user.id,
    });

    const { error: activityError } = await supabase
      .from("platform_activity_events")
      .insert({
        detail: "Cadastro publico de parceiro recebido.",
        event_type: "partner_created",
        metadata: { source: "public_signup" },
        partner_id: partner.id,
        title: "Parceiro cadastrado",
      });

    if (activityError) {
      console.error(JSON.stringify({
        code: "SIGNUP_PARTNER_ACTIVITY_EVENT_FAILED",
        databaseCode: activityError.code,
        requestId,
      }));
    }

    return response(
      201,
      requestId,
      {
        success: true,
        delivery,
        partnerId: partner.id,
        profileId: profile.id,
      },
      origin,
    );
  } catch (error) {
    console.error(JSON.stringify({
      code: "SIGNUP_PARTNER_FAILED",
      message: error instanceof Error ? error.message : "UNKNOWN",
      requestId,
    }));

    try {
      const { serviceRoleKey, supabaseUrl } = getSupabaseAdminEnv();
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      await rollbackSignup(supabase, ids);
    } catch (rollbackError) {
      console.error(JSON.stringify({
        code: "SIGNUP_PARTNER_ROLLBACK_FAILED",
        message: rollbackError instanceof Error
          ? rollbackError.message
          : "UNKNOWN",
        requestId,
      }));
    }

    return errorResponse(
      500,
      requestId,
      "SIGNUP_FAILED",
      "Nao foi possivel concluir o cadastro. Tente novamente.",
      origin,
    );
  }
});
