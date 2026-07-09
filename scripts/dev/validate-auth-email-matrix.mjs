import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const LOCAL_NEXT_ORIGIN = "http://localhost:3000";
const LOCAL_SUPABASE_API_URL = "http://127.0.0.1:54321";
const FUNCTIONS_URL = `${LOCAL_SUPABASE_API_URL}/functions/v1`;
const STANDALONE_FUNCTION_URL = "http://127.0.0.1:8000";
const OWNER_INBOX = "viniciusferrari.silva@gmail.com";
const EMAIL_PREFIX = "auth-matrix";
const RUN_ID = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
const ARTIFACT_ROOT = join(process.cwd(), "artifacts", "auth-e2e", RUN_ID);
const SCREENSHOT_DIR = join(ARTIFACT_ROOT, "screenshots");
const RESEND_DIR = join(ARTIFACT_ROOT, "resend");
const DATABASE_DIR = join(ARTIFACT_ROOT, "database");

const flagCombos = [
  { id: "A", approval: false, automatic: false },
  { id: "B", approval: true, automatic: false },
  { id: "C", approval: false, automatic: true },
  { id: "D", approval: true, automatic: true },
];

const confirmationRoles = ["cliente", "parceiro"];
const resetRoles = ["cliente", "parceiro", "admin"];
const children = new Set();
const commandResults = [];
const confirmationRows = [];
const resetRows = [];
const resendRows = [];
const negativeRows = [];
const createdEmails = [];

function log(message) {
  console.log(`OK: ${message}`);
}

function fail(message) {
  throw new Error(message);
}

function recordCommand(command, startedAt, exitCode) {
  commandResults.push({
    command,
    durationMs: Date.now() - startedAt,
    exitCode,
  });
}

function run(command, args, options = {}) {
  const startedAt = Date.now();
  try {
    const output = execFileSync(command, args, {
      encoding: "utf8",
      stdio: options.input === undefined ? ["ignore", "pipe", "pipe"] : [
        "pipe",
        "pipe",
        "pipe",
      ],
      ...options,
    });
    recordCommand(`${command} ${args.join(" ")}`, startedAt, 0);
    return output;
  } catch (error) {
    recordCommand(`${command} ${args.join(" ")}`, startedAt, error.status ?? 1);
    throw error;
  }
}

function spawnTracked(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  child.safeLogs = "";
  child.stdout.on("data", (chunk) => {
    child.safeLogs += chunk.toString();
    child.safeLogs = child.safeLogs.slice(-4000);
  });
  child.stderr.on("data", (chunk) => {
    child.safeLogs += chunk.toString();
    child.safeLogs = child.safeLogs.slice(-4000);
  });

  children.add(child);
  child.on("exit", () => children.delete(child));
  return child;
}

function sanitizeLogs(value) {
  return String(value)
    .replaceAll(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [REDACTED]")
    .replaceAll(/eyJ[A-Za-z0-9._-]+/g, "[JWT_REDACTED]")
    .replaceAll(/token=([^&\s"']+)/g, "token=[REDACTED]");
}

function parseEnvFile(path) {
  const env = {};
  const content = readFileSync(path, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf("=");
    if (index === -1) continue;

    const key = line.slice(0, index).trim();
    const rawValue = line.slice(index + 1).trim();
    env[key] = rawValue.replace(/^"|"$/g, "");
  }

  return env;
}

function resolveSupabaseContainer(prefix) {
  const output = run("docker", ["ps", "--format", "{{.Names}}"]);
  const containerName = output
    .split("\n")
    .map((line) => line.trim())
    .find((name) => name.startsWith(prefix));

  if (!containerName) fail(`Container local nao encontrado: ${prefix}`);
  return containerName;
}

function getSupabaseLocalEnv() {
  const edgeRuntimeContainer = resolveSupabaseContainer("supabase_edge_runtime_");
  const output = run("docker", [
    "inspect",
    "--format",
    "{{range .Config.Env}}{{println .}}{{end}}",
    edgeRuntimeContainer,
  ]);
  const env = {};

  for (const line of output.split("\n")) {
    const index = line.indexOf("=");
    if (index === -1) continue;
    env[line.slice(0, index)] = line.slice(index + 1);
  }

  return {
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: LOCAL_SUPABASE_API_URL,
  };
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function psql(sql) {
  const dbContainer = resolveSupabaseContainer("supabase_db_");
  return run("docker", [
    "exec",
    "-i",
    dbContainer,
    "psql",
    "-v",
    "ON_ERROR_STOP=1",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-t",
    "-A",
  ], { input: sql }).trim();
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function maskEmail(email) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 3)}***@${domain}`;
}

function sanitizeUrl(url) {
  const parsed = new URL(url);
  if (parsed.searchParams.has("token")) {
    parsed.searchParams.set("token", "[REDACTED]");
  }
  return parsed.toString();
}

function ownerAlias(label) {
  void label;
  return OWNER_INBOX;
}

async function waitForUrl(
  url,
  { expectedStatuses = [200], method = "GET", timeoutMs = 90_000 } = {},
) {
  const startedAt = Date.now();
  let lastStatus = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { method });
      lastStatus = response.status;
      await response.body?.cancel();
      if (expectedStatuses.includes(response.status)) return response.status;
    } catch {
      // Service still booting.
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  fail(`Timeout aguardando ${url}. Ultimo status: ${lastStatus ?? "sem resposta"}.`);
}

async function startNextDev() {
  try {
    const response = await fetch(`${LOCAL_NEXT_ORIGIN}/login/admin`);
    await response.body?.cancel();
    if (response.ok) {
      log("Next local ja estava ativo.");
      return null;
    }
  } catch {
    // Start it below.
  }

  const child = process.platform === "win32"
    ? spawnTracked("cmd.exe", ["/d", "/s", "/c", "npx.cmd next dev -p 3000"])
    : spawnTracked("npx", ["next", "dev", "-p", "3000"]);

  await waitForUrl(`${LOCAL_NEXT_ORIGIN}/login/admin`);
  return child;
}

async function startStandaloneFunction(name, flags, functionEnv, supabaseEnv) {
  const env = {
    ...process.env,
    ...functionEnv,
    ALL_ACCOUNT_CREATE_APPROVAL_ADM: flags.approval ? "true" : "false",
    APP_URL: LOCAL_NEXT_ORIGIN,
    CONFIRMED_AUTOMATICALLY_EMAIL: flags.automatic ? "true" : "false",
    EMAIL_ADMIN: OWNER_INBOX,
    NEXT_PUBLIC_APP_URL: LOCAL_NEXT_ORIGIN,
    SUPABASE_SERVICE_ROLE_KEY: supabaseEnv.serviceRoleKey,
    SUPABASE_URL: supabaseEnv.supabaseUrl,
  };
  const deno = join(process.env.USERPROFILE ?? "", ".deno", "bin", "deno.exe");
  const command = process.platform === "win32" ? deno : "deno";
  const child = spawnTracked(command, [
    "run",
    "--allow-env",
    "--allow-net",
    `supabase/functions/${name}/index.ts`,
  ], { env });

  await waitForUrl(STANDALONE_FUNCTION_URL, {
    expectedStatuses: [204],
    method: "OPTIONS",
    timeoutMs: 90_000,
  });

  return child;
}

async function stopChild(child) {
  if (!child || child.exitCode !== null) return;

  if (process.platform === "win32") {
    try {
      run("taskkill", ["/PID", String(child.pid), "/T", "/F"]);
      return;
    } catch {
      child.kill("SIGTERM");
    }
  } else {
    child.kill("SIGTERM");
  }

  await new Promise((resolve) => setTimeout(resolve, 1_000));
}

async function invokeFunction(name, payload, anonKey) {
  const response = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
      Origin: LOCAL_NEXT_ORIGIN,
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));

  return {
    body,
    ok: response.ok,
    status: response.status,
  };
}

async function invokeStandaloneFunction(payload, anonKey) {
  const response = await fetch(STANDALONE_FUNCTION_URL, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
      Origin: LOCAL_NEXT_ORIGIN,
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));

  return {
    body,
    ok: response.ok,
    status: response.status,
  };
}

async function getResendEmail(resendApiKey, id) {
  const response = await fetch(`https://api.resend.com/emails/${id}`, {
    headers: { Authorization: `Bearer ${resendApiKey}` },
  });

  if (!response.ok) {
    fail(`Resend lookup falhou para provider id ${id}: HTTP ${response.status}`);
  }

  return await response.json();
}

function extractAuthLink(emailPayload, expectedPath) {
  const html = String(emailPayload.html ?? "");
  const match = html.match(/href=["']([^"']+)["']/i);
  if (!match) fail("Link de auth nao encontrado no HTML da Resend.");

  const link = match[1].replaceAll("&amp;", "&");
  if (!link.includes(expectedPath)) {
    fail(`Link extraido nao aponta para ${expectedPath}.`);
  }

  return link;
}

async function latestDelivery({ profileId, flow }) {
  const output = psql(`
select json_build_object(
  'id', id,
  'flow', flow,
  'role', role,
  'to_email', to_email,
  'resend_email_id', resend_email_id,
  'result_status', result_status,
  'created_at', created_at
)::text
from public.auth_email_deliveries
where profile_id = ${sqlLiteral(profileId)}::uuid
  and flow = ${sqlLiteral(flow)}
order by created_at desc
limit 1;
`);
  const line = output.split("\n").find((entry) => entry.trim().startsWith("{"));
  return line ? JSON.parse(line) : null;
}

async function waitForDelivery({ flow, profileId, timeoutMs = 15_000 }) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const delivery = await latestDelivery({ flow, profileId });
    if (delivery?.resend_email_id) return delivery;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  return null;
}

function cleanupFixtures() {
  psql(`
delete from public.auth_email_deliveries
where lower(to_email) = lower(${sqlLiteral(OWNER_INBOX)})
   or to_email like ${sqlLiteral(`${OWNER_INBOX.split("@")[0]}+${EMAIL_PREFIX}-${RUN_ID}-%@${OWNER_INBOX.split("@")[1]}`)}
   or request_id like ${sqlLiteral(`${EMAIL_PREFIX}-${RUN_ID}-%`)};

delete from public.billing_payments
where partner_id in (
  select partner.id
  from public.partners partner
  join public.profiles profile on profile.id = partner.profile_id
  where lower(profile.email) = lower(${sqlLiteral(OWNER_INBOX)})
     or profile.email like ${sqlLiteral(`%+${EMAIL_PREFIX}-${RUN_ID}-%`)}
);

delete from public.partner_subscriptions
where partner_id in (
  select partner.id
  from public.partners partner
  join public.profiles profile on profile.id = partner.profile_id
  where lower(profile.email) = lower(${sqlLiteral(OWNER_INBOX)})
     or profile.email like ${sqlLiteral(`%+${EMAIL_PREFIX}-${RUN_ID}-%`)}
);

delete from public.partner_clients
where patient_id in (
  select patient.id
  from public.patients patient
  join public.profiles profile on profile.id = patient.profile_id
  where lower(profile.email) = lower(${sqlLiteral(OWNER_INBOX)})
     or profile.email like ${sqlLiteral(`%+${EMAIL_PREFIX}-${RUN_ID}-%`)}
);

delete from public.admins
where profile_id in (
  select id from public.profiles
  where lower(email) = lower(${sqlLiteral(OWNER_INBOX)})
     or email like ${sqlLiteral(`%+${EMAIL_PREFIX}-${RUN_ID}-%`)}
);

delete from public.partners
where profile_id in (
  select id from public.profiles
  where lower(email) = lower(${sqlLiteral(OWNER_INBOX)})
     or email like ${sqlLiteral(`%+${EMAIL_PREFIX}-${RUN_ID}-%`)}
);

delete from public.patients
where profile_id in (
  select id from public.profiles
  where lower(email) = lower(${sqlLiteral(OWNER_INBOX)})
     or email like ${sqlLiteral(`%+${EMAIL_PREFIX}-${RUN_ID}-%`)}
);

delete from public.email_verification_tokens
where profile_id in (
  select id from public.profiles
  where lower(email) = lower(${sqlLiteral(OWNER_INBOX)})
     or email like ${sqlLiteral(`%+${EMAIL_PREFIX}-${RUN_ID}-%`)}
);

delete from public.password_reset_tokens
where profile_id in (
  select id from public.profiles
  where lower(email) = lower(${sqlLiteral(OWNER_INBOX)})
     or email like ${sqlLiteral(`%+${EMAIL_PREFIX}-${RUN_ID}-%`)}
);

delete from public.profiles
where lower(email) = lower(${sqlLiteral(OWNER_INBOX)})
   or email like ${sqlLiteral(`%+${EMAIL_PREFIX}-${RUN_ID}-%`)};
`);
}

async function deleteAuthUserByEmail(adminClient, email) {
  const { data } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
  if (user) await adminClient.auth.admin.deleteUser(user.id);
}

function firstSeedPartnerId() {
  const output = psql(`
select partner.id::text
from public.partners partner
join public.profiles profile on profile.id = partner.profile_id
limit 1;
`);
  return output.split("\n").find((line) => /^[0-9a-f-]{36}$/.test(line.trim()))?.trim();
}

async function createFixture(adminClient, role, label, password, confirmed = false) {
  const email = ownerAlias(label);
  createdEmails.push(email);
  cleanupFixtures();
  await deleteAuthUserByEmail(adminClient, email);

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: confirmed,
    password,
  });
  if (authError || !authData.user) fail(`Falha ao criar Auth user ${label}.`);

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .insert({
      display_name: `Auth Matrix ${role}`,
      email,
      email_confirmed_at: confirmed ? new Date().toISOString() : null,
      role,
      status: "active",
      user_id: authData.user.id,
    })
    .select("id, user_id")
    .single();
  if (profileError || !profile) fail(`Falha ao criar profile ${label}.`);

  if (role === "cliente") {
    const seedPartnerId = firstSeedPartnerId();
    if (!seedPartnerId) fail("Parceiro seed nao localizado para vincular Cliente.");
    psql(`
with patient as (
  insert into public.patients (profile_id, phone, objective)
  values (${sqlLiteral(profile.id)}::uuid, '+5511999999999', 'validacao auth')
  returning id
)
insert into public.partner_clients (partner_id, patient_id, service_scope, status)
select ${sqlLiteral(seedPartnerId)}::uuid, patient.id, 'treino', 'active'
from patient;
`);
  }

  if (role === "parceiro") {
    await adminClient.from("partners").insert({
      professional_name: `Auth Matrix ${label}`,
      professional_type: "nutricionista",
      profile_id: profile.id,
    });
  }

  if (role === "admin") {
    await adminClient.from("admins").insert({ profile_id: profile.id });
  }

  return { email, password, profileId: profile.id, userId: profile.user_id };
}

async function cleanupAuthUsers(adminClient) {
  for (const email of createdEmails) {
    await deleteAuthUserByEmail(adminClient, email);
  }
}

async function assertSignIn(adminClient, anonClient, fixture, expected) {
  const { data, error } = await anonClient.auth.signInWithPassword({
    email: fixture.email,
    password: fixture.password,
  });

  await anonClient.auth.signOut();

  if (expected && (error || !data.session)) {
    fail(`Login deveria funcionar para ${fixture.email}.`);
  }

  if (!expected && data.session) {
    fail(`Login deveria falhar para ${fixture.email}.`);
  }

  await adminClient.auth.signOut();
}

async function openConfirmationLink(browser, link, scenarioId) {
  const page = await browser.newPage();
  await page.goto(link, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: /E-mail confirmado/i }).waitFor({
    timeout: 30_000,
  });
  await page.screenshot({
    path: join(SCREENSHOT_DIR, `confirm-${scenarioId}.png`),
    fullPage: true,
  });
  await page.close();
}

async function openResetLink(browser, link, scenarioId, password) {
  const page = await browser.newPage();
  await page.goto(link, { waitUntil: "domcontentloaded" });
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);
  await page.getByRole("button", { name: /Redefinir senha/i }).click();
  await page.getByRole("heading", { name: /Senha redefinida/i }).waitFor({
    timeout: 30_000,
  });
  await page.screenshot({
    path: join(SCREENSHOT_DIR, `reset-${scenarioId}.png`),
    fullPage: true,
  });
  await page.close();
}

async function validateConfirmationScenario({
  adminClient,
  anonClient,
  browser,
  flags,
  functionEnv,
  role,
  supabaseEnv,
}) {
  const label = `confirm-${role}-${flags.id}`.toLowerCase();
  const fixture = await createFixture(
    adminClient,
    role,
    label,
    `Old-${RUN_ID}-${role}-${flags.id}!aA1`,
    false,
  );
  const purpose = role === "cliente" ? "client_first_access" : "partner_signup";
  const served = await startStandaloneFunction(
    "send-verification-email",
    flags,
    functionEnv,
    supabaseEnv,
  );

  try {
    const response = await invokeStandaloneFunction(
      { profileId: fixture.profileId, purpose },
      supabaseEnv.anonKey,
    );
    if (!response.ok) {
      fail(
        `send-verification-email HTTP ${response.status}. Logs: ${sanitizeLogs(served.safeLogs)}`,
      );
    }

    const { data: beforeConfirm } = await adminClient
      .from("profiles")
      .select("email_confirmed_at")
      .eq("id", fixture.profileId)
      .single();

    let delivery = null;
    let linkValidated = false;
    let recipient = "none";

    if (flags.automatic) {
      if (!beforeConfirm?.email_confirmed_at) {
        fail("Confirmacao automatica nao marcou email_confirmed_at.");
      }
    } else {
      if (beforeConfirm?.email_confirmed_at) {
        fail("Conta confirmou antes do clique no link.");
      }

      delivery = await waitForDelivery({
        flow: flags.approval ? "admin_account_approval" : "email_confirmation",
        profileId: fixture.profileId,
      });
      if (!delivery?.resend_email_id) {
        fail(
          `Ledger/Resend ID nao encontrado. Resposta segura: ${JSON.stringify(response.body)}`,
        );
      }

      const emailPayload = await getResendEmail(
        functionEnv.RESEND_API_KEY,
        delivery.resend_email_id,
      );
      const link = extractAuthLink(emailPayload, "/auth/confirmar-email");
      recipient = delivery.to_email;

      resendRows.push({
        event: emailPayload.last_event ?? emailPayload.status ?? "unknown",
        flow: delivery.flow,
        from: emailPayload.from,
        providerId: delivery.resend_email_id,
        result: delivery.result_status,
        role,
        toMasked: maskEmail(delivery.to_email),
      });

      await openConfirmationLink(browser, link, `${role}-${flags.id}`);
      linkValidated = true;
    }

    await assertSignIn(adminClient, anonClient, fixture, true);

    confirmationRows.push({
      approval: flags.approval,
      automatic: flags.automatic,
      linkValidated,
      recipient: maskEmail(recipient),
      result: "PASS",
      role,
    });
  } finally {
    await stopChild(served);
  }
}

async function validateResetScenario({
  adminClient,
  anonClient,
  browser,
  flags,
  functionEnv,
  role,
  supabaseEnv,
}) {
  const label = `reset-${role}-${flags.id}`.toLowerCase();
  const oldPassword = `Old-${RUN_ID}-${role}-${flags.id}!aA1`;
  const newPassword = `New-${RUN_ID}-${role}-${flags.id}!aA1`;
  const fixture = await createFixture(adminClient, role, label, oldPassword, true);
  const served = await startStandaloneFunction(
    "send-password-reset-email",
    flags,
    functionEnv,
    supabaseEnv,
  );

  try {
    const response = await invokeStandaloneFunction(
      { email: fixture.email, expectedRole: role },
      supabaseEnv.anonKey,
    );
    if (!response.ok) {
      fail(
        `send-password-reset-email HTTP ${response.status}. Logs: ${sanitizeLogs(served.safeLogs)}`,
      );
    }

    const delivery = await waitForDelivery({
      flow: "password_reset",
      profileId: fixture.profileId,
    });
    if (!delivery?.resend_email_id) {
      fail(
        `Ledger/Resend ID de reset nao encontrado. Resposta segura: ${JSON.stringify(response.body)}`,
      );
    }
    if (delivery.to_email.toLowerCase() !== fixture.email.toLowerCase()) {
      fail("Reset foi enviado para destinatario diferente do titular.");
    }

    const emailPayload = await getResendEmail(
      functionEnv.RESEND_API_KEY,
      delivery.resend_email_id,
    );
    const link = extractAuthLink(emailPayload, "/auth/redefinir-senha");

    resendRows.push({
      event: emailPayload.last_event ?? emailPayload.status ?? "unknown",
      flow: "password_reset",
      from: emailPayload.from,
      providerId: delivery.resend_email_id,
      result: delivery.result_status,
      role,
      toMasked: maskEmail(delivery.to_email),
    });

    await openResetLink(browser, link, `${role}-${flags.id}`, newPassword);
    fixture.password = oldPassword;
    await assertSignIn(adminClient, anonClient, fixture, false);
    fixture.password = newPassword;
    await assertSignIn(adminClient, anonClient, fixture, true);

    const reused = await invokeFunction(
      "verify-password-reset-token",
      { token: new URL(link).searchParams.get("token") },
      supabaseEnv.anonKey,
    );
    if (reused.ok) fail("Token de reset reutilizado foi aceito.");

    resetRows.push({
      approval: flags.approval,
      automatic: flags.automatic,
      linkValidated: true,
      newPassword: "PASS",
      result: "PASS",
      role,
    });
  } finally {
    await stopChild(served);
  }
}

async function validateNegativeCases({ adminClient, supabaseEnv, functionEnv }) {
  const served = await startStandaloneFunction(
    "send-password-reset-email",
    { approval: true, automatic: true },
    functionEnv,
    supabaseEnv,
  );

  try {
    const missing = await invokeStandaloneFunction(
      { email: ownerAlias("missing"), expectedRole: "cliente" },
      supabaseEnv.anonKey,
    );
    negativeRows.push({
      case: "email inexistente",
      expected: "200 generico",
      result: missing.status === 200 ? "PASS" : "FAIL",
    });

    const wrongRole = await invokeStandaloneFunction(
      { email: ownerAlias("missing-role"), expectedRole: "admin" },
      supabaseEnv.anonKey,
    );
    negativeRows.push({
      case: "role incorreta/inexistente",
      expected: "200 generico",
      result: wrongRole.status === 200 ? "PASS" : "FAIL",
    });

    const invalidToken = await invokeFunction(
      "verify-password-reset-token",
      { token: "token-invalido" },
      supabaseEnv.anonKey,
    );
    negativeRows.push({
      case: "token invalido reset",
      expected: "400",
      result: invalidToken.status === 400 ? "PASS" : "FAIL",
    });

    const fixture = await createFixture(
      adminClient,
      "cliente",
      "expired-reset",
      `Expired-${RUN_ID}!aA1`,
      true,
    );
    const expiredToken = `expired-${randomUUID()}`;
    await adminClient.from("password_reset_tokens").insert({
      auth_user_id: fixture.userId,
      expires_at: new Date(Date.now() - 60_000).toISOString(),
      profile_id: fixture.profileId,
      role: "cliente",
      token_hash: sha256(expiredToken),
    });

    const expired = await invokeFunction(
      "verify-password-reset-token",
      { token: expiredToken },
      supabaseEnv.anonKey,
    );
    negativeRows.push({
      case: "token expirado reset",
      expected: "400",
      result: expired.status === 400 ? "PASS" : "FAIL",
    });
  } finally {
    await stopChild(served);
  }
}

function writeArtifacts(summary) {
  mkdirSync(ARTIFACT_ROOT, { recursive: true });
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  mkdirSync(RESEND_DIR, { recursive: true });
  mkdirSync(DATABASE_DIR, { recursive: true });

  writeFileSync(
    join(ARTIFACT_ROOT, "matrix.md"),
    [
      "# Auth Matrix",
      "",
      "## Confirmacao",
      "| Role | Aprovacao | Automatica | Destinatario | Link validado | Resultado |",
      "|---|---:|---:|---|---:|---|",
      ...confirmationRows.map((row) =>
        `| ${row.role} | ${row.approval} | ${row.automatic} | ${row.recipient} | ${row.linkValidated} | ${row.result} |`
      ),
      "",
      "## Reset",
      "| Role | Aprovacao | Automatica | Link validado | Nova senha | Resultado |",
      "|---|---:|---:|---:|---|---|",
      ...resetRows.map((row) =>
        `| ${row.role} | ${row.approval} | ${row.automatic} | ${row.linkValidated} | ${row.newPassword} | ${row.result} |`
      ),
      "",
      "## Negativos",
      "| Caso | Esperado | Resultado |",
      "|---|---|---|",
      ...negativeRows.map((row) => `| ${row.case} | ${row.expected} | ${row.result} |`),
      "",
    ].join("\n"),
    "utf8",
  );

  writeFileSync(
    join(ARTIFACT_ROOT, "commands.md"),
    [
      "# Commands",
      "",
      "| Comando | Exit code | Duracao ms |",
      "|---|---:|---:|",
      ...commandResults.map((row) =>
        `| ${row.command.replaceAll("|", "\\|")} | ${row.exitCode} | ${row.durationMs} |`
      ),
      "",
    ].join("\n"),
    "utf8",
  );

  writeFileSync(
    join(RESEND_DIR, "summary.json"),
    JSON.stringify(resendRows, null, 2),
    "utf8",
  );
  writeFileSync(
    join(DATABASE_DIR, "summary.json"),
    JSON.stringify({
      confirmationRows: confirmationRows.length,
      negativeRows: negativeRows.length,
      resetRows: resetRows.length,
    }, null, 2),
    "utf8",
  );
  writeFileSync(
    join(ARTIFACT_ROOT, "summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8",
  );
}

async function main() {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  mkdirSync(RESEND_DIR, { recursive: true });
  mkdirSync(DATABASE_DIR, { recursive: true });

  const functionEnv = parseEnvFile("supabase/functions/.env");
  if (!functionEnv.RESEND_API_KEY) fail("RESEND_API_KEY ausente.");
  if (functionEnv.RESEND_FROM !== "DeLoad Fit <noreply@deloadfit.app>") {
    fail("RESEND_FROM inesperado para homologacao.");
  }

  const supabaseEnv = getSupabaseLocalEnv();
  const adminClient = createClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const anonClient = createClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.anonKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  cleanupFixtures();
  await startNextDev();
  const browser = await chromium.launch({ headless: true });

  try {
    for (const flags of flagCombos) {
      for (const role of confirmationRoles) {
        await validateConfirmationScenario({
          adminClient,
          anonClient,
          browser,
          flags,
          functionEnv,
          role,
          supabaseEnv,
        });
        log(`Confirmacao ${role} flags ${flags.id} validada.`);
      }
    }

    for (const flags of flagCombos) {
      for (const role of resetRoles) {
        await validateResetScenario({
          adminClient,
          anonClient,
          browser,
          flags,
          functionEnv,
          role,
          supabaseEnv,
        });
        log(`Reset ${role} flags ${flags.id} validado.`);
      }
    }

    await validateNegativeCases({ adminClient, functionEnv, supabaseEnv });
  } finally {
    await browser.close();
    cleanupFixtures();
    await cleanupAuthUsers(adminClient);
  }

  const summary = {
    artifactRoot: ARTIFACT_ROOT,
    confirmationScenarios: confirmationRows.length,
    negativeScenarios: negativeRows.length,
    resetScenarios: resetRows.length,
    resendEvents: resendRows.length,
    verdict: confirmationRows.length === 8 && resetRows.length === 12
      ? "PASS"
      : "PARTIAL",
  };
  writeArtifacts(summary);
  log(`Matriz auth concluida em ${ARTIFACT_ROOT}.`);
}

async function shutdown() {
  await Promise.all(Array.from(children).map((child) => stopChild(child)));
}

process.on("uncaughtException", async (error) => {
  console.error(`FAIL: ${error.message}`);
  await shutdown();
  process.exit(1);
});

process.on("unhandledRejection", async (error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  await shutdown();
  process.exit(1);
});

main()
  .catch((error) => {
    console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await shutdown();
  });
