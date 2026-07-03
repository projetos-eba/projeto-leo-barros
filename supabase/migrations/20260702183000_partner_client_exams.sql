create table public.partner_exam_categories (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  slug text not null,
  name text not null,
  icon_key text not null default 'activity',
  sort_order integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_exam_categories_id_partner_key unique (id, partner_id),
  constraint partner_exam_categories_partner_slug_key unique (partner_id, slug),
  constraint partner_exam_categories_slug_check check (slug ~ '^[a-z0-9_]+$'),
  constraint partner_exam_categories_name_check check (length(btrim(name)) between 2 and 120),
  constraint partner_exam_categories_status_check check (status in ('active', 'archived'))
);

create table public.partner_exam_definitions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  category_id uuid not null,
  slug text not null,
  name text not null,
  default_unit text not null,
  sort_order integer not null default 0,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_exam_definitions_category_fkey
    foreign key (category_id, partner_id)
    references public.partner_exam_categories(id, partner_id) on delete cascade,
  constraint partner_exam_definitions_id_partner_key unique (id, partner_id),
  constraint partner_exam_definitions_partner_slug_key unique (partner_id, slug),
  constraint partner_exam_definitions_slug_check check (slug ~ '^[a-z0-9_]+$'),
  constraint partner_exam_definitions_name_check check (length(btrim(name)) between 2 and 160),
  constraint partner_exam_definitions_unit_check check (length(btrim(default_unit)) between 1 and 30),
  constraint partner_exam_definitions_notes_check check (notes is null or length(btrim(notes)) > 0),
  constraint partner_exam_definitions_status_check check (status in ('active', 'archived'))
);

create table public.partner_exam_reference_ranges (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  exam_id uuid not null,
  sex text not null default 'unisex',
  low_value numeric(14,4),
  high_value numeric(14,4),
  label text,
  sort_order integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_exam_reference_ranges_exam_fkey
    foreign key (exam_id, partner_id)
    references public.partner_exam_definitions(id, partner_id) on delete cascade,
  constraint partner_exam_reference_ranges_sex_check check (sex in ('unisex', 'male', 'female')),
  constraint partner_exam_reference_ranges_bounds_check
    check ((low_value is not null or high_value is not null) and (low_value is null or high_value is null or low_value <= high_value)),
  constraint partner_exam_reference_ranges_label_check check (label is null or length(btrim(label)) > 0),
  constraint partner_exam_reference_ranges_status_check check (status in ('active', 'archived'))
);

create unique index partner_exam_reference_ranges_exam_sex_active_key
  on public.partner_exam_reference_ranges (partner_id, exam_id, sex)
  where status = 'active';

create table public.partner_exam_alternative_units (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  exam_id uuid not null,
  unit text not null,
  factor_from_default numeric(18,8) not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_exam_alternative_units_exam_fkey
    foreign key (exam_id, partner_id)
    references public.partner_exam_definitions(id, partner_id) on delete cascade,
  constraint partner_exam_alternative_units_unit_check check (length(btrim(unit)) between 1 and 30),
  constraint partner_exam_alternative_units_factor_check check (factor_from_default > 0),
  constraint partner_exam_alternative_units_status_check check (status in ('active', 'archived'))
);

create unique index partner_exam_alternative_units_exam_unit_active_key
  on public.partner_exam_alternative_units (partner_id, exam_id, lower(unit))
  where status = 'active';

create table public.partner_client_exam_collections (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete cascade,
  collected_at date not null,
  title text not null default 'Registro de coleta',
  notes text,
  status text not null default 'saved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_client_exam_collections_id_partner_patient_key unique (id, partner_id, patient_id),
  constraint partner_client_exam_collections_title_check check (length(btrim(title)) between 2 and 140),
  constraint partner_client_exam_collections_notes_check check (notes is null or length(btrim(notes)) > 0),
  constraint partner_client_exam_collections_status_check check (status in ('saved', 'archived'))
);

create table public.partner_client_exam_results (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null,
  partner_id uuid not null,
  patient_id uuid not null,
  exam_id uuid not null,
  input_value numeric(14,4) not null,
  input_unit text not null,
  value_default numeric(14,4) not null,
  default_unit text not null,
  conversion_factor_from_default numeric(18,8),
  reference_low numeric(14,4),
  reference_high numeric(14,4),
  reference_sex text not null default 'unisex',
  status text not null default 'unknown',
  snapshot_exam_name text not null,
  snapshot_exam_slug text not null,
  snapshot_category_name text not null,
  snapshot_category_slug text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_client_exam_results_collection_fkey
    foreign key (collection_id, partner_id, patient_id)
    references public.partner_client_exam_collections(id, partner_id, patient_id) on delete cascade,
  constraint partner_client_exam_results_exam_fkey
    foreign key (exam_id, partner_id)
    references public.partner_exam_definitions(id, partner_id) on delete restrict,
  constraint partner_client_exam_results_collection_exam_key unique (collection_id, exam_id),
  constraint partner_client_exam_results_input_check check (input_value >= 0 and value_default >= 0),
  constraint partner_client_exam_results_units_check check (length(btrim(input_unit)) > 0 and length(btrim(default_unit)) > 0),
  constraint partner_client_exam_results_reference_sex_check check (reference_sex in ('unisex', 'male', 'female')),
  constraint partner_client_exam_results_reference_bounds_check
    check (reference_low is null or reference_high is null or reference_low <= reference_high),
  constraint partner_client_exam_results_status_check check (status in ('low', 'normal', 'high', 'unknown')),
  constraint partner_client_exam_results_snapshot_check
    check (
      length(btrim(snapshot_exam_name)) > 0
      and length(btrim(snapshot_exam_slug)) > 0
      and length(btrim(snapshot_category_name)) > 0
      and length(btrim(snapshot_category_slug)) > 0
    ),
  constraint partner_client_exam_results_notes_check check (notes is null or length(btrim(notes)) > 0)
);

create table public.partner_client_exam_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid references public.patients(id) on delete cascade,
  collection_id uuid,
  exam_id uuid,
  actor_name text,
  event_type text not null,
  detail text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint partner_client_exam_events_details_check check (jsonb_typeof(details) = 'object'),
  constraint partner_client_exam_events_type_check
    check (event_type in ('collection_saved', 'collection_removed', 'definition_created', 'definition_updated', 'definition_archived', 'reference_updated', 'unit_updated')),
  constraint partner_client_exam_events_detail_check check (length(btrim(detail)) > 0),
  constraint partner_client_exam_events_actor_check check (actor_name is null or length(btrim(actor_name)) > 0)
);

create index partner_exam_categories_partner_status_idx
  on public.partner_exam_categories (partner_id, status, sort_order);
create index partner_exam_definitions_partner_category_idx
  on public.partner_exam_definitions (partner_id, category_id, status, sort_order);
create index partner_exam_reference_ranges_exam_idx
  on public.partner_exam_reference_ranges (partner_id, exam_id, status);
create index partner_exam_alternative_units_exam_idx
  on public.partner_exam_alternative_units (partner_id, exam_id, status);
create index partner_client_exam_collections_patient_date_idx
  on public.partner_client_exam_collections (partner_id, patient_id, collected_at desc);
create index partner_client_exam_results_patient_exam_idx
  on public.partner_client_exam_results (partner_id, patient_id, exam_id, created_at desc);
create index partner_client_exam_events_patient_date_idx
  on public.partner_client_exam_events (partner_id, patient_id, created_at desc);

create trigger partner_exam_categories_set_updated_at
before update on public.partner_exam_categories
for each row execute function public.set_updated_at();

create trigger partner_exam_definitions_set_updated_at
before update on public.partner_exam_definitions
for each row execute function public.set_updated_at();

create trigger partner_exam_reference_ranges_set_updated_at
before update on public.partner_exam_reference_ranges
for each row execute function public.set_updated_at();

create trigger partner_exam_alternative_units_set_updated_at
before update on public.partner_exam_alternative_units
for each row execute function public.set_updated_at();

create trigger partner_client_exam_collections_set_updated_at
before update on public.partner_client_exam_collections
for each row execute function public.set_updated_at();

create trigger partner_client_exam_results_set_updated_at
before update on public.partner_client_exam_results
for each row execute function public.set_updated_at();

alter table public.partner_exam_categories enable row level security;
alter table public.partner_exam_definitions enable row level security;
alter table public.partner_exam_reference_ranges enable row level security;
alter table public.partner_exam_alternative_units enable row level security;
alter table public.partner_client_exam_collections enable row level security;
alter table public.partner_client_exam_results enable row level security;
alter table public.partner_client_exam_events enable row level security;

revoke all on table public.partner_exam_categories, public.partner_exam_definitions,
  public.partner_exam_reference_ranges, public.partner_exam_alternative_units,
  public.partner_client_exam_collections, public.partner_client_exam_results,
  public.partner_client_exam_events
  from public, anon, authenticated;

grant select, insert, update on table public.partner_exam_categories to authenticated;
grant select, insert, update on table public.partner_exam_definitions to authenticated;
grant select, insert, update on table public.partner_exam_reference_ranges to authenticated;
grant select, insert, update on table public.partner_exam_alternative_units to authenticated;
grant select, insert, update, delete on table public.partner_client_exam_collections to authenticated;
grant select, insert, update, delete on table public.partner_client_exam_results to authenticated;
grant select, insert on table public.partner_client_exam_events to authenticated;
grant all on table public.partner_exam_categories, public.partner_exam_definitions,
  public.partner_exam_reference_ranges, public.partner_exam_alternative_units,
  public.partner_client_exam_collections, public.partner_client_exam_results,
  public.partner_client_exam_events
  to service_role;

create policy partner_exam_categories_own_partner
on public.partner_exam_categories for all to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());

create policy partner_exam_definitions_own_partner
on public.partner_exam_definitions for all to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());

create policy partner_exam_reference_ranges_own_partner
on public.partner_exam_reference_ranges for all to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());

create policy partner_exam_alternative_units_own_partner
on public.partner_exam_alternative_units for all to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());

create policy partner_client_exam_collections_own_partner
on public.partner_client_exam_collections for all to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));

create policy partner_client_exam_results_own_partner
on public.partner_client_exam_results for all to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));

create policy partner_client_exam_events_select_own_partner
on public.partner_client_exam_events for select to authenticated
using (
  partner_id = public.current_active_partner_id()
  and (patient_id is null or public.current_partner_has_active_patient_link(patient_id))
);

create policy partner_client_exam_events_insert_own_partner
on public.partner_client_exam_events for insert to authenticated
with check (
  partner_id = public.current_active_partner_id()
  and (patient_id is null or public.current_partner_has_active_patient_link(patient_id))
);

create or replace function public.partner_client_exams(p_patient_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with current_context as (
    select public.current_active_partner_id() as partner_id
  ),
  allowed as (
    select current_context.partner_id
    from current_context
    where current_context.partner_id is not null
      and public.current_partner_has_active_patient_link(p_patient_id)
  ),
  patient_row as (
    select p.gender, p.birth_date
    from public.patients p, allowed
    where p.id = p_patient_id
  ),
  categories_json as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id,
      'slug', c.slug,
      'name', c.name,
      'iconKey', c.icon_key,
      'sortOrder', c.sort_order,
      'status', c.status
    ) order by c.sort_order, c.name), '[]'::jsonb) as value
    from public.partner_exam_categories c, allowed
    where c.partner_id = allowed.partner_id
      and c.status = 'active'
  ),
  definitions_json as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', e.id,
      'categoryId', e.category_id,
      'categorySlug', c.slug,
      'categoryName', c.name,
      'slug', e.slug,
      'name', e.name,
      'defaultUnit', e.default_unit,
      'sortOrder', e.sort_order,
      'status', e.status,
      'references', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', r.id,
          'sex', r.sex,
          'lowValue', r.low_value,
          'highValue', r.high_value,
          'label', r.label,
          'sortOrder', r.sort_order,
          'status', r.status
        ) order by r.sort_order, r.sex)
        from public.partner_exam_reference_ranges r
        where r.partner_id = e.partner_id
          and r.exam_id = e.id
          and r.status = 'active'
      ), '[]'::jsonb),
      'alternativeUnits', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', u.id,
          'unit', u.unit,
          'factorFromDefault', u.factor_from_default,
          'status', u.status
        ) order by u.unit)
        from public.partner_exam_alternative_units u
        where u.partner_id = e.partner_id
          and u.exam_id = e.id
          and u.status = 'active'
      ), '[]'::jsonb)
    ) order by c.sort_order, e.sort_order, e.name), '[]'::jsonb) as value
    from public.partner_exam_definitions e
    join public.partner_exam_categories c on c.id = e.category_id and c.partner_id = e.partner_id
    join allowed on allowed.partner_id = e.partner_id
    where e.status = 'active'
      and c.status = 'active'
  ),
  collections_json as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', collection.id,
      'collectedAt', collection.collected_at,
      'title', collection.title,
      'notes', collection.notes,
      'status', collection.status,
      'createdAt', collection.created_at,
      'updatedAt', collection.updated_at,
      'results', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', result.id,
          'examId', result.exam_id,
          'collectionId', result.collection_id,
          'inputValue', result.input_value,
          'inputUnit', result.input_unit,
          'valueDefault', result.value_default,
          'defaultUnit', result.default_unit,
          'conversionFactorFromDefault', result.conversion_factor_from_default,
          'referenceLow', result.reference_low,
          'referenceHigh', result.reference_high,
          'referenceSex', result.reference_sex,
          'status', result.status,
          'snapshotExamName', result.snapshot_exam_name,
          'snapshotExamSlug', result.snapshot_exam_slug,
          'snapshotCategoryName', result.snapshot_category_name,
          'snapshotCategorySlug', result.snapshot_category_slug,
          'notes', result.notes
        ) order by result.snapshot_category_slug, result.snapshot_exam_name)
        from public.partner_client_exam_results result
        where result.collection_id = collection.id
          and result.partner_id = collection.partner_id
          and result.patient_id = collection.patient_id
      ), '[]'::jsonb)
    ) order by collection.collected_at desc, collection.created_at desc), '[]'::jsonb) as value
    from public.partner_client_exam_collections collection, allowed
    where collection.partner_id = allowed.partner_id
      and collection.patient_id = p_patient_id
      and collection.status <> 'archived'
  ),
  events_json as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', event.id,
      'actorName', event.actor_name,
      'eventType', event.event_type,
      'detail', event.detail,
      'details', event.details,
      'createdAt', event.created_at
    ) order by event.created_at desc), '[]'::jsonb) as value
    from public.partner_client_exam_events event, allowed
    where event.partner_id = allowed.partner_id
      and (event.patient_id = p_patient_id or event.patient_id is null)
  )
  select case
    when not exists (select 1 from allowed) then null
    else jsonb_build_object(
      'generatedAt', now(),
      'patient', jsonb_build_object(
        'gender', (select gender from patient_row),
        'birthDate', (select birth_date from patient_row)
      ),
      'categories', (select value from categories_json),
      'definitions', (select value from definitions_json),
      'collections', (select value from collections_json),
      'events', (select value from events_json)
    )
  end;
$$;

revoke all on function public.partner_client_exams(uuid) from public;
grant execute on function public.partner_client_exams(uuid) to authenticated;
