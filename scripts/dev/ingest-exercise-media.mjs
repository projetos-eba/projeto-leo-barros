#!/usr/bin/env node
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const bucketName = "system-exercise-media";
const sourceName = "Biblioteca oficial de exercícios";
const sourceVersion = "exercise-gifs-2026-07-31";
const defaultManifestPath = "supabase/seed-data/system-exercises.manifest.json";
const defaultReportDir = "docs/test-reports/exercise-media-library-2026-07-31";
const maxPosterSize = 480;
const maxPreviewSize = 640;

export function parseArgs(argv = process.argv.slice(2), env = process.env) {
  const options = {
    apply: false,
    dryRun: false,
    force: false,
    manifestPath: defaultManifestPath,
    reportDir: defaultReportDir,
    resume: false,
    sourceDir: env.EXERCISE_MEDIA_SOURCE_DIR ?? "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--apply") options.apply = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--resume") options.resume = true;
    else if (arg === "--source-dir") options.sourceDir = argv[++index] ?? "";
    else if (arg === "--report-dir") options.reportDir = argv[++index] ?? defaultReportDir;
    else if (arg === "--manifest") options.manifestPath = argv[++index] ?? defaultManifestPath;
    else throw new Error(`Argumento não reconhecido: ${arg}`);
  }

  if (!options.apply && !options.dryRun) options.dryRun = true;
  if (options.apply && options.dryRun) throw new Error("Use apenas um modo: --dry-run ou --apply.");
  if (!options.sourceDir.trim()) throw new Error("Informe --source-dir ou EXERCISE_MEDIA_SOURCE_DIR.");
  return options;
}

export function normalizeDisplayName(fileName) {
  return basename(fileName, extname(fileName))
    .normalize("NFC")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function exerciseCodeFromSlug(slug, checksum = "") {
  const base = `EX-${slug.toUpperCase()}`;
  return base.length <= 72 || !checksum ? base : `${base.slice(0, 64).replace(/-+$/g, "")}-${checksum.slice(0, 6).toUpperCase()}`;
}

function isHiddenPath(relativePath) {
  return relativePath.split(/[\\/]/).some((part) => part.startsWith(".") || part === "__MACOSX");
}

export function findGifFiles(sourceDir) {
  const root = resolve(sourceDir);
  const files = [];

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = join(current, entry.name);
      const rel = relative(root, absolute);
      if (isHiddenPath(rel)) continue;
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile() && extname(entry.name).toLowerCase() === ".gif") files.push(absolute);
    }
  }

  walk(root);
  return files.sort((left, right) => relative(root, left).localeCompare(relative(root, right), "pt-BR"));
}

export function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function assertGifHeader(buffer, relativePath) {
  const header = buffer.subarray(0, 6).toString("ascii");
  if (header !== "GIF87a" && header !== "GIF89a") {
    throw new Error(`${relativePath}: conteúdo não é GIF válido.`);
  }
}

export function countGifFrames(buffer) {
  if (buffer.length < 13) return 0;
  let offset = 13;
  const globalColorTableFlag = (buffer[10] & 0x80) !== 0;
  if (globalColorTableFlag) offset += 3 * (2 ** ((buffer[10] & 0x07) + 1));
  let frames = 0;

  function skipSubBlocks() {
    while (offset < buffer.length) {
      const size = buffer[offset];
      offset += 1;
      if (size === 0) break;
      offset += size;
    }
  }

  while (offset < buffer.length) {
    const introducer = buffer[offset];
    offset += 1;
    if (introducer === 0x3b) break;
    if (introducer === 0x21) {
      offset += 1;
      skipSubBlocks();
      continue;
    }
    if (introducer === 0x2c) {
      frames += 1;
      const packed = buffer[offset + 8];
      offset += 9;
      if ((packed & 0x80) !== 0) offset += 3 * (2 ** ((packed & 0x07) + 1));
      offset += 1;
      skipSubBlocks();
      continue;
    }
    break;
  }

  return frames;
}

export async function inspectGif(filePath, sourceDir) {
  const relativePath = relative(resolve(sourceDir), filePath).normalize("NFC");
  const sourceBuffer = readFileSync(filePath);
  assertGifHeader(sourceBuffer, relativePath);
  const metadata = await sharp(sourceBuffer, { animated: true }).metadata();
  const frameCount = Math.max(metadata.pages ?? 1, countGifFrames(sourceBuffer));
  const width = metadata.width ?? 0;
  const height = metadata.pageHeight ?? metadata.height ?? 0;
  if (frameCount < 1 || width < 1 || height < 1) {
    throw new Error(`${relativePath}: GIF sem frame ou dimensões válidas.`);
  }
  return {
    checksum: sha256(sourceBuffer),
    durationMs: Array.isArray(metadata.delay) ? metadata.delay.reduce((total, value) => total + value, 0) : null,
    fileName: basename(filePath).normalize("NFC"),
    frameCount,
    height,
    isAnimated: frameCount > 1,
    relativePath,
    sizeBytes: statSync(filePath).size,
    width,
  };
}

export function loadManifest(manifestPath) {
  if (!existsSync(manifestPath)) {
    return {
      generated_at: null,
      source_name: sourceName,
      source_version: sourceVersion,
      items: [],
    };
  }
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

function uniqueCode(slug, checksum, usedCodes) {
  let code = exerciseCodeFromSlug(slug, checksum);
  if (!usedCodes.has(code)) return code;
  code = exerciseCodeFromSlug(`${slug}-${checksum.slice(0, 6)}`, checksum);
  let suffix = 2;
  while (usedCodes.has(code)) {
    code = exerciseCodeFromSlug(`${slug}-${checksum.slice(0, 6)}-${suffix}`, checksum);
    suffix += 1;
  }
  return code;
}

export function reconcileManifest(inspected, previousManifest) {
  const previousItems = previousManifest.items ?? [];
  const byChecksum = new Map(previousItems.map((item) => [item.source_checksum, item]));
  const usedCodes = new Set(previousItems.map((item) => item.exercise_code));
  const slugCounts = new Map();
  const nameCounts = new Map();
  const checksumCounts = new Map();

  for (const item of inspected) {
    const name = normalizeDisplayName(item.fileName);
    const slug = slugify(name);
    slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
    nameCounts.set(name.toLocaleLowerCase("pt-BR"), (nameCounts.get(name.toLocaleLowerCase("pt-BR")) ?? 0) + 1);
    checksumCounts.set(item.checksum, (checksumCounts.get(item.checksum) ?? 0) + 1);
  }

  const nextItems = [];
  const classifications = {
    ambiguous: [],
    duplicate: [],
    failed: [],
    invalid: [],
    matched: [],
    new: [],
    unchanged: [],
    updated: [],
  };
  const seenChecksum = new Set();

  for (const item of inspected) {
    const name = normalizeDisplayName(item.fileName);
    const slug = slugify(name);
    const previous = byChecksum.get(item.checksum);
    const duplicatedChecksum = checksumCounts.get(item.checksum) > 1;
    const duplicatedSlug = slugCounts.get(slug) > 1;
    const duplicatedName = nameCounts.get(name.toLocaleLowerCase("pt-BR")) > 1;

    if (!slug) {
      classifications.invalid.push({ reason: "slug_empty", source_relative_path: item.relativePath });
      continue;
    }

    if (duplicatedChecksum && seenChecksum.has(item.checksum)) {
      classifications.duplicate.push({ checksum: item.checksum, source_relative_path: item.relativePath });
      continue;
    }
    seenChecksum.add(item.checksum);

    if ((duplicatedSlug || duplicatedName) && !previous) {
      classifications.ambiguous.push({ name, reason: duplicatedSlug ? "slug_conflict" : "name_conflict", slug, source_relative_path: item.relativePath });
      continue;
    }

    const code = previous?.exercise_code ?? uniqueCode(slug, item.checksum, usedCodes);
    usedCodes.add(code);
    const aliases = Array.from(new Set([...(previous?.aliases ?? []), previous && previous.name !== name ? name : null].filter(Boolean)));
    const status = previous
      ? previous.source_relative_path === item.relativePath && previous.source_file_name === item.fileName ? "unchanged" : "updated"
      : "new";
    const manifestItem = {
      aliases,
      exercise_code: code,
      generated_at: new Date().toISOString(),
      media_version: sourceVersion,
      name: previous?.name ?? name,
      original_height: item.height,
      original_size_bytes: item.sizeBytes,
      original_width: item.width,
      source_checksum: item.checksum,
      source_file_name: item.fileName,
      source_relative_path: item.relativePath,
      status: "published",
      slug: previous?.slug ?? slug,
    };
    nextItems.push(manifestItem);
    classifications[status].push({ exercise_code: code, name: manifestItem.name, source_relative_path: item.relativePath });
    if (previous) classifications.matched.push({ exercise_code: code, checksum: item.checksum });
  }

  return {
    classifications,
    manifest: {
      generated_at: new Date().toISOString(),
      source_name: sourceName,
      source_version: sourceVersion,
      items: nextItems.sort((left, right) => left.name.localeCompare(right.name, "pt-BR")),
    },
  };
}

async function optimizeMedia(filePath) {
  const sourceBuffer = readFileSync(filePath);
  const posterBuffer = await sharp(sourceBuffer, { animated: false, pages: 1 })
    .resize({ fit: "inside", height: maxPosterSize, width: maxPosterSize, withoutEnlargement: true })
    .webp({ effort: 4, quality: 80 })
    .toBuffer();
  const previewBuffer = await sharp(sourceBuffer, { animated: true })
    .resize({ fit: "inside", height: maxPreviewSize, width: maxPreviewSize, withoutEnlargement: true })
    .webp({ effort: 4, loop: 0, quality: 72 })
    .toBuffer();

  return { posterBuffer, previewBuffer, sourceBuffer };
}

function storagePaths(item) {
  const shortChecksum = item.source_checksum.slice(0, 8);
  const base = `exercise-library/${item.exercise_code}/${shortChecksum}`;
  return {
    poster: `${base}/poster.webp`,
    preview: `${base}/preview.webp`,
    source: `${base}/source.gif`,
  };
}

function publicStorageUrl(path) {
  return `/storage/v1/object/public/${bucketName}/${path}`;
}

function serviceClient(env = process.env) {
  const supabaseUrl = (env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321").replace(/^["']|["']$/g, "");
  const serviceRoleKey = (env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_KEY ?? "").replace(/^["']|["']$/g, "");
  if (!serviceRoleKey) {
    throw new Error("Modo --apply exige SUPABASE_SERVICE_ROLE_KEY no ambiente do script.");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

async function uploadIfNeeded(supabase, path, buffer, contentType) {
  if (await storageObjectExists(supabase, path)) {
    return { bytes: buffer.length, path, status: "skipped" };
  }

  const { error } = await supabase.storage.from(bucketName).upload(path, buffer, {
    cacheControl: "31536000, immutable",
    contentType,
    upsert: false,
  });
  if (error) throw new Error(`Falha ao enviar ${path}: ${error.message}`);
  return { bytes: buffer.length, path, status: "uploaded" };
}

async function storageObjectExists(supabase, path) {
  const parts = path.split("/");
  const fileName = parts.pop();
  const directory = parts.join("/");
  const existing = await supabase.storage.from(bucketName).list(directory, { limit: 100, search: fileName });
  return !existing.error && existing.data?.some((item) => item.name === fileName);
}

async function publishItem(supabase, item, filePath, reportItem) {
  const paths = storagePaths(item);
  const expectedPaths = [paths.source, paths.poster, paths.preview];
  const existingObjects = await Promise.all(expectedPaths.map((path) => storageObjectExists(supabase, path)));
  if (existingObjects.every(Boolean)) {
    const { data: exerciseRow } = await supabase
      .from("system_exercises")
      .select("id")
      .eq("source_key", `exercise-library:${item.exercise_code}`)
      .maybeSingle();
    if (exerciseRow?.id) {
      const { data: mediaRow } = await supabase
        .from("system_exercise_media")
        .select("id, poster_size_bytes, preview_size_bytes")
        .eq("system_exercise_id", exerciseRow.id)
        .eq("source_checksum", item.source_checksum)
        .maybeSingle();
      if (mediaRow?.id) {
        return {
          paths,
          posterBytes: mediaRow.poster_size_bytes ?? 0,
          previewBytes: mediaRow.preview_size_bytes ?? 0,
          sourceBytes: item.original_size_bytes,
          uploads: expectedPaths.map((path) => ({ bytes: 0, path, status: "skipped" })),
        };
      }
    }
  }

  const { posterBuffer, previewBuffer, sourceBuffer } = await optimizeMedia(filePath);
  const uploads = [
    await uploadIfNeeded(supabase, paths.source, sourceBuffer, "image/gif"),
    await uploadIfNeeded(supabase, paths.poster, posterBuffer, "image/webp"),
    await uploadIfNeeded(supabase, paths.preview, previewBuffer, "image/webp"),
  ];

  const exercisePayload = {
    category: null,
    description: null,
    difficulty_level: null,
    equipment: null,
    gif_storage_path: paths.preview,
    instructions: null,
    laterality: null,
    media_checksum: item.source_checksum,
    media_frame_count: reportItem.frameCount,
    media_height: item.original_height,
    media_is_animated: reportItem.isAnimated,
    media_published_at: new Date().toISOString(),
    media_status: "published",
    media_version: item.media_version,
    media_width: item.original_width,
    metadata: {
      aliases: item.aliases,
      generatedBy: "scripts/dev/ingest-exercise-media.mjs",
      sourceFileName: item.source_file_name,
      sourceRelativePath: item.source_relative_path,
    },
    name: item.name,
    poster_mime_type: "image/webp",
    poster_size_bytes: posterBuffer.length,
    poster_storage_path: paths.poster,
    preview_mime_type: "image/webp",
    preview_size_bytes: previewBuffer.length,
    preview_storage_path: paths.preview,
    primary_muscle_group: null,
    publication_status: "published",
    secondary_muscle_groups: [],
    slug: item.slug,
    source_checksum: item.source_checksum,
    source_gif_storage_path: paths.source,
    source_key: `exercise-library:${item.exercise_code}`,
    source_mime_type: "image/gif",
    source_name: sourceName,
    source_size_bytes: sourceBuffer.length,
    source_version: item.media_version,
  };

  const { data: exerciseRows, error: exerciseError } = await supabase
    .from("system_exercises")
    .upsert(exercisePayload, { onConflict: "source_key" })
    .select("id")
    .single();
  if (exerciseError) throw new Error(`Falha ao salvar exercício ${item.name}: ${exerciseError.message}`);

  const mediaPayload = {
    duration_ms: reportItem.durationMs,
    exercise_code: item.exercise_code,
    frame_count: reportItem.frameCount,
    is_animated: reportItem.isAnimated,
    media_version: item.media_version,
    metadata: { generatedBy: "scripts/dev/ingest-exercise-media.mjs" },
    original_height: item.original_height,
    original_size_bytes: sourceBuffer.length,
    original_width: item.original_width,
    poster_mime_type: "image/webp",
    poster_size_bytes: posterBuffer.length,
    poster_storage_path: paths.poster,
    preview_mime_type: "image/webp",
    preview_size_bytes: previewBuffer.length,
    preview_storage_path: paths.preview,
    published_at: new Date().toISOString(),
    source_checksum: item.source_checksum,
    source_file_name: item.source_file_name,
    source_key: exercisePayload.source_key,
    source_mime_type: "image/gif",
    source_relative_path: item.source_relative_path,
    source_storage_path: paths.source,
    status: "published",
    system_exercise_id: exerciseRows.id,
  };

  const { error: mediaError } = await supabase
    .from("system_exercise_media")
    .upsert(mediaPayload, { onConflict: "system_exercise_id,source_checksum" });
  if (mediaError) throw new Error(`Falha ao salvar mídia ${item.name}: ${mediaError.message}`);

  return {
    paths,
    posterBytes: posterBuffer.length,
    previewBytes: previewBuffer.length,
    sourceBytes: sourceBuffer.length,
    uploads,
  };
}

function writeReportFiles(reportDir, report, manifestCandidate = null) {
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(join(reportDir, "exercise-media-ingest-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  if (manifestCandidate) {
    writeFileSync(join(reportDir, "system-exercises.manifest.candidate.json"), `${JSON.stringify(manifestCandidate, null, 2)}\n`);
  }
  const lines = [
    "# Ingestão de mídias oficiais de exercícios",
    "",
    `Gerado em: ${report.generatedAt}`,
    "",
    `- Arquivos encontrados: ${report.summary.found}`,
    `- Válidos: ${report.summary.valid}`,
    `- Inválidos: ${report.summary.invalid}`,
    `- Animados: ${report.summary.animated}`,
    `- Estáticos: ${report.summary.static}`,
    `- Duplicados: ${report.summary.duplicate}`,
    `- Ambíguos: ${report.summary.ambiguous}`,
    `- Publicados/processáveis: ${report.summary.publishable}`,
    `- Enviados: ${report.summary.uploaded}`,
    `- Ignorados por idempotência: ${report.summary.skipped}`,
    "",
    "## Performance",
    "",
    `- Tamanho original total: ${report.performance.originalBytes} bytes`,
    `- Posters total: ${report.performance.posterBytes} bytes`,
    `- Previews total: ${report.performance.previewBytes} bytes`,
    `- Maior original: ${report.performance.largestOriginal?.name ?? "n/a"} (${report.performance.largestOriginal?.bytes ?? 0} bytes)`,
    `- Maior preview: ${report.performance.largestPreview?.name ?? "n/a"} (${report.performance.largestPreview?.bytes ?? 0} bytes)`,
  ];
  writeFileSync(join(reportDir, "relatorio.md"), `${lines.join("\n")}\n`);
}

async function run(options) {
  const sourceDir = resolve(options.sourceDir);
  if (!existsSync(sourceDir)) throw new Error(`Pasta não encontrada: ${sourceDir}`);
  const manifestPath = resolve(options.manifestPath);
  const reportDir = resolve(options.reportDir);
  const files = findGifFiles(sourceDir);
  const inspected = [];
  const invalid = [];

  for (const file of files) {
    try {
      inspected.push({ ...(await inspectGif(file, sourceDir)), filePath: file });
    } catch (error) {
      invalid.push({ error: error.message, source_relative_path: relative(sourceDir, file) });
    }
  }

  const previousManifest = loadManifest(manifestPath);
  const { classifications, manifest } = reconcileManifest(inspected, previousManifest);
  const publishable = manifest.items.filter((item) => item.status === "published");
  const sourceByChecksum = new Map(inspected.map((item) => [item.checksum, item]));
  const reportItems = [];
  let uploaded = 0;
  let skipped = 0;
  let posterBytes = 0;
  let previewBytes = 0;
  let largestPreview = null;

  if (options.apply) {
    const supabase = serviceClient();
    for (const item of publishable) {
      const source = sourceByChecksum.get(item.source_checksum);
      if (!source) continue;
      try {
        const result = await publishItem(supabase, item, source.filePath, source);
        const uploadedCount = result.uploads.filter((upload) => upload.status === "uploaded").length;
        const skippedCount = result.uploads.filter((upload) => upload.status === "skipped").length;
        uploaded += uploadedCount;
        skipped += skippedCount;
        posterBytes += result.posterBytes;
        previewBytes += result.previewBytes;
        if (!largestPreview || result.previewBytes > largestPreview.bytes) largestPreview = { bytes: result.previewBytes, name: item.name };
        reportItems.push({ exercise_code: item.exercise_code, name: item.name, result: uploadedCount > 0 ? "published" : "unchanged", ...result.paths });
      } catch (error) {
        classifications.failed.push({ error: error.message, exercise_code: item.exercise_code, name: item.name });
      }
    }
    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  } else {
    for (const item of publishable) {
      const source = sourceByChecksum.get(item.source_checksum);
      if (!source) continue;
      posterBytes += 0;
      previewBytes += 0;
      reportItems.push({ exercise_code: item.exercise_code, name: item.name, result: "dry_run", ...storagePaths(item) });
    }
  }

  const originalBytes = inspected.reduce((total, item) => total + item.sizeBytes, 0);
  const largestOriginal = inspected.reduce((current, item) => current && current.bytes > item.sizeBytes ? current : { bytes: item.sizeBytes, name: normalizeDisplayName(item.fileName) }, null);
  const report = {
    classifications,
    generatedAt: new Date().toISOString(),
    invalid,
    items: reportItems,
    mode: options.apply ? "apply" : "dry-run",
    performance: {
      largestOriginal,
      largestPreview,
      originalBytes,
      posterBytes,
      previewBytes,
      reductionPercent: posterBytes + previewBytes > 0 ? Number((100 - ((posterBytes + previewBytes) / originalBytes) * 100).toFixed(2)) : null,
    },
    sourceDir,
    sourceName,
    sourceVersion,
    summary: {
      ambiguous: classifications.ambiguous.length,
      animated: inspected.filter((item) => item.isAnimated).length,
      duplicate: classifications.duplicate.length,
      failed: classifications.failed.length,
      found: files.length,
      invalid: invalid.length + classifications.invalid.length,
      publishable: publishable.length,
      skipped,
      static: inspected.filter((item) => !item.isAnimated).length,
      uploaded,
      valid: inspected.length,
    },
  };

  writeReportFiles(reportDir, report, options.apply ? null : manifest);
  console.log(`${options.apply ? "APPLY" : "DRY-RUN"} OK: ${report.summary.valid}/${report.summary.found} GIFs válidos, ${report.summary.publishable} publicáveis.`);
  console.log(`Relatório: ${join(reportDir, "relatorio.md")}`);
  if (!options.apply) console.log(`Manifesto candidato: ${join(reportDir, "system-exercises.manifest.candidate.json")}`);
  else console.log(`Manifesto: ${manifestPath}`);
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isCli) {
  run(parseArgs()).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
