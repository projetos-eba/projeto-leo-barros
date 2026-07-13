begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(17);

select has_table('public', 'partner_workout_programs', 'programas de treino existem');
select has_table('public', 'partner_workout_sessions', 'divisoes de treino existem');
select has_table('public', 'partner_workout_exercises', 'exercicios prescritos existem');
select has_table('public', 'partner_workout_sets', 'series prescritas existem');
select has_table('public', 'partner_workout_events', 'historico de treino existe');
select has_column('public', 'partner_protocol_exercises', 'secondary_muscle_groups', 'biblioteca possui musculos secundarios');

select ok(
  to_regprocedure('public.partner_client_workouts(uuid)') is not null,
  'RPC de treinos existe'
);
select ok(
  to_regprocedure('public.partner_clone_workout_program(uuid,uuid,boolean)') is not null,
  'RPC transacional de clone existe'
);
select ok(
  has_function_privilege('authenticated', 'public.partner_client_workouts(uuid)', 'execute'),
  'authenticated pode executar RPC segura'
);
select is(
  position('cpf' in lower(pg_get_functiondef('public.partner_client_workouts(uuid)'::regprocedure))),
  0,
  'RPC nao referencia CPF'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);

select is(
  jsonb_array_length(public.partner_client_workouts('a1000000-0000-4000-8000-000000000301')->'programs'),
  1,
  'RPC retorna programa da Ana'
);
select is(
  public.partner_client_workouts('a1000000-0000-4000-8000-000000000301')->'programs'->0->'sessions'->0->>'title',
  'Treino A',
  'RPC retorna divisao ordenada'
);
select is(
  public.partner_client_workouts('a1000000-0000-4000-8000-000000000301')->'programs'->0->'sessions'->0->'exercises'->0->>'technique',
  'biset',
  'RPC retorna Bi-set'
);
select is(
  jsonb_array_length(public.partner_client_workouts('a1000000-0000-4000-8000-000000000301')->'templates'),
  1,
  'RPC retorna templates do parceiro'
);

create temporary table cloned_workout_program (id uuid);
insert into cloned_workout_program
select public.partner_clone_workout_program(
  'e2000000-0000-4000-8000-000000000101',
  'a1000000-0000-4000-8000-000000000301',
  false
);

select is(
  (select count(*)::integer from public.partner_workout_programs where id = (select id from cloned_workout_program)),
  1,
  'clone transacional cria programa independente'
);
select is(
  (
    select count(*)::integer
    from public.partner_workout_exercises exercise
    join public.partner_workout_sessions session on session.id = exercise.session_id
    where session.program_id = (select id from cloned_workout_program)
      and exercise.technique = 'biset'
      and exercise.biset_group_id is not null
  ),
  2,
  'clone preserva os dois exercícios do Bi-set'
);

select is(
  public.partner_client_workouts('ffffffff-ffff-4fff-8fff-ffffffffffff'),
  null::jsonb,
  'RPC bloqueia Cliente sem vinculo ativo ao parceiro'
);

reset role;
select * from finish();
rollback;
