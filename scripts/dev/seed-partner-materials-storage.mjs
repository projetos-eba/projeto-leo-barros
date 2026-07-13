import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { createClient } from "@supabase/supabase-js";

const API_URL = "http://127.0.0.1:54321";
const PARTNER_ID = "a1000000-0000-4000-8000-000000000201";
const BUCKET = "partner-materials";
const scriptDir = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(scriptDir, "../../supabase/seed-assets/materials");

const fixtures = [
  {
    contentType: "application/pdf",
    localName: "dieta_low_carb_7_dias.pdf",
    path: `${PARTNER_ID}/c1000000-0000-4000-8000-000000000101/dieta_low_carb_7_dias.pdf`,
  },
  {
    contentType: "image/png",
    localName: "dieta_low_carb_7_dias-cover.png",
    path: `${PARTNER_ID}/c1000000-0000-4000-8000-000000000101/dieta_low_carb_7_dias-cover.png`,
  },
  {
    contentType: "application/pdf",
    localName: "treino_abc.pdf",
    path: `${PARTNER_ID}/c1000000-0000-4000-8000-000000000102/treino_abc.pdf`,
  },
  {
    contentType: "image/png",
    localName: "treino_abc-cover.png",
    path: `${PARTNER_ID}/c1000000-0000-4000-8000-000000000102/treino_abc-cover.png`,
  },
];

function fail(message) {
  throw new Error(message);
}

function parseEnv(output) {
  return Object.fromEntries(
    output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...parts] = line.split("=");
        return [key, parts.join("=").replace(/^"|"$/g, "")];
      }),
  );
}

function resolveContainer(prefix) {
  const names = execFileSync("docker", ["ps", "--format", "{{.Names}}"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const name = names.split("\n").find((item) => item.startsWith(prefix));
  if (!name) fail(`Container local não encontrado para ${prefix}.`);
  return name;
}

function getServiceRoleKey() {
  const container = resolveContainer("supabase_storage_");
  const output = execFileSync(
    "docker",
    ["inspect", "--format", "{{range .Config.Env}}{{println .}}{{end}}", container],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const env = parseEnv(output);
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SERVICE_KEY;
  if (!serviceRoleKey) fail("Credencial local do Storage indisponível.");
  return serviceRoleKey;
}

async function main() {
  const supabase = createClient(API_URL, getServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const fixture of fixtures) {
    const bytes = await readFile(join(assetsDir, fixture.localName));
    const { error } = await supabase.storage.from(BUCKET).upload(fixture.path, bytes, {
      cacheControl: "3600",
      contentType: fixture.contentType,
      upsert: true,
    });
    if (error) fail(`Falha ao enviar ${fixture.localName}: ${error.message}`);
    console.log(`OK: ${fixture.localName}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Falha ao preparar fixtures de materiais.");
  process.exitCode = 1;
});
