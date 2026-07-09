import { randomBytes } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "antoniofelipe258@gmail.com";
const ADMIN_PASSWORD = process.env.LEO_LOCAL_ADMIN_PASSWORD ?? "123456";
const PARTNER_EMAIL = "partner.local@example.com";
const PARTNER_IDEMPOTENCY_KEY = "e0000000-0000-4000-8000-000000000001";
const LOCAL_NEXT_ORIGIN = "http://localhost:3000";
const LOCAL_SUPABASE_API_URL = "http://127.0.0.1:54321";

const partnerPayload = {
  email: PARTNER_EMAIL,
  phone: "+5511999999999",
  professionalType: "nutricionista",
  displayName: "Parceiro Local",
  professionalName: "Parceiro Local Dev",
  idempotencyKey: PARTNER_IDEMPOTENCY_KEY,
};

const sensitiveKeys = [
  "ANON_KEY",
  "SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];

const children = new Set();

function log(message) {
  console.log(`OK: ${message}`);
}

function fail(message) {
  throw new Error(message);
}

function createLocalPassword() {
  return `${randomBytes(18).toString("base64url")}aA1!`;
}

function parseEnvOutput(output) {
  return Object.fromEntries(
    output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...valueParts] = line.split("=");
        const rawValue = valueParts.join("=");
        return [key, rawValue.replace(/^"|"$/g, "")];
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

  if (!containerName) {
    fail(`Container local não encontrado para prefixo ${prefix}.`);
  }

  return containerName;
}

function getSupabaseLocalEnv() {
  const edgeRuntimeContainer = resolveSupabaseContainer(
    "supabase_edge_runtime_",
  );
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
  const apiUrl = LOCAL_SUPABASE_API_URL;
  const anonKey = env.SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiUrl || !anonKey || !serviceRoleKey) {
    fail("Não foi possível resolver API_URL, ANON_KEY e SERVICE_ROLE_KEY locais.");
  }

  return {
    apiUrl,
    anonKey,
    serviceRoleKey,
  };
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function psqlLocal(sql) {
  const dbContainer = resolveSupabaseContainer("supabase_db_");

  return execFileSync(
    "docker",
    [
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
    ],
    {
      input: sql,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    },
  ).trim();
}

function sanitizeProcessEnv(env) {
  const sanitized = { ...env };
  for (const key of sensitiveKeys) {
    if (key in sanitized) sanitized[key] = "[filtered]";
  }
  return sanitized;
}

function spawnSilent(command, args, options = {}) {
  const child = spawn(command, args, {
    ...options,
    stdio: ["ignore", "pipe", "pipe"],
  });

  children.add(child);
  child.on("exit", () => {
    children.delete(child);
  });

  return child;
}

async function waitForUrl(url, {
  headers,
  method = "GET",
  expectedStatuses = [200],
  timeoutMs = 60_000,
} = {}) {
  const startedAt = Date.now();
  let lastStatus = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { headers, method });
      lastStatus = response.status;
      await response.body?.cancel();

      if (expectedStatuses.includes(response.status)) {
        return response.status;
      }
    } catch {
      // Serviço ainda subindo.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  fail(`Timeout aguardando ${url}. Último status: ${lastStatus ?? "sem resposta"}.`);
}

async function findAuthUserByEmail(adminClient, email) {
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) fail(`Falha ao listar usuários Auth locais: ${error.message}`);

    const found = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (found) return found;
    if (data.users.length < perPage) return null;

    page += 1;
  }

  return null;
}

async function ensureAuthUser(adminClient, { email, password }) {
  const existing = await findAuthUserByEmail(adminClient, email);

  if (existing) {
    const { data, error } = await adminClient.auth.admin.updateUserById(
      existing.id,
      {
        password,
        email_confirm: true,
      },
    );

    if (error || !data.user) {
      fail(`Falha ao atualizar usuário Auth local ${email}: ${error?.message}`);
    }

    return data.user;
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    fail(`Falha ao criar usuário Auth local ${email}: ${error?.message}`);
  }

  return data.user;
}

function ensureAdminProfile(userId) {
  const output = psqlLocal(`
do $$
begin
  if exists (
    select 1
    from public.profiles
    where email = ${sqlLiteral(ADMIN_EMAIL)}
      and (user_id <> ${sqlLiteral(userId)}::uuid or role <> 'admin')
  ) then
    raise exception 'ADMIN_LOCAL_PROFILE_CONFLICT';
  end if;
end;
$$;

with updated as (
  update public.profiles
  set
    display_name = 'Admin Local',
    status = 'active'
  where email = ${sqlLiteral(ADMIN_EMAIL)}
    and user_id = ${sqlLiteral(userId)}::uuid
    and role = 'admin'
  returning id, user_id, role, status
),
inserted as (
  insert into public.profiles (
    user_id,
    email,
    display_name,
    role,
    status
  )
  select
    ${sqlLiteral(userId)}::uuid,
    ${sqlLiteral(ADMIN_EMAIL)},
    'Admin Local',
    'admin',
    'active'
  where not exists (select 1 from updated)
    and not exists (
      select 1
      from public.profiles
      where email = ${sqlLiteral(ADMIN_EMAIL)}
    )
  returning id, user_id, role, status
),
profile as (
  select * from updated
  union all
  select * from inserted
),
admin_extension as (
  insert into public.admins (profile_id)
  select id from profile
  on conflict (profile_id) do nothing
  returning id
)
select json_build_object(
  'id', profile.id,
  'user_id', profile.user_id,
  'role', profile.role,
  'status', profile.status
)::text
from profile;
`);

  const jsonLine = output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("{"))
    .at(-1);

  if (!jsonLine) fail("Seed local não retornou profile Admin.");
  return JSON.parse(jsonLine);
}

async function cleanupPartnerFixture(adminClient) {
  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, user_id")
    .eq("email", PARTNER_EMAIL)
    .maybeSingle();

  psqlLocal(`
delete from public.provisioning_operations
where idempotency_key = ${sqlLiteral(PARTNER_IDEMPOTENCY_KEY)}::uuid
   or resource_profile_id in (
     select id
     from public.profiles
     where email = ${sqlLiteral(PARTNER_EMAIL)}
   );

delete from public.partners
where profile_id in (
  select id
  from public.profiles
  where email = ${sqlLiteral(PARTNER_EMAIL)}
);

delete from public.profiles
where email = ${sqlLiteral(PARTNER_EMAIL)};
`);

  const authUser = await findAuthUserByEmail(adminClient, PARTNER_EMAIL);
  if (authUser) {
    const { error } = await adminClient.auth.admin.deleteUser(authUser.id);
    if (error) fail(`Falha ao limpar Auth user local do Parceiro: ${error.message}`);
  }
}

async function signIn(anonClient, email, password) {
  const { data, error } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session?.access_token) {
    fail(`Login local falhou para ${email}: ${error?.message ?? "sem sessão"}`);
  }

  return data.session.access_token;
}

async function verifyAccessToken({ apiUrl, anonKey, accessToken, expectedEmail }) {
  const response = await fetch(`${apiUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const body = await response.json();

  if (!response.ok || body?.email?.toLowerCase() !== expectedEmail) {
    fail(`JWT local não foi aceito pelo Auth para ${expectedEmail}.`);
  }
}

async function invokeProvisionPartner({ apiUrl, anonKey, accessToken }) {
  const response = await fetch(`${apiUrl}/functions/v1/provision-partner`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Origin: LOCAL_NEXT_ORIGIN,
    },
    body: JSON.stringify(partnerPayload),
  });

  const body = await response.json();

  if (![200, 201, 202].includes(response.status)) {
    fail(`provision-partner retornou HTTP ${response.status} (${body?.error?.code ?? "sem código"}).`);
  }

  const serialized = JSON.stringify(body).toLowerCase();
  if (
    serialized.includes("action_link") ||
    serialized.includes("hashed_token") ||
    serialized.includes("access_token") ||
    serialized.includes("refresh_token")
  ) {
    fail("Resposta da provision-partner contém dado sensível inesperado.");
  }

  return {
    httpStatus: response.status,
    body,
  };
}

async function verifyPartnerRecords(adminClient) {
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, user_id, role, status")
    .eq("email", PARTNER_EMAIL)
    .maybeSingle();

  if (profileError || !profile) fail("Profile do Parceiro local não foi criado.");
  if (profile.role !== "parceiro" || profile.status !== "active") {
    fail("Profile do Parceiro local não está como parceiro active.");
  }

  const { data: partner, error: partnerError } = await adminClient
    .from("partners")
    .select("id, professional_type")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (partnerError || !partner) fail("Extensão partners do Parceiro local não foi criada.");

  const { data: operation, error: operationError } = await adminClient
    .from("provisioning_operations")
    .select("status, invite_status, resource_profile_id, resource_partner_id")
    .eq("idempotency_key", PARTNER_IDEMPOTENCY_KEY)
    .maybeSingle();

  if (operationError || !operation) fail("Ledger de idempotência do Parceiro não foi criado.");
  if (operation.status !== "completed") fail("Ledger do Parceiro não está completed.");
  if (operation.invite_status !== "pending_delivery") {
    fail("Convite do Parceiro não está pending_delivery.");
  }
  if (
    operation.resource_profile_id !== profile.id ||
    operation.resource_partner_id !== partner.id
  ) {
    fail("Ledger do Parceiro não aponta para os recursos criados.");
  }

  return {
    partner,
    profile,
    operation,
  };
}

async function setLocalDevPartnerPassword(adminClient, userId, password) {
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });

  if (error) fail(`Falha ao definir senha local/dev do Parceiro: ${error.message}`);
}

async function waitForProvisionPartner(env) {
  await waitForUrl(`${env.apiUrl}/functions/v1/provision-partner`, {
    method: "OPTIONS",
    expectedStatuses: [204],
  });
}

async function startNextDev(env) {
  const nextProcess = spawnSilent("npx", ["next", "dev", "-p", "3000"], {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: env.apiUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env.anonKey,
    },
  });

  nextProcess.on("error", (error) => {
    fail(`Falha ao iniciar Next local: ${error.message}`);
  });

  await waitForUrl(`${LOCAL_NEXT_ORIGIN}/login`, {
    expectedStatuses: [200],
    timeoutMs: 90_000,
  });

  return nextProcess;
}

async function validateNextLoginWithPlaywright({ adminPassword, partnerPassword }) {
  const { chromium } = await import("playwright");
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Executable doesn't exist")
    ) {
      browser = await chromium.launch({ channel: "chrome", headless: true });
    } else {
      throw error;
    }
  }

  try {
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${LOCAL_NEXT_ORIGIN}/login/admin`);
    await adminPage.fill("#loginId", ADMIN_EMAIL);
    await adminPage.fill("#password", adminPassword);
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL("**/admin/dashboard", { timeout: 30_000 });

    await adminPage.goto(`${LOCAL_NEXT_ORIGIN}/parceiros/dashboard`);
    await adminPage.waitForURL("**/admin/dashboard", { timeout: 30_000 });
    await adminContext.close();

    const partnerContext = await browser.newContext();
    const partnerPage = await partnerContext.newPage();

    await partnerPage.goto(`${LOCAL_NEXT_ORIGIN}/login/parceiros`);
    await partnerPage.fill("#loginId", PARTNER_EMAIL);
    await partnerPage.fill("#password", partnerPassword);
    await partnerPage.click('button[type="submit"]');
    await partnerPage.waitForURL("**/parceiros/dashboard", { timeout: 30_000 });

    await partnerPage.goto(`${LOCAL_NEXT_ORIGIN}/admin/dashboard`);
    await partnerPage.waitForURL("**/parceiros/dashboard", { timeout: 30_000 });
    await partnerContext.close();
  } finally {
    await browser.close();
  }
}

async function main() {
  const localEnv = getSupabaseLocalEnv();
  await waitForUrl(`${localEnv.apiUrl}/auth/v1/settings`, {
    headers: { apikey: localEnv.anonKey },
    expectedStatuses: [200],
    timeoutMs: 10_000,
  });

  const adminClient = createClient(localEnv.apiUrl, localEnv.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anonClient = createClient(localEnv.apiUrl, localEnv.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const partnerPassword = createLocalPassword();

  const adminUser = await ensureAuthUser(adminClient, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  const adminProfile = ensureAdminProfile(adminUser.id);

  log("Super Admin local fictício existe com profile admin active e extensão admins.");

  await cleanupPartnerFixture(adminClient);

  const adminAccessToken = await signIn(anonClient, ADMIN_EMAIL, ADMIN_PASSWORD);
  await verifyAccessToken({
    apiUrl: localEnv.apiUrl,
    anonKey: localEnv.anonKey,
    accessToken: adminAccessToken,
    expectedEmail: ADMIN_EMAIL,
  });
  log("Login Auth do Admin local validado.");

  await waitForProvisionPartner(localEnv);

  const firstProvision = await invokeProvisionPartner({
    apiUrl: localEnv.apiUrl,
    anonKey: localEnv.anonKey,
    accessToken: adminAccessToken,
  });

  if (firstProvision.body.status !== "created") {
    fail("Primeira chamada da provision-partner não retornou status created.");
  }

  if (firstProvision.body.invite?.status !== "pending_delivery") {
    fail("Primeira chamada da provision-partner não retornou convite pending_delivery.");
  }

  const secondProvision = await invokeProvisionPartner({
    apiUrl: localEnv.apiUrl,
    anonKey: localEnv.anonKey,
    accessToken: adminAccessToken,
  });

  if (secondProvision.body.status !== "existing") {
    fail("Segunda chamada da provision-partner não validou idempotência.");
  }

  log("provision-partner criou Parceiro local e retry idempotente retornou existing.");

  const { profile: partnerProfile } = await verifyPartnerRecords(adminClient);
  await setLocalDevPartnerPassword(
    adminClient,
    partnerProfile.user_id,
    partnerPassword,
  );
  log("Senha local/dev do Parceiro fictício definida sem exposição.");

  await signIn(anonClient, PARTNER_EMAIL, partnerPassword);
  log("Login Auth do Parceiro local validado.");

  await startNextDev(localEnv);
  await validateNextLoginWithPlaywright({ adminPassword: ADMIN_PASSWORD, partnerPassword });

  log("Login real no Next e guards Admin/Parceiro validados no navegador headless.");
  log(`Fluxo local validado para ${ADMIN_EMAIL} e ${PARTNER_EMAIL}.`);
  log(`Profile Admin: ${adminProfile.id}; Profile Parceiro: ${partnerProfile.id}.`);
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

          setTimeout(() => {
            if (child.exitCode === null) child.kill("SIGKILL");
          }, 3_000).unref();
        }),
    ),
  );
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
    const safeEnv = sanitizeProcessEnv(process.env);
    void safeEnv;
    console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await shutdown();
  });
