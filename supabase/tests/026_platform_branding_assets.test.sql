begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(8);

select is(
  (select public from storage.buckets where id = 'platform-assets'),
  true,
  'bucket de branding e publico para leitura de assets'
);

select is(
  (select file_size_limit from storage.buckets where id = 'platform-assets'),
  2097152::bigint,
  'bucket limita logo a 2 MB'
);

select ok(
  (select allowed_mime_types @> array['image/png', 'image/jpeg', 'image/webp']::text[] from storage.buckets where id = 'platform-assets'),
  'bucket aceita formatos de imagem aprovados'
);

select ok(
  has_table_privilege('anon', 'public.platform_settings', 'select'),
  'anon pode ler dados publicos de platform_settings via RLS'
);

select results_eq(
  $$
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename = 'platform_settings'
      and policyname = 'platform_settings_select_public_general'
  $$,
  array[1],
  'platform_settings possui policy publica apenas para general'
);

select results_eq(
  $$
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'platform_asset_storage_%'
  $$,
  array[4],
  'storage possui policies explicitas para assets de branding'
);

set local role anon;
select results_eq(
  $$ select count(*)::integer from public.platform_settings where key = 'general' $$,
  array[1],
  'anon le somente o registro general'
);

select results_eq(
  $$ select count(*)::integer from public.platform_settings where key = 'security' $$,
  array[0],
  'anon nao le security'
);

select * from finish();

rollback;
