import { createClient } from "npm:@supabase/supabase-js@2.98.0";

import { getSupabaseAdminEnv } from "../_shared/env.ts";

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

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...jsonHeaders, ...corsHeaders },
  });
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

    let body: {
      newPassword?: unknown;
      resetSessionId?: unknown;
      reset_session_id?: unknown;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return response(400, {
        success: false,
        error: { message: "Requisicao invalida." },
      });
    }
    const resetSessionId = typeof body.resetSessionId === "string"
      ? body.resetSessionId
      : typeof body.reset_session_id === "string"
      ? body.reset_session_id
      : "";
    const newPassword = typeof body.newPassword === "string"
      ? body.newPassword
      : "";

    if (
      !resetSessionId ||
      newPassword.length < 8 ||
      newPassword.length > 72
    ) {
      return response(400, {
        success: false,
        error: { message: "Dados invalidos." },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const resetSessionHash = await sha256(resetSessionId);
    const { data: tokenRow, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select(
        "id, auth_user_id, consumed_at, validated_at, session_expires_at",
      )
      .eq("reset_session_hash", resetSessionHash)
      .maybeSingle();

    if (
      tokenError ||
      !tokenRow ||
      tokenRow.consumed_at ||
      !tokenRow.validated_at ||
      !tokenRow.session_expires_at ||
      new Date(tokenRow.session_expires_at).getTime() < Date.now()
    ) {
      return response(400, {
        success: false,
        error: { message: "Sessao invalida ou expirada." },
      });
    }

    const { error: passwordError } = await supabase.auth.admin.updateUserById(
      tokenRow.auth_user_id,
      { password: newPassword },
    );

    if (passwordError) {
      throw new Error("AUTH_PASSWORD_UPDATE_FAILED");
    }

    await supabase
      .from("password_reset_tokens")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", tokenRow.id);

    return response(200, {
      success: true,
    });
  } catch (error) {
    console.error(JSON.stringify({
      code: "UPDATE_PASSWORD_WITH_TOKEN_FAILED",
      message: error instanceof Error ? error.message : "UNKNOWN",
    }));

    return response(500, {
      success: false,
      error: { message: "Nao foi possivel redefinir a senha." },
    });
  }
});
