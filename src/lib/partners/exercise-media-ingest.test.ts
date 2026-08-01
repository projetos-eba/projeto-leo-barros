import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

type IngestModule = {
  exerciseCodeFromSlug: (slug: string, checksum?: string) => string;
  findGifFiles: (sourceDir: string) => string[];
  inspectGif: (filePath: string, sourceDir: string) => Promise<{
    checksum: string;
    frameCount: number;
    isAnimated: boolean;
  }>;
  normalizeDisplayName: (fileName: string) => string;
  parseArgs: (argv: string[], env: Record<string, string | undefined>) => { apply: boolean; dryRun: boolean };
  reconcileManifest: (inspected: unknown[], previousManifest: { items: unknown[] }) => {
    classifications: { duplicate: unknown[] };
    manifest: { items: Array<{ aliases: string[]; exercise_code: string }> };
  };
  slugify: (value: string) => string;
};

const ingestModuleUrl = pathToFileURL(join(process.cwd(), "scripts/dev/ingest-exercise-media.mjs")).href;
const ingestProcessScript = `
const payload = JSON.parse(process.argv[1]);
const ingest = await import(${JSON.stringify(ingestModuleUrl)});
const result = await ingest[payload.fn](...payload.args);
process.stdout.write(JSON.stringify(result));
`;

function callIngest<T>(fn: keyof IngestModule, args: unknown[]): T {
  try {
    const output = execFileSync(process.execPath, ["--input-type=module", "-e", ingestProcessScript, JSON.stringify({ args, fn })], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return JSON.parse(output) as T;
  } catch (error) {
    const failure = error as { message: string; stderr?: string; stdout?: string };
    throw new Error((failure.stderr || failure.stdout || failure.message).trim());
  }
}

const ingest: IngestModule = {
  exerciseCodeFromSlug: (slug, checksum) => callIngest("exerciseCodeFromSlug", [slug, checksum]),
  findGifFiles: (sourceDir) => callIngest("findGifFiles", [sourceDir]),
  inspectGif: async (filePath, sourceDir) => callIngest("inspectGif", [filePath, sourceDir]),
  normalizeDisplayName: (fileName) => callIngest("normalizeDisplayName", [fileName]),
  parseArgs: (argv, env) => callIngest("parseArgs", [argv, env]),
  reconcileManifest: (inspected, previousManifest) => callIngest("reconcileManifest", [inspected, previousManifest]),
  slugify: (value) => callIngest("slugify", [value]),
};

function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

const staticGif = Buffer.from("R0lGODlhAQABAIABAP///wAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==", "base64");
const animatedGif = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH/C05FVFNDQVBFMi4wAwEAAAAh+QQACgAAACwAAAAAAQABAAACAkQBACH5BAAKAAAALAAAAAABAAEAAAICTAEAOw==",
  "base64",
);

function tempDir() {
  return mkdtempSync(join(tmpdir(), "exercise-media-ingest-test-"));
}

describe("ingest-exercise-media", () => {
  it("normaliza nome preservando acentos e hífens e gera slug seguro", () => {
    expect(ingest.normalizeDisplayName("Elevação de quadril com barra (hip thrust).GIF")).toBe("Elevação de quadril com barra (hip thrust)");
    expect(ingest.normalizeDisplayName("Abdominal declinado (sit-up).gif")).toBe("Abdominal declinado (sit-up)");
    expect(ingest.slugify("Abdominal declinado (sit-up)")).toBe("abdominal-declinado-sit-up");
    expect(ingest.exerciseCodeFromSlug("abdominal-bicicleta")).toBe("EX-ABDOMINAL-BICICLETA");
  });

  it("encontra GIFs recursivamente e ignora arquivos ocultos", () => {
    const dir = tempDir();
    mkdirSync(join(dir, "sub"));
    mkdirSync(join(dir, ".hidden"));
    writeFileSync(join(dir, "sub", "Agachamento.GIF"), staticGif);
    writeFileSync(join(dir, ".hidden", "Oculto.gif"), staticGif);
    writeFileSync(join(dir, ".DS_Store"), "");

    expect(ingest.findGifFiles(dir).map((file) => file.endsWith("Agachamento.GIF"))).toEqual([true]);
  });

  it("valida conteúdo real, checksum, GIF estático e GIF animado", async () => {
    const dir = tempDir();
    const staticPath = join(dir, "Prancha.gif");
    const animatedPath = join(dir, "Abdominal bicicleta.gif");
    writeFileSync(staticPath, staticGif);
    writeFileSync(animatedPath, animatedGif);

    const staticInfo = await ingest.inspectGif(staticPath, dir);
    const animatedInfo = await ingest.inspectGif(animatedPath, dir);

    expect(staticInfo.checksum).toBe(sha256(staticGif));
    expect(staticInfo.frameCount).toBeGreaterThanOrEqual(1);
    expect(staticInfo.isAnimated).toBe(false);
    expect(animatedInfo.frameCount).toBeGreaterThan(1);
    expect(animatedInfo.isAnimated).toBe(true);
  });

  it("falha claramente para arquivo com extensão gif e conteúdo inválido", async () => {
    const dir = tempDir();
    const invalidPath = join(dir, "quebrado.gif");
    writeFileSync(invalidPath, "not-a-gif");

    await expect(ingest.inspectGif(invalidPath, dir)).rejects.toThrow("conteúdo não é GIF válido");
  });

  it("classifica duplicatas e preserva código existente por checksum em rename", () => {
    const checksum = sha256(staticGif);
    const previous = {
      items: [{
        aliases: [],
        exercise_code: "EX-PRANCHA",
        media_version: "old",
        name: "Prancha",
        original_height: 1,
        original_size_bytes: staticGif.length,
        original_width: 1,
        source_checksum: checksum,
        source_file_name: "Prancha.gif",
        source_relative_path: "Prancha.gif",
        status: "published",
        slug: "prancha",
      }],
    };
    const inspected = [
      { checksum, fileName: "Prancha frontal.gif", frameCount: 1, height: 1, isAnimated: false, relativePath: "Prancha frontal.gif", sizeBytes: staticGif.length, width: 1 },
      { checksum, fileName: "Prancha copia.gif", frameCount: 1, height: 1, isAnimated: false, relativePath: "Prancha copia.gif", sizeBytes: staticGif.length, width: 1 },
    ];

    const result = ingest.reconcileManifest(inspected, previous);
    expect(result.manifest.items).toHaveLength(1);
    expect(result.manifest.items[0].exercise_code).toBe("EX-PRANCHA");
    expect(result.manifest.items[0].aliases).toContain("Prancha frontal");
    expect(result.classifications.duplicate).toHaveLength(1);
  });

  it("mantém dry-run como modo padrão sem aplicar", () => {
    expect(ingest.parseArgs(["--source-dir", "/tmp/exercicios"], {})).toMatchObject({ apply: false, dryRun: true });
  });
});
