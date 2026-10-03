-- Permite ao Parceiro atualizar os dados básicos da própria conta de forma atômica.
-- E-mail, credenciais, papel e status permanecem imutáveis nesta operação.

create or replace function public.get_partner_account_profile()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'displayName', profile.display_name,
    'email', profile.email,
    'phone', coalesce(profile.phone, ''),
    'professionalType', partner.professional_type,
    'professionalRegistryType', coalesce(partner.professional_registry_type, ''),
    'professionalRegistryNumber', coalesce(partner.professional_registry_number, '')
  )
  from public.profiles as profile
  join public.partners as partner on partner.profile_id = profile.id
  where profile.id = public.current_active_profile_id()
    and partner.id = public.current_active_partner_id()
    and profile.role = 'parceiro'
    and profile.status = 'active'
  limit 1;
$$;

revoke all on function public.get_partner_account_profile() from public, anon;
grant execute on function public.get_partner_account_profile() to authenticated;

create or replace function public.update_partner_account_profile(
  p_display_name text,
  p_phone text,
  p_professional_type text,
  p_professional_registry_type text,
  p_professional_registry_number text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_profile_id uuid := public.current_active_profile_id();
  current_partner_id uuid := public.current_active_partner_id();
  normalized_display_name text := btrim(coalesce(p_display_name, ''));
  normalized_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  normalized_professional_type text := lower(btrim(coalesce(p_professional_type, '')));
  normalized_registry_type text := nullif(lower(btrim(coalesce(p_professional_registry_type, ''))), '');
  normalized_registry_number text := nullif(btrim(coalesce(p_professional_registry_number, '')), '');
begin
  if auth.uid() is null or current_profile_id is null or current_partner_id is null then
    raise exception 'partner authentication is required' using errcode = '42501';
  end if;

  if length(normalized_display_name) < 2
    or length(normalized_display_name) > 160
    or normalized_display_name !~ '\S'
    or normalized_professional_type not in ('personal_trainer', 'nutricionista', 'medico')
    or (normalized_phone is not null and normalized_phone !~ '^\+[1-9][0-9]{7,14}$')
    or (normalized_registry_type is null and normalized_registry_number is not null)
    or (normalized_registry_type is not null and normalized_registry_number is null)
    or (normalized_registry_type is not null and normalized_registry_type not in ('crm', 'crn', 'cref', 'outro'))
    or (normalized_registry_number is not null and length(normalized_registry_number) > 64)
  then
    raise exception 'invalid partner account data' using errcode = '22023';
  end if;

  perform 1
    from public.partners as partner
    join public.profiles as profile on profile.id = partner.profile_id
    where partner.id = current_partner_id
      and partner.profile_id = current_profile_id
      and profile.user_id = auth.uid()
      and profile.role = 'parceiro'
      and profile.status = 'active'
    for update;

  if not found then
    raise exception 'partner account is unavailable' using errcode = '42501';
  end if;

  update public.profiles
  set display_name = normalized_display_name,
      phone = normalized_phone
  where id = current_profile_id;

  update public.partners
  set professional_name = normalized_display_name,
      professional_type = normalized_professional_type,
      professional_registry_type = normalized_registry_type,
      professional_registry_number = normalized_registry_number
  where id = current_partner_id;

  return true;
end;
$$;

revoke all on function public.update_partner_account_profile(text, text, text, text, text) from public, anon;
grant execute on function public.update_partner_account_profile(text, text, text, text, text) to authenticated;

comment on function public.update_partner_account_profile(text, text, text, text, text)
is 'Atualiza somente os dados básicos do Parceiro autenticado em profiles e partners, dentro de uma transação única.';
