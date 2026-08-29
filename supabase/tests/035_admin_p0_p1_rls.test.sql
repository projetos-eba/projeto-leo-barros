begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(8);

-- O seed local já cria o Admin ativo com o primeiro user_id conhecido.
insert into public.admin_role_assignments (profile_id, role_key)
values ('a2000000-0000-4000-8000-000000000101', 'owner')
on conflict (profile_id) do update set role_key = excluded.role_key;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-8000-000000000001', true);

select ok(public.admin_has_capability('audit.read'), 'Owner lê auditoria');
select ok(public.admin_has_capability('security.read'), 'Owner lê segurança');
select ok(public.admin_has_capability('subscription.cancel.manage'), 'Owner administra cancelamento');
select lives_ok($$ select * from public.admin_security_sessions(null, 1) $$, 'RPC de sessões sanitizadas está disponível para Owner');
select lives_ok($$ select * from public.admin_security_auth_events(null, 1) $$, 'RPC de eventos sanitizados está disponível para Owner');

select throws_ok(
  $$ insert into public.admin_audit_events (actor_profile_id, action_key, resource_type, outcome, metadata) values ('a2000000-0000-4000-8000-000000000101', 'test.audit', 'test', 'succeeded', '{}'::jsonb) $$,
  '42501', null,
  'Auditoria é append-only e não aceita escrita direta autenticada'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000003', true);

select is(public.admin_has_capability('audit.read'), false, 'Não-Admin não recebe capability de auditoria');
select throws_ok($$ select * from public.admin_security_sessions(null, 1) $$, 'P0001', 'ADMIN_SECURITY_FORBIDDEN', 'Não-Admin não lê sessões');

reset role;
select * from finish();
rollback;
