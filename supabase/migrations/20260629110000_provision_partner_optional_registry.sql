-- Ajuste F.2.1: registro profissional deixa de ser obrigatório no MVP.
-- Mantém compatibilidade quando professional_registry_type/number forem enviados em conjunto.

create or replace function public.provision_partner_records(
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
  normalized_registry_type text := nullif(lower(btrim(p_professional_registry_type)), '');
  normalized_registry_number text := nullif(btrim(p_professional_registry_number), '');
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
    or (
      (normalized_registry_type is null and normalized_registry_number is not null)
      or (normalized_registry_type is not null and normalized_registry_number is null)
      or (
        normalized_registry_type is not null
        and normalized_registry_type not in ('crm', 'crn', 'cref', 'outro')
      )
    )
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
    or target_partner.professional_registry_type is distinct from normalized_registry_type
    or target_partner.professional_registry_number is distinct from normalized_registry_number
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
is 'Grava profiles e partners atomicamente. No MVP, registro profissional é opcional e, quando enviado, deve vir em par tipo/número.';
