-- Admin P0/P1: perfis administrativos, auditoria imutável e leituras sanitizadas
-- do schema auth. Nenhuma informação de sessão sensível é exposta via Data API.

create table public.admin_role_assignments (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  role_key text not null,
  assigned_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_role_assignments_role_key_check
    check (role_key in ('owner', 'operator', 'viewer'))
);

create table public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action_key text not null,
  resource_type text not null,
  resource_id uuid,
  target_profile_id uuid references public.profiles(id) on delete set null,
  outcome text not null default 'succeeded',
  request_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_audit_events_action_key_not_blank check (length(btrim(action_key)) > 0),
  constraint admin_audit_events_resource_type_not_blank check (length(btrim(resource_type)) > 0),
  constraint admin_audit_events_outcome_check check (outcome in ('attempted', 'succeeded', 'failed', 'denied')),
  constraint admin_audit_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index admin_audit_events_created_idx
  on public.admin_audit_events (created_at desc);
create index admin_audit_events_target_created_idx
  on public.admin_audit_events (target_profile_id, created_at desc);
create index admin_audit_events_resource_created_idx
  on public.admin_audit_events (resource_type, resource_id, created_at desc);

create trigger admin_role_assignments_set_updated_at
before update on public.admin_role_assignments
for each row execute function public.set_updated_at();

insert into public.admin_role_assignments (profile_id, role_key)
select profile.id, 'owner'
from public.profiles as profile
join public.admins as admin on admin.profile_id = profile.id
where profile.role = 'admin'
  and profile.status = 'active'
on conflict (profile_id) do nothing;

-- Preserva o comportamento dos fluxos administrativos existentes: um Admin
-- provisionado recebe Owner até que outro Owner atribua uma função diferente.
create or replace function public.assign_default_admin_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.admin_role_assignments (profile_id, role_key)
  values (new.profile_id, 'owner')
  on conflict (profile_id) do nothing;
  return new;
end;
$$;

drop trigger if exists admins_assign_default_role on public.admins;
create trigger admins_assign_default_role
after insert on public.admins
for each row execute function public.assign_default_admin_role();

create or replace function public.current_active_admin_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select profile.id
  from public.profiles as profile
  join public.admins as admin on admin.profile_id = profile.id
  where profile.user_id = auth.uid()
    and profile.role = 'admin'
    and profile.status = 'active'
  limit 1;
$$;

create or replace function public.admin_has_capability(p_capability text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select case assignment.role_key
      when 'owner' then true
      when 'operator' then p_capability in (
        'dashboard.read',
        'professional.read',
        'professional.status.write',
        'client.read',
        'finance.read',
        'support.read',
        'support.write'
      )
      when 'viewer' then p_capability in (
        'dashboard.read',
        'professional.read',
        'client.read',
        'finance.read',
        'support.read'
      )
      else false
    end
    from public.admin_role_assignments as assignment
    where assignment.profile_id = public.current_active_admin_profile_id()
    limit 1
  ), false);
$$;

create or replace function public.current_admin_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select assignment.role_key
  from public.admin_role_assignments as assignment
  where assignment.profile_id = public.current_active_admin_profile_id()
  limit 1;
$$;

create or replace function public.admin_record_audit_event(
  p_actor_profile_id uuid,
  p_action_key text,
  p_resource_type text,
  p_resource_id uuid default null,
  p_target_profile_id uuid default null,
  p_outcome text default 'succeeded',
  p_request_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  event_id uuid;
begin
  if p_actor_profile_id is distinct from public.current_active_admin_profile_id()
    and auth.role() <> 'service_role' then
    raise exception 'ADMIN_AUDIT_FORBIDDEN' using errcode = 'P0001';
  end if;

  if p_action_key is null or btrim(p_action_key) = ''
    or p_resource_type is null or btrim(p_resource_type) = ''
    or p_outcome not in ('attempted', 'succeeded', 'failed', 'denied')
    or jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'ADMIN_AUDIT_INVALID' using errcode = 'P0001';
  end if;

  insert into public.admin_audit_events (
    actor_profile_id, action_key, resource_type, resource_id,
    target_profile_id, outcome, request_id, metadata
  ) values (
    p_actor_profile_id, btrim(p_action_key), btrim(p_resource_type), p_resource_id,
    p_target_profile_id, p_outcome, p_request_id, coalesce(p_metadata, '{}'::jsonb)
  ) returning id into event_id;

  return event_id;
end;
$$;

create or replace function public.admin_assign_role(
  p_actor_profile_id uuid,
  p_target_profile_id uuid,
  p_role_key text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  previous_role text;
begin
  if not public.admin_has_capability('permissions.manage')
    or p_actor_profile_id is distinct from public.current_active_admin_profile_id() then
    raise exception 'ADMIN_PERMISSION_FORBIDDEN' using errcode = 'P0001';
  end if;

  if p_role_key not in ('owner', 'operator', 'viewer') then
    raise exception 'ADMIN_PERMISSION_INVALID_ROLE' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.profiles as profile
    join public.admins as admin on admin.profile_id = profile.id
    where profile.id = p_target_profile_id and profile.role = 'admin'
  ) then
    raise exception 'ADMIN_PERMISSION_TARGET_NOT_FOUND' using errcode = 'P0001';
  end if;

  select role_key into previous_role
  from public.admin_role_assignments
  where profile_id = p_target_profile_id
  for update;

  insert into public.admin_role_assignments (profile_id, role_key, assigned_by_profile_id)
  values (p_target_profile_id, p_role_key, p_actor_profile_id)
  on conflict (profile_id) do update set
    role_key = excluded.role_key,
    assigned_by_profile_id = excluded.assigned_by_profile_id,
    updated_at = now();

  perform public.admin_record_audit_event(
    p_actor_profile_id,
    'admin.role.changed',
    'admin_role_assignment',
    null,
    p_target_profile_id,
    'succeeded',
    null,
    jsonb_build_object('previousRole', previous_role, 'role', p_role_key)
  );

  return p_role_key;
end;
$$;

create or replace function public.admin_set_professional_status(
  p_actor_profile_id uuid,
  p_partner_id uuid,
  p_status text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_profile_id uuid;
  previous_status text;
begin
  if not public.admin_has_capability('professional.status.write')
    or p_actor_profile_id is distinct from public.current_active_admin_profile_id() then
    raise exception 'ADMIN_PROFESSIONAL_FORBIDDEN' using errcode = 'P0001';
  end if;

  if p_status not in ('active', 'suspended', 'disabled') then
    raise exception 'ADMIN_PROFESSIONAL_INVALID_STATUS' using errcode = 'P0001';
  end if;

  select profile.id, profile.status
  into target_profile_id, previous_status
  from public.partners as partner
  join public.profiles as profile on profile.id = partner.profile_id
  where partner.id = p_partner_id
  for update of profile;

  if target_profile_id is null then
    raise exception 'ADMIN_PROFESSIONAL_NOT_FOUND' using errcode = 'P0001';
  end if;

  update public.profiles set status = p_status where id = target_profile_id;

  perform public.admin_record_audit_event(
    p_actor_profile_id,
    'professional.status.changed',
    'partner',
    p_partner_id,
    target_profile_id,
    'succeeded',
    null,
    jsonb_build_object('previousStatus', previous_status, 'status', p_status)
  );

  return p_status;
end;
$$;

create or replace function public.admin_security_sessions(
  p_target_profile_id uuid default null,
  p_limit integer default 50
)
returns table (
  session_id uuid,
  profile_id uuid,
  profile_role text,
  created_at timestamptz,
  refreshed_at timestamptz,
  expires_at timestamptz,
  assurance_level text,
  mfa_factor_id uuid,
  ip_hint text,
  user_agent_hint text
)
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not public.admin_has_capability('security.read') then
    raise exception 'ADMIN_SECURITY_FORBIDDEN' using errcode = 'P0001';
  end if;

  return query
  select
    session.id,
    profile.id,
    profile.role,
    session.created_at,
    session.refreshed_at at time zone 'UTC',
    session.not_after,
    session.aal::text,
    session.factor_id,
    case when session.ip is null then null else left(session.ip::text, 10) || '…' end,
    nullif(left(coalesce(session.user_agent, ''), 120), '')
  from auth.sessions as session
  join public.profiles as profile on profile.user_id = session.user_id
  where p_target_profile_id is null or profile.id = p_target_profile_id
  order by coalesce(session.refreshed_at, session.created_at) desc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
end;
$$;

create or replace function public.admin_security_auth_events(
  p_target_profile_id uuid default null,
  p_limit integer default 100
)
returns table (
  event_id uuid,
  profile_id uuid,
  profile_role text,
  action_key text,
  created_at timestamptz,
  ip_hint text
)
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not public.admin_has_capability('security.read') then
    raise exception 'ADMIN_SECURITY_FORBIDDEN' using errcode = 'P0001';
  end if;

  return query
  select
    entry.id,
    profile.id,
    profile.role,
    coalesce(entry.payload ->> 'action', entry.payload ->> 'event', 'auth.event'),
    entry.created_at,
    left(entry.ip_address, 10) || '…'
  from auth.audit_log_entries as entry
  join public.profiles as profile
    on profile.user_id = case
      when coalesce(entry.payload ->> 'user_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then (entry.payload ->> 'user_id')::uuid
      else null
    end
  where p_target_profile_id is null or profile.id = p_target_profile_id
  order by entry.created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
end;
$$;

alter table public.admin_role_assignments enable row level security;
alter table public.admin_audit_events enable row level security;
revoke all on table public.admin_role_assignments from public, anon, authenticated;
revoke all on table public.admin_audit_events from public, anon, authenticated;
grant select on table public.admin_role_assignments to authenticated;
grant select on table public.admin_audit_events to authenticated;
grant select, insert, update, delete on table public.admin_role_assignments to service_role;
grant select, insert, update, delete on table public.admin_audit_events to service_role;

create policy admin_role_assignments_select_owner
on public.admin_role_assignments for select to authenticated
using (public.admin_has_capability('permissions.manage'));

create policy admin_audit_events_select_owner
on public.admin_audit_events for select to authenticated
using (public.admin_has_capability('audit.read'));

drop policy if exists platform_settings_select_active_admin on public.platform_settings;
drop policy if exists platform_settings_insert_active_admin on public.platform_settings;
drop policy if exists platform_settings_update_active_admin on public.platform_settings;
drop policy if exists platform_integrations_select_active_admin on public.platform_integrations;
drop policy if exists platform_integrations_insert_active_admin on public.platform_integrations;
drop policy if exists platform_integrations_update_active_admin on public.platform_integrations;
drop policy if exists platform_settings_activity_select_active_admin on public.platform_settings_activity;
drop policy if exists platform_settings_activity_insert_active_admin on public.platform_settings_activity;

create policy platform_settings_owner
on public.platform_settings for all to authenticated
using (public.admin_has_capability('settings.manage'))
with check (public.admin_has_capability('settings.manage'));
create policy platform_integrations_owner
on public.platform_integrations for all to authenticated
using (public.admin_has_capability('settings.manage'))
with check (public.admin_has_capability('settings.manage'));
create policy platform_settings_activity_owner
on public.platform_settings_activity for select to authenticated
using (public.admin_has_capability('settings.manage'));
create policy platform_settings_activity_insert_owner
on public.platform_settings_activity for insert to authenticated
with check (public.admin_has_capability('settings.manage'));

revoke all on function public.current_active_admin_profile_id() from public;
revoke all on function public.assign_default_admin_role() from public;
revoke all on function public.admin_has_capability(text) from public;
revoke all on function public.current_admin_role() from public;
revoke all on function public.admin_record_audit_event(uuid, text, text, uuid, uuid, text, uuid, jsonb) from public;
revoke all on function public.admin_assign_role(uuid, uuid, text) from public;
revoke all on function public.admin_set_professional_status(uuid, uuid, text) from public;
revoke all on function public.admin_security_sessions(uuid, integer) from public;
revoke all on function public.admin_security_auth_events(uuid, integer) from public;
grant execute on function public.current_active_admin_profile_id() to authenticated;
grant execute on function public.admin_has_capability(text) to authenticated;
grant execute on function public.current_admin_role() to authenticated;
grant execute on function public.admin_record_audit_event(uuid, text, text, uuid, uuid, text, uuid, jsonb) to authenticated;
grant execute on function public.admin_assign_role(uuid, uuid, text) to authenticated;
grant execute on function public.admin_set_professional_status(uuid, uuid, text) to authenticated;
grant execute on function public.admin_security_sessions(uuid, integer) to authenticated;
grant execute on function public.admin_security_auth_events(uuid, integer) to authenticated;
