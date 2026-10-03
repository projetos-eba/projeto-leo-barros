alter table public.partner_client_diet_plans
  add column if not exists target_fiber_min_g numeric(6, 1),
  add column if not exists target_fiber_max_g numeric(6, 1),
  add constraint partner_client_diet_plans_target_fiber_range_check
    check (
      (target_fiber_min_g is null and target_fiber_max_g is null)
      or (
        target_fiber_min_g >= 0
        and target_fiber_max_g >= target_fiber_min_g
      )
    );

alter function public.partner_client_diet(uuid)
  rename to partner_client_diet_base;

revoke all on function public.partner_client_diet_base(uuid) from public, anon, authenticated;

create function public.partner_client_diet(p_patient_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  enriched_result jsonb;
  result jsonb;
begin
  result := public.partner_client_diet_base(p_patient_id);

  if result is null or result -> 'plan' is null then
    return result;
  end if;

  select jsonb_set(
      result,
      '{plan}',
      (result -> 'plan') || jsonb_build_object(
        'targetFiberMinG', plan.target_fiber_min_g,
        'targetFiberMaxG', plan.target_fiber_max_g
      ),
      true
    )
  into enriched_result
  from public.partner_client_diet_plans as plan
  where plan.id = (result -> 'plan' ->> 'id')::uuid
    and plan.patient_id = p_patient_id
    and plan.partner_id = public.current_active_partner_id();

  return coalesce(enriched_result, result);
end;
$$;

grant execute on function public.partner_client_diet(uuid) to authenticated, service_role;
