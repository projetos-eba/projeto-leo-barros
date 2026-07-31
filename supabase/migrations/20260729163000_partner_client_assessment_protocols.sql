begin;

alter table public.partner_client_assessments
  drop constraint if exists partner_client_assessments_method_check;

update public.partner_client_assessments
set assessment_method = case assessment_method
  when 'pollock_7' then 'jackson_pollock_7'
  when 'pollock_3' then 'jackson_pollock_3'
  else assessment_method
end
where assessment_method in ('pollock_7', 'pollock_3');

alter table public.partner_client_assessments
  alter column assessment_method set default 'jackson_pollock_7';

alter table public.partner_client_assessments
  add constraint partner_client_assessments_method_check
  check (
    assessment_method in (
      'guedes_3',
      'jackson_pollock_3',
      'durnin_womersley_4',
      'faulkner_4',
      'jackson_pollock_7',
      'bioimpedance',
      'manual'
    )
  );

alter table public.partner_client_assessment_skinfolds
  drop constraint if exists partner_client_assessment_skinfolds_metric_check;

alter table public.partner_client_assessment_skinfolds
  add constraint partner_client_assessment_skinfolds_metric_check
  check (
    metric_key in (
      'biceps',
      'pectoral',
      'abdominal',
      'triceps',
      'subscapular',
      'axillary',
      'suprailiac',
      'thigh',
      'medial_calf'
    )
  );

notify pgrst, 'reload schema';

commit;
