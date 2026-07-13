export type AuthRole = "cliente" | "parceiro" | "admin";

export type AuthEmailFlags = {
  adminApprovalEnabled: boolean;
  automaticallyConfirmed: boolean;
};

const validProtocols = new Set(["http:", "https:"]);

export function parseBooleanEnv(
  value: string | undefined,
  defaultValue = false,
): boolean {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  switch (value.trim().toLowerCase()) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      throw new Error("INVALID_BOOLEAN_ENV");
  }
}

export function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value || value.trim() === "") {
    throw new Error(`${name}_NOT_CONFIGURED`);
  }

  return value.trim();
}

export function getSupabaseAdminEnv() {
  return {
    serviceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    supabaseUrl: getRequiredEnv("SUPABASE_URL"),
  };
}

export function getAuthEmailFlags(): AuthEmailFlags {
  return {
    adminApprovalEnabled: parseBooleanEnv(
      Deno.env.get("ALL_ACCOUNT_CREATE_APPROVAL_ADM"),
    ),
    automaticallyConfirmed: parseBooleanEnv(
      Deno.env.get("CONFIRMED_AUTOMATICALLY_EMAIL"),
    ),
  };
}

export function getAppUrl(): URL {
  const raw = getRequiredEnv("APP_URL").replace(/\/+$/, "");
  const url = new URL(raw);

  if (!validProtocols.has(url.protocol)) {
    throw new Error("APP_URL_INVALID_PROTOCOL");
  }

  return new URL(url.origin);
}

export function buildAppUrl(
  pathname: string,
  searchParams: Record<string, string>,
): string {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    throw new Error("APP_URL_INVALID_PATH");
  }

  const appUrl = getAppUrl();
  const url = new URL(pathname, appUrl);

  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  if (url.origin !== appUrl.origin) {
    throw new Error("APP_URL_ORIGIN_MISMATCH");
  }

  return url.toString();
}

export function getEmailAdmin(): string {
  return getRequiredEnv("EMAIL_ADMIN");
}

export function getResendFrom(): string {
  const from = getRequiredEnv("RESEND_FROM");
  const match = from.match(/^.+ <([^<>\s@]+@([^<>\s@]+))>$/);

  if (!match) {
    throw new Error("RESEND_FROM_INVALID");
  }

  if (match[2].toLowerCase() !== "deloadfit.app") {
    throw new Error("RESEND_FROM_DOMAIN_NOT_ALLOWED");
  }

  return from;
}

export function getEnvironmentName(): string {
  return Deno.env.get("APP_ENV")?.trim() || Deno.env.get("DENO_ENV")?.trim() ||
    "local";
}
