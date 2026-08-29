begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(6);

-- Fixtures inseridas como owner somente para provar que a sessão autenticada não as enxerga.
insert into public.partner_client_plan_contracts (
  id, partner_id, patient_id, plan_name_snapshot, category_snapshot, price_cents_snapshot,
  billing_interval_snapshot, duration_cycles_snapshot, includes_diet_snapshot,
  includes_training_snapshot, start_date, first_due_date, status
) values (
  'f4000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000201',
  'a1000000-0000-4000-8000-000000000306',
  'Contrato não vinculado', 'Teste', 1000, 'monthly', 1, false, false,
  current_date, current_date, 'active'
);

insert into public.partner_client_receivables (
  id, partner_id, patient_id, contract_id, installment_number, amount_cents, due_date, status
) values (
  'f4000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000201',
  'a1000000-0000-4000-8000-000000000306',
  'f4000000-0000-4000-8000-000000000001', 1, 1000, current_date, 'pending'
);

insert into public.partner_client_anamnesis_entries (
  id, partner_id, patient_id, title, content, version_number, created_by_profile_id
) values (
  'f4000000-0000-4000-8000-000000000003',
  'a1000000-0000-4000-8000-000000000201',
  'a1000000-0000-4000-8000-000000000306',
  'Anamnese não vinculada', 'Fixture de privacidade', 1,
  'a1000000-0000-4000-8000-000000000101'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);

select is(
  (select count(*)::integer from public.partner_client_plan_contracts where id = 'f4000000-0000-4000-8000-000000000001'),
  0,
  'Parceiro não lê contrato financeiro de Cliente sem vínculo ativo'
);

select is(
  (select count(*)::integer from public.partner_client_receivables where id = 'f4000000-0000-4000-8000-000000000002'),
  0,
  'Parceiro não lê recebível de Cliente sem vínculo ativo'
);

select throws_ok(
  $$
    insert into public.partner_client_plan_contracts (
      partner_id, patient_id, plan_name_snapshot, category_snapshot, price_cents_snapshot,
      billing_interval_snapshot, duration_cycles_snapshot, includes_diet_snapshot,
      includes_training_snapshot, start_date, first_due_date, status
    ) values (
      'a1000000-0000-4000-8000-000000000201',
      'a1000000-0000-4000-8000-000000000306',
      'Mutação bloqueada', 'Teste', 1000, 'monthly', 1, false, false,
      current_date, current_date, 'active'
    )
  $$,
  '42501', null,
  'Parceiro não cria contrato financeiro para Cliente sem vínculo ativo'
);

select throws_ok(
  $$
    insert into public.partner_client_receivables (
      partner_id, patient_id, contract_id, installment_number, amount_cents, due_date, status
    ) values (
      'a1000000-0000-4000-8000-000000000201',
      'a1000000-0000-4000-8000-000000000306',
      'f4000000-0000-4000-8000-000000000001', 2, 1000, current_date, 'pending'
    )
  $$,
  '42501', null,
  'Parceiro não cria recebível financeiro para Cliente sem vínculo ativo'
);

select is(
  (select count(*)::integer from public.partner_client_anamnesis_entries where id = 'f4000000-0000-4000-8000-000000000003'),
  0,
  'Workspace clínico não lê anamnese de Cliente sem vínculo ativo'
);

select is(
  public.partner_client_overview('ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid),
  null::jsonb,
  'RPC clínica/visão geral retorna null para Cliente sem vínculo'
);

reset role;
select * from finish();
rollback;
