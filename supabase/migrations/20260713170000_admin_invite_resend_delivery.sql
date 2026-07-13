-- Habilita observabilidade e limpeza segura para convites administrativos via Resend.

alter table public.auth_email_deliveries
  drop constraint if exists auth_email_deliveries_flow_check;

alter table public.auth_email_deliveries
  add constraint auth_email_deliveries_flow_check
  check (flow in (
    'email_confirmation',
    'admin_account_approval',
    'admin_invite',
    'password_reset'
  ));

grant select, insert, update, delete on table public.auth_email_deliveries to service_role;
grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.platform_settings_activity to service_role;
