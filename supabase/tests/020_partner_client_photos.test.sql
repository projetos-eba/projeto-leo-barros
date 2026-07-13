begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(19);

select has_table('public', 'partner_client_photo_sessions', 'sessões de Fotos existem');
select has_table('public', 'partner_client_photo_items', 'itens de Fotos existem');
select has_table('public', 'partner_client_photo_comparison_notes', 'notas de comparação existem');
select has_table('public', 'partner_client_photo_events', 'histórico de Fotos existe');
select has_function('public', 'partner_client_photos', array['uuid'], 'RPC da aba Fotos existe');

select ok(
  has_function_privilege('authenticated', 'public.partner_client_photos(uuid)', 'execute'),
  'authenticated pode executar RPC de Fotos'
);

select is(
  position('cpf' in lower(pg_get_functiondef('public.partner_client_photos(uuid)'::regprocedure))),
  0,
  'RPC de Fotos nao referencia CPF'
);

select is(
  (select public from storage.buckets where id = 'partner-client-photos'),
  false,
  'bucket de Fotos é privado'
);

select is(
  (select count(*)::integer from public.partner_client_photo_sessions where patient_id = 'a1000000-0000-4000-8000-000000000301'),
  2,
  'Ana possui 2 sessões de Fotos'
);

select is(
  (select count(*)::integer from public.partner_client_photo_items where patient_id = 'a1000000-0000-4000-8000-000000000301'),
  8,
  'Ana possui 8 fotos de seed'
);

select is(
  (select count(*)::integer from public.partner_client_photo_items where session_id = 'f4000000-0000-4000-8000-000000000102'),
  4,
  'última sessão da Ana tem 4 ângulos'
);

select isnt(
  (select id from public.partner_client_photo_comparison_notes where patient_id = 'a1000000-0000-4000-8000-000000000301' limit 1),
  null,
  'seed cria observação de comparação'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);

select isnt(
  public.partner_client_photos('a1000000-0000-4000-8000-000000000301'::uuid),
  null,
  'RPC retorna Fotos da Ana'
);

select is(
  jsonb_array_length(public.partner_client_photos('a1000000-0000-4000-8000-000000000301'::uuid)->'sessions'),
  2,
  'RPC retorna sessões'
);

select is(
  jsonb_array_length((public.partner_client_photos('a1000000-0000-4000-8000-000000000301'::uuid)->'sessions'->0)->'photos'),
  4,
  'RPC retorna fotos da sessão mais recente'
);

select is(
  ((public.partner_client_photos('a1000000-0000-4000-8000-000000000301'::uuid)->'sessions'->0)->'measurements'->>'waistCm')::numeric,
  73.1,
  'RPC retorna medida derivada da avaliação mais próxima'
);

select throws_ok(
  $$
    insert into public.partner_client_photo_sessions (
      partner_id, patient_id, captured_at, title
    ) values (
      'a1000000-0000-4000-8000-000000000201',
      'a1000000-0000-4000-8000-000000000306',
      now(),
      'Sessão bloqueada'
    )
  $$,
  '42501',
  null,
  'parceiro não cria Fotos para Cliente sem vínculo ativo'
);

select is(
  public.partner_client_photos('ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid),
  null::jsonb,
  'RPC bloqueia Cliente sem vínculo ativo ao parceiro'
);

select is(
  position('patient-photos' in lower(pg_get_functiondef('public.partner_client_photos(uuid)'::regprocedure))),
  0,
  'RPC não usa bucket público legado'
);

reset role;
select * from finish();
rollback;
