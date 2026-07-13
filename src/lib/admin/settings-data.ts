import { createClient } from "@/lib/supabase/server";

import {
  type AdminSettingsData,
  buildAdminSettingsData,
} from "./settings-metrics";

type QueryResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

type SupabaseReadQuery = PromiseLike<QueryResult<unknown>> & {
  eq(column: string, value: string): SupabaseReadQuery;
  limit(count: number): SupabaseReadQuery;
  order(column: string, options?: { ascending?: boolean }): SupabaseReadQuery;
};

type SupabaseReadClient = {
  from(table: string): {
    select(columns: string): SupabaseReadQuery;
  };
};

function asQuery<T>(query: SupabaseReadQuery) {
  return query as PromiseLike<QueryResult<T>>;
}

async function expectData<T>(result: PromiseLike<QueryResult<T>>, label: string) {
  const { data, error } = await result;

  if (error) {
    throw new Error(`Falha ao carregar ${label}: ${error.message}`);
  }

  return data ?? [];
}

export async function fetchAdminSettingsData(): Promise<AdminSettingsData> {
  const supabaseBase = await createClient();
  const { data: claimsData } = await supabaseBase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const supabase = supabaseBase as unknown as SupabaseReadClient;

  const [settings, integrations, activities, admins, currentProfiles] = await Promise.all([
    expectData(
      asQuery<import("./settings-metrics").PlatformSettingRecord>(
        supabase
          .from("platform_settings")
          .select("key, value, updated_at, updated_by_profile_id")
          .order("key", { ascending: true }),
      ),
      "configuracoes",
    ),
    expectData(
      asQuery<import("./settings-metrics").PlatformIntegrationRecord>(
        supabase
          .from("platform_integrations")
          .select("id, integration_key, name, category, status, config, last_test_status, last_test_message, last_tested_at, created_at, updated_at")
          .order("category", { ascending: true }),
      ),
      "integracoes",
    ),
    expectData(
      asQuery<import("./settings-metrics").PlatformSettingsActivityRecord>(
        supabase
          .from("platform_settings_activity")
          .select("id, action, actor_profile_id, title, detail, metadata, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ),
      "historico de configuracoes",
    ),
    expectData(
      asQuery<import("./settings-metrics").SettingsAdminProfileRecord>(
        supabase
          .from("profiles")
          .select("id, email, display_name, status")
          .eq("role", "admin")
          .order("display_name", { ascending: true }),
      ),
      "usuarios admins",
    ),
    userId
      ? expectData(
        asQuery<{ id: string }>(
          supabase
            .from("profiles")
            .select("id")
            .eq("user_id", userId)
            .limit(1),
        ),
        "profile atual",
      )
      : Promise.resolve([]),
  ]);

  return buildAdminSettingsData({
    activities,
    admins,
    currentProfileId: currentProfiles[0]?.id ?? null,
    integrations,
    settings,
  });
}
