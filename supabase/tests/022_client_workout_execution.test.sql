begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_table('public', 'client_workout_sessions', 'sessões de execução de treino existem');
select has_table('public', 'client_workout_exercise_logs', 'logs de exercício de treino existem');
select has_table('public', 'client_workout_set_logs', 'logs de séries de treino existem');
select has_table('public', 'client_workout_events', 'eventos de treino existem');
select has_function('public', 'client_workout_dashboard', array['date'], 'RPC do painel de treino do Cliente existe');
select has_function('public', 'client_workout_start_session', array['uuid'], 'RPC para iniciar treino existe');
select has_function('public', 'client_workout_log_set', array['uuid', 'uuid', 'numeric', 'integer', 'boolean'], 'RPC para registrar série existe');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'ce100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'client-workout-partner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ce100000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'client-workout-partner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ce100000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'client-workout-client-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ce100000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'client-workout-client-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status)
values
  ('ce100000-0000-4000-8000-000000000101', 'ce100000-0000-4000-8000-000000000001', 'client-workout-partner-a@example.invalid', 'Parceiro Treino A', 'parceiro', 'active'),
  ('ce100000-0000-4000-8000-000000000102', 'ce100000-0000-4000-8000-000000000002', 'client-workout-partner-b@example.invalid', 'Parceiro Treino B', 'parceiro', 'active'),
  ('ce100000-0000-4000-8000-000000000103', 'ce100000-0000-4000-8000-000000000003', 'client-workout-client-a@example.invalid', 'Cliente Treino A', 'cliente', 'active'),
  ('ce100000-0000-4000-8000-000000000104', 'ce100000-0000-4000-8000-000000000004', 'client-workout-client-b@example.invalid', 'Cliente Treino B', 'cliente', 'active');

insert into public.partners (id, profile_id, professional_name, professional_type)
values
  ('ce100000-0000-4000-8000-000000000201', 'ce100000-0000-4000-8000-000000000101', 'Parceiro Treino A', 'personal_trainer'),
  ('ce100000-0000-4000-8000-000000000202', 'ce100000-0000-4000-8000-000000000102', 'Parceiro Treino B', 'personal_trainer');

insert into public.patients (id, profile_id)
values
  ('ce100000-0000-4000-8000-000000000301', 'ce100000-0000-4000-8000-000000000103'),
  ('ce100000-0000-4000-8000-000000000302', 'ce100000-0000-4000-8000-000000000104');

insert into public.partner_clients (partner_id, patient_id, service_scope, status, started_at)
values
  ('ce100000-0000-4000-8000-000000000201', 'ce100000-0000-4000-8000-000000000301', 'treino', 'active', now() - interval '1 day');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ce100000-0000-4000-8000-000000000001', true);

insert into public.partner_protocol_exercises (
  id, partner_id, name, muscle_group, equipment, level, objective,
  default_sets, default_reps, rest_seconds, instructions, status
)
values (
  'ce100000-0000-4000-8000-000000000401',
  'ce100000-0000-4000-8000-000000000201',
  'Supino teste',
  'peito',
  'barra',
  'intermediario',
  'hipertrofia',
  2,
  '8-10',
  90,
  'Controlar amplitude.',
  'active'
);

insert into public.partner_workout_programs (
  id, partner_id, patient_id, program_kind, title, status, version, published_at
)
values (
  'ce100000-0000-4000-8000-000000000501',
  'ce100000-0000-4000-8000-000000000201',
  'ce100000-0000-4000-8000-000000000301',
  'client',
  'Treino Cliente',
  'published',
  1,
  now()
);

insert into public.partner_workout_sessions (
  id, partner_id, program_id, title, objective, frequency_per_week, duration_minutes, sort_order
)
values (
  'ce100000-0000-4000-8000-000000000601',
  'ce100000-0000-4000-8000-000000000201',
  'ce100000-0000-4000-8000-000000000501',
  'Treino A',
  'hipertrofia',
  2,
  60,
  0
);

insert into public.partner_workout_exercises (
  id, partner_id, session_id, exercise_id, rest_seconds, technique, sort_order,
  snapshot_name, snapshot_muscle_group, snapshot_secondary_muscle_groups
)
values (
  'ce100000-0000-4000-8000-000000000701',
  'ce100000-0000-4000-8000-000000000201',
  'ce100000-0000-4000-8000-000000000601',
  'ce100000-0000-4000-8000-000000000401',
  90,
  'normal',
  0,
  'Supino teste',
  'peito',
  array['triceps']
);

insert into public.partner_workout_sets (
  id, partner_id, prescribed_exercise_id, set_number, reps, load_kg, intensity
)
values (
  'ce100000-0000-4000-8000-000000000801',
  'ce100000-0000-4000-8000-000000000201',
  'ce100000-0000-4000-8000-000000000701',
  1,
  10,
  50,
  'moderate'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ce100000-0000-4000-8000-000000000003', true);

select isnt(public.client_workout_dashboard(current_date), null, 'Cliente vinculado recebe painel de treino');
select isnt(public.client_workout_start_session('ce100000-0000-4000-8000-000000000601'::uuid), null, 'Cliente inicia treino');
select isnt(public.client_workout_log_set(
  (select id from public.client_workout_sessions limit 1),
  'ce100000-0000-4000-8000-000000000801'::uuid,
  52,
  9,
  true
), null, 'Cliente registra série');
select is((select count(*)::integer from public.client_workout_sessions), 1, 'Cliente lê a própria sessão');
select is((select count(*)::integer from public.client_workout_set_logs), 1, 'Cliente lê a própria série');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ce100000-0000-4000-8000-000000000004', true);

select is(public.client_workout_dashboard(current_date)->>'program', null, 'Outro Cliente recebe dashboard sem treino próprio');
select is((select count(*)::integer from public.client_workout_sessions), 0, 'Outro Cliente não lê treino alheio');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ce100000-0000-4000-8000-000000000001', true);

select is((select count(*)::integer from public.client_workout_sessions), 1, 'Parceiro vinculado lê execução do Cliente');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ce100000-0000-4000-8000-000000000002', true);

select is((select count(*)::integer from public.client_workout_sessions), 0, 'Parceiro não vinculado não lê execução do Cliente');

select * from finish();

rollback;
