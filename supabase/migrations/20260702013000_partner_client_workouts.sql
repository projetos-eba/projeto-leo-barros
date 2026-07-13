alter table public.partner_protocol_exercises
  add column if not exists secondary_muscle_groups text[] not null default '{}';

alter table public.partner_protocol_exercises
  add constraint partner_protocol_exercises_secondary_muscles_check
  check (
    secondary_muscle_groups <@ array['peito', 'costas', 'pernas', 'ombros', 'biceps', 'triceps', 'core', 'gluteos']::text[]
    and cardinality(secondary_muscle_groups) <= 4
    and not (muscle_group = any(secondary_muscle_groups))
  );

create table public.partner_workout_programs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid references public.patients(id) on delete cascade,
  program_kind text not null default 'client',
  title text not null,
  status text not null default 'draft',
  version integer not null default 1,
  notes text,
  published_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_workout_programs_kind_check check (program_kind in ('client', 'template')),
  constraint partner_workout_programs_patient_kind_check check (
    (program_kind = 'client' and patient_id is not null)
    or (program_kind = 'template' and patient_id is null)
  ),
  constraint partner_workout_programs_status_check check (status in ('draft', 'published', 'sent', 'archived')),
  constraint partner_workout_programs_title_check check (length(btrim(title)) between 2 and 140),
  constraint partner_workout_programs_version_check check (version > 0),
  constraint partner_workout_programs_id_partner_key unique (id, partner_id),
  constraint partner_workout_programs_partner_patient_key unique (id, partner_id, patient_id)
);

create unique index partner_workout_programs_one_active_per_client_idx
  on public.partner_workout_programs (partner_id, patient_id)
  where program_kind = 'client' and status in ('published', 'sent');
create index partner_workout_programs_client_updated_idx
  on public.partner_workout_programs (partner_id, patient_id, updated_at desc);
create index partner_workout_programs_templates_idx
  on public.partner_workout_programs (partner_id, updated_at desc)
  where program_kind = 'template' and status <> 'archived';

create table public.partner_workout_sessions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  program_id uuid not null references public.partner_workout_programs(id) on delete cascade,
  title text not null,
  objective text not null default 'hipertrofia',
  frequency_per_week integer not null default 2,
  duration_minutes integer not null default 60,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_workout_sessions_program_partner_fkey
    foreign key (program_id, partner_id) references public.partner_workout_programs(id, partner_id) on delete cascade,
  constraint partner_workout_sessions_title_check check (length(btrim(title)) between 1 and 80),
  constraint partner_workout_sessions_objective_check
    check (objective in ('forca', 'hipertrofia', 'resistencia', 'mobilidade', 'reabilitacao', 'condicionamento')),
  constraint partner_workout_sessions_frequency_check check (frequency_per_week between 1 and 14),
  constraint partner_workout_sessions_duration_check check (duration_minutes between 5 and 300),
  constraint partner_workout_sessions_sort_check check (sort_order >= 0),
  constraint partner_workout_sessions_id_partner_key unique (id, partner_id)
);

create index partner_workout_sessions_program_order_idx
  on public.partner_workout_sessions (partner_id, program_id, sort_order);

create table public.partner_workout_exercises (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  session_id uuid not null,
  exercise_id uuid not null,
  variation_name text,
  rest_seconds integer not null default 90,
  cadence text,
  technique text not null default 'normal',
  notes text,
  biset_group_id uuid,
  biset_position integer,
  sort_order integer not null default 0,
  snapshot_name text not null,
  snapshot_muscle_group text not null,
  snapshot_secondary_muscle_groups text[] not null default '{}',
  snapshot_thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_workout_exercises_session_partner_fkey
    foreign key (session_id, partner_id) references public.partner_workout_sessions(id, partner_id) on delete cascade,
  constraint partner_workout_exercises_library_partner_fkey
    foreign key (exercise_id, partner_id) references public.partner_protocol_exercises(id, partner_id) on delete restrict,
  constraint partner_workout_exercises_rest_check check (rest_seconds between 0 and 600),
  constraint partner_workout_exercises_technique_check
    check (technique in ('normal', 'biset', 'dropset', 'rest_pause', 'superset', 'cluster', 'isometria')),
  constraint partner_workout_exercises_biset_check check (
    (biset_group_id is null and biset_position is null and technique <> 'biset')
    or (biset_group_id is not null and biset_position in (1, 2) and technique = 'biset')
  ),
  constraint partner_workout_exercises_order_check check (sort_order >= 0),
  constraint partner_workout_exercises_snapshot_name_check check (length(btrim(snapshot_name)) > 0),
  constraint partner_workout_exercises_id_partner_key unique (id, partner_id)
);

create index partner_workout_exercises_session_order_idx
  on public.partner_workout_exercises (partner_id, session_id, sort_order);
create unique index partner_workout_exercises_biset_position_idx
  on public.partner_workout_exercises (partner_id, biset_group_id, biset_position)
  where biset_group_id is not null;

create table public.partner_workout_sets (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  prescribed_exercise_id uuid not null,
  set_number integer not null,
  reps integer,
  load_kg numeric(7,2),
  intensity text not null default 'moderate',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_workout_sets_exercise_partner_fkey
    foreign key (prescribed_exercise_id, partner_id) references public.partner_workout_exercises(id, partner_id) on delete cascade,
  constraint partner_workout_sets_number_check check (set_number between 1 and 12),
  constraint partner_workout_sets_reps_check check (reps is null or reps between 1 and 500),
  constraint partner_workout_sets_load_check check (load_kg is null or load_kg between 0 and 2000),
  constraint partner_workout_sets_intensity_check check (intensity in ('warmup', 'moderate', 'maximum')),
  constraint partner_workout_sets_number_key unique (prescribed_exercise_id, set_number)
);

create index partner_workout_sets_exercise_number_idx
  on public.partner_workout_sets (partner_id, prescribed_exercise_id, set_number);

create table public.partner_workout_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid references public.patients(id) on delete cascade,
  program_id uuid not null references public.partner_workout_programs(id) on delete cascade,
  actor_name text,
  event_type text not null,
  detail text not null,
  version integer not null default 1,
  details jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint partner_workout_events_type_check
    check (event_type in ('created', 'updated', 'duplicated', 'template_saved', 'template_applied', 'published', 'sent')),
  constraint partner_workout_events_detail_check check (length(btrim(detail)) > 0)
);

create index partner_workout_events_program_created_idx
  on public.partner_workout_events (partner_id, program_id, created_at desc);

create trigger partner_workout_programs_set_updated_at
before update on public.partner_workout_programs
for each row execute function public.set_updated_at();
create trigger partner_workout_sessions_set_updated_at
before update on public.partner_workout_sessions
for each row execute function public.set_updated_at();
create trigger partner_workout_exercises_set_updated_at
before update on public.partner_workout_exercises
for each row execute function public.set_updated_at();
create trigger partner_workout_sets_set_updated_at
before update on public.partner_workout_sets
for each row execute function public.set_updated_at();

alter table public.partner_workout_programs enable row level security;
alter table public.partner_workout_sessions enable row level security;
alter table public.partner_workout_exercises enable row level security;
alter table public.partner_workout_sets enable row level security;
alter table public.partner_workout_events enable row level security;

revoke all on table public.partner_workout_programs, public.partner_workout_sessions,
  public.partner_workout_exercises, public.partner_workout_sets, public.partner_workout_events
  from public, anon, authenticated;
grant select, insert, update, delete on table public.partner_workout_programs,
  public.partner_workout_sessions, public.partner_workout_exercises, public.partner_workout_sets
  to authenticated;
grant select, insert on table public.partner_workout_events to authenticated;
grant all on table public.partner_workout_programs, public.partner_workout_sessions,
  public.partner_workout_exercises, public.partner_workout_sets, public.partner_workout_events
  to service_role;

create policy partner_workout_programs_own_partner
on public.partner_workout_programs for all to authenticated
using (
  partner_id = public.current_active_partner_id()
  and (program_kind = 'template' or public.current_partner_has_active_patient_link(patient_id))
)
with check (
  partner_id = public.current_active_partner_id()
  and (program_kind = 'template' or public.current_partner_has_active_patient_link(patient_id))
);

create policy partner_workout_sessions_own_partner
on public.partner_workout_sessions for all to authenticated
using (
  partner_id = public.current_active_partner_id()
  and exists (
    select 1 from public.partner_workout_programs p
    where p.id = program_id and p.partner_id = public.current_active_partner_id()
      and (p.program_kind = 'template' or public.current_partner_has_active_patient_link(p.patient_id))
  )
)
with check (
  partner_id = public.current_active_partner_id()
  and exists (
    select 1 from public.partner_workout_programs p
    where p.id = program_id and p.partner_id = public.current_active_partner_id()
      and (p.program_kind = 'template' or public.current_partner_has_active_patient_link(p.patient_id))
  )
);

create policy partner_workout_exercises_own_partner
on public.partner_workout_exercises for all to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());
create policy partner_workout_sets_own_partner
on public.partner_workout_sets for all to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());
create policy partner_workout_events_select_own_partner
on public.partner_workout_events for select to authenticated
using (
  partner_id = public.current_active_partner_id()
  and (patient_id is null or public.current_partner_has_active_patient_link(patient_id))
);
create policy partner_workout_events_insert_own_partner
on public.partner_workout_events for insert to authenticated
with check (
  partner_id = public.current_active_partner_id()
  and (patient_id is null or public.current_partner_has_active_patient_link(patient_id))
);

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
  if not p_as_template and not public.current_partner_has_active_patient_link(p_patient_id) then
    raise exception 'patient_link_required';
  end if;

  select * into source_program
  from public.partner_workout_programs
  where id = p_source_program_id and partner_id = current_partner_id;
  if source_program.id is null then raise exception 'program_not_found'; end if;

  insert into public.partner_workout_programs (
    partner_id, patient_id, program_kind, title, status, notes
  ) values (
    current_partner_id,
    case when p_as_template then null else p_patient_id end,
    case when p_as_template then 'template' else 'client' end,
    source_program.title || case when p_as_template then ' - Template' else ' - Cópia' end,
    'draft',
    source_program.notes
  ) returning id into new_program_id;

  for source_session in
    select * from public.partner_workout_sessions
    where program_id = source_program.id and partner_id = current_partner_id
    order by sort_order
  loop
    insert into public.partner_workout_sessions (
      partner_id, program_id, title, objective, frequency_per_week, duration_minutes, sort_order
    ) values (
      current_partner_id, new_program_id, source_session.title, source_session.objective,
      source_session.frequency_per_week, source_session.duration_minutes, source_session.sort_order
    ) returning id into new_session_id;

    for source_exercise in
      select * from public.partner_workout_exercises
      where session_id = source_session.id and partner_id = current_partner_id
      order by sort_order
    loop
      insert into public.partner_workout_exercises (
        partner_id, session_id, exercise_id, variation_name, rest_seconds, cadence, technique,
        notes, biset_group_id, biset_position, sort_order, snapshot_name, snapshot_muscle_group,
        snapshot_secondary_muscle_groups, snapshot_thumbnail_url
      ) values (
        current_partner_id, new_session_id, source_exercise.exercise_id, source_exercise.variation_name,
        source_exercise.rest_seconds, source_exercise.cadence, source_exercise.technique,
        source_exercise.notes,
        case when source_exercise.biset_group_id is null then null else md5(new_program_id::text || source_exercise.biset_group_id::text)::uuid end,
        source_exercise.biset_position,
        source_exercise.sort_order, source_exercise.snapshot_name,
        source_exercise.snapshot_muscle_group, source_exercise.snapshot_secondary_muscle_groups,
        source_exercise.snapshot_thumbnail_url
      ) returning id into new_exercise_id;

      insert into public.partner_workout_sets (
        partner_id, prescribed_exercise_id, set_number, reps, load_kg, intensity
      )
      select current_partner_id, new_exercise_id, s.set_number, s.reps, s.load_kg, s.intensity
      from public.partner_workout_sets s
      where s.prescribed_exercise_id = source_exercise.id and s.partner_id = current_partner_id;
    end loop;
  end loop;

  return new_program_id;
end;
$$;

revoke all on function public.partner_clone_workout_program(uuid, uuid, boolean) from public;
grant execute on function public.partner_clone_workout_program(uuid, uuid, boolean) to authenticated;

create or replace function public.partner_client_workouts(p_patient_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_partner_id uuid := public.current_active_partner_id();
begin
  if current_partner_id is null or not public.current_partner_has_active_patient_link(p_patient_id) then
    return null;
  end if;

  return jsonb_build_object(
    'programs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'title', p.title, 'status', p.status, 'version', p.version,
        'notes', p.notes, 'publishedAt', p.published_at, 'sentAt', p.sent_at,
        'createdAt', p.created_at, 'updatedAt', p.updated_at,
        'sessions', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', s.id, 'title', s.title, 'objective', s.objective,
            'frequencyPerWeek', s.frequency_per_week, 'durationMinutes', s.duration_minutes,
            'sortOrder', s.sort_order,
            'exercises', coalesce((
              select jsonb_agg(jsonb_build_object(
                'id', we.id, 'exerciseId', we.exercise_id, 'variationName', we.variation_name,
                'restSeconds', we.rest_seconds, 'cadence', we.cadence, 'technique', we.technique,
                'notes', we.notes, 'bisetGroupId', we.biset_group_id,
                'bisetPosition', we.biset_position, 'sortOrder', we.sort_order,
                'name', we.snapshot_name, 'muscleGroup', we.snapshot_muscle_group,
                'secondaryMuscleGroups', we.snapshot_secondary_muscle_groups,
                'thumbnailUrl', we.snapshot_thumbnail_url,
                'sets', coalesce((
                  select jsonb_agg(jsonb_build_object(
                    'id', ws.id, 'setNumber', ws.set_number, 'reps', ws.reps,
                    'loadKg', ws.load_kg, 'intensity', ws.intensity
                  ) order by ws.set_number)
                  from public.partner_workout_sets ws
                  where ws.prescribed_exercise_id = we.id and ws.partner_id = current_partner_id
                ), '[]'::jsonb)
              ) order by we.sort_order, we.created_at)
              from public.partner_workout_exercises we
              where we.session_id = s.id and we.partner_id = current_partner_id
            ), '[]'::jsonb)
          ) order by s.sort_order, s.created_at)
          from public.partner_workout_sessions s
          where s.program_id = p.id and s.partner_id = current_partner_id
        ), '[]'::jsonb)
      ) order by
        case p.status when 'sent' then 0 when 'published' then 1 when 'draft' then 2 else 3 end,
        p.updated_at desc)
      from public.partner_workout_programs p
      where p.partner_id = current_partner_id and p.patient_id = p_patient_id
        and p.program_kind = 'client' and p.status <> 'archived'
    ), '[]'::jsonb),
    'templates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'title', p.title, 'status', p.status, 'version', p.version,
        'notes', p.notes, 'createdAt', p.created_at, 'updatedAt', p.updated_at,
        'sessionCount', (select count(*) from public.partner_workout_sessions s where s.program_id = p.id)
      ) order by p.updated_at desc)
      from public.partner_workout_programs p
      where p.partner_id = current_partner_id and p.program_kind = 'template' and p.status <> 'archived'
    ), '[]'::jsonb),
    'exercises', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'name', e.name, 'muscleGroup', e.muscle_group,
        'secondaryMuscleGroups', e.secondary_muscle_groups, 'equipment', e.equipment,
        'objective', e.objective, 'defaultSets', e.default_sets, 'defaultReps', e.default_reps,
        'restSeconds', e.rest_seconds, 'cadence', e.cadence, 'thumbnailUrl', e.thumbnail_url,
        'videoUrl', e.video_url, 'variations', e.variations, 'usageCount', e.usage_count
      ) order by e.usage_count desc, e.name)
      from public.partner_protocol_exercises e
      where e.partner_id = current_partner_id and e.status = 'active'
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ev.id, 'actorName', ev.actor_name, 'eventType', ev.event_type,
        'detail', ev.detail, 'version', ev.version, 'createdAt', ev.created_at
      ) order by ev.created_at desc)
      from public.partner_workout_events ev
      where ev.partner_id = current_partner_id and ev.patient_id = p_patient_id
    ), '[]'::jsonb)
  );
end;
$$;

comment on function public.partner_client_workouts(uuid)
  is 'Returns workout programs, templates, exercise library and history for one linked Client.';
revoke all on function public.partner_client_workouts(uuid) from public;
grant execute on function public.partner_client_workouts(uuid) to authenticated;
