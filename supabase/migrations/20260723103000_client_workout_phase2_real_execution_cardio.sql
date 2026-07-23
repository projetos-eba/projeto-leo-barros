create or replace function public.partner_client_workouts(p_patient_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_partner_id uuid := public.current_active_partner_id();
begin
  if current_partner_id is null or not public.current_partner_has_active_patient_link(p_patient_id) then
    return null;
  end if;

  return jsonb_build_object(
    'programs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'title', p.title, 'status', p.status, 'version', p.version,
        'notes', p.notes, 'publishedAt', p.published_at, 'sentAt', p.sent_at,
        'createdAt', p.created_at, 'updatedAt', p.updated_at,
        'sessions', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', s.id, 'title', s.title, 'objective', s.objective,
            'frequencyPerWeek', s.frequency_per_week, 'durationMinutes', s.duration_minutes,
            'sortOrder', s.sort_order,
            'exercises', coalesce((
              select jsonb_agg(jsonb_build_object(
                'id', we.id, 'exerciseId', we.exercise_id, 'variationName', we.variation_name,
                'restSeconds', we.rest_seconds, 'cadence', we.cadence, 'technique', we.technique,
                'notes', we.notes, 'bisetGroupId', we.biset_group_id,
                'bisetPosition', we.biset_position, 'sortOrder', we.sort_order,
                'name', we.snapshot_name, 'muscleGroup', we.snapshot_muscle_group,
                'secondaryMuscleGroups', we.snapshot_secondary_muscle_groups,
                'thumbnailUrl', we.snapshot_thumbnail_url,
                'sets', coalesce((
                  select jsonb_agg(jsonb_build_object(
                    'id', ws.id, 'setNumber', ws.set_number, 'reps', ws.reps,
                    'loadKg', ws.load_kg, 'intensity', ws.intensity
                  ) order by ws.set_number)
                  from public.partner_workout_sets ws
                  where ws.prescribed_exercise_id = we.id and ws.partner_id = current_partner_id
                ), '[]'::jsonb)
              ) order by we.sort_order, we.created_at)
              from public.partner_workout_exercises we
              where we.session_id = s.id and we.partner_id = current_partner_id
            ), '[]'::jsonb)
          ) order by s.sort_order, s.created_at)
          from public.partner_workout_sessions s
          where s.program_id = p.id and s.partner_id = current_partner_id
        ), '[]'::jsonb)
      ) order by
        case p.status when 'sent' then 0 when 'published' then 1 when 'draft' then 2 else 3 end,
        p.updated_at desc)
      from public.partner_workout_programs p
      where p.partner_id = current_partner_id and p.patient_id = p_patient_id
        and p.program_kind = 'client' and p.status <> 'archived'
    ), '[]'::jsonb),
    'templates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'title', p.title, 'status', p.status, 'version', p.version,
        'notes', p.notes, 'createdAt', p.created_at, 'updatedAt', p.updated_at,
        'sessionCount', (select count(*) from public.partner_workout_sessions s where s.program_id = p.id)
      ) order by p.updated_at desc)
      from public.partner_workout_programs p
      where p.partner_id = current_partner_id and p.program_kind = 'template' and p.status <> 'archived'
    ), '[]'::jsonb),
    'exercises', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'name', e.name, 'muscleGroup', e.muscle_group,
        'secondaryMuscleGroups', e.secondary_muscle_groups, 'equipment', e.equipment,
        'objective', e.objective, 'defaultSets', e.default_sets, 'defaultReps', e.default_reps,
        'restSeconds', e.rest_seconds, 'cadence', e.cadence, 'thumbnailUrl', e.thumbnail_url,
        'videoUrl', e.video_url, 'variations', e.variations, 'usageCount', e.usage_count
      ) order by e.usage_count desc, e.name)
      from public.partner_protocol_exercises e
      where e.partner_id = current_partner_id and e.status = 'active'
    ), '[]'::jsonb),
    'workoutSessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', client_session.id,
        'programId', client_session.program_id,
        'prescribedSessionId', client_session.prescribed_session_id,
        'workoutDate', client_session.workout_date,
        'status', client_session.status,
        'startedAt', client_session.started_at,
        'completedAt', client_session.completed_at,
        'durationMinutes', client_session.duration_minutes,
        'totalVolumeKg', client_session.total_volume_kg,
        'notes', client_session.notes
      ) order by client_session.workout_date desc, client_session.created_at desc)
      from public.client_workout_sessions client_session
      join public.partner_workout_programs program on program.id = client_session.program_id
      where client_session.patient_id = p_patient_id
        and program.partner_id = current_partner_id
        and program.program_kind = 'client'
        and client_session.workout_date >= current_date - 90
    ), '[]'::jsonb),
    'exerciseLogs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', exercise_log.id,
        'clientSessionId', exercise_log.client_session_id,
        'prescribedExerciseId', exercise_log.prescribed_exercise_id,
        'status', exercise_log.status,
        'startedAt', exercise_log.started_at,
        'completedAt', exercise_log.completed_at,
        'notes', exercise_log.notes
      ) order by exercise_log.created_at)
      from public.client_workout_exercise_logs exercise_log
      join public.client_workout_sessions client_session on client_session.id = exercise_log.client_session_id
      join public.partner_workout_programs program on program.id = client_session.program_id
      where exercise_log.patient_id = p_patient_id
        and program.partner_id = current_partner_id
        and program.program_kind = 'client'
        and client_session.workout_date >= current_date - 90
    ), '[]'::jsonb),
    'setLogs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', set_log.id,
        'clientSessionId', set_log.client_session_id,
        'exerciseLogId', set_log.exercise_log_id,
        'prescribedExerciseId', set_log.prescribed_exercise_id,
        'prescribedSetId', set_log.prescribed_set_id,
        'setNumber', set_log.set_number,
        'loadKg', set_log.load_kg,
        'reps', set_log.reps,
        'status', set_log.status,
        'completedAt', set_log.completed_at
      ) order by set_log.created_at)
      from public.client_workout_set_logs set_log
      join public.client_workout_sessions client_session on client_session.id = set_log.client_session_id
      join public.partner_workout_programs program on program.id = client_session.program_id
      where set_log.patient_id = p_patient_id
        and program.partner_id = current_partner_id
        and program.program_kind = 'client'
        and client_session.workout_date >= current_date - 90
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ev.id, 'actorName', ev.actor_name, 'eventType', ev.event_type,
        'detail', ev.detail, 'version', ev.version, 'createdAt', ev.created_at
      ) order by ev.created_at desc)
      from public.partner_workout_events ev
      where ev.partner_id = current_partner_id and ev.patient_id = p_patient_id
    ), '[]'::jsonb)
  );
end;
$$;

comment on function public.partner_client_workouts(uuid)
  is 'Returns workout prescription, execution logs, templates, library and history for one linked Client.';

create or replace function public.client_workout_dashboard(p_date date default current_date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  current_program public.partner_workout_programs%rowtype;
  current_cardio_plan public.partner_client_cardio_plans%rowtype;
  result jsonb;
begin
  if current_patient_id is null then
    return null;
  end if;

  select * into current_program from public.current_client_workout_program();

  select * into current_cardio_plan
  from public.partner_client_cardio_plans plan
  where plan.patient_id = current_patient_id
    and plan.status in ('sent', 'published')
    and (
      current_program.id is null
      or plan.partner_id = current_program.partner_id
    )
  order by
    case plan.status when 'sent' then 0 when 'published' then 1 else 2 end,
    plan.updated_at desc
  limit 1;

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
    'program', case when current_program.id is null then null else jsonb_build_object(
      'id', current_program.id,
      'partnerId', current_program.partner_id,
      'patientId', current_program.patient_id,
      'title', current_program.title,
      'status', current_program.status,
      'version', current_program.version,
      'notes', current_program.notes,
      'updatedAt', current_program.updated_at,
      'sentAt', current_program.sent_at,
      'publishedAt', current_program.published_at,
      'sessions', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', session.id,
          'title', session.title,
          'objective', session.objective,
          'frequencyPerWeek', session.frequency_per_week,
          'durationMinutes', session.duration_minutes,
          'sortOrder', session.sort_order,
          'exercises', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', exercise.id,
              'exerciseId', exercise.exercise_id,
              'name', exercise.snapshot_name,
              'muscleGroup', exercise.snapshot_muscle_group,
              'secondaryMuscleGroups', exercise.snapshot_secondary_muscle_groups,
              'variationName', exercise.variation_name,
              'thumbnailUrl', exercise.snapshot_thumbnail_url,
              'restSeconds', exercise.rest_seconds,
              'cadence', exercise.cadence,
              'technique', exercise.technique,
              'notes', exercise.notes,
              'bisetGroupId', exercise.biset_group_id,
              'bisetPosition', exercise.biset_position,
              'sortOrder', exercise.sort_order,
              'sets', coalesce((
                select jsonb_agg(jsonb_build_object(
                  'id', workout_set.id,
                  'setNumber', workout_set.set_number,
                  'reps', workout_set.reps,
                  'loadKg', workout_set.load_kg,
                  'intensity', workout_set.intensity
                ) order by workout_set.set_number)
                from public.partner_workout_sets as workout_set
                where workout_set.prescribed_exercise_id = exercise.id
                  and workout_set.partner_id = exercise.partner_id
              ), '[]'::jsonb)
            ) order by exercise.sort_order, exercise.created_at)
            from public.partner_workout_exercises as exercise
            where exercise.session_id = session.id
              and exercise.partner_id = session.partner_id
          ), '[]'::jsonb)
        ) order by session.sort_order, session.created_at)
        from public.partner_workout_sessions as session
        where session.program_id = current_program.id
          and session.partner_id = current_program.partner_id
      ), '[]'::jsonb)
    ) end,
    'workoutSessions', case when current_program.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', client_session.id,
        'programId', client_session.program_id,
        'prescribedSessionId', client_session.prescribed_session_id,
        'workoutDate', client_session.workout_date,
        'status', client_session.status,
        'startedAt', client_session.started_at,
        'completedAt', client_session.completed_at,
        'durationMinutes', client_session.duration_minutes,
        'totalVolumeKg', client_session.total_volume_kg,
        'notes', client_session.notes
      ) order by client_session.workout_date desc, client_session.created_at desc)
      from public.client_workout_sessions as client_session
      where client_session.program_id = current_program.id
        and client_session.patient_id = current_patient_id
        and client_session.workout_date between p_date - 30 and p_date
    ), '[]'::jsonb) end,
    'exerciseLogs', case when current_program.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', exercise_log.id,
        'clientSessionId', exercise_log.client_session_id,
        'prescribedExerciseId', exercise_log.prescribed_exercise_id,
        'status', exercise_log.status,
        'startedAt', exercise_log.started_at,
        'completedAt', exercise_log.completed_at,
        'notes', exercise_log.notes
      ) order by exercise_log.created_at)
      from public.client_workout_exercise_logs as exercise_log
      join public.client_workout_sessions as client_session on client_session.id = exercise_log.client_session_id
      where client_session.program_id = current_program.id
        and exercise_log.patient_id = current_patient_id
        and client_session.workout_date between p_date - 30 and p_date
    ), '[]'::jsonb) end,
    'setLogs', case when current_program.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', set_log.id,
        'clientSessionId', set_log.client_session_id,
        'exerciseLogId', set_log.exercise_log_id,
        'prescribedExerciseId', set_log.prescribed_exercise_id,
        'prescribedSetId', set_log.prescribed_set_id,
        'setNumber', set_log.set_number,
        'loadKg', set_log.load_kg,
        'reps', set_log.reps,
        'status', set_log.status,
        'completedAt', set_log.completed_at
      ) order by set_log.created_at)
      from public.client_workout_set_logs as set_log
      join public.client_workout_sessions as client_session on client_session.id = set_log.client_session_id
      where client_session.program_id = current_program.id
        and set_log.patient_id = current_patient_id
        and client_session.workout_date between p_date - 30 and p_date
    ), '[]'::jsonb) end,
    'cardio', case when current_cardio_plan.id is null then null else jsonb_build_object(
      'plan', jsonb_build_object(
        'id', current_cardio_plan.id,
        'title', current_cardio_plan.title,
        'status', current_cardio_plan.status,
        'weeklyTargetMinutes', current_cardio_plan.weekly_target_minutes,
        'weightKg', current_cardio_plan.weight_kg,
        'activityKey', current_cardio_plan.primary_activity_key,
        'comparisonActivityKey', current_cardio_plan.comparison_activity_key,
        'targetZone', current_cardio_plan.target_zone,
        'notes', current_cardio_plan.notes,
        'version', current_cardio_plan.version,
        'publishedAt', current_cardio_plan.published_at,
        'sentAt', current_cardio_plan.sent_at,
        'updatedAt', current_cardio_plan.updated_at
      ),
      'sessions', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', session.id,
          'performedAt', session.performed_at,
          'durationMinutes', session.duration_minutes,
          'activityKey', session.activity_key,
          'met', session.met,
          'kcalEstimate', session.kcal_estimate,
          'targetZone', session.target_zone,
          'notes', session.notes
        ) order by session.performed_at desc)
        from public.partner_client_cardio_sessions session
        where session.plan_id = current_cardio_plan.id
          and session.patient_id = current_patient_id
          and session.performed_at >= date_trunc('week', p_date::timestamptz)
          and session.performed_at < date_trunc('week', p_date::timestamptz) + interval '7 days'
      ), '[]'::jsonb)
    ) end,
    'generatedAt', now()
  ) into result;

  return result;
end;
$$;
