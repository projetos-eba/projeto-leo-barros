begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(15);

select has_table('public', 'partner_client_goals', 'partner_client_goals existe');
select has_table('public', 'partner_client_body_measurements', 'partner_client_body_measurements existe');
select has_table('public', 'partner_client_adherence_snapshots', 'partner_client_adherence_snapshots existe');
select has_table('public', 'partner_client_appointments', 'partner_client_appointments existe');
select has_table('public', 'partner_client_observations', 'partner_client_observations existe');
select has_table('public', 'partner_client_tasks', 'partner_client_tasks existe');
select has_table('public', 'partner_client_plan_modules', 'partner_client_plan_modules existe');

select ok(
  to_regprocedure('public.partner_client_overview(uuid)') is not null,
  'partner_client_overview existe'
);

select ok(
  has_function_privilege('authenticated', 'public.partner_client_overview(uuid)', 'execute'),
  'authenticated pode executar a RPC segura'
);

select is(
  position('cpf' in lower(pg_get_functiondef('public.partner_client_overview(uuid)'::regprocedure))),
  0,
  'RPC nao referencia nem expoe CPF'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'ab100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'overview-partner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ab100000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'overview-partner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ab100000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'overview-client@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ab100000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'overview-admin@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status)
values
  ('ab100000-0000-4000-8000-000000000101', 'ab100000-0000-4000-8000-000000000001', 'overview-partner-a@example.invalid', 'Parceiro Overview A', 'parceiro', 'active'),
  ('ab100000-0000-4000-8000-000000000102', 'ab100000-0000-4000-8000-000000000002', 'overview-partner-b@example.invalid', 'Parceiro Overview B', 'parceiro', 'active'),
  ('ab100000-0000-4000-8000-000000000103', 'ab100000-0000-4000-8000-000000000003', 'overview-client@example.invalid', 'Cliente Overview', 'cliente', 'active'),
  ('ab100000-0000-4000-8000-000000000104', 'ab100000-0000-4000-8000-000000000004', 'overview-admin@example.invalid', 'Admin Overview', 'admin', 'active');

insert into public.partners (id, profile_id, professional_name, professional_type)
values
  ('ab100000-0000-4000-8000-000000000201', 'ab100000-0000-4000-8000-000000000101', 'Parceiro Overview A', 'personal_trainer'),
  ('ab100000-0000-4000-8000-000000000202', 'ab100000-0000-4000-8000-000000000102', 'Parceiro Overview B', 'nutricionista');

insert into public.admins (id, profile_id)
values ('ab100000-0000-4000-8000-000000000203', 'ab100000-0000-4000-8000-000000000104');

insert into public.patients (id, profile_id, cpf, birth_date, objective, gender)
values (
  'ab100000-0000-4000-8000-000000000301',
  'ab100000-0000-4000-8000-000000000103',
  '33333333333',
  current_date - interval '30 years',
  'Performance',
  'female'
);

insert into public.partner_clients (partner_id, patient_id, service_scope, status)
values (
  'ab100000-0000-4000-8000-000000000201',
  'ab100000-0000-4000-8000-000000000301',
  'treino',
  'active'
);

insert into public.partner_client_goals (
  partner_id,
  patient_id,
  target_weight_kg,
  adherence_target_pct
)
values (
  'ab100000-0000-4000-8000-000000000201',
  'ab100000-0000-4000-8000-000000000301',
  72,
  80
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ab100000-0000-4000-8000-000000000001', true);

select is(
  public.partner_client_overview('ab100000-0000-4000-8000-000000000301')->'identity'->>'displayName',
  'Cliente Overview',
  'Parceiro vinculado recebe identidade minima do Cliente'
);

select is(
  (public.partner_client_overview('ab100000-0000-4000-8000-000000000301')->'goals'->>'targetWeightKg')::numeric,
  72::numeric,
  'Parceiro vinculado recebe dados operacionais da Visao Geral'
);

insert into public.partner_client_tasks (
  partner_id,
  patient_id,
  title,
  priority
)
values (
  'ab100000-0000-4000-8000-000000000201',
  'ab100000-0000-4000-8000-000000000301',
  'Tarefa autorizada',
  'high'
);

select is(
  (select count(*)::integer from public.partner_client_tasks),
  1,
  'Parceiro vinculado pode criar tarefa'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ab100000-0000-4000-8000-000000000002', true);

select is(
  public.partner_client_overview('ab100000-0000-4000-8000-000000000301'),
  null::jsonb,
  'Outro Parceiro nao recebe a Visao Geral'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ab100000-0000-4000-8000-000000000004', true);

select is(
  (select count(*)::integer from public.partner_client_body_measurements),
  0,
  'Admin nao possui leitura clinica global'
);

reset role;
select * from finish();

rollback;
