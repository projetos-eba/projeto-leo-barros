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

const allowedFields = new Set(["confirmPassword", "email", "password"]);

type JsonRecord = Record<string, unknown>;
type AdminSupabaseClient = ReturnType<typeof createClient<EdgeDatabase>>;

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

function rawStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

async function sendVerification({
  displayName,
  email,
  profileId,
  requestId,
  role,
  supabase,
  userId,
}: {
  displayName: string | null;
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
        first_access_completed_at: now,
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
    .eq("purpose", "client_first_access")
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
      purpose: "client_first_access",
      token_hash: tokenHash,
    });

  if (tokenError) {
    console.error(JSON.stringify({
      code: "CLIENT_FIRST_ACCESS_VERIFICATION_TOKEN_INSERT_FAILED",
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
    .update({
      email_confirmed_at: null,
      last_auth_flow_at: now,
    })
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
      "Nao foi possivel iniciar o primeiro acesso. Verifique os dados ou fale com seu profissional.",
      origin,
    );
  }

  const unknownFields = Object.keys(rawBody).filter(
    (field) => !allowedFields.has(field),
  );
  const fields: Record<string, string> = Object.fromEntries(
    unknownFields.map((field) => [field, "unknown"]),
  );
  const email = stringValue(rawBody.email).toLowerCase();
  const password = rawStringValue(rawBody.password);
  const confirmPassword = rawStringValue(rawBody.confirmPassword);

  if (!isValidEmail(email)) fields.email = "invalid";
  if (password.length < 8 || password.length > 72) fields.password = "invalid";
  if (confirmPassword !== password) fields.confirmPassword = "invalid";

  if (Object.keys(fields).length > 0) {
    return errorResponse(
      400,
      requestId,
      "INVALID_PAYLOAD",
      "Nao foi possivel iniciar o primeiro acesso. Verifique os dados ou fale com seu profissional.",
      origin,
      fields,
    );
  }

  try {
    const { serviceRoleKey, supabaseUrl } = getSupabaseAdminEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, role, status, user_id")
      .ilike("email", email)
      .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.role !== "cliente" ||
      profile.status !== "active"
    ) {
      return errorResponse(
        400,
        requestId,
        "FIRST_ACCESS_DENIED",
        "Nao foi possivel iniciar o primeiro acesso. Verifique os dados ou fale com seu profissional.",
        origin,
      );
    }

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (patientError || !patient) {
      return errorResponse(
        400,
        requestId,
        "FIRST_ACCESS_DENIED",
        "Nao foi possivel iniciar o primeiro acesso. Verifique os dados ou fale com seu profissional.",
        origin,
      );
    }

    const { data: relationship, error: relationshipError } = await supabase
      .from("partner_clients")
      .select("id")
      .eq("patient_id", patient.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (relationshipError || !relationship) {
      return errorResponse(
        400,
        requestId,
        "FIRST_ACCESS_DENIED",
        "Nao foi possivel iniciar o primeiro acesso. Verifique os dados ou fale com seu profissional.",
        origin,
      );
    }

    const { error: passwordError } = await supabase.auth.admin.updateUserById(
      profile.user_id,
      { password },
    );

    if (passwordError) {
      throw new Error("AUTH_PASSWORD_UPDATE_FAILED");
    }

    const delivery = await sendVerification({
      displayName: profile.display_name,
      email,
      profileId: profile.id,
      requestId,
      role: "cliente",
      supabase,
      userId: profile.user_id,
    });

    return response(
      200,
      requestId,
      {
        success: true,
        delivery,
        profileId: profile.id,
      },
      origin,
    );
  } catch (error) {
    console.error(JSON.stringify({
      code: "COMPLETE_CLIENT_FIRST_ACCESS_FAILED",
      message: error instanceof Error ? error.message : "UNKNOWN",
      requestId,
    }));

    return errorResponse(
      500,
      requestId,
      "FIRST_ACCESS_FAILED",
      "Nao foi possivel iniciar o primeiro acesso. Verifique os dados ou fale com seu profissional.",
      origin,
    );
  }
});
