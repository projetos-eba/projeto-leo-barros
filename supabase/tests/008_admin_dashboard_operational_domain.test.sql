begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_table('public', 'billing_plans', 'billing_plans existe');
select has_table('public', 'partner_subscriptions', 'partner_subscriptions existe');
select has_table('public', 'billing_payments', 'billing_payments existe');
select has_table('public', 'support_tickets', 'support_tickets existe');
select has_table('public', 'partner_documents', 'partner_documents existe');
select has_table('public', 'platform_activity_events', 'platform_activity_events existe');

select has_column('public', 'billing_plans', 'stripe_product_id', 'billing_plans prepara stripe_product_id opcional');
select has_column('public', 'billing_plans', 'stripe_price_id', 'billing_plans prepara stripe_price_id opcional');
select has_column('public', 'partner_subscriptions', 'stripe_customer_id', 'partner_subscriptions prepara stripe_customer_id opcional');
select has_column('public', 'partner_subscriptions', 'stripe_subscription_id', 'partner_subscriptions prepara stripe_subscription_id opcional');
select has_column('public', 'billing_payments', 'stripe_payment_intent_id', 'billing_payments prepara stripe_payment_intent_id opcional');

select has_index('public', 'partner_subscriptions', 'partner_subscriptions_active_partner_key', 'assinatura comercial aberta é única por parceiro');
select has_index('public', 'billing_payments', 'billing_payments_partner_status_due_idx', 'pagamentos têm índice por parceiro/status/vencimento');
select has_index('public', 'support_tickets', 'support_tickets_partner_status_idx', 'tickets têm índice por parceiro/status');
select has_index('public', 'partner_documents', 'partner_documents_partner_status_idx', 'documentos têm índice por parceiro/status');
select has_index('public', 'platform_activity_events', 'platform_activity_events_created_idx', 'movimentações têm índice temporal');

select ok(
  has_table_privilege('authenticated', 'public.billing_plans', 'select')
  and has_table_privilege('authenticated', 'public.partner_subscriptions', 'select')
  and has_table_privilege('authenticated', 'public.billing_payments', 'select')
  and has_table_privilege('authenticated', 'public.support_tickets', 'select')
  and has_table_privilege('authenticated', 'public.partner_documents', 'select')
  and has_table_privilege('authenticated', 'public.platform_activity_events', 'select'),
  'authenticated pode ler tabelas operacionais via RLS'
);

select ok(
  not has_table_privilege('authenticated', 'public.partner_subscriptions', 'insert')
  and not has_table_privilege('authenticated', 'public.billing_payments', 'insert')
  and not has_table_privilege('authenticated', 'public.support_tickets', 'insert')
  and not has_table_privilege('authenticated', 'public.partner_documents', 'insert')
  and not has_table_privilege('authenticated', 'public.platform_activity_events', 'insert'),
  'authenticated não pode gravar domínio operacional direto'
);

select ok(
  has_table_privilege('service_role', 'public.billing_plans', 'insert')
  and has_table_privilege('service_role', 'public.partner_subscriptions', 'insert')
  and has_table_privilege('service_role', 'public.billing_payments', 'insert')
  and has_table_privilege('service_role', 'public.support_tickets', 'insert')
  and has_table_privilege('service_role', 'public.partner_documents', 'insert')
  and has_table_privilege('service_role', 'public.platform_activity_events', 'insert'),
  'service_role possui privilégios SQL explícitos para automações futuras'
);

select results_eq(
  $$
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'billing_plans',
        'partner_subscriptions',
        'billing_payments',
        'support_tickets',
        'partner_documents',
        'platform_activity_events'
      )
  $$,
  array[11],
  'tabelas operacionais possuem policies de leitura explícitas'
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
    '98000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'dashboard-partner@example.invalid',
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
values (
  '98000000-0000-0000-0000-000000000101',
  '98000000-0000-0000-0000-000000000001',
  'dashboard-partner@example.invalid',
  'Parceiro Dashboard',
  'parceiro',
  'active'
);

insert into public.partners (
  id,
  profile_id,
  professional_name,
  professional_type,
  professional_registry_type,
  professional_registry_number
)
values (
  '98000000-0000-0000-0000-000000000201',
  '98000000-0000-0000-0000-000000000101',
  'Parceiro Dashboard',
  'nutricionista',
  'crn',
  'dashboard-001'
);

insert into public.billing_plans (
  id,
  slug,
  name,
  billing_interval,
  price_cents
)
values (
  '98000000-0000-0000-0000-000000000301',
  'dashboard-pro-monthly',
  'Pro Mensal',
  'monthly',
  29900
);

insert into public.partner_subscriptions (
  id,
  partner_id,
  plan_id,
  status,
  current_period_start,
  current_period_end
)
values (
  '98000000-0000-0000-0000-000000000401',
  '98000000-0000-0000-0000-000000000201',
  '98000000-0000-0000-0000-000000000301',
  'active',
  now() - interval '1 month',
  now() + interval '1 month'
);

insert into public.billing_payments (
  subscription_id,
  partner_id,
  amount_cents,
  status,
  payment_kind,
  due_at,
  paid_at
)
values (
  '98000000-0000-0000-0000-000000000401',
  '98000000-0000-0000-0000-000000000201',
  29900,
  'succeeded',
  'renewal',
  now(),
  now()
);

insert into public.support_tickets (
  partner_id,
  ticket_number,
  subject,
  status,
  priority,
  sla_due_at
)
values (
  '98000000-0000-0000-0000-000000000201',
  'TKT-DASH-001',
  'Dúvida sobre plano',
  'open',
  'medium',
  now() + interval '1 day'
);

insert into public.partner_documents (
  partner_id,
  document_type,
  status,
  title
)
values (
  '98000000-0000-0000-0000-000000000201',
  'professional_registry',
  'pending',
  'Registro profissional'
);

insert into public.platform_activity_events (
  event_type,
  partner_id,
  title,
  detail
)
values (
  'subscription_started',
  '98000000-0000-0000-0000-000000000201',
  'Assinatura ativada',
  'Plano Pro Mensal'
);

select finish();
rollback;
