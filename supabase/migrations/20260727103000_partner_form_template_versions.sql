-- Immutable form versions: templates remain the library identity while every
-- assignment keeps the exact published questionnaire that was sent.
alter table public.partner_form_templates drop constraint if exists partner_form_templates_status_check;
alter table public.partner_form_templates add constraint partner_form_templates_status_check
  check (status in ('draft', 'active', 'archived'));
alter table public.partner_form_templates add column if not exists default_message text;

alter table public.partner_form_questions add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.partner_form_questions add constraint partner_form_questions_settings_object
  check (jsonb_typeof(settings) = 'object');

create table public.partner_form_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.partner_form_templates(id) on delete restrict,
  partner_id uuid not null references public.partners(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  title text not null check (length(btrim(title)) > 0),
  description text,
  default_message text,
  questions_snapshot jsonb not null check (jsonb_typeof(questions_snapshot) = 'array'),
  status text not null check (status in ('draft', 'published')),
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (template_id, version_number)
);
create index partner_form_template_versions_partner_idx on public.partner_form_template_versions (partner_id, template_id, version_number desc);

alter table public.partner_form_assignments add column template_version_id uuid references public.partner_form_template_versions(id) on delete restrict;
alter table public.partner_form_assignments add column template_snapshot jsonb;
alter table public.partner_form_assignments add column request_key uuid;
alter table public.partner_form_assignments add constraint partner_form_assignments_snapshot_object check (template_snapshot is null or jsonb_typeof(template_snapshot) = 'object');
create unique index partner_form_assignments_request_key on public.partner_form_assignments (partner_id, request_key) where request_key is not null;

insert into public.partner_form_template_versions (template_id, partner_id, version_number, title, description, default_message, questions_snapshot, status, created_by_profile_id, created_at, published_at)
select template.id, template.partner_id, 1, template.title, template.description, template.default_message,
  coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'type', q.question_type, 'prompt', q.prompt, 'helpText', q.help_text, 'required', q.required, 'options', q.options, 'scaleMin', q.scale_min, 'scaleMax', q.scale_max, 'settings', q.settings) order by q.sort_order) from public.partner_form_questions q where q.template_id = template.id), '[]'::jsonb),
  case when template.status = 'active' then 'published' else 'draft' end,
  template.created_by_profile_id, template.created_at,
  case when template.status = 'active' then template.updated_at else null end
from public.partner_form_templates template;

alter table public.partner_form_questions add column template_version_id uuid references public.partner_form_template_versions(id) on delete restrict;
update public.partner_form_questions q set template_version_id=v.id from public.partner_form_template_versions v where v.template_id=q.template_id and v.version_number=1;
alter table public.partner_form_questions drop constraint partner_form_questions_template_sort_key;
alter table public.partner_form_questions add constraint partner_form_questions_version_sort_key unique(template_version_id,sort_order);

update public.partner_form_assignments assignment set
  template_version_id = version.id,
  template_snapshot = jsonb_build_object('title', version.title, 'description', version.description, 'message', coalesce(assignment.message, version.default_message), 'questions', version.questions_snapshot, 'version', version.version_number)
from public.partner_form_template_versions version
where version.template_id = assignment.template_id and version.version_number = 1;
alter table public.partner_form_assignments alter column template_version_id set not null;
alter table public.partner_form_assignments alter column template_snapshot set not null;

alter table public.partner_form_template_versions enable row level security;
revoke all on public.partner_form_template_versions from public, anon, authenticated;
grant select, insert on public.partner_form_template_versions to authenticated;
create policy partner_form_template_versions_owner on public.partner_form_template_versions for select to authenticated using (partner_id = public.current_active_partner_id());
create policy partner_form_template_versions_insert_owner on public.partner_form_template_versions for insert to authenticated with check (partner_id = public.current_active_partner_id());
drop policy if exists partner_form_questions_select_owner_or_assigned on public.partner_form_questions;
create policy partner_form_questions_select_owner_or_assigned on public.partner_form_questions for select to authenticated using (
  partner_id = public.current_active_partner_id() or exists (
    select 1 from public.partner_form_assignments assignment
    join public.partner_form_assignment_clients assigned on assigned.assignment_id=assignment.id
    where assignment.template_version_id=partner_form_questions.template_version_id
      and assigned.patient_id=public.current_active_patient_id()
      and assigned.status<>'canceled'
  )
);
drop policy if exists partner_form_questions_update_owner on public.partner_form_questions;
revoke update on public.partner_form_questions from authenticated;

create function public.save_partner_form_template(p_template_id uuid, p_title text, p_description text, p_default_message text, p_status text, p_questions jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare partner uuid := public.current_active_partner_id(); actor uuid; template uuid; version uuid; next_version integer; normalized_questions jsonb;
begin
  if auth.uid() is null or partner is null then raise exception 'forbidden' using errcode='42501'; end if;
  if p_status not in ('draft','active') or jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) = 0 then raise exception 'invalid form' using errcode='22023'; end if;
  if exists (select 1 from jsonb_array_elements(p_questions) q where nullif(btrim(q->>'prompt'),'') is null or q->>'type' not in ('text_short','text_long','single_choice','multiple_choice','scale','number','date','boolean')) then raise exception 'invalid questions' using errcode='22023'; end if;
  select id into actor from public.profiles where user_id=auth.uid();
  if p_template_id is null then insert into public.partner_form_templates(partner_id,title,description,default_message,status,created_by_profile_id) values(partner,btrim(p_title),nullif(btrim(p_description),''),nullif(btrim(p_default_message),''),p_status,actor) returning id into template;
  else select id into template from public.partner_form_templates where id=p_template_id and partner_id=partner for update; if template is null then raise exception 'not found' using errcode='P0002'; end if; update public.partner_form_templates set title=btrim(p_title),description=nullif(btrim(p_description),''),default_message=nullif(btrim(p_default_message),''),status=p_status where id=template; end if;
  select coalesce(max(version_number),0)+1 into next_version from public.partner_form_template_versions where template_id=template;
  select jsonb_agg(q || jsonb_build_object('id',gen_random_uuid()) order by ordinality) into normalized_questions from jsonb_array_elements(p_questions) with ordinality x(q,ordinality);
  insert into public.partner_form_template_versions(template_id,partner_id,version_number,title,description,default_message,questions_snapshot,status,created_by_profile_id,published_at) values(template,partner,next_version,btrim(p_title),nullif(btrim(p_description),''),nullif(btrim(p_default_message),''),normalized_questions,case when p_status='active' then 'published' else 'draft' end,actor,case when p_status='active' then now() end) returning id into version;
  insert into public.partner_form_questions(id,template_id,template_version_id,partner_id,sort_order,question_type,prompt,help_text,required,options,scale_min,scale_max,settings)
  select (q->>'id')::uuid,template,version,partner,ordinality-1,q->>'type',btrim(q->>'prompt'),nullif(btrim(q->>'helpText'),''),coalesce((q->>'required')::boolean,true),coalesce(q->'options','[]'::jsonb),nullif(q->>'scaleMin','')::int,nullif(q->>'scaleMax','')::int,coalesce(q->'settings','{}'::jsonb) from jsonb_array_elements(normalized_questions) with ordinality x(q,ordinality);
  return template;
end $$;

create function public.send_partner_form_template(p_template_id uuid,p_patient_ids uuid[],p_message text,p_due_at timestamptz,p_request_key uuid)
returns uuid language plpgsql security invoker set search_path=public as $$
declare partner uuid:=public.current_active_partner_id(); actor uuid; version public.partner_form_template_versions%rowtype; assignment uuid; normalized_message text; existing_patients uuid[];
begin
  if auth.uid() is null or partner is null or cardinality(p_patient_ids)=0 then raise exception 'forbidden' using errcode='42501'; end if;
  if exists(select 1 from unnest(p_patient_ids) patient where not public.current_partner_has_active_patient_link(patient)) then raise exception 'forbidden' using errcode='42501'; end if;
  select v.* into version from public.partner_form_template_versions v join public.partner_form_templates t on t.id=v.template_id where v.template_id=p_template_id and v.partner_id=partner and t.status='active' and v.status='published' order by v.version_number desc limit 1;
  if version.id is null then raise exception 'not found' using errcode='P0002'; end if;
  select id into actor from public.profiles where user_id=auth.uid();
  normalized_message := coalesce(nullif(btrim(p_message),''),version.default_message);
  select id into assignment from public.partner_form_assignments where partner_id=partner and request_key=p_request_key for update;
  if assignment is not null then
    select array_agg(patient_id order by patient_id) into existing_patients
    from public.partner_form_assignment_clients where assignment_id=assignment;
    if not exists (
      select 1 from public.partner_form_assignments existing
      where existing.id=assignment and existing.template_id=p_template_id
        and existing.message is not distinct from normalized_message
        and existing.due_at is not distinct from p_due_at
    ) or existing_patients is distinct from (
      select array_agg(patient order by patient) from (select distinct unnest(p_patient_ids) patient) requested
    ) then
      raise exception 'idempotency conflict' using errcode='23505';
    end if;
    return assignment;
  end if;
  insert into public.partner_form_assignments(partner_id,template_id,template_version_id,title,message,status,sent_at,due_at,created_by_profile_id,template_snapshot,request_key)
  values(partner,p_template_id,version.id,version.title,normalized_message,'sent',now(),p_due_at,actor,jsonb_build_object('title',version.title,'description',version.description,'message',normalized_message,'questions',version.questions_snapshot,'version',version.version_number),p_request_key)
  returning id into assignment;
  insert into public.partner_form_assignment_clients(assignment_id,partner_id,patient_id,status) select assignment,partner,patient,'assigned' from (select distinct unnest(p_patient_ids) patient) x on conflict(assignment_id,patient_id) do nothing;
  return assignment;
end $$;

revoke all on function public.save_partner_form_template(uuid,text,text,text,text,jsonb), public.send_partner_form_template(uuid,uuid[],text,timestamptz,uuid) from public,anon;
grant execute on function public.save_partner_form_template(uuid,text,text,text,text,jsonb), public.send_partner_form_template(uuid,uuid[],text,timestamptz,uuid) to authenticated;
