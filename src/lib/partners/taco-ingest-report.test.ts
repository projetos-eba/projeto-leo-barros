import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

type TacoReport = {
  duplicates: number;
  emptyCounts: Record<string, number>;
  negativeValues: Array<{ description: string; field: string; row: number; value: number }>;
  rejectedRows: number;
  rowCount: number;
  sourceChecksum: string;
  sourceFile: string;
  sourceVersion: string;
};

describe("TACO ingest report", () => {
  it("preserva o contrato da carga TACO normalizada", () => {
    const report = JSON.parse(readFileSync(resolve(process.cwd(), "supabase/seed-data/system-foods-taco.report.json"), "utf8")) as TacoReport;
    const sql = readFileSync(resolve(process.cwd(), "supabase/seed-data/system-foods-taco.sql"), "utf8");

    expect(report.rowCount).toBe(597);
    expect(report.duplicates).toBe(0);
    expect(report.rejectedRows).toBe(0);
    expect(report.sourceFile).toBe("tabelas_nutricionais.xlsx");
    expect(report.sourceVersion).toBe("TACO 4a ed. (2011)");
    expect(report.sourceChecksum).toBe("f1289702f58a1566a4ddd0e5d93932749eead2f02ee7e0b5ca7732e2438121e2");
    expect(report.emptyCounts.fibra_g_100g).toBe(235);
    expect(report.emptyCounts.fibra_g_por_g).toBe(235);
    expect(report.negativeValues).toHaveLength(8);
    expect(new Set(report.negativeValues.map((value) => value.description))).toHaveLength(4);
    expect(sql).toContain("on conflict (source_key) do update");
    expect(sql).not.toContain("NaN");
  });
});
