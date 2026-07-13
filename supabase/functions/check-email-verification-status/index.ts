import { createClient } from "npm:@supabase/supabase-js@2.98.0";

import { getSupabaseAdminEnv } from "../_shared/env.ts";
import type { EdgeDatabase } from "../_shared/edge-database.ts";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const allowedRoles = new Set(["cliente", "parceiro"]);
const activeSubscriptionStatuses = ["active", "trialing"];

type JsonRecord = Record<string, unknown>;

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
    headers: { ...jsonHeaders, ...corsHeaders(origin) },
  });
}

function errorResponse(
  status: number,
  requestId: string,
  code: string,
  message: string,
  origin: string | null,
) {
  return response(
    status,
    requestId,
    { success: false, error: { code, message } },
    origin,
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
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
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
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

  let body: { profileId?: unknown; role?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorResponse(
      400,
      requestId,
      "INVALID_JSON",
      "Requisicao invalida.",
      origin,
    );
  }

  const profileId = typeof body.profileId === "string" ? body.profileId : "";
  const role = typeof body.role === "string" ? body.role : "";

  if (!isUuid(profileId) || !allowedRoles.has(role)) {
    return errorResponse(
      400,
      requestId,
      "INVALID_PAYLOAD",
      "Requisicao invalida.",
      origin,
    );
  }

  try {
    const { serviceRoleKey, supabaseUrl } = getSupabaseAdminEnv();
    const supabase = createClient<EdgeDatabase>(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email_confirmed_at, role, status")
      .eq("id", profileId)
      .maybeSingle();

    if (profileError || !profile || profile.role !== role) {
      return errorResponse(
        404,
        requestId,
        "PROFILE_NOT_FOUND",
        "Conta nao localizada.",
        origin,
      );
    }

    if (!profile.email_confirmed_at || profile.status !== "active") {
      return response(
        200,
        requestId,
        { confirmed: false, destination: null, success: true },
        origin,
      );
    }

    if (profile.role === "cliente") {
      return response(
        200,
        requestId,
        { confirmed: true, destination: "/cliente/inicio", success: true },
        origin,
      );
    }

    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (partnerError || !partner) {
      return response(
        200,
        requestId,
        { confirmed: true, destination: "/planos", success: true },
        origin,
      );
    }

    const now = new Date().toISOString();
    const { data: subscription, error: subscriptionError } = await supabase
      .from("partner_subscriptions")
      .select("id")
      .eq("partner_id", partner.id)
      .in("status", activeSubscriptionStatuses)
      .lte("current_period_start", now)
      .gt("current_period_end", now)
      .maybeSingle();

    return response(
      200,
      requestId,
      {
        confirmed: true,
        destination: !subscriptionError && subscription
          ? "/parceiros/dashboard"
          : "/planos",
        success: true,
      },
      origin,
    );
  } catch (error) {
    console.error(JSON.stringify({
      code: "CHECK_EMAIL_VERIFICATION_STATUS_FAILED",
      message: error instanceof Error ? error.message : "UNKNOWN",
      requestId,
    }));

    return errorResponse(
      500,
      requestId,
      "STATUS_CHECK_FAILED",
      "Nao foi possivel verificar a confirmacao.",
      origin,
    );
  }
});
