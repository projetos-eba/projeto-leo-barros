-- Restringe RPCs de billing ao menor privilegio necessario.

alter function public.billing_active_client_count(uuid) security invoker;
grant execute on function public.billing_active_client_count(uuid) to authenticated, service_role;

revoke execute on function public.billing_partner_trial_available(uuid) from authenticated;
grant execute on function public.billing_partner_trial_available(uuid) to service_role;
