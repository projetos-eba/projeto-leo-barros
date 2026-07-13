begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

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
    '71000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'rls-admin@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '71000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'rls-partner@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '71000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'rls-client-linked@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '71000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'rls-client-suspended@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '71000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'rls-client-inactive@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '71000000-0000-0000-0000-000000000006',
    'authenticated',
    'authenticated',
    'rls-no-profile@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.profiles (id, user_id, email, display_name, role, status)
values
  (
    '72000000-0000-0000-0000-000000000001',
    '71000000-0000-0000-0000-000000000001',
    'rls-admin@example.invalid',
    'RLS Admin',
    'admin',
    'active'
  ),
  (
    '72000000-0000-0000-0000-000000000002',
    '71000000-0000-0000-0000-000000000002',
    'rls-partner@example.invalid',
    'RLS Partner',
    'parceiro',
    'active'
  ),
  (
    '72000000-0000-0000-0000-000000000003',
    '71000000-0000-0000-0000-000000000003',
    'rls-client-linked@example.invalid',
    'RLS Client Linked',
    'cliente',
    'active'
  ),
  (
    '72000000-0000-0000-0000-000000000004',
    '71000000-0000-0000-0000-000000000004',
    'rls-client-suspended@example.invalid',
    'RLS Client Suspended',
    'cliente',
    'active'
  ),
  (
    '72000000-0000-0000-0000-000000000005',
    '71000000-0000-0000-0000-000000000005',
    'rls-client-inactive@example.invalid',
    'RLS Client Inactive',
    'cliente',
    'suspended'
  );

insert into public.admins (id, profile_id)
values ('73000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000001');

insert into public.partners (id, profile_id, professional_name, professional_type)
values (
  '74000000-0000-0000-0000-000000000001',
  '72000000-0000-0000-0000-000000000002',
  'RLS Partner',
  'nutricionista'
);

insert into public.patients (id, profile_id)
values
  ('75000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000003'),
  ('75000000-0000-0000-0000-000000000002', '72000000-0000-0000-0000-000000000004'),
  ('75000000-0000-0000-0000-000000000003', '72000000-0000-0000-0000-000000000005');

insert into public.partner_clients (
  id,
  partner_id,
  patient_id,
  service_scope,
  status,
  ended_at
)
values
  (
    '76000000-0000-0000-0000-000000000001',
    '74000000-0000-0000-0000-000000000001',
    '75000000-0000-0000-0000-000000000001',
    'dieta',
    'active',
    null
  ),
  (
    '76000000-0000-0000-0000-000000000002',
    '74000000-0000-0000-0000-000000000001',
    '75000000-0000-0000-0000-000000000002',
    'treino',
    'suspended',
    null
  );

select ok(
  not has_table_privilege('anon', 'public.profiles', 'select'),
  'anon não possui SELECT em profiles'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'insert'),
  'authenticated não possui INSERT em profiles'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'update'),
  'authenticated não possui UPDATE em profiles'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'delete'),
  'authenticated não possui DELETE em profiles'
);
select ok(
  not has_table_privilege('anon', 'public.provisioning_operations', 'select'),
  'anon não possui SELECT no ledger de provisionamento'
);
select ok(
  not has_table_privilege('authenticated', 'public.provisioning_operations', 'select'),
  'authenticated não possui SELECT no ledger de provisionamento'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000005', true);

select is(
  (select count(*)::integer from public.profiles),
  1,
  'profile inativo lê somente o próprio profile'
);
select is(
  (select count(*)::integer from public.patients),
  0,
  'profile inativo não lê Patient'
);
select is(
  (select count(*)::integer from public.partner_clients),
  0,
  'profile inativo não lê vínculos'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000003', true);

select is(
  (select count(*)::integer from public.profiles),
  1,
  'Cliente ativo lê somente o próprio profile'
);
select is(
  (select count(*)::integer from public.patients),
  1,
  'Cliente ativo lê somente seu Patient'
);
select is(
  (select count(*)::integer from public.partner_clients),
  1,
  'Cliente ativo lê somente seus vínculos'
);
select is(
  (select count(*)::integer from public.partners),
  0,
  'Cliente não lê tabela Partners diretamente'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000002', true);

select is(
  (select count(*)::integer from public.partners),
  1,
  'Parceiro ativo lê somente seu Partner'
);
select is(
  (select count(*)::integer from public.partner_clients),
  2,
  'Parceiro ativo lê seus próprios vínculos, inclusive histórico não ativo'
);
select is(
  (select count(*)::integer from public.patients),
  1,
  'Parceiro ativo lê somente Cliente com vínculo active'
);
select is(
  (
    select count(*)::integer
    from public.patients
    where id = '75000000-0000-0000-0000-000000000002'
  ),
  0,
  'vínculo suspended não libera o Cliente'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000001', true);

select is(
  (
    select count(*)::integer
    from public.profiles
    where id between '72000000-0000-0000-0000-000000000001' and '72000000-0000-0000-0000-000000000005'
  ),
  5,
  'Super Admin lê todos os profiles do fixture RLS'
);
select is(
  (
    select count(*)::integer
    from public.admins
    where id = '73000000-0000-0000-0000-000000000001'
  ),
  1,
  'Super Admin lê todos os admins do fixture RLS'
);
select is(
  (
    select count(*)::integer
    from public.patients
    where id between '75000000-0000-0000-0000-000000000001' and '75000000-0000-0000-0000-000000000003'
  ),
  3,
  'Super Admin lê todos os patients do fixture RLS'
);
select is(
  (
    select count(*)::integer
    from public.partners
    where id = '74000000-0000-0000-0000-000000000001'
  ),
  1,
  'Super Admin lê todos os partners do fixture RLS'
);
select is(
  (
    select count(*)::integer
    from public.partner_clients
    where id between '76000000-0000-0000-0000-000000000001' and '76000000-0000-0000-0000-000000000002'
  ),
  2,
  'Super Admin lê todos os partner_clients do fixture RLS'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000006', true);

select is(
  (select count(*)::integer from public.profiles),
  0,
  'usuário sem profile não lê profiles'
);
select is(
  (select count(*)::integer from public.patients),
  0,
  'usuário sem profile não lê Patients'
);

reset role;
select * from finish();
rollback;
