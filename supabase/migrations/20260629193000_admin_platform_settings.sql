-- Configuracoes administrativas enxutas.
-- Segredos de integracoes ficam fora do banco nesta fase; armazenamos apenas referencias e configuracao publica.

create table public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by_profile_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint platform_settings_key_check
    check (key in ('general', 'security')),
  constraint platform_settings_value_object
    check (jsonb_typeof(value) = 'object'),
  constraint platform_settings_updated_by_profile_id_fkey
    foreign key (updated_by_profile_id) references public.profiles(id) on delete set null
);

create table public.platform_integrations (
  id uuid primary key default gen_random_uuid(),
  integration_key text not null,
  name text not null,
  category text not null,
  status text not null default 'needs_config',
  config jsonb not null default '{}'::jsonb,
  last_test_status text,
  last_test_message text,
  last_tested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint platform_integrations_key_key unique (integration_key),
  constraint platform_integrations_key_not_blank check (length(btrim(integration_key)) > 0),
  constraint platform_integrations_name_not_blank check (length(btrim(name)) > 0),
  constraint platform_integrations_category_not_blank check (length(btrim(category)) > 0),
  constraint platform_integrations_status_check check (status in ('active', 'inactive', 'needs_config')),
  constraint platform_integrations_config_object check (jsonb_typeof(config) = 'object'),
  constraint platform_integrations_last_test_status_check
    check (last_test_status is null or last_test_status in ('success', 'failed', 'untested')),
  constraint platform_integrations_last_test_message_not_blank
    check (last_test_message is null or length(btrim(last_test_message)) > 0)
);

create table public.platform_settings_activity (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_profile_id uuid,
  title text not null,
  detail text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint platform_settings_activity_actor_profile_id_fkey
    foreign key (actor_profile_id) references public.profiles(id) on delete set null,
  constraint platform_settings_activity_action_not_blank check (length(btrim(action)) > 0),
  constraint platform_settings_activity_title_not_blank check (length(btrim(title)) > 0),
  constraint platform_settings_activity_detail_not_blank check (length(btrim(detail)) > 0),
  constraint platform_settings_activity_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index platform_integrations_category_status_idx
  on public.platform_integrations (category, status);

create index platform_settings_activity_created_idx
  on public.platform_settings_activity (created_at desc);

create trigger platform_settings_set_updated_at
before update on public.platform_settings
for each row execute function public.set_updated_at();

create trigger platform_integrations_set_updated_at
before update on public.platform_integrations
for each row execute function public.set_updated_at();

alter table public.platform_settings enable row level security;
alter table public.platform_integrations enable row level security;
alter table public.platform_settings_activity enable row level security;

revoke all on table public.platform_settings from public, anon, authenticated;
revoke all on table public.platform_integrations from public, anon, authenticated;
revoke all on table public.platform_settings_activity from public, anon, authenticated;

grant select, insert, update, delete on table public.platform_settings to authenticated;
grant select, insert, update, delete on table public.platform_integrations to authenticated;
grant select, insert on table public.platform_settings_activity to authenticated;

grant select, insert, update, delete on table public.platform_settings to service_role;
grant select, insert, update, delete on table public.platform_integrations to service_role;
grant select, insert, update, delete on table public.platform_settings_activity to service_role;

create policy platform_settings_select_active_admin
on public.platform_settings
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy platform_settings_insert_active_admin
on public.platform_settings
for insert
to authenticated
with check (public.current_active_admin_id() is not null);

create policy platform_settings_update_active_admin
on public.platform_settings
for update
to authenticated
using (public.current_active_admin_id() is not null)
with check (public.current_active_admin_id() is not null);

create policy platform_integrations_select_active_admin
on public.platform_integrations
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy platform_integrations_insert_active_admin
on public.platform_integrations
for insert
to authenticated
with check (public.current_active_admin_id() is not null);

create policy platform_integrations_update_active_admin
on public.platform_integrations
for update
to authenticated
using (public.current_active_admin_id() is not null)
with check (public.current_active_admin_id() is not null);

create policy platform_settings_activity_select_active_admin
on public.platform_settings_activity
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy platform_settings_activity_insert_active_admin
on public.platform_settings_activity
for insert
to authenticated
with check (public.current_active_admin_id() is not null);

insert into public.platform_settings (key, value)
values
  ('general', '{
    "platformName": "Leonardo Barros",
    "platformDomain": "app.leonardobarros.com.br",
    "maintenanceMode": false,
    "maintenanceMessage": "Estamos realizando manutencoes programadas. Voltaremos em breve."
  }'::jsonb),
  ('security', '{
    "require2fa": true,
    "sessionTimeoutMinutes": 120,
    "restrictByIp": false,
    "auditTrailEnabled": true
  }'::jsonb)
on conflict (key) do nothing;

insert into public.platform_integrations (integration_key, name, category, status, config, last_test_status, last_test_message)
values
  ('stripe_billing', 'Stripe Billing', 'Pagamentos', 'needs_config', '{"mode": "test", "publicKeyRef": ""}'::jsonb, 'untested', 'Aguardando configuracao.'),
  ('transactional_email', 'E-mail transacional', 'Comunicacao', 'needs_config', '{"provider": "resend", "senderDomain": ""}'::jsonb, 'untested', 'Aguardando configuracao.'),
  ('whatsapp_support', 'WhatsApp / Atendimento', 'Atendimento', 'needs_config', '{"provider": "whatsapp_business", "phoneNumberId": ""}'::jsonb, 'untested', 'Aguardando configuracao.'),
  ('storage', 'Storage', 'Arquivos', 'active', '{"bucket": "platform-assets", "region": "local"}'::jsonb, 'success', 'Configuracao local pronta.'),
  ('webhooks_api', 'Webhooks / API', 'API', 'needs_config', '{"endpoint": "", "signingKeyRef": ""}'::jsonb, 'untested', 'Aguardando configuracao.')
on conflict (integration_key) do nothing;

insert into public.platform_settings_activity (action, title, detail)
values
  ('settings_seeded', 'Configuracoes iniciais criadas', 'Defaults administrativos carregados para a pagina de configuracoes.')
on conflict do nothing;

comment on table public.platform_settings
is 'Configuracoes administrativas simples da plataforma. Valores sensiveis nao devem ser armazenados aqui.';

comment on table public.platform_integrations
is 'Catalogo e estado operacional de integracoes. Mantem apenas configuracao publica ou referencias a segredos externos.';

comment on table public.platform_settings_activity
is 'Historico de alteracoes da pagina Admin Configuracoes.';
