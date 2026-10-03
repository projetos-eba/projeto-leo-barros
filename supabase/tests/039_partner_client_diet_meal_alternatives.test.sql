begin;

select plan(6);

select has_column('public', 'partner_client_diet_meals', 'meal_group_id', 'refeições possuem grupo de alternativas');
select has_column('public', 'partner_client_diet_meals', 'alternative_order', 'refeições possuem ordem de alternativa');
select has_function('public', 'partner_create_diet_meal_alternative', array['uuid', 'uuid', 'uuid'], 'RPC cria alternativa de refeição');
select has_function('public', 'partner_remove_diet_meal', array['uuid', 'uuid', 'uuid'], 'RPC remove alternativa de refeição');

select ok(
  exists (
    select 1
    from public.partner_client_diet_meals as primary_meal
    join public.partner_client_diet_meals as alternative_meal
      on alternative_meal.plan_id = primary_meal.plan_id
     and alternative_meal.day_of_week = primary_meal.day_of_week
     and alternative_meal.title = primary_meal.title
     and alternative_meal.meal_group_id = primary_meal.meal_group_id
    where primary_meal.menu_option = 1
      and alternative_meal.menu_option = 2
      and primary_meal.alternative_order = 1
      and alternative_meal.alternative_order = 2
  ),
  'Cardápio 2 existente é convertido em alternativa da mesma refeição'
);

select ok(
  not exists (
    select 1
    from public.partner_client_diet_meals
    where meal_group_id is null or alternative_order < 1
  ),
  'migração preserva grupos e ordens válidas para todas as refeições'
);

select * from finish();

rollback;
