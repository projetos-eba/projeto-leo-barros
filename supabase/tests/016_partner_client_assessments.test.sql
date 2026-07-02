begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(17);

select has_table('public', 'partner_client_assessments', 'partner_client_assessments existe');
select has_table('public', 'partner_client_assessment_circumferences', 'partner_client_assessment_circumferences existe');
select has_table('public', 'partner_client_assessment_skinfolds', 'partner_client_assessment_skinfolds existe');
select has_table('public', 'partner_client_calorie_calculations', 'partner_client_calorie_calculations existe');
select has_column('public', 'partner_client_assessments', 'assessment_method', 'partner_client_assessments.assessment_method existe');

select ok(
  to_regprocedure('public.partner_client_assessments(uuid)') is not null,
  'partner_client_assessments RPC existe'
);

select ok(
  has_function_privilege('authenticated', 'public.partner_client_assessments(uuid)', 'execute'),
  'authenticated pode executar RPC segura'
);

select is(
  position('cpf' in lower(pg_get_functiondef('public.partner_client_assessments(uuid)'::regprocedure))),
  0,
  'RPC nao referencia CPF'
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
  ('00000000-0000-0000-0000-000000000000', 'ac100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'assessments-partner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ac100000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'assessments-partner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ac100000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'assessments-client@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ac100000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'assessments-admin@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status)
values
  ('ac100000-0000-4000-8000-000000000101', 'ac100000-0000-4000-8000-000000000001', 'assessments-partner-a@example.invalid', 'Parceiro Avaliações A', 'parceiro', 'active'),
  ('ac100000-0000-4000-8000-000000000102', 'ac100000-0000-4000-8000-000000000002', 'assessments-partner-b@example.invalid', 'Parceiro Avaliações B', 'parceiro', 'active'),
  ('ac100000-0000-4000-8000-000000000103', 'ac100000-0000-4000-8000-000000000003', 'assessments-client@example.invalid', 'Cliente Avaliações', 'cliente', 'active'),
  ('ac100000-0000-4000-8000-000000000104', 'ac100000-0000-4000-8000-000000000004', 'assessments-admin@example.invalid', 'Admin Avaliações', 'admin', 'active');

insert into public.partners (id, profile_id, professional_name, professional_type)
values
  ('ac100000-0000-4000-8000-000000000201', 'ac100000-0000-4000-8000-000000000101', 'Parceiro Avaliações A', 'personal_trainer'),
  ('ac100000-0000-4000-8000-000000000202', 'ac100000-0000-4000-8000-000000000102', 'Parceiro Avaliações B', 'nutricionista');

insert into public.admins (id, profile_id)
values ('ac100000-0000-4000-8000-000000000203', 'ac100000-0000-4000-8000-000000000104');

insert into public.patients (id, profile_id, cpf, birth_date, objective, gender)
values (
  'ac100000-0000-4000-8000-000000000301',
  'ac100000-0000-4000-8000-000000000103',
  '44444444444',
  current_date - interval '29 years',
  'Hipertrofia',
  'female'
);

insert into public.partner_clients (partner_id, patient_id, service_scope, status)
values (
  'ac100000-0000-4000-8000-000000000201',
  'ac100000-0000-4000-8000-000000000301',
  'treino',
  'active'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ac100000-0000-4000-8000-000000000001', true);

insert into public.partner_client_assessments (
  id,
  partner_id,
  patient_id,
  assessed_at,
  height_cm,
  weight_kg,
  body_fat_percentage,
  activity_level,
  assessment_method,
  target_weight_kg,
  target_days
)
values (
  'ac100000-0000-4000-8000-000000000401',
  'ac100000-0000-4000-8000-000000000201',
  'ac100000-0000-4000-8000-000000000301',
  now(),
  170,
  70,
  20,
  'moderate',
  'pollock_7',
  68,
  60
);

select is(
  (select count(*)::integer from public.partner_client_assessments),
  1,
  'Parceiro vinculado cria avaliacao'
);

insert into public.partner_client_assessment_circumferences (
  assessment_id,
  partner_id,
  patient_id,
  metric_key,
  value_cm
)
values (
  'ac100000-0000-4000-8000-000000000401',
  'ac100000-0000-4000-8000-000000000201',
  'ac100000-0000-4000-8000-000000000301',
  'waist',
  72
);

select is(
  (public.partner_client_assessments('ac100000-0000-4000-8000-000000000301')->'assessments'->0->>'weightKg')::numeric,
  70::numeric,
  'RPC retorna avaliacao para parceiro vinculado'
);

select is(
  public.partner_client_assessments('ac100000-0000-4000-8000-000000000301')->'assessments'->0->>'assessmentMethod',
  'pollock_7',
  'RPC retorna metodo de avaliacao fisica'
);

insert into public.partner_client_assessment_skinfolds (
  assessment_id,
  partner_id,
  patient_id,
  metric_key,
  value_mm
)
values (
  'ac100000-0000-4000-8000-000000000401',
  'ac100000-0000-4000-8000-000000000201',
  'ac100000-0000-4000-8000-000000000301',
  'abdominal',
  14.5
);

select is(
  (public.partner_client_assessments('ac100000-0000-4000-8000-000000000301')->'assessments'->0->'skinfolds'->0->>'valueMm')::numeric,
  14.5::numeric,
  'RPC retorna dobras cutaneas da avaliacao'
);

insert into public.partner_client_calorie_calculations (
  partner_id,
  patient_id,
  assessment_id,
  formula,
  activity_factor,
  bmr_kcal,
  tdee_kcal,
  target_kcal,
  daily_energy_delta_kcal,
  weekly_energy_delta_kcal,
  target_weight_kg,
  target_days,
  projected_weight_delta_kg,
  status
)
values (
  'ac100000-0000-4000-8000-000000000201',
  'ac100000-0000-4000-8000-000000000301',
  'ac100000-0000-4000-8000-000000000401',
  'mifflin',
  1.55,
  1400,
  2170,
  1913,
  -257,
  -1799,
  68,
  60,
  -2,
  'applied'
);

select is(
  public.partner_client_assessments('ac100000-0000-4000-8000-000000000301')->'calculations'->0->>'status',
  'applied',
  'RPC retorna calculo aplicado'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ac100000-0000-4000-8000-000000000002', true);

select is(
  public.partner_client_assessments('ac100000-0000-4000-8000-000000000301'),
  null::jsonb,
  'Outro parceiro nao acessa avaliacoes'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ac100000-0000-4000-8000-000000000004', true);

select is(
  (select count(*)::integer from public.partner_client_assessments),
  0,
  'Admin nao possui leitura clinica global de avaliacoes'
);

select is(
  (select count(*)::integer from public.partner_client_assessment_skinfolds),
  0,
  'Admin nao possui leitura global de dobras cutaneas'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ac100000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$
    insert into public.partner_client_assessments (
      partner_id,
      patient_id,
      assessed_at,
      height_cm,
      weight_kg,
      activity_level,
      target_days
    )
    values (
      'ac100000-0000-4000-8000-000000000201',
      'ac100000-0000-4000-8000-000000000301',
      now(),
      40,
      70,
      'moderate',
      60
    )
  $$,
  'new row for relation "partner_client_assessments" violates check constraint "partner_client_assessments_height_check"',
  'Constraint bloqueia altura invalida'
);

reset role;
select * from finish();

rollback;
