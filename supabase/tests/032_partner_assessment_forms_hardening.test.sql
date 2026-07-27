begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

select has_column('public', 'patients', 'biological_sex', 'Cliente possui sexo biologico');
select has_table('public', 'partner_form_template_versions', 'Modelos possuem versoes imutaveis');
select has_column('public', 'partner_form_assignments', 'template_snapshot', 'Envio possui snapshot');
select has_function('public', 'save_partner_form_template', array['uuid','text','text','text','text','jsonb'], 'RPC salva modelo versionado');
select has_function('public', 'send_partner_form_template', array['uuid','uuid[]','text','timestamptz','uuid'], 'RPC envia modelo publicado');

insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
  ('00000000-0000-0000-0000-000000000000','f1000000-0000-4000-8000-000000000001','authenticated','authenticated','forms-partner-a@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','f1000000-0000-4000-8000-000000000002','authenticated','authenticated','forms-partner-b@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','f1000000-0000-4000-8000-000000000003','authenticated','authenticated','forms-client-a@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','f1000000-0000-4000-8000-000000000004','authenticated','authenticated','forms-client-b@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());

insert into public.profiles (id,user_id,email,display_name,role,status)
values
  ('f1000000-0000-4000-8000-000000000101','f1000000-0000-4000-8000-000000000001','forms-partner-a@example.invalid','Parceiro Forms A','parceiro','active'),
  ('f1000000-0000-4000-8000-000000000102','f1000000-0000-4000-8000-000000000002','forms-partner-b@example.invalid','Parceiro Forms B','parceiro','active'),
  ('f1000000-0000-4000-8000-000000000103','f1000000-0000-4000-8000-000000000003','forms-client-a@example.invalid','Cliente Forms A','cliente','active'),
  ('f1000000-0000-4000-8000-000000000104','f1000000-0000-4000-8000-000000000004','forms-client-b@example.invalid','Cliente Forms B','cliente','active');

insert into public.partners (id,profile_id,professional_name,professional_type)
values
  ('f1000000-0000-4000-8000-000000000201','f1000000-0000-4000-8000-000000000101','Parceiro Forms A','nutricionista'),
  ('f1000000-0000-4000-8000-000000000202','f1000000-0000-4000-8000-000000000102','Parceiro Forms B','personal_trainer');
insert into public.patients (id,profile_id,birth_date,objective,biological_sex)
values
  ('f1000000-0000-4000-8000-000000000301','f1000000-0000-4000-8000-000000000103',current_date - interval '30 years','Saude','not_informed'),
  ('f1000000-0000-4000-8000-000000000302','f1000000-0000-4000-8000-000000000104',current_date - interval '28 years','Performance','male');
insert into public.partner_clients (partner_id,patient_id,service_scope,status)
values
  ('f1000000-0000-4000-8000-000000000201','f1000000-0000-4000-8000-000000000301','dieta','active'),
  ('f1000000-0000-4000-8000-000000000202','f1000000-0000-4000-8000-000000000302','treino','active');

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','f1000000-0000-4000-8000-000000000001',true);

select throws_ok(
  $$ select public.partner_client_assessments_legacy_20260727('f1000000-0000-4000-8000-000000000301') $$,
  '42501',
  null,
  'RPC legado de avaliacoes nao permanece exposto'
);
select throws_ok(
  $$ select public.partner_client_overview_legacy_20260727('f1000000-0000-4000-8000-000000000301') $$,
  '42501',
  null,
  'RPC legado da visao geral nao permanece exposto'
);
select is(
  public.partner_client_assessments('f1000000-0000-4000-8000-000000000301')->'identity'->>'biologicalSex',
  'not_informed',
  'RPC de avaliacoes nao inventa sexo biologico'
);
select is(
  public.partner_client_overview('f1000000-0000-4000-8000-000000000301')->'identity'->>'biologicalSex',
  'not_informed',
  'RPC da visao geral usa sexo biologico, nao genero legado'
);
select ok(
  public.complete_partner_client_profile('f1000000-0000-4000-8000-000000000301',(current_date - interval '30 years')::date,'female','Hipertrofia'),
  'Parceiro completa cadastro de Cliente proprio'
);
select is(
  public.partner_client_assessments('f1000000-0000-4000-8000-000000000301')->'identity'->>'biologicalSex',
  'female',
  'RPC de avaliacoes retorna sexo biologico persistido'
);
select is(
  public.partner_client_overview('f1000000-0000-4000-8000-000000000301')->'identity'->>'biologicalSex',
  'female',
  'RPC da visao geral retorna sexo biologico persistido'
);

select lives_ok(
  $$ select public.save_partner_form_template(
    null,'Check-in original','Descricao','Mensagem','active',
    '[{"type":"text_short","prompt":"Pergunta original","helpText":"","required":true,"options":[],"settings":{"placeholder":"Resposta"}}]'::jsonb
  ) $$,
  'Parceiro cria e publica modelo'
);
select is((select count(*)::integer from public.partner_form_template_versions where title='Check-in original'),1,'Publicacao cria primeira versao');

select lives_ok(
  $$ select public.send_partner_form_template(
    (select id from public.partner_form_templates where title='Check-in original'),
    array['f1000000-0000-4000-8000-000000000301'::uuid],
    'Mensagem contextual',now()+interval '3 days','f1000000-0000-4000-8000-000000000901'
  ) $$,
  'Envio contextual persiste'
);
select lives_ok(
  $$ select public.send_partner_form_template(
    (select id from public.partner_form_templates where title='Check-in original'),
    array['f1000000-0000-4000-8000-000000000301'::uuid],
    'Mensagem contextual',now()+interval '3 days','f1000000-0000-4000-8000-000000000901'
  ) $$,
  'Repeticao com mesma chave e idempotente'
);
select is((select count(*)::integer from public.partner_form_assignments where request_key='f1000000-0000-4000-8000-000000000901'),1,'Idempotencia evita envio duplicado');
select is((select count(*)::integer from public.partner_form_assignment_clients where patient_id='f1000000-0000-4000-8000-000000000301'),1,'Destinatario nao e duplicado');

select lives_ok(
  $$ select public.save_partner_form_template(
    (select id from public.partner_form_templates where title='Check-in original'),
    'Check-in atualizado','Descricao nova','Mensagem nova','active',
    '[{"type":"boolean","prompt":"Pergunta nova","helpText":"","required":true,"options":[],"settings":{}}]'::jsonb
  ) $$,
  'Edicao cria nova versao'
);
select is((select count(*)::integer from public.partner_form_template_versions where template_id=(select id from public.partner_form_templates where title='Check-in atualizado')),2,'Modelo mantem historico de versoes');
select is(
  (select template_snapshot->>'title' from public.partner_form_assignments where request_key='f1000000-0000-4000-8000-000000000901'),
  'Check-in original',
  'Edicao nao altera titulo do envio antigo'
);
select is(
  (select template_snapshot->'questions'->0->>'prompt' from public.partner_form_assignments where request_key='f1000000-0000-4000-8000-000000000901'),
  'Pergunta original',
  'Edicao nao altera perguntas do envio antigo'
);
select throws_ok(
  $$ select public.send_partner_form_template(
    (select id from public.partner_form_templates where title='Check-in atualizado'),
    array['f1000000-0000-4000-8000-000000000302'::uuid],
    null,null,'f1000000-0000-4000-8000-000000000902'
  ) $$,
  '42501',null,'Parceiro nao envia para Cliente alheio'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','f1000000-0000-4000-8000-000000000003',true);
insert into public.partner_form_responses (id,assignment_client_id,assignment_id,partner_id,patient_id,status)
select
  'f1000000-0000-4000-8000-000000000911',
  assigned.id,
  assigned.assignment_id,
  assigned.partner_id,
  assigned.patient_id,
  'in_progress'
from public.partner_form_assignment_clients assigned
where assigned.patient_id='f1000000-0000-4000-8000-000000000301';
insert into public.partner_form_response_answers (response_id,question_id,partner_id,patient_id,value_json)
select
  'f1000000-0000-4000-8000-000000000911',
  question.id,
  'f1000000-0000-4000-8000-000000000201',
  'f1000000-0000-4000-8000-000000000301',
  '{"value":"Tudo bem"}'::jsonb
from public.partner_form_questions question
where question.id=(
  select (template_snapshot->'questions'->0->>'id')::uuid
  from public.partner_form_assignments
  where request_key='f1000000-0000-4000-8000-000000000901'
);
select is((select count(*)::integer from public.partner_form_responses),1,'Cliente correto visualiza seu envio');
select is((select count(*)::integer from public.partner_form_response_answers),1,'Cliente correto visualiza sua resposta');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','f1000000-0000-4000-8000-000000000004',true);
select is((select count(*)::integer from public.partner_form_responses),0,'Outro Cliente nao visualiza a resposta');
select is((select count(*)::integer from public.partner_form_response_answers),0,'Outro Cliente nao visualiza respostas alheias');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','f1000000-0000-4000-8000-000000000002',true);
select is((select count(*)::integer from public.partner_form_templates where title='Check-in atualizado'),0,'RLS oculta modelos de outro parceiro');
select is((select count(*)::integer from public.partner_form_assignments),0,'RLS oculta envios de outro parceiro');
select is((select count(*)::integer from public.partner_form_template_versions),0,'RLS oculta versoes de outro parceiro');
select is(public.complete_partner_client_profile('f1000000-0000-4000-8000-000000000301',(current_date - interval '30 years')::date,'male','Outro'),false,'Parceiro nao completa Cliente alheio');

select * from finish();
rollback;
