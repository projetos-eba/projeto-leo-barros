begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'ac100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'assessments-partner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ac100000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'assessments-partner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ac100000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'assessments-client@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ac100000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'assessments-admin@example.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status)
values
  ('ac100000-0000-4000-8000-000000000101', 'ac100000-0000-4000-8000-000000000001', 'assessments-partner-a@example.invalid', 'Parceiro Avaliações A', 'parceiro', 'active'),
  ('ac100000-0000-4000-8000-000000000102', 'ac100000-0000-4000-8000-000000000002', 'assessments-partner-b@example.invalid', 'Parceiro Avaliações B', 'parceiro', 'active'),
  ('ac100000-0000-4000-8000-000000000103', 'ac100000-0000-4000-8000-000000000003', 'assessments-client@example.invalid', 'Cliente Avaliações', 'cliente', 'active'),
  ('ac100000-0000-4000-8000-000000000104', 'ac100000-0000-4000-8000-000000000004', 'assessments-admin@example.invalid', 'Admin Avaliações', 'admin', 'active');

insert into public.partners (id, profile_id, professional_name, professional_type)
values
  ('ac100000-0000-4000-8000-000000000201', 'ac100000-0000-4000-8000-000000000101', 'Parceiro Avaliações A', 'personal_trainer'),
  ('ac100000-0000-4000-8000-000000000202', 'ac100000-0000-4000-8000-000000000102', 'Parceiro Avaliações B', 'nutricionista');

insert into public.admins (id, profile_id)
values ('ac100000-0000-4000-8000-000000000203', 'ac100000-0000-4000-8000-000000000104');

insert into public.patients (id, profile_id, cpf, birth_date, objective, gender)
values (
  'ac100000-0000-4000-8000-000000000301',
  'ac100000-0000-4000-8000-000000000103',
  '44444444444',
  current_date - interval '29 years',
  'Hipertrofia',
  'female'
);

insert into public.partner_clients (partner_id, patient_id, service_scope, status)
values (
  'ac100000-0000-4000-8000-000000000201',
  'ac100000-0000-4000-8000-000000000301',
  'treino',
  'active'
);


select ok(not has_function_privilege('anon', 'public.get_partner_client_profile(uuid)', 'execute'), 'anonymous cannot load profiles');
select ok(not has_function_privilege('anon', 'public.update_partner_client_profile(uuid,text,text,date,text,text)', 'execute'), 'anonymous cannot update profiles');
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ac100000-0000-4000-8000-000000000002', true);
select is(public.get_partner_client_profile('ac100000-0000-4000-8000-000000000301'), null::jsonb, 'unlinked partner cannot read');
select is(public.update_partner_client_profile('ac100000-0000-4000-8000-000000000301', 'Changed', '+5511999999999', '2000-01-01', 'female', 'Objetivo'), false, 'unlinked partner cannot update');
select set_config('request.jwt.claim.sub', 'ac100000-0000-4000-8000-000000000001', true);
select ok(not (public.get_partner_client_profile('ac100000-0000-4000-8000-000000000301') ?| array['cpf','profile_id','user_id']), 'editor exposes no private identifiers');
select is(public.update_partner_client_profile('ac100000-0000-4000-8000-000000000301', 'Nome atualizado', '+5511999999999', '2000-01-01', 'female', 'Novo objetivo'), true, 'linked partner can save profile');
select is(public.get_partner_client_profile('ac100000-0000-4000-8000-000000000301')->>'displayName', 'Nome atualizado', 'name updated');
select is(public.get_partner_client_profile('ac100000-0000-4000-8000-000000000301')->>'phone', '+5511999999999', 'phone updated');
select is(public.get_partner_client_profile('ac100000-0000-4000-8000-000000000301')->>'email', 'assessments-client@example.invalid', 'email remains unchanged');
select throws_ok($$select public.update_partner_client_profile('ac100000-0000-4000-8000-000000000301', 'Invalid', '123', '2000-01-01', 'female', 'Objetivo')$$, '22023', 'invalid client profile data', 'invalid phone rejected');
select throws_ok($$select public.update_partner_client_profile('ac100000-0000-4000-8000-000000000301', 'Invalid', null, '2999-01-01', 'female', 'Objetivo')$$, '22023', 'invalid client profile data', 'future date rejected');
reset role;
select is((select phone from public.patients where id='ac100000-0000-4000-8000-000000000301'), '+5511999999999', 'patient phone matches profile phone');
select is((select role from public.profiles where id='ac100000-0000-4000-8000-000000000103'), 'cliente', 'role unchanged');
update public.profiles set status='suspended' where id='ac100000-0000-4000-8000-000000000101';
set local role authenticated;
select is(public.get_partner_client_profile('ac100000-0000-4000-8000-000000000301'), null::jsonb, 'suspended partner cannot load profile');
select is(public.update_partner_client_profile('ac100000-0000-4000-8000-000000000301', 'Changed', null, '2000-01-01', 'female', 'Objetivo'), false, 'suspended partner cannot update');
select * from finish();
rollback;
