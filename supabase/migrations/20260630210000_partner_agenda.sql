alter table public.partner_client_appointments
  add column if not exists appointment_type text not null default 'consulta',
  add column if not exists modality text not null default 'online',
  add column if not exists location_text text,
  add column if not exists reminder_minutes integer not null default 30;

alter table public.partner_client_appointments
  drop constraint if exists partner_client_appointments_status_check;

alter table public.partner_client_appointments
  add constraint partner_client_appointments_status_check
    check (status in ('scheduled', 'pending', 'completed', 'canceled', 'no_show')),
  add constraint partner_client_appointments_type_check
    check (appointment_type in ('consulta', 'avaliacao', 'retorno', 'reuniao', 'outro')),
  add constraint partner_client_appointments_modality_check
    check (modality in ('online', 'presencial')),
  add constraint partner_client_appointments_location_not_blank
    check (location_text is null or length(btrim(location_text)) > 0),
  add constraint partner_client_appointments_reminder_check
    check (reminder_minutes in (0, 10, 15, 30, 60, 120, 1440));

create index if not exists partner_client_appointments_partner_start_idx
  on public.partner_client_appointments (partner_id, starts_at);

create index if not exists partner_client_appointments_partner_status_start_idx
  on public.partner_client_appointments (partner_id, status, starts_at);

create table if not exists public.partner_calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  title text not null default 'Horario bloqueado',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_calendar_blocks_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_calendar_blocks_title_not_blank
    check (length(btrim(title)) > 0),
  constraint partner_calendar_blocks_reason_not_blank
    check (reason is null or length(btrim(reason)) > 0),
  constraint partner_calendar_blocks_period_check
    check (ends_at > starts_at),
  constraint partner_calendar_blocks_status_check
    check (status in ('active', 'canceled'))
);

create index if not exists partner_calendar_blocks_partner_start_idx
  on public.partner_calendar_blocks (partner_id, starts_at);

create trigger partner_calendar_blocks_set_updated_at
before update on public.partner_calendar_blocks
for each row execute function public.set_updated_at();

alter table public.partner_calendar_blocks enable row level security;

revoke all on table public.partner_calendar_blocks from public, anon, authenticated;
grant select, insert, update on table public.partner_calendar_blocks to authenticated;
grant select, insert, update, delete on table public.partner_calendar_blocks to service_role;

create policy partner_calendar_blocks_select_own_partner
on public.partner_calendar_blocks for select to authenticated
using (partner_id = public.current_active_partner_id());

create policy partner_calendar_blocks_insert_own_partner
on public.partner_calendar_blocks for insert to authenticated
with check (partner_id = public.current_active_partner_id());

create policy partner_calendar_blocks_update_own_partner
on public.partner_calendar_blocks for update to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());
