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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_ADMIN_ENV_NOT_CONFIGURED");
    }

    const body = (await request.json()) as { token?: unknown };
    const token = typeof body.token === "string" ? body.token : "";

    if (!token) {
      return response(400, {
        success: false,
        error: { message: "Token invalido." },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const tokenHash = await sha256(token);
    const { data: tokenRow, error: tokenError } = await supabase
      .from("email_verification_tokens")
      .select("id, auth_user_id, profile_id, purpose, expires_at, consumed_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (
      tokenError ||
      !tokenRow ||
      tokenRow.consumed_at ||
      new Date(tokenRow.expires_at).getTime() < Date.now()
    ) {
      return response(400, {
        success: false,
        error: { message: "Link invalido ou expirado." },
      });
    }

    const now = new Date().toISOString();
    const { error: authError } = await supabase.auth.admin.updateUserById(
      tokenRow.auth_user_id,
      { email_confirm: true },
    );

    if (authError) {
      throw new Error("AUTH_EMAIL_CONFIRM_FAILED");
    }

    const profileUpdate: Record<string, string> = {
      email_confirmed_at: now,
      last_auth_flow_at: now,
    };

    if (tokenRow.purpose === "client_first_access") {
      profileUpdate.first_access_completed_at = now;
    }

    await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", tokenRow.profile_id);

    await supabase
      .from("email_verification_tokens")
      .update({ consumed_at: now })
      .eq("id", tokenRow.id);

    return response(200, {
      success: true,
    });
  } catch (error) {
    console.error(JSON.stringify({
      code: "VERIFY_EMAIL_TOKEN_FAILED",
      message: error instanceof Error ? error.message : "UNKNOWN",
    }));

    return response(500, {
      success: false,
      error: { message: "Nao foi possivel confirmar o e-mail." },
    });
  }
});
