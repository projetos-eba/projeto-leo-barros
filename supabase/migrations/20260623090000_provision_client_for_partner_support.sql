-- Suporte ao provisionamento idempotente de Clientes por Parceiros.
-- Escopo: ledger, transação relacional e privilégios mínimos da service_role.

alter table public.provisioning_operations
drop constraint provisioning_operations_operation_type_check;

alter table public.provisioning_operations
add constraint provisioning_operations_operation_type_check
check (
  operation_type in (
    'provision_partner',
    'provision_client_for_partner'
  )
);

alter table public.provisioning_operations
add column resource_patient_id uuid;

alter table public.provisioning_operations
add constraint provisioning_operations_resource_patient_id_fkey
foreign key (resource_patient_id)
references public.patients(id)
on delete restrict;

create index provisioning_operations_resource_patient_idx
  on public.provisioning_operations (resource_patient_id);

-- SELECT ... FOR UPDATE exige UPDATE, mesmo quando a operação não altera
-- diretamente uma linha já existente.
grant select, insert, update on table public.patients to service_role;
grant select, insert, update on table public.partner_clients to service_role;

create function public.provision_client_for_partner_records(
  p_caller_profile_id uuid,
  p_idempotency_key uuid,
  p_request_hash text,
  p_auth_user_id uuid,
  p_email text,
  p_phone text,
  p_display_name text,
  p_cpf text,
  p_birth_date date,
  p_objective text,
  p_service_scopes text[],
  p_invite_status text
)
returns table (
  result_status text,
  profile_id uuid,
  patient_id uuid,
  relationship_ids uuid[],
  result_service_scopes text[],
  result_invite_status text
)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  operation_record public.provisioning_operations%rowtype;
  caller_partner public.partners%rowtype;
  profile_by_user public.profiles%rowtype;
  profile_by_email public.profiles%rowtype;
  patient_by_cpf public.patients%rowtype;
  target_profile public.profiles%rowtype;
  target_patient public.patients%rowtype;
  normalized_email text := lower(btrim(p_email));
  normalized_display_name text := btrim(p_display_name);
  normalized_cpf text := nullif(btrim(p_cpf), '');
  normalized_objective text := nullif(btrim(p_objective), '');
  normalized_scopes text[];
  existing_scope_count integer := 0;
  inserted_scope_count integer := 0;
  operation_result text := 'created';
begin
  select partner.*
  into caller_partner
  from public.profiles as caller
  join public.partners as partner on partner.profile_id = caller.id
  where caller.id = p_caller_profile_id
    and caller.role = 'parceiro'
    and caller.status = 'active'
  for update of caller, partner;

  if caller_partner.id is null then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_CLIENT_FOR_PARTNER_FORBIDDEN';
  end if;

  select array_agg(scope order by scope)
  into normalized_scopes
  from unnest(p_service_scopes) as scope;

  if p_request_hash !~ '^[0-9a-f]{64}$' then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_CLIENT_FOR_PARTNER_INVALID_REQUEST_HASH';
  end if;

  if normalized_email = ''
    or p_phone !~ '^\+[1-9][0-9]{7,14}$'
    or normalized_display_name = ''
    or normalized_scopes is null
    or cardinality(normalized_scopes) = 0
    or exists (
      select 1
      from unnest(normalized_scopes) as scope
      where scope not in ('dieta', 'treino', 'saude', 'cardio')
    )
    or (
      select count(*)
      from unnest(normalized_scopes) as scope
    ) <> (
      select count(distinct scope)
      from unnest(normalized_scopes) as scope
    )
    or (normalized_cpf is not null and normalized_cpf !~ '^[0-9]{11}$')
    or (p_birth_date is not null and p_birth_date > current_date)
    or (normalized_objective is not null and length(normalized_objective) > 120)
    or p_invite_status not in ('pending_delivery', 'not_resent')
  then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_CLIENT_FOR_PARTNER_INVALID_PAYLOAD';
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
    'provision_client_for_partner',
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
  where operation.operation_type = 'provision_client_for_partner'
    and operation.caller_profile_id = p_caller_profile_id
    and operation.idempotency_key = p_idempotency_key
  for update;

  if operation_record.request_hash <> p_request_hash then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_CLIENT_FOR_PARTNER_IDEMPOTENCY_KEY_REUSED';
  end if;

  if operation_record.auth_user_id is distinct from p_auth_user_id then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_CLIENT_FOR_PARTNER_IDENTITY_CONFLICT';
  end if;

  if operation_record.status = 'completed' then
    return query
    select
      'existing'::text,
      operation_record.resource_profile_id,
      operation_record.resource_patient_id,
      coalesce(
        (
          select array_agg(link.id order by link.service_scope)
          from public.partner_clients as link
          where link.partner_id = caller_partner.id
            and link.patient_id = operation_record.resource_patient_id
            and link.service_scope = any(normalized_scopes)
            and link.status = 'active'
        ),
        array[]::uuid[]
      ),
      normalized_scopes,
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

  if normalized_cpf is not null then
    select patient.*
    into patient_by_cpf
    from public.patients as patient
    where patient.cpf = normalized_cpf
    for update;
  end if;

  if profile_by_user.id is not null
    and profile_by_email.id is not null
    and profile_by_user.id <> profile_by_email.id
  then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_CLIENT_FOR_PARTNER_IDENTITY_CONFLICT';
  end if;

  if profile_by_user.id is not null then
    target_profile := profile_by_user;
  elsif profile_by_email.id is not null then
    target_profile := profile_by_email;
  end if;

  if patient_by_cpf.id is not null
    and (
      target_profile.id is null
      or patient_by_cpf.profile_id <> target_profile.id
    )
  then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_CLIENT_FOR_PARTNER_CPF_CONFLICT';
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
      'cliente',
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
        message = 'PROVISION_CLIENT_FOR_PARTNER_IDENTITY_CONFLICT';
    end if;

    if target_profile.role <> 'cliente' then
      raise exception using
        errcode = 'P0001',
        message = 'PROVISION_CLIENT_FOR_PARTNER_EMAIL_ROLE_CONFLICT';
    end if;

    if target_profile.status <> 'active'
      or target_profile.phone is distinct from p_phone
      or target_profile.display_name <> normalized_display_name
    then
      raise exception using
        errcode = 'P0001',
        message = 'PROVISION_CLIENT_FOR_PARTNER_DATA_CONFLICT';
    end if;
  end if;

  select patient.*
  into target_patient
  from public.patients as patient
  where patient.profile_id = target_profile.id
  for update;

  if target_patient.id is null then
    if operation_result = 'existing' then
      operation_result := 'reconciled';
    end if;

    insert into public.patients (
      profile_id,
      cpf,
      birth_date,
      objective
    )
    values (
      target_profile.id,
      normalized_cpf,
      p_birth_date,
      normalized_objective
    )
    returning * into target_patient;
  elsif target_patient.cpf is distinct from normalized_cpf
    or target_patient.birth_date is distinct from p_birth_date
    or target_patient.objective is distinct from normalized_objective
  then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_CLIENT_FOR_PARTNER_DATA_CONFLICT';
  end if;

  if exists (
    select 1
    from public.partner_clients as link
    where link.patient_id = target_patient.id
      and link.service_scope = any(normalized_scopes)
      and link.status = 'active'
      and link.partner_id <> caller_partner.id
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_CLIENT_FOR_PARTNER_SCOPE_CONFLICT';
  end if;

  select count(*)
  into existing_scope_count
  from public.partner_clients as link
  where link.partner_id = caller_partner.id
    and link.patient_id = target_patient.id
    and link.service_scope = any(normalized_scopes)
    and link.status = 'active';

  insert into public.partner_clients (
    partner_id,
    patient_id,
    service_scope,
    status
  )
  select
    caller_partner.id,
    target_patient.id,
    scope,
    'active'
  from unnest(normalized_scopes) as scope
  where not exists (
    select 1
    from public.partner_clients as link
    where link.partner_id = caller_partner.id
      and link.patient_id = target_patient.id
      and link.service_scope = scope
      and link.status in ('pending', 'active', 'suspended')
  );

  get diagnostics inserted_scope_count = row_count;

  if operation_result = 'existing' and inserted_scope_count > 0 then
    operation_result := 'reconciled';
  end if;

  if existing_scope_count + inserted_scope_count <> cardinality(normalized_scopes) then
    raise exception using
      errcode = 'P0001',
      message = 'PROVISION_CLIENT_FOR_PARTNER_RELATIONSHIP_CONFLICT';
  end if;

  update public.provisioning_operations
  set
    status = 'completed',
    resource_profile_id = target_profile.id,
    resource_patient_id = target_patient.id,
    invite_status = p_invite_status,
    error_code = null
  where id = operation_record.id
  returning * into operation_record;

  return query
  select
    operation_result,
    target_profile.id,
    target_patient.id,
    (
      select array_agg(link.id order by link.service_scope)
      from public.partner_clients as link
      where link.partner_id = caller_partner.id
        and link.patient_id = target_patient.id
        and link.service_scope = any(normalized_scopes)
        and link.status = 'active'
    ),
    normalized_scopes,
    operation_record.invite_status;
end;
$$;

comment on function public.provision_client_for_partner_records(
  uuid,
  uuid,
  text,
  uuid,
  text,
  text,
  text,
  text,
  date,
  text,
  text[],
  text
)
is 'Grava Cliente, Patient, vínculos por escopo e ledger atomicamente após validar o Parceiro chamador.';

revoke all on function public.provision_client_for_partner_records(
  uuid,
  uuid,
  text,
  uuid,
  text,
  text,
  text,
  text,
  date,
  text,
  text[],
  text
) from public, anon, authenticated;

grant execute on function public.provision_client_for_partner_records(
  uuid,
  uuid,
  text,
  uuid,
  text,
  text,
  text,
  text,
  date,
  text,
  text[],
  text
) to service_role;
