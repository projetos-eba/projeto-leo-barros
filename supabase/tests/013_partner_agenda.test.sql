begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_column('public', 'partner_client_appointments', 'appointment_type', 'compromissos têm tipo');
select has_column('public', 'partner_client_appointments', 'modality', 'compromissos têm modalidade');
select has_column('public', 'partner_client_appointments', 'location_text', 'compromissos têm local');
select has_column('public', 'partner_client_appointments', 'reminder_minutes', 'compromissos têm lembrete');
select has_table('public', 'partner_calendar_blocks', 'bloqueios de agenda existem');

select ok(
  has_table_privilege('authenticated', 'public.partner_calendar_blocks', 'select')
  and has_table_privilege('authenticated', 'public.partner_calendar_blocks', 'insert')
  and has_table_privilege('authenticated', 'public.partner_calendar_blocks', 'update'),
  'authenticated opera bloqueios via RLS'
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
  ('00000000-0000-0000-0000-000000000000', 'ad100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'agenda-partner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ad100000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'agenda-partner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ad100000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'agenda-client@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status)
values
  ('ad100000-0000-4000-8000-000000000101', 'ad100000-0000-4000-8000-000000000001', 'agenda-partner-a@example.invalid', 'Agenda Parceiro A', 'parceiro', 'active'),
  ('ad100000-0000-4000-8000-000000000102', 'ad100000-0000-4000-8000-000000000002', 'agenda-partner-b@example.invalid', 'Agenda Parceiro B', 'parceiro', 'active'),
  ('ad100000-0000-4000-8000-000000000103', 'ad100000-0000-4000-8000-000000000003', 'agenda-client@example.invalid', 'Agenda Cliente', 'cliente', 'active');

insert into public.partners (id, profile_id, professional_name, professional_type)
values
  ('ad100000-0000-4000-8000-000000000201', 'ad100000-0000-4000-8000-000000000101', 'Agenda Parceiro A', 'nutricionista'),
  ('ad100000-0000-4000-8000-000000000202', 'ad100000-0000-4000-8000-000000000102', 'Agenda Parceiro B', 'personal_trainer');

insert into public.patients (id, profile_id)
values ('ad100000-0000-4000-8000-000000000301', 'ad100000-0000-4000-8000-000000000103');

insert into public.partner_clients (partner_id, patient_id, service_scope, status)
values ('ad100000-0000-4000-8000-000000000201', 'ad100000-0000-4000-8000-000000000301', 'treino', 'active');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ad100000-0000-4000-8000-000000000001', true);

insert into public.partner_client_appointments (
  id,
  partner_id,
  patient_id,
  title,
  starts_at,
  ends_at,
  status,
  appointment_type,
  modality,
  reminder_minutes
)
values (
  'ad100000-0000-4000-8000-000000000401',
  'ad100000-0000-4000-8000-000000000201',
  'ad100000-0000-4000-8000-000000000301',
  'Consulta autorizada',
  now() + interval '1 day',
  now() + interval '1 day 1 hour',
  'pending',
  'consulta',
  'online',
  30
);

insert into public.partner_calendar_blocks (
  id,
  partner_id,
  title,
  starts_at,
  ends_at
)
values (
  'ad100000-0000-4000-8000-000000000501',
  'ad100000-0000-4000-8000-000000000201',
  'Bloqueio autorizado',
  now() + interval '2 days',
  now() + interval '2 days 1 hour'
);

select is(
  (select count(*)::integer from public.partner_client_appointments),
  1,
  'Parceiro vinculado cria compromisso pendente'
);

select is(
  (select count(*)::integer from public.partner_calendar_blocks),
  1,
  'Parceiro cria bloqueio próprio'
);

select throws_ok(
  $$
    insert into public.partner_client_appointments (
      partner_id,
      patient_id,
      title,
      starts_at,
      ends_at,
      status,
      appointment_type,
      modality
    )
    values (
      'ad100000-0000-4000-8000-000000000201',
      'ad100000-0000-4000-8000-000000000301',
      'Consulta inválida',
      now() + interval '3 days',
      now() + interval '3 days 1 hour',
      'pending',
      'cardio',
      'online'
    )
  $$,
  '23514',
  null,
  'tipo de compromisso restringe valores suportados'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ad100000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.partner_client_appointments),
  0,
  'Outro parceiro não lê compromissos alheios'
);

select is(
  (select count(*)::integer from public.partner_calendar_blocks),
  0,
  'Outro parceiro não lê bloqueios alheios'
);

select * from finish();

rollback;
