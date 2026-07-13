begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select ok(to_regprocedure('public.billing_active_client_count(uuid)') is not null, 'RPC canonica de Clientes ativos existe');
select ok(to_regprocedure('public.billing_public_plans()') is not null, 'RPC publica de planos existe');
select ok(to_regclass('public.billing_sync_outbox') is not null, 'outbox de billing existe');
select ok(to_regclass('public.stripe_webhook_events') is not null, 'ledger de webhook existe');
select ok(to_regclass('public.billing_active_client_snapshots') is not null, 'snapshots de Clientes ativos existem');
select ok(to_regclass('public.partner_subscription_financial_summaries') is not null, 'read model financeiro de assinatura existe');
select has_column('public', 'stripe_webhook_events', 'stripe_event_created_at', 'ledger guarda created do evento Stripe');
select has_column('public', 'partner_subscriptions', 'stripe_last_event_created_at', 'assinatura guarda ultimo evento Stripe aplicado');
select has_column('public', 'partner_subscription_financial_summaries', 'discount_code', 'read model guarda codigo de desconto');
select has_column('public', 'partner_subscription_financial_summaries', 'discount_amount_cents', 'read model guarda valor de desconto');
select has_column('public', 'partner_subscription_financial_summaries', 'total_after_discount_cents', 'read model guarda total apos desconto');
select has_column('public', 'partner_subscription_financial_summaries', 'stripe_promotion_code_id', 'read model guarda Promotion Code interno');
select ok(
  not has_function_privilege('anon', 'public.billing_active_client_count(uuid)', 'execute'),
  'anon nao executa contagem faturavel de outro Parceiro'
);
select ok(
  has_function_privilege('authenticated', 'public.billing_active_client_count(uuid)', 'execute'),
  'usuario autenticado pode chamar contagem sob RLS'
);
select ok(
  not has_function_privilege('anon', 'public.billing_partner_trial_available(uuid)', 'execute'),
  'anon nao consulta elegibilidade de trial'
);
select ok(
  not has_function_privilege('authenticated', 'public.billing_partner_trial_available(uuid)', 'execute'),
  'elegibilidade de trial fica restrita ao backend service role'
);
select ok(
  not has_function_privilege('anon', 'public.billing_public_plans()', 'execute'),
  'catalogo via RPC fica restrito a sessoes autenticadas e service role'
);
select ok(
  not has_function_privilege('authenticated', 'public.enqueue_partner_client_billing_sync()', 'execute'),
  'trigger de outbox nao e RPC executavel por usuario autenticado'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'billing_sync_outbox'
      and policyname = 'billing_sync_outbox_service_role_all'
  ),
  'outbox possui policy explicita para service role'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'stripe_webhook_events'
      and policyname = 'stripe_webhook_events_service_role_all'
  ),
  'ledger de webhook possui policy explicita para service role'
);
select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'partner_billing_trial_usage'
      and indexname = 'partner_billing_trial_usage_first_subscription_idx'
  ),
  'uso de trial possui indice para assinatura inicial'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'partner_subscriptions'
      and policyname = 'partner_subscriptions_select_admin_or_own_partner'
  ),
  'assinaturas usam policy SELECT consolidada'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'partner_subscription_financial_summaries'
      and policyname = 'partner_subscription_financial_select_admin_or_own_partner'
  ),
  'read model financeiro usa policy SELECT consolidada'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'partner_subscription_financial_summaries'
      and policyname = 'partner_subscription_financial_service_role_all'
  ),
  'read model financeiro possui policy explicita para service role'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'partner_subscription_items'
      and policyname = 'partner_subscription_items_select_admin_or_own_partner'
  ),
  'itens de assinatura usam policy SELECT consolidada'
);
select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'partner_subscriptions'
      and indexname = 'partner_subscriptions_stripe_last_event_created_idx'
  ),
  'assinaturas possuem indice para decisao de evento Stripe fora de ordem'
);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'bb100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'billing-partner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'bb100000-0000-4000-8000-000000000101', 'authenticated', 'authenticated', 'billing-client-1@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'bb100000-0000-4000-8000-000000000102', 'authenticated', 'authenticated', 'billing-client-2@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status, email_confirmed_at)
values
  ('bb200000-0000-4000-8000-000000000001', 'bb100000-0000-4000-8000-000000000001', 'billing-partner@example.invalid', 'Billing Partner', 'parceiro', 'active', now()),
  ('bb200000-0000-4000-8000-000000000101', 'bb100000-0000-4000-8000-000000000101', 'billing-client-1@example.invalid', 'Billing Client 1', 'cliente', 'active', now()),
  ('bb200000-0000-4000-8000-000000000102', 'bb100000-0000-4000-8000-000000000102', 'billing-client-2@example.invalid', 'Billing Client 2', 'cliente', 'active', now());

insert into public.partners (id, profile_id, professional_name, professional_type)
values ('bb300000-0000-4000-8000-000000000001', 'bb200000-0000-4000-8000-000000000001', 'Billing Partner', 'personal_trainer');

insert into public.patients (id, profile_id)
values
  ('bb400000-0000-4000-8000-000000000101', 'bb200000-0000-4000-8000-000000000101'),
  ('bb400000-0000-4000-8000-000000000102', 'bb200000-0000-4000-8000-000000000102');

insert into public.partner_clients (partner_id, patient_id, service_scope, status)
values
  ('bb300000-0000-4000-8000-000000000001', 'bb400000-0000-4000-8000-000000000101', 'treino', 'active'),
  ('bb300000-0000-4000-8000-000000000001', 'bb400000-0000-4000-8000-000000000101', 'dieta', 'active'),
  ('bb300000-0000-4000-8000-000000000001', 'bb400000-0000-4000-8000-000000000102', 'treino', 'pending');

select is(public.billing_active_client_count('bb300000-0000-4000-8000-000000000001'), 1, 'Cliente com dieta e treino conta uma vez e pendente nao conta');

update public.partner_clients
set status = 'active'
where patient_id = 'bb400000-0000-4000-8000-000000000102';

select is(public.billing_active_client_count('bb300000-0000-4000-8000-000000000001'), 2, 'dois Clientes unicos ativos contam dois');

select ok(
  exists (
    select 1
    from public.billing_sync_outbox
    where partner_id = 'bb300000-0000-4000-8000-000000000001'
      and event_type = 'active_client_quantity_changed'
  ),
  'mudanca em partner_clients gera outbox'
);

insert into public.partner_billing_trial_usage (partner_id)
values ('bb300000-0000-4000-8000-000000000001');

select is(public.billing_partner_trial_available('bb300000-0000-4000-8000-000000000001'), false, 'trial nao fica disponivel apos uso');

select results_eq(
  $$ select price_cents from public.billing_public_plans() where slug = 'complete-annual' $$,
  $$ values (119880) $$,
  'plano anual publico usa valor anual real'
);

select finish();

rollback;
