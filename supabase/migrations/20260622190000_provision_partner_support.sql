-- Suporte mínimo ao provisionamento idempotente de Parceiros.
-- Escopo: telefone canônico, ledger de provisionamento e transação relacional.

alter table public.profiles
add column phone text;

alter table public.profiles
add constraint profiles_phone_check
check (
  phone is null
  or phone ~ '^\+[1-9][0-9]{7,14}$'
);

alter table public.partners
add constraint partners_professional_registry_type_check
check (
  professional_registry_type is null
  or professional_registry_type in ('crm', 'crn', 'cref', 'outro')
);

create table public.provisioning_operations (
  id uuid primary key default gen_random_uuid(),
  operation_type text not null,
  idempotency_key uuid not null,
  caller_profile_id uuid not null,
  request_hash text not null,
  status text not null default 'pending',
  auth_user_id uuid,
  resource_profile_id uuid,
  resource_partner_id uuid,
  invite_status text not null default 'not_started',
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint provisioning_operations_caller_profile_id_fkey
    foreign key (caller_profile_id) references public.profiles(id) on delete restrict,
  constraint provisioning_operations_auth_user_id_fkey
    foreign key (auth_user_id) references auth.users(id) on delete restrict,
  constraint provisioning_operations_resource_profile_id_fkey
    foreign key (resource_profile_id) references public.profiles(id) on delete restrict,
  constraint provisioning_operations_resource_partner_id_fkey
    foreign key (resource_partner_id) references public.partners(id) on delete restrict,
  constraint provisioning_operations_operation_type_check
    check (operation_type in ('provision_partner')),
  constraint provisioning_operations_request_hash_check
    check (request_hash ~ '^[0-9a-f]{64}$'),
  constraint provisioning_operations_status_check
    check (status in ('pending', 'completed', 'failed', 'manual_review_required')),
  constraint provisioning_operations_invite_status_check
    check (invite_status in ('not_started', 'pending_delivery', 'sent', 'failed', 'not_resent')),
  constraint provisioning_operations_error_code_not_blank
    check (error_code is null or length(btrim(error_code)) > 0),
  constraint provisioning_operations_idempotency_key
    unique (operation_type, caller_profile_id, idempotency_key)
);

create index provisioning_operations_caller_created_idx
  on public.provisioning_operations (caller_profile_id, created_at desc);

create index provisioning_operations_status_idx
  on public.provisioning_operations (status, updated_at);

create index provisioning_operations_auth_user_idx
  on public.provisioning_operations (auth_user_id);

create index provisioning_operations_resource_profile_idx
  on public.provisioning_operations (resource_profile_id);

create index provisioning_operations_resource_partner_idx
  on public.provisioning_operations (resource_partner_id);

create trigger provisioning_operations_set_updated_at
before update on public.provisioning_operations
for each row execute function public.set_updated_at();

alter table public.provisioning_operations enable row level security;

revoke all on table public.provisioning_operations from public, anon, authenticated;
grant select, insert, update on table public.provisioning_operations to service_role;

-- A service_role ignora RLS, mas ainda precisa de privilégios SQL explícitos.
-- Estes grants ficam limitados às tabelas usadas pela operação transacional.
grant select on table public.admins to service_role;
grant select, insert, update on table public.profiles to service_role;
grant select, insert, update on table public.partners to service_role;

create function public.provision_partner_records(
  p_caller_profile_id uuid,
  p_idempotency_key uuid,
  p_request_hash text,
  p_auth_user_id uuid,
  p_email text,
  p_phone text,
  p_display_name text,
  p_professional_name text,
  p_professional_type text,
  p_professional_registry_type text,
  p_professional_registry_number text,
  p_invite_status text
)
returns table (
  result_status text,
  profile_id uuid,
  partner_id uuid,
  result_invite_status text
)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  operation_record public.provisioning_operations%rowtype;
  profile_by_user public.profiles%rowtype;
  profile_by_email public.profiles%rowtype;
  target_profile public.profiles%rowtype;
  target_partner public.partners%rowtype;
  normalized_email text := lower(btrim(p_email));
  normalized_display_name text := btrim(p_display_name);
  normalized_professional_name text := btrim(p_professional_name);
  normalized_registry_type text := lower(btrim(p_professional_registry_type));
  normalized_registry_number text := btrim(p_professional_registry_number);
  operation_result text := 'created';
begin
  if not exists (
    select 1
    from public.profiles as caller
    join public.admins as admin on admin.profile_id = caller.id
    where caller.id = p_caller_profile_id
      and caller.role = 'admin'
      and caller.status = 'active'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_PARTNER_FORBIDDEN';
  end if;

  if p_request_hash !~ '^[0-9a-f]{64}$' then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_PARTNER_INVALID_REQUEST_HASH';
  end if;

  if normalized_email = ''
    or p_phone !~ '^\+[1-9][0-9]{7,14}$'
    or normalized_display_name = ''
    or normalized_professional_name = ''
    or p_professional_type not in ('personal_trainer', 'nutricionista', 'medico')
    or normalized_registry_type not in ('crm', 'crn', 'cref', 'outro')
    or normalized_registry_number = ''
    or p_invite_status not in ('pending_delivery', 'not_resent')
  then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_PARTNER_INVALID_PAYLOAD';
  end if;

  insert into public.provisioning_operations (
    operation_type,
    idempotency_key,
    caller_profile_id,
    request_hash,
    status,
    auth_user_id,
    invite_status
  )
  values (
    'provision_partner',
    p_idempotency_key,
    p_caller_profile_id,
    p_request_hash,
    'pending',
    p_auth_user_id,
    p_invite_status
  )
  on conflict (operation_type, caller_profile_id, idempotency_key)
  do nothing;

  select operation.*
  into operation_record
  from public.provisioning_operations as operation
  where operation.operation_type = 'provision_partner'
    and operation.caller_profile_id = p_caller_profile_id
    and operation.idempotency_key = p_idempotency_key
  for update;

  if operation_record.request_hash <> p_request_hash then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_PARTNER_IDEMPOTENCY_KEY_REUSED';
  end if;

  if operation_record.auth_user_id is distinct from p_auth_user_id then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_PARTNER_IDENTITY_CONFLICT';
  end if;

  if operation_record.status = 'completed' then
    return query
    select
      'existing'::text,
      operation_record.resource_profile_id,
      operation_record.resource_partner_id,
      operation_record.invite_status;
    return;
  end if;

  select profile.*
  into profile_by_user
  from public.profiles as profile
  where profile.user_id = p_auth_user_id
  for update;

  select profile.*
  into profile_by_email
  from public.profiles as profile
  where lower(profile.email) = normalized_email
  for update;

  if profile_by_user.id is not null
    and profile_by_email.id is not null
    and profile_by_user.id <> profile_by_email.id
  then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_PARTNER_IDENTITY_CONFLICT';
  end if;

  if profile_by_user.id is not null then
    target_profile := profile_by_user;
  elsif profile_by_email.id is not null then
    target_profile := profile_by_email;
  end if;

  if target_profile.id is null then
    insert into public.profiles (
      user_id,
      email,
      phone,
      display_name,
      role,
      status
    )
    values (
      p_auth_user_id,
      normalized_email,
      p_phone,
      normalized_display_name,
      'parceiro',
      'active'
    )
    returning * into target_profile;
  else
    operation_result := 'existing';

    if target_profile.user_id <> p_auth_user_id
      or lower(target_profile.email) <> normalized_email
    then
      raise exception using
        errcode = 'P0001',
        message = 'PROVISION_PARTNER_IDENTITY_CONFLICT';
    end if;

    if target_profile.role <> 'parceiro' then
      raise exception using
        errcode = 'P0001',
        message = 'PROVISION_PARTNER_EMAIL_ROLE_CONFLICT';
    end if;

    if target_profile.status <> 'active'
      or target_profile.phone is distinct from p_phone
      or target_profile.display_name <> normalized_display_name
    then
      raise exception using
        errcode = 'P0001',
        message = 'PROVISION_PARTNER_DATA_CONFLICT';
    end if;
  end if;

  select partner.*
  into target_partner
  from public.partners as partner
  where partner.profile_id = target_profile.id
  for update;

  if target_partner.id is null then
    if operation_result = 'existing' then
      operation_result := 'reconciled';
    end if;

    insert into public.partners (
      profile_id,
      professional_name,
      professional_type,
      professional_registry_type,
      professional_registry_number
    )
    values (
      target_profile.id,
      normalized_professional_name,
      p_professional_type,
      normalized_registry_type,
      normalized_registry_number
    )
    returning * into target_partner;
  elsif target_partner.professional_name <> normalized_professional_name
    or target_partner.professional_type <> p_professional_type
    or target_partner.professional_registry_type <> normalized_registry_type
    or target_partner.professional_registry_number <> normalized_registry_number
  then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_PARTNER_DATA_CONFLICT';
  end if;

  update public.provisioning_operations
  set
    status = 'completed',
    resource_profile_id = target_profile.id,
    resource_partner_id = target_partner.id,
    invite_status = p_invite_status,
    error_code = null
  where id = operation_record.id
  returning * into operation_record;

  return query
  select
    operation_result,
    target_profile.id,
    target_partner.id,
    operation_record.invite_status;
end;
$$;

comment on table public.provisioning_operations
is 'Ledger interno de idempotência e auditoria mínima para operações privilegiadas de provisionamento.';

comment on function public.provision_partner_records(
  uuid,
  uuid,
  text,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
)
is 'Grava profiles e partners atomicamente, com validação defensiva do Super Admin e idempotência.';

revoke all on function public.provision_partner_records(
  uuid,
  uuid,
  text,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.provision_partner_records(
  uuid,
  uuid,
  text,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to service_role;
