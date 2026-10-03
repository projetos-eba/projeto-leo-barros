begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'e1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'removal-partner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'removal-partner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000000000', 'e1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'removal-client@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status)
values
  ('e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000001', 'removal-partner-a@example.invalid', 'Parceiro Remoção A', 'parceiro', 'active'),
  ('e1000000-0000-4000-8000-000000000102', 'e1000000-0000-4000-8000-000000000002', 'removal-partner-b@example.invalid', 'Parceiro Remoção B', 'parceiro', 'active'),
  ('e1000000-0000-4000-8000-000000000103', 'e1000000-0000-4000-8000-000000000003', 'removal-client@example.invalid', 'Cliente Remoção', 'cliente', 'active');

insert into public.partners (id, profile_id, professional_name, professional_type)
values
  ('e1000000-0000-4000-8000-000000000201', 'e1000000-0000-4000-8000-000000000101', 'Parceiro Remoção A', 'personal_trainer'),
  ('e1000000-0000-4000-8000-000000000202', 'e1000000-0000-4000-8000-000000000102', 'Parceiro Remoção B', 'nutricionista');

insert into public.patients (id, profile_id, birth_date, objective)
values ('e1000000-0000-4000-8000-000000000301', 'e1000000-0000-4000-8000-000000000103', '2000-01-01', 'Hipertrofia');

insert into public.partner_clients (partner_id, patient_id, service_scope, status)
values
  ('e1000000-0000-4000-8000-000000000201', 'e1000000-0000-4000-8000-000000000301', 'dieta', 'active'),
  ('e1000000-0000-4000-8000-000000000201', 'e1000000-0000-4000-8000-000000000301', 'treino', 'suspended');

select ok(to_regprocedure('public.remove_partner_client(uuid)') is not null, 'RPC de exclusão da carteira existe');
select ok(not has_function_privilege('anon', 'public.remove_partner_client(uuid)', 'execute'), 'anon não pode excluir Cliente');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000002', true);
select is(public.remove_partner_client('e1000000-0000-4000-8000-000000000301'), false, 'outro Parceiro não pode excluir Cliente sem vínculo');
reset role;
select is((select count(*)::integer from public.partner_clients where patient_id = 'e1000000-0000-4000-8000-000000000301' and status <> 'disabled'), 2, 'vínculos permanecem abertos após tentativa de outro Parceiro');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
select is(public.remove_partner_client('e1000000-0000-4000-8000-000000000301'), true, 'Parceiro vinculado encerra a carteira do Cliente');
select ok(not public.current_partner_has_patient_link('e1000000-0000-4000-8000-000000000301'), 'Parceiro não mantém acesso ao Cliente desvinculado');
select is((select count(*)::integer from public.partner_clients_list() where patient_id = 'e1000000-0000-4000-8000-000000000301'), 0, 'Cliente removido não aparece na lista do Parceiro');
reset role;
select is((select count(*)::integer from public.partner_clients where partner_id = 'e1000000-0000-4000-8000-000000000201' and patient_id = 'e1000000-0000-4000-8000-000000000301' and status = 'disabled' and ended_at is not null), 2, 'todos os vínculos do Parceiro são encerrados');
select is((select display_name from public.profiles where id = 'e1000000-0000-4000-8000-000000000103'), 'Cliente Remoção', 'conta do Cliente é preservada');
select is((select objective from public.patients where id = 'e1000000-0000-4000-8000-000000000301'), 'Hipertrofia', 'dados do Cliente são preservados');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
select is(public.remove_partner_client('e1000000-0000-4000-8000-000000000301'), false, 'exclusão repetida é idempotente');

reset role;
select * from finish();
rollback;
