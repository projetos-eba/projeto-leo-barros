begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select ok(
  to_regprocedure('public.partner_clients_list()') is not null,
  'partner_clients_list existe'
);

select ok(
  has_function_privilege('authenticated', 'public.partner_clients_list()', 'execute'),
  'authenticated pode executar a RPC segura de clientes do parceiro'
);

select is(
  (
    select position('cpf' in lower(pg_get_function_result('public.partner_clients_list()'::regprocedure)))
  ),
  0,
  'RPC nao expoe CPF'
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
    'aa100000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'partner-clients-a@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aa100000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'partner-clients-b@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aa100000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'client-a@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aa100000-0000-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'client-b@example.invalid',
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
  phone,
  display_name,
  role,
  status
)
values
  (
    'aa100000-0000-4000-8000-000000000101',
    'aa100000-0000-4000-8000-000000000001',
    'partner-clients-a@example.invalid',
    '+5511999000001',
    'Parceiro Clientes A',
    'parceiro',
    'active'
  ),
  (
    'aa100000-0000-4000-8000-000000000102',
    'aa100000-0000-4000-8000-000000000002',
    'partner-clients-b@example.invalid',
    '+5511999000002',
    'Parceiro Clientes B',
    'parceiro',
    'active'
  ),
  (
    'aa100000-0000-4000-8000-000000000103',
    'aa100000-0000-4000-8000-000000000003',
    'client-a@example.invalid',
    '+5511999000003',
    'Cliente A',
    'cliente',
    'active'
  ),
  (
    'aa100000-0000-4000-8000-000000000104',
    'aa100000-0000-4000-8000-000000000004',
    'client-b@example.invalid',
    '+5511999000004',
    'Cliente B',
    'cliente',
    'active'
  );

insert into public.partners (
  id,
  profile_id,
  professional_name,
  professional_type
)
values
  (
    'aa100000-0000-4000-8000-000000000201',
    'aa100000-0000-4000-8000-000000000101',
    'Parceiro Clientes A',
    'personal_trainer'
  ),
  (
    'aa100000-0000-4000-8000-000000000202',
    'aa100000-0000-4000-8000-000000000102',
    'Parceiro Clientes B',
    'nutricionista'
  );

insert into public.patients (
  id,
  profile_id,
  cpf,
  birth_date,
  objective
)
values
  (
    'aa100000-0000-4000-8000-000000000301',
    'aa100000-0000-4000-8000-000000000103',
    '11111111111',
    current_date - interval '30 years',
    'Hipertrofia'
  ),
  (
    'aa100000-0000-4000-8000-000000000302',
    'aa100000-0000-4000-8000-000000000104',
    '22222222222',
    current_date - interval '25 years',
    'Emagrecimento'
  );

insert into public.partner_clients (
  partner_id,
  patient_id,
  service_scope,
  status,
  started_at
)
values
  (
    'aa100000-0000-4000-8000-000000000201',
    'aa100000-0000-4000-8000-000000000301',
    'treino',
    'active',
    now() - interval '20 days'
  ),
  (
    'aa100000-0000-4000-8000-000000000202',
    'aa100000-0000-4000-8000-000000000302',
    'dieta',
    'active',
    now() - interval '15 days'
  );

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'aa100000-0000-4000-8000-000000000001', true);

select results_eq(
  $$
    select display_name
    from public.partner_clients_list()
    order by display_name
  $$,
  array['Cliente A'],
  'Parceiro A ve somente cliente vinculado ao seu cadastro'
);

select results_eq(
  $$
    select email
    from public.partner_clients_list()
  $$,
  array['client-a@example.invalid'],
  'RPC retorna e-mail minimo do cliente vinculado'
);

select is(
  (
    select age_years
    from public.partner_clients_list()
    where display_name = 'Cliente A'
  ),
  30,
  'RPC retorna idade calculada, nao birth_date'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'aa100000-0000-4000-8000-000000000002', true);

select results_eq(
  $$
    select display_name
    from public.partner_clients_list()
    order by display_name
  $$,
  array['Cliente B'],
  'Parceiro B nao ve clientes de outro parceiro'
);

reset role;
select * from finish();

rollback;
