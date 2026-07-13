-- Painel de Dieta do Cliente.
-- A prescricao continua nas tabelas partner_client_diet_*; estas tabelas registram a execucao diaria do Cliente.

create table public.client_diet_daily_logs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  plan_id uuid not null,
  log_date date not null default current_date,
  water_ml integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint client_diet_daily_logs_plan_match_fkey
    foreign key (plan_id, partner_id, patient_id)
    references public.partner_client_diet_plans(id, partner_id, patient_id)
    on delete cascade,
  constraint client_diet_daily_logs_water_check
    check (water_ml between 0 and 12000),
  constraint client_diet_daily_logs_unique
    unique (patient_id, plan_id, log_date)
);

create table public.client_diet_meal_logs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  plan_id uuid not null,
  meal_id uuid not null,
  log_date date not null default current_date,
  status text not null default 'pending',
  completed_at timestamptz,
  notes text,
  photo_storage_path text,
  photo_original_filename text,
  photo_mime_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint client_diet_meal_logs_meal_match_fkey
    foreign key (meal_id, plan_id, partner_id, patient_id)
    references public.partner_client_diet_meals(id, plan_id, partner_id, patient_id)
    on delete cascade,
  constraint client_diet_meal_logs_status_check
    check (status in ('pending', 'completed', 'skipped')),
  constraint client_diet_meal_logs_completed_check
    check ((status = 'completed' and completed_at is not null) or status <> 'completed'),
  constraint client_diet_meal_logs_notes_not_blank
    check (notes is null or length(btrim(notes)) between 1 and 1000),
  constraint client_diet_meal_logs_photo_path_not_blank
    check (photo_storage_path is null or length(btrim(photo_storage_path)) > 0),
  constraint client_diet_meal_logs_unique
    unique (patient_id, meal_id, log_date)
);

create table public.client_diet_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  plan_id uuid not null,
  meal_id uuid,
  log_date date not null default current_date,
  event_type text not null,
  detail text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint client_diet_events_plan_match_fkey
    foreign key (plan_id, partner_id, patient_id)
    references public.partner_client_diet_plans(id, partner_id, patient_id)
    on delete cascade,
  constraint client_diet_events_meal_match_fkey
    foreign key (meal_id, plan_id, partner_id, patient_id)
    references public.partner_client_diet_meals(id, plan_id, partner_id, patient_id)
    on delete cascade,
  constraint client_diet_events_type_check
    check (event_type in ('meal_marked', 'meal_unmarked', 'water_added', 'note_saved', 'substitution_requested', 'photo_attached')),
  constraint client_diet_events_detail_not_blank
    check (length(btrim(detail)) > 0),
  constraint client_diet_events_details_object_check
    check (jsonb_typeof(details) = 'object')
);

create index client_diet_daily_logs_patient_date_idx
  on public.client_diet_daily_logs (patient_id, log_date desc);
create index client_diet_meal_logs_patient_date_idx
  on public.client_diet_meal_logs (patient_id, log_date desc, meal_id);
create index client_diet_events_patient_date_idx
  on public.client_diet_events (patient_id, log_date desc, created_at desc);

create trigger client_diet_daily_logs_set_updated_at
before update on public.client_diet_daily_logs
for each row execute function public.set_updated_at();

create trigger client_diet_meal_logs_set_updated_at
before update on public.client_diet_meal_logs
for each row execute function public.set_updated_at();

alter table public.client_diet_daily_logs enable row level security;
alter table public.client_diet_meal_logs enable row level security;
alter table public.client_diet_events enable row level security;

revoke all on table public.client_diet_daily_logs from public, anon, authenticated;
revoke all on table public.client_diet_meal_logs from public, anon, authenticated;
revoke all on table public.client_diet_events from public, anon, authenticated;

grant select, insert, update on table public.client_diet_daily_logs to authenticated;
grant select, insert, update on table public.client_diet_meal_logs to authenticated;
grant select, insert on table public.client_diet_events to authenticated;

grant select, insert, update, delete on table public.client_diet_daily_logs to service_role;
grant select, insert, update, delete on table public.client_diet_meal_logs to service_role;
grant select, insert, update, delete on table public.client_diet_events to service_role;

create policy client_diet_daily_logs_select_own_client
on public.client_diet_daily_logs for select to authenticated
using (patient_id = public.current_active_patient_id());
create policy client_diet_daily_logs_select_linked_partner
on public.client_diet_daily_logs for select to authenticated
using (public.current_partner_has_active_patient_link(patient_id));
create policy client_diet_daily_logs_insert_own_client
on public.client_diet_daily_logs for insert to authenticated
with check (patient_id = public.current_active_patient_id());
create policy client_diet_daily_logs_update_own_client
on public.client_diet_daily_logs for update to authenticated
using (patient_id = public.current_active_patient_id())
with check (patient_id = public.current_active_patient_id());

create policy client_diet_meal_logs_select_own_client
on public.client_diet_meal_logs for select to authenticated
using (patient_id = public.current_active_patient_id());
create policy client_diet_meal_logs_select_linked_partner
on public.client_diet_meal_logs for select to authenticated
using (public.current_partner_has_active_patient_link(patient_id));
create policy client_diet_meal_logs_insert_own_client
on public.client_diet_meal_logs for insert to authenticated
with check (patient_id = public.current_active_patient_id());
create policy client_diet_meal_logs_update_own_client
on public.client_diet_meal_logs for update to authenticated
using (patient_id = public.current_active_patient_id())
with check (patient_id = public.current_active_patient_id());

create policy client_diet_events_select_own_client
on public.client_diet_events for select to authenticated
using (patient_id = public.current_active_patient_id());
create policy client_diet_events_select_linked_partner
on public.client_diet_events for select to authenticated
using (public.current_partner_has_active_patient_link(patient_id));
create policy client_diet_events_insert_own_client
on public.client_diet_events for insert to authenticated
with check (patient_id = public.current_active_patient_id());

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'client-diet-meal-photos',
  'client-diet-meal-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy client_diet_meal_photo_storage_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'client-diet-meal-photos'
  and (
    (storage.foldername(name))[1] = public.current_active_patient_id()::text
    or public.current_partner_has_active_patient_link((storage.foldername(name))[1]::uuid)
  )
);

create policy client_diet_meal_photo_storage_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'client-diet-meal-photos'
  and (storage.foldername(name))[1] = public.current_active_patient_id()::text
);

create policy client_diet_meal_photo_storage_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'client-diet-meal-photos'
  and (storage.foldername(name))[1] = public.current_active_patient_id()::text
)
with check (
  bucket_id = 'client-diet-meal-photos'
  and (storage.foldername(name))[1] = public.current_active_patient_id()::text
);

create policy client_diet_meal_photo_storage_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'client-diet-meal-photos'
  and (storage.foldername(name))[1] = public.current_active_patient_id()::text
);

create or replace function public.current_client_diet_plan(target_date date default current_date)
returns public.partner_client_diet_plans
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select plan.*
  from public.partner_client_diet_plans as plan
  where plan.patient_id = public.current_active_patient_id()
    and plan.status in ('sent', 'published')
  order by
    case plan.status when 'sent' then 0 when 'published' then 1 else 2 end,
    plan.updated_at desc
  limit 1;
$$;

revoke all on function public.current_client_diet_plan(date) from public;
grant execute on function public.current_client_diet_plan(date) to authenticated;

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
              'sortOrder', item.sort_order
            ) order by item.sort_order, item.created_at)
            from public.partner_client_diet_meal_items as item
            where item.meal_id = meal.id
              and item.plan_id = meal.plan_id
              and item.patient_id = current_patient_id
          ), '[]'::jsonb)
        ) order by meal.sort_order, meal.meal_time)
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
        'fatG', food.fat_g
      ) order by food.usage_count desc, food.updated_at desc)
      from (
        select *
        from public.partner_protocol_foods as food
        where food.partner_id = current_plan.partner_id
          and food.status = 'active'
        order by food.usage_count desc, food.updated_at desc
        limit 12
      ) as food
    ), '[]'::jsonb) end,
    'generatedAt', now()
  ) into result;

  return result;
end;
$$;

create or replace function public.client_diet_mark_meal(
  p_meal_id uuid,
  p_log_date date default current_date,
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
  selected_meal public.partner_client_diet_meals%rowtype;
  next_status text := case when p_completed then 'completed' else 'pending' end;
begin
  if current_patient_id is null then
    raise exception 'Cliente nao autenticado.';
  end if;

  select meal.* into selected_meal
  from public.partner_client_diet_meals as meal
  join public.partner_client_diet_plans as plan on plan.id = meal.plan_id
  where meal.id = p_meal_id
    and meal.patient_id = current_patient_id
    and plan.status in ('sent', 'published')
  limit 1;

  if selected_meal.id is null then
    raise exception 'Refeicao nao encontrada.';
  end if;

  insert into public.client_diet_meal_logs (
    partner_id, patient_id, plan_id, meal_id, log_date, status, completed_at
  )
  values (
    selected_meal.partner_id,
    selected_meal.patient_id,
    selected_meal.plan_id,
    selected_meal.id,
    p_log_date,
    next_status,
    case when p_completed then now() else null end
  )
  on conflict (patient_id, meal_id, log_date)
  do update set
    status = excluded.status,
    completed_at = excluded.completed_at,
    updated_at = now();

  insert into public.client_diet_events (
    partner_id, patient_id, plan_id, meal_id, log_date, event_type, detail
  )
  values (
    selected_meal.partner_id,
    selected_meal.patient_id,
    selected_meal.plan_id,
    selected_meal.id,
    p_log_date,
    case when p_completed then 'meal_marked' else 'meal_unmarked' end,
    case when p_completed then 'Refeicao marcada como realizada.' else 'Refeicao reaberta.' end
  );

  return public.client_diet_dashboard(p_log_date);
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
  safe_amount integer := greatest(0, least(coalesce(p_amount_ml, 250), 2000));
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
    safe_amount
  )
  on conflict (patient_id, plan_id, log_date)
  do update set
    water_ml = least(public.client_diet_daily_logs.water_ml + safe_amount, 12000),
    updated_at = now();

  insert into public.client_diet_events (
    partner_id, patient_id, plan_id, log_date, event_type, detail, details
  )
  values (
    current_plan.partner_id,
    current_plan.patient_id,
    current_plan.id,
    p_log_date,
    'water_added',
    'Agua registrada.',
    jsonb_build_object('amountMl', safe_amount)
  );

  return public.client_diet_dashboard(p_log_date);
end;
$$;

create or replace function public.client_diet_save_meal_note(
  p_meal_id uuid,
  p_log_date date default current_date,
  p_notes text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  selected_meal public.partner_client_diet_meals%rowtype;
  safe_notes text := nullif(btrim(coalesce(p_notes, '')), '');
begin
  if current_patient_id is null then
    raise exception 'Cliente nao autenticado.';
  end if;

  select meal.* into selected_meal
  from public.partner_client_diet_meals as meal
  join public.partner_client_diet_plans as plan on plan.id = meal.plan_id
  where meal.id = p_meal_id
    and meal.patient_id = current_patient_id
    and plan.status in ('sent', 'published')
  limit 1;

  if selected_meal.id is null then
    raise exception 'Refeicao nao encontrada.';
  end if;

  insert into public.client_diet_meal_logs (
    partner_id, patient_id, plan_id, meal_id, log_date, notes
  )
  values (
    selected_meal.partner_id,
    selected_meal.patient_id,
    selected_meal.plan_id,
    selected_meal.id,
    p_log_date,
    safe_notes
  )
  on conflict (patient_id, meal_id, log_date)
  do update set
    notes = excluded.notes,
    updated_at = now();

  insert into public.client_diet_events (
    partner_id, patient_id, plan_id, meal_id, log_date, event_type, detail
  )
  values (
    selected_meal.partner_id,
    selected_meal.patient_id,
    selected_meal.plan_id,
    selected_meal.id,
    p_log_date,
    'note_saved',
    'Observacao de refeicao salva.'
  );

  return public.client_diet_dashboard(p_log_date);
end;
$$;

create or replace function public.client_diet_request_substitution(
  p_meal_id uuid,
  p_log_date date default current_date,
  p_detail text default 'Cliente solicitou substituicao.'
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  selected_meal public.partner_client_diet_meals%rowtype;
  safe_detail text := left(nullif(btrim(coalesce(p_detail, '')), ''), 700);
begin
  if current_patient_id is null then
    raise exception 'Cliente nao autenticado.';
  end if;

  select meal.* into selected_meal
  from public.partner_client_diet_meals as meal
  join public.partner_client_diet_plans as plan on plan.id = meal.plan_id
  where meal.id = p_meal_id
    and meal.patient_id = current_patient_id
    and plan.status in ('sent', 'published')
  limit 1;

  if selected_meal.id is null then
    raise exception 'Refeicao nao encontrada.';
  end if;

  insert into public.client_diet_events (
    partner_id, patient_id, plan_id, meal_id, log_date, event_type, detail
  )
  values (
    selected_meal.partner_id,
    selected_meal.patient_id,
    selected_meal.plan_id,
    selected_meal.id,
    p_log_date,
    'substitution_requested',
    coalesce(safe_detail, 'Cliente solicitou substituicao.')
  );

  return public.client_diet_dashboard(p_log_date);
end;
$$;

create or replace function public.client_diet_attach_meal_photo(
  p_meal_id uuid,
  p_log_date date default current_date,
  p_storage_path text default null,
  p_original_filename text default null,
  p_mime_type text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  selected_meal public.partner_client_diet_meals%rowtype;
  safe_path text := nullif(btrim(coalesce(p_storage_path, '')), '');
begin
  if current_patient_id is null then
    raise exception 'Cliente nao autenticado.';
  end if;

  if safe_path is null or split_part(safe_path, '/', 1) <> current_patient_id::text then
    raise exception 'Arquivo invalido para este Cliente.';
  end if;

  select meal.* into selected_meal
  from public.partner_client_diet_meals as meal
  join public.partner_client_diet_plans as plan on plan.id = meal.plan_id
  where meal.id = p_meal_id
    and meal.patient_id = current_patient_id
    and plan.status in ('sent', 'published')
  limit 1;

  if selected_meal.id is null then
    raise exception 'Refeicao nao encontrada.';
  end if;

  insert into public.client_diet_meal_logs (
    partner_id, patient_id, plan_id, meal_id, log_date, photo_storage_path, photo_original_filename, photo_mime_type
  )
  values (
    selected_meal.partner_id,
    selected_meal.patient_id,
    selected_meal.plan_id,
    selected_meal.id,
    p_log_date,
    safe_path,
    nullif(btrim(coalesce(p_original_filename, '')), ''),
    nullif(btrim(coalesce(p_mime_type, '')), '')
  )
  on conflict (patient_id, meal_id, log_date)
  do update set
    photo_storage_path = excluded.photo_storage_path,
    photo_original_filename = excluded.photo_original_filename,
    photo_mime_type = excluded.photo_mime_type,
    updated_at = now();

  insert into public.client_diet_events (
    partner_id, patient_id, plan_id, meal_id, log_date, event_type, detail, details
  )
  values (
    selected_meal.partner_id,
    selected_meal.patient_id,
    selected_meal.plan_id,
    selected_meal.id,
    p_log_date,
    'photo_attached',
    'Foto da refeicao anexada.',
    jsonb_build_object('storagePath', safe_path)
  );

  return public.client_diet_dashboard(p_log_date);
end;
$$;

revoke all on function public.client_diet_dashboard(date) from public;
revoke all on function public.client_diet_mark_meal(uuid, date, boolean) from public;
revoke all on function public.client_diet_add_water(date, integer) from public;
revoke all on function public.client_diet_save_meal_note(uuid, date, text) from public;
revoke all on function public.client_diet_request_substitution(uuid, date, text) from public;
revoke all on function public.client_diet_attach_meal_photo(uuid, date, text, text, text) from public;

grant execute on function public.client_diet_dashboard(date) to authenticated;
grant execute on function public.client_diet_mark_meal(uuid, date, boolean) to authenticated;
grant execute on function public.client_diet_add_water(date, integer) to authenticated;
grant execute on function public.client_diet_save_meal_note(uuid, date, text) to authenticated;
grant execute on function public.client_diet_request_substitution(uuid, date, text) to authenticated;
grant execute on function public.client_diet_attach_meal_photo(uuid, date, text, text, text) to authenticated;
