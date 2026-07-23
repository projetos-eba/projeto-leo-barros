create table public.partner_client_notes (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  note_type text not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_client_notes_type_check check (note_type in ('anamnesis', 'prescription')),
  constraint partner_client_notes_title_check check (length(btrim(title)) between 2 and 140),
  constraint partner_client_notes_body_check check (length(btrim(body)) between 1 and 12000)
);

create table public.partner_form_templates (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  title text not null,
  description text,
  questions jsonb not null default '[]',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_form_templates_title_check check (length(btrim(title)) between 2 and 140),
  constraint partner_form_templates_questions_check check (jsonb_typeof(questions) = 'array'),
  constraint partner_form_templates_status_check check (status in ('draft', 'active', 'archived'))
);

create table public.partner_form_assignments (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  template_id uuid references public.partner_form_templates(id) on delete set null,
  title_snapshot text not null,
  description_snapshot text,
  questions_snapshot jsonb not null default '[]',
  status text not null default 'sent',
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_form_assignments_title_check check (length(btrim(title_snapshot)) between 2 and 140),
  constraint partner_form_assignments_questions_check check (jsonb_typeof(questions_snapshot) = 'array'),
  constraint partner_form_assignments_status_check check (status in ('draft', 'sent', 'closed', 'archived'))
);

create table public.partner_form_assignment_clients (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.partner_form_assignments(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  status text not null default 'sent',
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_form_assignment_clients_status_check check (status in ('sent', 'answered', 'closed')),
  constraint partner_form_assignment_clients_unique unique (assignment_id, patient_id)
);

create table public.partner_form_responses (
  id uuid primary key default gen_random_uuid(),
  assignment_client_id uuid not null references public.partner_form_assignment_clients(id) on delete cascade,
  assignment_id uuid not null references public.partner_form_assignments(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  answers jsonb not null default '{}',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_form_responses_answers_check check (jsonb_typeof(answers) = 'object'),
  constraint partner_form_responses_assignment_client_key unique (assignment_client_id)
);

create index partner_client_notes_client_created_idx
  on public.partner_client_notes (partner_id, patient_id, note_type, created_at desc);
create index partner_form_templates_partner_status_idx
  on public.partner_form_templates (partner_id, status, updated_at desc);
create index partner_form_assignment_clients_partner_patient_idx
  on public.partner_form_assignment_clients (partner_id, patient_id, status, updated_at desc);
create index partner_form_responses_partner_patient_idx
  on public.partner_form_responses (partner_id, patient_id, submitted_at desc);

create trigger partner_client_notes_set_updated_at
before update on public.partner_client_notes
for each row execute function public.set_updated_at();

create trigger partner_form_templates_set_updated_at
before update on public.partner_form_templates
for each row execute function public.set_updated_at();

create trigger partner_form_assignments_set_updated_at
before update on public.partner_form_assignments
for each row execute function public.set_updated_at();

create trigger partner_form_assignment_clients_set_updated_at
before update on public.partner_form_assignment_clients
for each row execute function public.set_updated_at();

create trigger partner_form_responses_set_updated_at
before update on public.partner_form_responses
for each row execute function public.set_updated_at();

alter table public.partner_client_notes enable row level security;
alter table public.partner_form_templates enable row level security;
alter table public.partner_form_assignments enable row level security;
alter table public.partner_form_assignment_clients enable row level security;
alter table public.partner_form_responses enable row level security;

revoke all on table public.partner_client_notes, public.partner_form_templates,
  public.partner_form_assignments, public.partner_form_assignment_clients, public.partner_form_responses
  from public, anon, authenticated;

grant select, insert, update on table public.partner_client_notes to authenticated;
grant select, insert, update on table public.partner_form_templates to authenticated;
grant select, insert, update on table public.partner_form_assignments to authenticated;
grant select, insert, update on table public.partner_form_assignment_clients to authenticated;
grant select, insert, update on table public.partner_form_responses to authenticated;

grant all on table public.partner_client_notes, public.partner_form_templates,
  public.partner_form_assignments, public.partner_form_assignment_clients, public.partner_form_responses
  to service_role;

create policy partner_client_notes_own_partner
on public.partner_client_notes for all to authenticated
using (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
)
with check (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
);

create policy partner_form_templates_own_partner
on public.partner_form_templates for all to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());

create policy partner_form_assignments_own_partner
on public.partner_form_assignments for all to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());

create policy partner_form_assignments_patient_read
on public.partner_form_assignments for select to authenticated
using (
  exists (
    select 1
    from public.partner_form_assignment_clients as assignment_client
    where assignment_client.assignment_id = partner_form_assignments.id
      and assignment_client.patient_id = public.current_active_patient_id()
  )
);

create policy partner_form_assignment_clients_partner_access
on public.partner_form_assignment_clients for all to authenticated
using (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
)
with check (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
);

create policy partner_form_assignment_clients_patient_read
on public.partner_form_assignment_clients for select to authenticated
using (patient_id = public.current_active_patient_id());

create policy partner_form_responses_partner_access
on public.partner_form_responses for select to authenticated
using (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_active_patient_link(patient_id)
);

create policy partner_form_responses_patient_access
on public.partner_form_responses for select to authenticated
using (patient_id = public.current_active_patient_id());

create policy partner_form_responses_patient_insert
on public.partner_form_responses for insert to authenticated
with check (patient_id = public.current_active_patient_id());

create policy partner_form_responses_patient_update
on public.partner_form_responses for update to authenticated
using (patient_id = public.current_active_patient_id())
with check (patient_id = public.current_active_patient_id());
