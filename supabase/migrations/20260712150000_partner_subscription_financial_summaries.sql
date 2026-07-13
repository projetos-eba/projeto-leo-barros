-- Read model financeiro de assinatura sincronizado por Stripe.

create table if not exists public.partner_subscription_financial_summaries (
  subscription_id uuid primary key references public.partner_subscriptions(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete restrict,
  plan_base_amount_cents integer not null default 0,
  active_client_quantity integer not null default 0,
  active_client_unit_amount_cents integer not null default 199,
  active_client_subtotal_cents integer not null default 0,
  subtotal_cents integer not null default 0,
  discount_code text,
  discount_label text,
  discount_duration text,
  discount_amount_cents integer not null default 0,
  total_after_discount_cents integer not null default 0,
  currency text not null default 'brl',
  source text not null default 'stripe_preview',
  stripe_invoice_id text,
  stripe_subscription_id text,
  stripe_coupon_id text,
  stripe_promotion_code_id text,
  stripe_event_created_at timestamptz,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_subscription_financial_plan_base_check check (plan_base_amount_cents >= 0),
  constraint partner_subscription_financial_quantity_check check (active_client_quantity >= 0),
  constraint partner_subscription_financial_unit_check check (active_client_unit_amount_cents >= 0),
  constraint partner_subscription_financial_addon_check check (active_client_subtotal_cents >= 0),
  constraint partner_subscription_financial_subtotal_check check (subtotal_cents >= 0),
  constraint partner_subscription_financial_discount_check check (discount_amount_cents >= 0),
  constraint partner_subscription_financial_total_check check (total_after_discount_cents >= 0),
  constraint partner_subscription_financial_currency_check check (currency ~ '^[a-z]{3}$'),
  constraint partner_subscription_financial_source_check check (source in ('stripe_preview', 'stripe_webhook', 'manual_reconcile')),
  constraint partner_subscription_financial_discount_code_not_blank check (discount_code is null or length(btrim(discount_code)) > 0),
  constraint partner_subscription_financial_discount_label_not_blank check (discount_label is null or length(btrim(discount_label)) > 0),
  constraint partner_subscription_financial_discount_duration_not_blank check (discount_duration is null or length(btrim(discount_duration)) > 0),
  constraint partner_subscription_financial_invoice_not_blank check (stripe_invoice_id is null or length(btrim(stripe_invoice_id)) > 0),
  constraint partner_subscription_financial_subscription_not_blank check (stripe_subscription_id is null or length(btrim(stripe_subscription_id)) > 0),
  constraint partner_subscription_financial_coupon_not_blank check (stripe_coupon_id is null or length(btrim(stripe_coupon_id)) > 0),
  constraint partner_subscription_financial_promotion_not_blank check (stripe_promotion_code_id is null or length(btrim(stripe_promotion_code_id)) > 0)
);

create index if not exists partner_subscription_financial_partner_idx
  on public.partner_subscription_financial_summaries (partner_id, synced_at desc);

create index if not exists partner_subscription_financial_stripe_subscription_idx
  on public.partner_subscription_financial_summaries (stripe_subscription_id)
  where stripe_subscription_id is not null;

create trigger partner_subscription_financial_summaries_set_updated_at
before update on public.partner_subscription_financial_summaries
for each row execute function public.set_updated_at();

alter table public.partner_subscription_financial_summaries enable row level security;

revoke all on table public.partner_subscription_financial_summaries from public, anon, authenticated;

grant select on table public.partner_subscription_financial_summaries to authenticated;
grant select, insert, update, delete on table public.partner_subscription_financial_summaries to service_role;

create policy partner_subscription_financial_select_admin_or_own_partner
on public.partner_subscription_financial_summaries
for select
to authenticated
using (
  public.current_active_admin_id() is not null
  or partner_id = public.current_active_partner_id()
);

create policy partner_subscription_financial_service_role_all
on public.partner_subscription_financial_summaries
for all
to service_role
using (true)
with check (true);

comment on table public.partner_subscription_financial_summaries
is 'Read model financeiro seguro de assinatura: plano-base, Clientes ativos, desconto Stripe e total sincronizados no checkout e por webhook.';
