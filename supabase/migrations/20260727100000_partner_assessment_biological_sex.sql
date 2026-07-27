-- Biological sex is clinical calculation data and deliberately distinct from
-- the existing patients.gender identity/presentation field.
alter table public.patients
  add column if not exists biological_sex text not null default 'not_informed',
  add constraint patients_biological_sex_check
    check (biological_sex in ('female', 'male', 'not_informed'));

create index if not exists patients_biological_sex_idx
  on public.patients (biological_sex)
  where biological_sex <> 'not_informed';

alter function public.partner_client_assessments(uuid)
  rename to partner_client_assessments_legacy_20260727;
revoke all on function public.partner_client_assessments_legacy_20260727(uuid)
  from public, anon, authenticated;

create function public.partner_client_assessments(p_patient_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_partner_id uuid := public.current_active_partner_id();
  assessment_data jsonb;
  sex text;
begin
  if auth.uid() is null or current_partner_id is null or not public.current_partner_has_patient_link(p_patient_id) then
    return null;
  end if;

  assessment_data := public.partner_client_assessments_legacy_20260727(p_patient_id);
  if assessment_data is null then return null; end if;
  select biological_sex into sex from public.patients where id = p_patient_id;
  return jsonb_set(assessment_data, '{identity,biologicalSex}', to_jsonb(coalesce(sex, 'not_informed'::text)), true);
end;
$$;

revoke all on function public.partner_client_assessments(uuid) from public, anon;
grant execute on function public.partner_client_assessments(uuid) to authenticated;

alter function public.partner_client_overview(uuid)
  rename to partner_client_overview_legacy_20260727;
revoke all on function public.partner_client_overview_legacy_20260727(uuid)
  from public, anon, authenticated;

create function public.partner_client_overview(p_patient_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  overview_data jsonb;
  sex text;
begin
  if auth.uid() is null or public.current_active_partner_id() is null
    or not public.current_partner_has_patient_link(p_patient_id) then
    return null;
  end if;

  overview_data := public.partner_client_overview_legacy_20260727(p_patient_id);
  if overview_data is null then return null; end if;

  select biological_sex into sex
  from public.patients
  where id = p_patient_id;

  return jsonb_set(
    overview_data,
    '{identity,biologicalSex}',
    to_jsonb(coalesce(sex, 'not_informed'::text)),
    true
  );
end;
$$;

revoke all on function public.partner_client_overview(uuid) from public, anon;
grant execute on function public.partner_client_overview(uuid) to authenticated;

create function public.provision_client_for_partner_records(
  p_caller_profile_id uuid, p_idempotency_key uuid, p_request_hash text,
  p_auth_user_id uuid, p_email text, p_phone text, p_display_name text,
  p_cpf text, p_birth_date date, p_objective text, p_biological_sex text,
  p_service_scopes text[], p_invite_status text
)
returns table (
  result_status text, profile_id uuid, patient_id uuid, relationship_ids uuid[],
  result_service_scopes text[], result_invite_status text
)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  provisioned record;
  existing_sex text;
begin
  if p_biological_sex not in ('female', 'male', 'not_informed') then
    raise exception using errcode = 'P0001', message = 'PROVISION_CLIENT_FOR_PARTNER_INVALID_PAYLOAD';
  end if;

  select * into provisioned from public.provision_client_for_partner_records(
    p_caller_profile_id, p_idempotency_key, p_request_hash, p_auth_user_id,
    p_email, p_phone, p_display_name, p_cpf, p_birth_date, p_objective,
    p_service_scopes, p_invite_status
  );

  select biological_sex into existing_sex from public.patients where id = provisioned.patient_id for update;
  if existing_sex <> 'not_informed' and existing_sex <> p_biological_sex then
    raise exception using errcode = 'P0001', message = 'PROVISION_CLIENT_FOR_PARTNER_DATA_CONFLICT';
  end if;
  update public.patients set biological_sex = p_biological_sex where id = provisioned.patient_id;

  return query select provisioned.result_status, provisioned.profile_id,
    provisioned.patient_id, provisioned.relationship_ids,
    provisioned.result_service_scopes, provisioned.result_invite_status;
end;
$$;

revoke all on function public.provision_client_for_partner_records(
  uuid, uuid, text, uuid, text, text, text, text, date, text, text, text[], text
) from public, anon, authenticated;
grant execute on function public.provision_client_for_partner_records(
  uuid, uuid, text, uuid, text, text, text, text, date, text, text, text[], text
) to service_role;

create function public.complete_partner_client_profile(
  p_patient_id uuid, p_birth_date date, p_biological_sex text, p_objective text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or public.current_active_partner_id() is null
    or not public.current_partner_has_patient_link(p_patient_id) then
    return false;
  end if;
  if p_birth_date is null or p_birth_date > current_date
    or p_biological_sex not in ('female', 'male', 'not_informed')
    or nullif(btrim(p_objective), '') is null or length(btrim(p_objective)) > 120 then
    raise exception 'invalid client profile data' using errcode = '22023';
  end if;
  update public.patients set birth_date = p_birth_date,
    biological_sex = p_biological_sex, objective = btrim(p_objective)
  where id = p_patient_id;
  return found;
end;
$$;

revoke all on function public.complete_partner_client_profile(uuid, date, text, text) from public, anon;
grant execute on function public.complete_partner_client_profile(uuid, date, text, text) to authenticated;
