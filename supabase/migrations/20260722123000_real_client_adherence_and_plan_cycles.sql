-- Adesao operacional real do Cliente e separacao entre ciclo financeiro e atualizacao clinica.

create or replace function public.partner_client_real_adherence(
  p_patient_id uuid,
  p_reference_date date default current_date,
  p_weeks integer default 6
)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with runtime as (
    select
      public.current_active_partner_id() as partner_id,
      greatest(1, least(coalesce(p_weeks, 6), 12))::integer as weeks_count,
      date_trunc('week', coalesce(p_reference_date, current_date))::date as current_week_start
  ),
  authorized as (
    select runtime.*
    from runtime
    where runtime.partner_id is not null
      and public.current_partner_has_active_patient_link(p_patient_id)
  ),
  week_windows as (
    select
      (authorized.current_week_start - ((authorized.weeks_count - 1 - week_index) * interval '7 days'))::date as period_start,
      (authorized.current_week_start - ((authorized.weeks_count - 1 - week_index) * interval '7 days') + interval '6 days')::date as period_end
    from authorized
    cross join generate_series(0, authorized.weeks_count - 1) as week_index
  ),
  active_workout_program as (
    select program.*
    from authorized
    join public.partner_workout_programs as program
      on program.partner_id = authorized.partner_id
     and program.patient_id = p_patient_id
     and program.program_kind = 'client'
     and program.status in ('sent', 'published')
    order by
      case program.status when 'sent' then 0 when 'published' then 1 else 2 end,
      program.updated_at desc
    limit 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', concat('real-', week_windows.period_start::text),
    'periodStart', week_windows.period_start,
    'periodEnd', week_windows.period_end,
    'dietPercentage', case
      when diet_totals.planned_count > 0 then least(100, round((diet_totals.completed_count::numeric / diet_totals.planned_count::numeric) * 100))::integer
      else null
    end,
    'trainingPercentage', case
      when workout_totals.planned_count > 0 then least(100, round((workout_totals.completed_count::numeric / workout_totals.planned_count::numeric) * 100))::integer
      else null
    end,
    'dietCompleted', diet_totals.completed_count,
    'dietPlanned', diet_totals.planned_count,
    'trainingCompleted', workout_totals.completed_count,
    'trainingPlanned', workout_totals.planned_count
  ) order by week_windows.period_start), '[]'::jsonb)
  from week_windows
  cross join authorized
  left join lateral (
    with days as (
      select day::date as log_date
      from generate_series(week_windows.period_start, week_windows.period_end, interval '1 day') as day
    ),
    planned as (
      select count(meal.id)::integer as planned_count
      from days
      join lateral (
        select plan.id
        from public.partner_client_diet_plans as plan
        where plan.partner_id = authorized.partner_id
          and plan.patient_id = p_patient_id
          and plan.status in ('sent', 'published')
          and coalesce(plan.sent_at, plan.published_at, plan.created_at)::date <= days.log_date
        order by
          case plan.status when 'sent' then 0 when 'published' then 1 else 2 end,
          plan.updated_at desc
        limit 1
      ) as diet_plan on true
      join public.partner_client_diet_meals as meal
        on meal.partner_id = authorized.partner_id
       and meal.patient_id = p_patient_id
       and meal.plan_id = diet_plan.id
       and meal.day_of_week = extract(isodow from days.log_date)::smallint
    ),
    completed as (
      select count(distinct log.meal_id)::integer as completed_count
      from public.client_diet_meal_logs as log
      where log.partner_id = authorized.partner_id
        and log.patient_id = p_patient_id
        and log.log_date between week_windows.period_start and week_windows.period_end
        and log.status = 'completed'
    )
    select
      coalesce(planned.planned_count, 0)::integer as planned_count,
      least(coalesce(completed.completed_count, 0), coalesce(planned.planned_count, 0))::integer as completed_count
    from planned
    cross join completed
  ) as diet_totals on true
  left join lateral (
    with planned as (
      select coalesce(sum(session.frequency_per_week * set_counts.set_count), 0)::integer as planned_count
      from active_workout_program as program
      join public.partner_workout_sessions as session
        on session.partner_id = authorized.partner_id
       and session.program_id = program.id
      left join lateral (
        select count(workout_set.id)::integer as set_count
        from public.partner_workout_exercises as exercise
        join public.partner_workout_sets as workout_set
          on workout_set.partner_id = exercise.partner_id
         and workout_set.prescribed_exercise_id = exercise.id
        where exercise.partner_id = authorized.partner_id
          and exercise.session_id = session.id
      ) as set_counts on true
    ),
    completed as (
      select count(set_log.id)::integer as completed_count
      from public.client_workout_set_logs as set_log
      join public.client_workout_sessions as client_session
        on client_session.id = set_log.client_session_id
       and client_session.partner_id = set_log.partner_id
       and client_session.patient_id = set_log.patient_id
      where set_log.partner_id = authorized.partner_id
        and set_log.patient_id = p_patient_id
        and set_log.status = 'completed'
        and client_session.workout_date between week_windows.period_start and week_windows.period_end
    )
    select
      coalesce(planned.planned_count, 0)::integer as planned_count,
      least(coalesce(completed.completed_count, 0), coalesce(planned.planned_count, 0))::integer as completed_count
    from planned
    cross join completed
  ) as workout_totals on true;
$$;

revoke all on function public.partner_client_real_adherence(uuid, date, integer) from public;
grant execute on function public.partner_client_real_adherence(uuid, date, integer) to authenticated;
grant execute on function public.partner_client_real_adherence(uuid, date, integer) to service_role;

alter table public.partner_financial_events
  drop constraint if exists partner_financial_events_type_check,
  add constraint partner_financial_events_type_check check (
    event_type in (
      'plan_created',
      'plan_updated',
      'plan_archived',
      'plan_duplicated',
      'contract_created',
      'contract_renewed',
      'contract_paused',
      'contract_completed',
      'contract_cancelled',
      'receivable_created',
      'payment_recorded',
      'payment_reverted',
      'receivable_cancelled'
    )
  );

comment on function public.partner_client_real_adherence(uuid, date, integer)
  is 'Calcula adesao semanal real do Cliente a partir de refeições marcadas e séries de treino executadas.';
comment on table public.partner_financial_events
  is 'Eventos financeiros manuais do profissional; renovação de contrato financeiro fica separada de atualização clínica de dieta e treino.';
