"use server";

import { SAFE_AUTH_ERROR_MESSAGES } from "@/lib/auth/auth-errors";
import {
  emailVerificationStatusSchema,
  emailVerificationTokenSchema,
  type EmailVerificationStatusInput,
} from "@/lib/auth/email-verification-contracts";
import { firstAccessSchema, type FirstAccessInput } from "@/lib/auth/first-access";
import type { OfficialRole } from "@/lib/auth/identity-contracts";
import {
  passwordResetRequestSchema,
  passwordResetUpdateSchema,
  type PasswordResetRequestInput,
  type PasswordResetUpdateInput,
} from "@/lib/auth/password-reset-contracts";
import {
  partnerSignupSchema,
  type PartnerSignupFieldErrors,
  type PartnerSignupInput,
} from "@/lib/auth/partner-signup-contracts";
import { invokeSupabaseFunction } from "@/lib/supabase/functions";

type ActionResult =
  | {
      ok: true;
      message: string;
      verification?: PendingEmailVerification;
    }
  | {
      fieldErrors?: PartnerSignupFieldErrors;
      ok: false;
      message: string;
    };

type PendingEmailVerification = {
  email: string;
  loginHref: string;
  profileId: string;
  role: Exclude<OfficialRole, "admin">;
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

type EmailVerificationStatusResult =
  | {
      confirmed: boolean;
      destination: string | null;
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

type VerifyEmailResult =
  | {
      loginHref: string;
      message: string;
      ok: true;
      role: OfficialRole;
    }
  | {
      loginHref: string;
      message: string;
      ok: false;
    };

const FIRST_ACCESS_SUCCESS =
  "Senha criada. Confirme seu e-mail para acessar.";
const PARTNER_SIGNUP_SUCCESS =
  "Cadastro recebido. Confirme seu e-mail para acessar.";
const GENERIC_PARTNER_SIGNUP_ERROR =
  "Nao foi possivel concluir o cadastro. Tente novamente.";

export async function requestFirstAccess(
  input: FirstAccessInput,
): Promise<ActionResult> {
  try {
    return await requestFirstAccessUnsafe(input);
  } catch (error) {
    logAuthActionError("FIRST_ACCESS_UNHANDLED", error);

    return {
      ok: false,
      message: SAFE_AUTH_ERROR_MESSAGES.firstAccessDenied,
    };
  }
}

async function requestFirstAccessUnsafe(
  input: FirstAccessInput,
): Promise<ActionResult> {
  const parsed = firstAccessSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: SAFE_AUTH_ERROR_MESSAGES.firstAccessDenied,
    };
  }

  const { email, password } = parsed.data;
  const firstAccess = await invokeSupabaseFunction<{
    profileId?: string;
    success: boolean;
  }>(
    "complete-client-first-access",
    {
      confirmPassword: parsed.data.confirmPassword,
      email,
      password,
    },
  );

  if (!firstAccess.ok) {
    return {
      ok: false,
      message: firstAccess.message || SAFE_AUTH_ERROR_MESSAGES.firstAccessDenied,
    };
  }

  return {
    ok: true,
    message: FIRST_ACCESS_SUCCESS,
    verification: {
      email,
      loginHref: "/login",
      profileId: firstAccess.data.profileId ?? "",
      role: "cliente",
    },
  };
}

export async function signupPartner(
  input: PartnerSignupInput,
): Promise<ActionResult> {
  try {
    return await signupPartnerUnsafe(input);
  } catch (error) {
    logAuthActionError("PARTNER_SIGNUP_UNHANDLED", error);

    return {
      ok: false,
      message: GENERIC_PARTNER_SIGNUP_ERROR,
    };
  }
}

async function signupPartnerUnsafe(
  input: PartnerSignupInput,
): Promise<ActionResult> {
  const parsed = partnerSignupSchema.safeParse(input);

  if (!parsed.success) {
    return {
      fieldErrors: collectPartnerSignupFieldErrors(parsed.error),
      ok: false,
      message: "Revise os dados informados para concluir o cadastro.",
    };
  }

  const payload = parsed.data;

  const hasRegistry =
    payload.professionalRegistryType && payload.professionalRegistryNumber;
  const signup = await invokeSupabaseFunction<{
    profileId?: string;
    success: boolean;
  }>(
    "signup-partner",
    {
      displayName: payload.displayName,
      email: payload.email,
      password: payload.password,
      phone: payload.phone,
      professionalRegistryNumber: hasRegistry
        ? payload.professionalRegistryNumber
        : null,
      professionalRegistryType: hasRegistry
        ? payload.professionalRegistryType
        : null,
      professionalType: payload.professionalType,
    },
  );

  if (!signup.ok) {
    return {
      ok: false,
      message: signup.message || GENERIC_PARTNER_SIGNUP_ERROR,
    };
  }

  return {
    ok: true,
    message: PARTNER_SIGNUP_SUCCESS,
    verification: {
      email: payload.email,
      loginHref: "/login/parceiros",
      profileId: signup.data.profileId ?? "",
      role: "parceiro",
    },
  };
}

function collectPartnerSignupFieldErrors(
  error: { flatten: () => { fieldErrors: Record<string, string[]> } },
): PartnerSignupFieldErrors {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors)
      .filter(([, messages]) => messages[0])
      .map(([field, messages]) => [field, messages[0]]),
  ) as PartnerSignupFieldErrors;
}

function logAuthActionError(code: string, error: unknown) {
  console.error(JSON.stringify({
    code,
    message: error instanceof Error ? error.message : "UNKNOWN",
  }));
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

export async function getEmailVerificationStatus(
  input: EmailVerificationStatusInput,
): Promise<EmailVerificationStatusResult> {
  const parsed = emailVerificationStatusSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Nao foi possivel verificar a confirmacao.",
    };
  }

  const result = await invokeSupabaseFunction<{
    confirmed?: boolean;
    destination?: string | null;
    success: boolean;
  }>("check-email-verification-status", parsed.data);

  if (!result.ok) {
    return {
      ok: false,
      message: "Nao foi possivel verificar a confirmacao.",
    };
  }

  return {
    confirmed: Boolean(result.data.confirmed),
    destination: result.data.destination ?? null,
    ok: true,
  };
}

export async function resendEmailVerification(
  input: EmailVerificationStatusInput,
): Promise<ActionResult> {
  const parsed = emailVerificationStatusSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Nao foi possivel reenviar a confirmacao.",
    };
  }

  const purpose = parsed.data.role === "cliente"
    ? "client_first_access"
    : "partner_signup";
  const result = await invokeSupabaseFunction<{ success: boolean }>(
    "send-verification-email",
    {
      profileId: parsed.data.profileId,
      purpose,
    },
  );

  if (!result.ok) {
    return {
      ok: false,
      message: result.message || "Nao foi possivel reenviar a confirmacao.",
    };
  }

  return {
    ok: true,
    message: "E-mail de confirmacao reenviado.",
  };
}

export async function verifyEmailToken(token: string): Promise<VerifyEmailResult> {
  const parsed = emailVerificationTokenSchema.safeParse({ token });

  if (!parsed.success) {
    return {
      loginHref: "/login",
      ok: false,
      message: "Link de confirmacao invalido ou expirado.",
    };
  }

  const result = await invokeSupabaseFunction<{
    role?: OfficialRole;
    success: boolean;
  }>("verify-email-token", parsed.data);

  if (!result.ok) {
    return {
      loginHref: "/login",
      ok: false,
      message: "Link de confirmacao invalido ou expirado.",
    };
  }

  const role = result.data.role ?? "cliente";

  return {
    loginHref: roleLoginHref(role),
    ok: true,
    message: "E-mail confirmado com sucesso.",
    role,
  };
}

function roleLoginHref(role: OfficialRole) {
  if (role === "admin") return "/login/admin";
  if (role === "parceiro") return "/login/parceiros";
  return "/login";
}
