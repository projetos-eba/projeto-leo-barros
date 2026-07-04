-- Dashboard Minha Evolucao do Cliente.

drop policy if exists partner_client_photo_sessions_select_own_client on public.partner_client_photo_sessions;
drop policy if exists partner_client_photo_items_select_own_client on public.partner_client_photo_items;
drop policy if exists partner_client_photo_notes_select_own_client on public.partner_client_photo_comparison_notes;
drop policy if exists partner_client_photo_events_select_own_client on public.partner_client_photo_events;
drop policy if exists partner_client_photo_storage_select_own_client on storage.objects;

create policy partner_client_photo_sessions_select_own_client
on public.partner_client_photo_sessions for select to authenticated
using (patient_id = public.current_active_patient_id());

create policy partner_client_photo_items_select_own_client
on public.partner_client_photo_items for select to authenticated
using (patient_id = public.current_active_patient_id());

create policy partner_client_photo_notes_select_own_client
on public.partner_client_photo_comparison_notes for select to authenticated
using (patient_id = public.current_active_patient_id());

create policy partner_client_photo_events_select_own_client
on public.partner_client_photo_events for select to authenticated
using (patient_id = public.current_active_patient_id());

create policy partner_client_photo_storage_select_own_client
on storage.objects for select to authenticated
using (
  bucket_id = 'partner-client-photos'
  and (storage.foldername(name))[2] = public.current_active_patient_id()::text
);

create or replace function public.client_evolution_dashboard(
  p_start_date date default null,
  p_end_date date default current_date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  selected_start_date date;
  selected_end_date date := coalesce(p_end_date, current_date);
  result jsonb;
begin
  if current_patient_id is null then
    return null;
  end if;

  select coalesce(
    p_start_date,
    (
      select subscription.current_period_start::date
      from public.partner_client_plan_subscriptions subscription
      where subscription.patient_id = current_patient_id
        and subscription.status in ('active', 'past_due', 'pending')
      order by subscription.current_period_start desc
      limit 1
    ),
    selected_end_date - 90
  )
  into selected_start_date;

  if selected_start_date > selected_end_date then
    selected_start_date := selected_end_date - 90;
  end if;

  with current_client as (
    select
      patient.id,
      patient.avatar_url,
      patient.objective,
      profile.display_name
    from public.patients patient
    join public.profiles profile on profile.id = patient.profile_id
    where patient.id = current_patient_id
  ),
  linked_partners as (
    select distinct relationship.partner_id
    from public.partner_clients relationship
    where relationship.patient_id = current_patient_id
      and relationship.status = 'active'
  ),
  assessment_rows as (
    select
      assessment.id,
      assessment.partner_id,
      assessment.assessed_at,
      assessment.title,
      assessment.height_cm,
      assessment.weight_kg,
      assessment.body_fat_percentage,
      assessment.muscle_mass_kg,
      greatest(assessment.weight_kg - coalesce(assessment.muscle_mass_kg, 0), 0) as fat_mass_kg,
      case
        when assessment.height_cm > 0 then assessment.weight_kg / power(assessment.height_cm / 100, 2)
        else null
      end as bmi,
      assessment.notes
    from public.partner_client_assessments assessment
    where assessment.patient_id = current_patient_id
      and assessment.assessed_at::date between selected_start_date and selected_end_date
  ),
  measurement_rows as (
    select
      measurement.id,
      measurement.partner_id,
      measurement.measured_at,
      measurement.weight_kg,
      measurement.body_fat_percentage
    from public.partner_client_body_measurements measurement
    where measurement.patient_id = current_patient_id
      and measurement.measured_at::date between selected_start_date and selected_end_date
  ),
  workout_program as (
    select program.*
    from public.partner_workout_programs program
    where program.patient_id = current_patient_id
      and program.program_kind = 'client'
      and program.status in ('sent', 'published')
    order by
      case program.status when 'sent' then 0 when 'published' then 1 else 2 end,
      program.updated_at desc
    limit 1
  ),
  workout_sessions as (
    select session.*
    from public.client_workout_sessions session
    where session.patient_id = current_patient_id
      and session.workout_date between selected_start_date and selected_end_date
  ),
  workout_set_logs as (
    select log.*
    from public.client_workout_set_logs log
    join workout_sessions session on session.id = log.client_session_id
    where log.patient_id = current_patient_id
  ),
  diet_plan as (
    select plan.*
    from public.partner_client_diet_plans plan
    where plan.patient_id = current_patient_id
      and plan.status in ('sent', 'published')
    order by
      case plan.status when 'sent' then 0 when 'published' then 1 else 2 end,
      plan.updated_at desc
    limit 1
  ),
  diet_days as (
    select generate_series(selected_start_date, selected_end_date, interval '1 day')::date as log_date
  ),
  diet_logs as (
    select
      day.log_date,
      coalesce(daily.water_ml, 0) as water_ml,
      coalesce((
        select sum(item.snapshot_kcal)
        from public.client_diet_meal_logs meal_log
        join public.partner_client_diet_meal_items item on item.meal_id = meal_log.meal_id
        where meal_log.patient_id = current_patient_id
          and meal_log.log_date = day.log_date
          and meal_log.status = 'completed'
      ), 0) as consumed_kcal
    from diet_days day
    left join public.client_diet_daily_logs daily
      on daily.patient_id = current_patient_id
     and daily.log_date = day.log_date
  ),
  photo_sessions as (
    select session.*
    from public.partner_client_photo_sessions session
    where session.patient_id = current_patient_id
      and session.status <> 'archived'
  ),
  photo_measurements as (
    select
      session.id as session_id,
      assessment.weight_kg,
      (
        select c.value_cm
        from public.partner_client_assessment_circumferences c
        where c.assessment_id = assessment.id and c.metric_key = 'waist'
      ) as waist_cm,
      (
        select c.value_cm
        from public.partner_client_assessment_circumferences c
        where c.assessment_id = assessment.id and c.metric_key = 'hip'
      ) as hip_cm,
      (
        select round(avg(c.value_cm)::numeric, 2)
        from public.partner_client_assessment_circumferences c
        where c.assessment_id = assessment.id
          and c.metric_key in ('right_arm_contracted', 'left_arm_contracted')
      ) as arm_cm,
      (
        select round(avg(c.value_cm)::numeric, 2)
        from public.partner_client_assessment_circumferences c
        where c.assessment_id = assessment.id
          and c.metric_key in ('right_thigh', 'left_thigh')
      ) as thigh_cm,
      (
        select round(avg(c.value_cm)::numeric, 2)
        from public.partner_client_assessment_circumferences c
        where c.assessment_id = assessment.id
          and c.metric_key in ('right_calf', 'left_calf')
      ) as calf_cm
    from photo_sessions session
    left join lateral (
      select a.*
      from public.partner_client_assessments a
      where a.patient_id = current_patient_id
      order by abs(extract(epoch from (a.assessed_at - session.captured_at))) asc
      limit 1
    ) assessment on true
  )
  select jsonb_build_object(
    'client', (
      select jsonb_build_object(
        'id', client.id,
        'name', client.display_name,
        'avatarUrl', client.avatar_url,
        'objective', client.objective
      )
      from current_client client
    ),
    'period', jsonb_build_object(
      'startDate', selected_start_date,
      'endDate', selected_end_date
    ),
    'assessments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', row.id,
        'assessedAt', row.assessed_at,
        'title', row.title,
        'heightCm', row.height_cm,
        'weightKg', row.weight_kg,
        'bodyFatPercentage', row.body_fat_percentage,
        'muscleMassKg', row.muscle_mass_kg,
        'fatMassKg', row.fat_mass_kg,
        'bmi', row.bmi,
        'notes', row.notes
      ) order by row.assessed_at)
      from assessment_rows row
    ), '[]'::jsonb),
    'measurements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', row.id,
        'measuredAt', row.measured_at,
        'weightKg', row.weight_kg,
        'bodyFatPercentage', row.body_fat_percentage
      ) order by row.measured_at)
      from measurement_rows row
    ), '[]'::jsonb),
    'workout', jsonb_build_object(
      'program', (
        select jsonb_build_object(
          'id', program.id,
          'title', program.title,
          'status', program.status,
          'version', program.version,
          'updatedAt', program.updated_at,
          'sessions', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', prescribed.id,
              'title', prescribed.title,
              'objective', prescribed.objective,
              'frequencyPerWeek', prescribed.frequency_per_week,
              'durationMinutes', prescribed.duration_minutes,
              'sortOrder', prescribed.sort_order,
              'exercises', coalesce((
                select jsonb_agg(jsonb_build_object(
                  'id', exercise.id,
                  'name', exercise.snapshot_name,
                  'muscleGroup', exercise.snapshot_muscle_group,
                  'secondaryMuscleGroups', exercise.snapshot_secondary_muscle_groups,
                  'sets', coalesce((
                    select jsonb_agg(jsonb_build_object(
                      'id', workout_set.id,
                      'setNumber', workout_set.set_number,
                      'reps', workout_set.reps,
                      'loadKg', workout_set.load_kg,
                      'intensity', workout_set.intensity
                    ) order by workout_set.set_number)
                    from public.partner_workout_sets workout_set
                    where workout_set.prescribed_exercise_id = exercise.id
                  ), '[]'::jsonb)
                ) order by exercise.sort_order, exercise.created_at)
                from public.partner_workout_exercises exercise
                where exercise.session_id = prescribed.id
              ), '[]'::jsonb)
            ) order by prescribed.sort_order, prescribed.created_at)
            from public.partner_workout_sessions prescribed
            where prescribed.program_id = program.id
          ), '[]'::jsonb)
        )
        from workout_program program
      ),
      'sessions', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', session.id,
          'programId', session.program_id,
          'prescribedSessionId', session.prescribed_session_id,
          'workoutDate', session.workout_date,
          'status', session.status,
          'durationMinutes', session.duration_minutes,
          'totalVolumeKg', session.total_volume_kg
        ) order by session.workout_date)
        from workout_sessions session
      ), '[]'::jsonb),
      'setLogs', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', log.id,
          'clientSessionId', log.client_session_id,
          'prescribedExerciseId', log.prescribed_exercise_id,
          'setNumber', log.set_number,
          'loadKg', log.load_kg,
          'reps', log.reps,
          'status', log.status,
          'completedAt', log.completed_at
        ) order by log.completed_at)
        from workout_set_logs log
      ), '[]'::jsonb)
    ),
    'nutrition', jsonb_build_object(
      'plan', (
        select jsonb_build_object(
          'id', plan.id,
          'title', plan.title,
          'targetKcal', plan.target_kcal,
          'targetProteinG', plan.target_protein_g,
          'targetCarbsG', plan.target_carbs_g,
          'targetFatG', plan.target_fat_g,
          'waterLiters', plan.water_liters,
          'calorieStrategy', plan.calorie_strategy,
          'updatedAt', plan.updated_at
        )
        from diet_plan plan
      ),
      'logs', coalesce((
        select jsonb_agg(jsonb_build_object(
          'date', log.log_date,
          'consumedKcal', log.consumed_kcal,
          'waterMl', log.water_ml
        ) order by log.log_date)
        from diet_logs log
      ), '[]'::jsonb)
    ),
    'photos', jsonb_build_object(
      'generatedAt', now(),
      'partnerId', (
        select session.partner_id
        from photo_sessions session
        order by session.captured_at desc
        limit 1
      ),
      'patientId', current_patient_id,
      'sessions', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', session.id,
          'capturedAt', session.captured_at,
          'title', session.title,
          'status', session.status,
          'notes', session.notes,
          'createdAt', session.created_at,
          'updatedAt', session.updated_at,
          'measurements', jsonb_build_object(
            'weightKg', measurement.weight_kg,
            'waistCm', measurement.waist_cm,
            'hipCm', measurement.hip_cm,
            'armCm', measurement.arm_cm,
            'thighCm', measurement.thigh_cm,
            'calfCm', measurement.calf_cm
          ),
          'photos', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', item.id,
              'angle', item.angle,
              'storagePath', item.storage_path,
              'originalFilename', item.original_filename,
              'mimeType', item.mime_type,
              'sizeBytes', item.size_bytes,
              'widthPx', item.width_px,
              'heightPx', item.height_px,
              'cropData', item.crop_data,
              'createdAt', item.created_at
            ) order by case item.angle when 'front' then 1 when 'back' then 2 when 'left' then 3 else 4 end)
            from public.partner_client_photo_items item
            where item.session_id = session.id
          ), '[]'::jsonb)
        ) order by session.captured_at desc)
        from photo_sessions session
        left join photo_measurements measurement on measurement.session_id = session.id
      ), '[]'::jsonb),
      'comparisonNotes', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', note.id,
          'beforeSessionId', note.before_session_id,
          'afterSessionId', note.after_session_id,
          'notes', note.notes,
          'updatedAt', note.updated_at
        ) order by note.updated_at desc)
        from public.partner_client_photo_comparison_notes note
        where note.patient_id = current_patient_id
      ), '[]'::jsonb),
      'events', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', event.id,
          'sessionId', event.session_id,
          'actorName', event.actor_name,
          'eventType', event.event_type,
          'detail', event.detail,
          'details', event.details,
          'createdAt', event.created_at
        ) order by event.created_at desc)
        from public.partner_client_photo_events event
        where event.patient_id = current_patient_id
      ), '[]'::jsonb)
    ),
    'generatedAt', now()
  )
  into result;

  return result;
end;
$$;

revoke all on function public.client_evolution_dashboard(date, date) from public;
grant execute on function public.client_evolution_dashboard(date, date) to authenticated;

comment on function public.client_evolution_dashboard(date, date)
is 'Retorna dados consolidados da pagina Minha Evolucao para o Cliente autenticado, incluindo antropometria, treino, nutricao e fotos proprias.';

notify pgrst, 'reload schema';
