"use server";

import { SAFE_AUTH_ERROR_MESSAGES } from "@/lib/auth/auth-errors";
import { emailVerificationTokenSchema } from "@/lib/auth/email-verification-contracts";
import { firstAccessSchema, type FirstAccessInput } from "@/lib/auth/first-access";
import {
  passwordResetRequestSchema,
  passwordResetUpdateSchema,
  type PasswordResetRequestInput,
  type PasswordResetUpdateInput,
} from "@/lib/auth/password-reset-contracts";
import {
  partnerSignupSchema,
  type PartnerSignupInput,
} from "@/lib/auth/partner-signup-contracts";
import { createAdminClient } from "@/lib/supabase/admin";
import { invokeSupabaseFunction } from "@/lib/supabase/functions";

type ActionResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

type VerifyPasswordResetResult =
  | {
      ok: true;
      resetSessionId: string;
    }
  | {
      ok: false;
      message: string;
    };

const FIRST_ACCESS_SUCCESS =
  "Senha criada. Confirme seu e-mail para acessar.";
const PARTNER_SIGNUP_SUCCESS =
  "Cadastro recebido. Confirme seu e-mail para acessar.";

export async function requestFirstAccess(
  input: FirstAccessInput,
): Promise<ActionResult> {
  const parsed = firstAccessSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: SAFE_AUTH_ERROR_MESSAGES.firstAccessDenied,
    };
  }

  const admin = createAdminClient();
  const { email, password } = parsed.data;
  const { data: profile } = await admin
    .from("profiles")
    .select("id, role, user_id")
    .ilike("email", email)
    .maybeSingle();

  if (!profile || profile.role !== "cliente") {
    return {
      ok: false,
      message: SAFE_AUTH_ERROR_MESSAGES.firstAccessDenied,
    };
  }

  const { data: patient } = await admin
    .from("patients")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!patient) {
    return {
      ok: false,
      message: SAFE_AUTH_ERROR_MESSAGES.firstAccessDenied,
    };
  }

  const { data: relationship } = await admin
    .from("partner_clients")
    .select("id")
    .eq("patient_id", patient.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!relationship) {
    return {
      ok: false,
      message: SAFE_AUTH_ERROR_MESSAGES.firstAccessDenied,
    };
  }

  const { error: passwordError } = await admin.auth.admin.updateUserById(
    profile.user_id,
    {
      password,
    },
  );

  if (passwordError) {
    return {
      ok: false,
      message: SAFE_AUTH_ERROR_MESSAGES.firstAccessDenied,
    };
  }

  await admin
    .from("profiles")
    .update({
      email_confirmed_at: null,
      last_auth_flow_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  const verification = await invokeSupabaseFunction<{ success: boolean }>(
    "send-verification-email",
    {
      profileId: profile.id,
      purpose: "client_first_access",
    },
  );

  if (!verification.ok) {
    return {
      ok: false,
      message: "Senha definida, mas nao foi possivel enviar a confirmacao.",
    };
  }

  return {
    ok: true,
    message: FIRST_ACCESS_SUCCESS,
  };
}

export async function signupPartner(
  input: PartnerSignupInput,
): Promise<ActionResult> {
  const parsed = partnerSignupSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise os dados informados para concluir o cadastro.",
    };
  }

  const admin = createAdminClient();
  const payload = parsed.data;

  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: false,
    });

  if (authError || !authUser.user) {
    return {
      ok: false,
      message: "Nao foi possivel concluir o cadastro.",
    };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .insert({
      display_name: payload.displayName,
      email: payload.email,
      phone: payload.phone,
      role: "parceiro",
      status: "active",
      user_id: authUser.user.id,
    })
    .select("id")
    .single();

  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(authUser.user.id);

    return {
      ok: false,
      message: "Nao foi possivel concluir o cadastro.",
    };
  }

  const hasRegistry =
    payload.professionalRegistryType && payload.professionalRegistryNumber;
  const { data: partner, error: partnerError } = await admin
    .from("partners")
    .insert({
      professional_name: payload.displayName,
      professional_registry_number: hasRegistry
        ? payload.professionalRegistryNumber
        : null,
      professional_registry_type: hasRegistry
        ? payload.professionalRegistryType
        : null,
      professional_type: payload.professionalType,
      profile_id: profile.id,
    })
    .select("id")
    .single();

  if (partnerError || !partner) {
    await admin.from("profiles").delete().eq("id", profile.id);
    await admin.auth.admin.deleteUser(authUser.user.id);

    return {
      ok: false,
      message: "Nao foi possivel concluir o cadastro.",
    };
  }

  await admin.from("platform_activity_events").insert({
    event_type: "partner_created",
    partner_id: partner.id,
    title: "Parceiro cadastrado",
    detail: "Cadastro publico de parceiro recebido.",
    metadata: { source: "public_signup" },
  });

  const verification = await invokeSupabaseFunction<{ success: boolean }>(
    "send-verification-email",
    {
      profileId: profile.id,
      purpose: "partner_signup",
    },
  );

  if (!verification.ok) {
    return {
      ok: false,
      message: "Cadastro criado, mas nao foi possivel enviar a confirmacao.",
    };
  }

  return {
    ok: true,
    message: PARTNER_SIGNUP_SUCCESS,
  };
}

export async function requestPasswordReset(
  input: PasswordResetRequestInput,
): Promise<ActionResult> {
  const parsed = passwordResetRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Informe um e-mail valido.",
    };
  }

  await invokeSupabaseFunction<{ success: boolean }>(
    "send-password-reset-email",
    parsed.data,
  );

  return {
    ok: true,
    message: SAFE_AUTH_ERROR_MESSAGES.genericPasswordReset,
  };
}

export async function verifyPasswordResetToken(
  token: string,
): Promise<VerifyPasswordResetResult> {
  const parsed = emailVerificationTokenSchema.safeParse({ token });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Link invalido ou expirado.",
    };
  }

  const result = await invokeSupabaseFunction<{
    resetSessionId?: string;
    reset_session_id?: string;
    success: boolean;
  }>("verify-password-reset-token", parsed.data);

  if (!result.ok) {
    return {
      ok: false,
      message: "Link invalido ou expirado.",
    };
  }

  const resetSessionId =
    result.data.resetSessionId ?? result.data.reset_session_id;

  if (!resetSessionId) {
    return {
      ok: false,
      message: "Link invalido ou expirado.",
    };
  }

  return {
    ok: true,
    resetSessionId,
  };
}

export async function updatePasswordWithToken(
  input: PasswordResetUpdateInput,
): Promise<ActionResult> {
  const parsed = passwordResetUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Informe uma senha valida e confirme corretamente.",
    };
  }

  const result = await invokeSupabaseFunction<{ success: boolean }>(
    "update-password-with-token",
    {
      newPassword: parsed.data.password,
      resetSessionId: parsed.data.resetSessionId,
    },
  );

  if (!result.ok) {
    return {
      ok: false,
      message: "Nao foi possivel redefinir a senha. Solicite um novo link.",
    };
  }

  return {
    ok: true,
    message: "Senha redefinida com sucesso.",
  };
}

export async function verifyEmailToken(token: string): Promise<ActionResult> {
  const parsed = emailVerificationTokenSchema.safeParse({ token });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Link de confirmacao invalido ou expirado.",
    };
  }

  const result = await invokeSupabaseFunction<{ success: boolean }>(
    "verify-email-token",
    parsed.data,
  );

  if (!result.ok) {
    return {
      ok: false,
      message: "Link de confirmacao invalido ou expirado.",
    };
  }

  return {
    ok: true,
    message: "E-mail confirmado com sucesso.",
  };
}
