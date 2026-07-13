-- Observabilidade protegida para envios de e-mails transacionais de auth.

create table if not exists public.auth_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  flow text not null,
  role text not null,
  environment text not null,
  to_email text not null,
  resend_email_id text,
  result_status text not null,
  profile_id uuid,
  auth_user_id uuid,
  error_code text,
  created_at timestamptz not null default now(),

  constraint auth_email_deliveries_flow_check
    check (flow in ('email_confirmation', 'admin_account_approval', 'password_reset')),
  constraint auth_email_deliveries_role_check
    check (role in ('cliente', 'parceiro', 'admin')),
  constraint auth_email_deliveries_status_check
    check (result_status in ('accepted', 'sent', 'delivered', 'bounced', 'failed')),
  constraint auth_email_deliveries_request_id_not_blank
    check (length(btrim(request_id)) > 0),
  constraint auth_email_deliveries_to_email_not_blank
    check (length(btrim(to_email)) > 0),
  constraint auth_email_deliveries_profile_id_fkey
    foreign key (profile_id) references public.profiles(id) on delete set null
);

create index if not exists auth_email_deliveries_request_idx
  on public.auth_email_deliveries (request_id);

create index if not exists auth_email_deliveries_profile_idx
  on public.auth_email_deliveries (profile_id, created_at desc);

create index if not exists auth_email_deliveries_resend_idx
  on public.auth_email_deliveries (resend_email_id)
  where resend_email_id is not null;

alter table public.auth_email_deliveries enable row level security;

revoke all on table public.auth_email_deliveries from public, anon, authenticated;
grant select, insert, update on table public.auth_email_deliveries to service_role;

comment on table public.auth_email_deliveries
is 'Ledger protegido de envios de e-mails transacionais de auth. Nao armazena token puro nem URL completa.';
