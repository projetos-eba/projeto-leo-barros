import { createClient } from "npm:@supabase/supabase-js@2.98.0";

import { sendAuthEmail } from "../_shared/email/email-gateway.ts";
import {
  adminInviteSubject,
  adminInviteTemplate,
} from "../_shared/email/email-templates.ts";
import { resolvePlatformEmailBranding } from "../_shared/platform-branding.ts";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const allowedFields = new Set([
  "action",
  "displayName",
  "email",
  "status",
  "targetProfileId",
]);

const allowedActions = new Set([
  "create",
  "update",
  "activate",
  "deactivate",
  "delete",
]);

const allowedStatuses = new Set([
  "pending",
  "active",
  "suspended",
  "disabled",
]);

type JsonRecord = Record<string, unknown>;

type ErrorBody = {
  code: string;
  fields?: Record<string, string>;
  message: string;
};

type AdminMutationResult = {
  active_admin_count: number;
  admin_id?: string;
  profile_id: string;
  result_status: string;
};

type DeleteQuery = PromiseLike<unknown> & {
  contains: (column: string, value: Record<string, unknown>) => DeleteQuery;
  eq: (column: string, value: string) => DeleteQuery;
};

type RollbackClient = {
  auth: {
    admin: {
      deleteUser: (userId: string) => Promise<unknown>;
    };
  };
  from: (table: string) => {
    delete: () => DeleteQuery;
  };
};

function allowedOrigins() {
  const configured = Deno.env.get("PROVISIONING_ALLOWED_ORIGINS");

  return new Set(
    (configured ??
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
  error: ErrorBody,
  origin: string | null,
) {
  return response(status, requestId, { error }, origin);
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}

function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function mapRpcError(message: string) {
  const mappings: Record<string, [number, string, string]> = {
    ADMIN_USERS_EMAIL_EXISTS: [
      409,
      "EMAIL_EXISTS",
      "Já existe um usuário com este e-mail.",
    ],
    ADMIN_USERS_FORBIDDEN: [
      403,
      "FORBIDDEN",
      "A operação não é permitida.",
    ],
    ADMIN_USERS_INVALID_PAYLOAD: [
      400,
      "INVALID_PAYLOAD",
      "Revise os dados informados.",
    ],
    ADMIN_USERS_INVALID_STATUS: [
      400,
      "INVALID_PAYLOAD",
      "Revise os dados informados.",
    ],
    ADMIN_USERS_NOT_FOUND: [
      404,
      "NOT_FOUND",
      "Usuário administrativo não encontrado.",
    ],
    ADMIN_USERS_SELF_DEACTIVATE: [
      409,
      "SELF_DEACTIVATE",
      "Não é possível inativar a própria conta.",
    ],
    ADMIN_USERS_SELF_DELETE: [
      409,
      "SELF_DELETE",
      "Não é possível excluir a própria conta.",
    ],
    LAST_ACTIVE_ADMIN: [
      409,
      "LAST_ACTIVE_ADMIN",
      "Não é possível excluir ou inativar o único administrador ativo da plataforma.",
    ],
  };

  return mappings[message] ?? [
    500,
    "ADMIN_USER_OPERATION_FAILED",
    "Não foi possível concluir a operação.",
  ];
}

async function rollbackCreatedAdmin(
  adminClient: RollbackClient,
  {
    authUserId,
    profileId,
  }: {
    authUserId?: string;
    profileId?: string;
  },
) {
  if (profileId) {
    await adminClient
      .from("platform_settings_activity")
      .delete()
      .contains("metadata", { targetProfileId: profileId });
    await adminClient.from("admins").delete().eq("profile_id", profileId);
    await adminClient.from("profiles").delete().eq("id", profileId);
  }

  if (authUserId) {
    await adminClient.auth.admin.deleteUser(authUserId);
  }
}

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();
  const origin = request.headers.get("origin");

  if (origin && !allowedOrigins().has(origin)) {
    return errorResponse(
      403,
      requestId,
      { code: "ORIGIN_NOT_ALLOWED", message: "Origem não permitida." },
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
      { code: "METHOD_NOT_ALLOWED", message: "Método não permitido." },
      origin,
    );
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return errorResponse(
      401,
      requestId,
      { code: "AUTH_REQUIRED", message: "Autenticação obrigatória." },
      origin,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error(JSON.stringify({
      requestId,
      code: "MISSING_SERVER_CONFIGURATION",
    }));

    return errorResponse(
      500,
      requestId,
      { code: "INTERNAL_ERROR", message: "Erro interno." },
      origin,
    );
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await callerClient.auth
    .getUser();

  if (userError || !userData.user) {
    return errorResponse(
      401,
      requestId,
      { code: "AUTH_REQUIRED", message: "Autenticação obrigatória." },
      origin,
    );
  }

  const { data: callerProfile, error: callerProfileError } = await callerClient
    .from("profiles")
    .select("id, role, status")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (
    callerProfileError ||
    !callerProfile ||
    callerProfile.role !== "admin" ||
    callerProfile.status !== "active"
  ) {
    return errorResponse(
      403,
      requestId,
      { code: "FORBIDDEN", message: "A operação não é permitida." },
      origin,
    );
  }

  const { data: callerAdmin, error: callerAdminError } = await callerClient
    .from("admins")
    .select("id")
    .eq("profile_id", callerProfile.id)
    .maybeSingle();

  if (callerAdminError || !callerAdmin) {
    return errorResponse(
      403,
      requestId,
      { code: "FORBIDDEN", message: "A operação não é permitida." },
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
      { code: "INVALID_JSON", message: "O corpo da requisicao e invalido." },
      origin,
    );
  }

  if (!isRecord(rawBody)) {
    return errorResponse(
      400,
      requestId,
      { code: "INVALID_PAYLOAD", message: "Revise os dados informados." },
      origin,
    );
  }

  const unknownFields = Object.keys(rawBody).filter(
    (field) => !allowedFields.has(field),
  );

  if (unknownFields.length > 0) {
    return errorResponse(
      400,
      requestId,
      {
        code: "INVALID_PAYLOAD",
        fields: Object.fromEntries(
          unknownFields.map((field) => [field, "unknown"]),
        ),
        message: "Revise os dados informados.",
      },
      origin,
    );
  }

  const action = stringValue(rawBody.action);
  if (!allowedActions.has(action)) {
    return errorResponse(
      400,
      requestId,
      { code: "INVALID_PAYLOAD", message: "Revise os dados informados." },
      origin,
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (action === "create") {
    const email = stringValue(rawBody.email).toLowerCase();
    const displayName = stringValue(rawBody.displayName);
    const status = stringValue(rawBody.status) || "active";
    const fields: Record<string, string> = {};

    if (!isValidEmail(email)) fields.email = "invalid";
    if (!displayName || displayName.length > 120) {
      fields.displayName = displayName ? "invalid" : "required";
    }
    if (!allowedStatuses.has(status)) fields.status = "invalid";

    if (Object.keys(fields).length > 0) {
      return errorResponse(
        400,
        requestId,
        {
          code: "INVALID_PAYLOAD",
          fields,
          message: "Revise os dados informados.",
        },
        origin,
      );
    }

    const { data: existingProfile, error: existingProfileError } =
      await adminClient
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

    if (existingProfileError) {
      console.error(JSON.stringify({
        requestId,
        code: "PROFILE_LOOKUP_FAILED",
        databaseCode: existingProfileError.code,
      }));

      return errorResponse(
        500,
        requestId,
        { code: "INTERNAL_ERROR", message: "Erro interno." },
        origin,
      );
    }

    if (existingProfile) {
      return errorResponse(
        409,
        requestId,
        {
          code: "EMAIL_EXISTS",
          message: "Já existe um usuário com este e-mail.",
        },
        origin,
      );
    }

    const { data: inviteData, error: inviteError } = await adminClient.auth
      .admin.generateLink({
        type: "invite",
        email,
      });

    if (inviteError || !inviteData.user?.id) {
      console.error(JSON.stringify({
        requestId,
        code: "AUTH_INVITE_GENERATION_FAILED",
      }));

      return errorResponse(
        409,
        requestId,
        {
          code: "IDENTITY_RECONCILIATION_REQUIRED",
          message: "A identidade existente exige revisão antes de continuar.",
        },
        origin,
      );
    }

    const authUserId = inviteData.user.id;
    const inviteUrl = inviteData.properties?.action_link;
    if (!inviteUrl) {
      await rollbackCreatedAdmin(adminClient, { authUserId });

      return errorResponse(
        500,
        requestId,
        { code: "INTERNAL_ERROR", message: "Erro interno." },
        origin,
      );
    }

    const { data, error } = await adminClient
      .rpc("admin_create_user_record", {
        p_actor_profile_id: callerProfile.id,
        p_auth_user_id: authUserId,
        p_display_name: displayName,
        p_email: email,
        p_invite_status: "sent",
        p_status: status,
      })
      .single();

    if (error || !data) {
      const [httpStatus, code, message] = mapRpcError(error?.message ?? "");

      try {
        await rollbackCreatedAdmin(adminClient, { authUserId });
      } catch {
        console.error(JSON.stringify({
          requestId,
          code,
          compensationFailed: true,
        }));
        return errorResponse(
          500,
          requestId,
          { code: "INTERNAL_ERROR", message: "Erro interno." },
          origin,
        );
      }

      return errorResponse(httpStatus, requestId, { code, message }, origin);
    }

    const result = data as AdminMutationResult;
    try {
      const branding = await resolvePlatformEmailBranding(adminClient);
      await sendAuthEmail({
        authUserId,
        flow: "admin_invite",
        html: adminInviteTemplate({
          displayName,
          inviteUrl,
          platformName: branding.platformName,
        }),
        profileId: result.profile_id,
        requestId,
        role: "admin",
        subject: adminInviteSubject(branding.platformName),
        supabase: adminClient,
        to: email,
      });
    } catch (sendError) {
      console.error(JSON.stringify({
        requestId,
        code: "ADMIN_INVITE_EMAIL_SEND_FAILED",
        message: sendError instanceof Error ? sendError.message : "UNKNOWN",
      }));

      try {
        await rollbackCreatedAdmin(adminClient, {
          authUserId,
          profileId: result.profile_id,
        });
      } catch {
        console.error(JSON.stringify({
          requestId,
          code: "ADMIN_INVITE_ROLLBACK_FAILED",
        }));
      }

      return errorResponse(
        502,
        requestId,
        {
          code: "EMAIL_DELIVERY_FAILED",
          message: "Não foi possível enviar o convite.",
        },
        origin,
      );
    }

    return response(
      202,
      requestId,
      {
        admin: {
          activeAdminCount: result.active_admin_count,
          inviteStatus: "sent",
          profileId: result.profile_id,
          status,
        },
        status: result.result_status,
      },
      origin,
    );
  }

  const targetProfileId = stringValue(rawBody.targetProfileId);
  if (!isUuid(targetProfileId)) {
    return errorResponse(
      400,
      requestId,
      {
        code: "INVALID_PAYLOAD",
        fields: { targetProfileId: "invalid" },
        message: "Revise os dados informados.",
      },
      origin,
    );
  }

  if (action === "delete") {
    const { data, error } = await adminClient
      .rpc("admin_delete_user_record", {
        p_actor_profile_id: callerProfile.id,
        p_target_profile_id: targetProfileId,
      })
      .single();

    if (error || !data) {
      const [httpStatus, code, message] = mapRpcError(error?.message ?? "");
      return errorResponse(httpStatus, requestId, { code, message }, origin);
    }

    const result = data as AdminMutationResult;
    return response(
      200,
      requestId,
      {
        admin: {
          activeAdminCount: result.active_admin_count,
          profileId: result.profile_id,
          status: "disabled",
        },
        status: result.result_status,
      },
      origin,
    );
  }

  let displayName = action === "update" ? stringValue(rawBody.displayName) : "";
  if (action !== "update") {
    const { data, error } = await adminClient
      .from("profiles")
      .select("display_name")
      .eq("id", targetProfileId)
      .eq("role", "admin")
      .maybeSingle();
    const targetProfile = data as { display_name?: unknown } | null;
    displayName = error ? "" : stringValue(targetProfile?.display_name);
  }
  const status = action === "activate"
    ? "active"
    : action === "deactivate"
    ? "disabled"
    : stringValue(rawBody.status);
  const fields: Record<string, string> = {};

  if (!displayName || displayName.length > 120) {
    fields.displayName = displayName ? "invalid" : "required";
  }
  if (!allowedStatuses.has(status)) fields.status = "invalid";

  if (Object.keys(fields).length > 0) {
    return errorResponse(
      400,
      requestId,
      {
        code: "INVALID_PAYLOAD",
        fields,
        message: "Revise os dados informados.",
      },
      origin,
    );
  }

  const { data, error } = await adminClient
    .rpc("admin_update_user_record", {
      p_actor_profile_id: callerProfile.id,
      p_display_name: displayName,
      p_status: status,
      p_target_profile_id: targetProfileId,
    })
    .single();

  if (error || !data) {
    const [httpStatus, code, message] = mapRpcError(error?.message ?? "");
    return errorResponse(httpStatus, requestId, { code, message }, origin);
  }

  const result = data as AdminMutationResult;
  return response(
    200,
    requestId,
    {
      admin: {
        activeAdminCount: result.active_admin_count,
        profileId: result.profile_id,
        status,
      },
      status: result.result_status,
    },
    origin,
  );
});
