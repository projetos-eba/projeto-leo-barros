begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_table('public', 'client_diet_daily_logs', 'diário de hidratação do Cliente existe');
select has_table('public', 'client_diet_meal_logs', 'diário de refeições do Cliente existe');
select has_table('public', 'client_diet_events', 'histórico do diário do Cliente existe');
select has_table('public', 'client_diet_substitution_logs', 'trocas do dia do Cliente existem');
select has_function('public', 'client_diet_dashboard', array['date'], 'RPC do painel de dieta do Cliente existe');
select has_function('public', 'client_diet_mark_meal', array['uuid', 'date', 'boolean'], 'RPC para marcar refeição existe');
select has_function('public', 'client_diet_add_water', array['date', 'integer'], 'RPC para registrar água existe');
select has_function('public', 'client_diet_apply_substitution', array['uuid', 'uuid', 'uuid', 'date'], 'RPC para aplicar substituição existe');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'cd100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'client-diet-partner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cd100000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'client-diet-partner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cd100000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'client-diet-client-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cd100000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'client-diet-client-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status)
values
  ('cd100000-0000-4000-8000-000000000101', 'cd100000-0000-4000-8000-000000000001', 'client-diet-partner-a@example.invalid', 'Parceiro Dieta A', 'parceiro', 'active'),
  ('cd100000-0000-4000-8000-000000000102', 'cd100000-0000-4000-8000-000000000002', 'client-diet-partner-b@example.invalid', 'Parceiro Dieta B', 'parceiro', 'active'),
  ('cd100000-0000-4000-8000-000000000103', 'cd100000-0000-4000-8000-000000000003', 'client-diet-client-a@example.invalid', 'Cliente Dieta A', 'cliente', 'active'),
  ('cd100000-0000-4000-8000-000000000104', 'cd100000-0000-4000-8000-000000000004', 'client-diet-client-b@example.invalid', 'Cliente Dieta B', 'cliente', 'active');

insert into public.partners (id, profile_id, professional_name, professional_type)
values
  ('cd100000-0000-4000-8000-000000000201', 'cd100000-0000-4000-8000-000000000101', 'Parceiro Dieta A', 'nutricionista'),
  ('cd100000-0000-4000-8000-000000000202', 'cd100000-0000-4000-8000-000000000102', 'Parceiro Dieta B', 'nutricionista');

insert into public.patients (id, profile_id)
values
  ('cd100000-0000-4000-8000-000000000301', 'cd100000-0000-4000-8000-000000000103'),
  ('cd100000-0000-4000-8000-000000000302', 'cd100000-0000-4000-8000-000000000104');

insert into public.partner_clients (partner_id, patient_id, service_scope, status, started_at)
values
  ('cd100000-0000-4000-8000-000000000201', 'cd100000-0000-4000-8000-000000000301', 'dieta', 'active', now() - interval '1 day');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'cd100000-0000-4000-8000-000000000001', true);

insert into public.partner_client_diet_plans (
  id, partner_id, patient_id, title, status, target_kcal, target_protein_g, target_carbs_g, target_fat_g, water_liters, calorie_strategy
)
values (
  'cd100000-0000-4000-8000-000000000401',
  'cd100000-0000-4000-8000-000000000201',
  'cd100000-0000-4000-8000-000000000301',
  'Dieta Cliente',
  'published',
  2200,
  180,
  240,
  70,
  2,
  'surplus'
);

insert into public.partner_client_diet_meals (
  id, plan_id, partner_id, patient_id, day_of_week, title, meal_time, menu_option, option_label, sort_order
)
values (
  'cd100000-0000-4000-8000-000000000501',
  'cd100000-0000-4000-8000-000000000401',
  'cd100000-0000-4000-8000-000000000201',
  'cd100000-0000-4000-8000-000000000301',
  extract(isodow from current_date)::smallint,
  'Almoço',
  '12:30',
  1,
  'Cardápio 1',
  0
);

insert into public.partner_protocol_foods (
  id, partner_id, name, category, source, serving_size, serving_unit, household_measure,
  kcal, carbs_g, protein_g, fat_g, fiber_g, sodium_mg, tags, suggested_uses, status
)
values (
  'cd100000-0000-4000-8000-000000000701',
  'cd100000-0000-4000-8000-000000000201',
  'Patinho',
  'carne',
  'custom',
  100,
  'g',
  '1 porção',
  210,
  0,
  27,
  11,
  0,
  70,
  array['proteína'],
  array['refeicao_principal'],
  'active'
);

insert into public.partner_client_diet_meal_items (
  id, plan_id, meal_id, partner_id, patient_id, quantity, quantity_unit,
  snapshot_name, snapshot_serving_size, snapshot_serving_unit, snapshot_kcal, snapshot_carbs_g, snapshot_protein_g, snapshot_fat_g, snapshot_fiber_g
)
values (
  'cd100000-0000-4000-8000-000000000601',
  'cd100000-0000-4000-8000-000000000401',
  'cd100000-0000-4000-8000-000000000501',
  'cd100000-0000-4000-8000-000000000201',
  'cd100000-0000-4000-8000-000000000301',
  150,
  'g',
  'Frango',
  100,
  'g',
  165,
  0,
  31,
  3.6,
  0
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'cd100000-0000-4000-8000-000000000003', true);

select isnt(public.client_diet_dashboard(current_date), null, 'Cliente vinculado recebe painel de dieta');
select isnt(public.client_diet_mark_meal('cd100000-0000-4000-8000-000000000501'::uuid, current_date, true), null, 'Cliente marca refeição');
select isnt(public.client_diet_add_water(current_date, 250), null, 'Cliente registra água');
select isnt(public.client_diet_add_water(current_date, -250), null, 'Cliente remove água registrada');
select isnt(public.client_diet_apply_substitution('cd100000-0000-4000-8000-000000000501'::uuid, 'cd100000-0000-4000-8000-000000000601'::uuid, 'cd100000-0000-4000-8000-000000000701'::uuid, current_date), null, 'Cliente aplica substituição do dia');
select is((select count(*)::integer from public.client_diet_meal_logs), 1, 'Cliente lê o próprio diário de refeições');
select is((select count(*)::integer from public.client_diet_daily_logs), 1, 'Cliente lê o próprio diário de hidratação');
select is((select water_ml from public.client_diet_daily_logs limit 1), 0, 'Água não fica negativa após remoção');
select is((select count(*)::integer from public.client_diet_substitution_logs), 1, 'Cliente lê a própria substituição');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'cd100000-0000-4000-8000-000000000004', true);

select is(public.client_diet_dashboard(current_date)->>'plan', null, 'Outro Cliente recebe dashboard sem plano próprio');
select is((select count(*)::integer from public.client_diet_meal_logs), 0, 'Outro Cliente não lê diário alheio');
select is((select count(*)::integer from public.client_diet_substitution_logs), 0, 'Outro Cliente não lê substituição alheia');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'cd100000-0000-4000-8000-000000000001', true);

select is((select count(*)::integer from public.client_diet_meal_logs), 1, 'Parceiro vinculado lê diário do Cliente');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'cd100000-0000-4000-8000-000000000002', true);

select is((select count(*)::integer from public.client_diet_meal_logs), 0, 'Parceiro não vinculado não lê diário do Cliente');

select * from finish();

rollback;
