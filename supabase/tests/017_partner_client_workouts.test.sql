begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(22);

select has_table('public', 'partner_workout_programs', 'programas de treino existem');
select has_table('public', 'partner_workout_sessions', 'divisoes de treino existem');
select has_table('public', 'partner_workout_exercises', 'exercicios prescritos existem');
select has_table('public', 'partner_workout_sets', 'series prescritas existem');
select has_table('public', 'partner_workout_events', 'historico de treino existe');
select has_table('public', 'partner_workout_session_defaults', 'predefinicoes por divisao existem');
select has_column('public', 'partner_workout_sets', 'rir', 'series possuem RIR');
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

insert into public.partner_workout_session_defaults (
  session_id, partner_id, warmup_sets, warmup_reps, warmup_rir,
  moderate_sets, moderate_reps, moderate_rir, maximum_sets, maximum_reps, maximum_rir, rest_seconds
)
values (
  'e2000000-0000-4000-8000-000000000201', 'a1000000-0000-4000-8000-000000000201', 1, 12, 4, 2, 10, 2, 1, 8, 1, 90
);

update public.partner_workout_sets
set rir = 2
where id = 'e2000000-0000-4000-8000-000000000402';

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
  public.partner_client_workouts('a1000000-0000-4000-8000-000000000301')->'programs'->0->'sessions'->0->'defaults'->>'moderateRir',
  '2',
  'RPC retorna predefinicoes da divisao'
);
select is(
  public.partner_client_workouts('a1000000-0000-4000-8000-000000000301')->'programs'->0->'sessions'->0->'exercises'->0->'sets'->1->>'rir',
  '2',
  'RPC retorna RIR da serie'
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
  (select warmup_sets from public.partner_workout_session_defaults where session_id = (select session.id from public.partner_workout_sessions session where session.program_id = (select id from cloned_workout_program) order by session.sort_order limit 1)),
  1,
  'clone preserva predefinicoes da divisao'
);

select is(
  public.partner_client_workouts('ffffffff-ffff-4fff-8fff-ffffffffffff'),
  null::jsonb,
  'RPC bloqueia Cliente sem vinculo ativo ao parceiro'
);

reset role;
select * from finish();
rollback;
