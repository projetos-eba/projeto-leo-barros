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
import { resolvePlatformEmailBranding } from "../_shared/platform-branding.ts";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const verificationPurposes = new Set([
  "client_first_access",
  "partner_signup",
  "admin_approval",
]);
const RESEND_COOLDOWN_SECONDS = 60;

type RequestBody = {
  profileId?: unknown;
  purpose?: unknown;
};

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...jsonHeaders, ...corsHeaders },
  });
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return response(405, {
      success: false,
      error: { message: "Metodo nao permitido." },
    });
  }

  try {
    const { serviceRoleKey, supabaseUrl } = getSupabaseAdminEnv();

    let body: RequestBody;
    try {
      body = (await request.json()) as RequestBody;
    } catch {
      return response(400, {
        success: false,
        error: { message: "Requisicao invalida." },
      });
    }
    const profileId = typeof body.profileId === "string" ? body.profileId : "";
    const requestedPurpose = typeof body.purpose === "string"
      ? body.purpose
      : "";

    if (!profileId || !verificationPurposes.has(requestedPurpose)) {
      return response(400, {
        success: false,
        error: { message: "Requisicao invalida." },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, user_id, email, display_name, role, email_confirmed_at, last_auth_flow_at",
      )
      .eq("id", profileId)
      .maybeSingle();

    if (profileError || !profile) {
      return response(404, {
        success: false,
        error: { message: "Conta nao localizada." },
      });
    }

    const now = new Date().toISOString();
    if (profile.email_confirmed_at) {
      return response(200, {
        success: true,
        delivery: "already_confirmed",
      });
    }

    if (profile.last_auth_flow_at) {
      const secondsSinceLastSend = Math.floor(
        (Date.now() - new Date(profile.last_auth_flow_at).getTime()) / 1000,
      );

      if (
        secondsSinceLastSend >= 0 &&
        secondsSinceLastSend < RESEND_COOLDOWN_SECONDS
      ) {
        return response(429, {
          success: false,
          error: {
            message: `Aguarde ${
              RESEND_COOLDOWN_SECONDS - secondsSinceLastSend
            }s para reenviar.`,
          },
        });
      }
    }

    const flags = getAuthEmailFlags();

    if (flags.automaticallyConfirmed) {
      await supabase.auth.admin.updateUserById(profile.user_id, {
        email_confirm: true,
      });
      const profileUpdate: Record<string, string> = {
        email_confirmed_at: now,
        last_auth_flow_at: now,
      };

      if (requestedPurpose === "client_first_access") {
        profileUpdate.first_access_completed_at = now;
      }

      await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", profile.id);

      return response(200, {
        success: true,
        delivery: "bypassed",
      });
    }

    const approvalMode = flags.adminApprovalEnabled;
    const emailAdmin = approvalMode ? getEmailAdmin() : null;
    const branding = await resolvePlatformEmailBranding(supabase);

    await supabase
      .from("email_verification_tokens")
      .update({ consumed_at: now })
      .eq("profile_id", profile.id)
      .eq("purpose", requestedPurpose)
      .is("consumed_at", null);

    const token = randomToken();
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: tokenError } = await supabase
      .from("email_verification_tokens")
      .insert({
        auth_user_id: profile.user_id,
        expires_at: expiresAt,
        profile_id: profile.id,
        purpose: requestedPurpose,
        token_hash: tokenHash,
      });

    if (tokenError) {
      console.error(JSON.stringify({
        code: "EMAIL_VERIFICATION_TOKEN_INSERT_FAILED",
        databaseCode: tokenError.code,
      }));
      throw new Error("TOKEN_INSERT_FAILED");
    }

    const verificationUrl = buildAppUrl("/auth/confirmar-email", { token });
    const to = approvalMode ? emailAdmin! : profile.email;
    const subject = approvalMode
      ? adminApprovalSubject({
        accountEmail: profile.email,
        platformName: branding.platformName,
      })
      : emailConfirmationSubject(branding.platformName);
    const role = profile.role as AuthRole;
    const html = approvalMode
      ? adminApprovalTemplate({
        accountEmail: profile.email,
        platformName: branding.platformName,
        role,
        verificationUrl,
      })
      : emailConfirmationTemplate({
        displayName: profile.display_name,
        platformName: branding.platformName,
        verificationUrl,
      });

    await sendAuthEmail({
      authUserId: profile.user_id,
      flow: approvalMode ? "admin_account_approval" : "email_confirmation",
      html,
      profileId: profile.id,
      requestId: crypto.randomUUID(),
      role,
      subject,
      supabase,
      to,
    });

    await supabase
      .from("profiles")
      .update({ last_auth_flow_at: now })
      .eq("id", profile.id);

    return response(200, {
      success: true,
      delivery: approvalMode ? "admin" : "account_owner",
    });
  } catch (error) {
    console.error(JSON.stringify({
      code: "SEND_VERIFICATION_EMAIL_FAILED",
      message: error instanceof Error ? error.message : "UNKNOWN",
    }));

    return response(500, {
      success: false,
      error: { message: "Nao foi possivel enviar a confirmacao." },
    });
  }
});
