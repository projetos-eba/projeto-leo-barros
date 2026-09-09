import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeMuscleGroup } from "./normalization";

const catalog = JSON.parse(readFileSync("supabase/seed-data/exercise-muscle-classifications.json", "utf8")) as { items: { source_key: string; primary_muscle_group: string | null; secondary_muscle_groups: string[]; status: string }[] };
const manifest = JSON.parse(readFileSync("supabase/seed-data/system-exercises.manifest.json", "utf8")) as { items: { exercise_code: string }[] };
describe("explicit muscle classification catalog", () => {
  it("accounts for every stable exercise identifier, including review pending entries", () => {
    expect(new Set(catalog.items.map((item) => item.source_key))).toEqual(new Set(manifest.items.map((item) => `exercise-library:${item.exercise_code}`)));
    expect(new Set(catalog.items.map((item) => item.source_key)).size).toBe(catalog.items.length);
    for (const item of catalog.items) {
      if (item.status === "pending_review") { expect(item.primary_muscle_group).toBeNull(); continue; }
      expect(normalizeMuscleGroup(item.primary_muscle_group)).toBe(item.primary_muscle_group);
      expect(item.secondary_muscle_groups).not.toContain(item.primary_muscle_group);
      expect(item.secondary_muscle_groups.every((group) => normalizeMuscleGroup(group) === group)).toBe(true);
    }
  });
  it("keeps the database catalog aligned with the reviewable JSON", () => {
    const sql = readFileSync("supabase/migrations/20260909121000_exercise_muscle_classification.sql", "utf8");
    for (const item of catalog.items) {
      const primary = item.primary_muscle_group ? `'${item.primary_muscle_group}'` : "null";
      const secondary = `array[${item.secondary_muscle_groups.map((group) => `'${group}'`).join(",")}]::text[]`;
      expect(sql).toContain(`('${item.source_key}',${primary},${secondary},'${item.status}','2026-09-09')`);
    }
  });
});
