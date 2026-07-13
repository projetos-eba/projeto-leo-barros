import type { Json } from "@/lib/supabase/database.types";

export const DEFAULT_PLATFORM_NAME = "Leonardo Barros";
export const DEFAULT_PLATFORM_TAGLINE = "Saude | Nutricao | Performance";
export const PLATFORM_ASSETS_BUCKET = "platform-assets";
export const PLATFORM_LOGO_FOLDER = "branding";

export type PlatformLogoSettings = {
  contentType: string;
  path: string;
  sizeBytes: number;
  updatedAt: string;
};

export type PlatformBranding = {
  faviconUrl: string;
  initials: string;
  logo: PlatformLogoSettings | null;
  logoAlt: string;
  logoUrl: string | null;
  logoVersion: string;
  platformName: string;
  tagline: string;
};

export const defaultPlatformBranding: PlatformBranding = {
  faviconUrl: "/api/branding/favicon?v=default",
  initials: "LB",
  logo: null,
  logoAlt: DEFAULT_PLATFORM_NAME,
  logoUrl: null,
  logoVersion: "default",
  platformName: DEFAULT_PLATFORM_NAME,
  tagline: DEFAULT_PLATFORM_TAGLINE,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizePlatformName(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized.slice(0, 80) : null;
}

export function normalizePlatformLogo(value: unknown): PlatformLogoSettings | null {
  if (!isRecord(value)) return null;

  const path = typeof value.path === "string" ? value.path.trim() : "";
  const contentType = typeof value.contentType === "string" ? value.contentType.trim() : "";
  const updatedAt = typeof value.updatedAt === "string" ? value.updatedAt.trim() : "";
  const sizeBytes = typeof value.sizeBytes === "number" ? value.sizeBytes : Number(value.sizeBytes);

  if (!path.startsWith(`${PLATFORM_LOGO_FOLDER}/`)) return null;
  if (!["image/png", "image/jpeg", "image/webp", "image/x-icon", "image/vnd.microsoft.icon"].includes(contentType)) return null;
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return null;
  if (!updatedAt) return null;

  return {
    contentType,
    path,
    sizeBytes,
    updatedAt,
  };
}

export function getPlatformInitials(platformName: string): string {
  const words = platformName
    .split(/\s+/)
    .map((word) => word.replace(/[^a-zA-Z0-9À-ÿ]/g, ""))
    .filter(Boolean);

  if (words.length === 0) return defaultPlatformBranding.initials;
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function resolvePlatformBrandingFromValue(
  value: Json | unknown,
  getPublicUrl?: (path: string) => string,
): PlatformBranding {
  if (!isRecord(value)) return defaultPlatformBranding;

  const platformName = normalizePlatformName(value.platformName) ?? DEFAULT_PLATFORM_NAME;
  const logo = normalizePlatformLogo(value.logo);
  const logoUrl = logo && getPublicUrl ? getPublicUrl(logo.path) : null;
  const logoVersion = logo?.updatedAt ?? "default";

  return {
    faviconUrl: `/api/branding/favicon?v=${encodeURIComponent(logoVersion)}`,
    initials: getPlatformInitials(platformName),
    logo,
    logoAlt: platformName,
    logoUrl,
    logoVersion,
    platformName,
    tagline: DEFAULT_PLATFORM_TAGLINE,
  };
}
