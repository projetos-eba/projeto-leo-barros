begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(15);

select has_table('public', 'partner_client_cardio_plans', 'planos de Cardio do Cliente existem');
select has_table('public', 'partner_client_cardio_calculations', 'cálculos de Cardio existem');
select has_table('public', 'partner_client_cardio_sessions', 'sessões realizadas de Cardio existem');
select has_table('public', 'partner_client_cardio_events', 'histórico de Cardio existe');
select has_function('public', 'partner_client_cardio', array['uuid'], 'RPC da aba Cardio existe');

select ok(
  has_function_privilege('authenticated', 'public.partner_client_cardio(uuid)', 'execute'),
  'authenticated pode executar RPC de Cardio'
);

select is(
  position('cpf' in lower(pg_get_functiondef('public.partner_client_cardio(uuid)'::regprocedure))),
  0,
  'RPC de Cardio nao referencia CPF'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);

select isnt(
  public.partner_client_cardio('a1000000-0000-4000-8000-000000000301'::uuid),
  null,
  'RPC retorna Cardio da Ana'
);

select is(
  public.partner_client_cardio('a1000000-0000-4000-8000-000000000301'::uuid)->'plan'->>'title',
  'Cardio base aeróbica',
  'RPC retorna plano ativo de Cardio'
);

select is(
  (public.partner_client_cardio('a1000000-0000-4000-8000-000000000301'::uuid)->'weekSummary'->>'completedMinutes')::integer,
  162,
  'RPC retorna minutos realizados na semana'
);

select is(
  jsonb_array_length(public.partner_client_cardio('a1000000-0000-4000-8000-000000000301'::uuid)->'calculations'),
  1,
  'RPC retorna cálculo salvo'
);

select is(
  jsonb_array_length(public.partner_client_cardio('a1000000-0000-4000-8000-000000000301'::uuid)->'sessions'),
  3,
  'RPC retorna sessões registradas'
);

select is(
  jsonb_array_length(public.partner_client_cardio('a1000000-0000-4000-8000-000000000301'::uuid)->'heartRateZones'),
  5,
  'RPC retorna zonas cardíacas'
);

select throws_ok(
  $$
    insert into public.partner_client_cardio_plans (
      partner_id, patient_id, title, weekly_target_minutes, weight_kg
    ) values (
      'a1000000-0000-4000-8000-000000000201',
      'a1000000-0000-4000-8000-000000000306',
      'Cardio bloqueado',
      120,
      70
    )
  $$,
  '42501',
  null,
  'parceiro não cria Cardio para Cliente sem vínculo ativo'
);

select is(
  public.partner_client_cardio('ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid),
  null::jsonb,
  'RPC bloqueia Cliente sem vínculo ativo ao parceiro'
);

reset role;
select * from finish();
rollback;
