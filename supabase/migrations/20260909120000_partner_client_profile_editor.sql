-- Minimal identity read for the editor; no clinical history or authentication identifiers.
create function public.get_partner_client_profile(p_patient_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or public.current_active_partner_id() is null
    or not public.current_partner_has_patient_link(p_patient_id) then return null; end if;
  return (select jsonb_build_object(
    'displayName', pr.display_name, 'email', pr.email,
    'phone', coalesce(pr.phone, pa.phone, ''),
    'birthDate', coalesce(pa.birth_date::text, ''),
    'biologicalSex', coalesce(pa.biological_sex, 'not_informed'),
    'objective', coalesce(pa.objective, '')
  ) from public.patients pa join public.profiles pr on pr.id = pa.profile_id where pa.id = p_patient_id);
end; $$;
revoke all on function public.get_partner_client_profile(uuid) from public, anon;
grant execute on function public.get_partner_client_profile(uuid) to authenticated;

create function public.update_partner_client_profile(
  p_patient_id uuid, p_display_name text, p_phone text,
  p_birth_date date, p_biological_sex text, p_objective text
) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare target_profile_id uuid;
begin
  if auth.uid() is null or public.current_active_partner_id() is null
    or not public.current_partner_has_patient_link(p_patient_id) then return false; end if;
  if p_display_name is null or length(btrim(p_display_name)) not between 2 and 160
    or (nullif(btrim(p_phone), '') is not null and btrim(p_phone) !~ '^\+[1-9][0-9]{7,14}$')
    or p_birth_date is null or p_birth_date > current_date
    or p_biological_sex is null or p_biological_sex not in ('female', 'male', 'not_informed')
    or p_objective is null or length(btrim(p_objective)) not between 1 and 120 then
    raise exception 'invalid client profile data' using errcode = '22023';
  end if;
  select profile_id into target_profile_id from public.patients where id = p_patient_id for update;
  if not found then return false; end if;
  update public.profiles set display_name = btrim(p_display_name), phone = nullif(btrim(p_phone), '') where id = target_profile_id;
  update public.patients set phone = nullif(btrim(p_phone), ''), birth_date = p_birth_date,
    biological_sex = p_biological_sex, objective = btrim(p_objective) where id = p_patient_id;
  return true;
end; $$;
revoke all on function public.update_partner_client_profile(uuid, text, text, date, text, text) from public, anon;
grant execute on function public.update_partner_client_profile(uuid, text, text, date, text, text) to authenticated;
