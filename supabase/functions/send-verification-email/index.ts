import { createClient } from "npm:@supabase/supabase-js@2.98.0";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const verificationPurposes = new Set([
  "client_first_access",
  "partner_signup",
  "admin_approval",
]);

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

function envFlag(name: string) {
  return Deno.env.get(name)?.toLowerCase() === "true";
}

function appUrl() {
  return (
    Deno.env.get("APP_URL") ??
    Deno.env.get("NEXT_PUBLIC_APP_URL") ??
    "http://localhost:3000"
  ).replace(/\/+$/, "");
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

async function sendEmail({
  html,
  subject,
  to,
}: {
  html: string;
  subject: string;
  to: string;
}) {
  const apiKey = Deno.env.get("RESEND_API_KEY");

  if (!apiKey) {
    throw new Error("RESEND_API_KEY_NOT_CONFIGURED");
  }

  const from = Deno.env.get("RESEND_FROM") ?? "Leo Barros <onboarding@resend.dev>";
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      html,
      subject,
      to: [to],
    }),
  });

  if (!resendResponse.ok) {
    const errorBody = await resendResponse.text();
    console.error(JSON.stringify({
      code: "RESEND_SEND_FAILED",
      status: resendResponse.status,
      bodyLength: errorBody.length,
    }));
    throw new Error("RESEND_SEND_FAILED");
  }
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_ADMIN_ENV_NOT_CONFIGURED");
    }

    const body = (await request.json()) as RequestBody;
    const profileId = typeof body.profileId === "string" ? body.profileId : "";
    const requestedPurpose =
      typeof body.purpose === "string" ? body.purpose : "";

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
      .select("id, user_id, email, display_name, role")
      .eq("id", profileId)
      .maybeSingle();

    if (profileError || !profile) {
      return response(404, {
        success: false,
        error: { message: "Conta nao localizada." },
      });
    }

    const now = new Date().toISOString();

    if (envFlag("CONFIRMED_AUTOMATICALLY_EMAIL")) {
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

    const approvalMode = envFlag("ALL_ACCOUNT_CREATE_APPROVAL_ADM");
    const emailAdmin = Deno.env.get("EMAIL_ADMIN");

    if (approvalMode && !emailAdmin) {
      throw new Error("EMAIL_ADMIN_REQUIRED");
    }

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

    const verificationUrl = `${appUrl()}/auth/confirmar-email?token=${encodeURIComponent(token)}`;
    const to = approvalMode ? emailAdmin! : profile.email;
    const subject = approvalMode
      ? `[Leo Barros] Confirmacao pendente: ${profile.email}`
      : "Confirme seu e-mail - Leo Barros";
    const html = approvalMode
      ? `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Conta aguardando confirmacao</h2>
          <p>A conta ${profile.email} (${profile.role}) aguarda confirmacao.</p>
          <p>Ao clicar, a conta solicitante sera confirmada.</p>
          <p><a href="${verificationUrl}">Confirmar conta</a></p>
          <p>Este link expira em 24 horas.</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Confirme seu e-mail</h2>
          <p>Ola, ${profile.display_name}. Confirme seu e-mail para acessar o Projeto Leo Barros.</p>
          <p><a href="${verificationUrl}">Confirmar e-mail</a></p>
          <p>Este link expira em 24 horas. Se voce nao solicitou, ignore este e-mail.</p>
        </div>
      `;

    await sendEmail({ html, subject, to });

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
