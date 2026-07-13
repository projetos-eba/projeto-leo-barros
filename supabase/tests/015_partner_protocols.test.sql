begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_table('public', 'partner_protocol_foods', 'base de alimentos do parceiro existe');
select has_table('public', 'partner_protocol_exercises', 'biblioteca de exercícios do parceiro existe');
select has_table('public', 'partner_protocol_use_drafts', 'rascunhos de uso em plano existem');
select has_table('public', 'partner_protocol_events', 'histórico de protocolos existe');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'af100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'protocols-partner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'af100000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'protocols-partner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'af100000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'protocols-client-linked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'af100000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'protocols-client-unlinked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status)
values
  ('af100000-0000-4000-8000-000000000101', 'af100000-0000-4000-8000-000000000001', 'protocols-partner-a@example.invalid', 'Protocolos Parceiro A', 'parceiro', 'active'),
  ('af100000-0000-4000-8000-000000000102', 'af100000-0000-4000-8000-000000000002', 'protocols-partner-b@example.invalid', 'Protocolos Parceiro B', 'parceiro', 'active'),
  ('af100000-0000-4000-8000-000000000103', 'af100000-0000-4000-8000-000000000003', 'protocols-client-linked@example.invalid', 'Cliente Vinculado', 'cliente', 'active'),
  ('af100000-0000-4000-8000-000000000104', 'af100000-0000-4000-8000-000000000004', 'protocols-client-unlinked@example.invalid', 'Cliente Sem Vínculo', 'cliente', 'active');

insert into public.partners (id, profile_id, professional_name, professional_type)
values
  ('af100000-0000-4000-8000-000000000201', 'af100000-0000-4000-8000-000000000101', 'Protocolos Parceiro A', 'nutricionista'),
  ('af100000-0000-4000-8000-000000000202', 'af100000-0000-4000-8000-000000000102', 'Protocolos Parceiro B', 'personal_trainer');

insert into public.patients (id, profile_id)
values
  ('af100000-0000-4000-8000-000000000301', 'af100000-0000-4000-8000-000000000103'),
  ('af100000-0000-4000-8000-000000000302', 'af100000-0000-4000-8000-000000000104');

insert into public.partner_clients (partner_id, patient_id, service_scope, status)
values ('af100000-0000-4000-8000-000000000201', 'af100000-0000-4000-8000-000000000301', 'dieta', 'active');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'af100000-0000-4000-8000-000000000001', true);

insert into public.partner_protocol_foods (
  id, partner_id, name, category, source, kcal, carbs_g, protein_g, fat_g
)
values (
  'af100000-0000-4000-8000-000000000401',
  'af100000-0000-4000-8000-000000000201',
  'Alimento autorizado',
  'cereal',
  'custom',
  100,
  20,
  4,
  1
);

insert into public.partner_protocol_exercises (
  id, partner_id, name, muscle_group, equipment, level, objective
)
values (
  'af100000-0000-4000-8000-000000000402',
  'af100000-0000-4000-8000-000000000201',
  'Exercício autorizado',
  'pernas',
  'barra',
  'intermediario',
  'forca'
);

insert into public.partner_protocol_use_drafts (
  partner_id, patient_id, item_type, food_id, plan_context
)
values (
  'af100000-0000-4000-8000-000000000201',
  'af100000-0000-4000-8000-000000000301',
  'food',
  'af100000-0000-4000-8000-000000000401',
  'dieta'
);

select is((select count(*)::integer from public.partner_protocol_foods), 1, 'parceiro cria alimento próprio');
select is((select count(*)::integer from public.partner_protocol_exercises), 1, 'parceiro cria exercício próprio');
select is((select count(*)::integer from public.partner_protocol_use_drafts), 1, 'parceiro cria rascunho para Cliente vinculado');

select throws_ok(
  $$
    insert into public.partner_protocol_use_drafts (
      partner_id, patient_id, item_type, food_id, plan_context
    )
    values (
      'af100000-0000-4000-8000-000000000201',
      'af100000-0000-4000-8000-000000000302',
      'food',
      'af100000-0000-4000-8000-000000000401',
      'dieta'
    )
  $$,
  '42501',
  null,
  'parceiro não cria rascunho para Cliente sem vínculo'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'af100000-0000-4000-8000-000000000002', true);

select is((select count(*)::integer from public.partner_protocol_foods), 0, 'outro parceiro não lê alimentos');
select is((select count(*)::integer from public.partner_protocol_exercises), 0, 'outro parceiro não lê exercícios');
select is((select count(*)::integer from public.partner_protocol_use_drafts), 0, 'outro parceiro não lê rascunhos');

select * from finish();

rollback;
