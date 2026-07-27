-- Reconciles databases that applied the legacy 20260721113000 migration before
-- the normalized clinical workspace migration was introduced.

do $$
begin
  if to_regclass('public.partner_client_notes') is null then
    return;
  end if;

  alter table public.partner_form_responses rename to partner_form_responses_legacy_20260726;
  alter table public.partner_form_assignment_clients rename to partner_form_assignment_clients_legacy_20260726;
  alter table public.partner_form_assignments rename to partner_form_assignments_legacy_20260726;
  alter table public.partner_form_templates rename to partner_form_templates_legacy_20260726;
end
$$;

create table if not exists public.partner_client_anamnesis_entries (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  title text not null,
  summary text,
  content text not null,
  sections jsonb not null default '{}'::jsonb,
  version_number integer not null,
  is_current boolean not null default true,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_client_anamnesis_title_not_blank check (length(btrim(title)) > 0),
  constraint partner_client_anamnesis_content_not_blank check (length(btrim(content)) > 0),
  constraint partner_client_anamnesis_summary_not_blank check (summary is null or length(btrim(summary)) > 0),
  constraint partner_client_anamnesis_sections_object check (jsonb_typeof(sections) = 'object'),
  constraint partner_client_anamnesis_version_positive check (version_number > 0),
  constraint partner_client_anamnesis_partner_patient_version_key unique (partner_id, patient_id, version_number)
);

create unique index if not exists partner_client_anamnesis_current_idx
  on public.partner_client_anamnesis_entries (partner_id, patient_id) where is_current;
create index if not exists partner_client_anamnesis_patient_created_idx
  on public.partner_client_anamnesis_entries (partner_id, patient_id, created_at desc);

create table if not exists public.partner_client_prescription_notes (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  title text not null,
  summary text,
  prescription_type text not null default 'general',
  status text not null default 'draft',
  content text not null,
  instructions text,
  version_number integer not null,
  published_at timestamptz,
  archived_at timestamptz,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_client_prescriptions_title_not_blank check (length(btrim(title)) > 0),
  constraint partner_client_prescriptions_content_not_blank check (length(btrim(content)) > 0),
  constraint partner_client_prescriptions_summary_not_blank check (summary is null or length(btrim(summary)) > 0),
  constraint partner_client_prescriptions_instructions_not_blank check (instructions is null or length(btrim(instructions)) > 0),
  constraint partner_client_prescriptions_type_check check (prescription_type in ('general', 'nutrition', 'training', 'supplement', 'exam', 'behavior')),
  constraint partner_client_prescriptions_status_check check (status in ('draft', 'published', 'archived')),
  constraint partner_client_prescriptions_version_positive check (version_number > 0),
  constraint partner_client_prescriptions_published_at_check check ((status = 'published') = (published_at is not null) or status = 'archived'),
  constraint partner_client_prescriptions_archived_at_check check ((status = 'archived') = (archived_at is not null)),
  constraint partner_client_prescriptions_partner_patient_version_key unique (partner_id, patient_id, version_number)
);

create index if not exists partner_client_prescriptions_patient_created_idx
  on public.partner_client_prescription_notes (partner_id, patient_id, created_at desc);
create index if not exists partner_client_prescriptions_patient_status_idx
  on public.partner_client_prescription_notes (partner_id, patient_id, status, created_at desc);

alter table public.partner_client_prescription_notes
  add column if not exists summary text;

create table if not exists public.partner_form_templates (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  title text not null,
  description text,
  status text not null default 'active',
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_form_templates_title_not_blank check (length(btrim(title)) > 0),
  constraint partner_form_templates_description_not_blank check (description is null or length(btrim(description)) > 0),
  constraint partner_form_templates_status_check check (status in ('active', 'archived'))
);

create table if not exists public.partner_form_questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.partner_form_templates(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete restrict,
  sort_order integer not null,
  question_type text not null,
  prompt text not null,
  help_text text,
  required boolean not null default true,
  options jsonb not null default '[]'::jsonb,
  scale_min integer,
  scale_max integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_form_questions_prompt_not_blank check (length(btrim(prompt)) > 0),
  constraint partner_form_questions_help_text_not_blank check (help_text is null or length(btrim(help_text)) > 0),
  constraint partner_form_questions_type_check check (question_type in ('text_short', 'text_long', 'single_choice', 'multiple_choice', 'scale', 'number', 'date', 'boolean')),
  constraint partner_form_questions_options_array check (jsonb_typeof(options) = 'array'),
  constraint partner_form_questions_sort_non_negative check (sort_order >= 0),
  constraint partner_form_questions_scale_check check (question_type <> 'scale' or (scale_min is not null and scale_max is not null and scale_max > scale_min)),
  constraint partner_form_questions_template_sort_key unique (template_id, sort_order)
);

create table if not exists public.partner_form_assignments (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  template_id uuid not null references public.partner_form_templates(id) on delete restrict,
  title text not null,
  message text,
  status text not null default 'sent',
  sent_at timestamptz,
  due_at timestamptz,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_form_assignments_title_not_blank check (length(btrim(title)) > 0),
  constraint partner_form_assignments_message_not_blank check (message is null or length(btrim(message)) > 0),
  constraint partner_form_assignments_status_check check (status in ('draft', 'sent', 'closed', 'archived')),
  constraint partner_form_assignments_sent_at_check check (status = 'draft' or sent_at is not null)
);

create table if not exists public.partner_form_assignment_clients (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.partner_form_assignments(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  status text not null default 'assigned',
  opened_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_form_assignment_clients_status_check check (status in ('assigned', 'opened', 'in_progress', 'submitted', 'canceled')),
  constraint partner_form_assignment_clients_submitted_at_check check ((status = 'submitted') = (submitted_at is not null)),
  constraint partner_form_assignment_clients_assignment_patient_key unique (assignment_id, patient_id)
);

create table if not exists public.partner_form_responses (
  id uuid primary key default gen_random_uuid(),
  assignment_client_id uuid not null references public.partner_form_assignment_clients(id) on delete cascade,
  assignment_id uuid not null references public.partner_form_assignments(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  status text not null default 'in_progress',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_form_responses_status_check check (status in ('in_progress', 'submitted')),
  constraint partner_form_responses_submitted_at_check check ((status = 'submitted') = (submitted_at is not null)),
  constraint partner_form_responses_assignment_client_key unique (assignment_client_id)
);

create table if not exists public.partner_form_response_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.partner_form_responses(id) on delete cascade,
  question_id uuid not null references public.partner_form_questions(id) on delete restrict,
  partner_id uuid not null references public.partners(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  value_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_form_response_answers_value_json check (jsonb_typeof(value_json) = 'object'),
  constraint partner_form_response_answers_response_question_key unique (response_id, question_id)
);

do $$
begin
  if to_regclass('public.partner_client_notes') is null then
    return;
  end if;

  insert into public.partner_client_anamnesis_entries (partner_id, patient_id, title, content, version_number, is_current, created_at, updated_at)
  select partner_id, patient_id, title, body,
    row_number() over (partition by partner_id, patient_id order by created_at),
    row_number() over (partition by partner_id, patient_id order by created_at desc) = 1,
    created_at, updated_at
  from public.partner_client_notes
  where note_type = 'anamnesis';

  insert into public.partner_client_prescription_notes (partner_id, patient_id, title, content, prescription_type, status, version_number, created_at, updated_at)
  select partner_id, patient_id, title, body, 'general', 'draft',
    row_number() over (partition by partner_id, patient_id order by created_at), created_at, updated_at
  from public.partner_client_notes
  where note_type = 'prescription';

  insert into public.partner_form_templates (id, partner_id, title, description, status, created_at, updated_at)
  select id, partner_id, title, description, case when status = 'archived' then 'archived' else 'active' end, created_at, updated_at
  from public.partner_form_templates_legacy_20260726;

  insert into public.partner_form_questions (template_id, partner_id, sort_order, question_type, prompt, required, options)
  select template.id, template.partner_id, question.ordinality - 1,
    case coalesce(question.value->>'type', 'text_short')
      when 'long_text' then 'text_long'
      when 'short_text' then 'text_short'
      when 'text_long' then 'text_long'
      when 'single_choice' then 'single_choice'
      when 'multiple_choice' then 'multiple_choice'
      when 'scale' then 'scale'
      when 'number' then 'number'
      when 'date' then 'date'
      when 'boolean' then 'boolean'
      else 'text_short'
    end,
    coalesce(nullif(btrim(question.value->>'prompt'), ''), nullif(btrim(question.value->>'label'), ''), 'Pergunta'),
    coalesce((question.value->>'required')::boolean, true),
    coalesce(question.value->'options', '[]'::jsonb)
  from public.partner_form_templates_legacy_20260726 template
  cross join lateral jsonb_array_elements(template.questions) with ordinality as question(value, ordinality);

  insert into public.partner_form_assignments (id, partner_id, template_id, title, message, status, sent_at, created_at, updated_at)
  select id, partner_id, template_id, title_snapshot, description_snapshot, status, sent_at, created_at, updated_at
  from public.partner_form_assignments_legacy_20260726;

  insert into public.partner_form_assignment_clients (id, assignment_id, partner_id, patient_id, status, submitted_at, created_at, updated_at)
  select id, assignment_id, partner_id, patient_id,
    case status when 'answered' then 'submitted' when 'closed' then 'canceled' else 'assigned' end,
    case when status = 'answered' then answered_at else null end,
    created_at, updated_at
  from public.partner_form_assignment_clients_legacy_20260726;

  insert into public.partner_form_responses (id, assignment_client_id, assignment_id, partner_id, patient_id, status, started_at, submitted_at, created_at, updated_at)
  select id, assignment_client_id, assignment_id, partner_id, patient_id, 'submitted', created_at, submitted_at, created_at, updated_at
  from public.partner_form_responses_legacy_20260726;
end
$$;

create index if not exists partner_form_questions_template_idx on public.partner_form_questions (template_id, sort_order);
create index if not exists partner_form_assignments_partner_created_idx on public.partner_form_assignments (partner_id, created_at desc);
create index if not exists partner_form_assignment_clients_patient_idx on public.partner_form_assignment_clients (patient_id, status, created_at desc);
create index if not exists partner_form_assignment_clients_partner_patient_idx on public.partner_form_assignment_clients (partner_id, patient_id, created_at desc);
create index if not exists partner_form_responses_partner_patient_idx on public.partner_form_responses (partner_id, patient_id, created_at desc);
create index if not exists partner_form_response_answers_response_idx on public.partner_form_response_answers (response_id);

alter table public.partner_client_anamnesis_entries enable row level security;
alter table public.partner_client_prescription_notes enable row level security;
alter table public.partner_form_templates enable row level security;
alter table public.partner_form_questions enable row level security;
alter table public.partner_form_assignments enable row level security;
alter table public.partner_form_assignment_clients enable row level security;
alter table public.partner_form_responses enable row level security;
alter table public.partner_form_response_answers enable row level security;

revoke all on table public.partner_client_anamnesis_entries, public.partner_client_prescription_notes, public.partner_form_templates, public.partner_form_questions, public.partner_form_assignments, public.partner_form_assignment_clients, public.partner_form_responses, public.partner_form_response_answers from public, anon, authenticated;
grant select, insert, update on table public.partner_client_anamnesis_entries, public.partner_client_prescription_notes, public.partner_form_templates, public.partner_form_questions, public.partner_form_assignments to authenticated;
grant select, insert on table public.partner_form_assignment_clients, public.partner_form_responses, public.partner_form_response_answers to authenticated;
grant update (status, opened_at, submitted_at) on table public.partner_form_assignment_clients to authenticated;
grant update (status, submitted_at) on table public.partner_form_responses to authenticated;
grant update (value_json) on table public.partner_form_response_answers to authenticated;

drop policy if exists partner_client_anamnesis_entries_select_linked on public.partner_client_anamnesis_entries;
drop policy if exists partner_client_anamnesis_entries_insert_linked on public.partner_client_anamnesis_entries;
drop policy if exists partner_client_anamnesis_entries_update_linked on public.partner_client_anamnesis_entries;
create policy partner_client_anamnesis_entries_select_linked on public.partner_client_anamnesis_entries for select to authenticated using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_anamnesis_entries_insert_linked on public.partner_client_anamnesis_entries for insert to authenticated with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_anamnesis_entries_update_linked on public.partner_client_anamnesis_entries for update to authenticated using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id)) with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));

drop policy if exists partner_client_prescription_notes_select_linked on public.partner_client_prescription_notes;
drop policy if exists partner_client_prescription_notes_insert_linked on public.partner_client_prescription_notes;
drop policy if exists partner_client_prescription_notes_update_linked on public.partner_client_prescription_notes;
create policy partner_client_prescription_notes_select_linked on public.partner_client_prescription_notes for select to authenticated using ((partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id)) or (patient_id = public.current_active_patient_id() and status = 'published'));
create policy partner_client_prescription_notes_insert_linked on public.partner_client_prescription_notes for insert to authenticated with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_prescription_notes_update_linked on public.partner_client_prescription_notes for update to authenticated using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id)) with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));

drop policy if exists partner_form_templates_select_owner_or_assigned on public.partner_form_templates;
drop policy if exists partner_form_templates_insert_owner on public.partner_form_templates;
drop policy if exists partner_form_templates_update_owner on public.partner_form_templates;
create policy partner_form_templates_select_owner_or_assigned on public.partner_form_templates for select to authenticated using (partner_id = public.current_active_partner_id() or exists (select 1 from public.partner_form_assignments assignment join public.partner_form_assignment_clients assigned on assigned.assignment_id = assignment.id where assignment.template_id = partner_form_templates.id and assigned.patient_id = public.current_active_patient_id() and assigned.status <> 'canceled' and assignment.status in ('sent', 'closed')));
create policy partner_form_templates_insert_owner on public.partner_form_templates for insert to authenticated with check (partner_id = public.current_active_partner_id());
create policy partner_form_templates_update_owner on public.partner_form_templates for update to authenticated using (partner_id = public.current_active_partner_id()) with check (partner_id = public.current_active_partner_id());

drop policy if exists partner_form_questions_select_owner_or_assigned on public.partner_form_questions;
drop policy if exists partner_form_questions_insert_owner on public.partner_form_questions;
drop policy if exists partner_form_questions_update_owner on public.partner_form_questions;
create policy partner_form_questions_select_owner_or_assigned on public.partner_form_questions for select to authenticated using (partner_id = public.current_active_partner_id() or exists (select 1 from public.partner_form_assignments assignment join public.partner_form_assignment_clients assigned on assigned.assignment_id = assignment.id where assignment.template_id = partner_form_questions.template_id and assigned.patient_id = public.current_active_patient_id() and assigned.status <> 'canceled' and assignment.status in ('sent', 'closed')));
create policy partner_form_questions_insert_owner on public.partner_form_questions for insert to authenticated with check (partner_id = public.current_active_partner_id());
create policy partner_form_questions_update_owner on public.partner_form_questions for update to authenticated using (partner_id = public.current_active_partner_id()) with check (partner_id = public.current_active_partner_id());

drop policy if exists partner_form_assignments_select_owner_or_assigned on public.partner_form_assignments;
drop policy if exists partner_form_assignments_insert_owner on public.partner_form_assignments;
drop policy if exists partner_form_assignments_update_owner on public.partner_form_assignments;
create policy partner_form_assignments_select_owner_or_assigned on public.partner_form_assignments for select to authenticated using (partner_id = public.current_active_partner_id() or exists (select 1 from public.partner_form_assignment_clients assigned where assigned.assignment_id = partner_form_assignments.id and assigned.patient_id = public.current_active_patient_id() and assigned.status <> 'canceled' and partner_form_assignments.status in ('sent', 'closed')));
create policy partner_form_assignments_insert_owner on public.partner_form_assignments for insert to authenticated with check (partner_id = public.current_active_partner_id());
create policy partner_form_assignments_update_owner on public.partner_form_assignments for update to authenticated using (partner_id = public.current_active_partner_id()) with check (partner_id = public.current_active_partner_id());

drop policy if exists partner_form_assignment_clients_select_owner_or_patient on public.partner_form_assignment_clients;
drop policy if exists partner_form_assignment_clients_insert_owner on public.partner_form_assignment_clients;
drop policy if exists partner_form_assignment_clients_update_owner_or_patient on public.partner_form_assignment_clients;
create policy partner_form_assignment_clients_select_owner_or_patient on public.partner_form_assignment_clients for select to authenticated using ((partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id)) or patient_id = public.current_active_patient_id());
create policy partner_form_assignment_clients_insert_owner on public.partner_form_assignment_clients for insert to authenticated with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_form_assignment_clients_update_owner_or_patient on public.partner_form_assignment_clients for update to authenticated using ((partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id)) or patient_id = public.current_active_patient_id()) with check ((partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id)) or patient_id = public.current_active_patient_id());

drop policy if exists partner_form_responses_select_owner_or_patient on public.partner_form_responses;
drop policy if exists partner_form_responses_insert_patient on public.partner_form_responses;
drop policy if exists partner_form_responses_update_patient on public.partner_form_responses;
create policy partner_form_responses_select_owner_or_patient on public.partner_form_responses for select to authenticated using ((partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id)) or patient_id = public.current_active_patient_id());
create policy partner_form_responses_insert_patient on public.partner_form_responses for insert to authenticated with check (patient_id = public.current_active_patient_id() and exists (select 1 from public.partner_form_assignment_clients assigned where assigned.id = partner_form_responses.assignment_client_id and assigned.assignment_id = partner_form_responses.assignment_id and assigned.partner_id = partner_form_responses.partner_id and assigned.patient_id = public.current_active_patient_id() and assigned.status in ('assigned', 'opened', 'in_progress')));
create policy partner_form_responses_update_patient on public.partner_form_responses for update to authenticated using (patient_id = public.current_active_patient_id()) with check (patient_id = public.current_active_patient_id());

drop policy if exists partner_form_response_answers_select_owner_or_patient on public.partner_form_response_answers;
drop policy if exists partner_form_response_answers_insert_patient on public.partner_form_response_answers;
drop policy if exists partner_form_response_answers_update_patient on public.partner_form_response_answers;
create policy partner_form_response_answers_select_owner_or_patient on public.partner_form_response_answers for select to authenticated using ((partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id)) or patient_id = public.current_active_patient_id());
create policy partner_form_response_answers_insert_patient on public.partner_form_response_answers for insert to authenticated with check (patient_id = public.current_active_patient_id() and exists (select 1 from public.partner_form_responses response where response.id = partner_form_response_answers.response_id and response.patient_id = public.current_active_patient_id() and response.status = 'in_progress'));
create policy partner_form_response_answers_update_patient on public.partner_form_response_answers for update to authenticated using (patient_id = public.current_active_patient_id() and exists (select 1 from public.partner_form_responses response where response.id = partner_form_response_answers.response_id and response.patient_id = public.current_active_patient_id() and response.status = 'in_progress')) with check (patient_id = public.current_active_patient_id() and exists (select 1 from public.partner_form_responses response where response.id = partner_form_response_answers.response_id and response.patient_id = public.current_active_patient_id() and response.status = 'in_progress'));

drop trigger if exists partner_client_anamnesis_entries_set_updated_at on public.partner_client_anamnesis_entries;
drop trigger if exists partner_client_prescription_notes_set_updated_at on public.partner_client_prescription_notes;
drop trigger if exists partner_form_templates_set_updated_at on public.partner_form_templates;
drop trigger if exists partner_form_questions_set_updated_at on public.partner_form_questions;
drop trigger if exists partner_form_assignments_set_updated_at on public.partner_form_assignments;
drop trigger if exists partner_form_assignment_clients_set_updated_at on public.partner_form_assignment_clients;
drop trigger if exists partner_form_responses_set_updated_at on public.partner_form_responses;
drop trigger if exists partner_form_response_answers_set_updated_at on public.partner_form_response_answers;
create trigger partner_client_anamnesis_entries_set_updated_at before update on public.partner_client_anamnesis_entries for each row execute function public.set_updated_at();
create trigger partner_client_prescription_notes_set_updated_at before update on public.partner_client_prescription_notes for each row execute function public.set_updated_at();
create trigger partner_form_templates_set_updated_at before update on public.partner_form_templates for each row execute function public.set_updated_at();
create trigger partner_form_questions_set_updated_at before update on public.partner_form_questions for each row execute function public.set_updated_at();
create trigger partner_form_assignments_set_updated_at before update on public.partner_form_assignments for each row execute function public.set_updated_at();
create trigger partner_form_assignment_clients_set_updated_at before update on public.partner_form_assignment_clients for each row execute function public.set_updated_at();
create trigger partner_form_responses_set_updated_at before update on public.partner_form_responses for each row execute function public.set_updated_at();
create trigger partner_form_response_answers_set_updated_at before update on public.partner_form_response_answers for each row execute function public.set_updated_at();
