-- Dominio clinico da aba Avaliacoes do Cliente.
-- Dados de smoke permanecem em supabase/seed.sql.

create table public.partner_client_assessments (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  assessed_at timestamptz not null,
  title text not null default 'Avaliacao corporal',
  height_cm numeric(5, 2) not null,
  weight_kg numeric(6, 2) not null,
  body_fat_percentage numeric(5, 2),
  muscle_mass_kg numeric(6, 2),
  activity_level text not null default 'moderate',
  target_weight_kg numeric(6, 2),
  target_days integer not null default 90,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_assessments_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_assessments_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_assessments_title_not_blank
    check (length(btrim(title)) > 0),
  constraint partner_client_assessments_height_check
    check (height_cm between 80 and 260),
  constraint partner_client_assessments_weight_check
    check (weight_kg between 20 and 350),
  constraint partner_client_assessments_body_fat_check
    check (body_fat_percentage is null or body_fat_percentage between 1 and 80),
  constraint partner_client_assessments_muscle_mass_check
    check (muscle_mass_kg is null or muscle_mass_kg between 5 and 200),
  constraint partner_client_assessments_activity_level_check
    check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'athlete')),
  constraint partner_client_assessments_target_weight_check
    check (target_weight_kg is null or target_weight_kg between 20 and 350),
  constraint partner_client_assessments_target_days_check
    check (target_days between 7 and 730),
  constraint partner_client_assessments_notes_not_blank
    check (notes is null or length(btrim(notes)) > 0)
);

create table public.partner_client_assessment_circumferences (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null,
  partner_id uuid not null,
  patient_id uuid not null,
  metric_key text not null,
  value_cm numeric(6, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_assessment_circumferences_assessment_id_fkey
    foreign key (assessment_id) references public.partner_client_assessments(id) on delete cascade,
  constraint partner_client_assessment_circumferences_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_assessment_circumferences_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_assessment_circumferences_metric_check
    check (
      metric_key in (
        'chest',
        'waist',
        'abdomen',
        'hip',
        'right_arm_relaxed',
        'right_arm_contracted',
        'left_arm_relaxed',
        'left_arm_contracted',
        'right_forearm',
        'left_forearm',
        'right_thigh',
        'left_thigh',
        'right_calf',
        'left_calf'
      )
    ),
  constraint partner_client_assessment_circumferences_value_check
    check (value_cm between 5 and 250),
  constraint partner_client_assessment_circumferences_unique
    unique (assessment_id, metric_key)
);

create table public.partner_client_calorie_calculations (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  assessment_id uuid,
  formula text not null,
  activity_factor numeric(4, 3) not null,
  bmr_kcal integer not null,
  tdee_kcal integer not null,
  target_kcal integer not null,
  daily_energy_delta_kcal integer not null,
  weekly_energy_delta_kcal integer not null,
  target_weight_kg numeric(6, 2),
  target_days integer not null,
  projected_weight_delta_kg numeric(6, 2) not null,
  status text not null default 'saved',
  inputs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_calorie_calculations_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_calorie_calculations_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_calorie_calculations_assessment_id_fkey
    foreign key (assessment_id) references public.partner_client_assessments(id) on delete set null,
  constraint partner_client_calorie_calculations_formula_check
    check (formula in ('mifflin', 'harris_benedict', 'cunningham', 'tinsley')),
  constraint partner_client_calorie_calculations_activity_factor_check
    check (activity_factor between 1.000 and 2.500),
  constraint partner_client_calorie_calculations_energy_check
    check (bmr_kcal > 0 and tdee_kcal > 0 and target_kcal > 0),
  constraint partner_client_calorie_calculations_target_weight_check
    check (target_weight_kg is null or target_weight_kg between 20 and 350),
  constraint partner_client_calorie_calculations_target_days_check
    check (target_days between 7 and 730),
  constraint partner_client_calorie_calculations_status_check
    check (status in ('saved', 'applied', 'archived')),
  constraint partner_client_calorie_calculations_inputs_object
    check (jsonb_typeof(inputs) = 'object')
);

create index partner_client_assessments_patient_date_idx
  on public.partner_client_assessments (partner_id, patient_id, assessed_at desc);
create index partner_client_assessment_circumferences_patient_idx
  on public.partner_client_assessment_circumferences (partner_id, patient_id, metric_key);
create index partner_client_calorie_calculations_patient_date_idx
  on public.partner_client_calorie_calculations (partner_id, patient_id, created_at desc);
create index partner_client_calorie_calculations_applied_idx
  on public.partner_client_calorie_calculations (partner_id, patient_id, status, created_at desc);

create trigger partner_client_assessments_set_updated_at
before update on public.partner_client_assessments
for each row execute function public.set_updated_at();
create trigger partner_client_assessment_circumferences_set_updated_at
before update on public.partner_client_assessment_circumferences
for each row execute function public.set_updated_at();
create trigger partner_client_calorie_calculations_set_updated_at
before update on public.partner_client_calorie_calculations
for each row execute function public.set_updated_at();

alter table public.partner_client_assessments enable row level security;
alter table public.partner_client_assessment_circumferences enable row level security;
alter table public.partner_client_calorie_calculations enable row level security;

revoke all on table public.partner_client_assessments from public, anon, authenticated;
revoke all on table public.partner_client_assessment_circumferences from public, anon, authenticated;
revoke all on table public.partner_client_calorie_calculations from public, anon, authenticated;

grant select, insert, update on table public.partner_client_assessments to authenticated;
grant select, insert, update, delete on table public.partner_client_assessment_circumferences to authenticated;
grant select, insert, update on table public.partner_client_calorie_calculations to authenticated;

grant select, insert, update, delete on table public.partner_client_assessments to service_role;
grant select, insert, update, delete on table public.partner_client_assessment_circumferences to service_role;
grant select, insert, update, delete on table public.partner_client_calorie_calculations to service_role;

create policy partner_client_assessments_select_own_partner
on public.partner_client_assessments for select to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_assessments_insert_own_partner
on public.partner_client_assessments for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_assessments_update_own_partner
on public.partner_client_assessments for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));

create policy partner_client_assessment_circumferences_select_own_partner
on public.partner_client_assessment_circumferences for select to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_assessment_circumferences_insert_own_partner
on public.partner_client_assessment_circumferences for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_assessment_circumferences_update_own_partner
on public.partner_client_assessment_circumferences for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_assessment_circumferences_delete_own_partner
on public.partner_client_assessment_circumferences for delete to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));

create policy partner_client_calorie_calculations_select_own_partner
on public.partner_client_calorie_calculations for select to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_calorie_calculations_insert_own_partner
on public.partner_client_calorie_calculations for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_calorie_calculations_update_own_partner
on public.partner_client_calorie_calculations for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));

create or replace function public.partner_client_assessments(p_patient_id uuid)
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
      'displayName', profile.display_name,
      'email', profile.email,
      'birthDate', patient.birth_date,
      'gender', patient.gender,
      'objective', patient.objective,
      'status', relationship_summary.status,
      'serviceScopes', relationship_summary.service_scopes
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
    'assessments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', assessment.id,
        'assessedAt', assessment.assessed_at,
        'title', assessment.title,
        'heightCm', assessment.height_cm,
        'weightKg', assessment.weight_kg,
        'bodyFatPercentage', assessment.body_fat_percentage,
        'muscleMassKg', assessment.muscle_mass_kg,
        'activityLevel', assessment.activity_level,
        'targetWeightKg', assessment.target_weight_kg,
        'targetDays', assessment.target_days,
        'notes', assessment.notes,
        'circumferences', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', circumference.id,
            'metricKey', circumference.metric_key,
            'valueCm', circumference.value_cm
          ) order by circumference.metric_key asc)
          from public.partner_client_assessment_circumferences as circumference
          where circumference.assessment_id = assessment.id
        ), '[]'::jsonb),
        'calculations', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', calculation.id,
            'formula', calculation.formula,
            'activityFactor', calculation.activity_factor,
            'bmrKcal', calculation.bmr_kcal,
            'tdeeKcal', calculation.tdee_kcal,
            'targetKcal', calculation.target_kcal,
            'dailyEnergyDeltaKcal', calculation.daily_energy_delta_kcal,
            'weeklyEnergyDeltaKcal', calculation.weekly_energy_delta_kcal,
            'targetWeightKg', calculation.target_weight_kg,
            'targetDays', calculation.target_days,
            'projectedWeightDeltaKg', calculation.projected_weight_delta_kg,
            'status', calculation.status,
            'inputs', calculation.inputs,
            'createdAt', calculation.created_at
          ) order by calculation.created_at desc)
          from public.partner_client_calorie_calculations as calculation
          where calculation.assessment_id = assessment.id
            and calculation.partner_id = current_partner_id
            and calculation.patient_id = p_patient_id
        ), '[]'::jsonb)
      ) order by assessment.assessed_at asc)
      from public.partner_client_assessments as assessment
      where assessment.partner_id = current_partner_id
        and assessment.patient_id = p_patient_id
    ), '[]'::jsonb),
    'calculations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', calculation.id,
        'assessmentId', calculation.assessment_id,
        'formula', calculation.formula,
        'activityFactor', calculation.activity_factor,
        'bmrKcal', calculation.bmr_kcal,
        'tdeeKcal', calculation.tdee_kcal,
        'targetKcal', calculation.target_kcal,
        'dailyEnergyDeltaKcal', calculation.daily_energy_delta_kcal,
        'weeklyEnergyDeltaKcal', calculation.weekly_energy_delta_kcal,
        'targetWeightKg', calculation.target_weight_kg,
        'targetDays', calculation.target_days,
        'projectedWeightDeltaKg', calculation.projected_weight_delta_kg,
        'status', calculation.status,
        'inputs', calculation.inputs,
        'createdAt', calculation.created_at
      ) order by calculation.created_at desc)
      from public.partner_client_calorie_calculations as calculation
      where calculation.partner_id = current_partner_id
        and calculation.patient_id = p_patient_id
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

comment on function public.partner_client_assessments(uuid)
is 'Retorna avaliacoes, circunferencias e calculos caloricos do Cliente para o Parceiro vinculado, sem CPF ou leitura global.';

revoke all on function public.partner_client_assessments(uuid) from public;
grant execute on function public.partner_client_assessments(uuid) to authenticated;

notify pgrst, 'reload schema';
