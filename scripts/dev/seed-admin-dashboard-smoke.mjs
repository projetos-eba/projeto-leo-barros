import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const LOCAL_SUPABASE_API_URL = "http://127.0.0.1:54321";
const LOCAL_ADMIN_EMAIL = "antoniofelipe258@gmail.com";
const LOCAL_ADMIN_PASSWORD = process.env.LEO_LOCAL_ADMIN_PASSWORD ?? "123456";

const sensitiveKeys = [
  "ANON_KEY",
  "SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

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
  });

  const containerName = output
    .split("\n")
    .map((line) => line.trim())
    .find((name) => name.startsWith(prefix));

  if (!containerName) fail(`Container local não encontrado para prefixo ${prefix}.`);
  return containerName;
}

function getSupabaseLocalEnv() {
  const edgeRuntimeContainer = resolveSupabaseContainer("supabase_edge_runtime_");
  const output = execFileSync(
    "docker",
    ["inspect", "--format", "{{range .Config.Env}}{{println .}}{{end}}", edgeRuntimeContainer],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const env = parseEnvOutput(output);

  if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_ANON_KEY) {
    fail("Não foi possível resolver credenciais locais do Supabase.");
  }

  return {
    apiUrl: LOCAL_SUPABASE_API_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function psqlLocal(sql) {
  const dbContainer = resolveSupabaseContainer("supabase_db_");

  return execFileSync(
    "docker",
    ["exec", "-i", dbContainer, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres", "-t", "-A"],
    {
      input: sql,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  ).trim();
}

async function findAuthUserByEmail(adminClient, email) {
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) fail(`Falha ao listar usuários Auth locais: ${error.message}`);

    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }

  return null;
}

async function ensureAuthUser(adminClient, { email, password }) {
  const existing = await findAuthUserByEmail(adminClient, email);

  if (existing) {
    const { data, error } = await adminClient.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      password,
    });
    if (error || !data.user) fail(`Falha ao atualizar Auth user local ${email}: ${error?.message}`);
    return data.user;
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
  });

  if (error || !data.user) fail(`Falha ao criar Auth user local ${email}: ${error?.message}`);
  return data.user;
}

function sanitizeProcessEnv(env) {
  const sanitized = { ...env };
  for (const key of sensitiveKeys) {
    if (key in sanitized) sanitized[key] = "[filtered]";
  }
  return sanitized;
}

async function main() {
  const env = getSupabaseLocalEnv();
  const adminClient = createClient(env.apiUrl, env.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const partnerFixtures = [
    ["f2-admin-dashboard-partner-1@example.invalid", "Parceira Nutri Local", "nutricionista", "active"],
    ["f2-admin-dashboard-partner-2@example.invalid", "Parceiro Treino Local", "personal_trainer", "active"],
    ["f2-admin-dashboard-partner-3@example.invalid", "Parceiro Médico Local", "medico", "active"],
    ["f2-admin-dashboard-partner-4@example.invalid", "Parceira Performance Local", "nutricionista", "disabled"],
    ["f2-admin-dashboard-partner-5@example.invalid", "Parceira Acesso Suspenso Local", "nutricionista", "suspended"],
    ["f2-admin-dashboard-partner-6@example.invalid", "Parceiro Pagamento Suspenso Local", "personal_trainer", "suspended"],
    ["f2-admin-dashboard-partner-7@example.invalid", "Parceiro Inativo Local", "medico", "disabled"],
    ["f2-admin-dashboard-partner-8@example.invalid", "Parceiro Cardio Local", "personal_trainer", "active"],
  ];
  const clientFixtures = Array.from({ length: 14 }, (_, index) => [
    `f2-admin-dashboard-client-${index + 1}@example.invalid`,
    `Cliente Local ${index + 1}`,
  ]);

  const adminUser = await ensureAuthUser(adminClient, {
    email: LOCAL_ADMIN_EMAIL,
    password: LOCAL_ADMIN_PASSWORD,
  });
  const partnerUsers = [];
  for (const [email] of partnerFixtures) {
    partnerUsers.push(await ensureAuthUser(adminClient, { email, password: "LocalOnlyPartner123!" }));
  }
  const clientUsers = [];
  for (const [email] of clientFixtures) {
    clientUsers.push(await ensureAuthUser(adminClient, { email, password: "LocalOnlyClient123!" }));
  }

  const partnerValues = partnerFixtures
    .map(([email, name, professionalType, status], index) => {
      const n = String(index + 1).padStart(3, "0");
      return `(
        'f2000000-0000-4000-8000-000000000${n}'::uuid,
        ${sqlLiteral(partnerUsers[index].id)}::uuid,
        ${sqlLiteral(email)},
        '+55119900000${String(index + 1).padStart(2, "0")}',
        ${sqlLiteral(name)},
        'parceiro',
        ${sqlLiteral(status)},
        ${sqlLiteral(professionalType)},
        null,
        null
      )`;
    })
    .join(",\n");

  const clientProfileValues = clientFixtures
    .map(([email, name], index) => {
      const n = String(index + 1).padStart(3, "0");
      return `(
        'f2100000-0000-4000-8000-000000000${n}'::uuid,
        ${sqlLiteral(clientUsers[index].id)}::uuid,
        ${sqlLiteral(email)},
        '+55119800000${String(index + 1).padStart(2, "0")}',
        ${sqlLiteral(name)},
        'cliente',
        'active'
      )`;
    })
    .join(",\n");

  psqlLocal(`
do $$
declare
  local_admin_profile_id uuid;
begin
  select id
  into local_admin_profile_id
  from public.profiles
  where lower(email) = lower(${sqlLiteral(LOCAL_ADMIN_EMAIL)})
  limit 1;

  if local_admin_profile_id is null then
    local_admin_profile_id := 'f2000000-0000-4000-8000-000000000000'::uuid;
  end if;

  insert into public.profiles (
    id,
    user_id,
    email,
    phone,
    display_name,
    role,
    status
  )
  values (
    local_admin_profile_id,
    ${sqlLiteral(adminUser.id)}::uuid,
    ${sqlLiteral(LOCAL_ADMIN_EMAIL)},
    '+5511970000000',
    'Admin Local',
    'admin',
    'active'
  )
  on conflict (id) do update set
    user_id = excluded.user_id,
    email = excluded.email,
    phone = excluded.phone,
    display_name = excluded.display_name,
    role = excluded.role,
    status = excluded.status;

  insert into public.admins (profile_id)
  values (local_admin_profile_id)
  on conflict (profile_id) do nothing;
end $$;

with partner_seed (
  profile_id,
  user_id,
  email,
  phone,
  display_name,
  role,
  status,
  professional_type,
  professional_registry_type,
  professional_registry_number
) as (values ${partnerValues})
insert into public.profiles (
  id,
  user_id,
  email,
  phone,
  display_name,
  role,
  status
)
select profile_id, user_id, email, phone, display_name, role, status
from partner_seed
on conflict (id) do update set
  user_id = excluded.user_id,
  email = excluded.email,
  phone = excluded.phone,
  display_name = excluded.display_name,
  role = excluded.role,
  status = excluded.status;

with partner_seed (
  profile_id,
  user_id,
  email,
  phone,
  display_name,
  role,
  status,
  professional_type,
  professional_registry_type,
  professional_registry_number
) as (values ${partnerValues})
insert into public.partners (
  id,
  profile_id,
  professional_name,
  professional_type,
  professional_registry_type,
  professional_registry_number
)
select
  ('f2200000-0000-4000-8000-000000000' || right(profile_id::text, 3))::uuid,
  profile_id,
  display_name,
  professional_type,
  professional_registry_type,
  professional_registry_number
from partner_seed
on conflict (id) do update set
  professional_name = excluded.professional_name,
  professional_type = excluded.professional_type,
  professional_registry_type = excluded.professional_registry_type,
  professional_registry_number = excluded.professional_registry_number;

with client_seed (profile_id, user_id, email, phone, display_name, role, status) as (values ${clientProfileValues})
insert into public.profiles (
  id,
  user_id,
  email,
  phone,
  display_name,
  role,
  status
)
select profile_id, user_id, email, phone, display_name, role, status
from client_seed
on conflict (id) do update set
  user_id = excluded.user_id,
  email = excluded.email,
  phone = excluded.phone,
  display_name = excluded.display_name,
  role = excluded.role,
  status = excluded.status;

with client_seed (profile_id, user_id, email, phone, display_name, role, status) as (values ${clientProfileValues})
insert into public.patients (id, profile_id, birth_date, objective)
select
  ('f2300000-0000-4000-8000-000000000' || right(profile_id::text, 3))::uuid,
  profile_id,
  date '1990-01-01' + (right(profile_id::text, 3)::int * interval '30 days'),
  'Acompanhamento local de smoke'
from client_seed
on conflict (id) do update set
  birth_date = excluded.birth_date,
  objective = excluded.objective;

insert into public.billing_plans (id, slug, name, billing_interval, price_cents, currency, is_active)
values
  ('f2400000-0000-4000-8000-000000000001'::uuid, 'starter-monthly', 'Starter Mensal', 'monthly', 19900, 'brl', true),
  ('f2400000-0000-4000-8000-000000000002'::uuid, 'pro-monthly', 'Pro Mensal', 'monthly', 29900, 'brl', true),
  ('f2400000-0000-4000-8000-000000000003'::uuid, 'pro-yearly', 'Pro Anual', 'yearly', 298800, 'brl', true)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  billing_interval = excluded.billing_interval,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  is_active = excluded.is_active;

insert into public.partner_subscriptions (
  id,
  partner_id,
  plan_id,
  status,
  current_period_start,
  current_period_end,
  canceled_at
)
values
  ('f2500000-0000-4000-8000-000000000001'::uuid, 'f2200000-0000-4000-8000-000000000001'::uuid, 'f2400000-0000-4000-8000-000000000002'::uuid, 'active', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', null),
  ('f2500000-0000-4000-8000-000000000002'::uuid, 'f2200000-0000-4000-8000-000000000002'::uuid, 'f2400000-0000-4000-8000-000000000003'::uuid, 'active', date_trunc('month', now()), date_trunc('month', now()) + interval '1 year', null),
  ('f2500000-0000-4000-8000-000000000003'::uuid, 'f2200000-0000-4000-8000-000000000003'::uuid, 'f2400000-0000-4000-8000-000000000001'::uuid, 'trialing', now() - interval '1 day', now() + interval '14 days', null),
  ('f2500000-0000-4000-8000-000000000004'::uuid, 'f2200000-0000-4000-8000-000000000004'::uuid, 'f2400000-0000-4000-8000-000000000002'::uuid, 'canceled', date_trunc('month', now()) - interval '1 month', date_trunc('month', now()) + interval '1 month', now() - interval '3 days'),
  ('f2500000-0000-4000-8000-000000000005'::uuid, 'f2200000-0000-4000-8000-000000000005'::uuid, 'f2400000-0000-4000-8000-000000000001'::uuid, 'past_due', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', null),
  ('f2500000-0000-4000-8000-000000000006'::uuid, 'f2200000-0000-4000-8000-000000000006'::uuid, 'f2400000-0000-4000-8000-000000000002'::uuid, 'incomplete', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', null),
  ('f2500000-0000-4000-8000-000000000007'::uuid, 'f2200000-0000-4000-8000-000000000007'::uuid, 'f2400000-0000-4000-8000-000000000001'::uuid, 'canceled', date_trunc('month', now()) - interval '2 months', date_trunc('month', now()) - interval '1 month', date_trunc('month', now()) - interval '20 days'),
  ('f2500000-0000-4000-8000-000000000008'::uuid, 'f2200000-0000-4000-8000-000000000008'::uuid, 'f2400000-0000-4000-8000-000000000002'::uuid, 'active', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', null)
on conflict (id) do update set
  plan_id = excluded.plan_id,
  status = excluded.status,
  current_period_start = excluded.current_period_start,
  current_period_end = excluded.current_period_end,
  canceled_at = excluded.canceled_at;

insert into public.partner_clients (id, partner_id, patient_id, service_scope, status, started_at)
values
  ('f2600000-0000-4000-8000-000000000001'::uuid, 'f2200000-0000-4000-8000-000000000001'::uuid, 'f2300000-0000-4000-8000-000000000001'::uuid, 'dieta', 'active', now() - interval '26 days'),
  ('f2600000-0000-4000-8000-000000000002'::uuid, 'f2200000-0000-4000-8000-000000000001'::uuid, 'f2300000-0000-4000-8000-000000000002'::uuid, 'treino', 'active', now() - interval '22 days'),
  ('f2600000-0000-4000-8000-000000000003'::uuid, 'f2200000-0000-4000-8000-000000000002'::uuid, 'f2300000-0000-4000-8000-000000000003'::uuid, 'dieta', 'active', now() - interval '18 days'),
  ('f2600000-0000-4000-8000-000000000004'::uuid, 'f2200000-0000-4000-8000-000000000002'::uuid, 'f2300000-0000-4000-8000-000000000004'::uuid, 'saude', 'active', now() - interval '16 days'),
  ('f2600000-0000-4000-8000-000000000005'::uuid, 'f2200000-0000-4000-8000-000000000003'::uuid, 'f2300000-0000-4000-8000-000000000005'::uuid, 'cardio', 'active', now() - interval '10 days'),
  ('f2600000-0000-4000-8000-000000000006'::uuid, 'f2200000-0000-4000-8000-000000000003'::uuid, 'f2300000-0000-4000-8000-000000000006'::uuid, 'treino', 'active', now() - interval '8 days'),
  ('f2600000-0000-4000-8000-000000000007'::uuid, 'f2200000-0000-4000-8000-000000000004'::uuid, 'f2300000-0000-4000-8000-000000000007'::uuid, 'dieta', 'active', now() - interval '7 days'),
  ('f2600000-0000-4000-8000-000000000008'::uuid, 'f2200000-0000-4000-8000-000000000004'::uuid, 'f2300000-0000-4000-8000-000000000008'::uuid, 'treino', 'active', now() - interval '6 days'),
  ('f2600000-0000-4000-8000-000000000009'::uuid, 'f2200000-0000-4000-8000-000000000008'::uuid, 'f2300000-0000-4000-8000-000000000009'::uuid, 'cardio', 'active', now() - interval '5 days'),
  ('f2600000-0000-4000-8000-000000000010'::uuid, 'f2200000-0000-4000-8000-000000000008'::uuid, 'f2300000-0000-4000-8000-000000000010'::uuid, 'saude', 'active', now() - interval '4 days')
on conflict (id) do update set
  status = excluded.status,
  started_at = excluded.started_at;

insert into public.billing_payments (id, subscription_id, partner_id, amount_cents, status, payment_kind, due_at, paid_at)
values
  ('f2700000-0000-4000-8000-000000000001'::uuid, 'f2500000-0000-4000-8000-000000000001'::uuid, 'f2200000-0000-4000-8000-000000000001'::uuid, 29900, 'succeeded', 'renewal', date_trunc('month', now()) + interval '2 days', date_trunc('month', now()) + interval '2 days'),
  ('f2700000-0000-4000-8000-000000000002'::uuid, 'f2500000-0000-4000-8000-000000000002'::uuid, 'f2200000-0000-4000-8000-000000000002'::uuid, 298800, 'succeeded', 'renewal', date_trunc('month', now()) + interval '3 days', date_trunc('month', now()) + interval '3 days'),
  ('f2700000-0000-4000-8000-000000000003'::uuid, 'f2500000-0000-4000-8000-000000000003'::uuid, 'f2200000-0000-4000-8000-000000000003'::uuid, 19900, 'failed', 'renewal', date_trunc('month', now()) + interval '4 days', null)
on conflict (id) do update set
  amount_cents = excluded.amount_cents,
  status = excluded.status,
  payment_kind = excluded.payment_kind,
  due_at = excluded.due_at,
  paid_at = excluded.paid_at;

insert into public.support_tickets (id, partner_id, ticket_number, subject, status, priority, sla_due_at, resolved_at, created_at)
values
  ('f2800000-0000-4000-8000-000000000001'::uuid, 'f2200000-0000-4000-8000-000000000001'::uuid, 'TKT-F2-001', 'Dúvida sobre cobrança', 'open', 'medium', now() + interval '1 day', null, now() - interval '6 hours'),
  ('f2800000-0000-4000-8000-000000000002'::uuid, 'f2200000-0000-4000-8000-000000000002'::uuid, 'TKT-F2-002', 'Ajuste de plano', 'resolved', 'low', now() + interval '1 day', now() - interval '2 hours', now() - interval '1 day')
on conflict (id) do update set
  subject = excluded.subject,
  status = excluded.status,
  priority = excluded.priority,
  sla_due_at = excluded.sla_due_at,
  resolved_at = excluded.resolved_at,
  created_at = excluded.created_at;

delete from public.partner_documents
where id in (
  'f2900000-0000-4000-8000-000000000001'::uuid,
  'f2900000-0000-4000-8000-000000000002'::uuid,
  'f2900000-0000-4000-8000-000000000003'::uuid,
  'f2900000-0000-4000-8000-000000000004'::uuid,
  'f2900000-0000-4000-8000-000000000005'::uuid,
  'f2900000-0000-4000-8000-000000000006'::uuid,
  'f2900000-0000-4000-8000-000000000007'::uuid,
  'f2900000-0000-4000-8000-000000000008'::uuid
);

insert into public.platform_activity_events (id, event_type, partner_id, patient_id, payment_id, title, detail, created_at)
values
  ('f2a00000-0000-4000-8000-000000000001'::uuid, 'subscription_started', 'f2200000-0000-4000-8000-000000000001'::uuid, null, null, 'Assinatura ativada', 'Parceira Nutri Local entrou no plano Pro Mensal', now() - interval '1 hour'),
  ('f2a00000-0000-4000-8000-000000000002'::uuid, 'payment_received', 'f2200000-0000-4000-8000-000000000002'::uuid, null, 'f2700000-0000-4000-8000-000000000002'::uuid, 'Pagamento recebido', 'Plano Pro Anual processado no smoke local', now() - interval '3 hours'),
  ('f2a00000-0000-4000-8000-000000000003'::uuid, 'ticket_resolved', 'f2200000-0000-4000-8000-000000000002'::uuid, null, null, 'Ticket resolvido', 'TKT-F2-002 dentro do SLA', now() - interval '6 hours'),
  ('f2a00000-0000-4000-8000-000000000004'::uuid, 'payment_failed', 'f2200000-0000-4000-8000-000000000005'::uuid, null, null, 'Pagamento em aberto', 'Assinatura Starter Mensal exige regularização', now() - interval '1 day')
on conflict (id) do update set
  event_type = excluded.event_type,
  partner_id = excluded.partner_id,
  patient_id = excluded.patient_id,
  payment_id = excluded.payment_id,
  title = excluded.title,
  detail = excluded.detail,
  created_at = excluded.created_at;
`);

  log("Seed local do dashboard Admin aplicado com dados fictícios.");
  log(`Super Admin local disponível em ${LOCAL_ADMIN_EMAIL}.`);
}

main().catch((error) => {
  const safeEnv = sanitizeProcessEnv(process.env);
  void safeEnv;
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
