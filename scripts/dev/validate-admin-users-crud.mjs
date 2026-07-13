import { execFileSync, spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const ADMIN_EMAIL = "antoniofelipe258@gmail.com";
const ADMIN_PASSWORD = process.env.LEO_LOCAL_ADMIN_PASSWORD ?? "123456";
const FIXTURE_EMAIL = process.env.ADMIN_USERS_SMOKE_EMAIL ??
  "viniciusferrari.silva@gmail.com";
const FIXTURE_NAME = "Admin Smoke CRUD";
const LOCAL_NEXT_ORIGIN = "http://localhost:3000";
const LOCAL_SUPABASE_API_URL = "http://127.0.0.1:54321";
const children = new Set();

function log(message) {
  console.log(`OK: ${message}`);
}

function fail(message) {
  throw new Error(message);
}

function parseEnvOutput(output) {
  return Object.fromEntries(
    output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...valueParts] = line.split("=");
        return [key, valueParts.join("=").replace(/^"|"$/g, "")];
      }),
  );
}

function resolveSupabaseContainer(prefix) {
  const output = execFileSync("docker", ["ps", "--format", "{{.Names}}"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  const containerName = output
    .split("\n")
    .map((line) => line.trim())
    .find((name) => name.startsWith(prefix));

  if (!containerName) fail(`Container local nao encontrado para prefixo ${prefix}.`);
  return containerName;
}

function getSupabaseLocalEnv() {
  const edgeRuntimeContainer = resolveSupabaseContainer("supabase_edge_runtime_");
  const output = execFileSync(
    "docker",
    [
      "inspect",
      "--format",
      "{{range .Config.Env}}{{println .}}{{end}}",
      edgeRuntimeContainer,
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    },
  );
  const env = parseEnvOutput(output);

  if (!env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    fail("Nao foi possivel resolver chaves locais da Supabase.");
  }

  return {
    anonKey: env.SUPABASE_ANON_KEY,
    apiUrl: LOCAL_SUPABASE_API_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

async function waitForUrl(url, options = {}) {
  const {
    expectedStatuses = [200],
    headers = {},
    method = "GET",
    timeoutMs = 30_000,
  } = options;
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { headers, method });
      if (expectedStatuses.includes(response.status)) return response;
      lastError = new Error(`Status ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw lastError ?? new Error(`Timeout aguardando ${url}`);
}

function spawnTracked(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  child.safeLogs = "";
  child.stdout.on("data", (chunk) => {
    child.safeLogs = `${child.safeLogs}${chunk}`.slice(-4000);
  });
  child.stderr.on("data", (chunk) => {
    child.safeLogs = `${child.safeLogs}${chunk}`.slice(-4000);
  });
  children.add(child);
  child.on("exit", () => children.delete(child));
  return child;
}

async function ensureNextDev(localEnv) {
  try {
    await waitForUrl(`${LOCAL_NEXT_ORIGIN}/login/admin`, { timeoutMs: 2_000 });
    log("Next local ja estava disponivel.");
    return;
  } catch {
    const command = process.platform === "win32" ? "cmd.exe" : "npx";
    const args = process.platform === "win32"
      ? ["/d", "/s", "/c", "npx.cmd next dev -p 3000"]
      : ["next", "dev", "-p", "3000"];
    spawnTracked(command, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: localEnv.anonKey,
        NEXT_PUBLIC_SUPABASE_URL: localEnv.apiUrl,
      },
    });
    await waitForUrl(`${LOCAL_NEXT_ORIGIN}/login/admin`, { timeoutMs: 60_000 });
    log("Next local iniciado para o smoke.");
  }
}

async function waitForResendLedger(adminClient) {
  const startedAt = Date.now();
  let delivery = null;

  while (Date.now() - startedAt < 20_000) {
    const { data, error } = await adminClient
      .from("auth_email_deliveries")
      .select("flow, request_id, resend_email_id, result_status, role, to_email")
      .eq("flow", "admin_invite")
      .eq("to_email", FIXTURE_EMAIL)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    delivery = data;
    if (
      delivery?.result_status === "accepted" &&
      typeof delivery.resend_email_id === "string" &&
      delivery.resend_email_id.length > 0
    ) {
      return delivery;
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  fail("Ledger do Resend nao registrou convite admin aceito.");
}

async function findAuthUserByEmail(adminClient, email) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 1000) return null;
  }
  return null;
}

function assertNoSupabaseError(error, label) {
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
}

async function cleanupFixture(adminClient) {
  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, user_id, display_name")
    .ilike("email", FIXTURE_EMAIL)
    .maybeSingle();

  if (profile?.id && profile.display_name !== FIXTURE_NAME) {
    fail(`Ja existe profile para ${FIXTURE_EMAIL}; cleanup recusado por nao ser fixture.`);
  }

  if (profile?.id) {
    const { error: deliveryError } = await adminClient
      .from("auth_email_deliveries")
      .delete()
      .eq("profile_id", profile.id)
      .eq("flow", "admin_invite");
    assertNoSupabaseError(deliveryError, "cleanup auth_email_deliveries");

    const { error: activityError } = await adminClient
      .from("platform_settings_activity")
      .delete()
      .contains("metadata", { targetProfileId: profile.id });
    assertNoSupabaseError(activityError, "cleanup platform_settings_activity");

    const { error: adminError } = await adminClient
      .from("admins")
      .delete()
      .eq("profile_id", profile.id);
    assertNoSupabaseError(adminError, "cleanup admins");

    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", profile.id);
    assertNoSupabaseError(profileError, "cleanup profiles");
  }

  const authUser = await findAuthUserByEmail(adminClient, FIXTURE_EMAIL);
  if (authUser?.id) {
    const { error } = await adminClient.auth.admin.deleteUser(authUser.id);
    if (error) throw error;
  }
}

async function verifyAdminRecords(adminClient) {
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, user_id, email, display_name, role, status")
    .ilike("email", FIXTURE_EMAIL)
    .maybeSingle();

  if (profileError || !profile) fail("Profile Admin da fixture nao foi criado.");
  if (profile.role !== "admin" || profile.status !== "active") {
    fail("Profile Admin da fixture foi criado com role/status inesperado.");
  }
  if (profile.display_name !== FIXTURE_NAME) {
    fail("Profile Admin da fixture foi criado com nome inesperado.");
  }

  const { data: adminExtension, error: adminError } = await adminClient
    .from("admins")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (adminError || !adminExtension) fail("Extensao admins da fixture nao foi criada.");

  const authUser = await findAuthUserByEmail(adminClient, FIXTURE_EMAIL);
  if (!authUser || authUser.id !== profile.user_id) {
    fail("Auth user da fixture nao corresponde ao profile Admin.");
  }

  return profile;
}

async function validateBrowserFlow(adminClient) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20_000);
  page.setDefaultNavigationTimeout(45_000);

  try {
    await page.goto(`${LOCAL_NEXT_ORIGIN}/login/admin`, { waitUntil: "domcontentloaded" });
    await page.fill("#loginId", ADMIN_EMAIL);
    await page.fill("#password", ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin/dashboard", { timeout: 45_000 });
    log("Login Admin validado no navegador.");

    await page.goto(`${LOCAL_NEXT_ORIGIN}/admin/configuracoes`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByRole("button", { name: /Usuários & Permissões/i }).click();
    await page.getByRole("button", { name: /Adicionar administrador/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("input").nth(0).fill(FIXTURE_NAME);
    await dialog.locator('input[type="email"]').fill(FIXTURE_EMAIL);
    await dialog.locator("select").selectOption("active");
    await page.getByRole("button", { name: /^Cadastrar administrador$/i }).click();
    await page.getByText("Administrador cadastrado.").first().waitFor({ timeout: 45_000 });
    await page.getByText(FIXTURE_EMAIL).waitFor({ timeout: 45_000 });
    log("Criacao real de Admin pela UI retornou sucesso e atualizou a lista.");

    const profile = await verifyAdminRecords(adminClient);
    await waitForResendLedger(adminClient);
    log("Convite real do Admin foi aceito pela Resend e registrado no ledger.");

    const row = page.getByRole("row", { name: new RegExp(FIXTURE_EMAIL, "i") });
    await row.getByRole("button", { name: "Excluir" }).click();
    await page.getByRole("button", { name: /^Excluir usuário$/i }).click();
    await page.getByText("Usuário administrativo excluído.").first().waitFor({ timeout: 45_000 });
    log("Remocao do Admin pela UI chamou a Edge Function com sucesso.");

    const { data: removedProfile } = await adminClient
      .from("profiles")
      .select("status")
      .eq("id", profile.id)
      .maybeSingle();
    if (removedProfile?.status !== "disabled") {
      fail("Remocao pela UI nao deixou o profile Admin como disabled.");
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  const localEnv = getSupabaseLocalEnv();
  await waitForUrl(`${localEnv.apiUrl}/auth/v1/settings`, {
    headers: { apikey: localEnv.anonKey },
    timeoutMs: 10_000,
  });
  await waitForUrl(`${localEnv.apiUrl}/functions/v1/admin-users`, {
    expectedStatuses: [204],
    headers: {
      apikey: localEnv.anonKey,
      "Content-Type": "application/json",
      Origin: LOCAL_NEXT_ORIGIN,
    },
    method: "OPTIONS",
    timeoutMs: 20_000,
  });

  const adminClient = createClient(localEnv.apiUrl, localEnv.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await cleanupFixture(adminClient);
  await ensureNextDev(localEnv);

  try {
    await validateBrowserFlow(adminClient);
  } finally {
    await cleanupFixture(adminClient);
  }

  const leftover = await findAuthUserByEmail(adminClient, FIXTURE_EMAIL);
  if (leftover) fail("Cleanup final deixou Auth user da fixture para tras.");
  log("Cleanup final removeu Auth/Profile/Admin/ledger da fixture.");
}

async function shutdown() {
  await Promise.all(
    Array.from(children).map(
      (child) =>
        new Promise((resolve) => {
          if (child.exitCode !== null) {
            resolve();
            return;
          }
          child.once("exit", resolve);
          child.kill("SIGTERM");
        }),
    ),
  );
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(shutdown);
