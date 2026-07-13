create table public.partner_protocol_foods (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  name text not null,
  category text not null default 'outros',
  source text not null default 'custom',
  serving_size numeric(10, 2) not null default 100,
  serving_unit text not null default 'g',
  household_measure text,
  kcal numeric(10, 2) not null default 0,
  carbs_g numeric(10, 2) not null default 0,
  protein_g numeric(10, 2) not null default 0,
  fat_g numeric(10, 2) not null default 0,
  fiber_g numeric(10, 2) not null default 0,
  sodium_mg numeric(10, 2) not null default 0,
  notes text,
  tags text[] not null default '{}',
  suggested_uses text[] not null default '{}',
  usage_count integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_protocol_foods_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_protocol_foods_id_partner_key unique (id, partner_id),
  constraint partner_protocol_foods_name_not_blank
    check (length(btrim(name)) between 2 and 140),
  constraint partner_protocol_foods_category_check
    check (category in ('cereal', 'carne', 'fruta', 'gordura', 'laticinio', 'leguminosa', 'suplemento', 'verdura', 'outros')),
  constraint partner_protocol_foods_source_check
    check (source in ('taco', 'tbca', 'custom', 'imported')),
  constraint partner_protocol_foods_serving_check
    check (serving_size > 0 and length(btrim(serving_unit)) between 1 and 20),
  constraint partner_protocol_foods_household_measure_not_blank
    check (household_measure is null or length(btrim(household_measure)) > 0),
  constraint partner_protocol_foods_non_negative_values
    check (
      kcal >= 0
      and carbs_g >= 0
      and protein_g >= 0
      and fat_g >= 0
      and fiber_g >= 0
      and sodium_mg >= 0
      and usage_count >= 0
    ),
  constraint partner_protocol_foods_notes_not_blank
    check (notes is null or length(btrim(notes)) > 0),
  constraint partner_protocol_foods_tags_limit
    check (cardinality(tags) <= 12),
  constraint partner_protocol_foods_suggested_uses_check
    check (
      cardinality(suggested_uses) <= 8
      and suggested_uses <@ array['pre_treino', 'pos_treino', 'lanche', 'refeicao_principal', 'ceia', 'outro']::text[]
    ),
  constraint partner_protocol_foods_status_check
    check (status in ('active', 'archived'))
);

create index partner_protocol_foods_partner_updated_idx
  on public.partner_protocol_foods (partner_id, updated_at desc);

create index partner_protocol_foods_partner_status_category_idx
  on public.partner_protocol_foods (partner_id, status, category);

create unique index partner_protocol_foods_partner_name_active_key
  on public.partner_protocol_foods (partner_id, lower(name))
  where status = 'active';

create table public.partner_protocol_exercises (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  name text not null,
  muscle_group text not null,
  equipment text not null default 'peso_corporal',
  level text not null default 'intermediario',
  objective text not null default 'hipertrofia',
  default_sets integer not null default 4,
  default_reps text not null default '8-12',
  rest_seconds integer not null default 90,
  cadence text,
  video_url text,
  thumbnail_url text,
  instructions text,
  tags text[] not null default '{}',
  variations text[] not null default '{}',
  usage_count integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_protocol_exercises_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_protocol_exercises_id_partner_key unique (id, partner_id),
  constraint partner_protocol_exercises_name_not_blank
    check (length(btrim(name)) between 2 and 140),
  constraint partner_protocol_exercises_muscle_group_check
    check (muscle_group in ('peito', 'costas', 'pernas', 'ombros', 'biceps', 'triceps', 'core', 'gluteos', 'cardio_condicionamento', 'mobilidade', 'outros')),
  constraint partner_protocol_exercises_equipment_check
    check (equipment in ('barra', 'halteres', 'maquina', 'polia', 'peso_corporal', 'elastico', 'kettlebell', 'outros')),
  constraint partner_protocol_exercises_level_check
    check (level in ('iniciante', 'intermediario', 'avancado')),
  constraint partner_protocol_exercises_objective_check
    check (objective in ('forca', 'hipertrofia', 'resistencia', 'mobilidade', 'reabilitacao', 'condicionamento')),
  constraint partner_protocol_exercises_sets_check
    check (default_sets between 1 and 12),
  constraint partner_protocol_exercises_reps_not_blank
    check (length(btrim(default_reps)) between 1 and 40),
  constraint partner_protocol_exercises_rest_check
    check (rest_seconds between 0 and 600),
  constraint partner_protocol_exercises_cadence_not_blank
    check (cadence is null or length(btrim(cadence)) > 0),
  constraint partner_protocol_exercises_video_url_not_blank
    check (video_url is null or length(btrim(video_url)) > 0),
  constraint partner_protocol_exercises_thumbnail_url_not_blank
    check (thumbnail_url is null or length(btrim(thumbnail_url)) > 0),
  constraint partner_protocol_exercises_instructions_not_blank
    check (instructions is null or length(btrim(instructions)) > 0),
  constraint partner_protocol_exercises_tags_limit
    check (cardinality(tags) <= 12),
  constraint partner_protocol_exercises_variations_limit
    check (cardinality(variations) <= 12),
  constraint partner_protocol_exercises_usage_check
    check (usage_count >= 0),
  constraint partner_protocol_exercises_status_check
    check (status in ('active', 'archived'))
);

create index partner_protocol_exercises_partner_updated_idx
  on public.partner_protocol_exercises (partner_id, updated_at desc);

create index partner_protocol_exercises_partner_status_group_idx
  on public.partner_protocol_exercises (partner_id, status, muscle_group);

create unique index partner_protocol_exercises_partner_name_active_key
  on public.partner_protocol_exercises (partner_id, lower(name))
  where status = 'active';

create table public.partner_protocol_use_drafts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid,
  item_type text not null,
  food_id uuid,
  exercise_id uuid,
  plan_context text not null default 'rascunho',
  notes text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_protocol_use_drafts_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_protocol_use_drafts_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_protocol_use_drafts_food_partner_fkey
    foreign key (food_id, partner_id) references public.partner_protocol_foods(id, partner_id) on delete cascade,
  constraint partner_protocol_use_drafts_exercise_partner_fkey
    foreign key (exercise_id, partner_id) references public.partner_protocol_exercises(id, partner_id) on delete cascade,
  constraint partner_protocol_use_drafts_item_type_check
    check (item_type in ('food', 'exercise')),
  constraint partner_protocol_use_drafts_item_shape_check
    check (
      (item_type = 'food' and food_id is not null and exercise_id is null)
      or
      (item_type = 'exercise' and exercise_id is not null and food_id is null)
    ),
  constraint partner_protocol_use_drafts_plan_context_check
    check (plan_context in ('rascunho', 'dieta', 'treino')),
  constraint partner_protocol_use_drafts_notes_not_blank
    check (notes is null or length(btrim(notes)) > 0),
  constraint partner_protocol_use_drafts_status_check
    check (status in ('open', 'used', 'discarded'))
);

create index partner_protocol_use_drafts_partner_status_idx
  on public.partner_protocol_use_drafts (partner_id, status, created_at desc);

create table public.partner_protocol_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  item_type text not null,
  food_id uuid,
  exercise_id uuid,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),

  constraint partner_protocol_events_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_protocol_events_food_partner_fkey
    foreign key (food_id, partner_id) references public.partner_protocol_foods(id, partner_id) on delete cascade,
  constraint partner_protocol_events_exercise_partner_fkey
    foreign key (exercise_id, partner_id) references public.partner_protocol_exercises(id, partner_id) on delete cascade,
  constraint partner_protocol_events_item_type_check
    check (item_type in ('food', 'exercise')),
  constraint partner_protocol_events_item_shape_check
    check (
      (item_type = 'food' and food_id is not null and exercise_id is null)
      or
      (item_type = 'exercise' and exercise_id is not null and food_id is null)
    ),
  constraint partner_protocol_events_type_check
    check (event_type in ('created', 'updated', 'archived', 'restored', 'imported', 'used')),
  constraint partner_protocol_events_details_object_check
    check (jsonb_typeof(details) = 'object')
);

create index partner_protocol_events_partner_date_idx
  on public.partner_protocol_events (partner_id, occurred_at desc);

create trigger partner_protocol_foods_set_updated_at
before update on public.partner_protocol_foods
for each row execute function public.set_updated_at();

create trigger partner_protocol_exercises_set_updated_at
before update on public.partner_protocol_exercises
for each row execute function public.set_updated_at();

create trigger partner_protocol_use_drafts_set_updated_at
before update on public.partner_protocol_use_drafts
for each row execute function public.set_updated_at();

alter table public.partner_protocol_foods enable row level security;
alter table public.partner_protocol_exercises enable row level security;
alter table public.partner_protocol_use_drafts enable row level security;
alter table public.partner_protocol_events enable row level security;

revoke all on table public.partner_protocol_foods from public, anon, authenticated;
revoke all on table public.partner_protocol_exercises from public, anon, authenticated;
revoke all on table public.partner_protocol_use_drafts from public, anon, authenticated;
revoke all on table public.partner_protocol_events from public, anon, authenticated;

grant select, insert, update on table public.partner_protocol_foods to authenticated;
grant select, insert, update on table public.partner_protocol_exercises to authenticated;
grant select, insert, update on table public.partner_protocol_use_drafts to authenticated;
grant select, insert on table public.partner_protocol_events to authenticated;

grant select, insert, update, delete on table public.partner_protocol_foods to service_role;
grant select, insert, update, delete on table public.partner_protocol_exercises to service_role;
grant select, insert, update, delete on table public.partner_protocol_use_drafts to service_role;
grant select, insert, update, delete on table public.partner_protocol_events to service_role;

create policy partner_protocol_foods_select_own_partner
on public.partner_protocol_foods for select to authenticated
using (partner_id = public.current_active_partner_id());

create policy partner_protocol_foods_insert_own_partner
on public.partner_protocol_foods for insert to authenticated
with check (partner_id = public.current_active_partner_id());

create policy partner_protocol_foods_update_own_partner
on public.partner_protocol_foods for update to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());

create policy partner_protocol_exercises_select_own_partner
on public.partner_protocol_exercises for select to authenticated
using (partner_id = public.current_active_partner_id());

create policy partner_protocol_exercises_insert_own_partner
on public.partner_protocol_exercises for insert to authenticated
with check (partner_id = public.current_active_partner_id());

create policy partner_protocol_exercises_update_own_partner
on public.partner_protocol_exercises for update to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());

create policy partner_protocol_use_drafts_select_own_partner
on public.partner_protocol_use_drafts for select to authenticated
using (partner_id = public.current_active_partner_id());

create policy partner_protocol_use_drafts_insert_own_partner
on public.partner_protocol_use_drafts for insert to authenticated
with check (
  partner_id = public.current_active_partner_id()
  and (
    patient_id is null
    or public.current_partner_has_patient_link(patient_id)
  )
);

create policy partner_protocol_use_drafts_update_own_partner
on public.partner_protocol_use_drafts for update to authenticated
using (partner_id = public.current_active_partner_id())
with check (
  partner_id = public.current_active_partner_id()
  and (
    patient_id is null
    or public.current_partner_has_patient_link(patient_id)
  )
);

create policy partner_protocol_events_select_own_partner
on public.partner_protocol_events for select to authenticated
using (partner_id = public.current_active_partner_id());

create policy partner_protocol_events_insert_own_partner
on public.partner_protocol_events for insert to authenticated
with check (partner_id = public.current_active_partner_id());
