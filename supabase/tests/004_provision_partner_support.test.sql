begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_table(
  'public',
  'provisioning_operations',
  'ledger de provisionamento existe'
);

select has_column(
  'public',
  'profiles',
  'phone',
  'telefone canônico existe em profiles'
);

select has_index(
  'public',
  'provisioning_operations',
  'provisioning_operations_auth_user_idx',
  'FK de Auth user possui índice'
);

select has_index(
  'public',
  'provisioning_operations',
  'provisioning_operations_resource_profile_idx',
  'FK de profile provisionado possui índice'
);

select has_index(
  'public',
  'provisioning_operations',
  'provisioning_operations_resource_partner_idx',
  'FK de Partner provisionado possui índice'
);

select ok(
  has_table_privilege(
    'service_role',
    'public.provisioning_operations',
    'select'
  ),
  'service_role pode ler o ledger'
);

select ok(
  has_table_privilege('service_role', 'public.profiles', 'select')
  and has_table_privilege('service_role', 'public.profiles', 'insert')
  and has_table_privilege('service_role', 'public.partners', 'select')
  and has_table_privilege('service_role', 'public.partners', 'insert')
  and has_table_privilege('service_role', 'public.admins', 'select'),
  'service_role possui somente os acessos relacionais necessários ao provisionamento'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.provisioning_operations',
    'select'
  ),
  'authenticated não pode ler o ledger'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.provision_partner_records(uuid,uuid,text,uuid,text,text,text,text,text,text,text,text)',
    'execute'
  ),
  'service_role pode executar a RPC interna'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.provision_partner_records(uuid,uuid,text,uuid,text,text,text,text,text,text,text,text)',
    'execute'
  ),
  'authenticated não pode executar a RPC interna'
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
    '91000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'provision-admin@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '91000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'provision-partner@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '91000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'provision-client@example.invalid',
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
    '92000000-0000-0000-0000-000000000001',
    '91000000-0000-0000-0000-000000000001',
    'provision-admin@example.invalid',
    'Provision Admin',
    'admin',
    'active'
  ),
  (
    '92000000-0000-0000-0000-000000000003',
    '91000000-0000-0000-0000-000000000003',
    'provision-client@example.invalid',
    'Provision Client',
    'cliente',
    'active'
  );

insert into public.admins (
  id,
  profile_id
)
values (
  '93000000-0000-0000-0000-000000000001',
  '92000000-0000-0000-0000-000000000001'
);

select lives_ok(
  $$
    select *
    from public.provision_partner_records(
      '92000000-0000-0000-0000-000000000001',
      '94000000-0000-4000-8000-000000000001',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '91000000-0000-0000-0000-000000000002',
      'provision-partner@example.invalid',
      '+5511999999999',
      'Provision Partner',
      'Dr. Provision Partner',
      'medico',
      null,
      null,
      'pending_delivery'
    )
  $$,
  'RPC cria profile e Partner atomicamente sem exigir registro profissional'
);

set local role service_role;

select is(
  (
    select result_status
    from public.provision_partner_records(
      '92000000-0000-0000-0000-000000000001',
      '94000000-0000-4000-8000-000000000001',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '91000000-0000-0000-0000-000000000002',
      'provision-partner@example.invalid',
      '+5511999999999',
      'Provision Partner',
      'Dr. Provision Partner',
      'medico',
      null,
      null,
      'pending_delivery'
    )
  ),
  'existing',
  'service_role executa a RPC com os grants mínimos necessários'
);

reset role;

select is(
  (
    select role
    from public.profiles
    where user_id = '91000000-0000-0000-0000-000000000002'
  ),
  'parceiro',
  'profile provisionado usa role canônica parceiro'
);

select is(
  (
    select status
    from public.profiles
    where user_id = '91000000-0000-0000-0000-000000000002'
  ),
  'active',
  'Parceiro provisionado nasce active'
);

select is(
  (
    select phone
    from public.profiles
    where user_id = '91000000-0000-0000-0000-000000000002'
  ),
  '+5511999999999',
  'telefone canônico é persistido em profiles'
);

select is(
  (
    select professional_registry_type
    from public.partners
    where profile_id = (
      select id
      from public.profiles
      where user_id = '91000000-0000-0000-0000-000000000002'
    )
  ),
  null,
  'tipo de registro pode ficar vazio no MVP'
);

select throws_ok(
  $$
    select *
    from public.provision_partner_records(
      '92000000-0000-0000-0000-000000000001',
      '94000000-0000-4000-8000-000000000001',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      '91000000-0000-0000-0000-000000000002',
      'provision-partner@example.invalid',
      '+5511888888888',
      'Provision Partner',
      'Dr. Provision Partner',
      'medico',
      null,
      null,
      'pending_delivery'
    )
  $$,
  'P0001',
  'PROVISION_PARTNER_IDEMPOTENCY_KEY_REUSED',
  'mesma chave com payload diferente é rejeitada'
);

select throws_ok(
  $$
    select *
    from public.provision_partner_records(
      '92000000-0000-0000-0000-000000000001',
      '94000000-0000-4000-8000-000000000004',
      'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
      '91000000-0000-0000-0000-000000000002',
      'provision-partner@example.invalid',
      '+5511999999999',
      'Provision Partner',
      'Dr. Provision Partner',
      'medico',
      'crm',
      null,
      'pending_delivery'
    )
  $$,
  'P0001',
  'PROVISION_PARTNER_INVALID_PAYLOAD',
  'registro profissional parcial continua rejeitado'
);

select throws_ok(
  $$
    select *
    from public.provision_partner_records(
      '92000000-0000-0000-0000-000000000001',
      '94000000-0000-4000-8000-000000000002',
      'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      '91000000-0000-0000-0000-000000000003',
      'provision-client@example.invalid',
      '+5511777777777',
      'Provision Client',
      'Provision Client',
      'nutricionista',
      null,
      null,
      'not_resent'
    )
  $$,
  'P0001',
  'PROVISION_PARTNER_EMAIL_ROLE_CONFLICT',
  'e-mail associado a outro role é rejeitado'
);

select is(
  (
    select count(*)::integer
    from public.provisioning_operations
    where operation_type = 'provision_partner'
      and status = 'completed'
      and idempotency_key = '94000000-0000-4000-8000-000000000001'
  ),
  1,
  'ledger mantém uma operação concluída para o retry idempotente'
);

select * from finish();
rollback;
