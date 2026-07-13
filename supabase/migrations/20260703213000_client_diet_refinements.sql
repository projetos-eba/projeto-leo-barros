-- Refinamentos do painel de Dieta do Cliente: opcoes de cardapio, trocas do dia e agua reversivel.

alter table public.partner_client_diet_meals
  add column if not exists menu_option smallint not null default 1,
  add column if not exists option_label text not null default 'Cardápio 1';

alter table public.partner_client_diet_meals
  drop constraint if exists partner_client_diet_meals_menu_option_check,
  add constraint partner_client_diet_meals_menu_option_check
    check (menu_option between 1 and 4),
  drop constraint if exists partner_client_diet_meals_option_label_not_blank,
  add constraint partner_client_diet_meals_option_label_not_blank
    check (length(btrim(option_label)) between 2 and 40);

create index if not exists partner_client_diet_meals_plan_day_option_idx
  on public.partner_client_diet_meals (partner_id, patient_id, plan_id, day_of_week, menu_option, sort_order);

alter table public.partner_client_diet_meal_items
  drop constraint if exists partner_client_diet_items_id_meal_plan_partner_patient_key,
  add constraint partner_client_diet_items_id_meal_plan_partner_patient_key
    unique (id, meal_id, plan_id, partner_id, patient_id);

create table if not exists public.client_diet_substitution_logs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  plan_id uuid not null,
  meal_id uuid not null,
  item_id uuid not null,
  food_id uuid not null,
  log_date date not null default current_date,
  replacement_name text not null,
  replacement_serving_size numeric(10,2) not null,
  replacement_serving_unit text not null,
  replacement_kcal numeric(10,2) not null,
  replacement_carbs_g numeric(10,2) not null,
  replacement_protein_g numeric(10,2) not null,
  replacement_fat_g numeric(10,2) not null,
  replacement_fiber_g numeric(10,2) not null default 0,
  applied_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint client_diet_substitution_logs_item_match_fkey
    foreign key (item_id, meal_id, plan_id, partner_id, patient_id)
    references public.partner_client_diet_meal_items(id, meal_id, plan_id, partner_id, patient_id)
    on delete cascade,
  constraint client_diet_substitution_logs_food_partner_fkey
    foreign key (food_id, partner_id)
    references public.partner_protocol_foods(id, partner_id)
    on delete restrict,
  constraint client_diet_substitution_logs_unique
    unique (patient_id, item_id, log_date),
  constraint client_diet_substitution_logs_name_not_blank
    check (length(btrim(replacement_name)) > 0),
  constraint client_diet_substitution_logs_unit_not_blank
    check (length(btrim(replacement_serving_unit)) > 0),
  constraint client_diet_substitution_logs_values_check
    check (
      replacement_serving_size > 0
      and replacement_kcal >= 0
      and replacement_carbs_g >= 0
      and replacement_protein_g >= 0
      and replacement_fat_g >= 0
      and replacement_fiber_g >= 0
    )
);

create index if not exists client_diet_substitution_logs_patient_date_idx
  on public.client_diet_substitution_logs (patient_id, log_date desc, meal_id);

create trigger client_diet_substitution_logs_set_updated_at
before update on public.client_diet_substitution_logs
for each row execute function public.set_updated_at();

alter table public.client_diet_substitution_logs enable row level security;

revoke all on table public.client_diet_substitution_logs from public, anon, authenticated;
grant select, insert, update, delete on table public.client_diet_substitution_logs to authenticated;
grant select, insert, update, delete on table public.client_diet_substitution_logs to service_role;

create policy client_diet_substitution_logs_select_own_client
on public.client_diet_substitution_logs for select to authenticated
using (patient_id = public.current_active_patient_id());

create policy client_diet_substitution_logs_select_linked_partner
on public.client_diet_substitution_logs for select to authenticated
using (public.current_partner_has_active_patient_link(patient_id));

create policy client_diet_substitution_logs_insert_own_client
on public.client_diet_substitution_logs for insert to authenticated
with check (patient_id = public.current_active_patient_id());

create policy client_diet_substitution_logs_update_own_client
on public.client_diet_substitution_logs for update to authenticated
using (patient_id = public.current_active_patient_id())
with check (patient_id = public.current_active_patient_id());

create policy client_diet_substitution_logs_delete_own_client
on public.client_diet_substitution_logs for delete to authenticated
using (patient_id = public.current_active_patient_id());

alter table public.client_diet_events
  drop constraint if exists client_diet_events_type_check,
  add constraint client_diet_events_type_check
    check (event_type in ('meal_marked', 'meal_unmarked', 'water_added', 'water_removed', 'note_saved', 'substitution_requested', 'substitution_applied', 'photo_attached'));

create or replace function public.client_diet_dashboard(p_date date default current_date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  current_plan public.partner_client_diet_plans%rowtype;
  day_number smallint := extract(isodow from p_date)::smallint;
  result jsonb;
begin
  if current_patient_id is null then
    return null;
  end if;

  select * into current_plan
  from public.current_client_diet_plan(p_date);

  if current_plan.id is not null then
    select coalesce(
      (
        select meal.day_of_week
        from public.partner_client_diet_meals as meal
        where meal.plan_id = current_plan.id
          and meal.patient_id = current_patient_id
          and meal.day_of_week = day_number
        limit 1
      ),
      (
        select min(meal.day_of_week)::smallint
        from public.partner_client_diet_meals as meal
        where meal.plan_id = current_plan.id
          and meal.patient_id = current_patient_id
      ),
      day_number
    ) into day_number;
  end if;

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
    'plan', case when current_plan.id is null then null else jsonb_build_object(
      'id', current_plan.id,
      'partnerId', current_plan.partner_id,
      'title', current_plan.title,
      'status', current_plan.status,
      'targetKcal', current_plan.target_kcal,
      'targetProteinG', current_plan.target_protein_g,
      'targetCarbsG', current_plan.target_carbs_g,
      'targetFatG', current_plan.target_fat_g,
      'waterLiters', current_plan.water_liters,
      'calorieStrategy', current_plan.calorie_strategy,
      'updatedAt', current_plan.updated_at,
      'sentAt', current_plan.sent_at,
      'meals', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', meal.id,
          'title', meal.title,
          'mealTime', to_char(meal.meal_time, 'HH24:MI'),
          'menuOption', coalesce(meal.menu_option, 1),
          'optionLabel', meal.option_label,
          'sortOrder', meal.sort_order,
          'items', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', item.id,
              'foodId', item.food_id,
              'name', item.snapshot_name,
              'quantity', item.quantity,
              'quantityUnit', item.quantity_unit,
              'householdMeasure', item.household_measure,
              'kcal', item.snapshot_kcal,
              'carbsG', item.snapshot_carbs_g,
              'proteinG', item.snapshot_protein_g,
              'fatG', item.snapshot_fat_g,
              'fiberG', item.snapshot_fiber_g,
              'sortOrder', item.sort_order
            ) order by item.sort_order, item.created_at)
            from public.partner_client_diet_meal_items as item
            where item.meal_id = meal.id
              and item.plan_id = meal.plan_id
              and item.patient_id = current_patient_id
          ), '[]'::jsonb)
        ) order by coalesce(meal.menu_option, 1), meal.sort_order, meal.meal_time)
        from public.partner_client_diet_meals as meal
        where meal.plan_id = current_plan.id
          and meal.patient_id = current_patient_id
          and meal.day_of_week = day_number
      ), '[]'::jsonb)
    ) end,
    'dailyLog', case when current_plan.id is null then null else (
      select jsonb_build_object('waterMl', coalesce(log.water_ml, 0))
      from (select 1) as seed
      left join public.client_diet_daily_logs as log
        on log.plan_id = current_plan.id
       and log.patient_id = current_patient_id
       and log.log_date = p_date
      limit 1
    ) end,
    'mealLogs', case when current_plan.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'mealId', log.meal_id,
        'status', log.status,
        'completedAt', log.completed_at,
        'notes', log.notes,
        'photoStoragePath', log.photo_storage_path,
        'photoOriginalFilename', log.photo_original_filename,
        'photoMimeType', log.photo_mime_type
      ) order by log.created_at)
      from public.client_diet_meal_logs as log
      where log.plan_id = current_plan.id
        and log.patient_id = current_patient_id
        and log.log_date = p_date
    ), '[]'::jsonb) end,
    'substitutions', case when current_plan.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'mealId', sub.meal_id,
        'itemId', sub.item_id,
        'foodId', sub.food_id,
        'replacementName', sub.replacement_name,
        'replacementServingSize', sub.replacement_serving_size,
        'replacementServingUnit', sub.replacement_serving_unit,
        'replacementKcal', sub.replacement_kcal,
        'replacementCarbsG', sub.replacement_carbs_g,
        'replacementProteinG', sub.replacement_protein_g,
        'replacementFatG', sub.replacement_fat_g,
        'replacementFiberG', sub.replacement_fiber_g,
        'appliedAt', sub.applied_at
      ) order by sub.applied_at desc)
      from public.client_diet_substitution_logs as sub
      where sub.plan_id = current_plan.id
        and sub.patient_id = current_patient_id
        and sub.log_date = p_date
    ), '[]'::jsonb) end,
    'weekLogs', case when current_plan.id is null then '[]'::jsonb else coalesce((
      with days as (
        select generate_series(p_date - interval '6 days', p_date, interval '1 day')::date as log_date
      ),
      meal_totals as (
        select meal.id as meal_id,
               sum(item.snapshot_kcal)::numeric as kcal
        from public.partner_client_diet_meals as meal
        join public.partner_client_diet_meal_items as item on item.meal_id = meal.id
        where meal.plan_id = current_plan.id
          and meal.patient_id = current_patient_id
          and coalesce(meal.menu_option, 1) = 1
        group by meal.id
      )
      select jsonb_agg(jsonb_build_object(
        'date', days.log_date,
        'waterMl', coalesce(daily.water_ml, 0),
        'completedMeals', coalesce(completed.completed_count, 0),
        'totalMeals', coalesce(total_meals.total_count, 0),
        'consumedKcal', coalesce(completed.consumed_kcal, 0)
      ) order by days.log_date)
      from days
      left join public.client_diet_daily_logs as daily
        on daily.plan_id = current_plan.id
       and daily.patient_id = current_patient_id
       and daily.log_date = days.log_date
      left join lateral (
        select count(*)::integer as total_count
        from public.partner_client_diet_meals as meal
        where meal.plan_id = current_plan.id
          and meal.patient_id = current_patient_id
          and meal.day_of_week = extract(isodow from days.log_date)::smallint
          and coalesce(meal.menu_option, 1) = 1
      ) as total_meals on true
      left join lateral (
        select count(*)::integer as completed_count,
               sum(coalesce(meal_totals.kcal, 0))::numeric as consumed_kcal
        from public.client_diet_meal_logs as log
        left join meal_totals on meal_totals.meal_id = log.meal_id
        where log.plan_id = current_plan.id
          and log.patient_id = current_patient_id
          and log.log_date = days.log_date
          and log.status = 'completed'
      ) as completed on true
    ), '[]'::jsonb) end,
    'suggestions', case when current_plan.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', food.id,
        'name', food.name,
        'category', food.category,
        'servingSize', food.serving_size,
        'servingUnit', food.serving_unit,
        'kcal', food.kcal,
        'carbsG', food.carbs_g,
        'proteinG', food.protein_g,
        'fatG', food.fat_g,
        'fiberG', food.fiber_g
      ) order by food.usage_count desc, food.updated_at desc)
      from (
        select *
        from public.partner_protocol_foods as food
        where food.partner_id = current_plan.partner_id
          and food.status = 'active'
        order by food.usage_count desc, food.updated_at desc
        limit 24
      ) as food
    ), '[]'::jsonb) end,
    'generatedAt', now()
  ) into result;

  return result;
end;
$$;

create or replace function public.client_diet_add_water(
  p_log_date date default current_date,
  p_amount_ml integer default 250
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  current_plan public.partner_client_diet_plans%rowtype;
  safe_amount integer := greatest(-2000, least(coalesce(p_amount_ml, 250), 2000));
begin
  if current_patient_id is null then
    raise exception 'Cliente nao autenticado.';
  end if;

  select * into current_plan from public.current_client_diet_plan(p_log_date);
  if current_plan.id is null then
    raise exception 'Plano alimentar nao encontrado.';
  end if;

  insert into public.client_diet_daily_logs (
    partner_id, patient_id, plan_id, log_date, water_ml
  )
  values (
    current_plan.partner_id,
    current_plan.patient_id,
    current_plan.id,
    p_log_date,
    greatest(0, safe_amount)
  )
  on conflict (patient_id, plan_id, log_date)
  do update set
    water_ml = greatest(0, least(public.client_diet_daily_logs.water_ml + safe_amount, 12000)),
    updated_at = now();

  insert into public.client_diet_events (
    partner_id, patient_id, plan_id, log_date, event_type, detail, details
  )
  values (
    current_plan.partner_id,
    current_plan.patient_id,
    current_plan.id,
    p_log_date,
    case when safe_amount < 0 then 'water_removed' else 'water_added' end,
    case when safe_amount < 0 then 'Agua removida.' else 'Agua registrada.' end,
    jsonb_build_object('amountMl', safe_amount)
  );

  return public.client_diet_dashboard(p_log_date);
end;
$$;

create or replace function public.client_diet_apply_substitution(
  p_meal_id uuid,
  p_item_id uuid,
  p_food_id uuid,
  p_log_date date default current_date
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  selected_item public.partner_client_diet_meal_items%rowtype;
  selected_food public.partner_protocol_foods%rowtype;
begin
  if current_patient_id is null then
    raise exception 'Cliente nao autenticado.';
  end if;

  select item.* into selected_item
  from public.partner_client_diet_meal_items as item
  join public.partner_client_diet_plans as plan on plan.id = item.plan_id
  where item.id = p_item_id
    and item.meal_id = p_meal_id
    and item.patient_id = current_patient_id
    and plan.status in ('sent', 'published')
  limit 1;

  if selected_item.id is null then
    raise exception 'Alimento da refeicao nao encontrado.';
  end if;

  select food.* into selected_food
  from public.partner_protocol_foods as food
  where food.id = p_food_id
    and food.partner_id = selected_item.partner_id
    and food.status = 'active'
  limit 1;

  if selected_food.id is null then
    raise exception 'Alimento de substituicao indisponivel.';
  end if;

  insert into public.client_diet_substitution_logs (
    partner_id,
    patient_id,
    plan_id,
    meal_id,
    item_id,
    food_id,
    log_date,
    replacement_name,
    replacement_serving_size,
    replacement_serving_unit,
    replacement_kcal,
    replacement_carbs_g,
    replacement_protein_g,
    replacement_fat_g,
    replacement_fiber_g
  )
  values (
    selected_item.partner_id,
    selected_item.patient_id,
    selected_item.plan_id,
    selected_item.meal_id,
    selected_item.id,
    selected_food.id,
    p_log_date,
    selected_food.name,
    selected_food.serving_size,
    selected_food.serving_unit,
    selected_food.kcal,
    selected_food.carbs_g,
    selected_food.protein_g,
    selected_food.fat_g,
    selected_food.fiber_g
  )
  on conflict (patient_id, item_id, log_date)
  do update set
    food_id = excluded.food_id,
    replacement_name = excluded.replacement_name,
    replacement_serving_size = excluded.replacement_serving_size,
    replacement_serving_unit = excluded.replacement_serving_unit,
    replacement_kcal = excluded.replacement_kcal,
    replacement_carbs_g = excluded.replacement_carbs_g,
    replacement_protein_g = excluded.replacement_protein_g,
    replacement_fat_g = excluded.replacement_fat_g,
    replacement_fiber_g = excluded.replacement_fiber_g,
    applied_at = now(),
    updated_at = now();

  insert into public.client_diet_events (
    partner_id, patient_id, plan_id, meal_id, log_date, event_type, detail, details
  )
  values (
    selected_item.partner_id,
    selected_item.patient_id,
    selected_item.plan_id,
    selected_item.meal_id,
    p_log_date,
    'substitution_applied',
    'Substituicao aplicada no diario do dia.',
    jsonb_build_object('itemId', selected_item.id, 'foodId', selected_food.id)
  );

  return public.client_diet_dashboard(p_log_date);
end;
$$;

revoke all on function public.client_diet_apply_substitution(uuid, uuid, uuid, date) from public;
grant execute on function public.client_diet_apply_substitution(uuid, uuid, uuid, date) to authenticated;
