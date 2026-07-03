-- Painel de Treino do Cliente.
-- A prescricao continua nas tabelas partner_workout_*; estas tabelas registram a execucao do Cliente.

create table public.client_workout_sessions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  program_id uuid not null,
  prescribed_session_id uuid not null,
  workout_date date not null default current_date,
  status text not null default 'in_progress',
  started_at timestamptz,
  completed_at timestamptz,
  duration_minutes integer,
  total_volume_kg numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint client_workout_sessions_program_match_fkey
    foreign key (program_id, partner_id, patient_id)
    references public.partner_workout_programs(id, partner_id, patient_id)
    on delete cascade,
  constraint client_workout_sessions_prescribed_match_fkey
    foreign key (prescribed_session_id, partner_id)
    references public.partner_workout_sessions(id, partner_id)
    on delete cascade,
  constraint client_workout_sessions_status_check
    check (status in ('planned', 'in_progress', 'completed', 'skipped')),
  constraint client_workout_sessions_duration_check
    check (duration_minutes is null or duration_minutes between 0 and 600),
  constraint client_workout_sessions_volume_check
    check (total_volume_kg >= 0),
  constraint client_workout_sessions_notes_check
    check (notes is null or length(btrim(notes)) between 1 and 1200),
  constraint client_workout_sessions_unique_day
    unique (patient_id, prescribed_session_id, workout_date)
);

create table public.client_workout_exercise_logs (
  id uuid primary key default gen_random_uuid(),
  client_session_id uuid not null references public.client_workout_sessions(id) on delete cascade,
  partner_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  prescribed_exercise_id uuid not null,
  status text not null default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint client_workout_exercise_logs_exercise_match_fkey
    foreign key (prescribed_exercise_id, partner_id)
    references public.partner_workout_exercises(id, partner_id)
    on delete cascade,
  constraint client_workout_exercise_logs_status_check
    check (status in ('pending', 'in_progress', 'completed', 'skipped')),
  constraint client_workout_exercise_logs_notes_check
    check (notes is null or length(btrim(notes)) between 1 and 1000),
  constraint client_workout_exercise_logs_unique
    unique (client_session_id, prescribed_exercise_id)
);

create table public.client_workout_set_logs (
  id uuid primary key default gen_random_uuid(),
  client_session_id uuid not null references public.client_workout_sessions(id) on delete cascade,
  exercise_log_id uuid not null references public.client_workout_exercise_logs(id) on delete cascade,
  partner_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  prescribed_exercise_id uuid not null,
  prescribed_set_id uuid not null references public.partner_workout_sets(id) on delete cascade,
  set_number integer not null,
  load_kg numeric(7,2),
  reps integer,
  status text not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint client_workout_set_logs_exercise_match_fkey
    foreign key (prescribed_exercise_id, partner_id)
    references public.partner_workout_exercises(id, partner_id)
    on delete cascade,
  constraint client_workout_set_logs_number_check
    check (set_number between 1 and 12),
  constraint client_workout_set_logs_load_check
    check (load_kg is null or load_kg between 0 and 2000),
  constraint client_workout_set_logs_reps_check
    check (reps is null or reps between 1 and 500),
  constraint client_workout_set_logs_status_check
    check (status in ('pending', 'completed')),
  constraint client_workout_set_logs_completed_check
    check ((status = 'completed' and completed_at is not null) or status <> 'completed'),
  constraint client_workout_set_logs_unique
    unique (client_session_id, prescribed_set_id)
);

create table public.client_workout_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  program_id uuid not null,
  prescribed_session_id uuid,
  client_session_id uuid references public.client_workout_sessions(id) on delete cascade,
  event_type text not null,
  detail text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint client_workout_events_program_match_fkey
    foreign key (program_id, partner_id, patient_id)
    references public.partner_workout_programs(id, partner_id, patient_id)
    on delete cascade,
  constraint client_workout_events_prescribed_match_fkey
    foreign key (prescribed_session_id, partner_id)
    references public.partner_workout_sessions(id, partner_id)
    on delete cascade,
  constraint client_workout_events_type_check
    check (event_type in ('session_started', 'set_logged', 'exercise_skipped', 'session_finished')),
  constraint client_workout_events_detail_check
    check (length(btrim(detail)) > 0),
  constraint client_workout_events_details_object_check
    check (jsonb_typeof(details) = 'object')
);

create index client_workout_sessions_patient_date_idx
  on public.client_workout_sessions (patient_id, workout_date desc, created_at desc);
create index client_workout_exercise_logs_session_idx
  on public.client_workout_exercise_logs (client_session_id, prescribed_exercise_id);
create index client_workout_set_logs_session_idx
  on public.client_workout_set_logs (client_session_id, prescribed_exercise_id, set_number);
create index client_workout_events_patient_date_idx
  on public.client_workout_events (patient_id, created_at desc);

create trigger client_workout_sessions_set_updated_at
before update on public.client_workout_sessions
for each row execute function public.set_updated_at();
create trigger client_workout_exercise_logs_set_updated_at
before update on public.client_workout_exercise_logs
for each row execute function public.set_updated_at();
create trigger client_workout_set_logs_set_updated_at
before update on public.client_workout_set_logs
for each row execute function public.set_updated_at();

alter table public.client_workout_sessions enable row level security;
alter table public.client_workout_exercise_logs enable row level security;
alter table public.client_workout_set_logs enable row level security;
alter table public.client_workout_events enable row level security;

revoke all on table public.client_workout_sessions from public, anon, authenticated;
revoke all on table public.client_workout_exercise_logs from public, anon, authenticated;
revoke all on table public.client_workout_set_logs from public, anon, authenticated;
revoke all on table public.client_workout_events from public, anon, authenticated;

grant select, insert, update on table public.client_workout_sessions to authenticated;
grant select, insert, update on table public.client_workout_exercise_logs to authenticated;
grant select, insert, update on table public.client_workout_set_logs to authenticated;
grant select, insert on table public.client_workout_events to authenticated;

grant select, insert, update, delete on table public.client_workout_sessions to service_role;
grant select, insert, update, delete on table public.client_workout_exercise_logs to service_role;
grant select, insert, update, delete on table public.client_workout_set_logs to service_role;
grant select, insert, update, delete on table public.client_workout_events to service_role;

create policy client_workout_sessions_select_own_client
on public.client_workout_sessions for select to authenticated
using (patient_id = public.current_active_patient_id());
create policy client_workout_sessions_select_linked_partner
on public.client_workout_sessions for select to authenticated
using (public.current_partner_has_active_patient_link(patient_id));
create policy client_workout_sessions_insert_own_client
on public.client_workout_sessions for insert to authenticated
with check (patient_id = public.current_active_patient_id());
create policy client_workout_sessions_update_own_client
on public.client_workout_sessions for update to authenticated
using (patient_id = public.current_active_patient_id())
with check (patient_id = public.current_active_patient_id());

create policy client_workout_exercise_logs_select_own_client
on public.client_workout_exercise_logs for select to authenticated
using (patient_id = public.current_active_patient_id());
create policy client_workout_exercise_logs_select_linked_partner
on public.client_workout_exercise_logs for select to authenticated
using (public.current_partner_has_active_patient_link(patient_id));
create policy client_workout_exercise_logs_insert_own_client
on public.client_workout_exercise_logs for insert to authenticated
with check (patient_id = public.current_active_patient_id());
create policy client_workout_exercise_logs_update_own_client
on public.client_workout_exercise_logs for update to authenticated
using (patient_id = public.current_active_patient_id())
with check (patient_id = public.current_active_patient_id());

create policy client_workout_set_logs_select_own_client
on public.client_workout_set_logs for select to authenticated
using (patient_id = public.current_active_patient_id());
create policy client_workout_set_logs_select_linked_partner
on public.client_workout_set_logs for select to authenticated
using (public.current_partner_has_active_patient_link(patient_id));
create policy client_workout_set_logs_insert_own_client
on public.client_workout_set_logs for insert to authenticated
with check (patient_id = public.current_active_patient_id());
create policy client_workout_set_logs_update_own_client
on public.client_workout_set_logs for update to authenticated
using (patient_id = public.current_active_patient_id())
with check (patient_id = public.current_active_patient_id());

create policy client_workout_events_select_own_client
on public.client_workout_events for select to authenticated
using (patient_id = public.current_active_patient_id());
create policy client_workout_events_select_linked_partner
on public.client_workout_events for select to authenticated
using (public.current_partner_has_active_patient_link(patient_id));
create policy client_workout_events_insert_own_client
on public.client_workout_events for insert to authenticated
with check (patient_id = public.current_active_patient_id());

create or replace function public.current_client_workout_program()
returns public.partner_workout_programs
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select program.*
  from public.partner_workout_programs as program
  where program.patient_id = public.current_active_patient_id()
    and program.program_kind = 'client'
    and program.status in ('sent', 'published')
  order by
    case program.status when 'sent' then 0 when 'published' then 1 else 2 end,
    program.updated_at desc
  limit 1;
$$;

revoke all on function public.current_client_workout_program() from public;
grant execute on function public.current_client_workout_program() to authenticated;

create or replace function public.client_workout_dashboard(p_date date default current_date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  current_program public.partner_workout_programs%rowtype;
  result jsonb;
begin
  if current_patient_id is null then
    return null;
  end if;

  select * into current_program from public.current_client_workout_program();

  select jsonb_build_object(
    'client', (
      select jsonb_build_object(
        'id', patient.id,
        'name', profile.display_name,
        'avatarUrl', patient.avatar_url,
        'objective', patient.objective
      )
      from public.patients as patient
      join public.profiles as profile on profile.id = patient.profile_id
      where patient.id = current_patient_id
    ),
    'selectedDate', p_date,
    'program', case when current_program.id is null then null else jsonb_build_object(
      'id', current_program.id,
      'partnerId', current_program.partner_id,
      'patientId', current_program.patient_id,
      'title', current_program.title,
      'status', current_program.status,
      'version', current_program.version,
      'notes', current_program.notes,
      'updatedAt', current_program.updated_at,
      'sentAt', current_program.sent_at,
      'publishedAt', current_program.published_at,
      'sessions', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', session.id,
          'title', session.title,
          'objective', session.objective,
          'frequencyPerWeek', session.frequency_per_week,
          'durationMinutes', session.duration_minutes,
          'sortOrder', session.sort_order,
          'exercises', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', exercise.id,
              'exerciseId', exercise.exercise_id,
              'name', exercise.snapshot_name,
              'muscleGroup', exercise.snapshot_muscle_group,
              'secondaryMuscleGroups', exercise.snapshot_secondary_muscle_groups,
              'variationName', exercise.variation_name,
              'thumbnailUrl', exercise.snapshot_thumbnail_url,
              'restSeconds', exercise.rest_seconds,
              'cadence', exercise.cadence,
              'technique', exercise.technique,
              'notes', exercise.notes,
              'bisetGroupId', exercise.biset_group_id,
              'bisetPosition', exercise.biset_position,
              'sortOrder', exercise.sort_order,
              'sets', coalesce((
                select jsonb_agg(jsonb_build_object(
                  'id', workout_set.id,
                  'setNumber', workout_set.set_number,
                  'reps', workout_set.reps,
                  'loadKg', workout_set.load_kg,
                  'intensity', workout_set.intensity
                ) order by workout_set.set_number)
                from public.partner_workout_sets as workout_set
                where workout_set.prescribed_exercise_id = exercise.id
                  and workout_set.partner_id = exercise.partner_id
              ), '[]'::jsonb)
            ) order by exercise.sort_order, exercise.created_at)
            from public.partner_workout_exercises as exercise
            where exercise.session_id = session.id
              and exercise.partner_id = session.partner_id
          ), '[]'::jsonb)
        ) order by session.sort_order, session.created_at)
        from public.partner_workout_sessions as session
        where session.program_id = current_program.id
          and session.partner_id = current_program.partner_id
      ), '[]'::jsonb)
    ) end,
    'workoutSessions', case when current_program.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', client_session.id,
        'programId', client_session.program_id,
        'prescribedSessionId', client_session.prescribed_session_id,
        'workoutDate', client_session.workout_date,
        'status', client_session.status,
        'startedAt', client_session.started_at,
        'completedAt', client_session.completed_at,
        'durationMinutes', client_session.duration_minutes,
        'totalVolumeKg', client_session.total_volume_kg,
        'notes', client_session.notes
      ) order by client_session.workout_date desc, client_session.created_at desc)
      from public.client_workout_sessions as client_session
      where client_session.program_id = current_program.id
        and client_session.patient_id = current_patient_id
        and client_session.workout_date between p_date - 30 and p_date
    ), '[]'::jsonb) end,
    'exerciseLogs', case when current_program.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', exercise_log.id,
        'clientSessionId', exercise_log.client_session_id,
        'prescribedExerciseId', exercise_log.prescribed_exercise_id,
        'status', exercise_log.status,
        'startedAt', exercise_log.started_at,
        'completedAt', exercise_log.completed_at,
        'notes', exercise_log.notes
      ) order by exercise_log.created_at)
      from public.client_workout_exercise_logs as exercise_log
      join public.client_workout_sessions as client_session on client_session.id = exercise_log.client_session_id
      where client_session.program_id = current_program.id
        and exercise_log.patient_id = current_patient_id
        and client_session.workout_date between p_date - 30 and p_date
    ), '[]'::jsonb) end,
    'setLogs', case when current_program.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', set_log.id,
        'clientSessionId', set_log.client_session_id,
        'exerciseLogId', set_log.exercise_log_id,
        'prescribedExerciseId', set_log.prescribed_exercise_id,
        'prescribedSetId', set_log.prescribed_set_id,
        'setNumber', set_log.set_number,
        'loadKg', set_log.load_kg,
        'reps', set_log.reps,
        'status', set_log.status,
        'completedAt', set_log.completed_at
      ) order by set_log.created_at)
      from public.client_workout_set_logs as set_log
      join public.client_workout_sessions as client_session on client_session.id = set_log.client_session_id
      where client_session.program_id = current_program.id
        and set_log.patient_id = current_patient_id
        and client_session.workout_date between p_date - 30 and p_date
    ), '[]'::jsonb) end,
    'generatedAt', now()
  ) into result;

  return result;
end;
$$;

create or replace function public.ensure_client_workout_exercise_logs(p_client_session_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  selected_session public.client_workout_sessions%rowtype;
begin
  select * into selected_session
  from public.client_workout_sessions
  where id = p_client_session_id
    and patient_id = public.current_active_patient_id();

  if selected_session.id is null then
    raise exception 'Sessao de treino nao encontrada.';
  end if;

  insert into public.client_workout_exercise_logs (
    client_session_id, partner_id, patient_id, prescribed_exercise_id, status
  )
  select
    selected_session.id,
    exercise.partner_id,
    selected_session.patient_id,
    exercise.id,
    case when exercise.sort_order = 0 then 'in_progress' else 'pending' end
  from public.partner_workout_exercises as exercise
  where exercise.session_id = selected_session.prescribed_session_id
    and exercise.partner_id = selected_session.partner_id
  order by exercise.sort_order
  on conflict (client_session_id, prescribed_exercise_id) do nothing;
end;
$$;

revoke all on function public.ensure_client_workout_exercise_logs(uuid) from public;

create or replace function public.client_workout_start_session(p_session_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  current_program public.partner_workout_programs%rowtype;
  selected_session public.partner_workout_sessions%rowtype;
  client_session public.client_workout_sessions%rowtype;
begin
  if current_patient_id is null then
    raise exception 'Cliente nao autenticado.';
  end if;

  select * into current_program from public.current_client_workout_program();
  if current_program.id is null then
    raise exception 'Programa de treino nao encontrado.';
  end if;

  select * into selected_session
  from public.partner_workout_sessions
  where id = p_session_id
    and program_id = current_program.id
    and partner_id = current_program.partner_id
  limit 1;

  if selected_session.id is null then
    raise exception 'Treino nao encontrado.';
  end if;

  insert into public.client_workout_sessions (
    partner_id, patient_id, program_id, prescribed_session_id, workout_date, status, started_at
  )
  values (
    current_program.partner_id,
    current_patient_id,
    current_program.id,
    selected_session.id,
    current_date,
    'in_progress',
    now()
  )
  on conflict (patient_id, prescribed_session_id, workout_date)
  do update set
    status = case when public.client_workout_sessions.status = 'completed' then 'completed' else 'in_progress' end,
    started_at = coalesce(public.client_workout_sessions.started_at, now()),
    updated_at = now()
  returning * into client_session;

  perform public.ensure_client_workout_exercise_logs(client_session.id);

  insert into public.client_workout_events (
    partner_id, patient_id, program_id, prescribed_session_id, client_session_id, event_type, detail
  )
  values (
    current_program.partner_id,
    current_patient_id,
    current_program.id,
    selected_session.id,
    client_session.id,
    'session_started',
    'Treino iniciado pelo Cliente.'
  );

  return jsonb_build_object(
    'clientSessionId', client_session.id,
    'dashboard', public.client_workout_dashboard(current_date)
  );
end;
$$;

create or replace function public.client_workout_log_set(
  p_client_session_id uuid,
  p_set_id uuid,
  p_load_kg numeric default null,
  p_reps integer default null,
  p_completed boolean default true
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  client_session public.client_workout_sessions%rowtype;
  prescribed_set public.partner_workout_sets%rowtype;
  prescribed_exercise public.partner_workout_exercises%rowtype;
  exercise_log public.client_workout_exercise_logs%rowtype;
  total_sets integer;
  completed_sets integer;
begin
  if current_patient_id is null then
    raise exception 'Cliente nao autenticado.';
  end if;

  select * into client_session
  from public.client_workout_sessions
  where id = p_client_session_id
    and patient_id = current_patient_id;

  if client_session.id is null then
    raise exception 'Sessao de treino nao encontrada.';
  end if;

  select * into prescribed_set
  from public.partner_workout_sets
  where id = p_set_id
    and partner_id = client_session.partner_id;

  if prescribed_set.id is null then
    raise exception 'Serie nao encontrada.';
  end if;

  select * into prescribed_exercise
  from public.partner_workout_exercises
  where id = prescribed_set.prescribed_exercise_id
    and session_id = client_session.prescribed_session_id
    and partner_id = client_session.partner_id;

  if prescribed_exercise.id is null then
    raise exception 'Serie fora do treino atual.';
  end if;

  perform public.ensure_client_workout_exercise_logs(client_session.id);

  select * into exercise_log
  from public.client_workout_exercise_logs
  where client_session_id = client_session.id
    and prescribed_exercise_id = prescribed_exercise.id
  limit 1;

  update public.client_workout_exercise_logs
  set status = 'in_progress',
      started_at = coalesce(started_at, now()),
      updated_at = now()
  where id = exercise_log.id
  returning * into exercise_log;

  insert into public.client_workout_set_logs (
    client_session_id, exercise_log_id, partner_id, patient_id, prescribed_exercise_id,
    prescribed_set_id, set_number, load_kg, reps, status, completed_at
  )
  values (
    client_session.id,
    exercise_log.id,
    client_session.partner_id,
    current_patient_id,
    prescribed_exercise.id,
    prescribed_set.id,
    prescribed_set.set_number,
    greatest(0, least(coalesce(p_load_kg, prescribed_set.load_kg, 0), 2000)),
    greatest(1, least(coalesce(p_reps, prescribed_set.reps, 1), 500)),
    case when p_completed then 'completed' else 'pending' end,
    case when p_completed then now() else null end
  )
  on conflict (client_session_id, prescribed_set_id)
  do update set
    load_kg = excluded.load_kg,
    reps = excluded.reps,
    status = excluded.status,
    completed_at = excluded.completed_at,
    updated_at = now();

  select count(*)::integer into total_sets
  from public.partner_workout_sets
  where prescribed_exercise_id = prescribed_exercise.id
    and partner_id = client_session.partner_id;

  select count(*)::integer into completed_sets
  from public.client_workout_set_logs
  where client_session_id = client_session.id
    and prescribed_exercise_id = prescribed_exercise.id
    and status = 'completed';

  if total_sets > 0 and completed_sets >= total_sets then
    update public.client_workout_exercise_logs
    set status = 'completed',
        completed_at = coalesce(completed_at, now()),
        updated_at = now()
    where id = exercise_log.id;
  end if;

  update public.client_workout_sessions
  set status = case when status = 'completed' then 'completed' else 'in_progress' end,
      total_volume_kg = coalesce((
        select sum(coalesce(load_kg, 0) * coalesce(reps, 0))
        from public.client_workout_set_logs
        where client_session_id = client_session.id
          and status = 'completed'
      ), 0),
      updated_at = now()
  where id = client_session.id;

  insert into public.client_workout_events (
    partner_id, patient_id, program_id, prescribed_session_id, client_session_id, event_type, detail, details
  )
  values (
    client_session.partner_id,
    current_patient_id,
    client_session.program_id,
    client_session.prescribed_session_id,
    client_session.id,
    'set_logged',
    'Serie registrada pelo Cliente.',
    jsonb_build_object('setId', p_set_id, 'loadKg', p_load_kg, 'reps', p_reps, 'completed', p_completed)
  );

  return public.client_workout_dashboard(current_date);
end;
$$;

create or replace function public.client_workout_skip_exercise(
  p_client_session_id uuid,
  p_exercise_id uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  client_session public.client_workout_sessions%rowtype;
begin
  if current_patient_id is null then
    raise exception 'Cliente nao autenticado.';
  end if;

  select * into client_session
  from public.client_workout_sessions
  where id = p_client_session_id
    and patient_id = current_patient_id;

  if client_session.id is null then
    raise exception 'Sessao de treino nao encontrada.';
  end if;

  update public.client_workout_exercise_logs
  set status = 'skipped',
      completed_at = now(),
      updated_at = now()
  where client_session_id = client_session.id
    and prescribed_exercise_id = p_exercise_id
    and patient_id = current_patient_id;

  insert into public.client_workout_events (
    partner_id, patient_id, program_id, prescribed_session_id, client_session_id, event_type, detail, details
  )
  values (
    client_session.partner_id,
    current_patient_id,
    client_session.program_id,
    client_session.prescribed_session_id,
    client_session.id,
    'exercise_skipped',
    'Exercicio pulado pelo Cliente.',
    jsonb_build_object('exerciseId', p_exercise_id)
  );

  return public.client_workout_dashboard(current_date);
end;
$$;

create or replace function public.client_workout_finish_session(p_client_session_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  client_session public.client_workout_sessions%rowtype;
  total_exercises integer;
  completed_exercises integer;
begin
  if current_patient_id is null then
    raise exception 'Cliente nao autenticado.';
  end if;

  select * into client_session
  from public.client_workout_sessions
  where id = p_client_session_id
    and patient_id = current_patient_id;

  if client_session.id is null then
    raise exception 'Sessao de treino nao encontrada.';
  end if;

  select count(*)::integer into total_exercises
  from public.partner_workout_exercises
  where session_id = client_session.prescribed_session_id
    and partner_id = client_session.partner_id;

  select count(*)::integer into completed_exercises
  from public.client_workout_exercise_logs
  where client_session_id = client_session.id
    and status in ('completed', 'skipped');

  update public.client_workout_sessions
  set status = case when total_exercises > 0 and completed_exercises < total_exercises then 'in_progress' else 'completed' end,
      completed_at = case when total_exercises > 0 and completed_exercises < total_exercises then completed_at else coalesce(completed_at, now()) end,
      duration_minutes = case
        when started_at is null then duration_minutes
        else greatest(1, least(600, ceil(extract(epoch from (now() - started_at)) / 60.0)::integer))
      end,
      total_volume_kg = coalesce((
        select sum(coalesce(load_kg, 0) * coalesce(reps, 0))
        from public.client_workout_set_logs
        where client_session_id = client_session.id
          and status = 'completed'
      ), 0),
      updated_at = now()
  where id = client_session.id
  returning * into client_session;

  insert into public.client_workout_events (
    partner_id, patient_id, program_id, prescribed_session_id, client_session_id, event_type, detail
  )
  values (
    client_session.partner_id,
    current_patient_id,
    client_session.program_id,
    client_session.prescribed_session_id,
    client_session.id,
    'session_finished',
    'Treino finalizado pelo Cliente.'
  );

  return public.client_workout_dashboard(current_date);
end;
$$;

revoke all on function public.client_workout_dashboard(date) from public;
revoke all on function public.client_workout_start_session(uuid) from public;
revoke all on function public.client_workout_log_set(uuid, uuid, numeric, integer, boolean) from public;
revoke all on function public.client_workout_skip_exercise(uuid, uuid) from public;
revoke all on function public.client_workout_finish_session(uuid) from public;

grant execute on function public.client_workout_dashboard(date) to authenticated;
grant execute on function public.client_workout_start_session(uuid) to authenticated;
grant execute on function public.client_workout_log_set(uuid, uuid, numeric, integer, boolean) to authenticated;
grant execute on function public.client_workout_skip_exercise(uuid, uuid) to authenticated;
grant execute on function public.client_workout_finish_session(uuid) to authenticated;
