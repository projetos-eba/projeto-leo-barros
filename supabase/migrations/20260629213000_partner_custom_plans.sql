-- Planos personalizados ofertados pelo parceiro aos seus clientes.
-- Essa camada fica separada dos billing_plans da plataforma, que cobram o parceiro.

create table public.partner_custom_plans (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  name text not null,
  description text,
  billing_interval text not null default 'monthly',
  price_cents integer not null,
  currency text not null default 'brl',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_custom_plans_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_custom_plans_partner_id_id_key unique (partner_id, id),
  constraint partner_custom_plans_name_not_blank check (length(btrim(name)) > 0),
  constraint partner_custom_plans_description_not_blank check (description is null or length(btrim(description)) > 0),
  constraint partner_custom_plans_billing_interval_check check (billing_interval in ('monthly', 'quarterly', 'yearly')),
  constraint partner_custom_plans_price_cents_check check (price_cents >= 0),
  constraint partner_custom_plans_currency_check check (currency ~ '^[a-z]{3}$')
);

create table public.partner_client_plan_subscriptions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  custom_plan_id uuid not null,
  status text not null default 'active',
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_plan_subscriptions_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_plan_subscriptions_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_plan_subscriptions_custom_plan_id_fkey
    foreign key (custom_plan_id) references public.partner_custom_plans(id) on delete restrict,
  constraint partner_client_plan_subscriptions_status_check
    check (status in ('pending', 'active', 'past_due', 'canceled', 'ended')),
  constraint partner_client_plan_subscriptions_period_check
    check (current_period_end > current_period_start),
  constraint partner_client_plan_subscriptions_canceled_at_check
    check ((status = 'canceled' and canceled_at is not null) or (status <> 'canceled')),
  constraint partner_client_plan_subscriptions_partner_plan_match
    foreign key (partner_id, custom_plan_id) references public.partner_custom_plans(partner_id, id) on delete restrict
);

create index partner_custom_plans_partner_active_idx
  on public.partner_custom_plans (partner_id, is_active, created_at desc);

create index partner_client_plan_subscriptions_partner_status_period_idx
  on public.partner_client_plan_subscriptions (partner_id, status, current_period_end);

create index partner_client_plan_subscriptions_patient_status_idx
  on public.partner_client_plan_subscriptions (patient_id, status);

create unique index partner_client_plan_subscriptions_active_plan_patient_key
  on public.partner_client_plan_subscriptions (partner_id, patient_id, custom_plan_id)
  where status in ('pending', 'active', 'past_due');

create trigger partner_custom_plans_set_updated_at
before update on public.partner_custom_plans
for each row execute function public.set_updated_at();

create trigger partner_client_plan_subscriptions_set_updated_at
before update on public.partner_client_plan_subscriptions
for each row execute function public.set_updated_at();

alter table public.partner_custom_plans enable row level security;
alter table public.partner_client_plan_subscriptions enable row level security;

revoke all on table public.partner_custom_plans from public, anon, authenticated;
revoke all on table public.partner_client_plan_subscriptions from public, anon, authenticated;

grant select, insert, update on table public.partner_custom_plans to authenticated;
grant select, insert, update on table public.partner_client_plan_subscriptions to authenticated;

grant select, insert, update, delete on table public.partner_custom_plans to service_role;
grant select, insert, update, delete on table public.partner_client_plan_subscriptions to service_role;

create policy partner_custom_plans_select_active_admin
on public.partner_custom_plans
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy partner_custom_plans_select_own_partner
on public.partner_custom_plans
for select
to authenticated
using (partner_id = public.current_active_partner_id());

create policy partner_custom_plans_insert_own_partner
on public.partner_custom_plans
for insert
to authenticated
with check (partner_id = public.current_active_partner_id());

create policy partner_custom_plans_update_own_partner
on public.partner_custom_plans
for update
to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());

create policy partner_client_plan_subscriptions_select_active_admin
on public.partner_client_plan_subscriptions
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy partner_client_plan_subscriptions_select_own_partner
on public.partner_client_plan_subscriptions
for select
to authenticated
using (partner_id = public.current_active_partner_id());

create policy partner_client_plan_subscriptions_select_own_patient
on public.partner_client_plan_subscriptions
for select
to authenticated
using (patient_id = public.current_active_patient_id());

create policy partner_client_plan_subscriptions_insert_own_partner
on public.partner_client_plan_subscriptions
for insert
to authenticated
with check (partner_id = public.current_active_partner_id());

create policy partner_client_plan_subscriptions_update_own_partner
on public.partner_client_plan_subscriptions
for update
to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());

comment on table public.partner_custom_plans
is 'Planos personalizados criados por Parceiros para ofertar aos seus clientes, separados dos planos comerciais da plataforma.';

comment on table public.partner_client_plan_subscriptions
is 'Assinaturas de clientes em planos personalizados do Parceiro, com período vigente e base para renovações.';
