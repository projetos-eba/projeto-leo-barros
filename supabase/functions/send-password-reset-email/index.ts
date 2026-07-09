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

const roles = new Set(["cliente", "parceiro", "admin"]);

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...jsonHeaders, ...corsHeaders },
  });
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

  const from = Deno.env.get("RESEND_FROM") ?? "Leo Barros <noreply@resend.dev>";
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, html, subject, to: [to] }),
  });

  if (!resendResponse.ok) {
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
    const body = (await request.json()) as {
      email?: unknown;
      expectedRole?: unknown;
    };
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const expectedRole =
      typeof body.expectedRole === "string" ? body.expectedRole : "";

    if (!email || !roles.has(expectedRole)) {
      return response(200, { success: true });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_ADMIN_ENV_NOT_CONFIGURED");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, user_id, role, status")
      .ilike("email", email)
      .maybeSingle();

    if (
      !profile ||
      profile.role !== expectedRole ||
      profile.status !== "active"
    ) {
      return response(200, { success: true });
    }

    const now = new Date().toISOString();
    await supabase
      .from("password_reset_tokens")
      .update({ consumed_at: now })
      .eq("profile_id", profile.id)
      .is("consumed_at", null);

    const token = randomToken();
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { error: tokenError } = await supabase
      .from("password_reset_tokens")
      .insert({
        auth_user_id: profile.user_id,
        expires_at: expiresAt,
        profile_id: profile.id,
        role: expectedRole,
        token_hash: tokenHash,
      });

    if (tokenError) {
      throw new Error("PASSWORD_RESET_TOKEN_INSERT_FAILED");
    }

    const resetUrl = `${appUrl()}/auth/redefinir-senha?token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: email,
      subject: "Redefinicao de senha - Leo Barros",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Redefinir senha</h2>
          <p>Recebemos uma solicitacao para redefinir sua senha.</p>
          <p><a href="${resetUrl}">Criar nova senha</a></p>
          <p>Este link expira em 1 hora. Se voce nao solicitou, ignore este e-mail.</p>
        </div>
      `,
    });

    return response(200, { success: true });
  } catch (error) {
    console.error(JSON.stringify({
      code: "SEND_PASSWORD_RESET_EMAIL_FAILED",
      message: error instanceof Error ? error.message : "UNKNOWN",
    }));

    return response(500, {
      success: false,
      error: { message: "Nao foi possivel enviar as instrucoes." },
    });
  }
});
