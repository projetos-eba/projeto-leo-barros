begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(21);

select has_table('public', 'partner_exam_categories', 'categorias de exames existem');
select has_table('public', 'partner_exam_definitions', 'definições de exames existem');
select has_table('public', 'partner_exam_reference_ranges', 'faixas de referência existem');
select has_table('public', 'partner_exam_alternative_units', 'unidades alternativas existem');
select has_table('public', 'partner_client_exam_collections', 'coletas do Cliente existem');
select has_table('public', 'partner_client_exam_results', 'resultados do Cliente existem');
select has_table('public', 'partner_client_exam_events', 'histórico de Exames existe');
select has_function('public', 'partner_client_exams', array['uuid'], 'RPC da aba Exames existe');

select ok(
  has_function_privilege('authenticated', 'public.partner_client_exams(uuid)', 'execute'),
  'authenticated pode executar RPC de Exames'
);

select is(
  position('cpf' in lower(pg_get_functiondef('public.partner_client_exams(uuid)'::regprocedure))),
  0,
  'RPC de Exames nao referencia CPF'
);

select is(
  (select count(*)::integer from public.partner_exam_categories where partner_id = 'a1000000-0000-4000-8000-000000000201'),
  11,
  'seed cria 11 categorias de exames'
);

select is(
  (select count(*)::integer from public.partner_exam_definitions where partner_id = 'a1000000-0000-4000-8000-000000000201'),
  72,
  'seed cria 72 exames'
);

select isnt(
  (select id from public.partner_exam_alternative_units where unit = 'mmol/L' limit 1),
  null,
  'seed cria conversões de unidade'
);

select is(
  (select count(*)::integer from public.partner_client_exam_collections where patient_id = 'a1000000-0000-4000-8000-000000000301'),
  3,
  'Ana possui histórico de 3 coletas'
);

select is(
  (select count(*)::integer
   from public.partner_client_exam_results result
   join public.partner_client_exam_collections collection on collection.id = result.collection_id
   where collection.id = 'f3000000-0000-4000-8000-000000000103'
     and result.status in ('high', 'low')),
  6,
  'última coleta da Ana tem 6 alertas'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);

select isnt(
  public.partner_client_exams('a1000000-0000-4000-8000-000000000301'::uuid),
  null,
  'RPC retorna Exames da Ana'
);

select is(
  jsonb_array_length(public.partner_client_exams('a1000000-0000-4000-8000-000000000301'::uuid)->'categories'),
  11,
  'RPC retorna categorias'
);

select is(
  jsonb_array_length(public.partner_client_exams('a1000000-0000-4000-8000-000000000301'::uuid)->'definitions'),
  72,
  'RPC retorna catálogo ativo'
);

select is(
  jsonb_array_length(public.partner_client_exams('a1000000-0000-4000-8000-000000000301'::uuid)->'collections'),
  3,
  'RPC retorna coletas'
);

select throws_ok(
  $$
    insert into public.partner_client_exam_collections (
      partner_id, patient_id, collected_at, title
    ) values (
      'a1000000-0000-4000-8000-000000000201',
      'a1000000-0000-4000-8000-000000000306',
      current_date,
      'Coleta bloqueada'
    )
  $$,
  '42501',
  null,
  'parceiro não cria Exames para Cliente sem vínculo ativo'
);

select is(
  public.partner_client_exams('ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid),
  null::jsonb,
  'RPC bloqueia Cliente sem vínculo ativo ao parceiro'
);

reset role;
select * from finish();
rollback;
