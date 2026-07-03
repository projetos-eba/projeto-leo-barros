-- Dominio clinico da aba Fotos do Cliente.
-- Dados de smoke permanecem em supabase/seed.sql; arquivos ficam em Storage privado.

create table public.partner_client_photo_sessions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  captured_at timestamptz not null,
  title text not null default 'Sessao de fotos',
  status text not null default 'complete',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_photo_sessions_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_photo_sessions_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_photo_sessions_title_not_blank
    check (length(btrim(title)) > 0),
  constraint partner_client_photo_sessions_status_check
    check (status in ('draft', 'complete', 'archived')),
  constraint partner_client_photo_sessions_notes_not_blank
    check (notes is null or length(btrim(notes)) > 0)
);

create table public.partner_client_photo_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  partner_id uuid not null,
  patient_id uuid not null,
  angle text not null,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  size_bytes integer not null,
  width_px integer,
  height_px integer,
  crop_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_photo_items_session_id_fkey
    foreign key (session_id) references public.partner_client_photo_sessions(id) on delete cascade,
  constraint partner_client_photo_items_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_photo_items_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_photo_items_angle_check
    check (angle in ('front', 'back', 'left', 'right')),
  constraint partner_client_photo_items_mime_check
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint partner_client_photo_items_size_check
    check (size_bytes between 1 and 15728640),
  constraint partner_client_photo_items_width_check
    check (width_px is null or width_px between 1 and 12000),
  constraint partner_client_photo_items_height_check
    check (height_px is null or height_px between 1 and 12000),
  constraint partner_client_photo_items_path_not_blank
    check (length(btrim(storage_path)) > 0),
  constraint partner_client_photo_items_filename_not_blank
    check (length(btrim(original_filename)) > 0),
  constraint partner_client_photo_items_crop_object
    check (jsonb_typeof(crop_data) = 'object'),
  constraint partner_client_photo_items_unique_angle
    unique (session_id, angle),
  constraint partner_client_photo_items_storage_path_unique
    unique (storage_path)
);

create table public.partner_client_photo_comparison_notes (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  before_session_id uuid not null,
  after_session_id uuid not null,
  notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_client_photo_comparison_notes_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_photo_comparison_notes_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_photo_comparison_notes_before_fkey
    foreign key (before_session_id) references public.partner_client_photo_sessions(id) on delete cascade,
  constraint partner_client_photo_comparison_notes_after_fkey
    foreign key (after_session_id) references public.partner_client_photo_sessions(id) on delete cascade,
  constraint partner_client_photo_comparison_notes_different
    check (before_session_id <> after_session_id),
  constraint partner_client_photo_comparison_notes_not_blank
    check (length(btrim(notes)) > 0),
  constraint partner_client_photo_comparison_notes_unique
    unique (partner_id, patient_id, before_session_id, after_session_id)
);

create table public.partner_client_photo_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid,
  session_id uuid,
  actor_name text,
  event_type text not null,
  detail text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint partner_client_photo_events_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_client_photo_events_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_client_photo_events_session_id_fkey
    foreign key (session_id) references public.partner_client_photo_sessions(id) on delete cascade,
  constraint partner_client_photo_events_type_not_blank
    check (length(btrim(event_type)) > 0),
  constraint partner_client_photo_events_detail_not_blank
    check (length(btrim(detail)) > 0),
  constraint partner_client_photo_events_details_object
    check (jsonb_typeof(details) = 'object')
);

create index partner_client_photo_sessions_patient_date_idx
  on public.partner_client_photo_sessions (partner_id, patient_id, captured_at desc);
create index partner_client_photo_items_patient_idx
  on public.partner_client_photo_items (partner_id, patient_id, angle);
create index partner_client_photo_events_patient_idx
  on public.partner_client_photo_events (partner_id, patient_id, created_at desc);

create trigger partner_client_photo_sessions_set_updated_at
before update on public.partner_client_photo_sessions
for each row execute function public.set_updated_at();
create trigger partner_client_photo_items_set_updated_at
before update on public.partner_client_photo_items
for each row execute function public.set_updated_at();
create trigger partner_client_photo_comparison_notes_set_updated_at
before update on public.partner_client_photo_comparison_notes
for each row execute function public.set_updated_at();

alter table public.partner_client_photo_sessions enable row level security;
alter table public.partner_client_photo_items enable row level security;
alter table public.partner_client_photo_comparison_notes enable row level security;
alter table public.partner_client_photo_events enable row level security;

revoke all on table public.partner_client_photo_sessions from public, anon, authenticated;
revoke all on table public.partner_client_photo_items from public, anon, authenticated;
revoke all on table public.partner_client_photo_comparison_notes from public, anon, authenticated;
revoke all on table public.partner_client_photo_events from public, anon, authenticated;

grant select, insert, update, delete on table public.partner_client_photo_sessions to authenticated;
grant select, insert, update, delete on table public.partner_client_photo_items to authenticated;
grant select, insert, update, delete on table public.partner_client_photo_comparison_notes to authenticated;
grant select, insert on table public.partner_client_photo_events to authenticated;

grant select, insert, update, delete on table public.partner_client_photo_sessions to service_role;
grant select, insert, update, delete on table public.partner_client_photo_items to service_role;
grant select, insert, update, delete on table public.partner_client_photo_comparison_notes to service_role;
grant select, insert, update, delete on table public.partner_client_photo_events to service_role;

create policy partner_client_photo_sessions_select_own_partner
on public.partner_client_photo_sessions for select to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_photo_sessions_insert_own_partner
on public.partner_client_photo_sessions for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_photo_sessions_update_own_partner
on public.partner_client_photo_sessions for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_photo_sessions_delete_own_partner
on public.partner_client_photo_sessions for delete to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));

create policy partner_client_photo_items_select_own_partner
on public.partner_client_photo_items for select to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_photo_items_insert_own_partner
on public.partner_client_photo_items for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_photo_items_update_own_partner
on public.partner_client_photo_items for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_photo_items_delete_own_partner
on public.partner_client_photo_items for delete to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));

create policy partner_client_photo_notes_select_own_partner
on public.partner_client_photo_comparison_notes for select to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_photo_notes_insert_own_partner
on public.partner_client_photo_comparison_notes for insert to authenticated
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_photo_notes_update_own_partner
on public.partner_client_photo_comparison_notes for update to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id))
with check (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));
create policy partner_client_photo_notes_delete_own_partner
on public.partner_client_photo_comparison_notes for delete to authenticated
using (partner_id = public.current_active_partner_id() and public.current_partner_has_active_patient_link(patient_id));

create policy partner_client_photo_events_select_own_partner
on public.partner_client_photo_events for select to authenticated
using (
  partner_id = public.current_active_partner_id()
  and (patient_id is null or public.current_partner_has_active_patient_link(patient_id))
);
create policy partner_client_photo_events_insert_own_partner
on public.partner_client_photo_events for insert to authenticated
with check (
  partner_id = public.current_active_partner_id()
  and (patient_id is null or public.current_partner_has_active_patient_link(patient_id))
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'partner-client-photos',
  'partner-client-photos',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy partner_client_photo_storage_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'partner-client-photos'
  and (storage.foldername(name))[1] = public.current_active_partner_id()::text
);

create policy partner_client_photo_storage_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'partner-client-photos'
  and (storage.foldername(name))[1] = public.current_active_partner_id()::text
);

create policy partner_client_photo_storage_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'partner-client-photos'
  and (storage.foldername(name))[1] = public.current_active_partner_id()::text
)
with check (
  bucket_id = 'partner-client-photos'
  and (storage.foldername(name))[1] = public.current_active_partner_id()::text
);

create policy partner_client_photo_storage_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'partner-client-photos'
  and (storage.foldername(name))[1] = public.current_active_partner_id()::text
);

create or replace function public.partner_client_photos(p_patient_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_partner_id uuid := public.current_active_partner_id();
  result jsonb;
begin
  if current_partner_id is null or not public.current_partner_has_active_patient_link(p_patient_id) then
    return null;
  end if;

  with ordered_sessions as (
    select
      session.id,
      session.captured_at,
      session.title,
      session.status,
      session.notes,
      session.created_at,
      session.updated_at
    from public.partner_client_photo_sessions as session
    where session.partner_id = current_partner_id
      and session.patient_id = p_patient_id
      and session.status <> 'archived'
  ),
  session_measurements as (
    select
      session.id as session_id,
      assessment.weight_kg,
      (
        select c.value_cm
        from public.partner_client_assessment_circumferences c
        where c.assessment_id = assessment.id and c.metric_key = 'waist'
      ) as waist_cm,
      (
        select c.value_cm
        from public.partner_client_assessment_circumferences c
        where c.assessment_id = assessment.id and c.metric_key = 'hip'
      ) as hip_cm,
      (
        select round(avg(c.value_cm)::numeric, 2)
        from public.partner_client_assessment_circumferences c
        where c.assessment_id = assessment.id
          and c.metric_key in ('right_arm_contracted', 'left_arm_contracted')
      ) as arm_cm,
      (
        select round(avg(c.value_cm)::numeric, 2)
        from public.partner_client_assessment_circumferences c
        where c.assessment_id = assessment.id
          and c.metric_key in ('right_thigh', 'left_thigh')
      ) as thigh_cm,
      (
        select round(avg(c.value_cm)::numeric, 2)
        from public.partner_client_assessment_circumferences c
        where c.assessment_id = assessment.id
          and c.metric_key in ('right_calf', 'left_calf')
      ) as calf_cm
    from ordered_sessions session
    left join lateral (
      select a.*
      from public.partner_client_assessments a
      where a.partner_id = current_partner_id
        and a.patient_id = p_patient_id
      order by abs(extract(epoch from (a.assessed_at - session.captured_at))) asc
      limit 1
    ) assessment on true
  ),
  sessions_json as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', session.id,
      'capturedAt', session.captured_at,
      'title', session.title,
      'status', session.status,
      'notes', session.notes,
      'createdAt', session.created_at,
      'updatedAt', session.updated_at,
      'measurements', jsonb_build_object(
        'weightKg', measurement.weight_kg,
        'waistCm', measurement.waist_cm,
        'hipCm', measurement.hip_cm,
        'armCm', measurement.arm_cm,
        'thighCm', measurement.thigh_cm,
        'calfCm', measurement.calf_cm
      ),
      'photos', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', item.id,
          'angle', item.angle,
          'storagePath', item.storage_path,
          'originalFilename', item.original_filename,
          'mimeType', item.mime_type,
          'sizeBytes', item.size_bytes,
          'widthPx', item.width_px,
          'heightPx', item.height_px,
          'cropData', item.crop_data,
          'createdAt', item.created_at
        ) order by case item.angle when 'front' then 1 when 'back' then 2 when 'left' then 3 else 4 end)
        from public.partner_client_photo_items item
        where item.session_id = session.id
      ), '[]'::jsonb)
    ) order by session.captured_at desc), '[]'::jsonb) as sessions
    from ordered_sessions session
    left join session_measurements measurement on measurement.session_id = session.id
  )
  select jsonb_build_object(
    'generatedAt', now(),
    'partnerId', current_partner_id,
    'patientId', p_patient_id,
    'sessions', sessions_json.sessions,
    'comparisonNotes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', note.id,
        'beforeSessionId', note.before_session_id,
        'afterSessionId', note.after_session_id,
        'notes', note.notes,
        'updatedAt', note.updated_at
      ) order by note.updated_at desc)
      from public.partner_client_photo_comparison_notes note
      where note.partner_id = current_partner_id
        and note.patient_id = p_patient_id
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', event.id,
        'sessionId', event.session_id,
        'actorName', event.actor_name,
        'eventType', event.event_type,
        'detail', event.detail,
        'details', event.details,
        'createdAt', event.created_at
      ) order by event.created_at desc)
      from public.partner_client_photo_events event
      where event.partner_id = current_partner_id
        and event.patient_id = p_patient_id
    ), '[]'::jsonb)
  )
  into result
  from sessions_json;

  return result;
end;
$$;

revoke all on function public.partner_client_photos(uuid) from public;
grant execute on function public.partner_client_photos(uuid) to authenticated;

comment on function public.partner_client_photos(uuid)
is 'Retorna sessoes de fotos, medidas derivadas e comparacoes do Cliente para o Parceiro vinculado, sem CPF ou bucket publico.';

notify pgrst, 'reload schema';
