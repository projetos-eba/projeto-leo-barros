begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select ok(to_regclass('public.billing_products') is not null, 'read model de Products Stripe existe');
select ok(to_regclass('public.billing_prices') is not null, 'read model de Prices Stripe existe');
select ok(to_regprocedure('public.billing_public_catalog()') is not null, 'RPC publica controlada de catalogo existe');

select has_column('public', 'billing_products', 'stripe_product_id', 'Product guarda Stripe Product ID');
select has_column('public', 'billing_products', 'catalog_role', 'Product guarda papel no catalogo');
select has_column('public', 'billing_products', 'last_stripe_event_created_at', 'Product guarda ultimo evento Stripe aplicado');
select has_column('public', 'billing_prices', 'stripe_price_id', 'Price guarda Stripe Price ID');
select has_column('public', 'billing_prices', 'lookup_key', 'Price guarda lookup key comercial');
select has_column('public', 'billing_prices', 'last_stripe_event_created_at', 'Price guarda ultimo evento Stripe aplicado');
select has_column('public', 'billing_prices', 'deleted_at', 'Price preserva historico via soft delete');

select ok(
  has_function_privilege('anon', 'public.billing_public_catalog()', 'execute'),
  'anon pode executar apenas RPC publica controlada do catalogo'
);

select ok(
  not has_table_privilege('anon', 'public.billing_prices', 'select'),
  'anon nao le tabela historica de Prices diretamente'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'billing_prices'
      and policyname = 'billing_prices_service_role_all'
  ),
  'Prices possuem policy explicita para service role'
);

insert into public.billing_products (
  stripe_product_id,
  catalog_role,
  name,
  active,
  livemode,
  metadata
) values (
  'prod_hml_fixture_read_model',
  'hml-plan',
  'Fixture de homologacao',
  true,
  false,
  '{"application":"leo-barros","catalog_role":"hml-plan"}'::jsonb
);

select results_eq(
  $$ select count(*)::integer from public.billing_public_catalog() where slug = 'hml-catalog-fixture' $$,
  $$ values (0) $$,
  'fixture de homologacao nao entra no catalogo publico'
);

select results_eq(
  $$ select slug, price_cents from public.billing_public_catalog() where item_kind = 'plan' order by slug $$,
  $$ values ('complete-annual'::text, 119880), ('complete-monthly'::text, 11990) $$,
  'catalogo publico retorna planos atuais sem consultar Stripe'
);

select finish();

rollback;
