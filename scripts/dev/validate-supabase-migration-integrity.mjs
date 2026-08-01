import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationsDir = path.join(root, "supabase", "migrations");
const testsDir = path.join(root, "supabase", "tests");
const failures = [];
const warnings = [];

const requiredMigrationFragments = {
  "20260730120000_global_catalog_libraries.sql": [
    "create table public.system_foods",
    "create table public.system_exercises",
    "alter table public.partner_protocol_foods",
    "add column system_food_id uuid",
    "alter table public.partner_protocol_exercises",
    "add column system_exercise_id uuid",
    "partner_protocol_foods_partner_system_food_key",
    "partner_protocol_exercises_partner_system_exercise_key",
    "partner_import_system_foods",
    "partner_import_system_exercises",
  ],
  "20260731100000_system_exercise_media_ingest.sql": [
    "create table public.system_exercise_media",
    "source_gif_storage_path",
    "preview_storage_path",
    "media_checksum",
    "system_exercise_media_select_published",
  ],
  "20260731110000_catalog_import_items_fk_indexes.sql": [
    "catalog_import_items_system_food_idx",
    "catalog_import_items_system_exercise_idx",
  ],
  "20260731120000_system_exercise_media_storage_listing_hardening.sql": [
    "drop policy if exists system_exercise_media_select_public",
  ],
};

const requiredContractTestFragments = [
  "has_table('public', 'system_foods'",
  "has_table('public', 'system_exercises'",
  "has_column('public', 'partner_protocol_foods', 'system_food_id'",
  "has_column('public', 'partner_protocol_exercises', 'system_exercise_id'",
  "has_index('public', 'partner_protocol_foods', 'partner_protocol_foods_partner_system_food_key'",
  "has_index('public', 'partner_protocol_exercises', 'partner_protocol_exercises_partner_system_exercise_key'",
];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readRequired(filePath) {
  if (!existsSync(filePath)) {
    fail(`Arquivo obrigatorio ausente: ${path.relative(root, filePath)}`);
    return "";
  }
  return readFileSync(filePath, "utf8");
}

function assertContains(filePath, content, fragments) {
  for (const fragment of fragments) {
    if (!content.includes(fragment)) {
      fail(`${path.relative(root, filePath)} nao contem contrato esperado: ${fragment}`);
    }
  }
}

if (!existsSync(migrationsDir)) {
  fail("Diretorio supabase/migrations nao encontrado.");
} else {
  const migrations = readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  const seenVersions = new Map();
  let previousVersion = "";
  for (const fileName of migrations) {
    const match = fileName.match(/^(\d{14})_[a-z0-9_]+\.sql$/);
    if (!match) {
      fail(`Migration com nome fora do padrao YYYYMMDDHHMMSS_name.sql: ${fileName}`);
      continue;
    }

    const version = match[1];
    if (seenVersions.has(version)) {
      fail(`Timestamp de migration duplicado: ${version} em ${seenVersions.get(version)} e ${fileName}`);
    }
    seenVersions.set(version, fileName);

    if (previousVersion && version <= previousVersion) {
      fail(`Ordem cronologica invalida em migrations: ${fileName}`);
    }
    previousVersion = version;

    const content = readRequired(path.join(migrationsDir, fileName));
    if (content.includes("\uFEFF")) {
      fail(`Migration contem BOM UTF-8: ${fileName}`);
    }
    if (content.includes("<<<<<<<") || content.includes("=======") || content.includes(">>>>>>>")) {
      fail(`Migration contem marcador de conflito Git: ${fileName}`);
    }
    if (/\b(drop\s+table|drop\s+column|truncate\s+table)\b/i.test(content)) {
      warn(`Migration contem DDL potencialmente destrutivo e deve ter revisao explicita: ${fileName}`);
    }
  }
}

for (const [fileName, fragments] of Object.entries(requiredMigrationFragments)) {
  const filePath = path.join(migrationsDir, fileName);
  assertContains(filePath, readRequired(filePath), fragments);
}

const contractTestPath = path.join(testsDir, "033_global_catalog_libraries.test.sql");
assertContains(contractTestPath, readRequired(contractTestPath), requiredContractTestFragments);

const configToml = readRequired(path.join(root, "supabase", "config.toml"));
for (const seedPath of ["./seed.sql", "./seed-data/system-foods-taco.sql"]) {
  if (!configToml.includes(seedPath)) {
    fail(`supabase/config.toml nao referencia seed esperado: ${seedPath}`);
  }
}

const packageJson = JSON.parse(readRequired(path.join(root, "package.json")));
for (const scriptName of ["db:reset", "db:lint", "test:db", "ci:schema"]) {
  if (!packageJson.scripts?.[scriptName]) {
    fail(`package.json nao define script obrigatorio: ${scriptName}`);
  }
}

if (process.env.CHECK_REMOTE_MIGRATIONS === "true") {
  try {
    const output = execFileSync("npx", ["supabase", "migration", "list"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const parsed = JSON.parse(output);
    const driftRows = (parsed.migrations ?? []).filter((row) => !row.local || !row.remote);
    if (driftRows.length > 0) {
      fail(`Drift entre migrations locais e remotas: ${JSON.stringify(driftRows)}`);
    }
  } catch (error) {
    fail(`Nao foi possivel comparar migrations remotas: ${error.message}`);
  }
} else {
  warn("Comparacao remota ignorada. Defina CHECK_REMOTE_MIGRATIONS=true em ambientes com Supabase linkado.");
}

for (const message of warnings) {
  console.warn(`[migration-integrity:warn] ${message}`);
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(`[migration-integrity:error] ${message}`);
  }
  process.exit(1);
}

console.log("Supabase migration integrity OK.");
