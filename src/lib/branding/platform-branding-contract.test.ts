import { describe, expect, it } from "vitest";

import {
  DEFAULT_PLATFORM_NAME,
  getPlatformInitials,
  resolvePlatformBrandingFromValue,
} from "./platform-branding-contract";

describe("platform-branding-contract", () => {
  it("resolve nome, iniciais e URL publica do logo configurado", () => {
    const branding = resolvePlatformBrandingFromValue(
      {
        logo: {
          contentType: "image/png",
          path: "branding/logo.png",
          sizeBytes: 1024,
          updatedAt: "2026-07-13T12:00:00.000Z",
        },
        platformName: "  DeLoad Fit  ",
      },
      (path) => `https://assets.example.invalid/${path}`,
    );

    expect(branding).toMatchObject({
      faviconUrl: "/api/branding/favicon?v=2026-07-13T12%3A00%3A00.000Z",
      initials: "DF",
      logoVersion: "2026-07-13T12:00:00.000Z",
      logoUrl: "https://assets.example.invalid/branding/logo.png",
      platformName: "DeLoad Fit",
    });
  });

  it("usa fallback seguro para JSON invalido", () => {
    expect(resolvePlatformBrandingFromValue(null).platformName).toBe(DEFAULT_PLATFORM_NAME);
    expect(resolvePlatformBrandingFromValue({ platformName: " " }).platformName).toBe(DEFAULT_PLATFORM_NAME);
    expect(resolvePlatformBrandingFromValue({ logo: { path: "bad/logo.png" } }).logo).toBeNull();
    expect(resolvePlatformBrandingFromValue({ platformName: "DeLoad Fit" }).faviconUrl).toBe("/api/branding/favicon?v=default");
  });

  it("gera iniciais estaveis a partir do nome", () => {
    expect(getPlatformInitials("DeLoad Fit")).toBe("DF");
    expect(getPlatformInitials("Solo")).toBe("SO");
  });
});
