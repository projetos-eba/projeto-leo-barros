-- Dietas do Cliente no perfil Parceiros.
-- Dados de smoke permanecem em supabase/seed.sql.

create or replace function public.current_partner_has_active_patient_link(target_patient_id uuid)
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
      and relationship.status = 'active'
  );
$$;

revoke all on function public.current_partner_has_active_patient_link(uuid) from public;
grant execute on function public.current_partner_has_active_patient_link(uuid) to authenticated;

create table public.partner_client_diet_plans (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  title text not null,
  status text not null default 'draft',
  target_kcal integer not null default 0,
  target_protein_g numeric(10, 2) not null default 0,
  target_carbs_g numeric(10, 2) not null default 0,
  target_fat_g numeric(10, 2) not null default 0,
  water_liters numeric(4, 2) not null default 0,
  calorie_strategy text not null default 'maintenance',
  notes text,
  version integer not null default 1,
  published_at timestamptz,
  sent_at timestamptz,
  starts_on date,
  review_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_diet_plans_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_diet_plans_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_diet_plans_id_partner_patient_key unique (id, partner_id, patient_id),
  constraint partner_client_diet_plans_title_not_blank
    check (length(btrim(title)) between 2 and 140),
  constraint partner_client_diet_plans_status_check
    check (status in ('draft', 'scheduled', 'active', 'superseded', 'archived')),
  constraint partner_client_diet_plans_targets_check
    check (
      target_kcal >= 0
      and target_protein_g >= 0
      and target_carbs_g >= 0
      and target_fat_g >= 0
      and water_liters >= 0
      and version > 0
    ),
  constraint partner_client_diet_plans_strategy_check
    check (calorie_strategy in ('deficit', 'maintenance', 'surplus')),
  constraint partner_client_diet_plans_notes_not_blank
    check (notes is null or length(btrim(notes)) > 0)
);

create table public.partner_client_diet_meals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null,
  partner_id uuid not null,
  patient_id uuid not null,
  day_of_week smallint not null default 1,
  title text not null,
  meal_time time not null,
  menu_option smallint not null default 1,
  option_label text not null default 'Cardápio 1',
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_diet_meals_plan_match_fkey
    foreign key (plan_id, partner_id, patient_id)
    references public.partner_client_diet_plans(id, partner_id, patient_id)
    on delete cascade,
  constraint partner_client_diet_meals_id_plan_partner_patient_key
    unique (id, plan_id, partner_id, patient_id),
  constraint partner_client_diet_meals_day_check
    check (day_of_week between 1 and 7),
  constraint partner_client_diet_meals_title_not_blank
    check (length(btrim(title)) between 2 and 80),
  constraint partner_client_diet_meals_menu_option_check
    check (menu_option between 1 and 4),
  constraint partner_client_diet_meals_option_label_not_blank
    check (length(btrim(option_label)) between 2 and 40),
  constraint partner_client_diet_meals_sort_check
    check (sort_order >= 0)
);

create table public.partner_client_diet_meal_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null,
  meal_id uuid not null,
  partner_id uuid not null,
  patient_id uuid not null,
  food_id uuid,
  quantity numeric(10, 2) not null,
  quantity_unit text not null,
  household_measure text,
  snapshot_name text not null,
  snapshot_serving_size numeric(10, 2) not null,
  snapshot_serving_unit text not null,
  snapshot_kcal numeric(10, 2) not null,
  snapshot_carbs_g numeric(10, 2) not null,
  snapshot_protein_g numeric(10, 2) not null,
  snapshot_fat_g numeric(10, 2) not null,
  snapshot_fiber_g numeric(10, 2) not null default 0,
  snapshot_sodium_mg numeric(10, 2) not null default 0,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_diet_items_meal_match_fkey
    foreign key (meal_id, plan_id, partner_id, patient_id)
    references public.partner_client_diet_meals(id, plan_id, partner_id, patient_id)
    on delete cascade,
  constraint partner_client_diet_items_food_partner_fkey
    foreign key (food_id, partner_id)
    references public.partner_protocol_foods(id, partner_id)
    on delete restrict,
  constraint partner_client_diet_items_quantity_check
    check (quantity > 0),
  constraint partner_client_diet_items_quantity_unit_not_blank
    check (length(btrim(quantity_unit)) between 1 and 20),
  constraint partner_client_diet_items_household_not_blank
    check (household_measure is null or length(btrim(household_measure)) > 0),
  constraint partner_client_diet_items_snapshot_name_not_blank
    check (length(btrim(snapshot_name)) between 2 and 140),
  constraint partner_client_diet_items_snapshot_serving_check
    check (snapshot_serving_size > 0 and length(btrim(snapshot_serving_unit)) > 0),
  constraint partner_client_diet_items_snapshot_values_check
    check (
      snapshot_kcal >= 0
      and snapshot_carbs_g >= 0
      and snapshot_protein_g >= 0
      and snapshot_fat_g >= 0
      and snapshot_fiber_g >= 0
      and snapshot_sodium_mg >= 0
      and sort_order >= 0
    )
);

create table public.partner_client_diet_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  plan_id uuid not null,
  event_type text not null,
  actor_name text,
  detail text not null,
  version integer not null default 1,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint partner_client_diet_events_plan_match_fkey
    foreign key (plan_id, partner_id, patient_id)
    references public.partner_client_diet_plans(id, partner_id, patient_id)
    on delete cascade,
  constraint partner_client_diet_events_type_check
    check (event_type in ('created', 'updated', 'targets_updated', 'duplicated', 'published', 'sent', 'archived', 'notes_saved', 'meal_added', 'meal_removed', 'item_added', 'item_updated', 'item_removed')),
  constraint partner_client_diet_events_actor_not_blank
    check (actor_name is null or length(btrim(actor_name)) > 0),
  constraint partner_client_diet_events_detail_not_blank
    check (length(btrim(detail)) > 0),
  constraint partner_client_diet_events_version_check
    check (version > 0),
  constraint partner_client_diet_events_details_object_check
    check (jsonb_typeof(details) = 'object')
);

create index partner_client_diet_plans_patient_status_idx
  on public.partner_client_diet_plans (partner_id, patient_id, status, updated_at desc);
create index partner_client_diet_meals_plan_day_idx
  on public.partner_client_diet_meals (partner_id, patient_id, plan_id, day_of_week, sort_order);
create index partner_client_diet_meals_plan_day_option_idx
  on public.partner_client_diet_meals (partner_id, patient_id, plan_id, day_of_week, menu_option, sort_order);
create index partner_client_diet_items_meal_sort_idx
  on public.partner_client_diet_meal_items (partner_id, patient_id, meal_id, sort_order);
create index partner_client_diet_items_food_idx
  on public.partner_client_diet_meal_items (partner_id, food_id);
create index partner_client_diet_events_plan_date_idx
  on public.partner_client_diet_events (partner_id, patient_id, plan_id, created_at desc);

create trigger partner_client_diet_plans_set_updated_at
before update on public.partner_client_diet_plans
for each row execute function public.set_updated_at();

create trigger partner_client_diet_meals_set_updated_at
before update on public.partner_client_diet_meals
for each row execute function public.set_updated_at();

create trigger partner_client_diet_meal_items_set_updated_at
before update on public.partner_client_diet_meal_items
for each row execute function public.set_updated_at();

alter table public.partner_client_diet_plans enable row level security;
alter table public.partner_client_diet_meals enable row level security;
alter table public.partner_client_diet_meal_items enable row level security;
alter table public.partner_client_diet_events enable row level security;

revoke all on table public.partner_client_diet_plans from public, anon, authenticated;
revoke all on table public.partner_client_diet_meals from public, anon, authenticated;
revoke all on table public.partner_client_diet_meal_items from public, anon, authenticated;
revoke all on table public.partner_client_diet_events from public, anon, authenticated;

grant select, insert, update on table public.partner_client_diet_plans to authenticated;
grant select, insert, update, delete on table public.partner_client_diet_meals to authenticated;
grant select, insert, update, delete on table public.partner_client_diet_meal_items to authenticated;
grant select, insert on table public.partner_client_diet_events to authenticated;

grant select, insert, update, delete on table public.partner_client_diet_plans to service_role;
grant select, insert, update, delete on table public.partner_client_diet_meals to service_role;
grant select, insert, update, delete on table public.partner_client_diet_meal_items to service_role;
grant select, insert, update, delete on table public.partner_client_diet_events to service_role;

create policy partner_client_diet_plans_select_own_partner
on public.partner_client_diet_plans for select to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_diet_plans_insert_own_partner
on public.partner_client_diet_plans for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_diet_plans_update_own_partner
on public.partner_client_diet_plans for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));

create policy partner_client_diet_meals_select_own_partner
on public.partner_client_diet_meals for select to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_diet_meals_insert_own_partner
on public.partner_client_diet_meals for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_diet_meals_update_own_partner
on public.partner_client_diet_meals for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_diet_meals_delete_own_partner
on public.partner_client_diet_meals for delete to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));

create policy partner_client_diet_items_select_own_partner
on public.partner_client_diet_meal_items for select to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_diet_items_insert_own_partner
on public.partner_client_diet_meal_items for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_diet_items_update_own_partner
on public.partner_client_diet_meal_items for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_diet_items_delete_own_partner
on public.partner_client_diet_meal_items for delete to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));

create policy partner_client_diet_events_select_own_partner
on public.partner_client_diet_events for select to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_diet_events_insert_own_partner
on public.partner_client_diet_events for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));

create or replace function public.partner_client_diet(p_patient_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_partner_id uuid := public.current_active_partner_id();
  current_plan public.partner_client_diet_plans%rowtype;
  result jsonb;
begin
  if current_partner_id is null or not public.current_partner_has_active_patient_link(p_patient_id) then
    return null;
  end if;

  select *
  into current_plan
  from public.partner_client_diet_plans as plan
  where plan.partner_id = current_partner_id
    and plan.patient_id = p_patient_id
    and plan.status <> 'archived'
  order by
    case plan.status when 'active' then 0 when 'scheduled' then 1 when 'draft' then 2 when 'superseded' then 3 else 4 end,
    plan.updated_at desc
  limit 1;

  select jsonb_build_object(
    'plan', case when current_plan.id is null then null else jsonb_build_object(
      'id', current_plan.id,
      'title', current_plan.title,
      'status', current_plan.status,
      'targetKcal', current_plan.target_kcal,
      'targetProteinG', current_plan.target_protein_g,
      'targetCarbsG', current_plan.target_carbs_g,
      'targetFatG', current_plan.target_fat_g,
      'waterLiters', current_plan.water_liters,
      'calorieStrategy', current_plan.calorie_strategy,
      'notes', current_plan.notes,
      'version', current_plan.version,
      'publishedAt', current_plan.published_at,
      'sentAt', current_plan.sent_at,
      'startsOn', current_plan.starts_on,
      'reviewOn', current_plan.review_on,
      'createdAt', current_plan.created_at,
      'updatedAt', current_plan.updated_at,
      'meals', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', meal.id,
          'dayOfWeek', meal.day_of_week,
          'title', meal.title,
          'mealTime', to_char(meal.meal_time, 'HH24:MI'),
          'menuOption', meal.menu_option,
          'optionLabel', meal.option_label,
          'sortOrder', meal.sort_order,
          'items', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', item.id,
              'foodId', item.food_id,
              'quantity', item.quantity,
              'quantityUnit', item.quantity_unit,
              'householdMeasure', item.household_measure,
              'snapshotName', item.snapshot_name,
              'snapshotServingSize', item.snapshot_serving_size,
              'snapshotServingUnit', item.snapshot_serving_unit,
              'snapshotKcal', item.snapshot_kcal,
              'snapshotCarbsG', item.snapshot_carbs_g,
              'snapshotProteinG', item.snapshot_protein_g,
              'snapshotFatG', item.snapshot_fat_g,
              'snapshotFiberG', item.snapshot_fiber_g,
              'snapshotSodiumMg', item.snapshot_sodium_mg,
              'sortOrder', item.sort_order
            ) order by item.sort_order, item.created_at)
            from public.partner_client_diet_meal_items as item
            where item.partner_id = current_partner_id
              and item.patient_id = p_patient_id
              and item.meal_id = meal.id
          ), '[]'::jsonb)
        ) order by meal.day_of_week, meal.menu_option, meal.sort_order, meal.meal_time)
        from public.partner_client_diet_meals as meal
        where meal.partner_id = current_partner_id
          and meal.patient_id = p_patient_id
          and meal.plan_id = current_plan.id
      ), '[]'::jsonb)
    ) end,
    'foods', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', food.id,
        'name', food.name,
        'category', food.category,
        'source', food.source,
        'servingSize', food.serving_size,
        'servingUnit', food.serving_unit,
        'householdMeasure', food.household_measure,
        'kcal', food.kcal,
        'carbsG', food.carbs_g,
        'proteinG', food.protein_g,
        'fatG', food.fat_g,
        'fiberG', food.fiber_g,
        'sodiumMg', food.sodium_mg,
        'tags', food.tags,
        'suggestedUses', food.suggested_uses,
        'usageCount', food.usage_count,
        'updatedAt', food.updated_at
      ) order by food.usage_count desc, food.updated_at desc)
      from public.partner_protocol_foods as food
      where food.partner_id = current_partner_id
        and food.status = 'active'
    ), '[]'::jsonb),
    'drafts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', draft.id,
        'notes', draft.notes,
        'createdAt', draft.created_at,
        'food', jsonb_build_object(
          'id', food.id,
          'name', food.name,
          'category', food.category,
          'source', food.source,
          'servingSize', food.serving_size,
          'servingUnit', food.serving_unit,
          'householdMeasure', food.household_measure,
          'kcal', food.kcal,
          'carbsG', food.carbs_g,
          'proteinG', food.protein_g,
          'fatG', food.fat_g,
          'fiberG', food.fiber_g,
          'sodiumMg', food.sodium_mg,
          'tags', food.tags,
          'suggestedUses', food.suggested_uses,
          'usageCount', food.usage_count,
          'updatedAt', food.updated_at
        )
      ) order by draft.created_at desc)
      from public.partner_protocol_use_drafts as draft
      join public.partner_protocol_foods as food
        on food.id = draft.food_id
       and food.partner_id = draft.partner_id
      where draft.partner_id = current_partner_id
        and draft.patient_id = p_patient_id
        and draft.item_type = 'food'
        and draft.plan_context = 'dieta'
        and draft.status = 'open'
        and food.status = 'active'
    ), '[]'::jsonb),
    'events', case when current_plan.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', event.id,
        'eventType', event.event_type,
        'actorName', event.actor_name,
        'detail', event.detail,
        'version', event.version,
        'createdAt', event.created_at
      ) order by event.created_at desc)
      from public.partner_client_diet_events as event
      where event.partner_id = current_partner_id
        and event.patient_id = p_patient_id
        and event.plan_id = current_plan.id
    ), '[]'::jsonb) end,
    'generatedAt', now()
  ) into result;

  return result;
end;
$$;

comment on function public.partner_client_diet(uuid)
is 'Retorna a aba Dietas do Cliente para o Parceiro com vínculo ativo, usando alimentos da base do parceiro.';

revoke all on function public.partner_client_diet(uuid) from public;
grant execute on function public.partner_client_diet(uuid) to authenticated;
