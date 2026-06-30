begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_column(
  'public',
  'provisioning_operations',
  'resource_patient_id',
  'ledger referencia o Patient provisionado'
);

select has_index(
  'public',
  'provisioning_operations',
  'provisioning_operations_resource_patient_idx',
  'FK do Patient provisionado possui índice'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.provision_client_for_partner_records(uuid,uuid,text,uuid,text,text,text,text,date,text[],text)',
    'execute'
  ),
  'service_role pode executar a RPC de Cliente'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.provision_client_for_partner_records(uuid,uuid,text,uuid,text,text,text,text,date,text[],text)',
    'execute'
  ),
  'authenticated não executa diretamente a RPC de Cliente'
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
    'a1000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'client-rpc-partner-one@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a1000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'client-rpc-partner-two@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a1000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'client-rpc-target@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a1000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'client-rpc-other@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a1000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'client-rpc-admin@example.invalid',
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
    'a2000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'client-rpc-partner-one@example.invalid',
    '+5511911111111',
    'RPC Partner One',
    'parceiro',
    'active'
  ),
  (
    'a2000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000002',
    'client-rpc-partner-two@example.invalid',
    '+5511922222222',
    'RPC Partner Two',
    'parceiro',
    'active'
  ),
  (
    'a2000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000004',
    'client-rpc-other@example.invalid',
    '+5511944444444',
    'RPC Other Client',
    'cliente',
    'active'
  ),
  (
    'a2000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000005',
    'client-rpc-admin@example.invalid',
    '+5511955555555',
    'RPC Admin',
    'admin',
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
values
  (
    'a3000000-0000-0000-0000-000000000001',
    'a2000000-0000-0000-0000-000000000001',
    'RPC Partner One',
    'nutricionista',
    'crn',
    'rpc-001'
  ),
  (
    'a3000000-0000-0000-0000-000000000002',
    'a2000000-0000-0000-0000-000000000002',
    'RPC Partner Two',
    'personal_trainer',
    'cref',
    'rpc-002'
  );

insert into public.patients (
  id,
  profile_id,
  cpf,
  birth_date
)
values (
  'a4000000-0000-0000-0000-000000000004',
  'a2000000-0000-0000-0000-000000000004',
  '44444444444',
  '1990-04-04'
);

select lives_ok(
  $$
    select *
    from public.provision_client_for_partner_records(
      'a2000000-0000-0000-0000-000000000001',
      'a5000000-0000-4000-8000-000000000001',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'a1000000-0000-0000-0000-000000000003',
      'client-rpc-target@example.invalid',
      '+5511933333333',
      'RPC Target Client',
      '33333333333',
      '1993-03-03',
      array['treino', 'dieta'],
      'pending_delivery'
    )
  $$,
  'RPC cria Cliente, Patient e múltiplos escopos atomicamente'
);

select is(
  (
    select role || '|' || status || '|' || phone
    from public.profiles
    where user_id = 'a1000000-0000-0000-0000-000000000003'
  ),
  'cliente|active|+5511933333333',
  'Cliente provisionado nasce active com telefone canônico'
);

select is(
  (
    select cpf || '|' || birth_date::text
    from public.patients
    where profile_id = (
      select id
      from public.profiles
      where user_id = 'a1000000-0000-0000-0000-000000000003'
    )
  ),
  '33333333333|1993-03-03',
  'Patient persiste CPF e data de nascimento'
);

select is(
  (
    select array_agg(service_scope order by service_scope)::text
    from public.partner_clients
    where partner_id = 'a3000000-0000-0000-0000-000000000001'
      and patient_id = (
        select id
        from public.patients
        where profile_id = (
          select id
          from public.profiles
          where user_id = 'a1000000-0000-0000-0000-000000000003'
        )
      )
  ),
  '{dieta,treino}',
  'dois vínculos ativos são criados para os escopos solicitados'
);

set local role service_role;

select is(
  (
    select result_status
    from public.provision_client_for_partner_records(
      'a2000000-0000-0000-0000-000000000001',
      'a5000000-0000-4000-8000-000000000001',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'a1000000-0000-0000-0000-000000000003',
      'client-rpc-target@example.invalid',
      '+5511933333333',
      'RPC Target Client',
      '33333333333',
      '1993-03-03',
      array['dieta', 'treino'],
      'pending_delivery'
    )
  ),
  'existing',
  'service_role repete a operação de forma idempotente'
);

reset role;

select throws_ok(
  $$
    select *
    from public.provision_client_for_partner_records(
      'a2000000-0000-0000-0000-000000000001',
      'a5000000-0000-4000-8000-000000000001',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      'a1000000-0000-0000-0000-000000000003',
      'client-rpc-target@example.invalid',
      '+5511933333333',
      'RPC Target Client',
      '33333333333',
      '1993-03-03',
      array['dieta', 'treino'],
      'pending_delivery'
    )
  $$,
  'P0001',
  'PROVISION_CLIENT_FOR_PARTNER_IDEMPOTENCY_KEY_REUSED',
  'mesma chave com outro payload é rejeitada'
);

select throws_ok(
  $$
    select *
    from public.provision_client_for_partner_records(
      'a2000000-0000-0000-0000-000000000005',
      'a5000000-0000-4000-8000-000000000002',
      'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      'a1000000-0000-0000-0000-000000000003',
      'client-rpc-target@example.invalid',
      '+5511933333333',
      'RPC Target Client',
      '33333333333',
      '1993-03-03',
      array['dieta'],
      'not_resent'
    )
  $$,
  'P0001',
  'PROVISION_CLIENT_FOR_PARTNER_FORBIDDEN',
  'Admin não pode chamar a RPC de provisionamento de Cliente'
);

select throws_ok(
  $$
    select *
    from public.provision_client_for_partner_records(
      'a2000000-0000-0000-0000-000000000001',
      'a5000000-0000-4000-8000-000000000003',
      'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
      'a1000000-0000-0000-0000-000000000003',
      'client-rpc-target@example.invalid',
      '+5511933333333',
      'RPC Target Client',
      '33333333333',
      '1993-03-03',
      array['dieta', 'dieta'],
      'not_resent'
    )
  $$,
  'P0001',
  'PROVISION_CLIENT_FOR_PARTNER_INVALID_PAYLOAD',
  'escopos duplicados são rejeitados'
);

insert into public.partner_clients (
  partner_id,
  patient_id,
  service_scope,
  status
)
values (
  'a3000000-0000-0000-0000-000000000002',
  (
    select id
    from public.patients
    where profile_id = (
      select id
      from public.profiles
      where user_id = 'a1000000-0000-0000-0000-000000000003'
    )
  ),
  'saude',
  'active'
);

select throws_ok(
  $$
    select *
    from public.provision_client_for_partner_records(
      'a2000000-0000-0000-0000-000000000001',
      'a5000000-0000-4000-8000-000000000004',
      'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      'a1000000-0000-0000-0000-000000000003',
      'client-rpc-target@example.invalid',
      '+5511933333333',
      'RPC Target Client',
      '33333333333',
      '1993-03-03',
      array['saude'],
      'not_resent'
    )
  $$,
  'P0001',
  'PROVISION_CLIENT_FOR_PARTNER_SCOPE_CONFLICT',
  'escopo ativo de outro Parceiro é rejeitado'
);

select throws_ok(
  $$
    select *
    from public.provision_client_for_partner_records(
      'a2000000-0000-0000-0000-000000000001',
      'a5000000-0000-4000-8000-000000000005',
      'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      'a1000000-0000-0000-0000-000000000003',
      'client-rpc-target@example.invalid',
      '+5511933333333',
      'RPC Target Client',
      '44444444444',
      '1993-03-03',
      array['cardio'],
      'not_resent'
    )
  $$,
  'P0001',
  'PROVISION_CLIENT_FOR_PARTNER_CPF_CONFLICT',
  'CPF associado a outro Cliente é rejeitado'
);

select is(
  (
    select count(*)::integer
    from public.provisioning_operations
    where operation_type = 'provision_client_for_partner'
      and status = 'completed'
      and idempotency_key = 'a5000000-0000-4000-8000-000000000001'
  ),
  1,
  'somente a operação concluída permanece no ledger durante a transação'
);

select * from finish();
rollback;
