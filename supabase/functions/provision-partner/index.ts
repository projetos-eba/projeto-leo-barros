import { createClient } from "npm:@supabase/supabase-js@2.98.0";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const allowedFields = new Set([
  "email",
  "phone",
  "professionalType",
  "professionalRegistryType",
  "professionalRegistryNumber",
  "displayName",
  "professionalName",
  "idempotencyKey",
]);

const professionalTypes = new Set([
  "personal_trainer",
  "nutricionista",
  "medico",
]);

const professionalRegistryTypes = new Set([
  "crm",
  "crn",
  "cref",
  "outro",
]);

type JsonRecord = Record<string, unknown>;

type ErrorBody = {
  code: string;
  message: string;
  fields?: Record<string, string>;
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

function isValidPhone(value: string) {
  return /^\+[1-9][0-9]{7,14}$/.test(value);
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

function mapRpcError(message: string) {
  const mappings: Record<string, [number, string, string]> = {
    PROVISION_PARTNER_FORBIDDEN: [
      403,
      "FORBIDDEN",
      "A operação não é permitida.",
    ],
    PROVISION_PARTNER_INVALID_REQUEST_HASH: [
      400,
      "INVALID_PAYLOAD",
      "Os dados informados são inválidos.",
    ],
    PROVISION_PARTNER_INVALID_PAYLOAD: [
      400,
      "INVALID_PAYLOAD",
      "Os dados informados são inválidos.",
    ],
    PROVISION_PARTNER_IDEMPOTENCY_KEY_REUSED: [
      409,
      "IDEMPOTENCY_KEY_REUSED",
      "A chave de idempotência já foi usada com outros dados.",
    ],
    PROVISION_PARTNER_IDENTITY_CONFLICT: [
      409,
      "IDENTITY_RECONCILIATION_REQUIRED",
      "A identidade existente exige revisão antes de continuar.",
    ],
    PROVISION_PARTNER_EMAIL_ROLE_CONFLICT: [
      409,
      "EMAIL_ROLE_CONFLICT",
      "O e-mail informado não pode ser usado para este perfil.",
    ],
    PROVISION_PARTNER_DATA_CONFLICT: [
      409,
      "PARTNER_DATA_CONFLICT",
      "Os dados informados divergem do Parceiro existente.",
    ],
  };

  return mappings[message] ?? [
    500,
    "RELATIONAL_WRITE_FAILED",
    "Não foi possível concluir o provisionamento.",
  ];
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

  const { data: userData, error: userError } =
    await callerClient.auth.getUser();

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
      { code: "INVALID_JSON", message: "O corpo da requisição é inválido." },
      origin,
    );
  }

  if (!isRecord(rawBody)) {
    return errorResponse(
      400,
      requestId,
      { code: "INVALID_PAYLOAD", message: "Os dados informados são inválidos." },
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
        message: "Os dados informados são inválidos.",
        fields: Object.fromEntries(
          unknownFields.map((field) => [field, "unknown"]),
        ),
      },
      origin,
    );
  }

  const email = stringValue(rawBody.email).toLowerCase();
  const phone = stringValue(rawBody.phone);
  const displayName = stringValue(rawBody.displayName);
  const professionalName =
    stringValue(rawBody.professionalName) || displayName;
  const professionalType = stringValue(rawBody.professionalType);
  const professionalRegistryType =
    stringValue(rawBody.professionalRegistryType).toLowerCase();
  const professionalRegistryNumber =
    stringValue(rawBody.professionalRegistryNumber);
  const hasRegistryType = professionalRegistryType.length > 0;
  const hasRegistryNumber = professionalRegistryNumber.length > 0;
  const suppliedIdempotencyKey = stringValue(rawBody.idempotencyKey);
  const idempotencyKey = suppliedIdempotencyKey || crypto.randomUUID();
  const fields: Record<string, string> = {};

  if (!isValidEmail(email)) fields.email = "invalid";
  if (!isValidPhone(phone)) fields.phone = phone ? "invalid" : "required";
  if (!displayName || displayName.length > 120) {
    fields.displayName = displayName ? "invalid" : "required";
  }
  if (!professionalName || professionalName.length > 120) {
    fields.professionalName = "invalid";
  }
  if (!professionalTypes.has(professionalType)) {
    fields.professionalType = "invalid";
  }
  if (hasRegistryType && !professionalRegistryTypes.has(professionalRegistryType)) {
    fields.professionalRegistryType = "invalid";
  }
  if (hasRegistryType !== hasRegistryNumber) {
    fields.professionalRegistryType = hasRegistryType ? fields.professionalRegistryType ?? "invalid" : "required";
    fields.professionalRegistryNumber = hasRegistryNumber ? fields.professionalRegistryNumber ?? "invalid" : "required";
  }
  if (professionalRegistryNumber.length > 64) {
    fields.professionalRegistryNumber = "invalid";
  }
  if (!isUuid(idempotencyKey)) fields.idempotencyKey = "invalid";

  if (Object.keys(fields).length > 0) {
    return errorResponse(
      400,
      requestId,
      {
        code: "INVALID_PAYLOAD",
        message: "Os dados informados são inválidos.",
        fields,
      },
      origin,
    );
  }

  const normalizedPayload = {
    email,
    phone,
    displayName,
    professionalName,
    professionalType,
    professionalRegistryType: hasRegistryType ? professionalRegistryType : null,
    professionalRegistryNumber: hasRegistryNumber ? professionalRegistryNumber : null,
  };
  const requestHash = await sha256(JSON.stringify(normalizedPayload));

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existingProfile, error: existingProfileError } =
    await adminClient
      .from("profiles")
      .select("id, user_id, role")
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

  if (existingProfile && existingProfile.role !== "parceiro") {
    return errorResponse(
      409,
      requestId,
      {
        code: "EMAIL_ROLE_CONFLICT",
        message: "O e-mail informado não pode ser usado para este perfil.",
      },
      origin,
    );
  }

  let authUserId = existingProfile?.user_id ?? null;
  let createdAuthUser = false;
  let inviteStatus = "not_resent";

  if (!authUserId) {
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.generateLink({
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

    authUserId = inviteData.user.id;
    createdAuthUser = true;
    inviteStatus = "pending_delivery";
  }

  const { data: provisioned, error: provisionError } = await adminClient.rpc(
    "provision_partner_records",
    {
      p_caller_profile_id: callerProfile.id,
      p_idempotency_key: idempotencyKey,
      p_request_hash: requestHash,
      p_auth_user_id: authUserId,
      p_email: email,
      p_phone: phone,
      p_display_name: displayName,
      p_professional_name: professionalName,
      p_professional_type: professionalType,
      p_professional_registry_type: hasRegistryType ? professionalRegistryType : null,
      p_professional_registry_number: hasRegistryNumber ? professionalRegistryNumber : null,
      p_invite_status: inviteStatus,
    },
  ).single();

  if (provisionError || !provisioned) {
    let compensationFailed = false;

    if (createdAuthUser && authUserId) {
      const { error: deleteError } =
        await adminClient.auth.admin.deleteUser(authUserId);
      compensationFailed = Boolean(deleteError);
    }

    const rpcMessage = provisionError?.message ?? "";
    const [status, code, message] = mapRpcError(rpcMessage);

    console.error(JSON.stringify({
      requestId,
      code,
      compensationFailed,
    }));

    if (compensationFailed) {
      return errorResponse(
        500,
        requestId,
        { code: "INTERNAL_ERROR", message: "Erro interno." },
        origin,
      );
    }

    return errorResponse(status, requestId, { code, message }, origin);
  }

  const resultStatus = String(provisioned.result_status);
  const resultInviteStatus = String(provisioned.result_invite_status);
  const httpStatus = resultStatus === "created"
    ? (resultInviteStatus === "pending_delivery" ? 202 : 201)
    : 200;

  return response(
    httpStatus,
    requestId,
    {
      status: resultStatus,
      partner: {
        profileId: provisioned.profile_id,
        partnerId: provisioned.partner_id,
        accountStatus: "active",
      },
      invite: {
        status: resultInviteStatus,
      },
      idempotencyKey,
    },
    origin,
  );
});
