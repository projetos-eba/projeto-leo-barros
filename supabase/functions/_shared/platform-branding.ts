export type PlatformEmailBranding = {
  platformName: string;
};

export const DEFAULT_PLATFORM_NAME = "Leonardo Barros";

type PlatformSettingsQueryResult = {
  data: { value: unknown } | null;
  error: { code?: string; message?: string } | null;
};

type PlatformSettingsQuery = {
  select(columns: string): {
    eq(column: string, value: string): {
      maybeSingle(): PromiseLike<unknown>;
    };
  };
};

export type PlatformSettingsClient = {
  from(table: string): PlatformSettingsQuery;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizePlatformName(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function resolvePlatformEmailBrandingFromValue(
  value: unknown,
): PlatformEmailBranding {
  if (!isRecord(value)) {
    return { platformName: DEFAULT_PLATFORM_NAME };
  }

  return {
    platformName: normalizePlatformName(value.platformName) ??
      DEFAULT_PLATFORM_NAME,
  };
}

export async function resolvePlatformEmailBranding(
  supabase: unknown,
): Promise<PlatformEmailBranding> {
  const client = supabase as PlatformSettingsClient;
  const result = await client
    .from("platform_settings")
    .select("value")
    .eq("key", "general")
    .maybeSingle();
  const { data, error } = result as PlatformSettingsQueryResult;

  if (error) {
    console.error(JSON.stringify({
      code: "PLATFORM_EMAIL_BRANDING_READ_FAILED",
      databaseCode: error.code,
    }));

    return { platformName: DEFAULT_PLATFORM_NAME };
  }

  return resolvePlatformEmailBrandingFromValue(data?.value);
}
