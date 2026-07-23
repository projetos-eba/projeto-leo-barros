begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(18);

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
  to_regprocedure('public.partner_client_real_adherence(uuid,date,integer)') is not null,
  'partner_client_real_adherence existe'
);

select ok(
  has_function_privilege('authenticated', 'public.partner_client_overview(uuid)', 'execute'),
  'authenticated pode executar a RPC segura'
);

select ok(
  has_function_privilege('authenticated', 'public.partner_client_real_adherence(uuid,date,integer)', 'execute'),
  'authenticated pode executar a RPC de adesao real'
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

insert into public.partner_client_diet_plans (
  id,
  partner_id,
  patient_id,
  title,
  status,
  target_kcal,
  target_protein_g,
  target_carbs_g,
  target_fat_g,
  sent_at,
  starts_on,
  review_on,
  published_at
)
values (
  'ab100000-0000-4000-8000-000000000401',
  'ab100000-0000-4000-8000-000000000201',
  'ab100000-0000-4000-8000-000000000301',
  'Dieta real',
  'active',
  2200,
  160,
  220,
  70,
  '2026-07-01T12:00:00.000Z',
  '2026-07-01',
  '2026-07-31',
  '2026-07-01T12:00:00.000Z'
);

insert into public.partner_client_diet_meals (
  id,
  plan_id,
  partner_id,
  patient_id,
  day_of_week,
  title,
  meal_time
)
values
  ('ab100000-0000-4000-8000-000000000411', 'ab100000-0000-4000-8000-000000000401', 'ab100000-0000-4000-8000-000000000201', 'ab100000-0000-4000-8000-000000000301', 1, 'Cafe da manha', '07:00'),
  ('ab100000-0000-4000-8000-000000000412', 'ab100000-0000-4000-8000-000000000401', 'ab100000-0000-4000-8000-000000000201', 'ab100000-0000-4000-8000-000000000301', 2, 'Almoco', '12:00');

insert into public.client_diet_meal_logs (
  partner_id,
  patient_id,
  plan_id,
  meal_id,
  log_date,
  status,
  completed_at
)
values (
  'ab100000-0000-4000-8000-000000000201',
  'ab100000-0000-4000-8000-000000000301',
  'ab100000-0000-4000-8000-000000000401',
  'ab100000-0000-4000-8000-000000000411',
  '2026-07-20',
  'completed',
  '2026-07-20T08:00:00.000Z'
);

insert into public.partner_protocol_exercises (
  id,
  partner_id,
  name,
  muscle_group,
  equipment,
  objective
)
values (
  'ab100000-0000-4000-8000-000000000501',
  'ab100000-0000-4000-8000-000000000201',
  'Agachamento teste',
  'pernas',
  'peso_corporal',
  'hipertrofia'
);

insert into public.partner_workout_programs (
  id,
  partner_id,
  patient_id,
  program_kind,
  title,
  status,
  sent_at
)
values (
  'ab100000-0000-4000-8000-000000000511',
  'ab100000-0000-4000-8000-000000000201',
  'ab100000-0000-4000-8000-000000000301',
  'client',
  'Treino real',
  'sent',
  '2026-07-01T12:00:00.000Z'
);

insert into public.partner_workout_sessions (
  id,
  partner_id,
  program_id,
  title,
  objective,
  frequency_per_week,
  duration_minutes
)
values (
  'ab100000-0000-4000-8000-000000000521',
  'ab100000-0000-4000-8000-000000000201',
  'ab100000-0000-4000-8000-000000000511',
  'Treino A',
  'hipertrofia',
  1,
  60
);

insert into public.partner_workout_exercises (
  id,
  partner_id,
  session_id,
  exercise_id,
  snapshot_name,
  snapshot_muscle_group
)
values (
  'ab100000-0000-4000-8000-000000000531',
  'ab100000-0000-4000-8000-000000000201',
  'ab100000-0000-4000-8000-000000000521',
  'ab100000-0000-4000-8000-000000000501',
  'Agachamento teste',
  'pernas'
);

insert into public.partner_workout_sets (
  id,
  partner_id,
  prescribed_exercise_id,
  set_number,
  reps,
  load_kg
)
values
  ('ab100000-0000-4000-8000-000000000541', 'ab100000-0000-4000-8000-000000000201', 'ab100000-0000-4000-8000-000000000531', 1, 10, 20),
  ('ab100000-0000-4000-8000-000000000542', 'ab100000-0000-4000-8000-000000000201', 'ab100000-0000-4000-8000-000000000531', 2, 10, 20);

insert into public.client_workout_sessions (
  id,
  partner_id,
  patient_id,
  program_id,
  prescribed_session_id,
  workout_date,
  status,
  started_at
)
values (
  'ab100000-0000-4000-8000-000000000551',
  'ab100000-0000-4000-8000-000000000201',
  'ab100000-0000-4000-8000-000000000301',
  'ab100000-0000-4000-8000-000000000511',
  'ab100000-0000-4000-8000-000000000521',
  '2026-07-20',
  'in_progress',
  '2026-07-20T13:00:00.000Z'
);

insert into public.client_workout_exercise_logs (
  id,
  client_session_id,
  partner_id,
  patient_id,
  prescribed_exercise_id,
  status,
  started_at
)
values (
  'ab100000-0000-4000-8000-000000000561',
  'ab100000-0000-4000-8000-000000000551',
  'ab100000-0000-4000-8000-000000000201',
  'ab100000-0000-4000-8000-000000000301',
  'ab100000-0000-4000-8000-000000000531',
  'in_progress',
  '2026-07-20T13:00:00.000Z'
);

insert into public.client_workout_set_logs (
  client_session_id,
  exercise_log_id,
  partner_id,
  patient_id,
  prescribed_exercise_id,
  prescribed_set_id,
  set_number,
  load_kg,
  reps,
  status,
  completed_at
)
values (
  'ab100000-0000-4000-8000-000000000551',
  'ab100000-0000-4000-8000-000000000561',
  'ab100000-0000-4000-8000-000000000201',
  'ab100000-0000-4000-8000-000000000301',
  'ab100000-0000-4000-8000-000000000531',
  'ab100000-0000-4000-8000-000000000541',
  1,
  20,
  10,
  'completed',
  '2026-07-20T13:10:00.000Z'
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

select is(
  (
    select jsonb_build_array(
      public.partner_client_real_adherence('ab100000-0000-4000-8000-000000000301', '2026-07-22', 1)->0->>'dietPercentage',
      public.partner_client_real_adherence('ab100000-0000-4000-8000-000000000301', '2026-07-22', 1)->0->>'trainingPercentage'
    )
  ),
  '["50", "50"]'::jsonb,
  'Adesao real usa refeicoes e series executadas pelo Cliente'
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
