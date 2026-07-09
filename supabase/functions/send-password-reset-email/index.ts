import { createClient } from "npm:@supabase/supabase-js@2.98.0";

import {
  type AuthRole,
  buildAppUrl,
  getSupabaseAdminEnv,
} from "../_shared/env.ts";
import { sendAuthEmail } from "../_shared/email/email-gateway.ts";
import { passwordResetTemplate } from "../_shared/email/email-templates.ts";

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

const roles = new Set(["cliente", "parceiro", "admin"]);

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
    let body: {
      email?: unknown;
      expectedRole?: unknown;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return response(400, {
        success: false,
        error: { message: "Requisicao invalida." },
      });
    }
    const email = typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";
    const expectedRole = typeof body.expectedRole === "string"
      ? body.expectedRole
      : "";

    if (!email || !roles.has(expectedRole)) {
      return response(200, { success: true });
    }

    const { serviceRoleKey, supabaseUrl } = getSupabaseAdminEnv();

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

    const resetUrl = buildAppUrl("/auth/redefinir-senha", { token });
    await sendAuthEmail({
      authUserId: profile.user_id,
      flow: "password_reset",
      html: passwordResetTemplate({ resetUrl }),
      profileId: profile.id,
      requestId: crypto.randomUUID(),
      role: expectedRole as AuthRole,
      subject: "Redefinicao de senha - Leo Barros",
      supabase,
      to: email,
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
