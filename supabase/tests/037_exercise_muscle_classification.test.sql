begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();
select ok(not has_function_privilege('authenticated', 'public.repair_exercise_muscle_classifications(boolean)', 'execute'), 'partners cannot run global repairs');
select ok(not has_table_privilege('authenticated', 'public.exercise_muscle_repair_audit', 'select'), 'repair audit is private');
select is((select count(*)::integer from public.exercise_muscle_classifications), 236, 'every manifest item is explicitly classified or pending');
select is((select review_status from public.exercise_muscle_classifications where source_key='exercise-library:EX-TURKISH-GET-UP'), 'pending_review', 'ambiguous compound execution remains pending');
insert into public.system_exercises(id,source_key,name,slug,publication_status,source_name,source_version,source_checksum)
values ('ac900000-0000-4000-8000-000000000001','exercise-library:EX-ABDOMINAL-BICICLETA','Abdominal bicicleta','repair-test-abdominal','published','test','test','test');
select is((select primary_muscle_group from public.system_exercises where id='ac900000-0000-4000-8000-000000000001'), 'core', 'new exercise receives explicit classification');
update public.system_exercises set primary_muscle_group = 'pernas', secondary_muscle_groups = array['gluteos'] where id='ac900000-0000-4000-8000-000000000001';
update public.system_exercises set primary_muscle_group = null, secondary_muscle_groups = '{}' where id='ac900000-0000-4000-8000-000000000001';
select is((select primary_muscle_group from public.system_exercises where id='ac900000-0000-4000-8000-000000000001'), 'pernas', 'reimport cannot clear manual primary group');
select is((select secondary_muscle_groups from public.system_exercises where id='ac900000-0000-4000-8000-000000000001'), array['gluteos'], 'reimport preserves secondary groups');
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


insert into public.partner_protocol_exercises(id,partner_id,name,muscle_group,system_exercise_id)
values ('ac900000-0000-4000-8000-000000000002','ac100000-0000-4000-8000-000000000201','Imported unknown','outros','ac900000-0000-4000-8000-000000000001'),
('ac900000-0000-4000-8000-000000000003','ac100000-0000-4000-8000-000000000202','Manual classification','pernas','ac900000-0000-4000-8000-000000000001');
insert into public.partner_workout_programs(id,partner_id,patient_id,title)
values ('ac900000-0000-4000-8000-000000000010','ac100000-0000-4000-8000-000000000201','ac100000-0000-4000-8000-000000000301','Repair test');
insert into public.partner_workout_sessions(id,partner_id,program_id,title)
values ('ac900000-0000-4000-8000-000000000011','ac100000-0000-4000-8000-000000000201','ac900000-0000-4000-8000-000000000010','Treino A');
insert into public.partner_workout_exercises(id,partner_id,session_id,exercise_id,snapshot_name,snapshot_muscle_group)
values ('ac900000-0000-4000-8000-000000000012','ac100000-0000-4000-8000-000000000201','ac900000-0000-4000-8000-000000000011','ac900000-0000-4000-8000-000000000002','Old snapshot','outros'),
('ac900000-0000-4000-8000-000000000013','ac100000-0000-4000-8000-000000000201','ac900000-0000-4000-8000-000000000011','ac900000-0000-4000-8000-000000000002','Manual snapshot','peito');
-- Simulate data created before classification support without altering other fixtures.
alter table public.system_exercises disable trigger system_exercise_muscle_classification;
update public.system_exercises set primary_muscle_group = null, secondary_muscle_groups='{}' where id='ac900000-0000-4000-8000-000000000001';
alter table public.system_exercises enable trigger system_exercise_muscle_classification;
select is((public.repair_exercise_muscle_classifications(true)->>'system')::integer, 1, 'dry run counts candidates');
select is((select primary_muscle_group from public.system_exercises where id='ac900000-0000-4000-8000-000000000001'), null::text, 'dry run does not mutate');
select is((public.repair_exercise_muscle_classifications(false)->>'system')::integer, 1, 'repair applies classification');
select is((public.repair_exercise_muscle_classifications(false)->>'system')::integer, 0, 'repair is idempotent');
select is((select before_values->>'primary' from public.exercise_muscle_repair_audit where record_id='ac900000-0000-4000-8000-000000000001'), null::text, 'audit retains previous empty classification');
select is((select after_values->>'primary' from public.exercise_muscle_repair_audit where record_id='ac900000-0000-4000-8000-000000000001'), 'core', 'audit retains new classification');
select is((select muscle_group from public.partner_protocol_exercises where id='ac900000-0000-4000-8000-000000000002'), 'core', 'repair updates imported library');
select is((select muscle_group from public.partner_protocol_exercises where id='ac900000-0000-4000-8000-000000000003'), 'pernas', 'repair preserves manual library classification');
select is((select snapshot_muscle_group from public.partner_workout_exercises where id='ac900000-0000-4000-8000-000000000012'), 'core', 'repair updates historical unknown snapshot');
select is((select snapshot_muscle_group from public.partner_workout_exercises where id='ac900000-0000-4000-8000-000000000013'), 'peito', 'repair preserves historical manual snapshot');
select is((select count(*)::integer from public.exercise_muscle_repair_audit), 3, 'all three changed records audited exactly once');
select * from finish();
rollback;
