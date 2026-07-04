begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_function('public', 'client_evolution_dashboard', array['date', 'date'], 'RPC Minha Evolução do Cliente existe');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'ce100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'client-evolution-partner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ce100000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'client-evolution-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ce100000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'client-evolution-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status)
values
  ('ce100000-0000-4000-8000-000000000101', 'ce100000-0000-4000-8000-000000000001', 'client-evolution-partner@example.invalid', 'Parceiro Evolução', 'parceiro', 'active'),
  ('ce100000-0000-4000-8000-000000000102', 'ce100000-0000-4000-8000-000000000002', 'client-evolution-a@example.invalid', 'Cliente Evolução A', 'cliente', 'active'),
  ('ce100000-0000-4000-8000-000000000103', 'ce100000-0000-4000-8000-000000000003', 'client-evolution-b@example.invalid', 'Cliente Evolução B', 'cliente', 'active');

insert into public.partners (id, profile_id, professional_name, professional_type)
values ('ce100000-0000-4000-8000-000000000201', 'ce100000-0000-4000-8000-000000000101', 'Parceiro Evolução', 'nutricionista');

insert into public.patients (id, profile_id)
values
  ('ce100000-0000-4000-8000-000000000301', 'ce100000-0000-4000-8000-000000000102'),
  ('ce100000-0000-4000-8000-000000000302', 'ce100000-0000-4000-8000-000000000103');

insert into public.partner_clients (partner_id, patient_id, service_scope, status, started_at)
values
  ('ce100000-0000-4000-8000-000000000201', 'ce100000-0000-4000-8000-000000000301', 'dieta', 'active', current_date - interval '30 days'),
  ('ce100000-0000-4000-8000-000000000201', 'ce100000-0000-4000-8000-000000000301', 'treino', 'active', current_date - interval '30 days');

insert into public.partner_client_photo_sessions (id, partner_id, patient_id, captured_at, title)
values (
  'ce100000-0000-4000-8000-000000000401',
  'ce100000-0000-4000-8000-000000000201',
  'ce100000-0000-4000-8000-000000000301',
  now() - interval '10 days',
  'Sessão Cliente A'
);

insert into public.partner_client_photo_items (
  id, session_id, partner_id, patient_id, angle, storage_path, original_filename,
  mime_type, size_bytes, width_px, height_px
)
values (
  'ce100000-0000-4000-8000-000000000501',
  'ce100000-0000-4000-8000-000000000401',
  'ce100000-0000-4000-8000-000000000201',
  'ce100000-0000-4000-8000-000000000301',
  'front',
  'ce100000-0000-4000-8000-000000000201/ce100000-0000-4000-8000-000000000301/session/front.png',
  'front.png',
  'image/png',
  1000,
  900,
  1200
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ce100000-0000-4000-8000-000000000002', true);

select isnt(public.client_evolution_dashboard(), null, 'Cliente autenticado recebe a própria página Minha Evolução');
select is(
  jsonb_array_length(public.client_evolution_dashboard()->'photos'->'sessions'),
  1,
  'Cliente lê as próprias sessões de fotos'
);
select is((select count(*)::integer from public.partner_client_photo_items), 1, 'Cliente lê o próprio item de foto via RLS');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ce100000-0000-4000-8000-000000000003', true);

select is(public.client_evolution_dashboard()->'client'->>'id', 'ce100000-0000-4000-8000-000000000302', 'Outro Cliente recebe apenas o próprio painel');
select is(
  jsonb_array_length(public.client_evolution_dashboard()->'photos'->'sessions'),
  0,
  'Outro Cliente não recebe sessões de fotos alheias no painel'
);
select is((select count(*)::integer from public.partner_client_photo_items), 0, 'Outro Cliente não lê fotos alheias');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ce100000-0000-4000-8000-000000000001', true);

select is((select count(*)::integer from public.partner_client_photo_items), 1, 'Parceiro mantém acesso existente às fotos do Cliente');

select * from finish();

rollback;
