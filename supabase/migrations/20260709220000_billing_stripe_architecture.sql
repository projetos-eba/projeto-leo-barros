-- Arquitetura Stripe Billing para planos, mixed intervals e Clientes ativos.

alter table public.billing_plans
  add column if not exists lookup_key text,
  add column if not exists stripe_product_lookup_key text,
  add column if not exists trial_days integer not null default 7,
  add column if not exists sort_order integer not null default 0,
  add column if not exists public_metadata jsonb not null default '{}'::jsonb;

alter table public.billing_plans
  add constraint billing_plans_lookup_key_not_blank
    check (lookup_key is null or length(btrim(lookup_key)) > 0),
  add constraint billing_plans_trial_days_check
    check (trial_days >= 0),
  add constraint billing_plans_public_metadata_object
    check (jsonb_typeof(public_metadata) = 'object');

create unique index if not exists billing_plans_lookup_key_key
  on public.billing_plans (lookup_key)
  where lookup_key is not null;

alter table public.partner_subscriptions
  add column if not exists trial_start timestamptz,
  add column if not exists trial_end timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists default_payment_method_id text,
  add column if not exists latest_invoice_id text,
  add column if not exists stripe_status text,
  add column if not exists active_client_quantity integer not null default 0,
  add column if not exists last_quantity_synced_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.partner_subscriptions
  drop constraint if exists partner_subscriptions_status_check;

alter table public.partner_subscriptions
  add constraint partner_subscriptions_status_check
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'paused')),
  add constraint partner_subscriptions_trial_period_check
    check (trial_end is null or trial_start is null or trial_end > trial_start),
  add constraint partner_subscriptions_active_client_quantity_check
    check (active_client_quantity >= 0),
  add constraint partner_subscriptions_metadata_object
    check (jsonb_typeof(metadata) = 'object'),
  add constraint partner_subscriptions_default_payment_method_not_blank
    check (default_payment_method_id is null or length(btrim(default_payment_method_id)) > 0),
  add constraint partner_subscriptions_latest_invoice_id_not_blank
    check (latest_invoice_id is null or length(btrim(latest_invoice_id)) > 0);

create table if not exists public.billing_plan_addons (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  lookup_key text not null,
  price_cents integer not null,
  currency text not null default 'brl',
  billing_interval text not null default 'monthly',
  stripe_interval text not null default 'month',
  usage_type text not null default 'licensed',
  stripe_product_id text,
  stripe_price_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint billing_plan_addons_slug_key unique (slug),
  constraint billing_plan_addons_lookup_key_key unique (lookup_key),
  constraint billing_plan_addons_slug_not_blank check (length(btrim(slug)) > 0),
  constraint billing_plan_addons_name_not_blank check (length(btrim(name)) > 0),
  constraint billing_plan_addons_lookup_key_not_blank check (length(btrim(lookup_key)) > 0),
  constraint billing_plan_addons_price_cents_check check (price_cents >= 0),
  constraint billing_plan_addons_currency_check check (currency ~ '^[a-z]{3}$'),
  constraint billing_plan_addons_billing_interval_check check (billing_interval = 'monthly'),
  constraint billing_plan_addons_stripe_interval_check check (stripe_interval = 'month'),
  constraint billing_plan_addons_usage_type_check check (usage_type = 'licensed'),
  constraint billing_plan_addons_stripe_product_id_not_blank check (stripe_product_id is null or length(btrim(stripe_product_id)) > 0),
  constraint billing_plan_addons_stripe_price_id_not_blank check (stripe_price_id is null or length(btrim(stripe_price_id)) > 0)
);

create table if not exists public.partner_subscription_items (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.partner_subscriptions(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete restrict,
  item_kind text not null,
  billing_plan_id uuid references public.billing_plans(id) on delete restrict,
  billing_addon_id uuid references public.billing_plan_addons(id) on delete restrict,
  lookup_key text not null,
  stripe_subscription_item_id text,
  quantity integer not null default 1,
  unit_amount_cents integer not null,
  currency text not null default 'brl',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_subscription_items_item_kind_check check (item_kind in ('base_plan', 'active_client_addon')),
  constraint partner_subscription_items_lookup_key_not_blank check (length(btrim(lookup_key)) > 0),
  constraint partner_subscription_items_stripe_id_not_blank check (stripe_subscription_item_id is null or length(btrim(stripe_subscription_item_id)) > 0),
  constraint partner_subscription_items_quantity_check check (quantity >= 0),
  constraint partner_subscription_items_unit_amount_check check (unit_amount_cents >= 0),
  constraint partner_subscription_items_currency_check check (currency ~ '^[a-z]{3}$'),
  constraint partner_subscription_items_reference_check check (
    (item_kind = 'base_plan' and billing_plan_id is not null and billing_addon_id is null)
    or
    (item_kind = 'active_client_addon' and billing_addon_id is not null and billing_plan_id is null)
  )
);

create unique index if not exists partner_subscription_items_kind_key
  on public.partner_subscription_items (subscription_id, item_kind);

create unique index if not exists partner_subscription_items_stripe_key
  on public.partner_subscription_items (stripe_subscription_item_id)
  where stripe_subscription_item_id is not null;

create index if not exists partner_subscription_items_partner_idx
  on public.partner_subscription_items (partner_id, item_kind);

create table if not exists public.billing_active_client_snapshots (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  subscription_id uuid references public.partner_subscriptions(id) on delete set null,
  stripe_subscription_id text,
  stripe_invoice_id text,
  active_client_quantity integer not null,
  unit_amount_cents integer not null default 199,
  amount_cents integer not null,
  reason text not null,
  captured_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,

  constraint billing_active_client_snapshots_quantity_check check (active_client_quantity >= 0),
  constraint billing_active_client_snapshots_unit_amount_check check (unit_amount_cents >= 0),
  constraint billing_active_client_snapshots_amount_check check (amount_cents >= 0),
  constraint billing_active_client_snapshots_reason_check check (reason in ('checkout', 'quantity_sync', 'invoice_finalized', 'manual_reconcile')),
  constraint billing_active_client_snapshots_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists billing_active_client_snapshots_partner_created_idx
  on public.billing_active_client_snapshots (partner_id, captured_at desc);

create index if not exists billing_active_client_snapshots_subscription_idx
  on public.billing_active_client_snapshots (subscription_id, captured_at desc);

create table if not exists public.billing_sync_outbox (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  event_type text not null,
  source_table text not null,
  source_record_id uuid,
  status text not null default 'pending',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  processed_at timestamptz,
  last_error_code text,
  last_error_message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint billing_sync_outbox_event_type_check check (event_type in ('active_client_quantity_changed', 'subscription_reconcile')),
  constraint billing_sync_outbox_source_table_not_blank check (length(btrim(source_table)) > 0),
  constraint billing_sync_outbox_status_check check (status in ('pending', 'processing', 'succeeded', 'failed')),
  constraint billing_sync_outbox_attempts_check check (attempts >= 0),
  constraint billing_sync_outbox_payload_object check (jsonb_typeof(payload) = 'object')
);

create index if not exists billing_sync_outbox_pending_idx
  on public.billing_sync_outbox (status, available_at, created_at)
  where status in ('pending', 'failed');

create unique index if not exists billing_sync_outbox_open_source_key
  on public.billing_sync_outbox (partner_id, event_type, source_table, source_record_id)
  where processed_at is null;

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null,
  event_type text not null,
  api_version text,
  livemode boolean not null default false,
  status text not null default 'processing',
  attempts integer not null default 0,
  partner_id uuid references public.partners(id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_invoice_id text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error_code text,
  last_error_message text,
  payload_summary jsonb not null default '{}'::jsonb,

  constraint stripe_webhook_events_event_id_key unique (stripe_event_id),
  constraint stripe_webhook_events_event_id_not_blank check (length(btrim(stripe_event_id)) > 0),
  constraint stripe_webhook_events_event_type_not_blank check (length(btrim(event_type)) > 0),
  constraint stripe_webhook_events_status_check check (status in ('processing', 'succeeded', 'failed', 'ignored')),
  constraint stripe_webhook_events_payload_summary_object check (jsonb_typeof(payload_summary) = 'object')
);

create index if not exists stripe_webhook_events_status_idx
  on public.stripe_webhook_events (status, received_at desc);

create table if not exists public.partner_billing_trial_usage (
  partner_id uuid primary key references public.partners(id) on delete restrict,
  first_subscription_id uuid references public.partner_subscriptions(id) on delete set null,
  used_at timestamptz not null default now(),
  stripe_subscription_id text,
  created_at timestamptz not null default now(),

  constraint partner_billing_trial_usage_stripe_subscription_not_blank
    check (stripe_subscription_id is null or length(btrim(stripe_subscription_id)) > 0)
);

create trigger billing_plan_addons_set_updated_at
before update on public.billing_plan_addons
for each row execute function public.set_updated_at();

create trigger partner_subscription_items_set_updated_at
before update on public.partner_subscription_items
for each row execute function public.set_updated_at();

create trigger billing_sync_outbox_set_updated_at
before update on public.billing_sync_outbox
for each row execute function public.set_updated_at();

create or replace function public.billing_active_client_count(target_partner_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select count(distinct relationship.patient_id)::integer
  from public.partner_clients as relationship
  where relationship.partner_id = target_partner_id
    and relationship.status = 'active';
$$;

create or replace function public.billing_public_plans()
returns table (
  slug text,
  name text,
  billing_interval text,
  price_cents integer,
  currency text,
  trial_days integer,
  lookup_key text,
  active_client_unit_cents integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    plan.slug,
    plan.name,
    plan.billing_interval,
    plan.price_cents,
    plan.currency,
    plan.trial_days,
    plan.lookup_key,
    199 as active_client_unit_cents
  from public.billing_plans as plan
  where plan.is_active = true
    and plan.slug in ('complete-monthly', 'complete-annual')
  order by plan.sort_order, plan.price_cents;
$$;

create or replace function public.billing_partner_trial_available(target_partner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select not exists (
    select 1
    from public.partner_billing_trial_usage as trial_usage
    where trial_usage.partner_id = target_partner_id
  );
$$;

create or replace function public.enqueue_partner_client_billing_sync()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected_partner_id uuid;
  affected_record_id uuid;
  event_payload jsonb;
begin
  affected_partner_id := coalesce(new.partner_id, old.partner_id);
  affected_record_id := coalesce(new.id, old.id);

  if affected_partner_id is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'UPDATE'
     and new.partner_id = old.partner_id
     and new.patient_id = old.patient_id
     and new.status = old.status then
    return new;
  end if;

  event_payload := jsonb_build_object(
    'operation', tg_op,
    'current_quantity', public.billing_active_client_count(affected_partner_id)
  );

  begin
    insert into public.billing_sync_outbox (
      partner_id,
      event_type,
      source_table,
      source_record_id,
      payload
    )
    values (
      affected_partner_id,
      'active_client_quantity_changed',
      'partner_clients',
      affected_record_id,
      event_payload
    );
  exception
    when unique_violation then
      update public.billing_sync_outbox
      set
        status = 'pending',
        available_at = now(),
        payload = event_payload,
        updated_at = now()
      where partner_id = affected_partner_id
        and event_type = 'active_client_quantity_changed'
        and source_table = 'partner_clients'
        and source_record_id = affected_record_id
        and processed_at is null;
  end;

  return coalesce(new, old);
end;
$$;

drop trigger if exists partner_clients_billing_sync_outbox on public.partner_clients;
create trigger partner_clients_billing_sync_outbox
after insert or update of partner_id, patient_id, status or delete on public.partner_clients
for each row execute function public.enqueue_partner_client_billing_sync();

alter table public.billing_plan_addons enable row level security;
alter table public.partner_subscription_items enable row level security;
alter table public.billing_active_client_snapshots enable row level security;
alter table public.billing_sync_outbox enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.partner_billing_trial_usage enable row level security;

revoke all on table public.billing_plan_addons from public, anon, authenticated;
revoke all on table public.partner_subscription_items from public, anon, authenticated;
revoke all on table public.billing_active_client_snapshots from public, anon, authenticated;
revoke all on table public.billing_sync_outbox from public, anon, authenticated;
revoke all on table public.stripe_webhook_events from public, anon, authenticated;
revoke all on table public.partner_billing_trial_usage from public, anon, authenticated;

grant select on table public.billing_plan_addons to authenticated;
grant select on table public.partner_subscription_items to authenticated;
grant select on table public.billing_active_client_snapshots to authenticated;
grant select on table public.partner_billing_trial_usage to authenticated;

grant select, insert, update, delete on table public.billing_plan_addons to service_role;
grant select, insert, update, delete on table public.partner_subscription_items to service_role;
grant select, insert, update, delete on table public.billing_active_client_snapshots to service_role;
grant select, insert, update, delete on table public.billing_sync_outbox to service_role;
grant select, insert, update, delete on table public.stripe_webhook_events to service_role;
grant select, insert, update, delete on table public.partner_billing_trial_usage to service_role;

grant execute on function public.billing_active_client_count(uuid) to authenticated, service_role;
grant execute on function public.billing_public_plans() to anon, authenticated, service_role;
grant execute on function public.billing_partner_trial_available(uuid) to authenticated, service_role;

create policy billing_plan_addons_select_active_or_admin
on public.billing_plan_addons
for select
to authenticated
using (is_active or public.current_active_admin_id() is not null);

create policy partner_subscription_items_select_admin
on public.partner_subscription_items
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy partner_subscription_items_select_own_partner
on public.partner_subscription_items
for select
to authenticated
using (partner_id = public.current_active_partner_id());

create policy billing_active_client_snapshots_select_admin
on public.billing_active_client_snapshots
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy billing_active_client_snapshots_select_own_partner
on public.billing_active_client_snapshots
for select
to authenticated
using (partner_id = public.current_active_partner_id());

create policy partner_billing_trial_usage_select_admin
on public.partner_billing_trial_usage
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy partner_billing_trial_usage_select_own_partner
on public.partner_billing_trial_usage
for select
to authenticated
using (partner_id = public.current_active_partner_id());

comment on function public.billing_active_client_count(uuid)
is 'Fonte canonica de Clientes unicos ativos faturaveis: count(distinct patient_id) em partner_clients status active.';

comment on table public.billing_sync_outbox
is 'Outbox transacional para reconciliar quantidade faturavel de Clientes ativos com Stripe sem depender do frontend.';

comment on table public.stripe_webhook_events
is 'Ledger idempotente de webhooks Stripe. Guarda somente resumo seguro do evento, sem payload completo sensivel.';
