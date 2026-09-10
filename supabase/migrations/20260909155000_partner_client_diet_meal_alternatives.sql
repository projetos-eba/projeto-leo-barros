alter table public.partner_client_diet_meals
  add column if not exists meal_group_id uuid,
  add column if not exists alternative_order smallint not null default 1;

update public.partner_client_diet_meals
set meal_group_id = gen_random_uuid()
where meal_group_id is null;

with primary_meals as (
  select distinct on (plan_id, partner_id, patient_id, day_of_week, title, meal_time)
    id,
    meal_group_id,
    plan_id,
    partner_id,
    patient_id,
    day_of_week,
    title,
    meal_time
  from public.partner_client_diet_meals
  where menu_option = 1
  order by plan_id, partner_id, patient_id, day_of_week, title, meal_time, sort_order, id
)
update public.partner_client_diet_meals as alternative
set
  meal_group_id = primary_meals.meal_group_id,
  alternative_order = alternative.menu_option
from primary_meals
where alternative.menu_option > 1
  and alternative.plan_id = primary_meals.plan_id
  and alternative.partner_id = primary_meals.partner_id
  and alternative.patient_id = primary_meals.patient_id
  and alternative.day_of_week = primary_meals.day_of_week
  and alternative.title = primary_meals.title
  and alternative.meal_time = primary_meals.meal_time;

update public.partner_client_diet_meals
set alternative_order = 1
where menu_option = 1;

alter table public.partner_client_diet_meals
  alter column meal_group_id set default gen_random_uuid(),
  alter column meal_group_id set not null,
  add constraint partner_client_diet_meals_alternative_order_check
    check (alternative_order >= 1);

create unique index if not exists partner_client_diet_meals_group_alternative_key
  on public.partner_client_diet_meals (plan_id, meal_group_id, alternative_order);

create index if not exists partner_client_diet_meals_group_order_idx
  on public.partner_client_diet_meals (partner_id, patient_id, plan_id, day_of_week, meal_group_id, alternative_order, sort_order);

alter function public.partner_client_diet(uuid)
  rename to partner_client_diet_fiber_base;

revoke all on function public.partner_client_diet_fiber_base(uuid) from public, anon, authenticated;

create function public.partner_client_diet(p_patient_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
  enriched_meals jsonb;
begin
  result := public.partner_client_diet_fiber_base(p_patient_id);

  if result is null or result -> 'plan' is null then
    return result;
  end if;

  select coalesce(
    jsonb_agg(
      meal_json || jsonb_build_object(
        'mealGroupId', meal.meal_group_id,
        'alternativeOrder', meal.alternative_order
      )
      order by meal_position
    ),
    '[]'::jsonb
  )
  into enriched_meals
  from jsonb_array_elements(result #> '{plan,meals}') with ordinality as source(meal_json, meal_position)
  join public.partner_client_diet_meals as meal
    on meal.id = (source.meal_json ->> 'id')::uuid
   and meal.partner_id = public.current_active_partner_id()
   and meal.patient_id = p_patient_id;

  return jsonb_set(result, '{plan,meals}', enriched_meals, true);
end;
$$;

grant execute on function public.partner_client_diet(uuid) to authenticated, service_role;

create function public.partner_create_diet_meal_alternative(
  p_patient_id uuid,
  p_plan_id uuid,
  p_source_meal_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_partner_id uuid := public.current_active_partner_id();
  source_meal public.partner_client_diet_meals%rowtype;
  next_order smallint;
  new_meal_id uuid;
begin
  if current_partner_id is null
    or not public.current_partner_has_active_patient_link(p_patient_id) then
    raise exception 'Acesso indisponível.';
  end if;

  select *
  into source_meal
  from public.partner_client_diet_meals
  where id = p_source_meal_id
    and plan_id = p_plan_id
    and partner_id = current_partner_id
    and patient_id = p_patient_id
  for update;

  if not found then
    raise exception 'Refeição não encontrada.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(source_meal.meal_group_id::text, 0));

  select coalesce(max(alternative_order), 0) + 1
  into next_order
  from public.partner_client_diet_meals
  where plan_id = p_plan_id
    and meal_group_id = source_meal.meal_group_id;

  insert into public.partner_client_diet_meals (
    plan_id,
    partner_id,
    patient_id,
    day_of_week,
    title,
    meal_time,
    menu_option,
    option_label,
    meal_group_id,
    alternative_order,
    sort_order
  ) values (
    p_plan_id,
    current_partner_id,
    p_patient_id,
    source_meal.day_of_week,
    source_meal.title,
    source_meal.meal_time,
    1,
    'Cardápio 1',
    source_meal.meal_group_id,
    next_order,
    source_meal.sort_order
  )
  returning id into new_meal_id;

  return new_meal_id;
end;
$$;

create function public.partner_remove_diet_meal(
  p_patient_id uuid,
  p_plan_id uuid,
  p_meal_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_partner_id uuid := public.current_active_partner_id();
  source_meal public.partner_client_diet_meals%rowtype;
begin
  if current_partner_id is null
    or not public.current_partner_has_active_patient_link(p_patient_id) then
    raise exception 'Acesso indisponível.';
  end if;

  select *
  into source_meal
  from public.partner_client_diet_meals
  where id = p_meal_id
    and plan_id = p_plan_id
    and partner_id = current_partner_id
    and patient_id = p_patient_id
  for update;

  if not found then
    raise exception 'Refeição não encontrada.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(source_meal.meal_group_id::text, 0));

  delete from public.partner_client_diet_meals
  where id = source_meal.id
    and plan_id = p_plan_id
    and partner_id = current_partner_id
    and patient_id = p_patient_id;

  update public.partner_client_diet_meals
  set alternative_order = alternative_order + 1000
  where plan_id = p_plan_id
    and partner_id = current_partner_id
    and patient_id = p_patient_id
    and meal_group_id = source_meal.meal_group_id;

  with ranked_alternatives as (
    select id, row_number() over (order by alternative_order, created_at, id)::smallint as next_order
    from public.partner_client_diet_meals
    where plan_id = p_plan_id
      and partner_id = current_partner_id
      and patient_id = p_patient_id
      and meal_group_id = source_meal.meal_group_id
  )
  update public.partner_client_diet_meals as meal
  set alternative_order = ranked_alternatives.next_order
  from ranked_alternatives
  where meal.id = ranked_alternatives.id;
end;
$$;

revoke all on function public.partner_create_diet_meal_alternative(uuid, uuid, uuid) from public, anon;
revoke all on function public.partner_remove_diet_meal(uuid, uuid, uuid) from public, anon;
grant execute on function public.partner_create_diet_meal_alternative(uuid, uuid, uuid) to authenticated, service_role;
grant execute on function public.partner_remove_diet_meal(uuid, uuid, uuid) to authenticated, service_role;
