-- CRUD administrativo de usuarios Admin com guarda transacional do ultimo Admin ativo.

grant select, insert, update, delete on table public.admins to service_role;
grant select, insert, update on table public.profiles to service_role;
grant select, insert on table public.platform_settings_activity to service_role;

create or replace function public.admin_active_profile_count()
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select count(*)::integer
  from public.profiles as profile
  join public.admins as admin on admin.profile_id = profile.id
  where profile.role = 'admin'
    and profile.status = 'active';
$$;

create or replace function public.admin_actor_is_active(p_actor_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles as profile
    join public.admins as admin on admin.profile_id = profile.id
    where profile.id = p_actor_profile_id
      and profile.role = 'admin'
      and profile.status = 'active'
  );
$$;

create or replace function public.prevent_last_active_admin_loss()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  target_profile_id uuid;
  was_active_admin boolean := false;
  will_be_active_admin boolean := false;
  remaining_active_admins integer := 0;
begin
  if tg_table_name = 'profiles' then
    target_profile_id := old.id;
    was_active_admin := old.role = 'admin'
      and old.status = 'active'
      and exists (
        select 1 from public.admins as admin where admin.profile_id = old.id
      );

    if tg_op = 'UPDATE' then
      will_be_active_admin := new.role = 'admin'
        and new.status = 'active'
        and exists (
          select 1 from public.admins as admin where admin.profile_id = new.id
        );
    end if;
  elsif tg_table_name = 'admins' then
    target_profile_id := old.profile_id;
    select profile.role = 'admin' and profile.status = 'active'
    into was_active_admin
    from public.profiles as profile
    where profile.id = old.profile_id;
  end if;

  if was_active_admin and not will_be_active_admin then
    perform pg_advisory_xact_lock(hashtextextended('public.active_admin_guard', 0));

    select count(*)::integer
    into remaining_active_admins
    from public.profiles as profile
    join public.admins as admin on admin.profile_id = profile.id
    where profile.role = 'admin'
      and profile.status = 'active'
      and profile.id <> target_profile_id;

    if remaining_active_admins < 1 then
      raise exception 'LAST_ACTIVE_ADMIN' using errcode = 'P0001';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_last_active_admin_loss on public.profiles;
create trigger profiles_prevent_last_active_admin_loss
before update of role, status or delete on public.profiles
for each row execute function public.prevent_last_active_admin_loss();

drop trigger if exists admins_prevent_last_active_admin_loss on public.admins;
create trigger admins_prevent_last_active_admin_loss
before delete on public.admins
for each row execute function public.prevent_last_active_admin_loss();

create or replace function public.admin_create_user_record(
  p_actor_profile_id uuid,
  p_auth_user_id uuid,
  p_email text,
  p_display_name text,
  p_status text,
  p_invite_status text
)
returns table (
  profile_id uuid,
  admin_id uuid,
  result_status text,
  active_admin_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_email text := lower(btrim(p_email));
  normalized_name text := btrim(p_display_name);
  new_profile_id uuid;
  new_admin_id uuid;
begin
  if not public.admin_actor_is_active(p_actor_profile_id) then
    raise exception 'ADMIN_USERS_FORBIDDEN' using errcode = 'P0001';
  end if;

  if p_status not in ('pending', 'active', 'suspended', 'disabled') then
    raise exception 'ADMIN_USERS_INVALID_STATUS' using errcode = 'P0001';
  end if;

  if normalized_email = '' or normalized_name = '' then
    raise exception 'ADMIN_USERS_INVALID_PAYLOAD' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.profiles as profile where lower(profile.email) = normalized_email
  ) then
    raise exception 'ADMIN_USERS_EMAIL_EXISTS' using errcode = 'P0001';
  end if;

  insert into public.profiles (
    user_id,
    email,
    display_name,
    role,
    status
  )
  values (
    p_auth_user_id,
    normalized_email,
    normalized_name,
    'admin',
    p_status
  )
  returning id into new_profile_id;

  insert into public.admins (profile_id)
  values (new_profile_id)
  returning id into new_admin_id;

  insert into public.platform_settings_activity (
    action,
    actor_profile_id,
    title,
    detail,
    metadata
  )
  values (
    'admin_user_created',
    p_actor_profile_id,
    'Usuario administrativo criado',
    'Acesso administrativo criado para ' || normalized_name || '.',
    jsonb_build_object(
      'targetProfileId', new_profile_id,
      'status', p_status,
      'inviteStatus', p_invite_status
    )
  );

  return query
  select
    new_profile_id,
    new_admin_id,
    'created'::text,
    public.admin_active_profile_count();
end;
$$;

create or replace function public.admin_update_user_record(
  p_actor_profile_id uuid,
  p_target_profile_id uuid,
  p_display_name text,
  p_status text
)
returns table (
  profile_id uuid,
  result_status text,
  active_admin_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_name text := btrim(p_display_name);
  previous_status text;
begin
  if not public.admin_actor_is_active(p_actor_profile_id) then
    raise exception 'ADMIN_USERS_FORBIDDEN' using errcode = 'P0001';
  end if;

  if p_status not in ('pending', 'active', 'suspended', 'disabled') then
    raise exception 'ADMIN_USERS_INVALID_STATUS' using errcode = 'P0001';
  end if;

  if normalized_name = '' then
    raise exception 'ADMIN_USERS_INVALID_PAYLOAD' using errcode = 'P0001';
  end if;

  if p_actor_profile_id = p_target_profile_id and p_status <> 'active' then
    raise exception 'ADMIN_USERS_SELF_DEACTIVATE' using errcode = 'P0001';
  end if;

  select profile.status
  into previous_status
  from public.profiles as profile
  join public.admins as admin on admin.profile_id = profile.id
  where profile.id = p_target_profile_id
    and profile.role = 'admin'
  for update;

  if previous_status is null then
    raise exception 'ADMIN_USERS_NOT_FOUND' using errcode = 'P0001';
  end if;

  update public.profiles
  set
    display_name = normalized_name,
    status = p_status
  where id = p_target_profile_id;

  insert into public.platform_settings_activity (
    action,
    actor_profile_id,
    title,
    detail,
    metadata
  )
  values (
    case
      when previous_status <> 'active' and p_status = 'active' then 'admin_user_activated'
      when previous_status = 'active' and p_status <> 'active' then 'admin_user_deactivated'
      else 'admin_user_updated'
    end,
    p_actor_profile_id,
    case
      when previous_status <> 'active' and p_status = 'active' then 'Usuario administrativo ativado'
      when previous_status = 'active' and p_status <> 'active' then 'Usuario administrativo inativado'
      else 'Usuario administrativo atualizado'
    end,
    'Dados administrativos atualizados para ' || normalized_name || '.',
    jsonb_build_object(
      'targetProfileId', p_target_profile_id,
      'previousStatus', previous_status,
      'status', p_status
    )
  );

  return query
  select
    p_target_profile_id,
    'updated'::text,
    public.admin_active_profile_count();
end;
$$;

create or replace function public.admin_delete_user_record(
  p_actor_profile_id uuid,
  p_target_profile_id uuid
)
returns table (
  profile_id uuid,
  result_status text,
  active_admin_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_name text;
  previous_status text;
begin
  if not public.admin_actor_is_active(p_actor_profile_id) then
    raise exception 'ADMIN_USERS_FORBIDDEN' using errcode = 'P0001';
  end if;

  if p_actor_profile_id = p_target_profile_id then
    raise exception 'ADMIN_USERS_SELF_DELETE' using errcode = 'P0001';
  end if;

  select profile.display_name, profile.status
  into target_name, previous_status
  from public.profiles as profile
  join public.admins as admin on admin.profile_id = profile.id
  where profile.id = p_target_profile_id
    and profile.role = 'admin'
  for update;

  if previous_status is null then
    raise exception 'ADMIN_USERS_NOT_FOUND' using errcode = 'P0001';
  end if;

  update public.profiles
  set status = 'disabled'
  where id = p_target_profile_id;

  insert into public.platform_settings_activity (
    action,
    actor_profile_id,
    title,
    detail,
    metadata
  )
  values (
    'admin_user_deleted',
    p_actor_profile_id,
    'Usuario administrativo excluido',
    'Acesso administrativo removido de ' || target_name || '.',
    jsonb_build_object(
      'targetProfileId', p_target_profile_id,
      'previousStatus', previous_status,
      'status', 'disabled',
      'mode', 'soft_delete'
    )
  );

  return query
  select
    p_target_profile_id,
    'deleted'::text,
    public.admin_active_profile_count();
end;
$$;

revoke all on function public.admin_active_profile_count() from public;
revoke all on function public.admin_actor_is_active(uuid) from public;
revoke all on function public.prevent_last_active_admin_loss() from public;
revoke all on function public.admin_create_user_record(uuid, uuid, text, text, text, text) from public;
revoke all on function public.admin_update_user_record(uuid, uuid, text, text) from public;
revoke all on function public.admin_delete_user_record(uuid, uuid) from public;

grant execute on function public.admin_create_user_record(uuid, uuid, text, text, text, text) to service_role;
grant execute on function public.admin_update_user_record(uuid, uuid, text, text) to service_role;
grant execute on function public.admin_delete_user_record(uuid, uuid) to service_role;

comment on function public.prevent_last_active_admin_loss()
is 'Guarda transacional que impede atualizacao ou remocao capaz de deixar a plataforma sem Admin ativo.';

comment on function public.admin_create_user_record(uuid, uuid, text, text, text, text)
is 'Cria profile/admin de forma privilegiada apos criacao segura do usuario Auth pela Edge Function.';

comment on function public.admin_update_user_record(uuid, uuid, text, text)
is 'Atualiza nome e status de usuario Admin com protecao de ultimo Admin ativo.';

comment on function public.admin_delete_user_record(uuid, uuid)
is 'Aplica exclusao logica de usuario Admin preservando Auth e historico.';
