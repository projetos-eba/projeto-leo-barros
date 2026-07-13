begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_function(
  'public',
  'admin_create_user_record',
  array['uuid', 'uuid', 'text', 'text', 'text', 'text'],
  'RPC de criacao de Admin existe'
);

select has_function(
  'public',
  'admin_update_user_record',
  array['uuid', 'uuid', 'text', 'text'],
  'RPC de atualizacao de Admin existe'
);

select has_function(
  'public',
  'admin_delete_user_record',
  array['uuid', 'uuid'],
  'RPC de exclusao logica de Admin existe'
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
  ('00000000-0000-0000-0000-000000000000', 'ad000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'admin-crud-actor@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ad000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'admin-crud-target@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ad000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'admin-crud-new@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into public.profiles (
  id,
  user_id,
  email,
  display_name,
  role,
  status
)
values
  ('ad100000-0000-4000-8000-000000000001', 'ad000000-0000-4000-8000-000000000001', 'admin-crud-actor@example.invalid', 'Admin Actor', 'admin', 'active'),
  ('ad100000-0000-4000-8000-000000000002', 'ad000000-0000-4000-8000-000000000002', 'admin-crud-target@example.invalid', 'Admin Target', 'admin', 'active');

insert into public.admins (id, profile_id)
values
  ('ad200000-0000-4000-8000-000000000001', 'ad100000-0000-4000-8000-000000000001'),
  ('ad200000-0000-4000-8000-000000000002', 'ad100000-0000-4000-8000-000000000002');

update public.profiles
set status = 'disabled'
where role = 'admin'
  and id not in (
    'ad100000-0000-4000-8000-000000000001',
    'ad100000-0000-4000-8000-000000000002'
  );

select results_eq(
  $$ select public.admin_active_profile_count() $$,
  array[2],
  'fixture inicia com dois Admins ativos'
);

select lives_ok(
  $$ select * from public.admin_create_user_record(
    'ad100000-0000-4000-8000-000000000001',
    'ad000000-0000-4000-8000-000000000003',
    'admin-crud-new@example.invalid',
    'Admin New',
    'pending',
    'sent'
  ) $$,
  'RPC cria Admin pendente sem expor senha'
);

select results_eq(
  $$ select count(*)::integer from public.admins where profile_id = 'ad000000-0000-4000-8000-000000000003'::uuid $$,
  array[0],
  'extensao Admin nao usa auth user id como profile id'
);

select results_eq(
  $$ select count(*)::integer
     from public.profiles as profile
     join public.admins as admin on admin.profile_id = profile.id
     where profile.email = 'admin-crud-new@example.invalid'
       and profile.role = 'admin'
       and profile.status = 'pending' $$,
  array[1],
  'criacao grava profile e extensao Admin'
);

select lives_ok(
  $$ select * from public.admin_delete_user_record(
    'ad100000-0000-4000-8000-000000000001',
    'ad100000-0000-4000-8000-000000000002'
  ) $$,
  'exclusao logica e permitida quando ha outro Admin ativo'
);

select results_eq(
  $$ select status from public.profiles where id = 'ad100000-0000-4000-8000-000000000002' $$,
  array['disabled'],
  'exclusao logica marca status inativo'
);

select throws_ok(
  $$ update public.profiles set status = 'disabled' where id = 'ad100000-0000-4000-8000-000000000001' $$,
  'P0001',
  'LAST_ACTIVE_ADMIN',
  'trigger impede zerar Admin ativo mesmo fora da UI'
);

select throws_ok(
  $$ select * from public.admin_delete_user_record(
    'ad100000-0000-4000-8000-000000000001',
    'ad100000-0000-4000-8000-000000000001'
  ) $$,
  'P0001',
  'ADMIN_USERS_SELF_DELETE',
  'RPC bloqueia autoexclusao'
);

select results_eq(
  $$ select count(*)::integer
     from public.platform_settings_activity
     where action in ('admin_user_created', 'admin_user_deleted') $$,
  array[2],
  'auditoria registra criacao e exclusao logica'
);

select * from finish();

rollback;
