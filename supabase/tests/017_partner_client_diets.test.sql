begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_table('public', 'partner_client_diet_plans', 'planos alimentares do Cliente existem');
select has_table('public', 'partner_client_diet_meals', 'refeições da dieta existem');
select has_table('public', 'partner_client_diet_meal_items', 'itens da refeição existem');
select has_table('public', 'partner_client_diet_events', 'histórico da dieta existe');
select has_function('public', 'partner_client_diet', array['uuid'], 'RPC da aba Dietas existe');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'df100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'diet-partner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'df100000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'diet-partner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'df100000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'diet-client-linked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'df100000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'diet-client-inactive@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status)
values
  ('df100000-0000-4000-8000-000000000101', 'df100000-0000-4000-8000-000000000001', 'diet-partner-a@example.invalid', 'Dietas Parceiro A', 'parceiro', 'active'),
  ('df100000-0000-4000-8000-000000000102', 'df100000-0000-4000-8000-000000000002', 'diet-partner-b@example.invalid', 'Dietas Parceiro B', 'parceiro', 'active'),
  ('df100000-0000-4000-8000-000000000103', 'df100000-0000-4000-8000-000000000003', 'diet-client-linked@example.invalid', 'Cliente Dieta', 'cliente', 'active'),
  ('df100000-0000-4000-8000-000000000104', 'df100000-0000-4000-8000-000000000004', 'diet-client-inactive@example.invalid', 'Cliente Inativo', 'cliente', 'active');

insert into public.partners (id, profile_id, professional_name, professional_type)
values
  ('df100000-0000-4000-8000-000000000201', 'df100000-0000-4000-8000-000000000101', 'Dietas Parceiro A', 'nutricionista'),
  ('df100000-0000-4000-8000-000000000202', 'df100000-0000-4000-8000-000000000102', 'Dietas Parceiro B', 'nutricionista');

insert into public.patients (id, profile_id)
values
  ('df100000-0000-4000-8000-000000000301', 'df100000-0000-4000-8000-000000000103'),
  ('df100000-0000-4000-8000-000000000302', 'df100000-0000-4000-8000-000000000104');

insert into public.partner_clients (partner_id, patient_id, service_scope, status, started_at, ended_at)
values
  ('df100000-0000-4000-8000-000000000201', 'df100000-0000-4000-8000-000000000301', 'dieta', 'active', now() - interval '10 days', null),
  ('df100000-0000-4000-8000-000000000201', 'df100000-0000-4000-8000-000000000302', 'dieta', 'disabled', now() - interval '10 days', now() - interval '1 day');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'df100000-0000-4000-8000-000000000001', true);

insert into public.partner_protocol_foods (
  id, partner_id, name, category, source, serving_size, serving_unit, kcal, carbs_g, protein_g, fat_g
)
values (
  'df100000-0000-4000-8000-000000000401',
  'df100000-0000-4000-8000-000000000201',
  'Arroz autorizado',
  'cereal',
  'custom',
  100,
  'g',
  130,
  28,
  3,
  1
);

insert into public.partner_client_diet_plans (
  id, partner_id, patient_id, title, status, target_kcal, target_protein_g, target_carbs_g, target_fat_g, water_liters, calorie_strategy
)
values (
  'df100000-0000-4000-8000-000000000501',
  'df100000-0000-4000-8000-000000000201',
  'df100000-0000-4000-8000-000000000301',
  'Dieta autorizada',
  'draft',
  2200,
  160,
  240,
  70,
  3,
  'maintenance'
);

insert into public.partner_client_diet_meals (
  id, plan_id, partner_id, patient_id, day_of_week, title, meal_time, sort_order
)
values (
  'df100000-0000-4000-8000-000000000601',
  'df100000-0000-4000-8000-000000000501',
  'df100000-0000-4000-8000-000000000201',
  'df100000-0000-4000-8000-000000000301',
  1,
  'Almoço',
  '12:30',
  0
);

insert into public.partner_client_diet_meal_items (
  plan_id, meal_id, partner_id, patient_id, food_id, quantity, quantity_unit,
  snapshot_name, snapshot_serving_size, snapshot_serving_unit, snapshot_kcal, snapshot_carbs_g, snapshot_protein_g, snapshot_fat_g
)
values (
  'df100000-0000-4000-8000-000000000501',
  'df100000-0000-4000-8000-000000000601',
  'df100000-0000-4000-8000-000000000201',
  'df100000-0000-4000-8000-000000000301',
  'df100000-0000-4000-8000-000000000401',
  150,
  'g',
  'Arroz autorizado',
  100,
  'g',
  130,
  28,
  3,
  1
);

select is((select count(*)::integer from public.partner_client_diet_plans), 1, 'parceiro cria dieta para Cliente ativo');
select isnt(public.partner_client_diet('df100000-0000-4000-8000-000000000301'::uuid), null, 'RPC retorna dieta do Cliente vinculado ativo');

select throws_ok(
  $$
    insert into public.partner_client_diet_plans (
      partner_id, patient_id, title, target_kcal, calorie_strategy
    ) values (
      'df100000-0000-4000-8000-000000000201',
      'df100000-0000-4000-8000-000000000302',
      'Dieta bloqueada',
      2000,
      'maintenance'
    )
  $$,
  '42501',
  null,
  'parceiro não cria dieta para Cliente sem vínculo ativo'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'df100000-0000-4000-8000-000000000002', true);

select is((select count(*)::integer from public.partner_client_diet_plans), 0, 'outro parceiro não lê dietas');
select is(public.partner_client_diet('df100000-0000-4000-8000-000000000301'::uuid), null, 'RPC retorna null para parceiro sem vínculo');

select * from finish();

rollback;
