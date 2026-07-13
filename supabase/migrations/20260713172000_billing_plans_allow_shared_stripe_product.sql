-- Permite que planos do mesmo produto comercial usem Prices diferentes.
-- Mensal e anual compartilham o mesmo Product Stripe; a unicidade operacional
-- fica em stripe_price_id.

drop index if exists public.billing_plans_stripe_product_key;

create index if not exists billing_plans_stripe_product_idx
  on public.billing_plans (stripe_product_id)
  where stripe_product_id is not null;
