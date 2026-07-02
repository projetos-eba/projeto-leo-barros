-- Dominio operacional da Visao Geral individual do Cliente.
-- Dados de smoke permanecem em supabase/seed.sql.

alter table public.patients
add column gender text,
add column avatar_url text,
add constraint patients_gender_check
  check (gender is null or gender in ('female', 'male', 'non_binary', 'other', 'not_informed')),
add constraint patients_avatar_url_not_blank
  check (avatar_url is null or length(btrim(avatar_url)) > 0);

create or replace function public.current_partner_has_patient_link(target_patient_id uuid)
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
  );
$$;

revoke all on function public.current_partner_has_patient_link(uuid) from public;
grant execute on function public.current_partner_has_patient_link(uuid) to authenticated;

create table public.partner_client_goals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  target_weight_kg numeric(6, 2),
  target_body_fat_min_pct numeric(5, 2),
  target_body_fat_max_pct numeric(5, 2),
  adherence_target_pct smallint not null default 80,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_goals_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_goals_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_goals_partner_patient_key unique (partner_id, patient_id),
  constraint partner_client_goals_weight_check
    check (target_weight_kg is null or target_weight_kg > 0),
  constraint partner_client_goals_body_fat_min_check
    check (target_body_fat_min_pct is null or target_body_fat_min_pct between 0 and 100),
  constraint partner_client_goals_body_fat_max_check
    check (target_body_fat_max_pct is null or target_body_fat_max_pct between 0 and 100),
  constraint partner_client_goals_body_fat_range_check
    check (
      target_body_fat_min_pct is null
      or target_body_fat_max_pct is null
      or target_body_fat_max_pct >= target_body_fat_min_pct
    ),
  constraint partner_client_goals_adherence_check
    check (adherence_target_pct between 0 and 100)
);

create table public.partner_client_body_measurements (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  measured_at timestamptz not null,
  weight_kg numeric(6, 2),
  body_fat_percentage numeric(5, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_body_measurements_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_body_measurements_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_body_measurements_weight_check
    check (weight_kg is null or weight_kg > 0),
  constraint partner_client_body_measurements_body_fat_check
    check (body_fat_percentage is null or body_fat_percentage between 0 and 100),
  constraint partner_client_body_measurements_value_check
    check (weight_kg is not null or body_fat_percentage is not null),
  constraint partner_client_body_measurements_notes_not_blank
    check (notes is null or length(btrim(notes)) > 0)
);

create table public.partner_client_adherence_snapshots (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  period_start date not null,
  period_end date not null,
  diet_percentage smallint,
  training_percentage smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_adherence_snapshots_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_adherence_snapshots_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_adherence_snapshots_period_check
    check (period_end >= period_start),
  constraint partner_client_adherence_snapshots_diet_check
    check (diet_percentage is null or diet_percentage between 0 and 100),
  constraint partner_client_adherence_snapshots_training_check
    check (training_percentage is null or training_percentage between 0 and 100),
  constraint partner_client_adherence_snapshots_value_check
    check (diet_percentage is not null or training_percentage is not null),
  constraint partner_client_adherence_snapshots_period_key
    unique (partner_id, patient_id, period_start)
);

create table public.partner_client_appointments (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  title text not null default 'Consulta',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_appointments_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_appointments_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_appointments_title_not_blank
    check (length(btrim(title)) > 0),
  constraint partner_client_appointments_period_check
    check (ends_at > starts_at),
  constraint partner_client_appointments_status_check
    check (status in ('scheduled', 'completed', 'canceled', 'no_show')),
  constraint partner_client_appointments_notes_not_blank
    check (notes is null or length(btrim(notes)) > 0)
);

create table public.partner_client_observations (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  observation_type text not null,
  title text not null,
  value_text text,
  detail text,
  severity text not null default 'info',
  occurred_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_observations_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_observations_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_observations_type_check
    check (observation_type in ('blood_pressure', 'sleep', 'exam', 'note')),
  constraint partner_client_observations_title_not_blank
    check (length(btrim(title)) > 0),
  constraint partner_client_observations_value_not_blank
    check (value_text is null or length(btrim(value_text)) > 0),
  constraint partner_client_observations_detail_not_blank
    check (detail is null or length(btrim(detail)) > 0),
  constraint partner_client_observations_severity_check
    check (severity in ('normal', 'info', 'attention', 'critical')),
  constraint partner_client_observations_metadata_object
    check (jsonb_typeof(metadata) = 'object')
);

create table public.partner_client_tasks (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  title text not null,
  due_at timestamptz,
  priority text not null default 'medium',
  status text not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_tasks_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_tasks_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_tasks_title_not_blank
    check (length(btrim(title)) > 0),
  constraint partner_client_tasks_priority_check
    check (priority in ('low', 'medium', 'high')),
  constraint partner_client_tasks_status_check
    check (status in ('pending', 'completed', 'canceled')),
  constraint partner_client_tasks_completed_at_check
    check (
      (status = 'completed' and completed_at is not null)
      or (status <> 'completed' and completed_at is null)
    )
);

alter table public.partner_client_plan_subscriptions
add constraint partner_client_plan_subscriptions_partner_patient_id_key
unique (partner_id, patient_id, id);

create table public.partner_client_plan_modules (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  subscription_id uuid not null,
  module_type text not null,
  title text not null,
  primary_summary text not null,
  secondary_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_plan_modules_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_plan_modules_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_plan_modules_subscription_match_fkey
    foreign key (partner_id, patient_id, subscription_id)
    references public.partner_client_plan_subscriptions(partner_id, patient_id, id)
    on delete restrict,
  constraint partner_client_plan_modules_type_check
    check (module_type in ('dieta', 'treino', 'saude')),
  constraint partner_client_plan_modules_title_not_blank
    check (length(btrim(title)) > 0),
  constraint partner_client_plan_modules_primary_summary_not_blank
    check (length(btrim(primary_summary)) > 0),
  constraint partner_client_plan_modules_secondary_summary_not_blank
    check (secondary_summary is null or length(btrim(secondary_summary)) > 0),
  constraint partner_client_plan_modules_subscription_type_key
    unique (subscription_id, module_type)
);

create index partner_client_body_measurements_patient_date_idx
  on public.partner_client_body_measurements (partner_id, patient_id, measured_at desc);
create index partner_client_adherence_patient_period_idx
  on public.partner_client_adherence_snapshots (partner_id, patient_id, period_start desc);
create index partner_client_appointments_patient_start_idx
  on public.partner_client_appointments (partner_id, patient_id, starts_at);
create index partner_client_observations_patient_date_idx
  on public.partner_client_observations (partner_id, patient_id, occurred_at desc);
create index partner_client_tasks_patient_status_due_idx
  on public.partner_client_tasks (partner_id, patient_id, status, due_at);
create index partner_client_plan_modules_patient_idx
  on public.partner_client_plan_modules (partner_id, patient_id, subscription_id);

create trigger partner_client_goals_set_updated_at
before update on public.partner_client_goals
for each row execute function public.set_updated_at();
create trigger partner_client_body_measurements_set_updated_at
before update on public.partner_client_body_measurements
for each row execute function public.set_updated_at();
create trigger partner_client_adherence_snapshots_set_updated_at
before update on public.partner_client_adherence_snapshots
for each row execute function public.set_updated_at();
create trigger partner_client_appointments_set_updated_at
before update on public.partner_client_appointments
for each row execute function public.set_updated_at();
create trigger partner_client_observations_set_updated_at
before update on public.partner_client_observations
for each row execute function public.set_updated_at();
create trigger partner_client_tasks_set_updated_at
before update on public.partner_client_tasks
for each row execute function public.set_updated_at();
create trigger partner_client_plan_modules_set_updated_at
before update on public.partner_client_plan_modules
for each row execute function public.set_updated_at();

alter table public.partner_client_goals enable row level security;
alter table public.partner_client_body_measurements enable row level security;
alter table public.partner_client_adherence_snapshots enable row level security;
alter table public.partner_client_appointments enable row level security;
alter table public.partner_client_observations enable row level security;
alter table public.partner_client_tasks enable row level security;
alter table public.partner_client_plan_modules enable row level security;

revoke all on table public.partner_client_goals from public, anon, authenticated;
revoke all on table public.partner_client_body_measurements from public, anon, authenticated;
revoke all on table public.partner_client_adherence_snapshots from public, anon, authenticated;
revoke all on table public.partner_client_appointments from public, anon, authenticated;
revoke all on table public.partner_client_observations from public, anon, authenticated;
revoke all on table public.partner_client_tasks from public, anon, authenticated;
revoke all on table public.partner_client_plan_modules from public, anon, authenticated;

grant select, insert, update on table public.partner_client_goals to authenticated;
grant select, insert, update on table public.partner_client_body_measurements to authenticated;
grant select, insert, update on table public.partner_client_adherence_snapshots to authenticated;
grant select, insert, update on table public.partner_client_appointments to authenticated;
grant select, insert, update on table public.partner_client_observations to authenticated;
grant select, insert, update on table public.partner_client_tasks to authenticated;
grant select, insert, update on table public.partner_client_plan_modules to authenticated;

grant select, insert, update, delete on table public.partner_client_goals to service_role;
grant select, insert, update, delete on table public.partner_client_body_measurements to service_role;
grant select, insert, update, delete on table public.partner_client_adherence_snapshots to service_role;
grant select, insert, update, delete on table public.partner_client_appointments to service_role;
grant select, insert, update, delete on table public.partner_client_observations to service_role;
grant select, insert, update, delete on table public.partner_client_tasks to service_role;
grant select, insert, update, delete on table public.partner_client_plan_modules to service_role;

create policy partner_client_goals_select_linked
on public.partner_client_goals for select to authenticated
using (
  (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
  or patient_id = public.current_active_patient_id()
);
create policy partner_client_goals_insert_own_partner
on public.partner_client_goals for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_goals_update_own_partner
on public.partner_client_goals for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));

create policy partner_client_body_measurements_select_linked
on public.partner_client_body_measurements for select to authenticated
using (
  (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
  or patient_id = public.current_active_patient_id()
);
create policy partner_client_body_measurements_insert_own_partner
on public.partner_client_body_measurements for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_body_measurements_update_own_partner
on public.partner_client_body_measurements for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));

create policy partner_client_adherence_snapshots_select_linked
on public.partner_client_adherence_snapshots for select to authenticated
using (
  (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
  or patient_id = public.current_active_patient_id()
);
create policy partner_client_adherence_snapshots_insert_own_partner
on public.partner_client_adherence_snapshots for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_adherence_snapshots_update_own_partner
on public.partner_client_adherence_snapshots for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));

create policy partner_client_appointments_select_linked
on public.partner_client_appointments for select to authenticated
using (
  (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
  or patient_id = public.current_active_patient_id()
);
create policy partner_client_appointments_insert_own_partner
on public.partner_client_appointments for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_appointments_update_own_partner
on public.partner_client_appointments for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));

create policy partner_client_observations_select_linked
on public.partner_client_observations for select to authenticated
using (
  (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
  or patient_id = public.current_active_patient_id()
);
create policy partner_client_observations_insert_own_partner
on public.partner_client_observations for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_observations_update_own_partner
on public.partner_client_observations for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));

create policy partner_client_tasks_select_linked
on public.partner_client_tasks for select to authenticated
using (
  (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
  or patient_id = public.current_active_patient_id()
);
create policy partner_client_tasks_insert_own_partner
on public.partner_client_tasks for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_tasks_update_own_partner
on public.partner_client_tasks for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));

create policy partner_client_plan_modules_select_linked
on public.partner_client_plan_modules for select to authenticated
using (
  (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
  or patient_id = public.current_active_patient_id()
);
create policy partner_client_plan_modules_insert_own_partner
on public.partner_client_plan_modules for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_plan_modules_update_own_partner
on public.partner_client_plan_modules for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));

create or replace function public.partner_client_overview(p_patient_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_partner_id uuid := public.current_active_partner_id();
  result jsonb;
begin
  if current_partner_id is null or not public.current_partner_has_patient_link(p_patient_id) then
    return null;
  end if;

  select jsonb_build_object(
    'identity', jsonb_build_object(
      'patientId', patient.id,
      'profileId', profile.id,
      'displayName', profile.display_name,
      'email', profile.email,
      'phone', coalesce(profile.phone, patient.phone),
      'birthDate', patient.birth_date,
      'gender', patient.gender,
      'avatarUrl', patient.avatar_url,
      'objective', patient.objective,
      'status', relationship_summary.status,
      'startedAt', relationship_summary.started_at,
      'serviceScopes', relationship_summary.service_scopes
    ),
    'subscription', (
      select jsonb_build_object(
        'id', subscription.id,
        'status', subscription.status,
        'currentPeriodStart', subscription.current_period_start,
        'currentPeriodEnd', subscription.current_period_end,
        'cancelAtPeriodEnd', subscription.cancel_at_period_end,
        'planId', plan.id,
        'planName', plan.name,
        'planDescription', plan.description
      )
      from public.partner_client_plan_subscriptions as subscription
      join public.partner_custom_plans as plan on plan.id = subscription.custom_plan_id
      where subscription.partner_id = current_partner_id
        and subscription.patient_id = p_patient_id
        and subscription.status in ('active', 'past_due', 'pending')
      order by
        case subscription.status when 'active' then 0 when 'past_due' then 1 else 2 end,
        subscription.current_period_end desc
      limit 1
    ),
    'goals', (
      select jsonb_build_object(
        'targetWeightKg', goals.target_weight_kg,
        'targetBodyFatMinPct', goals.target_body_fat_min_pct,
        'targetBodyFatMaxPct', goals.target_body_fat_max_pct,
        'adherenceTargetPct', goals.adherence_target_pct
      )
      from public.partner_client_goals as goals
      where goals.partner_id = current_partner_id
        and goals.patient_id = p_patient_id
    ),
    'measurements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', measurement.id,
        'measuredAt', measurement.measured_at,
        'weightKg', measurement.weight_kg,
        'bodyFatPercentage', measurement.body_fat_percentage,
        'notes', measurement.notes
      ) order by measurement.measured_at asc)
      from public.partner_client_body_measurements as measurement
      where measurement.partner_id = current_partner_id
        and measurement.patient_id = p_patient_id
    ), '[]'::jsonb),
    'adherence', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', snapshot.id,
        'periodStart', snapshot.period_start,
        'periodEnd', snapshot.period_end,
        'dietPercentage', snapshot.diet_percentage,
        'trainingPercentage', snapshot.training_percentage
      ) order by snapshot.period_start asc)
      from public.partner_client_adherence_snapshots as snapshot
      where snapshot.partner_id = current_partner_id
        and snapshot.patient_id = p_patient_id
    ), '[]'::jsonb),
    'appointments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', appointment.id,
        'title', appointment.title,
        'startsAt', appointment.starts_at,
        'endsAt', appointment.ends_at,
        'status', appointment.status,
        'notes', appointment.notes
      ) order by appointment.starts_at desc)
      from public.partner_client_appointments as appointment
      where appointment.partner_id = current_partner_id
        and appointment.patient_id = p_patient_id
    ), '[]'::jsonb),
    'observations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', observation.id,
        'type', observation.observation_type,
        'title', observation.title,
        'value', observation.value_text,
        'detail', observation.detail,
        'severity', observation.severity,
        'occurredAt', observation.occurred_at
      ) order by observation.occurred_at desc)
      from public.partner_client_observations as observation
      where observation.partner_id = current_partner_id
        and observation.patient_id = p_patient_id
    ), '[]'::jsonb),
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', task.id,
        'title', task.title,
        'dueAt', task.due_at,
        'priority', task.priority,
        'status', task.status,
        'completedAt', task.completed_at,
        'createdAt', task.created_at
      ) order by
        case task.status when 'pending' then 0 when 'completed' then 1 else 2 end,
        task.due_at asc nulls last,
        task.created_at desc)
      from public.partner_client_tasks as task
      where task.partner_id = current_partner_id
        and task.patient_id = p_patient_id
        and task.status <> 'canceled'
    ), '[]'::jsonb),
    'planModules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', module.id,
        'type', module.module_type,
        'title', module.title,
        'primarySummary', module.primary_summary,
        'secondarySummary', module.secondary_summary
      ) order by
        case module.module_type when 'dieta' then 0 when 'treino' then 1 else 2 end)
      from public.partner_client_plan_modules as module
      where module.partner_id = current_partner_id
        and module.patient_id = p_patient_id
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', event.id,
        'type', event.event_type,
        'title', event.title,
        'detail', event.detail,
        'createdAt', event.created_at
      ) order by event.created_at desc)
      from public.platform_activity_events as event
      where event.partner_id = current_partner_id
        and event.patient_id = p_patient_id
    ), '[]'::jsonb)
  )
  into result
  from public.patients as patient
  join public.profiles as profile on profile.id = patient.profile_id
  cross join lateral (
    select
      case
        when bool_or(relationship.status = 'active') then 'active'
        when bool_or(relationship.status = 'pending') then 'pending'
        when bool_or(relationship.status = 'suspended') then 'suspended'
        else 'inactive'
      end as status,
      min(relationship.started_at) as started_at,
      array_agg(
        distinct case when relationship.service_scope = 'cardio' then 'treino' else relationship.service_scope end
        order by case when relationship.service_scope = 'cardio' then 'treino' else relationship.service_scope end
      ) as service_scopes
    from public.partner_clients as relationship
    where relationship.partner_id = current_partner_id
      and relationship.patient_id = p_patient_id
  ) as relationship_summary
  where patient.id = p_patient_id
    and profile.role = 'cliente';

  return result;
end;
$$;

comment on function public.partner_client_overview(uuid)
is 'Retorna a Visao Geral do Cliente para o Parceiro vinculado, sem CPF, user_id ou dados de outros Parceiros.';

revoke all on function public.partner_client_overview(uuid) from public;
grant execute on function public.partner_client_overview(uuid) to authenticated;

