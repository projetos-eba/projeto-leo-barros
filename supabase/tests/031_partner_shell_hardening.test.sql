begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

select has_function('public', 'create_partner_protocol_use_draft', array['text', 'uuid', 'uuid', 'text', 'text'], 'uso de protocolo é transacional');
select has_function('public', 'save_partner_client_prescription_note', array['uuid', 'text', 'text', 'text', 'text', 'text', 'text'], 'prescrição é versionada no banco');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'b1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'hardening-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000000', 'b1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'hardening-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000000', 'b1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'hardening-client@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status)
values
  ('b1000000-0000-4000-8000-000000000101', 'b1000000-0000-4000-8000-000000000001', 'hardening-a@example.invalid', 'Hardening A', 'parceiro', 'active'),
  ('b1000000-0000-4000-8000-000000000102', 'b1000000-0000-4000-8000-000000000002', 'hardening-b@example.invalid', 'Hardening B', 'parceiro', 'active'),
  ('b1000000-0000-4000-8000-000000000103', 'b1000000-0000-4000-8000-000000000003', 'hardening-client@example.invalid', 'Hardening Client', 'cliente', 'active');

insert into public.partners (id, profile_id, professional_name, professional_type)
values
  ('b1000000-0000-4000-8000-000000000201', 'b1000000-0000-4000-8000-000000000101', 'Hardening A', 'nutricionista'),
  ('b1000000-0000-4000-8000-000000000202', 'b1000000-0000-4000-8000-000000000102', 'Hardening B', 'personal_trainer');
insert into public.patients (id, profile_id) values ('b1000000-0000-4000-8000-000000000301', 'b1000000-0000-4000-8000-000000000103');
insert into public.partner_clients (partner_id, patient_id, service_scope, status)
values ('b1000000-0000-4000-8000-000000000201', 'b1000000-0000-4000-8000-000000000301', 'dieta', 'active');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
insert into public.partner_protocol_foods (id, partner_id, name, category, source, kcal, carbs_g, protein_g, fat_g)
values ('b1000000-0000-4000-8000-000000000401', 'b1000000-0000-4000-8000-000000000201', 'Alimento atômico', 'cereal', 'custom', 100, 20, 4, 1);

select lives_ok(
  $$ select public.create_partner_protocol_use_draft('food', 'b1000000-0000-4000-8000-000000000401', 'b1000000-0000-4000-8000-000000000301', 'dieta', null) $$,
  'primeiro uso de protocolo é persistido'
);
select lives_ok(
  $$ select public.create_partner_protocol_use_draft('food', 'b1000000-0000-4000-8000-000000000401', 'b1000000-0000-4000-8000-000000000301', 'dieta', null) $$,
  'segundo uso concorrente lógico é persistido'
);
select is((select usage_count from public.partner_protocol_foods where id = 'b1000000-0000-4000-8000-000000000401'), 2, 'incrementos não perdem atualizações');
select is((select count(*)::integer from public.partner_protocol_use_drafts where partner_id = 'b1000000-0000-4000-8000-000000000201'), 2, 'cada incremento possui rascunho correspondente');

select lives_ok(
  $$ select public.save_partner_client_prescription_note('b1000000-0000-4000-8000-000000000301', 'Prescrição A', 'Resumo A', 'Conteúdo A válido', null, 'nutrition', 'draft') $$,
  'prescrição é salva para Cliente vinculado'
);
select is((select version_number from public.partner_client_prescription_notes where partner_id = 'b1000000-0000-4000-8000-000000000201'), 1, 'primeira prescrição inicia na versão um');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.partner_client_prescription_notes), 0, 'outro parceiro não lê prescrições');
select throws_ok(
  $$ select public.create_partner_protocol_use_draft('food', 'b1000000-0000-4000-8000-000000000401', null, 'rascunho', null) $$,
  'P0002', null, 'outro parceiro não incrementa item alheio'
);

select * from finish();
rollback;
