-- Refinamento tecnico da aba Avaliacoes: metodo fisico e dobras cutaneas.
-- Dados de smoke permanecem em supabase/seed.sql.

alter table public.partner_client_assessments
  add column assessment_method text not null default 'pollock_7';

alter table public.partner_client_assessments
  add constraint partner_client_assessments_method_check
  check (assessment_method in ('pollock_7', 'pollock_3', 'bioimpedance', 'manual'));

create table public.partner_client_assessment_skinfolds (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null,
  partner_id uuid not null,
  patient_id uuid not null,
  metric_key text not null,
  value_mm numeric(6, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_assessment_skinfolds_assessment_id_fkey
    foreign key (assessment_id) references public.partner_client_assessments(id) on delete cascade,
  constraint partner_client_assessment_skinfolds_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_assessment_skinfolds_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_assessment_skinfolds_metric_check
    check (
      metric_key in (
        'pectoral',
        'abdominal',
        'triceps',
        'subscapular',
        'axillary',
        'suprailiac',
        'thigh',
        'medial_calf'
      )
    ),
  constraint partner_client_assessment_skinfolds_value_check
    check (value_mm between 1 and 100),
  constraint partner_client_assessment_skinfolds_unique
    unique (assessment_id, metric_key)
);

create index partner_client_assessment_skinfolds_patient_idx
  on public.partner_client_assessment_skinfolds (partner_id, patient_id, metric_key);

create trigger partner_client_assessment_skinfolds_set_updated_at
before update on public.partner_client_assessment_skinfolds
for each row execute function public.set_updated_at();

alter table public.partner_client_assessment_skinfolds enable row level security;

revoke all on table public.partner_client_assessment_skinfolds from public, anon, authenticated;
grant select, insert, update, delete on table public.partner_client_assessment_skinfolds to authenticated;
grant select, insert, update, delete on table public.partner_client_assessment_skinfolds to service_role;

create policy partner_client_assessment_skinfolds_select_own_partner
on public.partner_client_assessment_skinfolds for select to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_assessment_skinfolds_insert_own_partner
on public.partner_client_assessment_skinfolds for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_assessment_skinfolds_update_own_partner
on public.partner_client_assessment_skinfolds for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));
create policy partner_client_assessment_skinfolds_delete_own_partner
on public.partner_client_assessment_skinfolds for delete to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_patient_link(patient_id));

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
        'assessmentMethod', assessment.assessment_method,
        'targetWeightKg', assessment.target_weight_kg,
        'targetDays', assessment.target_days,
        'notes', assessment.notes,
        'skinfolds', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', skinfold.id,
            'metricKey', skinfold.metric_key,
            'valueMm', skinfold.value_mm
          ) order by skinfold.metric_key asc)
          from public.partner_client_assessment_skinfolds as skinfold
          where skinfold.assessment_id = assessment.id
        ), '[]'::jsonb),
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
is 'Retorna avaliacoes, dobras, circunferencias e calculos caloricos do Cliente para o Parceiro vinculado, sem CPF ou leitura global.';

notify pgrst, 'reload schema';
