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
      initials: "DF",
      logoUrl: "https://assets.example.invalid/branding/logo.png",
      platformName: "DeLoad Fit",
    });
  });

  it("usa fallback seguro para JSON invalido", () => {
    expect(resolvePlatformBrandingFromValue(null).platformName).toBe(DEFAULT_PLATFORM_NAME);
    expect(resolvePlatformBrandingFromValue({ platformName: " " }).platformName).toBe(DEFAULT_PLATFORM_NAME);
    expect(resolvePlatformBrandingFromValue({ logo: { path: "bad/logo.png" } }).logo).toBeNull();
  });

  it("gera iniciais estaveis a partir do nome", () => {
    expect(getPlatformInitials("DeLoad Fit")).toBe("DF");
    expect(getPlatformInitials("Solo")).toBe("SO");
  });
});
