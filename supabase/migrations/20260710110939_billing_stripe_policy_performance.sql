-- Reduz policies permissivas duplicadas no dominio de billing e cobre FK de trial.

create index if not exists partner_billing_trial_usage_first_subscription_idx
  on public.partner_billing_trial_usage (first_subscription_id)
  where first_subscription_id is not null;

drop policy if exists partner_subscriptions_select_active_admin on public.partner_subscriptions;
drop policy if exists partner_subscriptions_select_own_partner on public.partner_subscriptions;
create policy partner_subscriptions_select_admin_or_own_partner
on public.partner_subscriptions
for select
to authenticated
using (
  public.current_active_admin_id() is not null
  or partner_id = public.current_active_partner_id()
);

drop policy if exists billing_payments_select_active_admin on public.billing_payments;
drop policy if exists billing_payments_select_own_partner on public.billing_payments;
create policy billing_payments_select_admin_or_own_partner
on public.billing_payments
for select
to authenticated
using (
  public.current_active_admin_id() is not null
  or partner_id = public.current_active_partner_id()
);

drop policy if exists partner_subscription_items_select_admin on public.partner_subscription_items;
drop policy if exists partner_subscription_items_select_own_partner on public.partner_subscription_items;
create policy partner_subscription_items_select_admin_or_own_partner
on public.partner_subscription_items
for select
to authenticated
using (
  public.current_active_admin_id() is not null
  or partner_id = public.current_active_partner_id()
);

drop policy if exists billing_active_client_snapshots_select_admin on public.billing_active_client_snapshots;
drop policy if exists billing_active_client_snapshots_select_own_partner on public.billing_active_client_snapshots;
create policy billing_active_client_snapshots_select_admin_or_own_partner
on public.billing_active_client_snapshots
for select
to authenticated
using (
  public.current_active_admin_id() is not null
  or partner_id = public.current_active_partner_id()
);

drop policy if exists partner_billing_trial_usage_select_admin on public.partner_billing_trial_usage;
drop policy if exists partner_billing_trial_usage_select_own_partner on public.partner_billing_trial_usage;
create policy partner_billing_trial_usage_select_admin_or_own_partner
on public.partner_billing_trial_usage
for select
to authenticated
using (
  public.current_active_admin_id() is not null
  or partner_id = public.current_active_partner_id()
);
