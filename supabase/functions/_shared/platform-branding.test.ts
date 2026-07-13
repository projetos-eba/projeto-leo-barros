import {
  DEFAULT_PLATFORM_NAME,
  type PlatformSettingsClient,
  resolvePlatformEmailBranding,
  resolvePlatformEmailBrandingFromValue,
} from "./platform-branding.ts";

function clientWithResult(
  result: {
    data: { value: unknown } | null;
    error: { code?: string; message?: string } | null;
  },
  calls: string[] = [],
): PlatformSettingsClient {
  return {
    from(table) {
      calls.push(`from:${table}`);
      return {
        select(columns) {
          calls.push(`select:${columns}`);
          return {
            eq(column, value) {
              calls.push(`eq:${column}:${value}`);
              return {
                maybeSingle() {
                  calls.push("maybeSingle");
                  return Promise.resolve(result);
                },
              };
            },
          };
        },
      };
    },
  };
}

Deno.test("resolvePlatformEmailBranding retorna platformName configurado com trim", async () => {
  const calls: string[] = [];
  const branding = await resolvePlatformEmailBranding(
    clientWithResult({
      data: { value: { platformName: "  Minha Plataforma  " } },
      error: null,
    }, calls),
  );

  if (branding.platformName !== "Minha Plataforma") {
    throw new Error(`platformName inesperado: ${branding.platformName}`);
  }

  if (!calls.includes("eq:key:general")) {
    throw new Error("consulta deve usar key=general");
  }
});

Deno.test("resolvePlatformEmailBranding usa fallback quando registro nao existe", async () => {
  const branding = await resolvePlatformEmailBranding(
    clientWithResult({ data: null, error: null }),
  );

  if (branding.platformName !== DEFAULT_PLATFORM_NAME) {
    throw new Error("fallback esperado para registro ausente");
  }
});

Deno.test("resolvePlatformEmailBrandingFromValue usa fallback para JSON invalido", () => {
  const cases = [
    null,
    "texto",
    [],
    { platformName: 123 },
    { platformName: "   " },
  ];

  for (const value of cases) {
    const branding = resolvePlatformEmailBrandingFromValue(value);
    if (branding.platformName !== DEFAULT_PLATFORM_NAME) {
      throw new Error(`fallback esperado para ${JSON.stringify(value)}`);
    }
  }
});

Deno.test("resolvePlatformEmailBranding usa fallback em erro de leitura", async () => {
  const branding = await resolvePlatformEmailBranding(
    clientWithResult({
      data: null,
      error: { code: "PGRST000", message: "database unavailable" },
    }),
  );

  if (branding.platformName !== DEFAULT_PLATFORM_NAME) {
    throw new Error("fallback esperado em erro de leitura");
  }
});
