import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("arquitetura do Supabase admin no Next", () => {
  it("nao mantem client de service role no runtime Next", () => {
    expect(
      existsSync(resolve(process.cwd(), "src/lib/supabase/admin.ts")),
    ).toBe(false);
    expect(
      existsSync(resolve(process.cwd(), "src/lib/env/server.ts")),
    ).toBe(false);
  });

  it("mantem Server Actions de auth delegando operacoes privilegiadas para Edge Functions", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/login/account-actions.ts"),
      "utf8",
    );

    expect(source).not.toContain("createAdminClient");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).toContain('"complete-client-first-access"');
    expect(source).toContain('"signup-partner"');
  });
});
