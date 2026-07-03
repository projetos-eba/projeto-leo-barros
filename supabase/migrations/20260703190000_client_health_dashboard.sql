-- Painel de Saude do Cliente.
-- Dados clinicos prescritos continuam no lado Parceiro; estas tabelas registram execucao e sinais do Cliente.

create table public.client_health_daily_logs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete cascade,
  log_date date not null default current_date,
  sleep_minutes integer,
  sleep_deep_minutes integer,
  sleep_latency_minutes integer,
  sleep_efficiency_pct smallint,
  hydration_ml integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint client_health_daily_logs_sleep_check check (sleep_minutes is null or sleep_minutes between 0 and 1440),
  constraint client_health_daily_logs_deep_check check (sleep_deep_minutes is null or sleep_deep_minutes between 0 and 1440),
  constraint client_health_daily_logs_latency_check check (sleep_latency_minutes is null or sleep_latency_minutes between 0 and 300),
  constraint client_health_daily_logs_efficiency_check check (sleep_efficiency_pct is null or sleep_efficiency_pct between 0 and 100),
  constraint client_health_daily_logs_hydration_check check (hydration_ml between 0 and 12000),
  constraint client_health_daily_logs_unique unique (patient_id, log_date)
);

create table public.client_health_medications (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  dosage text not null,
  schedule_time time not null,
  status text not null default 'active',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint client_health_medications_name_check check (length(btrim(name)) between 2 and 120),
  constraint client_health_medications_dosage_check check (length(btrim(dosage)) between 1 and 160),
  constraint client_health_medications_status_check check (status in ('active', 'archived'))
);

create table public.client_health_medication_logs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  medication_id uuid not null,
  log_date date not null default current_date,
  status text not null default 'pending',
  taken_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint client_health_medication_logs_medication_fkey
    foreign key (medication_id)
    references public.client_health_medications(id)
    on delete cascade,
  constraint client_health_medication_logs_status_check check (status in ('pending', 'completed')),
  constraint client_health_medication_logs_completed_check check ((status = 'completed' and taken_at is not null) or status <> 'completed'),
  constraint client_health_medication_logs_unique unique (patient_id, medication_id, log_date)
);

create table public.client_health_pressure_logs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete cascade,
  measured_at timestamptz not null default now(),
  systolic integer not null,
  diastolic integer not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint client_health_pressure_logs_systolic_check check (systolic between 60 and 260),
  constraint client_health_pressure_logs_diastolic_check check (diastolic between 30 and 180),
  constraint client_health_pressure_logs_notes_check check (notes is null or length(btrim(notes)) between 1 and 500)
);

create table public.client_health_action_logs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete cascade,
  log_date date not null default current_date,
  action_key text not null,
  status text not null default 'completed',
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint client_health_action_logs_key_check check (action_key in ('pressure', 'exam_review', 'hydration', 'relaxation')),
  constraint client_health_action_logs_status_check check (status in ('completed')),
  constraint client_health_action_logs_unique unique (patient_id, log_date, action_key)
);

create table public.client_health_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete cascade,
  event_type text not null,
  detail text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint client_health_events_type_check check (event_type in ('medication_marked', 'medication_unmarked', 'action_completed')),
  constraint client_health_events_detail_check check (length(btrim(detail)) > 0),
  constraint client_health_events_details_object_check check (jsonb_typeof(details) = 'object')
);

create index client_health_daily_logs_patient_date_idx on public.client_health_daily_logs (patient_id, log_date desc);
create index client_health_medications_patient_status_idx on public.client_health_medications (patient_id, status, sort_order);
create index client_health_medication_logs_patient_date_idx on public.client_health_medication_logs (patient_id, log_date desc);
create index client_health_pressure_logs_patient_date_idx on public.client_health_pressure_logs (patient_id, measured_at desc);
create index client_health_action_logs_patient_date_idx on public.client_health_action_logs (patient_id, log_date desc);
create index client_health_events_patient_date_idx on public.client_health_events (patient_id, created_at desc);

create trigger client_health_daily_logs_set_updated_at before update on public.client_health_daily_logs for each row execute function public.set_updated_at();
create trigger client_health_medications_set_updated_at before update on public.client_health_medications for each row execute function public.set_updated_at();
create trigger client_health_medication_logs_set_updated_at before update on public.client_health_medication_logs for each row execute function public.set_updated_at();
create trigger client_health_pressure_logs_set_updated_at before update on public.client_health_pressure_logs for each row execute function public.set_updated_at();
create trigger client_health_action_logs_set_updated_at before update on public.client_health_action_logs for each row execute function public.set_updated_at();

alter table public.client_health_daily_logs enable row level security;
alter table public.client_health_medications enable row level security;
alter table public.client_health_medication_logs enable row level security;
alter table public.client_health_pressure_logs enable row level security;
alter table public.client_health_action_logs enable row level security;
alter table public.client_health_events enable row level security;

revoke all on table public.client_health_daily_logs, public.client_health_medications,
  public.client_health_medication_logs, public.client_health_pressure_logs,
  public.client_health_action_logs, public.client_health_events
from public, anon, authenticated;

grant select, insert, update on table public.client_health_daily_logs, public.client_health_medications,
  public.client_health_medication_logs, public.client_health_pressure_logs, public.client_health_action_logs
to authenticated;
grant select, insert on table public.client_health_events to authenticated;

grant select, insert, update, delete on table public.client_health_daily_logs, public.client_health_medications,
  public.client_health_medication_logs, public.client_health_pressure_logs,
  public.client_health_action_logs, public.client_health_events
to service_role;

create policy client_health_daily_logs_select_linked on public.client_health_daily_logs for select to authenticated
using (patient_id = public.current_active_patient_id() or public.current_partner_has_active_patient_link(patient_id));
create policy client_health_daily_logs_insert_own_client on public.client_health_daily_logs for insert to authenticated
with check (patient_id = public.current_active_patient_id());
create policy client_health_daily_logs_update_own_client on public.client_health_daily_logs for update to authenticated
using (patient_id = public.current_active_patient_id()) with check (patient_id = public.current_active_patient_id());

create policy client_health_medications_select_linked on public.client_health_medications for select to authenticated
using (patient_id = public.current_active_patient_id() or public.current_partner_has_active_patient_link(patient_id));
create policy client_health_medications_insert_linked_partner on public.client_health_medications for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy client_health_medications_update_linked_partner on public.client_health_medications for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));

create policy client_health_medication_logs_select_linked on public.client_health_medication_logs for select to authenticated
using (patient_id = public.current_active_patient_id() or public.current_partner_has_active_patient_link(patient_id));
create policy client_health_medication_logs_insert_own_client on public.client_health_medication_logs for insert to authenticated
with check (patient_id = public.current_active_patient_id());
create policy client_health_medication_logs_update_own_client on public.client_health_medication_logs for update to authenticated
using (patient_id = public.current_active_patient_id()) with check (patient_id = public.current_active_patient_id());

create policy client_health_pressure_logs_select_linked on public.client_health_pressure_logs for select to authenticated
using (patient_id = public.current_active_patient_id() or public.current_partner_has_active_patient_link(patient_id));
create policy client_health_pressure_logs_insert_own_client on public.client_health_pressure_logs for insert to authenticated
with check (patient_id = public.current_active_patient_id());
create policy client_health_pressure_logs_update_own_client on public.client_health_pressure_logs for update to authenticated
using (patient_id = public.current_active_patient_id()) with check (patient_id = public.current_active_patient_id());

create policy client_health_action_logs_select_linked on public.client_health_action_logs for select to authenticated
using (patient_id = public.current_active_patient_id() or public.current_partner_has_active_patient_link(patient_id));
create policy client_health_action_logs_insert_own_client on public.client_health_action_logs for insert to authenticated
with check (patient_id = public.current_active_patient_id());
create policy client_health_action_logs_update_own_client on public.client_health_action_logs for update to authenticated
using (patient_id = public.current_active_patient_id()) with check (patient_id = public.current_active_patient_id());

create policy client_health_events_select_linked on public.client_health_events for select to authenticated
using (patient_id = public.current_active_patient_id() or public.current_partner_has_active_patient_link(patient_id));
create policy client_health_events_insert_own_client on public.client_health_events for insert to authenticated
with check (patient_id = public.current_active_patient_id());

create or replace function public.current_client_health_partner_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select relationship.partner_id
  from public.partner_clients as relationship
  where relationship.patient_id = public.current_active_patient_id()
    and relationship.status = 'active'
  order by case relationship.service_scope when 'saude' then 0 when 'dieta' then 1 when 'treino' then 2 else 3 end,
    relationship.started_at desc
  limit 1;
$$;

revoke all on function public.current_client_health_partner_id() from public;
grant execute on function public.current_client_health_partner_id() to authenticated;

create or replace function public.client_health_dashboard(p_date date default current_date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  current_partner_id uuid := public.current_client_health_partner_id();
  result jsonb;
begin
  if current_patient_id is null or current_partner_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'client', (
      select jsonb_build_object('id', patient.id, 'name', profile.display_name, 'avatarUrl', patient.avatar_url, 'objective', patient.objective)
      from public.patients patient
      join public.profiles profile on profile.id = patient.profile_id
      where patient.id = current_patient_id
    ),
    'selectedDate', p_date,
    'dailyLog', (
      select jsonb_build_object(
        'sleepMinutes', log.sleep_minutes,
        'sleepDeepMinutes', log.sleep_deep_minutes,
        'sleepLatencyMinutes', log.sleep_latency_minutes,
        'sleepEfficiencyPct', log.sleep_efficiency_pct,
        'hydrationMl', log.hydration_ml
      )
      from public.client_health_daily_logs log
      where log.patient_id = current_patient_id and log.log_date = p_date
      limit 1
    ),
    'actions', (
      with action_seed(key, title, detail, time_label) as (
        values
          ('vitamin_d', 'Tomar Vitamina D', 'Dose única', '08:00'),
          ('omega_3', 'Tomar Ômega 3 à noite', '1 cápsula', '20:30'),
          ('pressure', 'Registrar pressão', null, '12:30'),
          ('exam_review', 'Revisar exame de Vitamina D', null, null),
          ('hydration', 'Manter hidratação', 'Meta: 2L de água', '21:00')
      )
      select coalesce(jsonb_agg(jsonb_build_object(
        'key', seed.key,
        'title', seed.title,
        'detail', seed.detail,
        'time', seed.time_label,
        'status', case
          when seed.key = 'vitamin_d' and exists (
            select 1 from public.client_health_medications medication
            join public.client_health_medication_logs med_log on med_log.medication_id = medication.id
            where medication.patient_id = current_patient_id and medication.name ilike '%vitamina d%'
              and med_log.log_date = p_date and med_log.status = 'completed'
          ) then 'completed'
          when seed.key = 'omega_3' and exists (
            select 1 from public.client_health_medications medication
            join public.client_health_medication_logs med_log on med_log.medication_id = medication.id
            where medication.patient_id = current_patient_id and medication.name ilike '%omega%'
              and med_log.log_date = p_date and med_log.status = 'completed'
          ) then 'completed'
          when seed.key = 'hydration' and exists (
            select 1 from public.client_health_daily_logs log
            where log.patient_id = current_patient_id and log.log_date = p_date and log.hydration_ml >= 2000
          ) then 'completed'
          when exists (
            select 1 from public.client_health_action_logs action_log
            where action_log.patient_id = current_patient_id and action_log.log_date = p_date
              and action_log.action_key = seed.key and action_log.status = 'completed'
          ) then 'completed'
          else 'pending'
        end,
        'completedAt', (
          select coalesce(max(med_log.taken_at), max(action_log.completed_at))
          from public.client_health_action_logs action_log
          full join public.client_health_medication_logs med_log on false
          where action_log.patient_id = current_patient_id and action_log.log_date = p_date and action_log.action_key = seed.key
        )
      ) order by case seed.key when 'vitamin_d' then 1 when 'omega_3' then 2 when 'pressure' then 3 when 'exam_review' then 4 else 5 end), '[]'::jsonb)
      from action_seed seed
    ),
    'medications', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', medication.id,
        'name', medication.name,
        'dosage', medication.dosage,
        'scheduleTime', to_char(medication.schedule_time, 'HH24:MI'),
        'logStatus', med_log.status,
        'takenAt', med_log.taken_at
      ) order by medication.sort_order, medication.schedule_time)
      from public.client_health_medications medication
      left join public.client_health_medication_logs med_log
        on med_log.medication_id = medication.id
       and med_log.patient_id = medication.patient_id
       and med_log.log_date = p_date
      where medication.patient_id = current_patient_id and medication.status = 'active'
    ), '[]'::jsonb),
    'pressureLogs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'systolic', pressure.systolic,
        'diastolic', pressure.diastolic,
        'measuredAt', pressure.measured_at
      ) order by pressure.measured_at desc)
      from public.client_health_pressure_logs pressure
      where pressure.patient_id = current_patient_id
        and pressure.measured_at::date between p_date - 7 and p_date
    ), '[]'::jsonb),
    'appointments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', appointment.id,
        'title', appointment.title,
        'startsAt', appointment.starts_at,
        'status', appointment.status
      ) order by appointment.starts_at)
      from public.partner_client_appointments appointment
      where appointment.partner_id = current_partner_id
        and appointment.patient_id = current_patient_id
        and appointment.status = 'scheduled'
        and appointment.starts_at >= now()
      limit 3
    ), '[]'::jsonb),
    'examResults', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', result.snapshot_exam_name,
        'value', result.input_value,
        'unit', result.input_unit,
        'status', result.status,
        'collectedAt', collection.collected_at
      ) order by collection.collected_at desc, case result.status when 'low' then 0 when 'high' then 1 when 'normal' then 2 else 3 end)
      from public.partner_client_exam_results result
      join public.partner_client_exam_collections collection
        on collection.id = result.collection_id
       and collection.partner_id = result.partner_id
       and collection.patient_id = result.patient_id
      where result.partner_id = current_partner_id
        and result.patient_id = current_patient_id
        and collection.status = 'saved'
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
      from public.partner_client_observations observation
      where observation.partner_id = current_partner_id
        and observation.patient_id = current_patient_id
    ), '[]'::jsonb),
    'generatedAt', now()
  ) into result;

  return result;
end;
$$;

create or replace function public.client_health_mark_medication(p_medication_id uuid, p_log_date date default current_date, p_taken boolean default true)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  selected_medication public.client_health_medications%rowtype;
begin
  if current_patient_id is null then
    raise exception 'Cliente nao autenticado.';
  end if;

  select * into selected_medication
  from public.client_health_medications
  where id = p_medication_id
    and patient_id = current_patient_id
    and status = 'active';

  if selected_medication.id is null then
    raise exception 'Medicacao nao encontrada.';
  end if;

  insert into public.client_health_medication_logs (partner_id, patient_id, medication_id, log_date, status, taken_at)
  values (selected_medication.partner_id, current_patient_id, selected_medication.id, p_log_date, case when p_taken then 'completed' else 'pending' end, case when p_taken then now() else null end)
  on conflict (patient_id, medication_id, log_date)
  do update set status = excluded.status, taken_at = excluded.taken_at, updated_at = now();

  insert into public.client_health_events (partner_id, patient_id, event_type, detail, details)
  values (
    selected_medication.partner_id,
    current_patient_id,
    case when p_taken then 'medication_marked' else 'medication_unmarked' end,
    case when p_taken then 'Medicacao marcada como tomada.' else 'Medicacao desmarcada.' end,
    jsonb_build_object('medicationId', selected_medication.id)
  );

  return public.client_health_dashboard(p_log_date);
end;
$$;

create or replace function public.client_health_complete_action(p_action_key text, p_log_date date default current_date)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  current_patient_id uuid := public.current_active_patient_id();
  current_partner_id uuid := public.current_client_health_partner_id();
begin
  if current_patient_id is null or current_partner_id is null then
    raise exception 'Cliente nao autenticado.';
  end if;

  if p_action_key not in ('pressure', 'exam_review', 'hydration', 'relaxation') then
    raise exception 'Acao de saude invalida.';
  end if;

  insert into public.client_health_action_logs (partner_id, patient_id, log_date, action_key, status, completed_at)
  values (current_partner_id, current_patient_id, p_log_date, p_action_key, 'completed', now())
  on conflict (patient_id, log_date, action_key)
  do update set completed_at = now(), updated_at = now();

  insert into public.client_health_events (partner_id, patient_id, event_type, detail, details)
  values (current_partner_id, current_patient_id, 'action_completed', 'Acao de saude concluida pelo Cliente.', jsonb_build_object('actionKey', p_action_key));

  return public.client_health_dashboard(p_log_date);
end;
$$;

revoke all on function public.client_health_dashboard(date) from public;
revoke all on function public.client_health_mark_medication(uuid, date, boolean) from public;
revoke all on function public.client_health_complete_action(text, date) from public;
grant execute on function public.client_health_dashboard(date) to authenticated;
grant execute on function public.client_health_mark_medication(uuid, date, boolean) to authenticated;
grant execute on function public.client_health_complete_action(text, date) to authenticated;
