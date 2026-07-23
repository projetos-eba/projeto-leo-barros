-- Execucao diaria da Dieta pelo Cliente.
-- Adiciona status parcial e uma RPC explicita para marcar realizada, parcial, pulada ou pendente.

alter table public.client_diet_meal_logs
  drop constraint if exists client_diet_meal_logs_status_check,
  add constraint client_diet_meal_logs_status_check
    check (status in ('pending', 'completed', 'partial', 'skipped'));

alter table public.client_diet_events
  drop constraint if exists client_diet_events_type_check,
  add constraint client_diet_events_type_check
    check (event_type in (
      'meal_marked',
      'meal_unmarked',
      'meal_partial',
      'meal_skipped',
      'water_added',
      'water_removed',
      'note_saved',
      'substitution_requested',
      'substitution_applied',
      'photo_attached'
    ));

create or replace function public.client_diet_set_meal_status(
  p_meal_id uuid,
  p_log_date date default current_date,
  p_status text default 'completed'
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
  safe_status text := case
    when p_status in ('completed', 'partial', 'pending', 'skipped') then p_status
    else 'pending'
  end;
begin
  if current_patient_id is null then
    raise exception 'Cliente nao autenticado.';
  end if;

  select meal.* into selected_meal
  from public.partner_client_diet_meals as meal
  join public.partner_client_diet_plans as plan on plan.id = meal.plan_id
  where meal.id = p_meal_id
    and meal.patient_id = current_patient_id
    and plan.status = 'active'
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
    safe_status,
    case when safe_status = 'completed' then now() else null end
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
    case safe_status
      when 'completed' then 'meal_marked'
      when 'partial' then 'meal_partial'
      when 'skipped' then 'meal_skipped'
      else 'meal_unmarked'
    end,
    case safe_status
      when 'completed' then 'Refeicao marcada como realizada.'
      when 'partial' then 'Refeicao marcada como parcial.'
      when 'skipped' then 'Refeicao marcada como pulada.'
      else 'Refeicao reaberta.'
    end
  );

  return public.client_diet_dashboard(p_log_date);
end;
$$;

revoke all on function public.client_diet_set_meal_status(uuid, date, text) from public;
grant execute on function public.client_diet_set_meal_status(uuid, date, text) to authenticated;

create or replace function public.client_diet_mark_meal(
  p_meal_id uuid,
  p_log_date date default current_date,
  p_completed boolean default true
)
returns jsonb
language sql
volatile
security definer
set search_path = public, pg_temp
as $$
  select public.client_diet_set_meal_status(
    p_meal_id,
    p_log_date,
    case when p_completed then 'completed' else 'pending' end
  );
$$;

revoke all on function public.client_diet_mark_meal(uuid, date, boolean) from public;
grant execute on function public.client_diet_mark_meal(uuid, date, boolean) to authenticated;
