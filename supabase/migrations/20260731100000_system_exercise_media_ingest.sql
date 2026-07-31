alter table public.system_exercises
  alter column primary_muscle_group drop not null,
  alter column category drop not null,
  alter column equipment drop not null,
  alter column difficulty_level drop not null,
  alter column laterality drop not null,
  add column source_gif_storage_path text,
  add column preview_storage_path text,
  add column media_checksum text,
  add column media_version text,
  add column media_width integer,
  add column media_height integer,
  add column media_frame_count integer,
  add column media_is_animated boolean,
  add column source_size_bytes bigint,
  add column poster_size_bytes bigint,
  add column preview_size_bytes bigint,
  add column source_mime_type text,
  add column poster_mime_type text,
  add column preview_mime_type text,
  add column media_status text not null default 'pending',
  add column media_published_at timestamptz;

alter table public.system_exercises
  drop constraint system_exercises_primary_group_check,
  drop constraint system_exercises_equipment_check,
  drop constraint system_exercises_level_check,
  drop constraint system_exercises_laterality_check,
  drop constraint system_exercises_media_path_check,
  drop constraint system_exercises_poster_path_check;

alter table public.system_exercises
  add constraint system_exercises_primary_group_check
    check (
      primary_muscle_group is null
      or primary_muscle_group in ('peito', 'costas', 'pernas', 'ombros', 'biceps', 'triceps', 'core', 'gluteos', 'cardio_condicionamento', 'mobilidade', 'outros')
    ),
  add constraint system_exercises_equipment_check
    check (
      equipment is null
      or equipment in ('barra', 'halteres', 'maquina', 'polia', 'peso_corporal', 'elastico', 'kettlebell', 'outros')
    ),
  add constraint system_exercises_level_check
    check (difficulty_level is null or difficulty_level in ('iniciante', 'intermediario', 'avancado')),
  add constraint system_exercises_laterality_check
    check (laterality is null or laterality in ('unilateral', 'bilateral', 'alternado', 'nao_aplicavel')),
  add constraint system_exercises_media_path_check
    check (
      gif_storage_path is null
      or (
        gif_storage_path ~ '^[A-Za-z0-9][A-Za-z0-9/_-]*\.(gif|webp)$'
        and position('..' in gif_storage_path) = 0
      )
    ),
  add constraint system_exercises_poster_path_check
    check (
      poster_storage_path is null
      or (
        poster_storage_path ~ '^[A-Za-z0-9][A-Za-z0-9/_-]*\.(png|jpg|jpeg|webp)$'
        and position('..' in poster_storage_path) = 0
      )
    ),
  add constraint system_exercises_source_gif_path_check
    check (
      source_gif_storage_path is null
      or (
        source_gif_storage_path ~ '^[A-Za-z0-9][A-Za-z0-9/_-]*\.gif$'
        and position('..' in source_gif_storage_path) = 0
      )
    ),
  add constraint system_exercises_preview_path_check
    check (
      preview_storage_path is null
      or (
        preview_storage_path ~ '^[A-Za-z0-9][A-Za-z0-9/_-]*\.webp$'
        and position('..' in preview_storage_path) = 0
      )
    ),
  add constraint system_exercises_media_checksum_check
    check (media_checksum is null or media_checksum ~ '^[a-f0-9]{64}$'),
  add constraint system_exercises_media_dimensions_check
    check (
      (media_width is null or media_width between 1 and 4096)
      and (media_height is null or media_height between 1 and 4096)
      and (media_frame_count is null or media_frame_count between 1 and 10000)
    ),
  add constraint system_exercises_media_sizes_check
    check (
      (source_size_bytes is null or source_size_bytes > 0)
      and (poster_size_bytes is null or poster_size_bytes > 0)
      and (preview_size_bytes is null or preview_size_bytes > 0)
    ),
  add constraint system_exercises_media_mime_check
    check (
      (source_mime_type is null or source_mime_type = 'image/gif')
      and (poster_mime_type is null or poster_mime_type = 'image/webp')
      and (preview_mime_type is null or preview_mime_type = 'image/webp')
    ),
  add constraint system_exercises_media_status_check
    check (media_status in ('pending', 'published', 'failed', 'archived'));

create table public.system_exercise_media (
  id uuid primary key default gen_random_uuid(),
  system_exercise_id uuid not null references public.system_exercises(id) on delete cascade,
  source_key text not null,
  exercise_code text not null,
  media_version text not null,
  source_checksum text not null,
  source_file_name text not null,
  source_relative_path text not null,
  source_storage_path text not null,
  poster_storage_path text not null,
  preview_storage_path text,
  original_width integer not null,
  original_height integer not null,
  frame_count integer not null,
  is_animated boolean not null,
  duration_ms integer,
  original_size_bytes bigint not null,
  poster_size_bytes bigint not null,
  preview_size_bytes bigint,
  source_mime_type text not null default 'image/gif',
  poster_mime_type text not null default 'image/webp',
  preview_mime_type text,
  status text not null default 'published',
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint system_exercise_media_source_key_fkey
    foreign key (source_key) references public.system_exercises(source_key) on delete cascade,
  constraint system_exercise_media_code_check
    check (exercise_code ~ '^EX-[A-Z0-9]+(-[A-Z0-9]+)*$'),
  constraint system_exercise_media_checksum_check
    check (source_checksum ~ '^[a-f0-9]{64}$'),
  constraint system_exercise_media_relative_path_check
    check (position('..' in source_relative_path) = 0 and length(btrim(source_relative_path)) > 0),
  constraint system_exercise_media_storage_path_check
    check (
      source_storage_path ~ '^exercise-library/[A-Z0-9-]+/[a-f0-9]{8}/source\.gif$'
      and poster_storage_path ~ '^exercise-library/[A-Z0-9-]+/[a-f0-9]{8}/poster\.webp$'
      and (
        preview_storage_path is null
        or preview_storage_path ~ '^exercise-library/[A-Z0-9-]+/[a-f0-9]{8}/preview\.webp$'
      )
    ),
  constraint system_exercise_media_dimensions_check
    check (original_width between 1 and 4096 and original_height between 1 and 4096 and frame_count between 1 and 10000),
  constraint system_exercise_media_duration_check
    check (duration_ms is null or duration_ms between 1 and 3600000),
  constraint system_exercise_media_size_check
    check (
      original_size_bytes > 0
      and poster_size_bytes > 0
      and (preview_size_bytes is null or preview_size_bytes > 0)
    ),
  constraint system_exercise_media_mime_check
    check (
      source_mime_type = 'image/gif'
      and poster_mime_type = 'image/webp'
      and (preview_mime_type is null or preview_mime_type = 'image/webp')
    ),
  constraint system_exercise_media_status_check
    check (status in ('pending', 'published', 'failed', 'archived')),
  constraint system_exercise_media_metadata_object_check check (jsonb_typeof(metadata) = 'object'),
  constraint system_exercise_media_exercise_checksum_key unique (system_exercise_id, source_checksum)
);

create index system_exercise_media_source_checksum_idx
  on public.system_exercise_media (source_checksum);

create index system_exercise_media_exercise_status_idx
  on public.system_exercise_media (system_exercise_id, status, created_at desc);

create trigger system_exercise_media_set_updated_at
before update on public.system_exercise_media
for each row execute function public.set_updated_at();

alter table public.system_exercise_media enable row level security;

revoke all on table public.system_exercise_media from public, anon, authenticated;
grant select on table public.system_exercise_media to authenticated;
grant select, insert, update, delete on table public.system_exercise_media to service_role;

create policy system_exercise_media_select_published
on public.system_exercise_media for select to authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.system_exercises exercise
    where exercise.id = system_exercise_media.system_exercise_id
      and exercise.publication_status = 'published'
  )
);

update storage.buckets
set
  file_size_limit = 33554432,
  allowed_mime_types = array['image/gif', 'image/webp', 'image/png', 'image/jpeg']::text[],
  updated_at = now()
where id = 'system-exercise-media';

create or replace function public.partner_import_system_exercises(
  p_exercise_ids uuid[] default null,
  p_import_all boolean default false,
  p_query text default null,
  p_muscle_group text default null,
  p_equipment text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_partner_id uuid := public.current_active_partner_id();
  batch_id uuid := null;
  v_selected_exercise_ids uuid[] := '{}'::uuid[];
  v_reactivated_exercise_ids uuid[] := '{}'::uuid[];
  v_requested_count integer := 0;
  v_imported_count integer := 0;
  v_already_count integer := 0;
  v_reactivated_count integer := 0;
begin
  if current_partner_id is null then
    raise exception 'partner_not_available' using errcode = '42501';
  end if;

  if coalesce(array_length(p_exercise_ids, 1), 0) > 300 then
    raise exception 'too_many_items' using errcode = '22023';
  end if;

  select coalesce(array_agg(selected.id), '{}'::uuid[])
  into v_selected_exercise_ids
  from (
    select exercise.id
    from public.system_exercises exercise
    where exercise.publication_status = 'published'
      and (
        p_import_all
        or (
          p_exercise_ids is not null
          and exercise.id = any(p_exercise_ids)
        )
      )
      and (
        nullif(btrim(coalesce(p_query, '')), '') is null
        or lower(exercise.name) like '%' || lower(btrim(p_query)) || '%'
        or lower(coalesce(exercise.description, '')) like '%' || lower(btrim(p_query)) || '%'
      )
      and (nullif(btrim(coalesce(p_muscle_group, '')), '') is null or exercise.primary_muscle_group = p_muscle_group)
      and (nullif(btrim(coalesce(p_equipment, '')), '') is null or exercise.equipment = p_equipment)
    order by exercise.name
    limit 300
  ) selected;

  v_requested_count := cardinality(v_selected_exercise_ids);

  if v_requested_count = 0 then
    return jsonb_build_object(
      'requested', 0,
      'imported', 0,
      'alreadyImported', 0,
      'reactivated', 0,
      'failed', 0,
      'batchId', null
    );
  end if;

  select
    count(*)::integer,
    coalesce(array_agg(partner_exercise.system_exercise_id) filter (where partner_exercise.status = 'archived'), '{}'::uuid[])
  into v_already_count, v_reactivated_exercise_ids
  from public.partner_protocol_exercises partner_exercise
  where partner_exercise.partner_id = current_partner_id
    and partner_exercise.system_exercise_id = any(v_selected_exercise_ids);

  v_reactivated_count := cardinality(v_reactivated_exercise_ids);

  with upserted as (
    insert into public.partner_protocol_exercises (
      partner_id, name, muscle_group, secondary_muscle_groups, equipment,
      level, objective, default_sets, default_reps, rest_seconds, cadence,
      video_url, thumbnail_url, instructions, tags, variations, usage_count,
      status, system_exercise_id, source_version_snapshot, source_checksum_snapshot,
      source_snapshot, imported_at
    )
    select
      current_partner_id,
      case
        when exists (
          select 1
          from public.partner_protocol_exercises existing_exercise
          where existing_exercise.partner_id = current_partner_id
            and existing_exercise.status = 'active'
            and lower(existing_exercise.name) = lower(exercise.name)
            and existing_exercise.system_exercise_id is distinct from exercise.id
        ) then left(exercise.name || ' (Oficial)', 140)
        else exercise.name
      end,
      coalesce(exercise.primary_muscle_group, 'outros'),
      coalesce(exercise.secondary_muscle_groups, '{}'::text[]),
      coalesce(exercise.equipment, 'outros'),
      coalesce(exercise.difficulty_level, 'intermediario'),
      case
        when exercise.category in ('mobilidade', 'reabilitacao', 'condicionamento') then exercise.category
        else 'hipertrofia'
      end,
      4,
      '8-12',
      90,
      null,
      case
        when coalesce(exercise.preview_storage_path, exercise.gif_storage_path, exercise.source_gif_storage_path) is not null
        then '/storage/v1/object/public/system-exercise-media/' || coalesce(exercise.preview_storage_path, exercise.gif_storage_path, exercise.source_gif_storage_path)
        else null
      end,
      case when exercise.poster_storage_path is not null then '/storage/v1/object/public/system-exercise-media/' || exercise.poster_storage_path else null end,
      exercise.instructions,
      array_remove(array['oficial', coalesce(exercise.primary_muscle_group, 'outros'), coalesce(exercise.equipment, 'outros')], null),
      '{}'::text[],
      0,
      'active',
      exercise.id,
      exercise.source_version,
      coalesce(exercise.media_checksum, exercise.source_checksum),
      jsonb_build_object(
        'sourceKey', exercise.source_key,
        'slug', exercise.slug,
        'name', exercise.name,
        'primaryMuscleGroup', exercise.primary_muscle_group,
        'secondaryMuscleGroups', exercise.secondary_muscle_groups,
        'equipment', exercise.equipment,
        'difficultyLevel', exercise.difficulty_level,
        'gifStoragePath', exercise.gif_storage_path,
        'sourceGifStoragePath', exercise.source_gif_storage_path,
        'posterStoragePath', exercise.poster_storage_path,
        'previewStoragePath', exercise.preview_storage_path,
        'mediaChecksum', exercise.media_checksum,
        'mediaVersion', exercise.media_version,
        'mediaWidth', exercise.media_width,
        'mediaHeight', exercise.media_height,
        'mediaFrameCount', exercise.media_frame_count,
        'source', exercise.source_name,
        'operationalNormalization', jsonb_build_object(
          'primaryMuscleGroup', case when exercise.primary_muscle_group is null then 'outros' else null end,
          'equipment', case when exercise.equipment is null then 'outros' else null end,
          'difficultyLevel', case when exercise.difficulty_level is null then 'intermediario' else null end
        )
      ),
      now()
    from public.system_exercises exercise
    where exercise.id = any(v_selected_exercise_ids)
    on conflict (partner_id, system_exercise_id)
    where system_exercise_id is not null
    do update set
      status = 'active',
      source_version_snapshot = excluded.source_version_snapshot,
      source_checksum_snapshot = excluded.source_checksum_snapshot,
      source_snapshot = excluded.source_snapshot,
      thumbnail_url = excluded.thumbnail_url,
      video_url = excluded.video_url,
      imported_at = coalesce(public.partner_protocol_exercises.imported_at, now()),
      updated_at = now()
    returning id, system_exercise_id, (xmax = 0) as inserted
  ),
  import_summary as (
    select count(*) filter (where inserted)::integer as imported_count
    from upserted
  ),
  batch as (
    insert into public.catalog_import_batches (
      partner_id, catalog_type, source_name, source_version, source_checksum,
      selection_mode, filters, requested_count, imported_count,
      already_imported_count, reactivated_count, failed_count, status
    )
    select
      current_partner_id,
      'exercise',
      max(exercise.source_name),
      max(exercise.source_version),
      max(coalesce(exercise.media_checksum, exercise.source_checksum)),
      case when p_import_all then 'all' when p_exercise_ids is not null then 'selected' else 'filtered' end,
      jsonb_build_object('query', p_query, 'muscleGroup', p_muscle_group, 'equipment', p_equipment),
      v_requested_count,
      summary.imported_count,
      greatest(v_already_count - v_reactivated_count, 0),
      v_reactivated_count,
      0,
      'completed'
    from public.system_exercises exercise
    cross join import_summary summary
    where exercise.id = any(v_selected_exercise_ids)
    group by summary.imported_count
    returning id
  ),
  items as (
    insert into public.catalog_import_items (
      batch_id, partner_id, catalog_type, system_exercise_id, partner_exercise_id, status, detail
    )
    select
      batch.id,
      current_partner_id,
      'exercise',
      imported.system_exercise_id,
      imported.id,
      case
        when imported.inserted then 'imported'
        when imported.system_exercise_id = any(v_reactivated_exercise_ids) then 'reactivated'
        else 'already_imported'
      end,
      null
    from upserted imported
    cross join batch
    returning 1
  )
  select summary.imported_count, batch.id
  into v_imported_count, batch_id
  from import_summary summary
  cross join batch;

  return jsonb_build_object(
    'requested', v_requested_count,
    'imported', v_imported_count,
    'alreadyImported', greatest(v_already_count - v_reactivated_count, 0),
    'reactivated', v_reactivated_count,
    'failed', 0,
    'batchId', batch_id
  );
end;
$$;

revoke all on function public.partner_import_system_exercises(uuid[], boolean, text, text, text) from public;
grant execute on function public.partner_import_system_exercises(uuid[], boolean, text, text, text) to authenticated;
