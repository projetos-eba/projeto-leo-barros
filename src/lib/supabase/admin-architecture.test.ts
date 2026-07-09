import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("arquitetura do Supabase admin", () => {
  it("mantem o client de service role restrito ao server-only", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/lib/supabase/admin.ts"),
      "utf8",
    );

    expect(source).toContain('import "server-only";');
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
  });
});
