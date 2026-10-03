begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_column('public', 'partner_client_diet_plans', 'target_fiber_min_g', 'planos de dieta guardam a meta mínima de fibra');
select has_column('public', 'partner_client_diet_plans', 'target_fiber_max_g', 'planos de dieta guardam a meta máxima de fibra');
select col_is_null('public', 'partner_client_diet_plans', 'target_fiber_min_g', 'meta mínima não preenche planos históricos');
select col_is_null('public', 'partner_client_diet_plans', 'target_fiber_max_g', 'meta máxima não preenche planos históricos');
select function_returns('public', 'partner_client_diet', array['uuid'], 'jsonb', 'RPC de dietas preserva o contrato JSON');

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.partner_client_diet_plans'::regclass
      and conname = 'partner_client_diet_plans_target_fiber_range_check'
      and pg_get_constraintdef(oid) like '%target_fiber_max_g >= target_fiber_min_g%'
  ),
  'a faixa de fibra rejeita máximo abaixo do mínimo'
);

select * from finish();
rollback;
