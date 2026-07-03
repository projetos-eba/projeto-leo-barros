begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_table('public', 'client_health_daily_logs', 'diário de saúde do Cliente existe');
select has_table('public', 'client_health_medications', 'medicações do Cliente existem');
select has_table('public', 'client_health_medication_logs', 'logs de medicação do Cliente existem');
select has_table('public', 'client_health_pressure_logs', 'logs de pressão do Cliente existem');
select has_table('public', 'client_health_action_logs', 'ações de saúde do Cliente existem');
select has_function('public', 'client_health_dashboard', array['date'], 'RPC do painel de saúde do Cliente existe');
select has_function('public', 'client_health_mark_medication', array['uuid', 'date', 'boolean'], 'RPC para marcar medicação existe');
select has_function('public', 'client_health_complete_action', array['text', 'date'], 'RPC para concluir ação existe');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'cf100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'client-health-partner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cf100000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'client-health-partner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cf100000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'client-health-client-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cf100000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'client-health-client-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status)
values
  ('cf100000-0000-4000-8000-000000000101', 'cf100000-0000-4000-8000-000000000001', 'client-health-partner-a@example.invalid', 'Parceiro Saúde A', 'parceiro', 'active'),
  ('cf100000-0000-4000-8000-000000000102', 'cf100000-0000-4000-8000-000000000002', 'client-health-partner-b@example.invalid', 'Parceiro Saúde B', 'parceiro', 'active'),
  ('cf100000-0000-4000-8000-000000000103', 'cf100000-0000-4000-8000-000000000003', 'client-health-client-a@example.invalid', 'Cliente Saúde A', 'cliente', 'active'),
  ('cf100000-0000-4000-8000-000000000104', 'cf100000-0000-4000-8000-000000000004', 'client-health-client-b@example.invalid', 'Cliente Saúde B', 'cliente', 'active');

insert into public.partners (id, profile_id, professional_name, professional_type)
values
  ('cf100000-0000-4000-8000-000000000201', 'cf100000-0000-4000-8000-000000000101', 'Parceiro Saúde A', 'medico'),
  ('cf100000-0000-4000-8000-000000000202', 'cf100000-0000-4000-8000-000000000102', 'Parceiro Saúde B', 'medico');

insert into public.patients (id, profile_id)
values
  ('cf100000-0000-4000-8000-000000000301', 'cf100000-0000-4000-8000-000000000103'),
  ('cf100000-0000-4000-8000-000000000302', 'cf100000-0000-4000-8000-000000000104');

insert into public.partner_clients (partner_id, patient_id, service_scope, status, started_at)
values
  ('cf100000-0000-4000-8000-000000000201', 'cf100000-0000-4000-8000-000000000301', 'saude', 'active', now() - interval '1 day');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'cf100000-0000-4000-8000-000000000001', true);

insert into public.client_health_medications (
  id, partner_id, patient_id, name, dosage, schedule_time, status, sort_order
)
values (
  'cf100000-0000-4000-8000-000000000401',
  'cf100000-0000-4000-8000-000000000201',
  'cf100000-0000-4000-8000-000000000301',
  'Vitamina D',
  '2000 UI',
  '08:00',
  'active',
  0
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'cf100000-0000-4000-8000-000000000003', true);

insert into public.client_health_daily_logs (partner_id, patient_id, log_date, sleep_minutes, sleep_efficiency_pct, hydration_ml)
values ('cf100000-0000-4000-8000-000000000201', 'cf100000-0000-4000-8000-000000000301', current_date, 460, 84, 2100);

insert into public.client_health_pressure_logs (partner_id, patient_id, measured_at, systolic, diastolic)
values ('cf100000-0000-4000-8000-000000000201', 'cf100000-0000-4000-8000-000000000301', now(), 122, 78);

select isnt(public.client_health_dashboard(current_date), null, 'Cliente vinculado recebe painel de saúde');
select isnt(public.client_health_mark_medication('cf100000-0000-4000-8000-000000000401'::uuid, current_date, true), null, 'Cliente marca medicação');
select isnt(public.client_health_complete_action('pressure', current_date), null, 'Cliente conclui ação');
select is((select count(*)::integer from public.client_health_medication_logs), 1, 'Cliente lê o próprio log de medicação');
select is((select count(*)::integer from public.client_health_pressure_logs), 1, 'Cliente lê o próprio log de pressão');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'cf100000-0000-4000-8000-000000000004', true);

select is(public.client_health_dashboard(current_date), null, 'Outro Cliente não recebe painel alheio');
select is((select count(*)::integer from public.client_health_medication_logs), 0, 'Outro Cliente não lê medicação alheia');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'cf100000-0000-4000-8000-000000000001', true);

select is((select count(*)::integer from public.client_health_medication_logs), 1, 'Parceiro vinculado lê medicação do Cliente');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'cf100000-0000-4000-8000-000000000002', true);

select is((select count(*)::integer from public.client_health_medication_logs), 0, 'Parceiro não vinculado não lê medicação do Cliente');

select * from finish();

rollback;
