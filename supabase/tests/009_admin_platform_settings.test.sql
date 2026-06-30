begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_table('public', 'platform_settings', 'platform_settings existe');
select has_table('public', 'platform_integrations', 'platform_integrations existe');
select has_table('public', 'platform_settings_activity', 'platform_settings_activity existe');

select has_column('public', 'platform_settings', 'value', 'platform_settings.value existe');
select has_column('public', 'platform_integrations', 'config', 'platform_integrations.config existe');
select has_column('public', 'platform_integrations', 'last_test_status', 'platform_integrations.last_test_status existe');
select has_column('public', 'platform_settings_activity', 'metadata', 'platform_settings_activity.metadata existe');

select has_index('public', 'platform_integrations', 'platform_integrations_key_key', 'integration_key é único');
select has_index('public', 'platform_settings_activity', 'platform_settings_activity_created_idx', 'histórico ordena por data');

select ok(
  has_table_privilege('authenticated', 'public.platform_settings', 'select')
  and has_table_privilege('authenticated', 'public.platform_settings', 'insert')
  and has_table_privilege('authenticated', 'public.platform_settings', 'update')
  and has_table_privilege('authenticated', 'public.platform_integrations', 'select')
  and has_table_privilege('authenticated', 'public.platform_integrations', 'update')
  and has_table_privilege('authenticated', 'public.platform_settings_activity', 'insert'),
  'authenticated tem privilégios SQL para admin operar via RLS'
);

select results_eq(
  $$
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename in ('platform_settings', 'platform_integrations', 'platform_settings_activity')
  $$,
  array[8],
  'configurações possuem policies de leitura/escrita explícitas'
);

select results_eq(
  $$ select count(*)::integer from public.platform_settings where key in ('general', 'security') $$,
  array[2],
  'settings gerais e segurança são semeados'
);

select results_eq(
  $$ select count(*)::integer from public.platform_integrations $$,
  array[5],
  'integrações padrão são semeadas'
);

select throws_ok(
  $$ insert into public.platform_settings (key, value) values ('plans', '{}'::jsonb) $$,
  '23514',
  null,
  'platform_settings aceita apenas chaves aprovadas'
);

select throws_ok(
  $$ insert into public.platform_integrations (integration_key, name, category, status, config) values ('bad', 'Bad', 'Teste', 'trial', '{}'::jsonb) $$,
  '23514',
  null,
  'platform_integrations restringe status'
);

select * from finish();

rollback;
