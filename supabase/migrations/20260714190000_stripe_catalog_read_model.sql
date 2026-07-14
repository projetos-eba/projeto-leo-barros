-- Read model sincronizado do catalogo comercial Stripe.

create table if not exists public.billing_products (
  id uuid primary key default gen_random_uuid(),
  stripe_product_id text not null,
  catalog_role text not null,
  name text not null,
  description text,
  active boolean not null default true,
  livemode boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  stripe_created_at timestamptz,
  stripe_updated_at timestamptz,
  last_stripe_event_created_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint billing_products_stripe_product_key unique (stripe_product_id),
  constraint billing_products_role_check check (catalog_role in ('complete-plan', 'active-client-addon', 'hml-plan')),
  constraint billing_products_stripe_product_not_blank check (length(btrim(stripe_product_id)) > 0),
  constraint billing_products_name_not_blank check (length(btrim(name)) > 0),
  constraint billing_products_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.billing_prices (
  id uuid primary key default gen_random_uuid(),
  billing_product_id uuid not null references public.billing_products(id) on delete restrict,
  stripe_product_id text not null,
  stripe_price_id text not null,
  lookup_key text,
  currency text not null,
  unit_amount_cents integer,
  unit_amount_decimal text,
  billing_type text not null,
  billing_scheme text not null,
  recurring_interval text,
  recurring_interval_count integer,
  usage_type text,
  tax_behavior text,
  active boolean not null default true,
  livemode boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  stripe_created_at timestamptz,
  stripe_updated_at timestamptz,
  last_stripe_event_created_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint billing_prices_stripe_price_key unique (stripe_price_id),
  constraint billing_prices_stripe_product_not_blank check (length(btrim(stripe_product_id)) > 0),
  constraint billing_prices_stripe_price_not_blank check (length(btrim(stripe_price_id)) > 0),
  constraint billing_prices_lookup_key_not_blank check (lookup_key is null or length(btrim(lookup_key)) > 0),
  constraint billing_prices_currency_check check (currency ~ '^[a-z]{3}$'),
  constraint billing_prices_unit_amount_check check (unit_amount_cents is null or unit_amount_cents >= 0),
  constraint billing_prices_type_check check (billing_type in ('one_time', 'recurring')),
  constraint billing_prices_billing_scheme_not_blank check (length(btrim(billing_scheme)) > 0),
  constraint billing_prices_interval_count_check check (recurring_interval_count is null or recurring_interval_count > 0),
  constraint billing_prices_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists billing_prices_active_lookup_key
  on public.billing_prices (lookup_key, livemode)
  where lookup_key is not null and active = true and deleted_at is null;

create index if not exists billing_products_role_active_idx
  on public.billing_products (catalog_role, active, livemode);

create index if not exists billing_products_last_event_idx
  on public.billing_products (stripe_product_id, last_stripe_event_created_at desc);

create index if not exists billing_prices_product_idx
  on public.billing_prices (billing_product_id, active);

create index if not exists billing_prices_lookup_idx
  on public.billing_prices (lookup_key, active, livemode)
  where lookup_key is not null;

create index if not exists billing_prices_last_event_idx
  on public.billing_prices (stripe_price_id, last_stripe_event_created_at desc);

create trigger billing_products_set_updated_at
before update on public.billing_products
for each row execute function public.set_updated_at();

create trigger billing_prices_set_updated_at
before update on public.billing_prices
for each row execute function public.set_updated_at();

create or replace function public.billing_public_catalog()
returns table (
  item_kind text,
  slug text,
  name text,
  billing_interval text,
  price_cents integer,
  currency text,
  trial_days integer,
  lookup_key text,
  is_active boolean,
  sort_order integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    'plan'::text as item_kind,
    plan.slug,
    plan.name,
    plan.billing_interval,
    plan.price_cents,
    plan.currency,
    plan.trial_days,
    plan.lookup_key,
    plan.is_active,
    plan.sort_order
  from public.billing_plans as plan
  where plan.slug in ('complete-monthly', 'complete-annual')

  union all

  select
    'addon'::text as item_kind,
    addon.slug,
    addon.name,
    addon.billing_interval,
    addon.price_cents,
    addon.currency,
    0 as trial_days,
    addon.lookup_key,
    addon.is_active,
    100 as sort_order
  from public.billing_plan_addons as addon
  where addon.slug = 'active-client-monthly'

  order by sort_order, price_cents;
$$;

alter table public.billing_products enable row level security;
alter table public.billing_prices enable row level security;

revoke all on table public.billing_products from public, anon, authenticated;
revoke all on table public.billing_prices from public, anon, authenticated;

grant select on table public.billing_products to authenticated;
grant select on table public.billing_prices to authenticated;
grant select, insert, update, delete on table public.billing_products to service_role;
grant select, insert, update, delete on table public.billing_prices to service_role;

revoke execute on function public.billing_public_catalog() from public;
grant execute on function public.billing_public_catalog() to anon, authenticated, service_role;

create policy billing_products_select_public_catalog
on public.billing_products
for select
to authenticated
using (deleted_at is null);

create policy billing_prices_select_public_catalog
on public.billing_prices
for select
to authenticated
using (deleted_at is null);

create policy billing_products_service_role_all
on public.billing_products
for all
to service_role
using (true)
with check (true);

create policy billing_prices_service_role_all
on public.billing_prices
for all
to service_role
using (true)
with check (true);

comment on table public.billing_products
is 'Read model local de Products Stripe pertencentes ao catalogo Leo Barros; Stripe e a fonte comercial externa.';

comment on table public.billing_prices
is 'Read model local de Prices Stripe, preservando historico de troca, lookup key, arquivamento e eventos fora de ordem.';

comment on function public.billing_public_catalog()
is 'Catalogo publico atual para telas e checkout: expõe somente slugs comerciais, nomes, valores e disponibilidade.';
