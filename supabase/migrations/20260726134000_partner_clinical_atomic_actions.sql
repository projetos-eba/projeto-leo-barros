create or replace function public.save_partner_client_anamnesis_entry(
  p_patient_id uuid,
  p_title text,
  p_summary text,
  p_content text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_partner_id uuid := public.current_active_partner_id();
  actor_profile_id uuid;
  next_version integer;
  entry_id uuid;
begin
  if current_partner_id is null or not public.current_partner_has_active_patient_link(p_patient_id) then
    raise exception 'partner does not have an active client link' using errcode = '42501';
  end if;

  select id into actor_profile_id from public.profiles where user_id = auth.uid();
  perform pg_advisory_xact_lock(hashtextextended(current_partner_id::text || ':' || p_patient_id::text, 0));

  update public.partner_client_anamnesis_entries
    set is_current = false
    where partner_id = current_partner_id and patient_id = p_patient_id and is_current;

  select coalesce(max(version_number), 0) + 1 into next_version
    from public.partner_client_anamnesis_entries
    where partner_id = current_partner_id and patient_id = p_patient_id;

  insert into public.partner_client_anamnesis_entries (
    partner_id, patient_id, title, summary, content, sections, version_number, is_current, created_by_profile_id
  ) values (
    current_partner_id, p_patient_id, p_title, nullif(btrim(p_summary), ''), p_content, '{}'::jsonb, next_version, true, actor_profile_id
  ) returning id into entry_id;

  return entry_id;
end;
$$;

revoke all on function public.save_partner_client_anamnesis_entry(uuid, text, text, text) from public, anon;
grant execute on function public.save_partner_client_anamnesis_entry(uuid, text, text, text) to authenticated;
