import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Json } from "@/lib/supabase/database.types";

import {
  PLATFORM_ASSETS_BUCKET,
  defaultPlatformBranding,
  resolvePlatformBrandingFromValue,
  type PlatformBranding,
} from "./platform-branding-contract";

type BrandingQueryResult = {
  data: { value: Json } | null;
  error: { code?: string; message: string } | null;
};

type BrandingClient = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): PromiseLike<BrandingQueryResult>;
      };
    };
  };
};

export function platformAssetPublicUrl(path: string): string {
  const { url } = getSupabasePublicEnv();
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");

  return `${url}/storage/v1/object/public/${PLATFORM_ASSETS_BUCKET}/${encodedPath}`;
}

export async function fetchPlatformBranding(
  client?: BrandingClient,
): Promise<PlatformBranding> {
  const supabase = client ?? ((await createClient()) as unknown as BrandingClient);
  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "general")
    .maybeSingle();

  if (error) {
    console.error(JSON.stringify({
      code: "PLATFORM_BRANDING_READ_FAILED",
      databaseCode: error.code,
    }));

    return defaultPlatformBranding;
  }

  return resolvePlatformBrandingFromValue(data?.value, platformAssetPublicUrl);
}

export type { PlatformBranding };
