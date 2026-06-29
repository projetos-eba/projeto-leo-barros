-- Domínio operacional mínimo para o dashboard real do Super Admin.
-- Escopo: planos, assinaturas, pagamentos, suporte, documentos e eventos.
-- Stripe fica preparado por campos opcionais; nenhuma integração externa é configurada aqui.

create table public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  billing_interval text not null,
  price_cents integer not null,
  currency text not null default 'brl',
  is_active boolean not null default true,
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint billing_plans_slug_key unique (slug),
  constraint billing_plans_slug_not_blank check (length(btrim(slug)) > 0),
  constraint billing_plans_name_not_blank check (length(btrim(name)) > 0),
  constraint billing_plans_billing_interval_check check (billing_interval in ('monthly', 'yearly')),
  constraint billing_plans_price_cents_check check (price_cents >= 0),
  constraint billing_plans_currency_check check (currency ~ '^[a-z]{3}$'),
  constraint billing_plans_stripe_product_id_not_blank check (stripe_product_id is null or length(btrim(stripe_product_id)) > 0),
  constraint billing_plans_stripe_price_id_not_blank check (stripe_price_id is null or length(btrim(stripe_price_id)) > 0)
);

create table public.partner_subscriptions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  plan_id uuid not null,
  status text not null,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_subscriptions_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_subscriptions_plan_id_fkey
    foreign key (plan_id) references public.billing_plans(id) on delete restrict,
  constraint partner_subscriptions_status_check
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  constraint partner_subscriptions_period_check
    check (current_period_end > current_period_start),
  constraint partner_subscriptions_canceled_at_check
    check ((status = 'canceled' and canceled_at is not null) or (status <> 'canceled')),
  constraint partner_subscriptions_stripe_customer_id_not_blank
    check (stripe_customer_id is null or length(btrim(stripe_customer_id)) > 0),
  constraint partner_subscriptions_stripe_subscription_id_not_blank
    check (stripe_subscription_id is null or length(btrim(stripe_subscription_id)) > 0)
);

create table public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null,
  partner_id uuid not null,
  amount_cents integer not null,
  currency text not null default 'brl',
  status text not null,
  payment_kind text not null,
  due_at timestamptz not null,
  paid_at timestamptz,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint billing_payments_subscription_id_fkey
    foreign key (subscription_id) references public.partner_subscriptions(id) on delete restrict,
  constraint billing_payments_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint billing_payments_amount_cents_check check (amount_cents >= 0),
  constraint billing_payments_currency_check check (currency ~ '^[a-z]{3}$'),
  constraint billing_payments_status_check check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  constraint billing_payments_payment_kind_check check (payment_kind in ('initial', 'renewal', 'manual_adjustment')),
  constraint billing_payments_paid_at_check check ((status = 'succeeded' and paid_at is not null) or (status <> 'succeeded')),
  constraint billing_payments_stripe_payment_intent_id_not_blank
    check (stripe_payment_intent_id is null or length(btrim(stripe_payment_intent_id)) > 0)
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  opened_by_profile_id uuid,
  ticket_number text not null,
  subject text not null,
  status text not null default 'open',
  priority text not null default 'medium',
  sla_due_at timestamptz not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint support_tickets_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint support_tickets_opened_by_profile_id_fkey
    foreign key (opened_by_profile_id) references public.profiles(id) on delete set null,
  constraint support_tickets_ticket_number_key unique (ticket_number),
  constraint support_tickets_ticket_number_not_blank check (length(btrim(ticket_number)) > 0),
  constraint support_tickets_subject_not_blank check (length(btrim(subject)) > 0),
  constraint support_tickets_status_check check (status in ('open', 'in_progress', 'resolved', 'closed')),
  constraint support_tickets_priority_check check (priority in ('low', 'medium', 'high', 'urgent')),
  constraint support_tickets_resolved_at_check check ((status in ('resolved', 'closed') and resolved_at is not null) or (status not in ('resolved', 'closed')))
);

create table public.partner_documents (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  document_type text not null,
  status text not null default 'pending',
  title text not null,
  due_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_documents_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_documents_document_type_check
    check (document_type in ('identity', 'professional_registry', 'contract', 'other')),
  constraint partner_documents_status_check
    check (status in ('pending', 'in_review', 'approved', 'rejected', 'expired')),
  constraint partner_documents_title_not_blank check (length(btrim(title)) > 0),
  constraint partner_documents_reviewed_at_check
    check ((status in ('approved', 'rejected') and reviewed_at is not null) or (status not in ('approved', 'rejected')))
);

create table public.platform_activity_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_profile_id uuid,
  partner_id uuid,
  patient_id uuid,
  payment_id uuid,
  title text not null,
  detail text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint platform_activity_events_actor_profile_id_fkey
    foreign key (actor_profile_id) references public.profiles(id) on delete set null,
  constraint platform_activity_events_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete set null,
  constraint platform_activity_events_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete set null,
  constraint platform_activity_events_payment_id_fkey
    foreign key (payment_id) references public.billing_payments(id) on delete set null,
  constraint platform_activity_events_event_type_check
    check (event_type in ('partner_created', 'partner_approved', 'subscription_started', 'subscription_renewed', 'subscription_canceled', 'payment_received', 'payment_failed', 'ticket_opened', 'ticket_resolved', 'document_pending', 'document_approved', 'client_created')),
  constraint platform_activity_events_title_not_blank check (length(btrim(title)) > 0),
  constraint platform_activity_events_detail_not_blank check (length(btrim(detail)) > 0),
  constraint platform_activity_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create unique index billing_plans_stripe_product_key
  on public.billing_plans (stripe_product_id)
  where stripe_product_id is not null;

create unique index billing_plans_stripe_price_key
  on public.billing_plans (stripe_price_id)
  where stripe_price_id is not null;

create unique index partner_subscriptions_active_partner_key
  on public.partner_subscriptions (partner_id)
  where status in ('trialing', 'active', 'past_due', 'incomplete');

create unique index partner_subscriptions_stripe_subscription_key
  on public.partner_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index partner_subscriptions_partner_status_idx
  on public.partner_subscriptions (partner_id, status);

create index partner_subscriptions_plan_status_idx
  on public.partner_subscriptions (plan_id, status);

create index billing_payments_partner_status_due_idx
  on public.billing_payments (partner_id, status, due_at desc);

create index billing_payments_subscription_due_idx
  on public.billing_payments (subscription_id, due_at desc);

create unique index billing_payments_stripe_payment_intent_key
  on public.billing_payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index support_tickets_partner_status_idx
  on public.support_tickets (partner_id, status, created_at desc);

create index support_tickets_sla_status_idx
  on public.support_tickets (status, sla_due_at);

create index partner_documents_partner_status_idx
  on public.partner_documents (partner_id, status, created_at desc);

create index platform_activity_events_created_idx
  on public.platform_activity_events (created_at desc);

create index platform_activity_events_partner_created_idx
  on public.platform_activity_events (partner_id, created_at desc);

create trigger billing_plans_set_updated_at
before update on public.billing_plans
for each row execute function public.set_updated_at();

create trigger partner_subscriptions_set_updated_at
before update on public.partner_subscriptions
for each row execute function public.set_updated_at();

create trigger billing_payments_set_updated_at
before update on public.billing_payments
for each row execute function public.set_updated_at();

create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

create trigger partner_documents_set_updated_at
before update on public.partner_documents
for each row execute function public.set_updated_at();

alter table public.billing_plans enable row level security;
alter table public.partner_subscriptions enable row level security;
alter table public.billing_payments enable row level security;
alter table public.support_tickets enable row level security;
alter table public.partner_documents enable row level security;
alter table public.platform_activity_events enable row level security;

revoke all on table public.billing_plans from public, anon, authenticated;
revoke all on table public.partner_subscriptions from public, anon, authenticated;
revoke all on table public.billing_payments from public, anon, authenticated;
revoke all on table public.support_tickets from public, anon, authenticated;
revoke all on table public.partner_documents from public, anon, authenticated;
revoke all on table public.platform_activity_events from public, anon, authenticated;

grant select on table public.billing_plans to authenticated;
grant select on table public.partner_subscriptions to authenticated;
grant select on table public.billing_payments to authenticated;
grant select on table public.support_tickets to authenticated;
grant select on table public.partner_documents to authenticated;
grant select on table public.platform_activity_events to authenticated;

grant select, insert, update, delete on table public.billing_plans to service_role;
grant select, insert, update, delete on table public.partner_subscriptions to service_role;
grant select, insert, update, delete on table public.billing_payments to service_role;
grant select, insert, update, delete on table public.support_tickets to service_role;
grant select, insert, update, delete on table public.partner_documents to service_role;
grant select, insert, update, delete on table public.platform_activity_events to service_role;

create policy billing_plans_select_active_or_admin
on public.billing_plans
for select
to authenticated
using (is_active or public.current_active_admin_id() is not null);

create policy partner_subscriptions_select_active_admin
on public.partner_subscriptions
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy partner_subscriptions_select_own_partner
on public.partner_subscriptions
for select
to authenticated
using (partner_id = public.current_active_partner_id());

create policy billing_payments_select_active_admin
on public.billing_payments
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy billing_payments_select_own_partner
on public.billing_payments
for select
to authenticated
using (partner_id = public.current_active_partner_id());

create policy support_tickets_select_active_admin
on public.support_tickets
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy support_tickets_select_own_partner
on public.support_tickets
for select
to authenticated
using (partner_id = public.current_active_partner_id());

create policy partner_documents_select_active_admin
on public.partner_documents
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy partner_documents_select_own_partner
on public.partner_documents
for select
to authenticated
using (partner_id = public.current_active_partner_id());

create policy platform_activity_events_select_active_admin
on public.platform_activity_events
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy platform_activity_events_select_own_partner
on public.platform_activity_events
for select
to authenticated
using (partner_id = public.current_active_partner_id());

comment on table public.billing_plans
is 'Planos comerciais locais do produto. Campos Stripe são opcionais e ficam inativos até a fase de integração do gateway.';

comment on table public.partner_subscriptions
is 'Assinaturas dos Parceiros, separadas do profiles.status para evitar bloqueios indevidos de conta.';

comment on table public.billing_payments
is 'Pagamentos processados/localmente registrados para métricas financeiras do Admin; sem chamada ao Stripe nesta fase.';

comment on table public.support_tickets
is 'Tickets de suporte abertos por Parceiros ou operação, usados nos cards de suporte e SLA.';

comment on table public.partner_documents
is 'Documentos operacionais dos Parceiros para revisão e alertas do Super Admin.';

comment on table public.platform_activity_events
is 'Log leve de movimentações da plataforma exibido no dashboard do Super Admin.';
