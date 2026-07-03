create table public.partner_client_cardio_plans (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null default 'Plano de Cardio',
  status text not null default 'draft',
  weekly_target_minutes integer not null default 180,
  weight_kg numeric(6,2) not null,
  primary_activity_key text not null default 'caminhada_leve',
  comparison_activity_key text not null default 'corrida_moderada',
  target_zone text not null default 'z2',
  notes text,
  version integer not null default 1,
  published_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_client_cardio_plans_status_check check (status in ('draft', 'published', 'sent', 'archived')),
  constraint partner_client_cardio_plans_weekly_target_check check (weekly_target_minutes between 0 and 3000),
  constraint partner_client_cardio_plans_weight_check check (weight_kg between 20 and 350),
  constraint partner_client_cardio_plans_primary_activity_check
    check (primary_activity_key in ('caminhada_leve', 'caminhada_moderada', 'bicicleta_leve', 'eliptico', 'corrida_moderada', 'corrida_forte')),
  constraint partner_client_cardio_plans_comparison_activity_check
    check (comparison_activity_key in ('caminhada_leve', 'caminhada_moderada', 'bicicleta_leve', 'eliptico', 'corrida_moderada', 'corrida_forte')),
  constraint partner_client_cardio_plans_target_zone_check check (target_zone in ('z1', 'z2', 'z3', 'z4', 'z5')),
  constraint partner_client_cardio_plans_title_check check (length(btrim(title)) between 2 and 140),
  constraint partner_client_cardio_plans_version_check check (version > 0),
  constraint partner_client_cardio_plans_id_partner_patient_key unique (id, partner_id, patient_id)
);

create index partner_client_cardio_plans_client_updated_idx
  on public.partner_client_cardio_plans (partner_id, patient_id, updated_at desc)
  where status <> 'archived';

create table public.partner_client_cardio_calculations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null,
  partner_id uuid not null,
  patient_id uuid not null,
  weight_kg numeric(6,2) not null,
  duration_minutes integer not null,
  activity_key text not null,
  comparison_activity_key text not null,
  met numeric(5,2) not null,
  comparison_met numeric(5,2) not null,
  kcal_estimate numeric(10,2) not null,
  comparison_kcal_estimate numeric(10,2) not null,
  kcal_per_min numeric(10,2) not null,
  comparison_kcal_per_min numeric(10,2) not null,
  target_zone text not null,
  parameters jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint partner_client_cardio_calculations_plan_fkey
    foreign key (plan_id, partner_id, patient_id)
    references public.partner_client_cardio_plans(id, partner_id, patient_id) on delete cascade,
  constraint partner_client_cardio_calculations_weight_check check (weight_kg between 20 and 350),
  constraint partner_client_cardio_calculations_duration_check check (duration_minutes between 1 and 600),
  constraint partner_client_cardio_calculations_activity_check
    check (activity_key in ('caminhada_leve', 'caminhada_moderada', 'bicicleta_leve', 'eliptico', 'corrida_moderada', 'corrida_forte')),
  constraint partner_client_cardio_calculations_comparison_activity_check
    check (comparison_activity_key in ('caminhada_leve', 'caminhada_moderada', 'bicicleta_leve', 'eliptico', 'corrida_moderada', 'corrida_forte')),
  constraint partner_client_cardio_calculations_met_check check (met > 0 and comparison_met > 0),
  constraint partner_client_cardio_calculations_kcal_check check (kcal_estimate >= 0 and comparison_kcal_estimate >= 0),
  constraint partner_client_cardio_calculations_kcal_min_check check (kcal_per_min >= 0 and comparison_kcal_per_min >= 0),
  constraint partner_client_cardio_calculations_target_zone_check check (target_zone in ('z1', 'z2', 'z3', 'z4', 'z5')),
  constraint partner_client_cardio_calculations_parameters_check check (jsonb_typeof(parameters) = 'object')
);

create index partner_client_cardio_calculations_client_created_idx
  on public.partner_client_cardio_calculations (partner_id, patient_id, plan_id, created_at desc);

create table public.partner_client_cardio_sessions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null,
  partner_id uuid not null,
  patient_id uuid not null,
  performed_at timestamptz not null,
  duration_minutes integer not null,
  activity_key text not null,
  met numeric(5,2) not null,
  kcal_estimate numeric(10,2) not null,
  target_zone text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_client_cardio_sessions_plan_fkey
    foreign key (plan_id, partner_id, patient_id)
    references public.partner_client_cardio_plans(id, partner_id, patient_id) on delete cascade,
  constraint partner_client_cardio_sessions_duration_check check (duration_minutes between 1 and 600),
  constraint partner_client_cardio_sessions_activity_check
    check (activity_key in ('caminhada_leve', 'caminhada_moderada', 'bicicleta_leve', 'eliptico', 'corrida_moderada', 'corrida_forte')),
  constraint partner_client_cardio_sessions_met_check check (met > 0),
  constraint partner_client_cardio_sessions_kcal_check check (kcal_estimate >= 0),
  constraint partner_client_cardio_sessions_target_zone_check check (target_zone in ('z1', 'z2', 'z3', 'z4', 'z5'))
);

create index partner_client_cardio_sessions_client_performed_idx
  on public.partner_client_cardio_sessions (partner_id, patient_id, plan_id, performed_at desc);

create table public.partner_client_cardio_events (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null,
  partner_id uuid not null,
  patient_id uuid not null,
  actor_name text,
  event_type text not null,
  detail text not null,
  version integer not null default 1,
  details jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint partner_client_cardio_events_plan_fkey
    foreign key (plan_id, partner_id, patient_id)
    references public.partner_client_cardio_plans(id, partner_id, patient_id) on delete cascade,
  constraint partner_client_cardio_events_type_check
    check (event_type in ('created', 'updated', 'calculation_saved', 'calculation_applied', 'session_logged', 'session_removed', 'published', 'sent')),
  constraint partner_client_cardio_events_detail_check check (length(btrim(detail)) > 0),
  constraint partner_client_cardio_events_details_check check (jsonb_typeof(details) = 'object')
);

create index partner_client_cardio_events_client_created_idx
  on public.partner_client_cardio_events (partner_id, patient_id, plan_id, created_at desc);

create trigger partner_client_cardio_plans_set_updated_at
before update on public.partner_client_cardio_plans
for each row execute function public.set_updated_at();

create trigger partner_client_cardio_sessions_set_updated_at
before update on public.partner_client_cardio_sessions
for each row execute function public.set_updated_at();

alter table public.partner_client_cardio_plans enable row level security;
alter table public.partner_client_cardio_calculations enable row level security;
alter table public.partner_client_cardio_sessions enable row level security;
alter table public.partner_client_cardio_events enable row level security;

revoke all on table public.partner_client_cardio_plans, public.partner_client_cardio_calculations,
  public.partner_client_cardio_sessions, public.partner_client_cardio_events
  from public, anon, authenticated;
grant select, insert, update on table public.partner_client_cardio_plans to authenticated;
grant select, insert on table public.partner_client_cardio_calculations to authenticated;
grant select, insert, update, delete on table public.partner_client_cardio_sessions to authenticated;
grant select, insert on table public.partner_client_cardio_events to authenticated;
grant all on table public.partner_client_cardio_plans, public.partner_client_cardio_calculations,
  public.partner_client_cardio_sessions, public.partner_client_cardio_events
  to service_role;

create policy partner_client_cardio_plans_own_partner
on public.partner_client_cardio_plans for all to authenticated
using (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
)
with check (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
);

create policy partner_client_cardio_calculations_select_insert_own_partner
on public.partner_client_cardio_calculations for all to authenticated
using (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
)
with check (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
);

create policy partner_client_cardio_sessions_own_partner
on public.partner_client_cardio_sessions for all to authenticated
using (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
)
with check (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
);

create policy partner_client_cardio_events_select_own_partner
on public.partner_client_cardio_events for select to authenticated
using (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
);

create policy partner_client_cardio_events_insert_own_partner
on public.partner_client_cardio_events for insert to authenticated
with check (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
);

create or replace function public.partner_client_cardio(p_patient_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_partner_id uuid := public.current_active_partner_id();
  selected_plan_id uuid;
  patient_birth_date date;
begin
  if current_partner_id is null or not public.current_partner_has_active_patient_link(p_patient_id) then
    return null;
  end if;

  select p.birth_date into patient_birth_date
  from public.patients p
  where p.id = p_patient_id;

  select plan.id into selected_plan_id
  from public.partner_client_cardio_plans plan
  where plan.partner_id = current_partner_id
    and plan.patient_id = p_patient_id
    and plan.status <> 'archived'
  order by
    case plan.status when 'sent' then 0 when 'published' then 1 when 'draft' then 2 else 3 end,
    plan.updated_at desc
  limit 1;

  return jsonb_build_object(
    'generatedAt', now(),
    'patient', jsonb_build_object('birthDate', patient_birth_date),
    'heartRateZones', (
      with heart_rate as (
        select 220 - coalesce(extract(year from age(current_date, patient_birth_date))::integer, 40) as max_hr
      ),
      zones(key, label, percent_label, start_factor, end_factor, description, objective) as (
        values
          ('z1', 'Z1', '50-60%', 0.5::numeric, 0.6::numeric, 'Recuperação ativa', 'Recuperação'),
          ('z2', 'Z2', '60-70%', 0.6::numeric, 0.7::numeric, 'Queima de gordura', 'Resistência básica'),
          ('z3', 'Z3', '70-80%', 0.7::numeric, 0.8::numeric, 'Condicionamento', 'Resistência aeróbica'),
          ('z4', 'Z4', '80-90%', 0.8::numeric, 0.9::numeric, 'Limiar anaeróbio', 'Performance'),
          ('z5', 'Z5', '90-100%', 0.9::numeric, 1.0::numeric, 'Máximo', 'Potência máxima')
      )
      select jsonb_agg(jsonb_build_object(
        'key', zones.key,
        'label', zones.label,
        'percentLabel', zones.percent_label,
        'bpmStart', round(heart_rate.max_hr * zones.start_factor),
        'bpmEnd', round(heart_rate.max_hr * zones.end_factor),
        'description', zones.description,
        'objective', zones.objective
      ) order by zones.key)
      from zones, heart_rate
    ),
    'weekSummary', jsonb_build_object(
      'targetMinutes', coalesce((
        select plan.weekly_target_minutes
        from public.partner_client_cardio_plans plan
        where plan.id = selected_plan_id and plan.partner_id = current_partner_id
      ), 0),
      'completedMinutes', coalesce((
        select sum(session.duration_minutes)::integer
        from public.partner_client_cardio_sessions session
        where session.partner_id = current_partner_id
          and session.patient_id = p_patient_id
          and (selected_plan_id is null or session.plan_id = selected_plan_id)
          and session.performed_at >= date_trunc('week', now())
          and session.performed_at < date_trunc('week', now()) + interval '7 days'
      ), 0),
      'estimatedKcal', coalesce((
        select round(sum(session.kcal_estimate))::integer
        from public.partner_client_cardio_sessions session
        where session.partner_id = current_partner_id
          and session.patient_id = p_patient_id
          and (selected_plan_id is null or session.plan_id = selected_plan_id)
          and session.performed_at >= date_trunc('week', now())
          and session.performed_at < date_trunc('week', now()) + interval '7 days'
      ), 0)
    ),
    'plan', (
      select jsonb_build_object(
        'id', plan.id,
        'title', plan.title,
        'status', plan.status,
        'weeklyTargetMinutes', plan.weekly_target_minutes,
        'weightKg', plan.weight_kg,
        'activityKey', plan.primary_activity_key,
        'comparisonActivityKey', plan.comparison_activity_key,
        'targetZone', plan.target_zone,
        'notes', plan.notes,
        'version', plan.version,
        'publishedAt', plan.published_at,
        'sentAt', plan.sent_at,
        'createdAt', plan.created_at,
        'updatedAt', plan.updated_at
      )
      from public.partner_client_cardio_plans plan
      where plan.id = selected_plan_id and plan.partner_id = current_partner_id
    ),
    'calculations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', calculation.id,
        'weightKg', calculation.weight_kg,
        'durationMinutes', calculation.duration_minutes,
        'activityKey', calculation.activity_key,
        'comparisonActivityKey', calculation.comparison_activity_key,
        'met', calculation.met,
        'comparisonMet', calculation.comparison_met,
        'kcalEstimate', calculation.kcal_estimate,
        'comparisonKcalEstimate', calculation.comparison_kcal_estimate,
        'kcalPerMin', calculation.kcal_per_min,
        'comparisonKcalPerMin', calculation.comparison_kcal_per_min,
        'targetZone', calculation.target_zone,
        'parameters', calculation.parameters,
        'createdAt', calculation.created_at
      ) order by calculation.created_at desc)
      from public.partner_client_cardio_calculations calculation
      where calculation.partner_id = current_partner_id
        and calculation.patient_id = p_patient_id
        and (selected_plan_id is null or calculation.plan_id = selected_plan_id)
    ), '[]'::jsonb),
    'sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', session.id,
        'performedAt', session.performed_at,
        'durationMinutes', session.duration_minutes,
        'activityKey', session.activity_key,
        'met', session.met,
        'kcalEstimate', session.kcal_estimate,
        'targetZone', session.target_zone,
        'notes', session.notes,
        'createdAt', session.created_at
      ) order by session.performed_at desc)
      from public.partner_client_cardio_sessions session
      where session.partner_id = current_partner_id
        and session.patient_id = p_patient_id
        and (selected_plan_id is null or session.plan_id = selected_plan_id)
        and session.performed_at >= now() - interval '90 days'
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', event.id,
        'actorName', event.actor_name,
        'eventType', event.event_type,
        'detail', event.detail,
        'version', event.version,
        'createdAt', event.created_at
      ) order by event.created_at desc)
      from public.partner_client_cardio_events event
      where event.partner_id = current_partner_id
        and event.patient_id = p_patient_id
        and (selected_plan_id is null or event.plan_id = selected_plan_id)
    ), '[]'::jsonb)
  );
end;
$$;

comment on function public.partner_client_cardio(uuid)
  is 'Returns cardio plan, calculations, sessions and history for one linked Client.';
revoke all on function public.partner_client_cardio(uuid) from public;
grant execute on function public.partner_client_cardio(uuid) to authenticated;
