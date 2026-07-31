create table public.system_foods (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  food_number integer not null,
  description text not null,
  category_taco text not null,
  partner_category text not null default 'outros',
  predominant_macro text not null,
  energy_kcal_100g numeric(12, 6),
  carbohydrate_g_100g numeric(12, 6),
  protein_g_100g numeric(12, 6),
  lipids_g_100g numeric(12, 6),
  fiber_g_100g numeric(12, 6),
  carbohydrate_g_per_g numeric(12, 8),
  protein_g_per_g numeric(12, 8),
  fat_g_per_g numeric(12, 8),
  fiber_g_per_g numeric(12, 8),
  energy_kcal_per_g numeric(12, 8),
  source_name text not null,
  source_version text not null,
  source_checksum text not null,
  source_row_hash text not null,
  publication_status text not null default 'published',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint system_foods_source_key_key unique (source_key),
  constraint system_foods_food_number_key unique (food_number),
  constraint system_foods_description_not_blank check (length(btrim(description)) between 2 and 180),
  constraint system_foods_category_taco_not_blank check (length(btrim(category_taco)) > 0),
  constraint system_foods_partner_category_check
    check (partner_category in ('cereal', 'carne', 'fruta', 'gordura', 'laticinio', 'leguminosa', 'suplemento', 'verdura', 'outros')),
  constraint system_foods_macro_check
    check (predominant_macro in ('Carboidrato', 'Proteína', 'Gordura', 'Indeterminado')),
  constraint system_foods_source_not_blank
    check (length(btrim(source_name)) > 0 and length(btrim(source_version)) > 0 and length(btrim(source_checksum)) > 0 and length(btrim(source_row_hash)) > 0),
  constraint system_foods_publication_status_check
    check (publication_status in ('draft', 'published', 'archived')),
  constraint system_foods_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index system_foods_published_category_idx
  on public.system_foods (publication_status, category_taco, predominant_macro, description);

create index system_foods_description_idx
  on public.system_foods (lower(description));

create table public.system_exercises (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  name text not null,
  slug text not null,
  description text,
  instructions text,
  primary_muscle_group text not null,
  secondary_muscle_groups text[] not null default '{}',
  category text not null default 'forca',
  equipment text not null default 'peso_corporal',
  difficulty_level text not null default 'intermediario',
  movement_pattern text,
  laterality text not null default 'bilateral',
  safety_notes text,
  contraindications text,
  gif_storage_path text,
  poster_storage_path text,
  media_duration_seconds integer,
  source_name text not null,
  source_version text not null,
  source_checksum text,
  publication_status text not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint system_exercises_source_key_key unique (source_key),
  constraint system_exercises_slug_key unique (slug),
  constraint system_exercises_name_not_blank check (length(btrim(name)) between 2 and 140),
  constraint system_exercises_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint system_exercises_primary_group_check
    check (primary_muscle_group in ('peito', 'costas', 'pernas', 'ombros', 'biceps', 'triceps', 'core', 'gluteos', 'cardio_condicionamento', 'mobilidade', 'outros')),
  constraint system_exercises_secondary_groups_check
    check (cardinality(secondary_muscle_groups) <= 8),
  constraint system_exercises_equipment_check
    check (equipment in ('barra', 'halteres', 'maquina', 'polia', 'peso_corporal', 'elastico', 'kettlebell', 'outros')),
  constraint system_exercises_level_check
    check (difficulty_level in ('iniciante', 'intermediario', 'avancado')),
  constraint system_exercises_laterality_check
    check (laterality in ('unilateral', 'bilateral', 'alternado', 'nao_aplicavel')),
  constraint system_exercises_source_not_blank
    check (length(btrim(source_name)) > 0 and length(btrim(source_version)) > 0),
  constraint system_exercises_publication_status_check
    check (publication_status in ('draft', 'published', 'archived')),
  constraint system_exercises_media_path_check
    check (
      gif_storage_path is null
      or (
        gif_storage_path ~ '^[a-z0-9][a-z0-9/_-]*\\.(gif|webp)$'
        and position('..' in gif_storage_path) = 0
      )
    ),
  constraint system_exercises_poster_path_check
    check (
      poster_storage_path is null
      or (
        poster_storage_path ~ '^[a-z0-9][a-z0-9/_-]*\\.(png|jpg|jpeg|webp)$'
        and position('..' in poster_storage_path) = 0
      )
    ),
  constraint system_exercises_media_duration_check
    check (media_duration_seconds is null or media_duration_seconds between 1 and 600),
  constraint system_exercises_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index system_exercises_published_filters_idx
  on public.system_exercises (publication_status, primary_muscle_group, equipment, difficulty_level, name);

create index system_exercises_name_idx
  on public.system_exercises (lower(name));

create table public.catalog_import_batches (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  catalog_type text not null,
  source_name text not null,
  source_version text,
  source_checksum text,
  selection_mode text not null,
  filters jsonb not null default '{}'::jsonb,
  requested_count integer not null default 0,
  imported_count integer not null default 0,
  already_imported_count integer not null default 0,
  reactivated_count integer not null default 0,
  failed_count integer not null default 0,
  status text not null default 'completed',
  created_at timestamptz not null default now(),

  constraint catalog_import_batches_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint catalog_import_batches_catalog_type_check
    check (catalog_type in ('food', 'exercise')),
  constraint catalog_import_batches_selection_mode_check
    check (selection_mode in ('selected', 'filtered', 'all')),
  constraint catalog_import_batches_counts_check
    check (
      requested_count >= 0
      and imported_count >= 0
      and already_imported_count >= 0
      and reactivated_count >= 0
      and failed_count >= 0
    ),
  constraint catalog_import_batches_status_check
    check (status in ('completed', 'partial', 'failed')),
  constraint catalog_import_batches_filters_object_check check (jsonb_typeof(filters) = 'object')
);

create index catalog_import_batches_partner_created_idx
  on public.catalog_import_batches (partner_id, created_at desc);

create table public.catalog_import_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null,
  partner_id uuid not null,
  catalog_type text not null,
  system_food_id uuid,
  partner_food_id uuid,
  system_exercise_id uuid,
  partner_exercise_id uuid,
  status text not null,
  detail text,
  created_at timestamptz not null default now(),

  constraint catalog_import_items_batch_id_fkey
    foreign key (batch_id) references public.catalog_import_batches(id) on delete cascade,
  constraint catalog_import_items_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint catalog_import_items_system_food_id_fkey
    foreign key (system_food_id) references public.system_foods(id) on delete restrict,
  constraint catalog_import_items_partner_food_fkey
    foreign key (partner_food_id, partner_id) references public.partner_protocol_foods(id, partner_id) on delete cascade,
  constraint catalog_import_items_system_exercise_id_fkey
    foreign key (system_exercise_id) references public.system_exercises(id) on delete restrict,
  constraint catalog_import_items_partner_exercise_fkey
    foreign key (partner_exercise_id, partner_id) references public.partner_protocol_exercises(id, partner_id) on delete cascade,
  constraint catalog_import_items_catalog_type_check
    check (catalog_type in ('food', 'exercise')),
  constraint catalog_import_items_shape_check
    check (
      (catalog_type = 'food' and system_food_id is not null and partner_food_id is not null and system_exercise_id is null and partner_exercise_id is null)
      or
      (catalog_type = 'exercise' and system_exercise_id is not null and partner_exercise_id is not null and system_food_id is null and partner_food_id is null)
    ),
  constraint catalog_import_items_status_check
    check (status in ('imported', 'already_imported', 'reactivated', 'failed')),
  constraint catalog_import_items_detail_not_blank
    check (detail is null or length(btrim(detail)) > 0)
);

create index catalog_import_items_batch_idx
  on public.catalog_import_items (batch_id, status);

alter table public.partner_protocol_foods
  add column system_food_id uuid,
  add column source_version_snapshot text,
  add column source_checksum_snapshot text,
  add column source_snapshot jsonb,
  add column imported_at timestamptz,
  add column local_alias text;

alter table public.partner_protocol_foods
  add constraint partner_protocol_foods_system_food_id_fkey
    foreign key (system_food_id) references public.system_foods(id) on delete restrict,
  add constraint partner_protocol_foods_source_snapshot_object_check
    check (source_snapshot is null or jsonb_typeof(source_snapshot) = 'object'),
  add constraint partner_protocol_foods_local_alias_not_blank
    check (local_alias is null or length(btrim(local_alias)) between 2 and 140);

create unique index partner_protocol_foods_partner_system_food_key
  on public.partner_protocol_foods (partner_id, system_food_id)
  where system_food_id is not null;

alter table public.partner_protocol_exercises
  add column system_exercise_id uuid,
  add column source_version_snapshot text,
  add column source_checksum_snapshot text,
  add column source_snapshot jsonb,
  add column imported_at timestamptz,
  add column local_alias text;

alter table public.partner_protocol_exercises
  add constraint partner_protocol_exercises_system_exercise_id_fkey
    foreign key (system_exercise_id) references public.system_exercises(id) on delete restrict,
  add constraint partner_protocol_exercises_source_snapshot_object_check
    check (source_snapshot is null or jsonb_typeof(source_snapshot) = 'object'),
  add constraint partner_protocol_exercises_local_alias_not_blank
    check (local_alias is null or length(btrim(local_alias)) between 2 and 140);

create unique index partner_protocol_exercises_partner_system_exercise_key
  on public.partner_protocol_exercises (partner_id, system_exercise_id)
  where system_exercise_id is not null;

create trigger system_foods_set_updated_at
before update on public.system_foods
for each row execute function public.set_updated_at();

create trigger system_exercises_set_updated_at
before update on public.system_exercises
for each row execute function public.set_updated_at();

alter table public.system_foods enable row level security;
alter table public.system_exercises enable row level security;
alter table public.catalog_import_batches enable row level security;
alter table public.catalog_import_items enable row level security;

revoke all on table public.system_foods from public, anon, authenticated;
revoke all on table public.system_exercises from public, anon, authenticated;
revoke all on table public.catalog_import_batches from public, anon, authenticated;
revoke all on table public.catalog_import_items from public, anon, authenticated;

grant select on table public.system_foods to authenticated;
grant select on table public.system_exercises to authenticated;
grant select, insert on table public.catalog_import_batches to authenticated;
grant select, insert on table public.catalog_import_items to authenticated;

grant select, insert, update, delete on table public.system_foods to service_role;
grant select, insert, update, delete on table public.system_exercises to service_role;
grant select, insert, update, delete on table public.catalog_import_batches to service_role;
grant select, insert, update, delete on table public.catalog_import_items to service_role;

create policy system_foods_select_published
on public.system_foods for select to authenticated
using (publication_status = 'published');

create policy system_exercises_select_published
on public.system_exercises for select to authenticated
using (publication_status = 'published');

create policy catalog_import_batches_select_own_partner
on public.catalog_import_batches for select to authenticated
using (partner_id = public.current_active_partner_id());

create policy catalog_import_batches_insert_own_partner
on public.catalog_import_batches for insert to authenticated
with check (partner_id = public.current_active_partner_id());

create policy catalog_import_items_select_own_partner
on public.catalog_import_items for select to authenticated
using (partner_id = public.current_active_partner_id());

create policy catalog_import_items_insert_own_partner
on public.catalog_import_items for insert to authenticated
with check (partner_id = public.current_active_partner_id());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'system-exercise-media',
  'system-exercise-media',
  true,
  8388608,
  array['image/gif', 'image/webp', 'image/png', 'image/jpeg']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

create policy system_exercise_media_select_public
on storage.objects for select to anon, authenticated
using (bucket_id = 'system-exercise-media');

create policy system_exercise_media_insert_admin
on storage.objects for insert to authenticated
with check (
  bucket_id = 'system-exercise-media'
  and public.current_active_admin_id() is not null
  and (storage.extension(name) in ('gif', 'webp', 'png', 'jpg', 'jpeg'))
);

create policy system_exercise_media_update_admin
on storage.objects for update to authenticated
using (
  bucket_id = 'system-exercise-media'
  and public.current_active_admin_id() is not null
)
with check (
  bucket_id = 'system-exercise-media'
  and public.current_active_admin_id() is not null
  and (storage.extension(name) in ('gif', 'webp', 'png', 'jpg', 'jpeg'))
);

create policy system_exercise_media_delete_admin
on storage.objects for delete to authenticated
using (
  bucket_id = 'system-exercise-media'
  and public.current_active_admin_id() is not null
);

create or replace function public.partner_import_system_foods(
  p_food_ids uuid[] default null,
  p_import_all boolean default false,
  p_query text default null,
  p_category_taco text default null,
  p_macro text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_partner_id uuid := public.current_active_partner_id();
  batch_id uuid := null;
  v_selected_food_ids uuid[] := '{}'::uuid[];
  v_reactivated_food_ids uuid[] := '{}'::uuid[];
  v_requested_count integer := 0;
  v_imported_count integer := 0;
  v_already_count integer := 0;
  v_reactivated_count integer := 0;
begin
  if current_partner_id is null then
    raise exception 'partner_not_available' using errcode = '42501';
  end if;

  if coalesce(array_length(p_food_ids, 1), 0) > 600 then
    raise exception 'too_many_items' using errcode = '22023';
  end if;

  select coalesce(array_agg(selected.id), '{}'::uuid[])
  into v_selected_food_ids
  from (
    select food.id
    from public.system_foods food
    where food.publication_status = 'published'
      and (
        p_import_all
        or (
          p_food_ids is not null
          and food.id = any(p_food_ids)
        )
      )
      and (
        nullif(btrim(coalesce(p_query, '')), '') is null
        or lower(food.description) like '%' || lower(btrim(p_query)) || '%'
        or lower(food.category_taco) like '%' || lower(btrim(p_query)) || '%'
      )
      and (nullif(btrim(coalesce(p_category_taco, '')), '') is null or food.category_taco = p_category_taco)
      and (nullif(btrim(coalesce(p_macro, '')), '') is null or food.predominant_macro = p_macro)
    order by food.description
    limit 600
  ) selected;

  v_requested_count := cardinality(v_selected_food_ids);

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
    coalesce(array_agg(partner_food.system_food_id) filter (where partner_food.status = 'archived'), '{}'::uuid[])
  into v_already_count, v_reactivated_food_ids
  from public.partner_protocol_foods partner_food
  where partner_food.partner_id = current_partner_id
    and partner_food.system_food_id = any(v_selected_food_ids);

  v_reactivated_count := cardinality(v_reactivated_food_ids);

  with upserted as (
    insert into public.partner_protocol_foods (
      partner_id, name, category, source, serving_size, serving_unit,
      kcal, carbs_g, protein_g, fat_g, fiber_g, sodium_mg, notes, tags,
      suggested_uses, usage_count, status, system_food_id, source_version_snapshot,
      source_checksum_snapshot, source_snapshot, imported_at
    )
    select
      current_partner_id,
      case
        when exists (
          select 1
          from public.partner_protocol_foods existing_food
          where existing_food.partner_id = current_partner_id
            and existing_food.status = 'active'
            and lower(existing_food.name) = lower(food.description)
            and existing_food.system_food_id is distinct from food.id
        ) then left(food.description || ' (TACO #' || food.food_number::text || ')', 140)
        else food.description
      end,
      food.partner_category,
      'taco',
      100,
      'g',
      greatest(coalesce(food.energy_kcal_100g, 0), 0),
      greatest(coalesce(food.carbohydrate_g_100g, 0), 0),
      greatest(coalesce(food.protein_g_100g, 0), 0),
      greatest(coalesce(food.lipids_g_100g, 0), 0),
      greatest(coalesce(food.fiber_g_100g, 0), 0),
      0,
      'Fonte: ' || food.source_name,
      array['taco', lower(food.predominant_macro)],
      array['refeicao_principal'],
      0,
      'active',
      food.id,
      food.source_version,
      food.source_checksum,
      jsonb_build_object(
        'sourceKey', food.source_key,
        'foodNumber', food.food_number,
        'description', food.description,
        'categoryTaco', food.category_taco,
        'predominantMacro', food.predominant_macro,
        'energyKcal100g', food.energy_kcal_100g,
        'carbohydrateG100g', food.carbohydrate_g_100g,
        'proteinG100g', food.protein_g_100g,
        'lipidsG100g', food.lipids_g_100g,
        'fiberG100g', food.fiber_g_100g,
        'carbohydrateGPerG', food.carbohydrate_g_per_g,
        'proteinGPerG', food.protein_g_per_g,
        'fatGPerG', food.fat_g_per_g,
        'fiberGPerG', food.fiber_g_per_g,
        'energyKcalPerG', food.energy_kcal_per_g,
        'source', food.source_name,
        'operationalNormalization',
          case
            when coalesce(food.energy_kcal_100g, 0) < 0
              or coalesce(food.carbohydrate_g_100g, 0) < 0
              or coalesce(food.protein_g_100g, 0) < 0
              or coalesce(food.lipids_g_100g, 0) < 0
              or coalesce(food.fiber_g_100g, 0) < 0
            then 'Valores residuais negativos da fonte foram preservados neste snapshot e zerados apenas nos campos operacionais do catálogo do parceiro.'
            else null
          end
      ),
      now()
    from public.system_foods food
    where food.id = any(v_selected_food_ids)
    on conflict (partner_id, system_food_id)
    where system_food_id is not null
    do update set
      status = 'active',
      source_version_snapshot = excluded.source_version_snapshot,
      source_checksum_snapshot = excluded.source_checksum_snapshot,
      source_snapshot = excluded.source_snapshot,
      imported_at = coalesce(public.partner_protocol_foods.imported_at, now()),
      updated_at = now()
    returning id, system_food_id, (xmax = 0) as inserted
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
      'food',
      'TACO',
      max(food.source_version),
      max(food.source_checksum),
      case when p_import_all then 'all' when p_food_ids is not null then 'selected' else 'filtered' end,
      jsonb_build_object('query', p_query, 'categoryTaco', p_category_taco, 'macro', p_macro),
      v_requested_count,
      summary.imported_count,
      greatest(v_already_count - v_reactivated_count, 0),
      v_reactivated_count,
      0,
      'completed'
    from public.system_foods food
    cross join import_summary summary
    where food.id = any(v_selected_food_ids)
    group by summary.imported_count
    returning id
  ),
  items as (
    insert into public.catalog_import_items (
      batch_id, partner_id, catalog_type, system_food_id, partner_food_id, status, detail
    )
    select
      batch.id,
      current_partner_id,
      'food',
      imported.system_food_id,
      imported.id,
      case
        when imported.inserted then 'imported'
        when imported.system_food_id = any(v_reactivated_food_ids) then 'reactivated'
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
      exercise.primary_muscle_group,
      exercise.secondary_muscle_groups,
      exercise.equipment,
      exercise.difficulty_level,
      case
        when exercise.category in ('mobilidade', 'reabilitacao', 'condicionamento') then exercise.category
        else 'hipertrofia'
      end,
      4,
      '8-12',
      90,
      null,
      case when exercise.gif_storage_path is not null then '/storage/v1/object/public/system-exercise-media/' || exercise.gif_storage_path else null end,
      case when exercise.poster_storage_path is not null then '/storage/v1/object/public/system-exercise-media/' || exercise.poster_storage_path else null end,
      exercise.instructions,
      array_remove(array['oficial', exercise.primary_muscle_group, exercise.equipment], null),
      '{}'::text[],
      0,
      'active',
      exercise.id,
      exercise.source_version,
      exercise.source_checksum,
      jsonb_build_object(
        'sourceKey', exercise.source_key,
        'slug', exercise.slug,
        'name', exercise.name,
        'primaryMuscleGroup', exercise.primary_muscle_group,
        'secondaryMuscleGroups', exercise.secondary_muscle_groups,
        'equipment', exercise.equipment,
        'difficultyLevel', exercise.difficulty_level,
        'gifStoragePath', exercise.gif_storage_path,
        'posterStoragePath', exercise.poster_storage_path,
        'source', exercise.source_name
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
      max(exercise.source_checksum),
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

revoke all on function public.partner_import_system_foods(uuid[], boolean, text, text, text) from public;
revoke all on function public.partner_import_system_exercises(uuid[], boolean, text, text, text) from public;
grant execute on function public.partner_import_system_foods(uuid[], boolean, text, text, text) to authenticated;
grant execute on function public.partner_import_system_exercises(uuid[], boolean, text, text, text) to authenticated;
