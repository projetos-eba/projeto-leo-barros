#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const expectedHeaders = [
  "numero_alimento",
  "descricao",
  "categoria_TACO",
  "macronutriente_predominante",
  "energia_kcal_100g",
  "carboidrato_g_100g",
  "proteina_g_100g",
  "lipideos_g_100g",
  "fibra_g_100g",
  "carboidrato_g_por_g",
  "proteina_g_por_g",
  "gordura_g_por_g",
  "fibra_g_por_g",
  "energia_kcal_por_g",
  "fonte",
];

const sourceVersion = "TACO 4a ed. (2011)";
const defaultSource = "TACO 4a ed. (2011) - NEPA/UNICAMP";

function usage() {
  console.error("Uso: node scripts/dev/ingest-taco-foods.mjs <xlsx> [--out-sql path] [--out-report path]");
}

function argValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function decodeXml(value) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function unzipText(xlsxPath, entry) {
  return execFileSync("unzip", ["-p", xlsxPath, entry], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
}

function columnIndex(ref) {
  const letters = ref.replace(/[^A-Z]/gi, "").toUpperCase();
  return [...letters].reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function parseSharedStrings(xml) {
  return [...xml.matchAll(/<si\b[\s\S]*?<\/si>/g)].map(([entry]) => {
    const pieces = [...entry.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((match) => decodeXml(match[1]));
    return pieces.join("");
  });
}

function parseRows(xml, sharedStrings) {
  return [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const cells = new Map();
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*?)\/>|<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = cellMatch[1] ?? cellMatch[2];
      const body = cellMatch[3] ?? "";
      const ref = attributes.match(/\br="([^"]+)"/)?.[1];
      if (!ref) continue;
      const type = attributes.match(/\bt="([^"]+)"/)?.[1];
      const valueMatch = body.match(/<v>([\s\S]*?)<\/v>/);
      const inlineMatch = body.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/);
      let value = "";
      if (valueMatch) {
        value = type === "s" ? sharedStrings[Number(valueMatch[1])] ?? "" : valueMatch[1];
      } else if (inlineMatch) {
        value = decodeXml(inlineMatch[1]);
      }
      cells.set(columnIndex(ref), String(value).trim());
    }
    if (cells.size === 0) return [];
    const width = Math.max(...cells.keys()) + 1;
    return Array.from({ length: width }, (_, index) => cells.get(index) ?? "");
  }).filter((row) => row.length > 0);
}

function normalizeText(value) {
  return value.normalize("NFC").replace(/\s+/g, " ").trim();
}

function numericOrNull(value) {
  const normalized = String(value ?? "").replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`Valor numérico inválido: ${value}`);
  return parsed;
}

function partnerCategory(categoryTaco) {
  const value = categoryTaco.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (value.includes("carne") || value.includes("pescado") || value.includes("ovo")) return "carne";
  if (value.includes("cereal") || value.includes("preparado") || value.includes("acucar")) return "cereal";
  if (value.includes("fruta")) return "fruta";
  if (value.includes("gordura") || value.includes("oleo") || value.includes("nozes") || value.includes("sementes")) return "gordura";
  if (value.includes("leite")) return "laticinio";
  if (value.includes("leguminosa")) return "leguminosa";
  if (value.includes("verdura") || value.includes("hortalica")) return "verdura";
  return "outros";
}

function sqlText(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  return value === null || value === undefined ? "null" : String(value);
}

function rowHash(row) {
  return createHash("sha256").update(JSON.stringify(row)).digest("hex");
}

function normalizeRows(rows, sourceChecksum) {
  const headers = rows[0] ?? [];
  if (headers.length !== expectedHeaders.length || expectedHeaders.some((header, index) => headers[index] !== header)) {
    throw new Error(`Cabeçalhos inesperados. Esperado: ${expectedHeaders.join(", ")}`);
  }

  const seenNumbers = new Set();
  const seenDescriptions = new Set();
  const duplicates = [];
  const negatives = [];
  const emptyCounts = Object.fromEntries(expectedHeaders.map((header) => [header, 0]));

  const foods = rows.slice(1).map((cells, rowIndex) => {
    const record = Object.fromEntries(expectedHeaders.map((header, index) => [header, cells[index] ?? ""]));
    for (const [key, value] of Object.entries(record)) {
      if (value === "") emptyCounts[key] += 1;
    }

    const foodNumber = Number(record.numero_alimento);
    const description = normalizeText(record.descricao);
    const categoryTaco = normalizeText(record.categoria_TACO);
    const predominantMacro = normalizeText(record.macronutriente_predominante);
    const sourceName = normalizeText(record.fonte);

    if (!Number.isInteger(foodNumber)) throw new Error(`Linha ${rowIndex + 2}: numero_alimento inválido.`);
    if (description.length < 2) throw new Error(`Linha ${rowIndex + 2}: descricao obrigatória.`);
    if (categoryTaco.length === 0) throw new Error(`Linha ${rowIndex + 2}: categoria_TACO obrigatória.`);
    if (sourceName !== defaultSource) throw new Error(`Linha ${rowIndex + 2}: fonte inesperada.`);
    if (seenNumbers.has(foodNumber)) duplicates.push({ field: "numero_alimento", row: rowIndex + 2, value: foodNumber });
    if (seenDescriptions.has(description.toLowerCase())) duplicates.push({ field: "descricao", row: rowIndex + 2, value: description });
    seenNumbers.add(foodNumber);
    seenDescriptions.add(description.toLowerCase());

    const numericFields = {
      energy_kcal_100g: numericOrNull(record.energia_kcal_100g),
      carbohydrate_g_100g: numericOrNull(record.carboidrato_g_100g),
      protein_g_100g: numericOrNull(record.proteina_g_100g),
      lipids_g_100g: numericOrNull(record.lipideos_g_100g),
      fiber_g_100g: numericOrNull(record.fibra_g_100g),
      carbohydrate_g_per_g: numericOrNull(record.carboidrato_g_por_g),
      protein_g_per_g: numericOrNull(record.proteina_g_por_g),
      fat_g_per_g: numericOrNull(record.gordura_g_por_g),
      fiber_g_per_g: numericOrNull(record.fibra_g_por_g),
      energy_kcal_per_g: numericOrNull(record.energia_kcal_por_g),
    };

    for (const [field, value] of Object.entries(numericFields)) {
      if (value !== null && value < 0) negatives.push({ description, field, row: rowIndex + 2, value });
    }

    const normalized = {
      ...numericFields,
      category_taco: categoryTaco,
      description,
      food_number: foodNumber,
      partner_category: partnerCategory(categoryTaco),
      predominant_macro: predominantMacro,
      source_checksum: sourceChecksum,
      source_key: `taco-2011-${foodNumber}`,
      source_name: sourceName,
      source_version: sourceVersion,
    };

    return { ...normalized, source_row_hash: rowHash(normalized) };
  });

  if (duplicates.length > 0) {
    throw new Error(`Registros duplicados encontrados: ${JSON.stringify(duplicates.slice(0, 5))}`);
  }
  if (foods.length !== 597) {
    throw new Error(`Total inesperado de alimentos: ${foods.length}. Esperado: 597.`);
  }

  return { emptyCounts, foods, negatives };
}

function buildSql(foods, report) {
  const rows = foods.map((food) => `  (${[
    sqlText(food.source_key),
    food.food_number,
    sqlText(food.description),
    sqlText(food.category_taco),
    sqlText(food.partner_category),
    sqlText(food.predominant_macro),
    sqlNumber(food.energy_kcal_100g),
    sqlNumber(food.carbohydrate_g_100g),
    sqlNumber(food.protein_g_100g),
    sqlNumber(food.lipids_g_100g),
    sqlNumber(food.fiber_g_100g),
    sqlNumber(food.carbohydrate_g_per_g),
    sqlNumber(food.protein_g_per_g),
    sqlNumber(food.fat_g_per_g),
    sqlNumber(food.fiber_g_per_g),
    sqlNumber(food.energy_kcal_per_g),
    sqlText(food.source_name),
    sqlText(food.source_version),
    sqlText(food.source_checksum),
    sqlText(food.source_row_hash),
    "'published'",
    sqlText(JSON.stringify({ generatedBy: "scripts/dev/ingest-taco-foods.mjs" })),
  ].join(", ")})`).join(",\n");

  return `-- Generated by scripts/dev/ingest-taco-foods.mjs. Do not edit manually.
-- Source checksum: ${report.sourceChecksum}
-- Source rows: ${report.rowCount}

insert into public.system_foods (
  source_key, food_number, description, category_taco, partner_category,
  predominant_macro, energy_kcal_100g, carbohydrate_g_100g, protein_g_100g,
  lipids_g_100g, fiber_g_100g, carbohydrate_g_per_g, protein_g_per_g,
  fat_g_per_g, fiber_g_per_g, energy_kcal_per_g, source_name, source_version,
  source_checksum, source_row_hash, publication_status, metadata
)
values
${rows}
on conflict (source_key) do update
set
  food_number = excluded.food_number,
  description = excluded.description,
  category_taco = excluded.category_taco,
  partner_category = excluded.partner_category,
  predominant_macro = excluded.predominant_macro,
  energy_kcal_100g = excluded.energy_kcal_100g,
  carbohydrate_g_100g = excluded.carbohydrate_g_100g,
  protein_g_100g = excluded.protein_g_100g,
  lipids_g_100g = excluded.lipids_g_100g,
  fiber_g_100g = excluded.fiber_g_100g,
  carbohydrate_g_per_g = excluded.carbohydrate_g_per_g,
  protein_g_per_g = excluded.protein_g_per_g,
  fat_g_per_g = excluded.fat_g_per_g,
  fiber_g_per_g = excluded.fiber_g_per_g,
  energy_kcal_per_g = excluded.energy_kcal_per_g,
  source_name = excluded.source_name,
  source_version = excluded.source_version,
  source_checksum = excluded.source_checksum,
  source_row_hash = excluded.source_row_hash,
  publication_status = excluded.publication_status,
  metadata = excluded.metadata,
  updated_at = now();
`;
}

const input = process.argv[2];
if (!input || input.startsWith("--")) {
  usage();
  process.exit(1);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "../..");
const xlsxPath = resolve(process.cwd(), input);
const outSql = resolve(process.cwd(), argValue("--out-sql", "supabase/seed-data/system-foods-taco.sql"));
const outReport = resolve(process.cwd(), argValue("--out-report", "supabase/seed-data/system-foods-taco.report.json"));
const sourceBuffer = readFileSync(xlsxPath);
const sourceChecksum = createHash("sha256").update(sourceBuffer).digest("hex");

const sharedStrings = parseSharedStrings(unzipText(xlsxPath, "xl/sharedStrings.xml"));
const tacoSheetXml = unzipText(xlsxPath, "xl/worksheets/sheet2.xml");
const rows = parseRows(tacoSheetXml, sharedStrings);
const { emptyCounts, foods, negatives } = normalizeRows(rows, sourceChecksum);
const report = {
  duplicates: 0,
  emptyCounts,
  negativeValues: negatives,
  rejectedRows: 0,
  rowCount: foods.length,
  sheet: "TACO",
  sourceChecksum,
  sourceFile: basename(xlsxPath),
  sourceVersion,
};

mkdirSync(dirname(outSql), { recursive: true });
writeFileSync(outSql, buildSql(foods, report));
writeFileSync(outReport, `${JSON.stringify(report, null, 2)}\n`);

console.log(`TACO OK: ${foods.length} alimentos, ${negatives.length} valores negativos preservados.`);
console.log(`SQL: ${outSql}`);
console.log(`Relatório: ${outReport}`);
