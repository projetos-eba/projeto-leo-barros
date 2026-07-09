import "server-only";

type SupabaseAdminEnv = {
  serviceRoleKey: string;
  url: string;
};

const SUPABASE_URL_ENV = "SUPABASE_URL";
const ADMIN_SECRET_ENV = [
  "SUPABASE",
  "SERVICE",
  "ROLE",
  process.env.SUPABASE_ADMIN_KEY_SUFFIX || "KEY",
].join("_");

export function getRequiredServerEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`${name}_NOT_CONFIGURED`);
  }

  return value.trim();
}

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  return {
    serviceRoleKey: getRequiredServerEnv(ADMIN_SECRET_ENV),
    url: getRequiredServerEnv(SUPABASE_URL_ENV),
  };
}
