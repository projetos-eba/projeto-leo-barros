-- Smoke local para telas de Parceiros.
-- Dados de sistema/fixtures ficam aqui; migrations continuam reservadas para estrutura.

do $$
declare
  target_email text := 'antonioferrari2002@gmail.com';
  target_password text := '123456';
  target_phone text := '+5511999920020';
  target_user_id uuid;
  target_profile_id uuid;
  target_partner_id uuid;
  platform_plan_id uuid;
begin
  select id
  into target_user_id
  from auth.users
  where lower(email) = lower(target_email)
  order by created_at nulls last
  limit 1;

  if target_user_id is null then
    target_user_id := 'a1000000-0000-4000-8000-000000000001';

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      phone,
      phone_change,
      phone_change_token,
      email_change_token_current,
      reauthentication_token,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      target_user_id,
      'authenticated',
      'authenticated',
      target_email,
      crypt(target_password, gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      null,
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now()
    );
  else
    update auth.users
    set
      encrypted_password = crypt(target_password, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      aud = 'authenticated',
      role = 'authenticated',
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      updated_at = now()
    where id = target_user_id;
  end if;

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    target_user_id::text,
    target_user_id,
    jsonb_build_object(
      'sub', target_user_id::text,
      'email', target_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  )
  on conflict (provider_id, provider)
  do update set
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    updated_at = now();

  select id
  into target_profile_id
  from public.profiles
  where lower(email) = lower(target_email)
     or user_id = target_user_id
  order by created_at nulls last
  limit 1;

  if target_profile_id is null then
    target_profile_id := 'a1000000-0000-4000-8000-000000000101';

    insert into public.profiles (
      id,
      user_id,
      email,
      phone,
      display_name,
      role,
      status,
      created_at,
      updated_at
    )
    values (
      target_profile_id,
      target_user_id,
      target_email,
      target_phone,
      'Antonio Ferrari',
      'parceiro',
      'active',
      now() - interval '8 months',
      now()
    );
  else
    update public.profiles
    set
      user_id = target_user_id,
      email = target_email,
      phone = target_phone,
      display_name = 'Antonio Ferrari',
      role = 'parceiro',
      status = 'active',
      updated_at = now()
    where id = target_profile_id;
  end if;

  select id
  into target_partner_id
  from public.partners
  where profile_id = target_profile_id;

  if target_partner_id is null then
    target_partner_id := 'a1000000-0000-4000-8000-000000000201';

    insert into public.partners (
      id,
      profile_id,
      professional_name,
      professional_type,
      created_at,
      updated_at
    )
    values (
      target_partner_id,
      target_profile_id,
      'Antonio Ferrari',
      'personal_trainer',
      now() - interval '8 months',
      now()
    );
  else
    update public.partners
    set
      professional_name = 'Antonio Ferrari',
      professional_type = 'personal_trainer',
      professional_registry_type = null,
      professional_registry_number = null,
      updated_at = now()
    where id = target_partner_id;
  end if;

  insert into public.billing_plans (
    id,
    slug,
    name,
    billing_interval,
    price_cents,
    currency,
    is_active
  )
  values (
    'a1000000-0000-4000-8000-000000000401',
    'local-partner-access',
    'Acesso Local Parceiro',
    'monthly',
    0,
    'brl',
    true
  )
  on conflict (slug)
  do update set
    name = excluded.name,
    billing_interval = excluded.billing_interval,
    price_cents = excluded.price_cents,
    currency = excluded.currency,
    is_active = true,
    updated_at = now()
  returning id into platform_plan_id;

  update public.partner_subscriptions
  set
    status = 'canceled',
    canceled_at = coalesce(canceled_at, now()),
    updated_at = now()
  where partner_id = target_partner_id
    and status in ('trialing', 'active', 'past_due', 'incomplete');

  insert into public.partner_subscriptions (
    id,
    partner_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    created_at,
    updated_at
  )
  values (
    'a1000000-0000-4000-8000-000000000501',
    target_partner_id,
    platform_plan_id,
    'active',
    now() - interval '20 days',
    now() + interval '1 year',
    false,
    now(),
    now()
  )
  on conflict (id)
  do update set
    partner_id = excluded.partner_id,
    plan_id = excluded.plan_id,
    status = 'active',
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = false,
    canceled_at = null,
    updated_at = now();

  delete from public.platform_activity_events
  where id between 'a1000000-0000-4000-8000-000000000901' and 'a1000000-0000-4000-8000-000000000906';

  delete from public.support_tickets
  where id in (
      'a1000000-0000-4000-8000-000000000801',
      'a1000000-0000-4000-8000-000000000802'
    )
    or ticket_number in ('SUP-SEED-001', 'SUP-SEED-002');

  delete from public.partner_documents
  where id in (
    'a1000000-0000-4000-8000-000000000811',
    'a1000000-0000-4000-8000-000000000812'
  );

  delete from public.partner_client_plan_modules
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.partner_client_tasks
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.partner_client_observations
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.partner_client_appointments
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.partner_calendar_blocks
  where partner_id = target_partner_id
    and id between 'b1000000-0000-4000-8000-000000000801' and 'b1000000-0000-4000-8000-000000000803';

  delete from public.partner_client_adherence_snapshots
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.partner_client_calorie_calculations
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.partner_client_assessment_circumferences
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.partner_client_assessment_skinfolds
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.partner_client_assessments
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.partner_client_body_measurements
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.partner_client_goals
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.partner_client_plan_subscriptions
  where partner_id = target_partner_id
    and (
      custom_plan_id between 'a1000000-0000-4000-8000-000000000601' and 'a1000000-0000-4000-8000-000000000603'
      or patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306'
    );

  delete from public.partner_material_events
  where partner_id = target_partner_id;

  delete from public.partner_material_shares
  where partner_id = target_partner_id;

  delete from public.partner_materials
  where partner_id = target_partner_id;

  delete from public.partner_client_diet_plans
  where partner_id = target_partner_id;

  delete from public.partner_workout_programs
  where partner_id = target_partner_id;

  delete from public.partner_protocol_events
  where partner_id = target_partner_id;

  delete from public.partner_protocol_use_drafts
  where partner_id = target_partner_id;

  delete from public.partner_protocol_foods
  where partner_id = target_partner_id;

  delete from public.partner_protocol_exercises
  where partner_id = target_partner_id;

  delete from public.partner_clients
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.partner_custom_plans
  where id between 'a1000000-0000-4000-8000-000000000601' and 'a1000000-0000-4000-8000-000000000603';

  delete from public.patients
  where id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.profiles
  where id between 'a1000000-0000-4000-8000-000000000701' and 'a1000000-0000-4000-8000-000000000706';

  delete from auth.identities
  where user_id between 'a1000000-0000-4000-8000-000000000701' and 'a1000000-0000-4000-8000-000000000706';

  delete from auth.users
  where id between 'a1000000-0000-4000-8000-000000000701' and 'a1000000-0000-4000-8000-000000000706';

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    phone,
    phone_change,
    phone_change_token,
    email_change_token_current,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  select
    '00000000-0000-0000-0000-000000000000'::uuid,
    user_id,
    'authenticated',
    'authenticated',
    email,
    '',
    now(),
    '',
    '',
    '',
    '',
    null,
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now() - interval '6 months',
    now()
  from (
    values
      ('a1000000-0000-4000-8000-000000000701'::uuid, 'cliente.seed.01@example.invalid'),
      ('a1000000-0000-4000-8000-000000000702'::uuid, 'cliente.seed.02@example.invalid'),
      ('a1000000-0000-4000-8000-000000000703'::uuid, 'cliente.seed.03@example.invalid'),
      ('a1000000-0000-4000-8000-000000000704'::uuid, 'cliente.seed.04@example.invalid'),
      ('a1000000-0000-4000-8000-000000000705'::uuid, 'cliente.seed.05@example.invalid'),
      ('a1000000-0000-4000-8000-000000000706'::uuid, 'cliente.seed.06@example.invalid')
  ) as seed_users(user_id, email);

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  select
    id::text,
    id,
    jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true, 'phone_verified', false),
    'email',
    now(),
    now(),
    now()
  from auth.users
  where id between 'a1000000-0000-4000-8000-000000000701' and 'a1000000-0000-4000-8000-000000000706';

  insert into public.profiles (
    id,
    user_id,
    email,
    phone,
    display_name,
    role,
    status,
    created_at,
    updated_at
  )
  values
    ('a1000000-0000-4000-8000-000000000701', 'a1000000-0000-4000-8000-000000000701', 'cliente.seed.01@example.invalid', '+5511988800011', 'Ana Ribeiro', 'cliente', 'active', now() - interval '6 months', now() - interval '2 days'),
    ('a1000000-0000-4000-8000-000000000702', 'a1000000-0000-4000-8000-000000000702', 'cliente.seed.02@example.invalid', '+5511988800012', 'Bruno Carvalho', 'cliente', 'active', now() - interval '5 months', now() - interval '5 days'),
    ('a1000000-0000-4000-8000-000000000703', 'a1000000-0000-4000-8000-000000000703', 'cliente.seed.03@example.invalid', '+5511988800013', 'Camila Souza', 'cliente', 'active', now() - interval '4 months', now() - interval '10 days'),
    ('a1000000-0000-4000-8000-000000000704', 'a1000000-0000-4000-8000-000000000704', 'cliente.seed.04@example.invalid', '+5511988800014', 'Daniel Rocha', 'cliente', 'active', now() - interval '3 months', now() - interval '35 days'),
    ('a1000000-0000-4000-8000-000000000705', 'a1000000-0000-4000-8000-000000000705', 'cliente.seed.05@example.invalid', '+5511988800015', 'Elisa Martins', 'cliente', 'active', now() - interval '2 months', now() - interval '1 day'),
    ('a1000000-0000-4000-8000-000000000706', 'a1000000-0000-4000-8000-000000000706', 'cliente.seed.06@example.invalid', '+5511988800016', 'Felipe Torres', 'cliente', 'active', now() - interval '1 month', now() - interval '45 days');

  insert into public.patients (
    id,
    profile_id,
    cpf,
    phone,
    birth_date,
    objective,
    gender,
    avatar_url,
    created_at,
    updated_at
  )
  values
    ('a1000000-0000-4000-8000-000000000301', 'a1000000-0000-4000-8000-000000000701', '90000000001', '+5511988800011', current_date - interval '29 years', 'Hipertrofia', 'female', '/avatars/ana-ribeiro-seed.png', now() - interval '6 months', now() - interval '2 days'),
    ('a1000000-0000-4000-8000-000000000302', 'a1000000-0000-4000-8000-000000000702', '90000000002', '+5511988800012', current_date - interval '34 years', 'Emagrecimento', 'male', null, now() - interval '5 months', now() - interval '5 days'),
    ('a1000000-0000-4000-8000-000000000303', 'a1000000-0000-4000-8000-000000000703', '90000000003', '+5511988800013', current_date - interval '41 years', 'Força e mobilidade', 'female', null, now() - interval '4 months', now() - interval '10 days'),
    ('a1000000-0000-4000-8000-000000000304', 'a1000000-0000-4000-8000-000000000704', '90000000004', '+5511988800014', current_date - interval '26 years', 'Performance', 'male', null, now() - interval '3 months', now() - interval '35 days'),
    ('a1000000-0000-4000-8000-000000000305', 'a1000000-0000-4000-8000-000000000705', '90000000005', '+5511988800015', current_date - interval '38 years', 'Condicionamento', 'female', null, now() - interval '2 months', now() - interval '1 day'),
    ('a1000000-0000-4000-8000-000000000306', 'a1000000-0000-4000-8000-000000000706', '90000000006', '+5511988800016', current_date - interval '32 years', 'Retorno gradual', 'male', null, now() - interval '1 month', now() - interval '45 days');

  insert into public.partner_clients (
    partner_id,
    patient_id,
    service_scope,
    status,
    started_at,
    ended_at,
    created_at,
    updated_at
  )
  values
    (target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'treino', 'active', now() - interval '6 months', null, now() - interval '6 months', now() - interval '2 days'),
    (target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'dieta', 'active', now() - interval '6 months', null, now() - interval '6 months', now() - interval '2 days'),
    (target_partner_id, 'a1000000-0000-4000-8000-000000000302', 'treino', 'active', now() - interval '5 months', null, now() - interval '5 months', now() - interval '5 days'),
    (target_partner_id, 'a1000000-0000-4000-8000-000000000303', 'treino', 'active', now() - interval '4 months', null, now() - interval '4 months', now() - interval '10 days'),
    (target_partner_id, 'a1000000-0000-4000-8000-000000000304', 'dieta', 'active', now() - interval '3 months', null, now() - interval '3 months', now() - interval '35 days'),
    (target_partner_id, 'a1000000-0000-4000-8000-000000000305', 'treino', 'active', now() - interval '2 months', null, now() - interval '2 months', now() - interval '1 day'),
    (target_partner_id, 'a1000000-0000-4000-8000-000000000306', 'treino', 'disabled', now() - interval '6 months', now() - interval '1 month', now() - interval '6 months', now() - interval '1 month');

  insert into public.partner_custom_plans (
    id,
    partner_id,
    name,
    description,
    billing_interval,
    price_cents,
    currency,
    is_active,
    created_at,
    updated_at
  )
  values
    ('a1000000-0000-4000-8000-000000000601', target_partner_id, 'Performance Mensal', 'Treino com acompanhamento mensal.', 'monthly', 39990, 'brl', true, now() - interval '6 months', now()),
    ('a1000000-0000-4000-8000-000000000602', target_partner_id, 'Nutri Fit', 'Plano integrado de dieta e treino.', 'monthly', 49990, 'brl', true, now() - interval '5 months', now()),
    ('a1000000-0000-4000-8000-000000000603', target_partner_id, 'Ciclo Premium', 'Ciclo trimestral de performance.', 'quarterly', 119970, 'brl', true, now() - interval '4 months', now());

  insert into public.partner_client_plan_subscriptions (
    id,
    partner_id,
    patient_id,
    custom_plan_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    canceled_at,
    created_at,
    updated_at
  )
  values
    ('a1000000-0000-4000-8000-000000000701', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'a1000000-0000-4000-8000-000000000602', 'active', now() - interval '20 days', now() + interval '8 days', false, null, now() - interval '6 months', now()),
    ('a1000000-0000-4000-8000-000000000702', target_partner_id, 'a1000000-0000-4000-8000-000000000302', 'a1000000-0000-4000-8000-000000000601', 'active', now() - interval '12 days', now() + interval '18 days', false, null, now() - interval '5 months', now()),
    ('a1000000-0000-4000-8000-000000000703', target_partner_id, 'a1000000-0000-4000-8000-000000000303', 'a1000000-0000-4000-8000-000000000603', 'active', now() - interval '15 days', now() + interval '40 days', false, null, now() - interval '4 months', now()),
    ('a1000000-0000-4000-8000-000000000704', target_partner_id, 'a1000000-0000-4000-8000-000000000304', 'a1000000-0000-4000-8000-000000000601', 'active', now() - interval '35 days', now() - interval '4 days', false, null, now() - interval '3 months', now()),
    ('a1000000-0000-4000-8000-000000000705', target_partner_id, 'a1000000-0000-4000-8000-000000000305', 'a1000000-0000-4000-8000-000000000602', 'pending', now() - interval '2 days', now() + interval '28 days', false, null, now() - interval '2 days', now()),
    ('a1000000-0000-4000-8000-000000000706', target_partner_id, 'a1000000-0000-4000-8000-000000000306', 'a1000000-0000-4000-8000-000000000601', 'canceled', now() - interval '70 days', now() - interval '35 days', true, now() - interval '35 days', now() - interval '6 months', now() - interval '35 days');

  insert into public.partner_client_goals (
    id,
    partner_id,
    patient_id,
    target_weight_kg,
    target_body_fat_min_pct,
    target_body_fat_max_pct,
    adherence_target_pct
  )
  values (
    'b1000000-0000-4000-8000-000000000001',
    target_partner_id,
    'a1000000-0000-4000-8000-000000000301',
    80,
    12,
    15,
    80
  );

  insert into public.partner_client_body_measurements (
    id,
    partner_id,
    patient_id,
    measured_at,
    weight_kg,
    body_fat_percentage
  )
  values
    ('b1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('day', now() - interval '5 months'), 74.8, 18.6),
    ('b1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('day', now() - interval '4 months'), 75.4, 17.9),
    ('b1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('day', now() - interval '3 months'), 76.1, 17.1),
    ('b1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('day', now() - interval '2 months'), 76.9, 16.2),
    ('b1000000-0000-4000-8000-000000000105', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('day', now() - interval '1 month'), 77.2, 15.8),
    ('b1000000-0000-4000-8000-000000000106', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('day', now()), 78.4, 14.7);

  insert into public.partner_client_assessments (
    id,
    partner_id,
    patient_id,
    assessed_at,
    title,
    height_cm,
    weight_kg,
    body_fat_percentage,
    muscle_mass_kg,
    activity_level,
    assessment_method,
    target_weight_kg,
    target_days,
    notes
  )
  values
    ('c1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('day', now() - interval '90 days') + interval '10 hours', 'Avaliação inicial', 174, 76.1, 17.1, 60.4, 'moderate', 'pollock_7', 80, 120, 'Início do acompanhamento integrado.'),
    ('c1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('day', now() - interval '60 days') + interval '10 hours', 'Reavaliação mensal', 174, 76.9, 16.2, 61.2, 'moderate', 'pollock_7', 80, 90, 'Boa resposta ao treino de força.'),
    ('c1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('day', now() - interval '30 days') + interval '10 hours', 'Reavaliação de composição', 174, 77.2, 15.8, 61.6, 'moderate', 'pollock_7', 80, 75, 'Ajustar carboidratos nos dias de treino.'),
    ('c1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('day', now() - interval '5 days') + interval '10 hours', 'Avaliação corporal completa', 174, 78.4, 14.7, 62.1, 'moderate', 'pollock_7', 80, 90, 'Evolução positiva de massa magra e redução de gordura.');

  insert into public.partner_client_assessment_circumferences (
    assessment_id,
    partner_id,
    patient_id,
    metric_key,
    value_cm
  )
  values
    ('c1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'chest', 91.2),
    ('c1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'waist', 76.4),
    ('c1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'abdomen', 82.1),
    ('c1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'hip', 101.5),
    ('c1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'right_thigh', 58.6),
    ('c1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'right_calf', 36.2),
    ('c1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'chest', 92.5),
    ('c1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'waist', 75.1),
    ('c1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'abdomen', 80.4),
    ('c1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'hip', 101.1),
    ('c1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'right_thigh', 59.1),
    ('c1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'right_calf', 36.8),
    ('c1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'chest', 93.0),
    ('c1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'waist', 74.2),
    ('c1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'abdomen', 79.5),
    ('c1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'hip', 100.6),
    ('c1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'right_thigh', 59.7),
    ('c1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'right_calf', 37.0),
    ('c1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'chest', 94.4),
    ('c1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'waist', 73.1),
    ('c1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'abdomen', 78.2),
    ('c1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'hip', 100.1),
    ('c1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'right_thigh', 60.4),
    ('c1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'right_calf', 37.4);

  insert into public.partner_client_assessment_skinfolds (
    assessment_id,
    partner_id,
    patient_id,
    metric_key,
    value_mm
  )
  values
    ('c1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'pectoral', 12.0),
    ('c1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'abdominal', 18.0),
    ('c1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'triceps', 14.0),
    ('c1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'subscapular', 13.0),
    ('c1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'axillary', 10.0),
    ('c1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'suprailiac', 11.0),
    ('c1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'thigh', 20.0),
    ('c1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'medial_calf', 13.0),
    ('c1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'pectoral', 11.2),
    ('c1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'abdominal', 16.5),
    ('c1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'triceps', 13.1),
    ('c1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'subscapular', 12.4),
    ('c1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'axillary', 9.5),
    ('c1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'suprailiac', 10.0),
    ('c1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'thigh', 18.4),
    ('c1000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'medial_calf', 12.2),
    ('c1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'pectoral', 10.6),
    ('c1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'abdominal', 15.8),
    ('c1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'triceps', 12.5),
    ('c1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'subscapular', 11.8),
    ('c1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'axillary', 9.0),
    ('c1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'suprailiac', 9.4),
    ('c1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'thigh', 17.2),
    ('c1000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'medial_calf', 11.6),
    ('c1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'pectoral', 9.8),
    ('c1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'abdominal', 14.7),
    ('c1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'triceps', 11.9),
    ('c1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'subscapular', 11.0),
    ('c1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'axillary', 8.5),
    ('c1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'suprailiac', 8.8),
    ('c1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'thigh', 16.0),
    ('c1000000-0000-4000-8000-000000000104', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'medial_calf', 10.8);

  insert into public.partner_client_calorie_calculations (
    id,
    partner_id,
    patient_id,
    assessment_id,
    formula,
    activity_factor,
    bmr_kcal,
    tdee_kcal,
    target_kcal,
    daily_energy_delta_kcal,
    weekly_energy_delta_kcal,
    target_weight_kg,
    target_days,
    projected_weight_delta_kg,
    status,
    inputs
  )
  values (
    'c1000000-0000-4000-8000-000000000501',
    target_partner_id,
    'a1000000-0000-4000-8000-000000000301',
    'c1000000-0000-4000-8000-000000000104',
    'mifflin',
    1.55,
    1566,
    2427,
    2564,
    137,
    959,
    80,
    90,
    1.6,
    'applied',
    '{"source":"seed","heightCm":174,"weightKg":78.4,"bodyFatPercentage":14.7,"activityLevel":"moderate"}'::jsonb
  );

  insert into public.partner_client_adherence_snapshots (
    id,
    partner_id,
    patient_id,
    period_start,
    period_end,
    diet_percentage,
    training_percentage
  )
  values
    ('b1000000-0000-4000-8000-000000000201', target_partner_id, 'a1000000-0000-4000-8000-000000000301', current_date - 27, current_date - 21, 70, 72),
    ('b1000000-0000-4000-8000-000000000202', target_partner_id, 'a1000000-0000-4000-8000-000000000301', current_date - 20, current_date - 14, 66, 78),
    ('b1000000-0000-4000-8000-000000000203', target_partner_id, 'a1000000-0000-4000-8000-000000000301', current_date - 13, current_date - 7, 61, 80),
    ('b1000000-0000-4000-8000-000000000204', target_partner_id, 'a1000000-0000-4000-8000-000000000301', current_date - 6, current_date, 58, 86);

  insert into public.partner_client_appointments (
    id,
    partner_id,
    patient_id,
    title,
    starts_at,
    ends_at,
    status,
    appointment_type,
    modality,
    location_text,
    reminder_minutes,
    notes
  )
  values
    ('b1000000-0000-4000-8000-000000000301', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'Consulta de acompanhamento', date_trunc('day', now()) + interval '5 days 10 hours 30 minutes', date_trunc('day', now()) + interval '5 days 11 hours 30 minutes', 'scheduled', 'consulta', 'online', null, 30, 'Revisar evolução e adesão.'),
    ('b1000000-0000-4000-8000-000000000302', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'Avaliação mensal', now() - interval '25 days', now() - interval '24 days 23 hours', 'completed', 'avaliacao', 'presencial', 'Clínica Salvador - Sala 02', 60, 'Avaliação concluída.'),
    ('b1000000-0000-4000-8000-000000000303', target_partner_id, 'a1000000-0000-4000-8000-000000000302', 'Consulta presencial', date_trunc('day', now()) + interval '9 hours', date_trunc('day', now()) + interval '10 hours', 'scheduled', 'consulta', 'presencial', 'Clínica Salvador - Sala 02', 30, 'Ajuste de rotina e acompanhamento.'),
    ('b1000000-0000-4000-8000-000000000304', target_partner_id, 'a1000000-0000-4000-8000-000000000303', 'Avaliação de evolução', date_trunc('day', now()) + interval '10 hours 30 minutes', date_trunc('day', now()) + interval '11 hours 30 minutes', 'pending', 'avaliacao', 'online', null, 15, 'Validar medidas e percepção de esforço.'),
    ('b1000000-0000-4000-8000-000000000305', target_partner_id, 'a1000000-0000-4000-8000-000000000304', 'Retorno de performance', date_trunc('day', now()) + interval '14 hours', date_trunc('day', now()) + interval '15 hours', 'pending', 'retorno', 'online', null, 30, 'Reavaliar progressão de treino.'),
    ('b1000000-0000-4000-8000-000000000306', target_partner_id, 'a1000000-0000-4000-8000-000000000305', 'Consulta clínica', date_trunc('day', now()) + interval '16 hours', date_trunc('day', now()) + interval '17 hours', 'scheduled', 'consulta', 'online', null, 30, 'Acompanhar adesão semanal.'),
    ('b1000000-0000-4000-8000-000000000307', target_partner_id, 'a1000000-0000-4000-8000-000000000302', 'Reunião de alinhamento', date_trunc('day', now()) + interval '2 days 8 hours', date_trunc('day', now()) + interval '2 days 9 hours', 'scheduled', 'reuniao', 'online', null, 30, 'Alinhar próximos passos.'),
    ('b1000000-0000-4000-8000-000000000308', target_partner_id, 'a1000000-0000-4000-8000-000000000303', 'Retorno nutricional', date_trunc('day', now()) + interval '3 days 11 hours', date_trunc('day', now()) + interval '3 days 12 hours', 'scheduled', 'retorno', 'presencial', 'Clínica Salvador - Sala 03', 60, 'Checar tolerância ao plano.'),
    ('b1000000-0000-4000-8000-000000000309', target_partner_id, 'a1000000-0000-4000-8000-000000000304', 'Consulta online', date_trunc('day', now()) + interval '7 days 14 hours', date_trunc('day', now()) + interval '7 days 15 hours', 'scheduled', 'consulta', 'online', null, 30, 'Consulta recorrente.'),
    ('b1000000-0000-4000-8000-000000000310', target_partner_id, 'a1000000-0000-4000-8000-000000000305', 'Avaliação técnica', date_trunc('day', now()) + interval '11 days 9 hours 30 minutes', date_trunc('day', now()) + interval '11 days 10 hours 30 minutes', 'scheduled', 'avaliacao', 'presencial', 'Clínica Salvador - Sala 01', 30, 'Avaliação de composição e rotina.');

  insert into public.partner_calendar_blocks (
    id,
    partner_id,
    title,
    starts_at,
    ends_at,
    reason,
    status
  )
  values
    ('b1000000-0000-4000-8000-000000000801', target_partner_id, 'Intervalo para almoço', date_trunc('day', now()) + interval '12 hours', date_trunc('day', now()) + interval '13 hours', 'Pausa fixa da agenda', 'active'),
    ('b1000000-0000-4000-8000-000000000802', target_partner_id, 'Horário administrativo', date_trunc('day', now()) + interval '1 day 17 hours', date_trunc('day', now()) + interval '1 day 18 hours', 'Organização de planos e materiais', 'active'),
    ('b1000000-0000-4000-8000-000000000803', target_partner_id, 'Bloqueio de agenda', date_trunc('day', now()) + interval '6 days 8 hours', date_trunc('day', now()) + interval '6 days 10 hours', 'Indisponibilidade do parceiro', 'active');

  insert into public.partner_materials (
    id,
    partner_id,
    title,
    description,
    category,
    material_kind,
    file_type,
    original_filename,
    mime_type,
    size_bytes,
    storage_path,
    cover_storage_path,
    tags,
    status,
    is_favorite,
    created_at,
    updated_at
  )
  values
    (
      'c1000000-0000-4000-8000-000000000101',
      target_partner_id,
      'Plano Alimentar Low Carb - 7 Dias',
      'Roteiro educativo de sete dias com orientações gerais e sugestões de refeições low carb.',
      'nutricao',
      'file',
      'pdf',
      'dieta_low_carb_7_dias.pdf',
      'application/pdf',
      7309,
      target_partner_id::text || '/c1000000-0000-4000-8000-000000000101/dieta_low_carb_7_dias.pdf',
      target_partner_id::text || '/c1000000-0000-4000-8000-000000000101/dieta_low_carb_7_dias-cover.png',
      array['low carb', 'emagrecimento', 'alimentação', 'educativo'],
      'active',
      false,
      now() - interval '12 days',
      now() - interval '2 days'
    ),
    (
      'c1000000-0000-4000-8000-000000000102',
      target_partner_id,
      'Plano de Treino ABC',
      'Roteiro educativo de musculação dividido em três dias, com exercícios, séries e intervalos sugeridos.',
      'treino',
      'file',
      'pdf',
      'treino_abc.pdf',
      'application/pdf',
      6267,
      target_partner_id::text || '/c1000000-0000-4000-8000-000000000102/treino_abc.pdf',
      target_partner_id::text || '/c1000000-0000-4000-8000-000000000102/treino_abc-cover.png',
      array['treino abc', 'hipertrofia', 'musculação', 'educativo'],
      'active',
      true,
      now() - interval '8 days',
      now() - interval '1 day'
    );

  insert into public.partner_material_shares (
    id,
    partner_id,
    material_id,
    patient_id,
    message,
    status,
    shared_at,
    revoked_at,
    created_at,
    updated_at
  )
  values (
    'c1000000-0000-4000-8000-000000000201',
    target_partner_id,
    'c1000000-0000-4000-8000-000000000101',
    'a1000000-0000-4000-8000-000000000301',
    'Use este guia como apoio até nossa próxima consulta.',
    'linked',
    now() - interval '2 days',
    null,
    now() - interval '2 days',
    now() - interval '2 days'
  );

  insert into public.partner_material_events (
    id,
    partner_id,
    material_id,
    patient_id,
    event_type,
    details,
    occurred_at
  )
  values
    ('c1000000-0000-4000-8000-000000000301', target_partner_id, 'c1000000-0000-4000-8000-000000000101', null, 'created', '{"fixture": true}'::jsonb, now() - interval '12 days'),
    ('c1000000-0000-4000-8000-000000000302', target_partner_id, 'c1000000-0000-4000-8000-000000000101', 'a1000000-0000-4000-8000-000000000301', 'shared', '{"fixture": true}'::jsonb, now() - interval '2 days'),
    ('c1000000-0000-4000-8000-000000000303', target_partner_id, 'c1000000-0000-4000-8000-000000000102', null, 'created', '{"fixture": true}'::jsonb, now() - interval '8 days'),
    ('c1000000-0000-4000-8000-000000000304', target_partner_id, 'c1000000-0000-4000-8000-000000000102', null, 'favorited', '{"fixture": true}'::jsonb, now() - interval '1 day');

  insert into public.partner_protocol_foods (
    id,
    partner_id,
    name,
    category,
    source,
    serving_size,
    serving_unit,
    household_measure,
    kcal,
    carbs_g,
    protein_g,
    fat_g,
    fiber_g,
    sodium_mg,
    notes,
    tags,
    suggested_uses,
    usage_count,
    status,
    created_at,
    updated_at
  )
  values
    ('d1000000-0000-4000-8000-000000000101', target_partner_id, 'Arroz branco cozido', 'cereal', 'taco', 100, 'g', '4 colheres de sopa', 130, 28.1, 2.5, 0.2, 1.6, 1, 'Base de carboidrato simples para refeições principais.', array['carboidrato', 'almoço'], array['refeicao_principal'], 42, 'active', now() - interval '60 days', now() - interval '5 days'),
    ('d1000000-0000-4000-8000-000000000102', target_partner_id, 'Peito de frango grelhado', 'carne', 'taco', 100, 'g', '1 filé médio', 165, 0, 31, 3.6, 0, 74, 'Proteína magra de fácil composição em dietas.', array['proteína', 'hipertrofia'], array['refeicao_principal', 'pos_treino'], 96, 'active', now() - interval '58 days', now() - interval '3 days'),
    ('d1000000-0000-4000-8000-000000000103', target_partner_id, 'Aveia em flocos', 'cereal', 'custom', 30, 'g', '3 colheres de sopa', 118, 20, 4.3, 2.2, 3, 1, 'Boa opção para café da manhã e lanches.', array['fibra', 'lanche'], array['pre_treino', 'lanche'], 38, 'active', now() - interval '45 days', now() - interval '7 days'),
    ('d1000000-0000-4000-8000-000000000104', target_partner_id, 'Whey protein concentrado', 'suplemento', 'custom', 30, 'g', '1 scoop', 120, 3, 24, 1.5, 0, 60, 'Ajustar conforme tolerância e rotina do Cliente.', array['suplemento', 'proteína'], array['pos_treino'], 107, 'active', now() - interval '44 days', now() - interval '2 days'),
    ('d1000000-0000-4000-8000-000000000105', target_partner_id, 'Azeite de oliva extra virgem', 'gordura', 'tbca', 13, 'ml', '1 colher de sopa', 108, 0, 0, 12, 0, 0, null, array['gordura boa'], array['refeicao_principal'], 35, 'active', now() - interval '40 days', now() - interval '6 days'),
    ('d1000000-0000-4000-8000-000000000106', target_partner_id, 'Maçã fuji com casca', 'fruta', 'taco', 130, 'g', '1 unidade média', 73, 19, 0.4, 0.2, 2.7, 1, null, array['fruta', 'lanche'], array['lanche'], 29, 'active', now() - interval '39 days', now() - interval '8 days'),
    ('d1000000-0000-4000-8000-000000000107', target_partner_id, 'Alimento importado sem categoria', 'outros', 'imported', 100, 'g', null, 90, 15, 4, 1, 2, 20, 'Fixture para pendência de categoria.', array['importado'], array['outro'], 2, 'active', now() - interval '1 day', now() - interval '1 day');

  insert into public.partner_protocol_exercises (
    id,
    partner_id,
    name,
    muscle_group,
    secondary_muscle_groups,
    equipment,
    level,
    objective,
    default_sets,
    default_reps,
    rest_seconds,
    cadence,
    video_url,
    thumbnail_url,
    instructions,
    tags,
    variations,
    usage_count,
    status,
    created_at,
    updated_at
  )
  values
    ('d1000000-0000-4000-8000-000000000201', target_partner_id, 'Agachamento livre', 'pernas', array['gluteos', 'core'], 'barra', 'intermediario', 'forca', 4, '8-12', 90, '2-0-2-0', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', null, 'Manter tronco firme, joelhos alinhados e amplitude controlada.', array['base', 'lower'], array['Agachamento goblet', 'Leg press'], 42, 'active', now() - interval '50 days', now() - interval '4 days'),
    ('d1000000-0000-4000-8000-000000000202', target_partner_id, 'Supino reto', 'peito', array['triceps', 'ombros'], 'barra', 'intermediario', 'hipertrofia', 4, '8-12', 90, '2-1-2-0', 'https://vimeo.com/76979871', null, 'Escápulas encaixadas e trajetória controlada da barra.', array['peito', 'push'], array['Supino inclinado', 'Supino com halteres'], 40, 'active', now() - interval '49 days', now() - interval '4 days'),
    ('d1000000-0000-4000-8000-000000000203', target_partner_id, 'Remada curvada', 'costas', array['biceps', 'core'], 'barra', 'intermediario', 'hipertrofia', 4, '8-12', 90, null, null, null, 'Evitar roubo excessivo e puxar cotovelos para trás.', array['costas', 'pull'], array['Remada baixa'], 35, 'active', now() - interval '48 days', now() - interval '5 days'),
    ('d1000000-0000-4000-8000-000000000204', target_partner_id, 'Prancha', 'core', array[]::text[], 'peso_corporal', 'iniciante', 'resistencia', 3, '30-60s', 60, null, null, null, 'Manter quadril neutro e respiração constante.', array['core'], array['Prancha lateral'], 28, 'active', now() - interval '42 days', now() - interval '9 days'),
    ('d1000000-0000-4000-8000-000000000205', target_partner_id, 'Desenvolvimento com halteres', 'ombros', array['triceps'], 'halteres', 'intermediario', 'hipertrofia', 4, '8-12', 90, null, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', null, 'Subir sem perder alinhamento lombar.', array['ombros', 'push'], array['Desenvolvimento militar'], 33, 'active', now() - interval '36 days', now() - interval '6 days'),
    ('d1000000-0000-4000-8000-000000000206', target_partner_id, 'Elevação pélvica', 'gluteos', array['pernas', 'core'], 'barra', 'intermediario', 'hipertrofia', 4, '10-15', 90, null, null, null, 'Pausar no topo e controlar descida.', array['glúteos'], array['Hip thrust máquina'], 31, 'active', now() - interval '30 days', now() - interval '10 days');

  insert into public.partner_workout_programs (
    id, partner_id, patient_id, program_kind, title, status, version, notes, published_at, created_at, updated_at
  )
  values
    ('e2000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'client', 'Hipertrofia Upper/Lower', 'published', 2, 'Priorizar técnica e amplitude. Manter RIR entre 1 e 2.', now() - interval '2 days', now() - interval '30 days', now() - interval '2 hours'),
    ('e2000000-0000-4000-8000-000000000102', target_partner_id, null, 'template', 'Template Hipertrofia 4x', 'draft', 1, 'Modelo reutilizável de hipertrofia.', null, now() - interval '20 days', now() - interval '5 days');

  insert into public.partner_workout_sessions (
    id, partner_id, program_id, title, objective, frequency_per_week, duration_minutes, sort_order
  )
  values
    ('e2000000-0000-4000-8000-000000000201', target_partner_id, 'e2000000-0000-4000-8000-000000000101', 'Treino A', 'hipertrofia', 2, 60, 0),
    ('e2000000-0000-4000-8000-000000000202', target_partner_id, 'e2000000-0000-4000-8000-000000000101', 'Treino B', 'hipertrofia', 2, 55, 1),
    ('e2000000-0000-4000-8000-000000000203', target_partner_id, 'e2000000-0000-4000-8000-000000000101', 'Treino C', 'forca', 1, 65, 2),
    ('e2000000-0000-4000-8000-000000000204', target_partner_id, 'e2000000-0000-4000-8000-000000000102', 'Treino A', 'hipertrofia', 2, 60, 0);

  insert into public.partner_workout_exercises (
    id, partner_id, session_id, exercise_id, rest_seconds, cadence, technique, notes,
    biset_group_id, biset_position, sort_order, snapshot_name, snapshot_muscle_group,
    snapshot_secondary_muscle_groups
  )
  values
    ('e2000000-0000-4000-8000-000000000301', target_partner_id, 'e2000000-0000-4000-8000-000000000201', 'd1000000-0000-4000-8000-000000000202', 90, '2-1-2-0', 'biset', 'Foco na amplitude.', 'e2000000-0000-4000-8000-000000000399', 1, 0, 'Supino reto', 'peito', array['triceps', 'ombros']),
    ('e2000000-0000-4000-8000-000000000302', target_partner_id, 'e2000000-0000-4000-8000-000000000201', 'd1000000-0000-4000-8000-000000000205', 90, null, 'biset', 'Controle na descida.', 'e2000000-0000-4000-8000-000000000399', 2, 1, 'Desenvolvimento com halteres', 'ombros', array['triceps']),
    ('e2000000-0000-4000-8000-000000000303', target_partner_id, 'e2000000-0000-4000-8000-000000000201', 'd1000000-0000-4000-8000-000000000203', 60, '2-0-2-1', 'normal', 'Contração máxima.', null, null, 2, 'Remada curvada', 'costas', array['biceps', 'core']),
    ('e2000000-0000-4000-8000-000000000304', target_partner_id, 'e2000000-0000-4000-8000-000000000202', 'd1000000-0000-4000-8000-000000000201', 90, '2-0-2-0', 'normal', null, null, null, 0, 'Agachamento livre', 'pernas', array['gluteos', 'core']);

  insert into public.partner_workout_sets (
    id, partner_id, prescribed_exercise_id, set_number, reps, load_kg, intensity
  )
  values
    ('e2000000-0000-4000-8000-000000000401', target_partner_id, 'e2000000-0000-4000-8000-000000000301', 1, 12, 40, 'warmup'),
    ('e2000000-0000-4000-8000-000000000402', target_partner_id, 'e2000000-0000-4000-8000-000000000301', 2, 10, 60, 'moderate'),
    ('e2000000-0000-4000-8000-000000000403', target_partner_id, 'e2000000-0000-4000-8000-000000000301', 3, 8, 70, 'maximum'),
    ('e2000000-0000-4000-8000-000000000404', target_partner_id, 'e2000000-0000-4000-8000-000000000302', 1, 12, 14, 'warmup'),
    ('e2000000-0000-4000-8000-000000000405', target_partner_id, 'e2000000-0000-4000-8000-000000000302', 2, 10, 18, 'moderate'),
    ('e2000000-0000-4000-8000-000000000406', target_partner_id, 'e2000000-0000-4000-8000-000000000303', 1, 15, 20, 'warmup'),
    ('e2000000-0000-4000-8000-000000000407', target_partner_id, 'e2000000-0000-4000-8000-000000000303', 2, 12, 25, 'moderate'),
    ('e2000000-0000-4000-8000-000000000408', target_partner_id, 'e2000000-0000-4000-8000-000000000304', 1, 10, 60, 'warmup'),
    ('e2000000-0000-4000-8000-000000000409', target_partner_id, 'e2000000-0000-4000-8000-000000000304', 2, 8, 90, 'maximum');

  insert into public.partner_workout_events (
    id, partner_id, patient_id, program_id, actor_name, event_type, detail, version, created_at
  )
  values
    ('e2000000-0000-4000-8000-000000000501', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000101', 'Dr. Leo', 'created', 'Criou o programa de treinos.', 1, now() - interval '30 days'),
    ('e2000000-0000-4000-8000-000000000502', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000101', 'Dr. Leo', 'updated', 'Combinou Supino reto e Desenvolvimento em Bi-set.', 2, now() - interval '3 days'),
    ('e2000000-0000-4000-8000-000000000503', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000101', 'Dr. Leo', 'published', 'Publicou o plano de treinos v2.', 2, now() - interval '2 days');

  insert into public.partner_protocol_use_drafts (
    id,
    partner_id,
    patient_id,
    item_type,
    food_id,
    exercise_id,
    plan_context,
    notes,
    status
  )
  values
    ('d1000000-0000-4000-8000-000000000301', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'food', 'd1000000-0000-4000-8000-000000000102', null, 'dieta', 'Usar como proteína principal no próximo ajuste.', 'open'),
    ('d1000000-0000-4000-8000-000000000302', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'exercise', null, 'd1000000-0000-4000-8000-000000000201', 'treino', 'Base do próximo ciclo de força.', 'open');

  insert into public.partner_protocol_events (
    id,
    partner_id,
    item_type,
    food_id,
    exercise_id,
    event_type,
    details,
    occurred_at
  )
  values
    ('d1000000-0000-4000-8000-000000000401', target_partner_id, 'food', 'd1000000-0000-4000-8000-000000000101', null, 'created', '{"fixture": true}'::jsonb, now() - interval '60 days'),
    ('d1000000-0000-4000-8000-000000000402', target_partner_id, 'food', 'd1000000-0000-4000-8000-000000000107', null, 'imported', '{"fixture": true}'::jsonb, now() - interval '1 day'),
    ('d1000000-0000-4000-8000-000000000403', target_partner_id, 'exercise', null, 'd1000000-0000-4000-8000-000000000201', 'created', '{"fixture": true}'::jsonb, now() - interval '50 days'),
    ('d1000000-0000-4000-8000-000000000404', target_partner_id, 'exercise', null, 'd1000000-0000-4000-8000-000000000203', 'created', '{"fixture": true}'::jsonb, now() - interval '48 days'),
    ('d1000000-0000-4000-8000-000000000405', target_partner_id, 'food', 'd1000000-0000-4000-8000-000000000102', null, 'used', '{"fixture": true}'::jsonb, now() - interval '2 days'),
    ('d1000000-0000-4000-8000-000000000406', target_partner_id, 'exercise', null, 'd1000000-0000-4000-8000-000000000201', 'used', '{"fixture": true}'::jsonb, now() - interval '2 days');



  insert into public.partner_client_diet_plans (
    id,
    partner_id,
    patient_id,
    title,
    status,
    target_kcal,
    target_protein_g,
    target_carbs_g,
    target_fat_g,
    water_liters,
    calorie_strategy,
    notes,
    version,
    published_at,
    sent_at,
    created_at,
    updated_at
  )
  values (
    'e1000000-0000-4000-8000-000000000101',
    target_partner_id,
    'a1000000-0000-4000-8000-000000000301',
    'Dieta de definição',
    'published',
    2450,
    190,
    240,
    70,
    3.0,
    'surplus',
    'Manter hidratação adequada ao longo do dia.
Priorizar alimentos in natura e minimamente processados.
Distribuir proteínas ao longo das refeições.
Pré e pós-treino: foco em carboidratos de rápida absorção.
Evitar ultraprocessados e altas fontes de açúcar.',
    2,
    now() - interval '8 days',
    null,
    now() - interval '12 days',
    now() - interval '2 days'
  );

  insert into public.partner_client_diet_meals (
    id,
    plan_id,
    partner_id,
    patient_id,
    day_of_week,
    title,
    meal_time,
    sort_order,
    created_at,
    updated_at
  )
  values
    ('e1000000-0000-4000-8000-000000000201', 'e1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 1, 'Café da manhã', '07:00', 0, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000202', 'e1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 1, 'Almoço', '12:30', 1, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000203', 'e1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 1, 'Lanche da tarde', '16:30', 2, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000204', 'e1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 1, 'Jantar', '19:30', 3, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000205', 'e1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 2, 'Café da manhã', '07:15', 0, now() - interval '12 days', now() - interval '2 days');

  insert into public.partner_client_diet_meal_items (
    id,
    plan_id,
    meal_id,
    partner_id,
    patient_id,
    food_id,
    quantity,
    quantity_unit,
    household_measure,
    snapshot_name,
    snapshot_serving_size,
    snapshot_serving_unit,
    snapshot_kcal,
    snapshot_carbs_g,
    snapshot_protein_g,
    snapshot_fat_g,
    snapshot_fiber_g,
    snapshot_sodium_mg,
    sort_order,
    created_at,
    updated_at
  )
  values
    ('e1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000201', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000103', 40, 'g', '3 colheres de sopa', 'Aveia em flocos', 30, 'g', 118, 20, 4.3, 2.2, 3, 1, 0, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000302', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000201', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000104', 30, 'g', '1 scoop', 'Whey protein concentrado', 30, 'g', 120, 3, 24, 1.5, 0, 60, 1, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000303', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000201', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000106', 130, 'g', '1 unidade média', 'Maçã fuji com casca', 130, 'g', 73, 19, 0.4, 0.2, 2.7, 1, 2, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000304', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000202', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000102', 150, 'g', '1 filé médio', 'Peito de frango grelhado', 100, 'g', 165, 0, 31, 3.6, 0, 74, 0, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000305', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000202', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000101', 150, 'g', '4 colheres de sopa', 'Arroz branco cozido', 100, 'g', 130, 28.1, 2.5, 0.2, 1.6, 1, 1, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000306', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000202', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000105', 13, 'ml', '1 colher de sopa', 'Azeite de oliva extra virgem', 13, 'ml', 108, 0, 0, 12, 0, 0, 2, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000307', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000203', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000104', 30, 'g', '1 scoop', 'Whey protein concentrado', 30, 'g', 120, 3, 24, 1.5, 0, 60, 0, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000308', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000204', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000102', 120, 'g', '1 filé médio', 'Peito de frango grelhado', 100, 'g', 165, 0, 31, 3.6, 0, 74, 0, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000309', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000204', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000101', 100, 'g', '4 colheres de sopa', 'Arroz branco cozido', 100, 'g', 130, 28.1, 2.5, 0.2, 1.6, 1, 1, now() - interval '12 days', now() - interval '2 days');

  insert into public.partner_client_diet_events (
    id,
    partner_id,
    patient_id,
    plan_id,
    event_type,
    actor_name,
    detail,
    version,
    details,
    created_at
  )
  values
    ('e1000000-0000-4000-8000-000000000401', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', 'created', 'Dr. Leonardo Barros', 'Dieta criada.', 1, '{"fixture": true}'::jsonb, now() - interval '12 days'),
    ('e1000000-0000-4000-8000-000000000402', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', 'updated', 'Dr. Leonardo Barros', 'Atualizou alimentos e macros do almoço.', 2, '{"fixture": true}'::jsonb, now() - interval '2 days');

  insert into public.partner_client_observations (
    id,
    partner_id,
    patient_id,
    observation_type,
    title,
    value_text,
    detail,
    severity,
    occurred_at
  )
  values
    ('b1000000-0000-4000-8000-000000000401', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'blood_pressure', 'PA (Pressão arterial)', '136 × 88', 'Média das últimas aferições levemente elevada.', 'attention', now() - interval '2 days'),
    ('b1000000-0000-4000-8000-000000000402', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'sleep', 'Sono', '6h 12m', 'Duração abaixo da meta semanal.', 'attention', now() - interval '3 days'),
    ('b1000000-0000-4000-8000-000000000403', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'exam', 'Exame de sangue', 'Sem alterações', 'Registro resumido; detalhes ficam na futura aba Exames.', 'normal', now() - interval '12 days');

  insert into public.partner_client_tasks (
    id,
    partner_id,
    patient_id,
    title,
    due_at,
    priority,
    status
  )
  values
    ('b1000000-0000-4000-8000-000000000501', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'Preencher diário alimentar', date_trunc('day', now()) + interval '23 hours 59 minutes', 'high', 'pending'),
    ('b1000000-0000-4000-8000-000000000502', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'Revisar exames pendentes', now() + interval '3 days', 'medium', 'pending'),
    ('b1000000-0000-4000-8000-000000000503', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'Confirmar consulta próxima', now() + interval '5 days', 'low', 'pending');

  insert into public.partner_client_plan_modules (
    id,
    partner_id,
    patient_id,
    subscription_id,
    module_type,
    title,
    primary_summary,
    secondary_summary
  )
  values
    ('b1000000-0000-4000-8000-000000000601', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'a1000000-0000-4000-8000-000000000701', 'dieta', 'Dieta', 'Hipercalórica controlada', '2.800 kcal/dia'),
    ('b1000000-0000-4000-8000-000000000602', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'a1000000-0000-4000-8000-000000000701', 'treino', 'Treino', 'Hipertrofia 5x/semana', 'Divisão Upper/Lower');

  insert into public.support_tickets (
    id,
    partner_id,
    opened_by_profile_id,
    ticket_number,
    subject,
    status,
    priority,
    sla_due_at,
    resolved_at,
    created_at,
    updated_at
  )
  values
    ('a1000000-0000-4000-8000-000000000801', target_partner_id, target_profile_id, 'SUP-SEED-001', 'Cliente com renovação atrasada', 'open', 'high', now() + interval '1 day', null, now() - interval '3 days', now()),
    ('a1000000-0000-4000-8000-000000000802', target_partner_id, target_profile_id, 'SUP-SEED-002', 'Ajuste de plano personalizado', 'in_progress', 'medium', now() + interval '3 days', null, now() - interval '1 day', now());

  insert into public.partner_documents (
    id,
    partner_id,
    document_type,
    status,
    title,
    due_at,
    reviewed_at,
    created_at,
    updated_at
  )
  values
    ('a1000000-0000-4000-8000-000000000811', target_partner_id, 'contract', 'pending', 'Contrato de prestação atualizado', now() + interval '5 days', null, now() - interval '8 days', now()),
    ('a1000000-0000-4000-8000-000000000812', target_partner_id, 'other', 'in_review', 'Termos do plano personalizado', now() + interval '12 days', null, now() - interval '4 days', now());

  insert into public.platform_activity_events (
    id,
    event_type,
    actor_profile_id,
    partner_id,
    patient_id,
    title,
    detail,
    metadata,
    created_at
  )
  values
    ('a1000000-0000-4000-8000-000000000901', 'subscription_started', target_profile_id, target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'Plano iniciado', 'Ana Ribeiro iniciou Nutri Fit.', '{}'::jsonb, now() - interval '2 hours'),
    ('a1000000-0000-4000-8000-000000000902', 'subscription_renewed', target_profile_id, target_partner_id, 'a1000000-0000-4000-8000-000000000302', 'Renovação confirmada', 'Bruno Carvalho renovou Performance Mensal.', '{}'::jsonb, now() - interval '1 day'),
    ('a1000000-0000-4000-8000-000000000903', 'payment_failed', target_profile_id, target_partner_id, 'a1000000-0000-4000-8000-000000000304', 'Pagamento pendente', 'Daniel Rocha passou da data de renovação.', '{}'::jsonb, now() - interval '3 days'),
    ('a1000000-0000-4000-8000-000000000904', 'ticket_opened', target_profile_id, target_partner_id, null, 'Ticket aberto', 'Suporte acompanha renovação atrasada.', '{}'::jsonb, now() - interval '4 days');
end $$;
