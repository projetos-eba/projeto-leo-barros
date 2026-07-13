import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { createClient } from "@supabase/supabase-js";

const API_URL = "http://127.0.0.1:54321";
const PARTNER_ID = "a1000000-0000-4000-8000-000000000201";
const PATIENT_ID = "a1000000-0000-4000-8000-000000000301";
const BUCKET = "partner-client-photos";
const scriptDir = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(scriptDir, "../../docs/Fotos-teste-Evolucao");

const fixtures = [
  {
    localName: "Frente 1.png",
    path: `${PARTNER_ID}/${PATIENT_ID}/f4000000-0000-4000-8000-000000000101/frente-1.png`,
  },
  {
    localName: "Costas 1.png",
    path: `${PARTNER_ID}/${PATIENT_ID}/f4000000-0000-4000-8000-000000000101/costas-1.png`,
  },
  {
    localName: "Esquerdo 1.png",
    path: `${PARTNER_ID}/${PATIENT_ID}/f4000000-0000-4000-8000-000000000101/esquerdo-1.png`,
  },
  {
    localName: "Direito 1.png",
    path: `${PARTNER_ID}/${PATIENT_ID}/f4000000-0000-4000-8000-000000000101/direito-1.png`,
  },
  {
    localName: "Frente 2.png",
    path: `${PARTNER_ID}/${PATIENT_ID}/f4000000-0000-4000-8000-000000000102/frente-2.png`,
  },
  {
    localName: "Costas 2.png",
    path: `${PARTNER_ID}/${PATIENT_ID}/f4000000-0000-4000-8000-000000000102/costas-2.png`,
  },
  {
    localName: "Esquerdo 2.png",
    path: `${PARTNER_ID}/${PATIENT_ID}/f4000000-0000-4000-8000-000000000102/esquerdo-2.png`,
  },
  {
    localName: "Direito 2.png",
    path: `${PARTNER_ID}/${PATIENT_ID}/f4000000-0000-4000-8000-000000000102/direito-2.png`,
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
      contentType: "image/png",
      upsert: true,
    });
    if (error) fail(`Falha ao enviar ${fixture.localName}: ${error.message}`);
    console.log(`OK: ${fixture.localName}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Falha ao preparar fixtures de Fotos.");
  process.exitCode = 1;
});
