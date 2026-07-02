begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select tables_are(
  'public',
  array[
    'admins',
    'billing_payments',
    'billing_plans',
    'partner_calendar_blocks',
    'partner_client_adherence_snapshots',
    'partner_client_assessment_circumferences',
    'partner_client_assessment_skinfolds',
    'partner_client_assessments',
    'partner_client_appointments',
    'partner_client_body_measurements',
    'partner_client_calorie_calculations',
    'partner_client_diet_events',
    'partner_client_diet_meal_items',
    'partner_client_diet_meals',
    'partner_client_diet_plans',
    'partner_client_goals',
    'partner_client_observations',
    'partner_clients',
    'partner_client_plan_subscriptions',
    'partner_client_plan_modules',
    'partner_client_tasks',
    'partner_custom_plans',
    'partner_documents',
    'partner_material_events',
    'partner_material_shares',
    'partner_materials',
    'partner_protocol_events',
    'partner_protocol_exercises',
    'partner_protocol_foods',
    'partner_protocol_use_drafts',
    'partner_subscriptions',
    'partner_workout_events',
    'partner_workout_exercises',
    'partner_workout_programs',
    'partner_workout_sessions',
    'partner_workout_sets',
    'partners',
    'patients',
    'platform_activity_events',
    'platform_integrations',
    'platform_settings',
    'platform_settings_activity',
    'profiles',
    'provisioning_operations',
    'support_tickets'
  ],
  'public contém a fundação limpa, o ledger de provisionamento e o domínio operacional aprovado'
);

select has_column('public', 'profiles', 'user_id', 'profiles.user_id existe');
select has_column('public', 'profiles', 'phone', 'profiles.phone existe');
select has_column('public', 'admins', 'profile_id', 'admins.profile_id existe');
select has_column('public', 'patients', 'profile_id', 'patients.profile_id existe');
select hasnt_column('public', 'patients', 'user_id', 'patients.user_id não existe');
select has_column('public', 'partners', 'professional_type', 'partners.professional_type existe');
select has_column('public', 'partner_clients', 'service_scope', 'partner_clients.service_scope existe');
select hasnt_column('public', 'partner_clients', 'is_primary', 'partner_clients.is_primary não existe');

select has_index('public', 'profiles', 'profiles_email_lower_key', 'e-mail normalizado possui índice unique');
select has_index('public', 'patients', 'patients_cpf_key', 'CPF possui índice unique parcial');
select has_index(
  'public',
  'partner_clients',
  'partner_clients_active_patient_scope_key',
  'Cliente e escopo ativo possuem unicidade'
);
select has_index(
  'public',
  'partner_clients',
  'partner_clients_open_relationship_key',
  'Parceiro, Cliente e escopo abertos possuem unicidade'
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
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin-1@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'admin-2@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'partner-1@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'partner-2@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'client-1@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000006',
    'authenticated',
    'authenticated',
    'client-2@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000007',
    'authenticated',
    'authenticated',
    'spare@example.invalid',
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
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'admin-1@example.invalid',
    'Admin One',
    'admin',
    'active'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'admin-2@example.invalid',
    'Admin Two',
    'admin',
    'active'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    'partner-1@example.invalid',
    'Partner One',
    'parceiro',
    'active'
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000004',
    'partner-2@example.invalid',
    'Partner Two',
    'parceiro',
    'active'
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000005',
    'client-1@example.invalid',
    'Client One',
    'cliente',
    'active'
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000006',
    'client-2@example.invalid',
    'Client Two',
    'cliente',
    'active'
  ),
  (
    '20000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000007',
    'spare@example.invalid',
    'Spare Profile',
    'cliente',
    'pending'
  );

insert into public.admins (id, profile_id)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002');

select is(
  (select count(*)::integer from public.admins),
  2,
  'múltiplos Admins são tecnicamente permitidos'
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
    '40000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000003',
    'Partner One',
    'medico',
    'crm',
    '12345'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000004',
    'Partner Two',
    'personal_trainer',
    null,
    null
  );

insert into public.patients (id, profile_id, cpf)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000005',
    '11111111111'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000006',
    '22222222222'
  );

select lives_ok(
  $$
    insert into public.partner_clients (
      id,
      partner_id,
      patient_id,
      service_scope,
      status
    )
    values
      (
        '60000000-0000-0000-0000-000000000001',
        '40000000-0000-0000-0000-000000000001',
        '50000000-0000-0000-0000-000000000001',
        'dieta',
        'active'
      ),
      (
        '60000000-0000-0000-0000-000000000002',
        '40000000-0000-0000-0000-000000000001',
        '50000000-0000-0000-0000-000000000001',
        'treino',
        'active'
      ),
      (
        '60000000-0000-0000-0000-000000000003',
        '40000000-0000-0000-0000-000000000001',
        '50000000-0000-0000-0000-000000000001',
        'saude',
        'active'
      ),
      (
        '60000000-0000-0000-0000-000000000004',
        '40000000-0000-0000-0000-000000000001',
        '50000000-0000-0000-0000-000000000001',
        'cardio',
        'active'
      )
  $$,
  'professional_type medico aceita todos os service_scope sem regra cruzada'
);

select throws_ok(
  $$
    insert into public.profiles (user_id, email, display_name, role, status)
    values (
      '10000000-0000-0000-0000-000000000007',
      'invalid-role@example.invalid',
      'Invalid Role',
      'gestor',
      'active'
    )
  $$,
  '23514',
  null,
  'role fora do vocabulário é rejeitado'
);

select throws_ok(
  $$
    insert into public.profiles (user_id, email, display_name, role, status)
    values (
      '10000000-0000-0000-0000-000000000007',
      'invalid-status@example.invalid',
      'Invalid Status',
      'cliente',
      'blocked'
    )
  $$,
  '23514',
  null,
  'status fora do vocabulário é rejeitado'
);

select throws_ok(
  $$
    insert into public.profiles (user_id, email, display_name, role, status)
    values (
      '10000000-0000-0000-0000-000000000001',
      'duplicate-user@example.invalid',
      'Duplicate User',
      'admin',
      'active'
    )
  $$,
  '23505',
  null,
  'profiles.user_id duplicado é rejeitado'
);

select throws_ok(
  $$
    insert into public.profiles (user_id, email, display_name, role, status)
    values (
      '10000000-0000-0000-0000-000000000007',
      'ADMIN-1@EXAMPLE.INVALID',
      'Duplicate Email',
      'cliente',
      'active'
    )
  $$,
  '23505',
  null,
  'e-mail duplicado ignorando caixa é rejeitado'
);

select throws_ok(
  $$
    update public.patients
    set cpf = '11111111111'
    where id = '50000000-0000-0000-0000-000000000002'
  $$,
  '23505',
  null,
  'CPF duplicado é rejeitado'
);

select throws_ok(
  $$
    update public.patients
    set cpf = '123'
    where id = '50000000-0000-0000-0000-000000000002'
  $$,
  '23514',
  null,
  'CPF fora de 11 dígitos é rejeitado'
);

select throws_ok(
  $$
    update public.partners
    set professional_type = 'fisioterapeuta'
    where id = '40000000-0000-0000-0000-000000000002'
  $$,
  '23514',
  null,
  'professional_type fora do vocabulário é rejeitado'
);

select throws_ok(
  $$
    update public.profiles
    set phone = '11999999999'
    where id = '20000000-0000-0000-0000-000000000003'
  $$,
  '23514',
  null,
  'telefone fora do formato E.164 é rejeitado'
);

select lives_ok(
  $$
    update public.profiles
    set phone = '+5511999999999'
    where id = '20000000-0000-0000-0000-000000000003'
  $$,
  'telefone E.164 é aceito'
);

select throws_ok(
  $$
    update public.partners
    set professional_registry_type = 'CRM'
    where id = '40000000-0000-0000-0000-000000000001'
  $$,
  '23514',
  null,
  'tipo de registro fora do vocabulário minúsculo é rejeitado'
);

select throws_ok(
  $$
    update public.partners
    set professional_registry_type = 'CREF',
        professional_registry_number = null
    where id = '40000000-0000-0000-0000-000000000002'
  $$,
  '23514',
  null,
  'registro profissional parcial é rejeitado'
);

select throws_ok(
  $$
    insert into public.partner_clients (
      partner_id,
      patient_id,
      service_scope,
      status
    )
    values (
      '40000000-0000-0000-0000-000000000002',
      '50000000-0000-0000-0000-000000000002',
      'fisioterapia',
      'active'
    )
  $$,
  '23514',
  null,
  'service_scope fora do vocabulário é rejeitado'
);

select throws_ok(
  $$
    insert into public.partner_clients (
      partner_id,
      patient_id,
      service_scope,
      status,
      ended_at
    )
    values (
      '40000000-0000-0000-0000-000000000002',
      '50000000-0000-0000-0000-000000000002',
      'dieta',
      'active',
      now()
    )
  $$,
  '23514',
  null,
  'vínculo não encerrado não aceita ended_at'
);

select throws_ok(
  $$
    insert into public.partner_clients (
      partner_id,
      patient_id,
      service_scope,
      status
    )
    values (
      '40000000-0000-0000-0000-000000000002',
      '50000000-0000-0000-0000-000000000001',
      'dieta',
      'active'
    )
  $$,
  '23505',
  null,
  'dois vínculos ativos no mesmo Cliente e escopo são rejeitados'
);

select throws_ok(
  $$
    insert into public.partner_clients (
      partner_id,
      patient_id,
      service_scope,
      status
    )
    values (
      '40000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000001',
      'dieta',
      'suspended'
    )
  $$,
  '23505',
  null,
  'duplicidade aberta da mesma combinação é rejeitada'
);

select throws_ok(
  $$
    insert into public.admins (profile_id)
    values ('20000000-0000-0000-0000-000000000007')
  $$,
  'P0001',
  null,
  'extensão Admin em profile Cliente é rejeitada'
);

select throws_ok(
  $$
    update public.profiles
    set role = 'parceiro'
    where id = '20000000-0000-0000-0000-000000000005'
  $$,
  'P0001',
  null,
  'mudança de role incompatível com Patient existente é rejeitada'
);

update public.profiles
set updated_at = '2000-01-01 00:00:00+00',
    display_name = 'Client One Updated'
where id = '20000000-0000-0000-0000-000000000005';

select ok(
  (
    select updated_at > '2000-01-01 00:00:00+00'::timestamptz
    from public.profiles
    where id = '20000000-0000-0000-0000-000000000005'
  ),
  'trigger atualiza updated_at'
);

select throws_ok(
  $$
    delete from public.profiles
    where id = '20000000-0000-0000-0000-000000000005'
  $$,
  '23503',
  null,
  'ON DELETE RESTRICT protege profile referenciado'
);

select * from finish();
rollback;
