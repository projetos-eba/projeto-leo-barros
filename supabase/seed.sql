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

  delete from public.partner_client_plan_subscriptions
  where partner_id = target_partner_id
    and (
      custom_plan_id between 'a1000000-0000-4000-8000-000000000601' and 'a1000000-0000-4000-8000-000000000603'
      or patient_id between 'a1000000-0000-4000-8000-000000000301' and 'a1000000-0000-4000-8000-000000000306'
    );

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
    created_at,
    updated_at
  )
  values
    ('a1000000-0000-4000-8000-000000000301', 'a1000000-0000-4000-8000-000000000701', '90000000001', '+5511988800011', current_date - interval '29 years', 'Hipertrofia', now() - interval '6 months', now() - interval '2 days'),
    ('a1000000-0000-4000-8000-000000000302', 'a1000000-0000-4000-8000-000000000702', '90000000002', '+5511988800012', current_date - interval '34 years', 'Emagrecimento', now() - interval '5 months', now() - interval '5 days'),
    ('a1000000-0000-4000-8000-000000000303', 'a1000000-0000-4000-8000-000000000703', '90000000003', '+5511988800013', current_date - interval '41 years', 'Força e mobilidade', now() - interval '4 months', now() - interval '10 days'),
    ('a1000000-0000-4000-8000-000000000304', 'a1000000-0000-4000-8000-000000000704', '90000000004', '+5511988800014', current_date - interval '26 years', 'Performance', now() - interval '3 months', now() - interval '35 days'),
    ('a1000000-0000-4000-8000-000000000305', 'a1000000-0000-4000-8000-000000000705', '90000000005', '+5511988800015', current_date - interval '38 years', 'Condicionamento', now() - interval '2 months', now() - interval '1 day'),
    ('a1000000-0000-4000-8000-000000000306', 'a1000000-0000-4000-8000-000000000706', '90000000006', '+5511988800016', current_date - interval '32 years', 'Retorno gradual', now() - interval '1 month', now() - interval '45 days');

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
