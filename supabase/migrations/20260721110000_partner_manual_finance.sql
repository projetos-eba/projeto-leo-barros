create table public.partner_service_plans (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  name text not null,
  description text,
  category text not null,
  price_cents integer not null,
  currency text not null default 'brl',
  billing_interval text not null,
  interval_count integer not null default 1,
  duration_cycles integer not null default 1,
  includes_diet boolean not null default false,
  includes_training boolean not null default false,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_service_plans_name_check check (length(btrim(name)) between 2 and 120),
  constraint partner_service_plans_category_check check (length(btrim(category)) between 2 and 80),
  constraint partner_service_plans_price_check check (price_cents > 0),
  constraint partner_service_plans_currency_check check (currency ~ '^[a-z]{3}$'),
  constraint partner_service_plans_billing_interval_check check (billing_interval in ('one_time', 'weekly', 'monthly', 'quarterly', 'custom')),
  constraint partner_service_plans_interval_count_check check (interval_count > 0),
  constraint partner_service_plans_duration_cycles_check check (duration_cycles > 0),
  constraint partner_service_plans_status_check check (status in ('active', 'archived'))
);

create table public.partner_client_plan_contracts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  service_plan_id uuid references public.partner_service_plans(id) on delete restrict,
  plan_name_snapshot text not null,
  category_snapshot text not null,
  price_cents_snapshot integer not null,
  billing_interval_snapshot text not null,
  duration_cycles_snapshot integer not null,
  includes_diet_snapshot boolean not null default false,
  includes_training_snapshot boolean not null default false,
  start_date date not null,
  end_date date,
  first_due_date date not null,
  status text not null default 'active',
  renewal_reminder boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_client_plan_contracts_plan_name_check check (length(btrim(plan_name_snapshot)) between 2 and 120),
  constraint partner_client_plan_contracts_price_check check (price_cents_snapshot > 0),
  constraint partner_client_plan_contracts_billing_interval_check check (billing_interval_snapshot in ('one_time', 'weekly', 'monthly', 'quarterly', 'custom')),
  constraint partner_client_plan_contracts_duration_check check (duration_cycles_snapshot > 0),
  constraint partner_client_plan_contracts_status_check check (status in ('active', 'paused', 'completed', 'cancelled'))
);

create table public.partner_client_receivables (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  contract_id uuid not null references public.partner_client_plan_contracts(id) on delete restrict,
  installment_number integer not null,
  amount_cents integer not null,
  due_date date not null,
  status text not null default 'pending',
  paid_at timestamptz,
  payment_method text,
  payment_reference text,
  payment_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_client_receivables_amount_check check (amount_cents > 0),
  constraint partner_client_receivables_installment_check check (installment_number > 0),
  constraint partner_client_receivables_status_check check (status in ('pending', 'paid', 'cancelled')),
  constraint partner_client_receivables_payment_method_check check (
    payment_method is null
    or payment_method in ('pix_external', 'cash', 'bank_transfer', 'card_external', 'boleto_external', 'other')
  ),
  constraint partner_client_receivables_contract_installment_key unique (contract_id, installment_number)
);

create table public.partner_financial_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid references public.patients(id) on delete restrict,
  service_plan_id uuid references public.partner_service_plans(id) on delete restrict,
  contract_id uuid references public.partner_client_plan_contracts(id) on delete restrict,
  receivable_id uuid references public.partner_client_receivables(id) on delete restrict,
  event_type text not null,
  detail text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint partner_financial_events_type_check check (
    event_type in (
      'plan_created',
      'plan_updated',
      'plan_archived',
      'plan_duplicated',
      'contract_created',
      'contract_paused',
      'contract_completed',
      'contract_cancelled',
      'receivable_created',
      'payment_recorded',
      'payment_reverted',
      'receivable_cancelled'
    )
  ),
  constraint partner_financial_events_detail_check check (length(btrim(detail)) > 0),
  constraint partner_financial_events_metadata_check check (jsonb_typeof(metadata) = 'object')
);

create index partner_service_plans_partner_status_idx
  on public.partner_service_plans (partner_id, status, updated_at desc);

create index partner_client_plan_contracts_partner_patient_idx
  on public.partner_client_plan_contracts (partner_id, patient_id, status, updated_at desc);

create index partner_client_receivables_partner_due_idx
  on public.partner_client_receivables (partner_id, status, due_date);

create index partner_financial_events_partner_created_idx
  on public.partner_financial_events (partner_id, created_at desc);

create trigger partner_service_plans_set_updated_at
before update on public.partner_service_plans
for each row execute function public.set_updated_at();

create trigger partner_client_plan_contracts_set_updated_at
before update on public.partner_client_plan_contracts
for each row execute function public.set_updated_at();

create trigger partner_client_receivables_set_updated_at
before update on public.partner_client_receivables
for each row execute function public.set_updated_at();

alter table public.partner_service_plans enable row level security;
alter table public.partner_client_plan_contracts enable row level security;
alter table public.partner_client_receivables enable row level security;
alter table public.partner_financial_events enable row level security;

revoke all on table public.partner_service_plans, public.partner_client_plan_contracts,
  public.partner_client_receivables, public.partner_financial_events
  from public, anon, authenticated;

grant select, insert, update on table public.partner_service_plans to authenticated;
grant select, insert, update on table public.partner_client_plan_contracts to authenticated;
grant select, insert, update on table public.partner_client_receivables to authenticated;
grant select, insert on table public.partner_financial_events to authenticated;

grant all on table public.partner_service_plans, public.partner_client_plan_contracts,
  public.partner_client_receivables, public.partner_financial_events
  to service_role;

create policy partner_service_plans_own_partner
on public.partner_service_plans for all to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());

create policy partner_client_plan_contracts_own_partner
on public.partner_client_plan_contracts for all to authenticated
using (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
)
with check (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
);

create policy partner_client_receivables_own_partner
on public.partner_client_receivables for all to authenticated
using (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
)
with check (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
);

create policy partner_financial_events_own_partner
on public.partner_financial_events for all to authenticated
using (
  partner_id = public.current_active_partner_id()
  and (patient_id is null or public.current_partner_has_active_patient_link(patient_id))
)
with check (
  partner_id = public.current_active_partner_id()
  and (patient_id is null or public.current_partner_has_active_patient_link(patient_id))
);

comment on table public.partner_service_plans
  is 'Catalogo manual de planos e produtos vendidos pelo profissional aos seus clientes.';
comment on table public.partner_client_plan_contracts
  is 'Snapshot financeiro do plano vinculado manualmente a um cliente do profissional.';
comment on table public.partner_client_receivables
  is 'Parcelas e vencimentos controlados manualmente pelo profissional.';
