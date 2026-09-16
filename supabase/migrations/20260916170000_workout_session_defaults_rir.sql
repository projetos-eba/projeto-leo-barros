-- Persisted defaults make new exercise prescriptions consistent within a division.
-- Existing prescriptions remain untouched; a preflight prevents silently truncating legacy sets.
do $$
begin
  if exists (
    select 1
    from public.partner_workout_sets
    group by prescribed_exercise_id
    having count(*) > 6 or max(set_number) > 6
  ) then
    raise exception 'workout_set_limit_migration_blocked: remediate prescriptions above six sets before applying this migration';
  end if;
end;
$$;

alter table public.partner_workout_sets
  add column if not exists rir integer;

alter table public.partner_workout_sets
  add constraint partner_workout_sets_rir_check
  check (rir is null or rir between 0 and 10);

alter table public.partner_workout_sets
  drop constraint if exists partner_workout_sets_number_check;

alter table public.partner_workout_sets
  add constraint partner_workout_sets_number_check check (set_number between 1 and 6);

create table public.partner_workout_session_defaults (
  session_id uuid primary key references public.partner_workout_sessions(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete restrict,
  warmup_sets integer not null default 0,
  warmup_reps integer,
  warmup_rir integer,
  moderate_sets integer not null default 0,
  moderate_reps integer,
  moderate_rir integer,
  maximum_sets integer not null default 0,
  maximum_reps integer,
  maximum_rir integer,
  rest_seconds integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_workout_session_defaults_session_partner_fkey
    foreign key (session_id, partner_id) references public.partner_workout_sessions(id, partner_id) on delete cascade,
  constraint partner_workout_session_defaults_set_counts_check
    check (
      warmup_sets between 0 and 6
      and moderate_sets between 0 and 6
      and maximum_sets between 0 and 6
      and warmup_sets + moderate_sets + maximum_sets between 1 and 6
    ),
  constraint partner_workout_session_defaults_rest_check check (rest_seconds between 0 and 600),
  constraint partner_workout_session_defaults_warmup_check
    check ((warmup_sets = 0 and warmup_reps is null and warmup_rir is null) or (warmup_sets > 0 and warmup_reps between 1 and 500 and warmup_rir between 0 and 10)),
  constraint partner_workout_session_defaults_moderate_check
    check ((moderate_sets = 0 and moderate_reps is null and moderate_rir is null) or (moderate_sets > 0 and moderate_reps between 1 and 500 and moderate_rir between 0 and 10)),
  constraint partner_workout_session_defaults_maximum_check
    check ((maximum_sets = 0 and maximum_reps is null and maximum_rir is null) or (maximum_sets > 0 and maximum_reps between 1 and 500 and maximum_rir between 0 and 10))
);

create index partner_workout_session_defaults_partner_idx
  on public.partner_workout_session_defaults(partner_id);

create trigger partner_workout_session_defaults_set_updated_at
before update on public.partner_workout_session_defaults
for each row execute function public.set_updated_at();

alter table public.partner_workout_session_defaults enable row level security;
revoke all on table public.partner_workout_session_defaults from public, anon, authenticated;
grant select, insert, update, delete on table public.partner_workout_session_defaults to authenticated;
grant all on table public.partner_workout_session_defaults to service_role;

create policy partner_workout_session_defaults_own_partner
on public.partner_workout_session_defaults for all to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());

-- Preserve the established RPC payloads while enriching them with defaults and RIR.
alter function public.partner_client_workouts(uuid) rename to partner_client_workouts_legacy;

create function public.partner_client_workouts(p_patient_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  payload jsonb := public.partner_client_workouts_legacy(p_patient_id);
  programs jsonb;
begin
  if payload is null then return null; end if;

  select coalesce(jsonb_agg(program || jsonb_build_object('sessions', session_rows.sessions)), '[]'::jsonb)
  into programs
  from jsonb_array_elements(payload->'programs') program
  cross join lateral (
    select coalesce(jsonb_agg(session || jsonb_build_object(
      'defaults', (
        select jsonb_build_object(
          'warmupSets', defaults.warmup_sets, 'warmupReps', defaults.warmup_reps, 'warmupRir', defaults.warmup_rir,
          'moderateSets', defaults.moderate_sets, 'moderateReps', defaults.moderate_reps, 'moderateRir', defaults.moderate_rir,
          'maximumSets', defaults.maximum_sets, 'maximumReps', defaults.maximum_reps, 'maximumRir', defaults.maximum_rir,
          'restSeconds', defaults.rest_seconds
        ) from public.partner_workout_session_defaults defaults where defaults.session_id = (session->>'id')::uuid
      ),
      'exercises', exercise_rows.exercises
    )), '[]'::jsonb) as sessions
    from jsonb_array_elements(program->'sessions') session
    cross join lateral (
      select coalesce(jsonb_agg(exercise || jsonb_build_object('sets', set_rows.sets)), '[]'::jsonb) as exercises
      from jsonb_array_elements(session->'exercises') exercise
      cross join lateral (
        select coalesce(jsonb_agg(workout_set || jsonb_build_object('rir', prescribed.rir) order by (workout_set->>'setNumber')::integer), '[]'::jsonb) as sets
        from jsonb_array_elements(exercise->'sets') workout_set
        join public.partner_workout_sets prescribed on prescribed.id = (workout_set->>'id')::uuid
      ) set_rows
    ) exercise_rows
  ) session_rows;

  return jsonb_set(payload, '{programs}', programs);
end;
$$;

revoke all on function public.partner_client_workouts_legacy(uuid) from public, anon, authenticated;
revoke all on function public.partner_client_workouts(uuid) from public;
grant execute on function public.partner_client_workouts(uuid) to authenticated;

alter function public.client_workout_dashboard(date) rename to client_workout_dashboard_legacy;

create function public.client_workout_dashboard(p_date date default current_date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  payload jsonb := public.client_workout_dashboard_legacy(p_date);
  sessions jsonb;
begin
  if payload is null or payload->'program' is null then return payload; end if;
  select coalesce(jsonb_agg(session || jsonb_build_object('exercises', exercise_rows.exercises)), '[]'::jsonb)
  into sessions
  from jsonb_array_elements(payload->'program'->'sessions') session
  cross join lateral (
    select coalesce(jsonb_agg(exercise || jsonb_build_object('sets', set_rows.sets)), '[]'::jsonb) as exercises
    from jsonb_array_elements(session->'exercises') exercise
    cross join lateral (
      select coalesce(jsonb_agg(workout_set || jsonb_build_object('rir', prescribed.rir) order by (workout_set->>'setNumber')::integer), '[]'::jsonb) as sets
      from jsonb_array_elements(exercise->'sets') workout_set
      join public.partner_workout_sets prescribed on prescribed.id = (workout_set->>'id')::uuid
    ) set_rows
  ) exercise_rows;
  return jsonb_set(payload, '{program,sessions}', sessions);
end;
$$;

revoke all on function public.client_workout_dashboard_legacy(date) from public, anon, authenticated;
revoke all on function public.client_workout_dashboard(date) from public;
grant execute on function public.client_workout_dashboard(date) to authenticated;

create or replace function public.partner_clone_workout_program(
  p_source_program_id uuid,
  p_patient_id uuid,
  p_as_template boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_partner_id uuid := public.current_active_partner_id();
  source_program public.partner_workout_programs%rowtype;
  new_program_id uuid;
  source_session record;
  new_session_id uuid;
  source_exercise record;
  new_exercise_id uuid;
begin
  if current_partner_id is null then raise exception 'partner_context_required'; end if;
  if not p_as_template and not public.current_partner_has_active_patient_link(p_patient_id) then raise exception 'patient_link_required'; end if;
  select * into source_program from public.partner_workout_programs where id = p_source_program_id and partner_id = current_partner_id;
  if source_program.id is null then raise exception 'program_not_found'; end if;

  insert into public.partner_workout_programs (partner_id, patient_id, program_kind, title, status, notes)
  values (current_partner_id, case when p_as_template then null else p_patient_id end, case when p_as_template then 'template' else 'client' end,
    source_program.title || case when p_as_template then ' - Template' else ' - Cópia' end, 'draft', source_program.notes)
  returning id into new_program_id;

  for source_session in select * from public.partner_workout_sessions where program_id = source_program.id and partner_id = current_partner_id order by sort_order loop
    insert into public.partner_workout_sessions (partner_id, program_id, title, objective, frequency_per_week, duration_minutes, sort_order)
    values (current_partner_id, new_program_id, source_session.title, source_session.objective, source_session.frequency_per_week, source_session.duration_minutes, source_session.sort_order)
    returning id into new_session_id;

    insert into public.partner_workout_session_defaults (session_id, partner_id, warmup_sets, warmup_reps, warmup_rir, moderate_sets, moderate_reps, moderate_rir, maximum_sets, maximum_reps, maximum_rir, rest_seconds)
    select new_session_id, current_partner_id, warmup_sets, warmup_reps, warmup_rir, moderate_sets, moderate_reps, moderate_rir, maximum_sets, maximum_reps, maximum_rir, rest_seconds
    from public.partner_workout_session_defaults where session_id = source_session.id;

    for source_exercise in select * from public.partner_workout_exercises where session_id = source_session.id and partner_id = current_partner_id order by sort_order loop
      insert into public.partner_workout_exercises (partner_id, session_id, exercise_id, variation_name, rest_seconds, cadence, technique, notes, biset_group_id, biset_position, sort_order, snapshot_name, snapshot_muscle_group, snapshot_secondary_muscle_groups, snapshot_thumbnail_url)
      values (current_partner_id, new_session_id, source_exercise.exercise_id, source_exercise.variation_name, source_exercise.rest_seconds, source_exercise.cadence, source_exercise.technique, source_exercise.notes,
        case when source_exercise.biset_group_id is null then null else md5(new_program_id::text || source_exercise.biset_group_id::text)::uuid end, source_exercise.biset_position, source_exercise.sort_order, source_exercise.snapshot_name, source_exercise.snapshot_muscle_group, source_exercise.snapshot_secondary_muscle_groups, source_exercise.snapshot_thumbnail_url)
      returning id into new_exercise_id;
      insert into public.partner_workout_sets (partner_id, prescribed_exercise_id, set_number, reps, load_kg, intensity, rir)
      select current_partner_id, new_exercise_id, set_number, reps, load_kg, intensity, rir from public.partner_workout_sets where prescribed_exercise_id = source_exercise.id and partner_id = current_partner_id;
    end loop;
  end loop;
  return new_program_id;
end;
$$;

-- Recalculate historical execution volume using the same warmup exclusion as live logging.
update public.client_workout_sessions client_session
set total_volume_kg = coalesce((
  select sum(coalesce(set_log.load_kg, 0) * coalesce(set_log.reps, 0))
  from public.client_workout_set_logs set_log
  join public.partner_workout_sets prescribed on prescribed.id = set_log.prescribed_set_id
  where set_log.client_session_id = client_session.id
    and set_log.status = 'completed'
    and prescribed.intensity <> 'warmup'
), 0);

create or replace function public.client_workout_log_set(
  p_client_session_id uuid, p_set_id uuid, p_load_kg numeric default null, p_reps integer default null, p_completed boolean default true
)
returns jsonb language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare current_patient_id uuid := public.current_active_patient_id(); client_session public.client_workout_sessions%rowtype; prescribed_set public.partner_workout_sets%rowtype; prescribed_exercise public.partner_workout_exercises%rowtype; exercise_log public.client_workout_exercise_logs%rowtype; total_sets integer; completed_sets integer;
begin
  if current_patient_id is null then raise exception 'Cliente nao autenticado.'; end if;
  select * into client_session from public.client_workout_sessions where id = p_client_session_id and patient_id = current_patient_id;
  if client_session.id is null then raise exception 'Sessao de treino nao encontrada.'; end if;
  select * into prescribed_set from public.partner_workout_sets where id = p_set_id and partner_id = client_session.partner_id;
  if prescribed_set.id is null then raise exception 'Serie nao encontrada.'; end if;
  select * into prescribed_exercise from public.partner_workout_exercises where id = prescribed_set.prescribed_exercise_id and session_id = client_session.prescribed_session_id and partner_id = client_session.partner_id;
  if prescribed_exercise.id is null then raise exception 'Serie fora do treino atual.'; end if;
  perform public.ensure_client_workout_exercise_logs(client_session.id);
  select * into exercise_log from public.client_workout_exercise_logs where client_session_id = client_session.id and prescribed_exercise_id = prescribed_exercise.id limit 1;
  update public.client_workout_exercise_logs set status = 'in_progress', started_at = coalesce(started_at, now()), updated_at = now() where id = exercise_log.id returning * into exercise_log;
  insert into public.client_workout_set_logs (client_session_id, exercise_log_id, partner_id, patient_id, prescribed_exercise_id, prescribed_set_id, set_number, load_kg, reps, status, completed_at)
  values (client_session.id, exercise_log.id, client_session.partner_id, current_patient_id, prescribed_exercise.id, prescribed_set.id, prescribed_set.set_number, greatest(0, least(coalesce(p_load_kg, prescribed_set.load_kg, 0), 2000)), greatest(1, least(coalesce(p_reps, prescribed_set.reps, 1), 500)), case when p_completed then 'completed' else 'pending' end, case when p_completed then now() else null end)
  on conflict (client_session_id, prescribed_set_id) do update set load_kg = excluded.load_kg, reps = excluded.reps, status = excluded.status, completed_at = excluded.completed_at, updated_at = now();
  select count(*)::integer into total_sets from public.partner_workout_sets where prescribed_exercise_id = prescribed_exercise.id and partner_id = client_session.partner_id;
  select count(*)::integer into completed_sets from public.client_workout_set_logs where client_session_id = client_session.id and prescribed_exercise_id = prescribed_exercise.id and status = 'completed';
  if total_sets > 0 and completed_sets >= total_sets then update public.client_workout_exercise_logs set status = 'completed', completed_at = coalesce(completed_at, now()), updated_at = now() where id = exercise_log.id; end if;
  update public.client_workout_sessions set status = case when status = 'completed' then 'completed' else 'in_progress' end, total_volume_kg = coalesce((select sum(coalesce(set_log.load_kg, 0) * coalesce(set_log.reps, 0)) from public.client_workout_set_logs set_log join public.partner_workout_sets prescribed on prescribed.id = set_log.prescribed_set_id where set_log.client_session_id = client_session.id and set_log.status = 'completed' and prescribed.intensity <> 'warmup'), 0), updated_at = now() where id = client_session.id;
  insert into public.client_workout_events (partner_id, patient_id, program_id, prescribed_session_id, client_session_id, event_type, detail, details) values (client_session.partner_id, current_patient_id, client_session.program_id, client_session.prescribed_session_id, client_session.id, 'set_logged', 'Serie registrada pelo Cliente.', jsonb_build_object('setId', p_set_id, 'loadKg', p_load_kg, 'reps', p_reps, 'completed', p_completed));
  return public.client_workout_dashboard(current_date);
end;
$$;

create or replace function public.client_workout_finish_session(p_client_session_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare current_patient_id uuid := public.current_active_patient_id(); client_session public.client_workout_sessions%rowtype; total_exercises integer; completed_exercises integer;
begin
  if current_patient_id is null then raise exception 'Cliente nao autenticado.'; end if;
  select * into client_session from public.client_workout_sessions where id = p_client_session_id and patient_id = current_patient_id;
  if client_session.id is null then raise exception 'Sessao de treino nao encontrada.'; end if;
  select count(*)::integer into total_exercises from public.partner_workout_exercises where session_id = client_session.prescribed_session_id and partner_id = client_session.partner_id;
  select count(*)::integer into completed_exercises from public.client_workout_exercise_logs where client_session_id = client_session.id and status in ('completed', 'skipped');
  update public.client_workout_sessions set status = case when total_exercises > 0 and completed_exercises < total_exercises then 'in_progress' else 'completed' end, completed_at = case when total_exercises > 0 and completed_exercises < total_exercises then completed_at else coalesce(completed_at, now()) end, duration_minutes = case when started_at is null then duration_minutes else greatest(1, least(600, ceil(extract(epoch from (now() - started_at)) / 60.0)::integer)) end, total_volume_kg = coalesce((select sum(coalesce(set_log.load_kg, 0) * coalesce(set_log.reps, 0)) from public.client_workout_set_logs set_log join public.partner_workout_sets prescribed on prescribed.id = set_log.prescribed_set_id where set_log.client_session_id = client_session.id and set_log.status = 'completed' and prescribed.intensity <> 'warmup'), 0), updated_at = now() where id = client_session.id returning * into client_session;
  insert into public.client_workout_events (partner_id, patient_id, program_id, prescribed_session_id, client_session_id, event_type, detail) values (client_session.partner_id, current_patient_id, client_session.program_id, client_session.prescribed_session_id, client_session.id, 'session_finished', 'Treino finalizado pelo Cliente.');
  return public.client_workout_dashboard(current_date);
end;
$$;
