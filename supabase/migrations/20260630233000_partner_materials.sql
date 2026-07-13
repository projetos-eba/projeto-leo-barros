create table public.partner_materials (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  title text not null,
  description text,
  category text not null,
  material_kind text not null,
  file_type text not null,
  original_filename text,
  mime_type text,
  size_bytes bigint,
  storage_path text,
  cover_storage_path text,
  external_url text,
  tags text[] not null default '{}',
  status text not null default 'active',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_materials_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_materials_id_partner_key unique (id, partner_id),
  constraint partner_materials_title_not_blank
    check (length(btrim(title)) between 3 and 140),
  constraint partner_materials_description_not_blank
    check (description is null or length(btrim(description)) > 0),
  constraint partner_materials_category_check
    check (category in ('nutricao', 'treino', 'medico', 'educativo', 'formularios', 'outros')),
  constraint partner_materials_kind_check
    check (material_kind in ('file', 'video_link')),
  constraint partner_materials_file_type_check
    check (file_type in ('pdf', 'image', 'office', 'video')),
  constraint partner_materials_status_check
    check (status in ('active', 'archived')),
  constraint partner_materials_size_check
    check (size_bytes is null or size_bytes between 1 and 52428800),
  constraint partner_materials_file_shape_check
    check (
      (
        material_kind = 'file'
        and file_type in ('pdf', 'image', 'office')
        and original_filename is not null
        and mime_type is not null
        and size_bytes is not null
        and storage_path is not null
        and external_url is null
      )
      or (
        material_kind = 'video_link'
        and file_type = 'video'
        and original_filename is null
        and mime_type is null
        and size_bytes is null
        and storage_path is null
        and cover_storage_path is null
        and external_url is not null
      )
    ),
  constraint partner_materials_storage_path_not_blank
    check (storage_path is null or length(btrim(storage_path)) > 0),
  constraint partner_materials_cover_path_not_blank
    check (cover_storage_path is null or length(btrim(cover_storage_path)) > 0),
  constraint partner_materials_external_url_not_blank
    check (external_url is null or length(btrim(external_url)) > 0),
  constraint partner_materials_tags_limit
    check (cardinality(tags) <= 12)
);

create index partner_materials_partner_updated_idx
  on public.partner_materials (partner_id, updated_at desc);

create index partner_materials_partner_status_category_idx
  on public.partner_materials (partner_id, status, category);

create table public.partner_material_shares (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  material_id uuid not null,
  patient_id uuid not null,
  message text,
  status text not null default 'linked',
  shared_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_material_shares_material_partner_fkey
    foreign key (material_id, partner_id)
      references public.partner_materials(id, partner_id) on delete cascade,
  constraint partner_material_shares_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_material_shares_material_patient_key
    unique (material_id, patient_id),
  constraint partner_material_shares_message_not_blank
    check (message is null or length(btrim(message)) > 0),
  constraint partner_material_shares_message_length
    check (message is null or length(message) <= 300),
  constraint partner_material_shares_status_check
    check (status in ('linked', 'revoked')),
  constraint partner_material_shares_revoked_shape_check
    check (
      (status = 'linked' and revoked_at is null)
      or (status = 'revoked' and revoked_at is not null)
    )
);

create index partner_material_shares_partner_patient_idx
  on public.partner_material_shares (partner_id, patient_id, status);

create index partner_material_shares_material_status_idx
  on public.partner_material_shares (material_id, status);

create table public.partner_material_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  material_id uuid not null,
  patient_id uuid,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),

  constraint partner_material_events_material_partner_fkey
    foreign key (material_id, partner_id)
      references public.partner_materials(id, partner_id) on delete cascade,
  constraint partner_material_events_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_material_events_type_check
    check (event_type in (
      'created',
      'updated',
      'shared',
      'revoked',
      'favorited',
      'unfavorited',
      'archived',
      'restored',
      'accessed'
    )),
  constraint partner_material_events_details_object_check
    check (jsonb_typeof(details) = 'object')
);

create index partner_material_events_material_date_idx
  on public.partner_material_events (material_id, occurred_at desc);

create index partner_material_events_partner_date_idx
  on public.partner_material_events (partner_id, occurred_at desc);

create trigger partner_materials_set_updated_at
before update on public.partner_materials
for each row execute function public.set_updated_at();

create trigger partner_material_shares_set_updated_at
before update on public.partner_material_shares
for each row execute function public.set_updated_at();

alter table public.partner_materials enable row level security;
alter table public.partner_material_shares enable row level security;
alter table public.partner_material_events enable row level security;

revoke all on table public.partner_materials from public, anon, authenticated;
revoke all on table public.partner_material_shares from public, anon, authenticated;
revoke all on table public.partner_material_events from public, anon, authenticated;

grant select, insert, update on table public.partner_materials to authenticated;
grant select, insert, update on table public.partner_material_shares to authenticated;
grant select, insert on table public.partner_material_events to authenticated;

grant select, insert, update, delete on table public.partner_materials to service_role;
grant select, insert, update, delete on table public.partner_material_shares to service_role;
grant select, insert, update, delete on table public.partner_material_events to service_role;

create policy partner_materials_select_own_partner
on public.partner_materials for select to authenticated
using (partner_id = public.current_active_partner_id());

create policy partner_materials_insert_own_partner
on public.partner_materials for insert to authenticated
with check (partner_id = public.current_active_partner_id());

create policy partner_materials_update_own_partner
on public.partner_materials for update to authenticated
using (partner_id = public.current_active_partner_id())
with check (partner_id = public.current_active_partner_id());

create policy partner_material_shares_select_own_partner
on public.partner_material_shares for select to authenticated
using (partner_id = public.current_active_partner_id());

create policy partner_material_shares_insert_linked_client
on public.partner_material_shares for insert to authenticated
with check (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_patient_link(patient_id)
);

create policy partner_material_shares_update_linked_client
on public.partner_material_shares for update to authenticated
using (partner_id = public.current_active_partner_id())
with check (
  partner_id = public.current_active_partner_id()
  and public.current_partner_has_patient_link(patient_id)
);

create policy partner_material_events_select_own_partner
on public.partner_material_events for select to authenticated
using (partner_id = public.current_active_partner_id());

create policy partner_material_events_insert_own_partner
on public.partner_material_events for insert to authenticated
with check (
  partner_id = public.current_active_partner_id()
  and (
    patient_id is null
    or public.current_partner_has_patient_link(patient_id)
  )
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'partner-materials',
  'partner-materials',
  false,
  52428800,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy partner_material_storage_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'partner-materials'
  and (storage.foldername(name))[1] = public.current_active_partner_id()::text
);

create policy partner_material_storage_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'partner-materials'
  and (storage.foldername(name))[1] = public.current_active_partner_id()::text
);

create policy partner_material_storage_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'partner-materials'
  and (storage.foldername(name))[1] = public.current_active_partner_id()::text
)
with check (
  bucket_id = 'partner-materials'
  and (storage.foldername(name))[1] = public.current_active_partner_id()::text
);

create policy partner_material_storage_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'partner-materials'
  and (storage.foldername(name))[1] = public.current_active_partner_id()::text
);
