import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

type SupabaseAdminEnv = {
  serviceRoleKey: string;
  url: string;
};

function getSupabaseAdminEnv(): SupabaseAdminEnv {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Configuracao Supabase admin ausente. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente server-side.",
    );
  }

  return { serviceRoleKey, url };
}

export function createAdminClient() {
  const { serviceRoleKey, url } = getSupabaseAdminEnv();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
