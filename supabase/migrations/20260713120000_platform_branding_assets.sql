grant select on public.platform_settings to anon;

drop policy if exists platform_settings_select_public_general on public.platform_settings;
create policy platform_settings_select_public_general
on public.platform_settings for select to anon, authenticated
using (key = 'general');

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'platform-assets',
  'platform-assets',
  true,
  2097152,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/x-icon',
    'image/vnd.microsoft.icon'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists platform_asset_storage_select_public on storage.objects;
create policy platform_asset_storage_select_public
on storage.objects for select to anon, authenticated
using (bucket_id = 'platform-assets');

drop policy if exists platform_asset_storage_insert_admin on storage.objects;
create policy platform_asset_storage_insert_admin
on storage.objects for insert to authenticated
with check (
  bucket_id = 'platform-assets'
  and (storage.foldername(name))[1] = 'branding'
  and public.current_active_admin_id() is not null
);

drop policy if exists platform_asset_storage_update_admin on storage.objects;
create policy platform_asset_storage_update_admin
on storage.objects for update to authenticated
using (
  bucket_id = 'platform-assets'
  and (storage.foldername(name))[1] = 'branding'
  and public.current_active_admin_id() is not null
)
with check (
  bucket_id = 'platform-assets'
  and (storage.foldername(name))[1] = 'branding'
  and public.current_active_admin_id() is not null
);

drop policy if exists platform_asset_storage_delete_admin on storage.objects;
create policy platform_asset_storage_delete_admin
on storage.objects for delete to authenticated
using (
  bucket_id = 'platform-assets'
  and (storage.foldername(name))[1] = 'branding'
  and public.current_active_admin_id() is not null
);
