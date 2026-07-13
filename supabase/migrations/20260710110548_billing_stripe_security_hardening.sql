-- Hardening corretivo para funcoes e ledgers internos do billing Stripe.

revoke execute on function public.billing_active_client_count(uuid) from public, anon;
grant execute on function public.billing_active_client_count(uuid) to authenticated, service_role;

alter function public.billing_public_plans() security invoker;
revoke execute on function public.billing_public_plans() from public, anon;
grant execute on function public.billing_public_plans() to authenticated, service_role;

revoke execute on function public.billing_partner_trial_available(uuid) from public, anon;
grant execute on function public.billing_partner_trial_available(uuid) to authenticated, service_role;

revoke execute on function public.enqueue_partner_client_billing_sync() from public, anon, authenticated;

drop policy if exists billing_sync_outbox_service_role_all on public.billing_sync_outbox;
create policy billing_sync_outbox_service_role_all
on public.billing_sync_outbox
for all
to service_role
using (true)
with check (true);

drop policy if exists stripe_webhook_events_service_role_all on public.stripe_webhook_events;
create policy stripe_webhook_events_service_role_all
on public.stripe_webhook_events
for all
to service_role
using (true)
with check (true);
