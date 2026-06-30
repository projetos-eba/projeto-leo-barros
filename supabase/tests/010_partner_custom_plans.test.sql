begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_table('public', 'partner_custom_plans', 'partner_custom_plans existe');
select has_table('public', 'partner_client_plan_subscriptions', 'partner_client_plan_subscriptions existe');

select has_column('public', 'partner_custom_plans', 'billing_interval', 'planos personalizados têm recorrência');
select has_column('public', 'partner_custom_plans', 'price_cents', 'planos personalizados têm preço');
select has_column('public', 'partner_client_plan_subscriptions', 'current_period_end', 'assinaturas de clientes têm renovação');
select has_column('public', 'partner_client_plan_subscriptions', 'cancel_at_period_end', 'assinaturas podem encerrar no fim do período');

select has_index('public', 'partner_custom_plans', 'partner_custom_plans_partner_active_idx', 'planos filtram por parceiro/status');
select has_index('public', 'partner_client_plan_subscriptions', 'partner_client_plan_subscriptions_partner_status_period_idx', 'renovações filtram por parceiro/status/vencimento');
select has_index('public', 'partner_client_plan_subscriptions', 'partner_client_plan_subscriptions_active_plan_patient_key', 'cliente não duplica assinatura aberta no mesmo plano');

select ok(
  has_table_privilege('authenticated', 'public.partner_custom_plans', 'select')
  and has_table_privilege('authenticated', 'public.partner_custom_plans', 'insert')
  and has_table_privilege('authenticated', 'public.partner_custom_plans', 'update')
  and has_table_privilege('authenticated', 'public.partner_client_plan_subscriptions', 'select')
  and has_table_privilege('authenticated', 'public.partner_client_plan_subscriptions', 'insert')
  and has_table_privilege('authenticated', 'public.partner_client_plan_subscriptions', 'update'),
  'authenticated tem privilégios SQL para parceiros operarem via RLS'
);

select results_eq(
  $$
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename in ('partner_custom_plans', 'partner_client_plan_subscriptions')
  $$,
  array[9],
  'planos personalizados possuem policies explícitas'
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
  (
    '00000000-0000-0000-0000-000000000000',
    '99000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'custom-plan-partner@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '99000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'custom-plan-client@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.profiles (
  id,
  user_id,
  email,
  display_name,
  role,
  status
)
values
  (
    '99000000-0000-0000-0000-000000000101',
    '99000000-0000-0000-0000-000000000001',
    'custom-plan-partner@example.invalid',
    'Parceiro Planos',
    'parceiro',
    'active'
  ),
  (
    '99000000-0000-0000-0000-000000000102',
    '99000000-0000-0000-0000-000000000002',
    'custom-plan-client@example.invalid',
    'Cliente Plano',
    'cliente',
    'active'
  );

insert into public.partners (
  id,
  profile_id,
  professional_name,
  professional_type
)
values (
  '99000000-0000-0000-0000-000000000201',
  '99000000-0000-0000-0000-000000000101',
  'Parceiro Planos',
  'nutricionista'
);

insert into public.patients (
  id,
  profile_id
)
values (
  '99000000-0000-0000-0000-000000000301',
  '99000000-0000-0000-0000-000000000102'
);

insert into public.partner_clients (
  partner_id,
  patient_id,
  service_scope,
  status,
  started_at
)
values (
  '99000000-0000-0000-0000-000000000201',
  '99000000-0000-0000-0000-000000000301',
  'dieta',
  'active',
  now() - interval '10 days'
);

insert into public.partner_custom_plans (
  id,
  partner_id,
  name,
  description,
  billing_interval,
  price_cents
)
values (
  '99000000-0000-0000-0000-000000000401',
  '99000000-0000-0000-0000-000000000201',
  'Acompanhamento Premium',
  'Plano mensal personalizado para acompanhamento nutricional.',
  'monthly',
  49000
);

insert into public.partner_client_plan_subscriptions (
  id,
  partner_id,
  patient_id,
  custom_plan_id,
  status,
  current_period_start,
  current_period_end
)
values (
  '99000000-0000-0000-0000-000000000501',
  '99000000-0000-0000-0000-000000000201',
  '99000000-0000-0000-0000-000000000301',
  '99000000-0000-0000-0000-000000000401',
  'active',
  now() - interval '20 days',
  now() + interval '10 days'
);

select results_eq(
  $$
    select count(*)::integer
    from public.partner_client_plan_subscriptions
    where partner_id = '99000000-0000-0000-0000-000000000201'
      and status = 'active'
      and current_period_end <= now() + interval '30 days'
  $$,
  array[1],
  'dashboard consegue identificar renovação de plano personalizado nos próximos 30 dias'
);

select throws_ok(
  $$
    insert into public.partner_custom_plans (
      partner_id,
      name,
      billing_interval,
      price_cents
    )
    values (
      '99000000-0000-0000-0000-000000000201',
      'Plano inválido',
      'weekly',
      10000
    )
  $$,
  '23514',
  null,
  'planos personalizados restringem recorrências suportadas'
);

select * from finish();

rollback;
