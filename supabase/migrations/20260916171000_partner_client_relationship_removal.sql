-- Encerramento seguro do vínculo de um Cliente na carteira do Parceiro.
-- A conta e o histórico do Cliente são preservados; somente os vínculos deste Parceiro são desativados.

create or replace function public.current_partner_has_patient_link(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.partner_clients as relationship
    where relationship.partner_id = public.current_active_partner_id()
      and relationship.patient_id = target_patient_id
      and relationship.status in ('pending', 'active', 'suspended')
  );
$$;

create or replace function public.partner_clients_list()
returns table (
  patient_id uuid,
  profile_id uuid,
  display_name text,
  email text,
  phone text,
  age_years integer,
  objective text,
  service_scopes text[],
  relationship_status text,
  started_at timestamptz,
  last_update_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with current_partner as (
    select public.current_active_partner_id() as id
  ),
  links as (
    select
      relationship.patient_id,
      array_agg(distinct relationship.service_scope order by relationship.service_scope) as service_scopes,
      bool_or(relationship.status = 'active') as has_active,
      bool_or(relationship.status = 'pending') as has_pending,
      bool_or(relationship.status = 'suspended') as has_suspended,
      min(relationship.started_at) as started_at,
      max(
        greatest(
          relationship.created_at,
          relationship.updated_at,
          coalesce(relationship.ended_at, relationship.updated_at)
        )
      ) as relationship_updated_at
    from public.partner_clients as relationship
    join current_partner on current_partner.id = relationship.partner_id
    where relationship.status <> 'disabled'
    group by relationship.patient_id
  )
  select
    patient.id as patient_id,
    profile.id as profile_id,
    profile.display_name,
    profile.email,
    profile.phone,
    case
      when patient.birth_date is null then null
      else extract(year from age(current_date, patient.birth_date))::integer
    end as age_years,
    patient.objective,
    links.service_scopes,
    case
      when links.has_active then 'active'
      when links.has_pending then 'pending'
      when links.has_suspended then 'suspended'
      else 'inactive'
    end as relationship_status,
    links.started_at,
    greatest(profile.updated_at, patient.updated_at, links.relationship_updated_at) as last_update_at
  from links
  join public.patients as patient on patient.id = links.patient_id
  join public.profiles as profile on profile.id = patient.profile_id
  where profile.role = 'cliente'
  order by profile.display_name asc, profile.email asc;
$$;

create function public.remove_partner_client(p_patient_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_partner_id uuid := public.current_active_partner_id();
begin
  if auth.uid() is null or current_partner_id is null or p_patient_id is null then
    return false;
  end if;

  update public.partner_clients as relationship
  set
    status = 'disabled',
    ended_at = greatest(now(), relationship.started_at)
  where relationship.partner_id = current_partner_id
    and relationship.patient_id = p_patient_id
    and relationship.status in ('pending', 'active', 'suspended');

  return found;
end;
$$;

comment on function public.remove_partner_client(uuid)
is 'Encerra todos os vínculos abertos entre o Parceiro autenticado e o Cliente, sem apagar a conta ou o histórico do Cliente.';

revoke all on function public.current_partner_has_patient_link(uuid) from public;
revoke all on function public.partner_clients_list() from public;
revoke all on function public.remove_partner_client(uuid) from public, anon;

grant execute on function public.current_partner_has_patient_link(uuid) to authenticated;
grant execute on function public.partner_clients_list() to authenticated;
grant execute on function public.remove_partner_client(uuid) to authenticated;
