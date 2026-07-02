begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_table('public', 'partner_materials', 'biblioteca de materiais existe');
select has_table('public', 'partner_material_shares', 'compartilhamentos de materiais existem');
select has_table('public', 'partner_material_events', 'histórico de materiais existe');
select is(
  (select public from storage.buckets where id = 'partner-materials'),
  false,
  'bucket de materiais é privado'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'ae100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'materials-partner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ae100000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'materials-partner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ae100000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'materials-client-linked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ae100000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'materials-client-unlinked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status)
values
  ('ae100000-0000-4000-8000-000000000101', 'ae100000-0000-4000-8000-000000000001', 'materials-partner-a@example.invalid', 'Materiais Parceiro A', 'parceiro', 'active'),
  ('ae100000-0000-4000-8000-000000000102', 'ae100000-0000-4000-8000-000000000002', 'materials-partner-b@example.invalid', 'Materiais Parceiro B', 'parceiro', 'active'),
  ('ae100000-0000-4000-8000-000000000103', 'ae100000-0000-4000-8000-000000000003', 'materials-client-linked@example.invalid', 'Cliente Vinculado', 'cliente', 'active'),
  ('ae100000-0000-4000-8000-000000000104', 'ae100000-0000-4000-8000-000000000004', 'materials-client-unlinked@example.invalid', 'Cliente Sem Vínculo', 'cliente', 'active');

insert into public.partners (id, profile_id, professional_name, professional_type)
values
  ('ae100000-0000-4000-8000-000000000201', 'ae100000-0000-4000-8000-000000000101', 'Materiais Parceiro A', 'nutricionista'),
  ('ae100000-0000-4000-8000-000000000202', 'ae100000-0000-4000-8000-000000000102', 'Materiais Parceiro B', 'personal_trainer');

insert into public.patients (id, profile_id)
values
  ('ae100000-0000-4000-8000-000000000301', 'ae100000-0000-4000-8000-000000000103'),
  ('ae100000-0000-4000-8000-000000000302', 'ae100000-0000-4000-8000-000000000104');

insert into public.partner_clients (partner_id, patient_id, service_scope, status)
values ('ae100000-0000-4000-8000-000000000201', 'ae100000-0000-4000-8000-000000000301', 'dieta', 'active');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ae100000-0000-4000-8000-000000000001', true);

insert into public.partner_materials (
  id, partner_id, title, description, category, material_kind, file_type,
  original_filename, mime_type, size_bytes, storage_path, tags
)
values (
  'ae100000-0000-4000-8000-000000000401',
  'ae100000-0000-4000-8000-000000000201',
  'Guia autorizado',
  'Material de teste',
  'nutricao',
  'file',
  'pdf',
  'guia.pdf',
  'application/pdf',
  1000,
  'ae100000-0000-4000-8000-000000000201/ae100000-0000-4000-8000-000000000401/guia.pdf',
  array['guia']
);

insert into public.partner_material_shares (
  partner_id, material_id, patient_id, message
)
values (
  'ae100000-0000-4000-8000-000000000201',
  'ae100000-0000-4000-8000-000000000401',
  'ae100000-0000-4000-8000-000000000301',
  'Leia antes da próxima consulta.'
);

insert into public.partner_material_events (
  partner_id, material_id, patient_id, event_type
)
values (
  'ae100000-0000-4000-8000-000000000201',
  'ae100000-0000-4000-8000-000000000401',
  'ae100000-0000-4000-8000-000000000301',
  'shared'
);

select is((select count(*)::integer from public.partner_materials), 1, 'parceiro cria material próprio');
select is((select count(*)::integer from public.partner_material_shares), 1, 'parceiro compartilha com Cliente vinculado');

select throws_ok(
  $$
    insert into public.partner_material_shares (
      partner_id, material_id, patient_id
    )
    values (
      'ae100000-0000-4000-8000-000000000201',
      'ae100000-0000-4000-8000-000000000401',
      'ae100000-0000-4000-8000-000000000302'
    )
  $$,
  '42501',
  null,
  'parceiro não compartilha com Cliente sem vínculo'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ae100000-0000-4000-8000-000000000002', true);

select is((select count(*)::integer from public.partner_materials), 0, 'outro parceiro não lê materiais');
select is((select count(*)::integer from public.partner_material_shares), 0, 'outro parceiro não lê compartilhamentos');
select is((select count(*)::integer from public.partner_material_events), 0, 'outro parceiro não lê histórico');

select * from finish();

rollback;
