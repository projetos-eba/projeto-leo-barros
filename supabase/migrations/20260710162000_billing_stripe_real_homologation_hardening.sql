-- Hardening para homologacao real Stripe: catalogo oficial, replay e eventos fora de ordem.

alter table public.stripe_webhook_events
  add column if not exists stripe_event_created_at timestamptz;

alter table public.partner_subscriptions
  add column if not exists stripe_last_event_created_at timestamptz;

create index if not exists stripe_webhook_events_created_idx
  on public.stripe_webhook_events (stripe_event_created_at desc)
  where stripe_event_created_at is not null;

create index if not exists partner_subscriptions_stripe_last_event_created_idx
  on public.partner_subscriptions (stripe_subscription_id, stripe_last_event_created_at desc)
  where stripe_subscription_id is not null;

comment on column public.stripe_webhook_events.stripe_event_created_at
is 'Timestamp created do evento Stripe usado para auditoria e simulacao controlada de ordem.';

comment on column public.partner_subscriptions.stripe_last_event_created_at
is 'Ultimo event.created Stripe aplicado a assinatura local; eventos mais antigos nao sobrescrevem estado financeiro mais recente.';
