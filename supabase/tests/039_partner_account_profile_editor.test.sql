begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'e2000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'account-partner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e2000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'account-partner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status, phone)
values
  ('e2000000-0000-4000-8000-000000000101', 'e2000000-0000-4000-8000-000000000001', 'account-partner-a@example.invalid', 'Parceiro Conta A', 'parceiro', 'active', '+5511999990001'),
  ('e2000000-0000-4000-8000-000000000102', 'e2000000-0000-4000-8000-000000000002', 'account-partner-b@example.invalid', 'Parceiro Conta B', 'parceiro', 'active', '+5511999990002');

insert into public.partners (id, profile_id, professional_name, professional_type, professional_registry_type, professional_registry_number)
values
  ('e2000000-0000-4000-8000-000000000201', 'e2000000-0000-4000-8000-000000000101', 'Parceiro Conta A', 'personal_trainer', 'cref', '1001-G/SP'),
  ('e2000000-0000-4000-8000-000000000202', 'e2000000-0000-4000-8000-000000000102', 'Parceiro Conta B', 'nutricionista', null, null);

select ok(to_regprocedure('public.get_partner_account_profile()') is not null, 'RPC de leitura da conta existe');
select ok(to_regprocedure('public.update_partner_account_profile(text,text,text,text,text)') is not null, 'RPC de atualização da conta existe');
select ok(not has_function_privilege('anon', 'public.update_partner_account_profile(text,text,text,text,text)', 'execute'), 'anon não pode atualizar conta');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'e2000000-0000-4000-8000-000000000001', true);
select is(public.get_partner_account_profile()->>'email', 'account-partner-a@example.invalid', 'leitura retorna e-mail para consulta');
select is(public.update_partner_account_profile('Conta Atualizada', '+5511988887777', 'nutricionista', 'crn', '2002/SP'), true, 'Parceiro atualiza seus dados');
reset role;

select is((select display_name from public.profiles where id = 'e2000000-0000-4000-8000-000000000101'), 'Conta Atualizada', 'nome do profile é atualizado');
select is((select email from public.profiles where id = 'e2000000-0000-4000-8000-000000000101'), 'account-partner-a@example.invalid', 'e-mail permanece inalterado');
select is((select phone from public.profiles where id = 'e2000000-0000-4000-8000-000000000101'), '+5511988887777', 'telefone permanece normalizado com DDI');
select is((select professional_name from public.partners where id = 'e2000000-0000-4000-8000-000000000201'), 'Conta Atualizada', 'nome profissional acompanha o nome da conta');
select is((select professional_type from public.partners where id = 'e2000000-0000-4000-8000-000000000201'), 'nutricionista', 'tipo profissional é atualizado');
select is((select professional_registry_type from public.partners where id = 'e2000000-0000-4000-8000-000000000201'), 'crn', 'tipo de registro é atualizado');
select is((select professional_registry_number from public.partners where id = 'e2000000-0000-4000-8000-000000000201'), '2002/SP', 'número de registro é atualizado');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'e2000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select public.update_partner_account_profile('X', '5511988887777', 'medico', '', '')$$,
  '22023',
  'invalid partner account data',
  'validação rejeita telefone sem formato E.164'
);
select is(public.update_partner_account_profile('Conta B Atualizada', '', 'medico', '', ''), true, 'segundo Parceiro atualiza somente a própria conta');
reset role;

select is((select display_name from public.profiles where id = 'e2000000-0000-4000-8000-000000000101'), 'Conta Atualizada', 'Parceiro B não altera o profile do Parceiro A');
select is((select display_name from public.profiles where id = 'e2000000-0000-4000-8000-000000000102'), 'Conta B Atualizada', 'profile do Parceiro B é atualizado');

select * from finish();
rollback;
