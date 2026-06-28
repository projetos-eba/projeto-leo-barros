const SUPABASE_URL_ENV = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_KEY_ENV = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

type SupabasePublicEnv = {
  publishableKey: string;
  url: string;
};

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const url = process.env[SUPABASE_URL_ENV];
  const publishableKey = process.env[SUPABASE_KEY_ENV];

  if (!url || !publishableKey) {
    throw new Error(
      `Configuração Supabase local ausente. Defina ${SUPABASE_URL_ENV} e ${SUPABASE_KEY_ENV} no .env.local.`,
    );
  }

  return {
    publishableKey,
    url,
  };
}

