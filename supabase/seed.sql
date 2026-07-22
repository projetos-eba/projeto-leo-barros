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
      email_confirmed_at,
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
      email_confirmed_at = coalesce(email_confirmed_at, now() - interval '8 months'),
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
    is_active,
    lookup_key,
    trial_days,
    sort_order,
    public_metadata
  )
  values (
    'a1000000-0000-4000-8000-000000000401',
    'local-partner-access',
    'Acesso Local Parceiro',
    'monthly',
    0,
    'brl',
    true,
    null,
    0,
    99,
    '{"fixture": true}'::jsonb
  )
  on conflict (slug)
  do update set
    name = excluded.name,
    billing_interval = excluded.billing_interval,
    price_cents = excluded.price_cents,
    currency = excluded.currency,
    lookup_key = excluded.lookup_key,
    trial_days = excluded.trial_days,
    sort_order = excluded.sort_order,
    public_metadata = excluded.public_metadata,
    is_active = true,
    updated_at = now()
  returning id into platform_plan_id;

  insert into public.billing_plans (
    id,
    slug,
    name,
    billing_interval,
    price_cents,
    currency,
    is_active,
    lookup_key,
    trial_days,
    sort_order,
    public_metadata
  )
  values
    (
      'a1000000-0000-4000-8000-000000000411',
      'complete-monthly',
      'Plano Completo - Nutricao + Treinamento',
      'monthly',
      11990,
      'brl',
      true,
      'complete_monthly_brl',
      7,
      10,
      '{"commercial": true}'::jsonb
    ),
    (
      'a1000000-0000-4000-8000-000000000412',
      'complete-annual',
      'Plano Completo - Nutricao + Treinamento',
      'yearly',
      119880,
      'brl',
      true,
      'complete_annual_brl',
      7,
      20,
      '{"commercial": true, "annual_charge_cents": 119880, "monthly_equivalent_cents": 9990}'::jsonb
    )
  on conflict (slug)
  do update set
    name = excluded.name,
    billing_interval = excluded.billing_interval,
    price_cents = excluded.price_cents,
    currency = excluded.currency,
    is_active = true,
    lookup_key = excluded.lookup_key,
    trial_days = excluded.trial_days,
    sort_order = excluded.sort_order,
    public_metadata = excluded.public_metadata,
    updated_at = now();

  insert into public.billing_plan_addons (
    id,
    slug,
    name,
    lookup_key,
    price_cents,
    currency,
    billing_interval,
    stripe_interval,
    usage_type,
    is_active
  )
  values (
    'a1000000-0000-4000-8000-000000000421',
    'active-client-monthly',
    'Cliente ativo adicional',
    'active_client_monthly_brl',
    199,
    'brl',
    'monthly',
    'month',
    'licensed',
    true
  )
  on conflict (slug)
  do update set
    name = excluded.name,
    lookup_key = excluded.lookup_key,
    price_cents = excluded.price_cents,
    currency = excluded.currency,
    billing_interval = excluded.billing_interval,
    stripe_interval = excluded.stripe_interval,
    usage_type = excluded.usage_type,
    is_active = true,
    updated_at = now();

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

  delete from public.client_health_events
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.client_health_action_logs
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.client_health_pressure_logs
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.client_health_medication_logs
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.client_health_medications
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.client_health_daily_logs
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

  delete from public.partner_client_photo_comparison_notes
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.partner_client_photo_events
  where partner_id = target_partner_id
    and patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306';

  delete from public.partner_client_photo_sessions
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

  delete from public.partner_client_cardio_plans
  where partner_id = target_partner_id;

  delete from public.partner_client_exam_collections
  where partner_id = target_partner_id;

  delete from public.partner_client_exam_events
  where partner_id = target_partner_id;

  delete from public.partner_exam_categories
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

  delete from public.partner_financial_events
  where partner_id = target_partner_id;

  delete from public.partner_form_responses
  where partner_id = target_partner_id;

  delete from public.partner_form_assignment_clients
  where partner_id = target_partner_id;

  delete from public.partner_form_assignments
  where partner_id = target_partner_id;

  delete from public.partner_form_templates
  where partner_id = target_partner_id;

  delete from public.partner_client_notes
  where partner_id = target_partner_id;

  delete from public.partner_client_receivables
  where partner_id = target_partner_id;

  delete from public.partner_client_plan_contracts
  where partner_id = target_partner_id;

  delete from public.partner_service_plans
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
    email_confirmed_at,
    created_at,
    updated_at
  )
  values
    ('a1000000-0000-4000-8000-000000000701', 'a1000000-0000-4000-8000-000000000701', 'cliente.seed.01@example.invalid', '+5511988800011', 'Ana Ribeiro', 'cliente', 'active', now() - interval '6 months', now() - interval '6 months', now() - interval '2 days'),
    ('a1000000-0000-4000-8000-000000000702', 'a1000000-0000-4000-8000-000000000702', 'cliente.seed.02@example.invalid', '+5511988800012', 'Bruno Carvalho', 'cliente', 'active', now() - interval '5 months', now() - interval '5 months', now() - interval '5 days'),
    ('a1000000-0000-4000-8000-000000000703', 'a1000000-0000-4000-8000-000000000703', 'cliente.seed.03@example.invalid', '+5511988800013', 'Camila Souza', 'cliente', 'active', now() - interval '4 months', now() - interval '4 months', now() - interval '10 days'),
    ('a1000000-0000-4000-8000-000000000704', 'a1000000-0000-4000-8000-000000000704', 'cliente.seed.04@example.invalid', '+5511988800014', 'Daniel Rocha', 'cliente', 'active', now() - interval '3 months', now() - interval '3 months', now() - interval '35 days'),
    ('a1000000-0000-4000-8000-000000000705', 'a1000000-0000-4000-8000-000000000705', 'cliente.seed.05@example.invalid', '+5511988800015', 'Elisa Martins', 'cliente', 'active', now() - interval '2 months', now() - interval '2 months', now() - interval '1 day'),
    ('a1000000-0000-4000-8000-000000000706', 'a1000000-0000-4000-8000-000000000706', 'cliente.seed.06@example.invalid', '+5511988800016', 'Felipe Torres', 'cliente', 'active', now() - interval '1 month', now() - interval '1 month', now() - interval '45 days');

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
    (target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'saude', 'active', now() - interval '6 months', null, now() - interval '6 months', now() - interval '2 days'),
    (target_partner_id, 'a1000000-0000-4000-8000-000000000302', 'treino', 'active', now() - interval '5 months', null, now() - interval '5 months', now() - interval '5 days'),
    (target_partner_id, 'a1000000-0000-4000-8000-000000000303', 'treino', 'active', now() - interval '4 months', null, now() - interval '4 months', now() - interval '10 days'),
    (target_partner_id, 'a1000000-0000-4000-8000-000000000304', 'dieta', 'active', now() - interval '3 months', null, now() - interval '3 months', now() - interval '35 days'),
    (target_partner_id, 'a1000000-0000-4000-8000-000000000305', 'treino', 'active', now() - interval '2 months', null, now() - interval '2 months', now() - interval '1 day'),
    (target_partner_id, 'a1000000-0000-4000-8000-000000000306', 'treino', 'disabled', now() - interval '6 months', now() - interval '1 month', now() - interval '6 months', now() - interval '1 month');

  update public.partner_subscriptions
  set
    active_client_quantity = public.billing_active_client_count(target_partner_id),
    last_quantity_synced_at = now(),
    updated_at = now()
  where id = 'a1000000-0000-4000-8000-000000000501';

  insert into public.partner_subscription_items (
    id,
    subscription_id,
    partner_id,
    item_kind,
    billing_plan_id,
    lookup_key,
    quantity,
    unit_amount_cents,
    currency,
    current_period_start,
    current_period_end
  )
  values (
    'a1000000-0000-4000-8000-000000000511',
    'a1000000-0000-4000-8000-000000000501',
    target_partner_id,
    'base_plan',
    platform_plan_id,
    'local_partner_access_fixture',
    1,
    0,
    'brl',
    now() - interval '20 days',
    now() + interval '1 year'
  )
  on conflict (subscription_id, item_kind)
  do update set
    partner_id = excluded.partner_id,
    billing_plan_id = excluded.billing_plan_id,
    lookup_key = excluded.lookup_key,
    quantity = excluded.quantity,
    unit_amount_cents = excluded.unit_amount_cents,
    updated_at = now();

  insert into public.billing_active_client_snapshots (
    id,
    partner_id,
    subscription_id,
    active_client_quantity,
    unit_amount_cents,
    amount_cents,
    reason,
    metadata
  )
  values (
    'a1000000-0000-4000-8000-000000000521',
    target_partner_id,
    'a1000000-0000-4000-8000-000000000501',
    public.billing_active_client_count(target_partner_id),
    199,
    public.billing_active_client_count(target_partner_id) * 199,
    'manual_reconcile',
    '{"fixture": true}'::jsonb
  )
  on conflict (id)
  do update set
    active_client_quantity = excluded.active_client_quantity,
    amount_cents = excluded.amount_cents,
    captured_at = now(),
    metadata = excluded.metadata;

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

  insert into public.partner_service_plans (
    id,
    partner_id,
    name,
    description,
    category,
    price_cents,
    billing_interval,
    duration_cycles,
    includes_diet,
    includes_training,
    status,
    created_at,
    updated_at
  )
  values
    ('a1000000-0000-4000-8000-000000000901', target_partner_id, 'Plano Performance', 'Foco em ganho de massa.', 'Hipertrofia', 36000, 'monthly', 3, true, true, 'active', now() - interval '4 months', now()),
    ('a1000000-0000-4000-8000-000000000902', target_partner_id, 'Plano Emagrecimento 360', 'Déficit calórico e hábitos.', 'Emagrecimento', 29000, 'monthly', 3, true, true, 'active', now() - interval '3 months', now()),
    ('a1000000-0000-4000-8000-000000000903', target_partner_id, 'Plano Manutenção', 'Manutenção de resultados.', 'Saúde', 22000, 'monthly', 1, true, false, 'archived', now() - interval '2 months', now());

  insert into public.partner_client_plan_contracts (
    id,
    partner_id,
    patient_id,
    service_plan_id,
    plan_name_snapshot,
    category_snapshot,
    price_cents_snapshot,
    billing_interval_snapshot,
    duration_cycles_snapshot,
    includes_diet_snapshot,
    includes_training_snapshot,
    start_date,
    first_due_date,
    status,
    notes
  )
  values
    ('a1000000-0000-4000-8000-000000000911', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'a1000000-0000-4000-8000-000000000901', 'Plano Performance', 'Hipertrofia', 36000, 'monthly', 3, true, true, current_date - 70, current_date - 40, 'active', 'Acompanhamento trimestral.'),
    ('a1000000-0000-4000-8000-000000000912', target_partner_id, 'a1000000-0000-4000-8000-000000000302', 'a1000000-0000-4000-8000-000000000902', 'Plano Emagrecimento 360', 'Emagrecimento', 29000, 'monthly', 3, true, true, current_date - 35, current_date - 5, 'active', 'Plano com revisão mensal.');

  insert into public.partner_client_receivables (
    id,
    partner_id,
    patient_id,
    contract_id,
    installment_number,
    amount_cents,
    due_date,
    status,
    paid_at,
    payment_method
  )
  values
    ('a1000000-0000-4000-8000-000000000921', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'a1000000-0000-4000-8000-000000000911', 1, 36000, current_date - 40, 'paid', now() - interval '39 days', 'pix_external'),
    ('a1000000-0000-4000-8000-000000000922', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'a1000000-0000-4000-8000-000000000911', 2, 36000, current_date - 10, 'paid', now() - interval '9 days', 'bank_transfer'),
    ('a1000000-0000-4000-8000-000000000923', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'a1000000-0000-4000-8000-000000000911', 3, 36000, current_date + 20, 'pending', null, null),
    ('a1000000-0000-4000-8000-000000000924', target_partner_id, 'a1000000-0000-4000-8000-000000000302', 'a1000000-0000-4000-8000-000000000912', 1, 29000, current_date - 5, 'pending', null, null),
    ('a1000000-0000-4000-8000-000000000925', target_partner_id, 'a1000000-0000-4000-8000-000000000302', 'a1000000-0000-4000-8000-000000000912', 2, 29000, current_date + 25, 'pending', null, null);

  insert into public.partner_client_notes (
    id,
    partner_id,
    patient_id,
    note_type,
    title,
    body,
    created_at
  )
  values
    ('a1000000-0000-4000-8000-000000000931', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'anamnesis', 'Consulta inicial', 'Cliente relata boa adesao nos dias uteis e maior dificuldade aos fins de semana.', now() - interval '10 days'),
    ('a1000000-0000-4000-8000-000000000932', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'prescription', 'Ajuste nutricional', 'Manter distribuicao de proteinas e revisar carboidratos no jantar.', now() - interval '4 days');

  insert into public.partner_form_templates (
    id,
    partner_id,
    title,
    description,
    questions,
    status
  )
  values (
    'a1000000-0000-4000-8000-000000000941',
    target_partner_id,
    'Check-in semanal',
    'Responda antes da proxima consulta.',
    '[{"id":"energia","label":"Como esteve sua energia nesta semana?","type":"long_text"},{"id":"dificuldade","label":"Qual foi a maior dificuldade?","type":"long_text"},{"id":"aderencia","label":"O que funcionou melhor no plano?","type":"long_text"}]'::jsonb,
    'active'
  );

  insert into public.partner_form_assignments (
    id,
    partner_id,
    template_id,
    title_snapshot,
    description_snapshot,
    questions_snapshot,
    status,
    sent_at
  )
  values (
    'a1000000-0000-4000-8000-000000000942',
    target_partner_id,
    'a1000000-0000-4000-8000-000000000941',
    'Check-in semanal',
    'Responda antes da proxima consulta.',
    '[{"id":"energia","label":"Como esteve sua energia nesta semana?","type":"long_text"},{"id":"dificuldade","label":"Qual foi a maior dificuldade?","type":"long_text"},{"id":"aderencia","label":"O que funcionou melhor no plano?","type":"long_text"}]'::jsonb,
    'sent',
    now() - interval '2 days'
  );

  insert into public.partner_form_assignment_clients (
    id,
    assignment_id,
    partner_id,
    patient_id,
    status,
    created_at
  )
  values
    ('a1000000-0000-4000-8000-000000000943', 'a1000000-0000-4000-8000-000000000942', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'sent', now() - interval '2 days'),
    ('a1000000-0000-4000-8000-000000000944', 'a1000000-0000-4000-8000-000000000942', target_partner_id, 'a1000000-0000-4000-8000-000000000302', 'sent', now() - interval '2 days');

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

  insert into public.partner_client_photo_sessions (
    id,
    partner_id,
    patient_id,
    captured_at,
    title,
    status,
    notes,
    created_at,
    updated_at
  )
  values
    (
      'f4000000-0000-4000-8000-000000000101',
      target_partner_id,
      'a1000000-0000-4000-8000-000000000301',
      date_trunc('day', now() - interval '90 days') + interval '9 hours 47 minutes',
      '6ª sessão',
      'complete',
      'Registro inicial para comparação de evolução corporal.',
      now() - interval '90 days',
      now() - interval '90 days'
    ),
    (
      'f4000000-0000-4000-8000-000000000102',
      target_partner_id,
      'a1000000-0000-4000-8000-000000000301',
      date_trunc('day', now() - interval '5 days') + interval '11 hours 34 minutes',
      '8ª sessão',
      'complete',
      'Boa evolução visual de definição e postura.',
      now() - interval '5 days',
      now() - interval '5 days'
    );

  insert into public.partner_client_photo_items (
    id,
    session_id,
    partner_id,
    patient_id,
    angle,
    storage_path,
    original_filename,
    mime_type,
    size_bytes,
    width_px,
    height_px,
    created_at,
    updated_at
  )
  values
    ('f4000000-0000-4000-8000-000000000201', 'f4000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'front', target_partner_id::text || '/a1000000-0000-4000-8000-000000000301/f4000000-0000-4000-8000-000000000101/frente-1.png', 'Frente 1.png', 'image/png', 1200000, 1086, 1448, now() - interval '90 days', now() - interval '90 days'),
    ('f4000000-0000-4000-8000-000000000202', 'f4000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'back', target_partner_id::text || '/a1000000-0000-4000-8000-000000000301/f4000000-0000-4000-8000-000000000101/costas-1.png', 'Costas 1.png', 'image/png', 1200000, 1086, 1448, now() - interval '90 days', now() - interval '90 days'),
    ('f4000000-0000-4000-8000-000000000203', 'f4000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'left', target_partner_id::text || '/a1000000-0000-4000-8000-000000000301/f4000000-0000-4000-8000-000000000101/esquerdo-1.png', 'Esquerdo 1.png', 'image/png', 1200000, 1086, 1448, now() - interval '90 days', now() - interval '90 days'),
    ('f4000000-0000-4000-8000-000000000204', 'f4000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'right', target_partner_id::text || '/a1000000-0000-4000-8000-000000000301/f4000000-0000-4000-8000-000000000101/direito-1.png', 'Direito 1.png', 'image/png', 1200000, 1086, 1448, now() - interval '90 days', now() - interval '90 days'),
    ('f4000000-0000-4000-8000-000000000205', 'f4000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'front', target_partner_id::text || '/a1000000-0000-4000-8000-000000000301/f4000000-0000-4000-8000-000000000102/frente-2.png', 'Frente 2.png', 'image/png', 1200000, 1086, 1448, now() - interval '5 days', now() - interval '5 days'),
    ('f4000000-0000-4000-8000-000000000206', 'f4000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'back', target_partner_id::text || '/a1000000-0000-4000-8000-000000000301/f4000000-0000-4000-8000-000000000102/costas-2.png', 'Costas 2.png', 'image/png', 1200000, 1086, 1448, now() - interval '5 days', now() - interval '5 days'),
    ('f4000000-0000-4000-8000-000000000207', 'f4000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'left', target_partner_id::text || '/a1000000-0000-4000-8000-000000000301/f4000000-0000-4000-8000-000000000102/esquerdo-2.png', 'Esquerdo 2.png', 'image/png', 1200000, 1086, 1448, now() - interval '5 days', now() - interval '5 days'),
    ('f4000000-0000-4000-8000-000000000208', 'f4000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'right', target_partner_id::text || '/a1000000-0000-4000-8000-000000000301/f4000000-0000-4000-8000-000000000102/direito-2.png', 'Direito 2.png', 'image/png', 1200000, 1086, 1448, now() - interval '5 days', now() - interval '5 days');

  insert into public.partner_client_photo_comparison_notes (
    id,
    partner_id,
    patient_id,
    before_session_id,
    after_session_id,
    notes,
    created_at,
    updated_at
  )
  values (
    'f4000000-0000-4000-8000-000000000301',
    target_partner_id,
    'a1000000-0000-4000-8000-000000000301',
    'f4000000-0000-4000-8000-000000000101',
    'f4000000-0000-4000-8000-000000000102',
    'Ótima evolução visual e redução de medidas. Manter foco em definição e estabilidade de core.',
    now() - interval '5 days',
    now() - interval '5 days'
  );

  insert into public.partner_client_photo_events (
    id,
    partner_id,
    patient_id,
    session_id,
    actor_name,
    event_type,
    detail,
    details,
    created_at
  )
  values
    ('f4000000-0000-4000-8000-000000000401', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'f4000000-0000-4000-8000-000000000101', 'Dr. Leo', 'session_created', 'Sessão inicial de Fotos criada.', '{"fixture": true}'::jsonb, now() - interval '90 days'),
    ('f4000000-0000-4000-8000-000000000402', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'f4000000-0000-4000-8000-000000000102', 'Dr. Leo', 'session_created', 'Sessão de Fotos de evolução criada.', '{"fixture": true}'::jsonb, now() - interval '5 days');

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
    ('d1000000-0000-4000-8000-000000000107', target_partner_id, 'Alimento importado sem categoria', 'outros', 'imported', 100, 'g', null, 90, 15, 4, 1, 2, 20, 'Fixture para pendência de categoria.', array['importado'], array['outro'], 2, 'active', now() - interval '1 day', now() - interval '1 day'),
    ('d1000000-0000-4000-8000-000000000108', target_partner_id, 'Batata-doce cozida', 'cereal', 'taco', 100, 'g', '1 unidade pequena', 86, 20.1, 0.6, 0.1, 3, 27, 'Boa alternativa ao arroz em refeições principais.', array['carboidrato', 'troca'], array['refeicao_principal', 'pre_treino'], 21, 'active', now() - interval '30 days', now() - interval '1 day'),
    ('d1000000-0000-4000-8000-000000000109', target_partner_id, 'Patinho moído grelhado', 'carne', 'tbca', 100, 'g', '1 porção média', 219, 0, 26, 12, 0, 67, 'Alternativa proteica para almoço e jantar.', array['proteína', 'troca'], array['refeicao_principal'], 19, 'active', now() - interval '29 days', now() - interval '1 day'),
    ('d1000000-0000-4000-8000-000000000110', target_partner_id, 'Iogurte natural desnatado', 'laticinio', 'custom', 170, 'g', '1 pote', 89, 12, 9, 0.4, 0, 110, 'Opção prática para lanches e ceia.', array['proteína', 'lanche'], array['lanche', 'ceia'], 18, 'active', now() - interval '25 days', now() - interval '1 day'),
    ('d1000000-0000-4000-8000-000000000111', target_partner_id, 'Banana prata', 'fruta', 'taco', 80, 'g', '1 unidade', 71, 18.5, 1, 0.1, 1.4, 1, 'Carboidrato simples para café e pré-treino.', array['fruta', 'pre-treino'], array['lanche', 'pre_treino'], 25, 'active', now() - interval '24 days', now() - interval '1 day'),
    ('d1000000-0000-4000-8000-000000000112', target_partner_id, 'Castanhas', 'gordura', 'custom', 15, 'g', '1 punhado pequeno', 92, 3, 3, 8, 1.2, 1, 'Fonte de gordura boa para lanches.', array['gordura boa', 'lanche'], array['lanche', 'ceia'], 16, 'active', now() - interval '23 days', now() - interval '1 day');

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
    ('e2000000-0000-4000-8000-000000000409', target_partner_id, 'e2000000-0000-4000-8000-000000000304', 2, 8, 90, 'moderate'),
    ('e2000000-0000-4000-8000-000000000410', target_partner_id, 'e2000000-0000-4000-8000-000000000302', 3, 10, 22, 'maximum'),
    ('e2000000-0000-4000-8000-000000000411', target_partner_id, 'e2000000-0000-4000-8000-000000000303', 3, 10, 30, 'maximum'),
    ('e2000000-0000-4000-8000-000000000412', target_partner_id, 'e2000000-0000-4000-8000-000000000304', 3, 8, 100, 'maximum');

  insert into public.partner_workout_events (
    id, partner_id, patient_id, program_id, actor_name, event_type, detail, version, created_at
  )
  values
    ('e2000000-0000-4000-8000-000000000501', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000101', 'Dr. Leo', 'created', 'Criou o programa de treinos.', 1, now() - interval '30 days'),
    ('e2000000-0000-4000-8000-000000000502', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000101', 'Dr. Leo', 'updated', 'Combinou Supino reto e Desenvolvimento em Bi-set.', 2, now() - interval '3 days'),
    ('e2000000-0000-4000-8000-000000000503', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000101', 'Dr. Leo', 'published', 'Publicou o plano de treinos v2.', 2, now() - interval '2 days');

  insert into public.client_workout_sessions (
    id,
    partner_id,
    patient_id,
    program_id,
    prescribed_session_id,
    workout_date,
    status,
    started_at,
    completed_at,
    duration_minutes,
    total_volume_kg,
    notes,
    created_at,
    updated_at
  )
  values
    ('e3000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000101', 'e2000000-0000-4000-8000-000000000201', current_date - 1, 'completed', now() - interval '1 day 2 hours', now() - interval '1 day 1 hour', 58, 2940, 'Boa execução geral.', now() - interval '1 day 2 hours', now() - interval '1 day 1 hour'),
    ('e3000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000101', 'e2000000-0000-4000-8000-000000000202', current_date - 3, 'completed', now() - interval '3 days 2 hours', now() - interval '3 days 1 hour 5 minutes', 55, 2200, 'Carga subiu bem no agachamento.', now() - interval '3 days 2 hours', now() - interval '3 days 1 hour 5 minutes'),
    ('e3000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000101', 'e2000000-0000-4000-8000-000000000203', current_date - 5, 'skipped', now() - interval '5 days 2 hours', now() - interval '5 days 2 hours', 0, 0, 'Pulou por agenda apertada.', now() - interval '5 days 2 hours', now() - interval '5 days 2 hours');

  insert into public.client_workout_exercise_logs (
    id,
    client_session_id,
    partner_id,
    patient_id,
    prescribed_exercise_id,
    status,
    started_at,
    completed_at,
    created_at,
    updated_at
  )
  values
    ('e3000000-0000-4000-8000-000000000201', 'e3000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000301', 'completed', now() - interval '1 day 2 hours', now() - interval '1 day 1 hour 42 minutes', now() - interval '1 day 2 hours', now() - interval '1 day 1 hour 42 minutes'),
    ('e3000000-0000-4000-8000-000000000202', 'e3000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000302', 'completed', now() - interval '1 day 1 hour 42 minutes', now() - interval '1 day 1 hour 25 minutes', now() - interval '1 day 1 hour 42 minutes', now() - interval '1 day 1 hour 25 minutes'),
    ('e3000000-0000-4000-8000-000000000203', 'e3000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000303', 'completed', now() - interval '1 day 1 hour 25 minutes', now() - interval '1 day 1 hour', now() - interval '1 day 1 hour 25 minutes', now() - interval '1 day 1 hour'),
    ('e3000000-0000-4000-8000-000000000204', 'e3000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000304', 'completed', now() - interval '3 days 2 hours', now() - interval '3 days 1 hour 5 minutes', now() - interval '3 days 2 hours', now() - interval '3 days 1 hour 5 minutes');

  insert into public.client_workout_set_logs (
    id,
    client_session_id,
    exercise_log_id,
    partner_id,
    patient_id,
    prescribed_exercise_id,
    prescribed_set_id,
    set_number,
    load_kg,
    reps,
    status,
    completed_at,
    created_at,
    updated_at
  )
  values
    ('e3000000-0000-4000-8000-000000000301', 'e3000000-0000-4000-8000-000000000101', 'e3000000-0000-4000-8000-000000000201', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000401', 1, 40, 12, 'completed', now() - interval '1 day 1 hour 54 minutes', now() - interval '1 day 1 hour 55 minutes', now() - interval '1 day 1 hour 54 minutes'),
    ('e3000000-0000-4000-8000-000000000302', 'e3000000-0000-4000-8000-000000000101', 'e3000000-0000-4000-8000-000000000201', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000402', 2, 60, 10, 'completed', now() - interval '1 day 1 hour 49 minutes', now() - interval '1 day 1 hour 50 minutes', now() - interval '1 day 1 hour 49 minutes'),
    ('e3000000-0000-4000-8000-000000000303', 'e3000000-0000-4000-8000-000000000101', 'e3000000-0000-4000-8000-000000000201', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000403', 3, 70, 8, 'completed', now() - interval '1 day 1 hour 43 minutes', now() - interval '1 day 1 hour 44 minutes', now() - interval '1 day 1 hour 43 minutes'),
    ('e3000000-0000-4000-8000-000000000304', 'e3000000-0000-4000-8000-000000000101', 'e3000000-0000-4000-8000-000000000202', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000302', 'e2000000-0000-4000-8000-000000000404', 1, 14, 12, 'completed', now() - interval '1 day 1 hour 36 minutes', now() - interval '1 day 1 hour 37 minutes', now() - interval '1 day 1 hour 36 minutes'),
    ('e3000000-0000-4000-8000-000000000305', 'e3000000-0000-4000-8000-000000000101', 'e3000000-0000-4000-8000-000000000202', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000302', 'e2000000-0000-4000-8000-000000000405', 2, 18, 10, 'completed', now() - interval '1 day 1 hour 31 minutes', now() - interval '1 day 1 hour 32 minutes', now() - interval '1 day 1 hour 31 minutes'),
    ('e3000000-0000-4000-8000-000000000306', 'e3000000-0000-4000-8000-000000000101', 'e3000000-0000-4000-8000-000000000202', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000302', 'e2000000-0000-4000-8000-000000000410', 3, 22, 10, 'completed', now() - interval '1 day 1 hour 26 minutes', now() - interval '1 day 1 hour 27 minutes', now() - interval '1 day 1 hour 26 minutes'),
    ('e3000000-0000-4000-8000-000000000307', 'e3000000-0000-4000-8000-000000000101', 'e3000000-0000-4000-8000-000000000203', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000303', 'e2000000-0000-4000-8000-000000000406', 1, 20, 15, 'completed', now() - interval '1 day 1 hour 19 minutes', now() - interval '1 day 1 hour 20 minutes', now() - interval '1 day 1 hour 19 minutes'),
    ('e3000000-0000-4000-8000-000000000308', 'e3000000-0000-4000-8000-000000000101', 'e3000000-0000-4000-8000-000000000203', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000303', 'e2000000-0000-4000-8000-000000000407', 2, 25, 12, 'completed', now() - interval '1 day 1 hour 12 minutes', now() - interval '1 day 1 hour 13 minutes', now() - interval '1 day 1 hour 12 minutes'),
    ('e3000000-0000-4000-8000-000000000309', 'e3000000-0000-4000-8000-000000000101', 'e3000000-0000-4000-8000-000000000203', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000303', 'e2000000-0000-4000-8000-000000000411', 3, 30, 10, 'completed', now() - interval '1 day 1 hour 6 minutes', now() - interval '1 day 1 hour 7 minutes', now() - interval '1 day 1 hour 6 minutes'),
    ('e3000000-0000-4000-8000-000000000310', 'e3000000-0000-4000-8000-000000000102', 'e3000000-0000-4000-8000-000000000204', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000304', 'e2000000-0000-4000-8000-000000000408', 1, 60, 10, 'completed', now() - interval '3 days 1 hour 45 minutes', now() - interval '3 days 1 hour 46 minutes', now() - interval '3 days 1 hour 45 minutes'),
    ('e3000000-0000-4000-8000-000000000311', 'e3000000-0000-4000-8000-000000000102', 'e3000000-0000-4000-8000-000000000204', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000304', 'e2000000-0000-4000-8000-000000000409', 2, 90, 8, 'completed', now() - interval '3 days 1 hour 26 minutes', now() - interval '3 days 1 hour 27 minutes', now() - interval '3 days 1 hour 26 minutes'),
    ('e3000000-0000-4000-8000-000000000312', 'e3000000-0000-4000-8000-000000000102', 'e3000000-0000-4000-8000-000000000204', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000304', 'e2000000-0000-4000-8000-000000000412', 3, 110, 8, 'completed', now() - interval '3 days 1 hour 8 minutes', now() - interval '3 days 1 hour 9 minutes', now() - interval '3 days 1 hour 8 minutes');

  insert into public.client_workout_events (
    id,
    partner_id,
    patient_id,
    program_id,
    prescribed_session_id,
    client_session_id,
    event_type,
    detail,
    details,
    created_at
  )
  values
    ('e3000000-0000-4000-8000-000000000401', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000101', 'e2000000-0000-4000-8000-000000000201', 'e3000000-0000-4000-8000-000000000101', 'session_finished', 'Treino A concluido no smoke.', '{"fixture": true}'::jsonb, now() - interval '1 day 1 hour'),
    ('e3000000-0000-4000-8000-000000000402', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000101', 'e2000000-0000-4000-8000-000000000202', 'e3000000-0000-4000-8000-000000000102', 'session_finished', 'Treino B concluido no smoke.', '{"fixture": true}'::jsonb, now() - interval '3 days 1 hour'),
    ('e3000000-0000-4000-8000-000000000403', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-000000000101', 'e2000000-0000-4000-8000-000000000203', 'e3000000-0000-4000-8000-000000000103', 'exercise_skipped', 'Treino pulado no smoke.', '{"fixture": true}'::jsonb, now() - interval '5 days 2 hours');

  insert into public.partner_client_cardio_plans (
    id,
    partner_id,
    patient_id,
    title,
    status,
    weekly_target_minutes,
    weight_kg,
    primary_activity_key,
    comparison_activity_key,
    target_zone,
    notes,
    version,
    published_at,
    created_at,
    updated_at
  )
  values (
    'c3000000-0000-4000-8000-000000000101',
    target_partner_id,
    'a1000000-0000-4000-8000-000000000301',
    'Cardio base aeróbica',
    'published',
    180,
    70,
    'caminhada_leve',
    'corrida_moderada',
    'z2',
    'Manter intensidade conversacional na maior parte da semana.',
    2,
    now() - interval '2 days',
    now() - interval '12 days',
    now() - interval '2 hours'
  );

  insert into public.partner_client_cardio_calculations (
    id,
    plan_id,
    partner_id,
    patient_id,
    weight_kg,
    duration_minutes,
    activity_key,
    comparison_activity_key,
    met,
    comparison_met,
    kcal_estimate,
    comparison_kcal_estimate,
    kcal_per_min,
    comparison_kcal_per_min,
    target_zone,
    parameters,
    created_at
  )
  values (
    'c3000000-0000-4000-8000-000000000201',
    'c3000000-0000-4000-8000-000000000101',
    target_partner_id,
    'a1000000-0000-4000-8000-000000000301',
    70,
    30,
    'caminhada_leve',
    'corrida_moderada',
    2.5,
    5.0,
    92,
    184,
    3.1,
    6.1,
    'z2',
    '{"weeklyTargetMinutes": 180, "fixture": true}'::jsonb,
    now() - interval '2 days'
  );

  insert into public.partner_client_cardio_sessions (
    id,
    plan_id,
    partner_id,
    patient_id,
    performed_at,
    duration_minutes,
    activity_key,
    met,
    kcal_estimate,
    target_zone,
    notes,
    created_at
  )
  values
    ('c3000000-0000-4000-8000-000000000301', 'c3000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('week', now()) + interval '1 day 7 hours', 60, 'corrida_moderada', 5.0, 368, 'z2', 'Ritmo confortável.', now() - interval '2 days'),
    ('c3000000-0000-4000-8000-000000000302', 'c3000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('week', now()) + interval '3 days 7 hours', 52, 'eliptico', 5.0, 319, 'z2', 'Sem dor articular.', now() - interval '1 day'),
    ('c3000000-0000-4000-8000-000000000303', 'c3000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('week', now()) + interval '2 days 8 hours', 50, 'bicicleta_leve', 4.0, 245, 'z2', 'Pedal leve pós-treino.', now() - interval '6 hours');

  insert into public.partner_client_cardio_events (
    id,
    plan_id,
    partner_id,
    patient_id,
    actor_name,
    event_type,
    detail,
    version,
    details,
    created_at
  )
  values
    ('c3000000-0000-4000-8000-000000000401', 'c3000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'Dr. Leo', 'created', 'Plano de Cardio criado.', 1, '{"fixture": true}'::jsonb, now() - interval '12 days'),
    ('c3000000-0000-4000-8000-000000000402', 'c3000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'Dr. Leo', 'calculation_saved', 'Cálculo inicial salvo.', 2, '{"calculationId": "c3000000-0000-4000-8000-000000000201"}'::jsonb, now() - interval '2 days'),
    ('c3000000-0000-4000-8000-000000000403', 'c3000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'Dr. Leo', 'session_logged', 'Sessões da semana registradas.', 2, '{"fixture": true}'::jsonb, now() - interval '6 hours');

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

  drop table if exists pg_temp.tmp_partner_exam_seed;
  create temporary table tmp_partner_exam_seed (
    category_slug text,
    category_name text,
    category_icon text,
    category_order integer,
    exam_slug text,
    exam_name text,
    default_unit text,
    exam_order integer,
    refs jsonb,
    units jsonb
  ) on commit drop;

  insert into tmp_partner_exam_seed (
    category_slug,
    category_name,
    category_icon,
    category_order,
    exam_slug,
    exam_name,
    default_unit,
    exam_order,
    refs,
    units
  )
  values
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'colesterol_total', 'Colesterol total', 'mg/dL', 10, '[{"sex":"unisex","low":0,"high":200}]', '[{"unit":"mmol/L","factor":0.02586}]'),
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'ldl_colesterol', 'LDL-colesterol', 'mg/dL', 20, '[{"sex":"unisex","low":0,"high":100}]', '[{"unit":"mmol/L","factor":0.02586}]'),
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'hdl_colesterol', 'HDL-colesterol', 'mg/dL', 30, '[{"sex":"male","low":40,"high":100},{"sex":"female","low":50,"high":100}]', '[{"unit":"mmol/L","factor":0.02586}]'),
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'vldl_colesterol', 'VLDL-colesterol', 'mg/dL', 40, '[{"sex":"unisex","low":0,"high":30}]', '[]'),
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'triglicerideos', 'Triglicerídeos', 'mg/dL', 50, '[{"sex":"unisex","low":0,"high":150}]', '[{"unit":"mmol/L","factor":0.01129}]'),
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'apolipoproteina_a1', 'Apolipoproteína A1 (ApoA1)', 'mg/dL', 60, '[{"sex":"male","low":120,"high":160},{"sex":"female","low":140,"high":180}]', '[]'),
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'apolipoproteina_b', 'Apolipoproteína B (ApoB)', 'mg/dL', 70, '[{"sex":"unisex","low":0,"high":90}]', '[]'),
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'lipoproteina_a', 'Lipoproteína(a) - Lp(a)', 'mg/dL', 80, '[{"sex":"unisex","low":0,"high":30}]', '[{"unit":"nmol/L","factor":2.4}]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'hemoglobina', 'Hemoglobina', 'g/dL', 10, '[{"sex":"male","low":13.5,"high":17.5},{"sex":"female","low":12,"high":15.5}]', '[{"unit":"mmol/L","factor":0.6206}]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'hematocrito', 'Hematócrito', '%', 20, '[{"sex":"male","low":40,"high":52},{"sex":"female","low":36,"high":46}]', '[]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'leucocitos', 'Leucócitos', '/μL', 30, '[{"sex":"unisex","low":4000,"high":11000}]', '[]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'plaquetas', 'Plaquetas', '/μL', 40, '[{"sex":"unisex","low":150000,"high":400000}]', '[]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'ferritina', 'Ferritina', 'ng/mL', 50, '[{"sex":"male","low":30,"high":300},{"sex":"female","low":15,"high":150}]', '[]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'ferro_serico', 'Ferro sérico', 'μg/dL', 60, '[{"sex":"male","low":65,"high":175},{"sex":"female","low":50,"high":170}]', '[]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'transferrina', 'Transferrina', 'mg/dL', 70, '[{"sex":"unisex","low":200,"high":360}]', '[]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'saturacao_transferrina', 'Saturação de transferrina', '%', 80, '[{"sex":"unisex","low":20,"high":50}]', '[]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'tibc', 'TIBC (capacidade total de ligação do ferro)', 'μg/dL', 90, '[{"sex":"unisex","low":250,"high":450}]', '[]'),
    ('metabolismo_da_glicose', 'Metabolismo da glicose', 'activity', 30, 'glicemia_jejum', 'Glicemia de jejum', 'mg/dL', 10, '[{"sex":"unisex","low":70,"high":99}]', '[{"unit":"mmol/L","factor":0.0555}]'),
    ('metabolismo_da_glicose', 'Metabolismo da glicose', 'activity', 30, 'hemoglobina_glicada', 'Hemoglobina glicada (HbA1c)', '%', 20, '[{"sex":"unisex","low":4,"high":5.7}]', '[]'),
    ('metabolismo_da_glicose', 'Metabolismo da glicose', 'activity', 30, 'insulina_jejum', 'Insulina de jejum', 'μU/mL', 30, '[{"sex":"unisex","low":2,"high":25}]', '[]'),
    ('metabolismo_da_glicose', 'Metabolismo da glicose', 'activity', 30, 'peptideo_c', 'Peptídeo C', 'ng/mL', 40, '[{"sex":"unisex","low":0.8,"high":3.1}]', '[]'),
    ('metabolismo_da_glicose', 'Metabolismo da glicose', 'activity', 30, 'totg_2h', 'TOTG (2h)', 'mg/dL', 50, '[{"sex":"unisex","low":0,"high":140}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'tgo_ast', 'TGO (AST)', 'U/L', 10, '[{"sex":"male","low":0,"high":40},{"sex":"female","low":0,"high":32}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'tgp_alt', 'TGP (ALT)', 'U/L', 20, '[{"sex":"male","low":0,"high":40},{"sex":"female","low":0,"high":32}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'ggt', 'GGT', 'U/L', 30, '[{"sex":"unisex","low":0,"high":75}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'fosfatase_alcalina', 'Fosfatase alcalina', 'U/L', 40, '[{"sex":"unisex","low":30,"high":120}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'bilirrubina_total', 'Bilirrubina total', 'mg/dL', 50, '[{"sex":"unisex","low":0.3,"high":1.2}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'bilirrubina_direta', 'Bilirrubina direta', 'mg/dL', 60, '[{"sex":"unisex","low":0,"high":0.3}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'bilirrubina_indireta', 'Bilirrubina indireta', 'mg/dL', 70, '[{"sex":"unisex","low":0.2,"high":0.9}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'albumina', 'Albumina', 'g/dL', 80, '[{"sex":"unisex","low":3.5,"high":5}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'proteinas_totais', 'Proteínas totais', 'g/dL', 90, '[{"sex":"unisex","low":6,"high":8.3}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'inr', 'INR', '—', 100, '[{"sex":"unisex","low":0.8,"high":1.2}]', '[]'),
    ('funcao_renal', 'Função renal', 'droplet', 50, 'creatinina', 'Creatinina', 'mg/dL', 10, '[{"sex":"male","low":0.7,"high":1.2},{"sex":"female","low":0.6,"high":1}]', '[{"unit":"μmol/L","factor":88.4}]'),
    ('funcao_renal', 'Função renal', 'droplet', 50, 'ureia', 'Ureia', 'mg/dL', 20, '[{"sex":"unisex","low":15,"high":40}]', '[]'),
    ('funcao_renal', 'Função renal', 'droplet', 50, 'acido_urico', 'Ácido úrico', 'mg/dL', 30, '[{"sex":"male","low":3.4,"high":7},{"sex":"female","low":2.4,"high":6}]', '[]'),
    ('funcao_renal', 'Função renal', 'droplet', 50, 'cistatina_c', 'Cistatina C', 'mg/L', 40, '[{"sex":"male","low":0.56,"high":1.25},{"sex":"female","low":0.49,"high":0.98}]', '[]'),
    ('eletrolitos', 'Eletrólitos', 'activity', 60, 'sodio', 'Sódio', 'mmol/L', 10, '[{"sex":"unisex","low":135,"high":145}]', '[]'),
    ('eletrolitos', 'Eletrólitos', 'activity', 60, 'potassio', 'Potássio', 'mmol/L', 20, '[{"sex":"unisex","low":3.5,"high":5}]', '[]'),
    ('eletrolitos', 'Eletrólitos', 'activity', 60, 'cloro', 'Cloro', 'mmol/L', 30, '[{"sex":"unisex","low":98,"high":107}]', '[]'),
    ('eletrolitos', 'Eletrólitos', 'activity', 60, 'calcio_total', 'Cálcio total', 'mg/dL', 40, '[{"sex":"unisex","low":8.5,"high":10.5}]', '[]'),
    ('eletrolitos', 'Eletrólitos', 'activity', 60, 'magnesio', 'Magnésio', 'mg/dL', 50, '[{"sex":"unisex","low":1.7,"high":2.2}]', '[]'),
    ('eletrolitos', 'Eletrólitos', 'activity', 60, 'fosforo', 'Fósforo', 'mg/dL', 60, '[{"sex":"unisex","low":2.5,"high":4.5}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'tsh', 'TSH', 'mIU/L', 10, '[{"sex":"unisex","low":0.4,"high":5}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 't4_livre', 'T4 livre', 'ng/dL', 20, '[{"sex":"unisex","low":0.9,"high":1.7}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 't3_livre', 'T3 livre', 'pg/mL', 30, '[{"sex":"unisex","low":2.3,"high":4.2}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'anti_tpo', 'Anti-TPO', 'IU/mL', 40, '[{"sex":"unisex","low":0,"high":35}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'anti_tireoglobulina', 'Anti-tireoglobulina', 'IU/mL', 50, '[{"sex":"unisex","low":0,"high":40}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'trab', 'TRAb', 'IU/L', 60, '[{"sex":"unisex","low":0,"high":1.75}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'testosterona_total', 'Testosterona total', 'ng/dL', 70, '[{"sex":"male","low":300,"high":1000},{"sex":"female","low":15,"high":70}]', '[{"unit":"ng/mL","factor":0.01}]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'testosterona_livre', 'Testosterona livre', 'pg/mL', 80, '[{"sex":"male","low":50,"high":210},{"sex":"female","low":1,"high":8.5}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'shbg', 'SHBG', 'nmol/L', 90, '[{"sex":"male","low":10,"high":57},{"sex":"female","low":18,"high":114}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'estradiol', 'Estradiol', 'pg/mL', 100, '[{"sex":"male","low":10,"high":40},{"sex":"female","low":30,"high":400}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'progesterona', 'Progesterona', 'ng/mL', 110, '[{"sex":"male","low":0,"high":1},{"sex":"female","low":0,"high":20}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'lh', 'LH', 'mIU/mL', 120, '[{"sex":"male","low":1.5,"high":9.3},{"sex":"female","low":0.5,"high":76.3}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'fsh', 'FSH', 'mIU/mL', 130, '[{"sex":"male","low":1.4,"high":18.1},{"sex":"female","low":1.5,"high":116.3}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'prolactina', 'Prolactina', 'ng/mL', 140, '[{"sex":"male","low":2,"high":18},{"sex":"female","low":2,"high":29}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'dhea_s', 'DHEA-S', 'μg/dL', 150, '[{"sex":"male","low":80,"high":560},{"sex":"female","low":35,"high":430}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'igf_1', 'IGF-1', 'ng/mL', 160, '[{"sex":"unisex","low":115,"high":358}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'gh', 'GH', 'ng/mL', 170, '[{"sex":"unisex","low":0,"high":5}]', '[]'),
    ('vitaminas', 'Vitaminas', 'pill', 80, 'vitamina_d', 'Vitamina D', 'ng/mL', 10, '[{"sex":"unisex","low":30,"high":100}]', '[]'),
    ('vitaminas', 'Vitaminas', 'pill', 80, 'vitamina_b12', 'Vitamina B12', 'pg/mL', 20, '[{"sex":"unisex","low":300,"high":900}]', '[]'),
    ('vitaminas', 'Vitaminas', 'pill', 80, 'acido_folico', 'Ácido fólico (vitamina B9)', 'ng/mL', 30, '[{"sex":"unisex","low":3,"high":20}]', '[]'),
    ('vitaminas', 'Vitaminas', 'pill', 80, 'vitamina_a', 'Vitamina A', 'μmol/L', 40, '[{"sex":"unisex","low":0.7,"high":3}]', '[]'),
    ('vitaminas', 'Vitaminas', 'pill', 80, 'vitamina_c', 'Vitamina C', 'mg/dL', 50, '[{"sex":"unisex","low":0.4,"high":2}]', '[]'),
    ('minerais_e_oligoelementos', 'Minerais e oligoelementos', 'bone', 90, 'zinco', 'Zinco', 'μg/dL', 10, '[{"sex":"unisex","low":65,"high":120}]', '[]'),
    ('minerais_e_oligoelementos', 'Minerais e oligoelementos', 'bone', 90, 'cobre', 'Cobre', 'μg/dL', 20, '[{"sex":"unisex","low":75,"high":155}]', '[]'),
    ('minerais_e_oligoelementos', 'Minerais e oligoelementos', 'bone', 90, 'selenio', 'Selênio', 'μg/L', 30, '[{"sex":"unisex","low":60,"high":95}]', '[]'),
    ('marcadores_inflamatorios', 'Marcadores inflamatórios', 'heartPulse', 100, 'pcr_us', 'PCR-us', 'mg/L', 10, '[{"sex":"unisex","low":0,"high":1}]', '[]'),
    ('marcadores_inflamatorios', 'Marcadores inflamatórios', 'heartPulse', 100, 'vhs', 'Velocidade de hemossedimentação (VHS)', 'mm/h', 20, '[{"sex":"male","low":0,"high":15},{"sex":"female","low":0,"high":20}]', '[]'),
    ('marcadores_inflamatorios', 'Marcadores inflamatórios', 'heartPulse', 100, 'homocisteina', 'Homocisteína', 'μmol/L', 30, '[{"sex":"unisex","low":0,"high":15}]', '[]'),
    ('marcadores_inflamatorios', 'Marcadores inflamatórios', 'heartPulse', 100, 'fibrinogenio', 'Fibrinogênio', 'mg/dL', 40, '[{"sex":"unisex","low":200,"high":400}]', '[]'),
    ('marcadores_musculares', 'Marcadores musculares', 'activity', 110, 'cpk', 'CPK', 'U/L', 10, '[{"sex":"male","low":38,"high":174},{"sex":"female","low":26,"high":140}]', '[]');

  insert into public.partner_exam_categories (
    partner_id,
    slug,
    name,
    icon_key,
    sort_order,
    status
  )
  select distinct on (category_slug)
    target_partner_id,
    category_slug,
    category_name,
    category_icon,
    category_order,
    'active'
  from tmp_partner_exam_seed
  order by category_slug, category_order
  on conflict (partner_id, slug) do update
  set
    name = excluded.name,
    icon_key = excluded.icon_key,
    sort_order = excluded.sort_order,
    status = 'active';

  insert into public.partner_exam_definitions (
    partner_id,
    category_id,
    slug,
    name,
    default_unit,
    sort_order,
    status
  )
  select
    target_partner_id,
    category.id,
    seed.exam_slug,
    seed.exam_name,
    seed.default_unit,
    seed.exam_order,
    'active'
  from tmp_partner_exam_seed seed
  join public.partner_exam_categories category
    on category.partner_id = target_partner_id
   and category.slug = seed.category_slug
  on conflict (partner_id, slug) do update
  set
    category_id = excluded.category_id,
    name = excluded.name,
    default_unit = excluded.default_unit,
    sort_order = excluded.sort_order,
    status = 'active';

  insert into public.partner_exam_reference_ranges (
    partner_id,
    exam_id,
    sex,
    low_value,
    high_value,
    sort_order,
    status
  )
  select
    target_partner_id,
    definition.id,
    reference.sex,
    reference.low,
    reference.high,
    row_number() over (partition by definition.id order by reference.sex)::integer,
    'active'
  from tmp_partner_exam_seed seed
  join public.partner_exam_definitions definition
    on definition.partner_id = target_partner_id
   and definition.slug = seed.exam_slug
  cross join lateral jsonb_to_recordset(seed.refs) as reference(sex text, low numeric, high numeric)
  on conflict (partner_id, exam_id, sex) where status = 'active' do update
  set
    low_value = excluded.low_value,
    high_value = excluded.high_value,
    sort_order = excluded.sort_order;

  insert into public.partner_exam_alternative_units (
    partner_id,
    exam_id,
    unit,
    factor_from_default,
    status
  )
  select
    target_partner_id,
    definition.id,
    unit.unit,
    unit.factor,
    'active'
  from tmp_partner_exam_seed seed
  join public.partner_exam_definitions definition
    on definition.partner_id = target_partner_id
   and definition.slug = seed.exam_slug
  cross join lateral jsonb_to_recordset(seed.units) as unit(unit text, factor numeric)
  on conflict (partner_id, exam_id, (lower(unit))) where status = 'active' do update
  set factor_from_default = excluded.factor_from_default;

  insert into public.partner_client_exam_collections (
    id,
    partner_id,
    patient_id,
    collected_at,
    title,
    notes,
    status,
    created_at,
    updated_at
  )
  values
    ('f3000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', current_date - interval '62 days', 'Coleta basal', 'Exames iniciais para comparação.', 'saved', now() - interval '62 days', now() - interval '62 days'),
    ('f3000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', current_date - interval '30 days', 'Coleta de acompanhamento', 'Ajuste de dieta e treino em andamento.', 'saved', now() - interval '30 days', now() - interval '30 days'),
    ('f3000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', current_date - interval '1 day', 'Coleta mais recente', 'Revisão pré-consulta.', 'saved', now() - interval '1 day', now() - interval '1 day');

  with result_seed(collection_id, exam_slug, input_value, input_unit, notes) as (
    values
      ('f3000000-0000-4000-8000-000000000101'::uuid, 'colesterol_total', 232::numeric, 'mg/dL', null),
      ('f3000000-0000-4000-8000-000000000101'::uuid, 'ldl_colesterol', 136::numeric, 'mg/dL', null),
      ('f3000000-0000-4000-8000-000000000101'::uuid, 'hdl_colesterol', 43::numeric, 'mg/dL', null),
      ('f3000000-0000-4000-8000-000000000101'::uuid, 'triglicerideos', 176::numeric, 'mg/dL', null),
      ('f3000000-0000-4000-8000-000000000101'::uuid, 'glicemia_jejum', 108::numeric, 'mg/dL', null),
      ('f3000000-0000-4000-8000-000000000101'::uuid, 'hemoglobina_glicada', 5.9::numeric, '%', null),
      ('f3000000-0000-4000-8000-000000000101'::uuid, 'vitamina_d', 22::numeric, 'ng/mL', null),
      ('f3000000-0000-4000-8000-000000000102'::uuid, 'colesterol_total', 218::numeric, 'mg/dL', null),
      ('f3000000-0000-4000-8000-000000000102'::uuid, 'ldl_colesterol', 122::numeric, 'mg/dL', null),
      ('f3000000-0000-4000-8000-000000000102'::uuid, 'hdl_colesterol', 46::numeric, 'mg/dL', null),
      ('f3000000-0000-4000-8000-000000000102'::uuid, 'triglicerideos', 158::numeric, 'mg/dL', null),
      ('f3000000-0000-4000-8000-000000000102'::uuid, 'glicemia_jejum', 104::numeric, 'mg/dL', null),
      ('f3000000-0000-4000-8000-000000000102'::uuid, 'hemoglobina_glicada', 5.7::numeric, '%', null),
      ('f3000000-0000-4000-8000-000000000102'::uuid, 'vitamina_d', 25::numeric, 'ng/mL', null),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'colesterol_total', 198::numeric, 'mg/dL', 'Melhora global.'),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'ldl_colesterol', 108::numeric, 'mg/dL', 'Ainda acima da meta.'),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'hdl_colesterol', 48::numeric, 'mg/dL', 'Abaixo da referência feminina.'),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'triglicerideos', 142::numeric, 'mg/dL', null),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'apolipoproteina_b', 88::numeric, 'mg/dL', null),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'lipoproteina_a', 22::numeric, 'mg/dL', null),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'glicemia_jejum', 103::numeric, 'mg/dL', 'Reavaliar rotina pré-coleta.'),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'hemoglobina_glicada', 5.6::numeric, '%', null),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'insulina_jejum', 18::numeric, 'μU/mL', null),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'tgo_ast', 28::numeric, 'U/L', null),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'tgp_alt', 34::numeric, 'U/L', 'Levemente acima.'),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'ggt', 42::numeric, 'U/L', null),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'creatinina', 0.92::numeric, 'mg/dL', null),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'ureia', 32::numeric, 'mg/dL', null),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'hemoglobina', 13.1::numeric, 'g/dL', null),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'ferritina', 24::numeric, 'ng/mL', null),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'plaquetas', 310000::numeric, '/μL', null),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'vitamina_d', 28::numeric, 'ng/mL', 'Suplementação em revisão.'),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'vitamina_b12', 520::numeric, 'pg/mL', null),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'pcr_us', 1.4::numeric, 'mg/L', 'Atenção a carga inflamatória.'),
      ('f3000000-0000-4000-8000-000000000103'::uuid, 'cpk', 118::numeric, 'U/L', null)
  )
  insert into public.partner_client_exam_results (
    collection_id,
    partner_id,
    patient_id,
    exam_id,
    input_value,
    input_unit,
    value_default,
    default_unit,
    conversion_factor_from_default,
    reference_low,
    reference_high,
    reference_sex,
    status,
    snapshot_exam_name,
    snapshot_exam_slug,
    snapshot_category_name,
    snapshot_category_slug,
    notes,
    created_at,
    updated_at
  )
  select
    seed.collection_id,
    target_partner_id,
    'a1000000-0000-4000-8000-000000000301',
    definition.id,
    seed.input_value,
    seed.input_unit,
    case
      when lower(seed.input_unit) = lower(definition.default_unit) then seed.input_value
      else seed.input_value / alternative.factor_from_default
    end as value_default,
    definition.default_unit,
    alternative.factor_from_default,
    reference.low_value,
    reference.high_value,
    coalesce(reference.sex, 'unisex'),
    case
      when reference.id is null then 'unknown'
      when reference.low_value is not null and (case when lower(seed.input_unit) = lower(definition.default_unit) then seed.input_value else seed.input_value / alternative.factor_from_default end) < reference.low_value then 'low'
      when reference.high_value is not null and (case when lower(seed.input_unit) = lower(definition.default_unit) then seed.input_value else seed.input_value / alternative.factor_from_default end) > reference.high_value then 'high'
      else 'normal'
    end,
    definition.name,
    definition.slug,
    category.name,
    category.slug,
    seed.notes,
    collection.created_at,
    collection.updated_at
  from result_seed seed
  join public.partner_client_exam_collections collection
    on collection.id = seed.collection_id
   and collection.partner_id = target_partner_id
  join public.partner_exam_definitions definition
    on definition.partner_id = target_partner_id
   and definition.slug = seed.exam_slug
  join public.partner_exam_categories category
    on category.id = definition.category_id
   and category.partner_id = target_partner_id
  join public.patients patient
    on patient.id = 'a1000000-0000-4000-8000-000000000301'
  left join public.partner_exam_alternative_units alternative
    on alternative.partner_id = target_partner_id
   and alternative.exam_id = definition.id
   and lower(alternative.unit) = lower(seed.input_unit)
   and alternative.status = 'active'
  left join lateral (
    select reference_row.*
    from public.partner_exam_reference_ranges reference_row
    where reference_row.partner_id = target_partner_id
      and reference_row.exam_id = definition.id
      and reference_row.status = 'active'
      and reference_row.sex in (coalesce(patient.gender, 'unisex'), 'unisex')
    order by case when reference_row.sex = patient.gender then 0 else 1 end
    limit 1
  ) reference on true;

  insert into public.partner_client_exam_events (
    id,
    partner_id,
    patient_id,
    collection_id,
    actor_name,
    event_type,
    detail,
    details,
    created_at
  )
  values
    ('f3000000-0000-4000-8000-000000000201', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'f3000000-0000-4000-8000-000000000101', 'Dr. Leo', 'collection_saved', 'Coleta basal salva.', '{"fixture": true}'::jsonb, now() - interval '62 days'),
    ('f3000000-0000-4000-8000-000000000202', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'f3000000-0000-4000-8000-000000000102', 'Dr. Leo', 'collection_saved', 'Coleta de acompanhamento salva.', '{"fixture": true}'::jsonb, now() - interval '30 days'),
    ('f3000000-0000-4000-8000-000000000203', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'f3000000-0000-4000-8000-000000000103', 'Dr. Leo', 'collection_saved', 'Coleta mais recente salva.', '{"fixture": true}'::jsonb, now() - interval '1 day');



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
    ('e1000000-0000-4000-8000-000000000203', 'e1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 1, 'Lanche', '16:30', 2, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000204', 'e1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 1, 'Jantar', '19:30', 3, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000205', 'e1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 2, 'Café da manhã', '07:15', 0, now() - interval '12 days', now() - interval '2 days');

  insert into public.partner_client_diet_meals (
    id,
    plan_id,
    partner_id,
    patient_id,
    day_of_week,
    title,
    meal_time,
    menu_option,
    option_label,
    sort_order,
    created_at,
    updated_at
  )
  values
    ('e1000000-0000-4000-8000-000000000206', 'e1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 1, 'Ceia', '22:00', 1, 'Cardápio 1', 4, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000211', 'e1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 1, 'Café da manhã', '07:00', 2, 'Cardápio 2', 0, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000212', 'e1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 1, 'Almoço', '12:30', 2, 'Cardápio 2', 1, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000213', 'e1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 1, 'Lanche', '16:30', 2, 'Cardápio 2', 2, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000214', 'e1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 1, 'Jantar', '19:30', 2, 'Cardápio 2', 3, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000215', 'e1000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 1, 'Ceia', '22:00', 2, 'Cardápio 2', 4, now() - interval '12 days', now() - interval '2 days');

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
    ('e1000000-0000-4000-8000-000000000309', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000204', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000101', 100, 'g', '4 colheres de sopa', 'Arroz branco cozido', 100, 'g', 130, 28.1, 2.5, 0.2, 1.6, 1, 1, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000310', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000206', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000110', 170, 'g', '1 pote', 'Iogurte natural desnatado', 170, 'g', 89, 12, 9, 0.4, 0, 110, 0, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000311', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000206', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000112', 15, 'g', '1 punhado pequeno', 'Castanhas', 15, 'g', 92, 3, 3, 8, 1.2, 1, 1, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000321', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000211', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000103', 45, 'g', '3 colheres de sopa', 'Aveia em flocos', 30, 'g', 118, 20, 4.3, 2.2, 3, 1, 0, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000322', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000211', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000111', 80, 'g', '1 unidade', 'Banana prata', 80, 'g', 71, 18.5, 1, 0.1, 1.4, 1, 1, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000323', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000212', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000109', 130, 'g', '1 porção média', 'Patinho moído grelhado', 100, 'g', 219, 0, 26, 12, 0, 67, 0, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000324', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000212', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000108', 180, 'g', '1 unidade pequena', 'Batata-doce cozida', 100, 'g', 86, 20.1, 0.6, 0.1, 3, 27, 1, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000325', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000213', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000110', 170, 'g', '1 pote', 'Iogurte natural desnatado', 170, 'g', 89, 12, 9, 0.4, 0, 110, 0, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000326', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000214', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000102', 130, 'g', '1 filé médio', 'Peito de frango grelhado', 100, 'g', 165, 0, 31, 3.6, 0, 74, 0, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000327', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000214', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000108', 160, 'g', '1 unidade pequena', 'Batata-doce cozida', 100, 'g', 86, 20.1, 0.6, 0.1, 3, 27, 1, now() - interval '12 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000328', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000215', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'd1000000-0000-4000-8000-000000000104', 30, 'g', '1 scoop', 'Whey protein concentrado', 30, 'g', 120, 3, 24, 1.5, 0, 60, 0, now() - interval '12 days', now() - interval '2 days');

  insert into public.client_diet_daily_logs (
    id,
    partner_id,
    patient_id,
    plan_id,
    log_date,
    water_ml,
    created_at,
    updated_at
  )
  values
    ('e1000000-0000-4000-8000-000000000501', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', current_date - 6, 2250, now() - interval '6 days', now() - interval '6 days'),
    ('e1000000-0000-4000-8000-000000000502', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', current_date - 5, 2500, now() - interval '5 days', now() - interval '5 days'),
    ('e1000000-0000-4000-8000-000000000503', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', current_date - 4, 1750, now() - interval '4 days', now() - interval '4 days'),
    ('e1000000-0000-4000-8000-000000000504', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', current_date - 3, 1500, now() - interval '3 days', now() - interval '3 days'),
    ('e1000000-0000-4000-8000-000000000505', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', current_date - 2, 2000, now() - interval '2 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000506', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', current_date - 1, 2750, now() - interval '1 day', now() - interval '1 day'),
    ('e1000000-0000-4000-8000-000000000507', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', current_date, 750, now() - interval '2 hours', now() - interval '2 hours');

  insert into public.client_diet_meal_logs (
    id,
    partner_id,
    patient_id,
    plan_id,
    meal_id,
    log_date,
    status,
    completed_at,
    notes,
    created_at,
    updated_at
  )
  values
    ('e1000000-0000-4000-8000-000000000601', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000201', current_date, 'completed', date_trunc('day', now()) + interval '7 hours 18 minutes', 'Boa adesão no café da manhã.', now() - interval '2 hours', now() - interval '2 hours'),
    ('e1000000-0000-4000-8000-000000000602', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000201', current_date - 1, 'completed', date_trunc('day', now() - interval '1 day') + interval '7 hours 10 minutes', null, now() - interval '1 day', now() - interval '1 day'),
    ('e1000000-0000-4000-8000-000000000603', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000202', current_date - 1, 'completed', date_trunc('day', now() - interval '1 day') + interval '12 hours 40 minutes', null, now() - interval '1 day', now() - interval '1 day'),
    ('e1000000-0000-4000-8000-000000000604', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000201', current_date - 2, 'completed', date_trunc('day', now() - interval '2 days') + interval '7 hours 25 minutes', null, now() - interval '2 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000605', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000202', current_date - 2, 'completed', date_trunc('day', now() - interval '2 days') + interval '12 hours 30 minutes', null, now() - interval '2 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000606', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000203', current_date - 2, 'completed', date_trunc('day', now() - interval '2 days') + interval '16 hours 40 minutes', null, now() - interval '2 days', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000607', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000201', current_date - 3, 'completed', date_trunc('day', now() - interval '3 days') + interval '7 hours 5 minutes', null, now() - interval '3 days', now() - interval '3 days'),
    ('e1000000-0000-4000-8000-000000000608', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000201', current_date - 4, 'completed', date_trunc('day', now() - interval '4 days') + interval '7 hours 12 minutes', null, now() - interval '4 days', now() - interval '4 days'),
    ('e1000000-0000-4000-8000-000000000609', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000202', current_date - 5, 'completed', date_trunc('day', now() - interval '5 days') + interval '12 hours 20 minutes', null, now() - interval '5 days', now() - interval '5 days'),
    ('e1000000-0000-4000-8000-000000000610', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000204', current_date - 6, 'completed', date_trunc('day', now() - interval '6 days') + interval '19 hours 40 minutes', null, now() - interval '6 days', now() - interval '6 days');

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

  insert into public.client_health_daily_logs (
    id,
    partner_id,
    patient_id,
    log_date,
    sleep_minutes,
    sleep_deep_minutes,
    sleep_latency_minutes,
    sleep_efficiency_pct,
    hydration_ml,
    created_at,
    updated_at
  )
  values
    ('b2000000-0000-4000-8000-000000000101', target_partner_id, 'a1000000-0000-4000-8000-000000000301', current_date, 462, 72, 12, 84, 2100, now() - interval '3 hours', now() - interval '1 hour'),
    ('b2000000-0000-4000-8000-000000000102', target_partner_id, 'a1000000-0000-4000-8000-000000000301', current_date - 1, 438, 66, 15, 88, 2250, now() - interval '1 day', now() - interval '1 day'),
    ('b2000000-0000-4000-8000-000000000103', target_partner_id, 'a1000000-0000-4000-8000-000000000301', current_date - 2, 421, 61, 18, 81, 2000, now() - interval '2 days', now() - interval '2 days');

  insert into public.client_health_medications (
    id,
    partner_id,
    patient_id,
    name,
    dosage,
    schedule_time,
    status,
    sort_order,
    created_at,
    updated_at
  )
  values
    ('b2000000-0000-4000-8000-000000000201', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'Vitamina D', '2000 UI • 1 cápsula', '08:00', 'active', 0, now() - interval '12 days', now() - interval '2 days'),
    ('b2000000-0000-4000-8000-000000000202', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'Ômega 3', '1000 mg • 1 cápsula', '20:30', 'active', 1, now() - interval '12 days', now() - interval '2 days'),
    ('b2000000-0000-4000-8000-000000000203', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'Magnésio', '200 mg • 1 comprimido', '22:00', 'active', 2, now() - interval '12 days', now() - interval '2 days');

  insert into public.client_health_medication_logs (
    id,
    partner_id,
    patient_id,
    medication_id,
    log_date,
    status,
    taken_at,
    created_at,
    updated_at
  )
  values
    ('b2000000-0000-4000-8000-000000000301', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'b2000000-0000-4000-8000-000000000201', current_date, 'completed', date_trunc('day', now()) + interval '8 hours 4 minutes', now() - interval '3 hours', now() - interval '3 hours'),
    ('b2000000-0000-4000-8000-000000000302', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'b2000000-0000-4000-8000-000000000202', current_date, 'completed', date_trunc('day', now()) + interval '20 hours 35 minutes', now() - interval '2 hours', now() - interval '2 hours'),
    ('b2000000-0000-4000-8000-000000000303', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'b2000000-0000-4000-8000-000000000201', current_date - 1, 'completed', date_trunc('day', now() - interval '1 day') + interval '8 hours', now() - interval '1 day', now() - interval '1 day');

  insert into public.client_health_pressure_logs (
    id,
    partner_id,
    patient_id,
    measured_at,
    systolic,
    diastolic,
    notes,
    created_at,
    updated_at
  )
  values
    ('b2000000-0000-4000-8000-000000000401', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('day', now()) + interval '8 hours 45 minutes', 124, 80, 'Manhã em repouso.', now() - interval '4 hours', now() - interval '4 hours'),
    ('b2000000-0000-4000-8000-000000000402', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('day', now() - interval '1 day') + interval '21 hours 15 minutes', 118, 74, 'Noite.', now() - interval '1 day', now() - interval '1 day'),
    ('b2000000-0000-4000-8000-000000000403', target_partner_id, 'a1000000-0000-4000-8000-000000000301', date_trunc('day', now() - interval '2 days') + interval '11 hours 30 minutes', 122, 78, 'Manhã.', now() - interval '2 days', now() - interval '2 days');

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
    ('b1000000-0000-4000-8000-000000000602', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'a1000000-0000-4000-8000-000000000701', 'treino', 'Treino', 'Hipertrofia 5x/semana', 'Divisão Upper/Lower'),
    ('b1000000-0000-4000-8000-000000000603', target_partner_id, 'a1000000-0000-4000-8000-000000000301', 'a1000000-0000-4000-8000-000000000701', 'saude', 'Saúde', 'Indicadores e check-ins', 'Sono, pressão e exames');

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

-- Super Admin local persistente entre resets do Supabase.
do $$
declare
  admin_email text := 'antoniofelipe258@gmail.com';
  admin_password text := '123456';
  admin_user_id uuid;
  admin_profile_id uuid;
begin
  select id into admin_user_id
  from auth.users
  where lower(email) = lower(admin_email)
  order by created_at nulls last
  limit 1;

  if admin_user_id is null then
    admin_user_id := 'a2000000-0000-4000-8000-000000000001';
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
      admin_user_id,
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_password, gen_salt('bf')),
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
      encrypted_password = crypt(admin_password, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      updated_at = now()
    where id = admin_user_id;
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
    admin_user_id::text,
    admin_user_id,
    jsonb_build_object(
      'sub', admin_user_id::text,
      'email', admin_email,
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

  select id into admin_profile_id
  from public.profiles
  where user_id = admin_user_id or lower(email) = lower(admin_email)
  order by created_at nulls last
  limit 1;

  if admin_profile_id is null then
    admin_profile_id := 'a2000000-0000-4000-8000-000000000101';
    insert into public.profiles (
      id,
      user_id,
      email,
      phone,
      display_name,
      role,
      status,
      email_confirmed_at,
      created_at,
      updated_at
    )
    values (
      admin_profile_id,
      admin_user_id,
      admin_email,
      '+5511970000000',
      'Admin Local',
      'admin',
      'active',
      now(),
      now(),
      now()
    );
  else
    update public.profiles
    set
      user_id = admin_user_id,
      email = admin_email,
      display_name = 'Admin Local',
      role = 'admin',
      status = 'active',
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = admin_profile_id;
  end if;

  insert into public.admins (profile_id)
  values (admin_profile_id)
  on conflict (profile_id) do nothing;
end $$;
