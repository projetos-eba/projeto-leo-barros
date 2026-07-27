-- Partner shell hardening: atomic protocol draft creation and clinical write
-- paths. All functions use SECURITY INVOKER so normal table RLS remains the
-- authorization boundary.

create or replace function public.create_partner_protocol_use_draft(
  p_item_type text,
  p_item_id uuid,
  p_patient_id uuid,
  p_plan_context text,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_partner_id uuid := public.current_active_partner_id();
  draft_id uuid;
begin
  if auth.uid() is null or current_partner_id is null then
    raise exception 'partner authentication is required' using errcode = '42501';
  end if;

  if p_item_type not in ('food', 'exercise') or p_plan_context not in ('rascunho', 'dieta', 'treino') then
    raise exception 'invalid protocol draft input' using errcode = '22023';
  end if;

  if p_patient_id is not null and not public.current_partner_has_active_patient_link(p_patient_id) then
    raise exception 'partner does not have an active client link' using errcode = '42501';
  end if;

  if p_item_type = 'food' then
    update public.partner_protocol_foods
      set usage_count = usage_count + 1
      where id = p_item_id and partner_id = current_partner_id
      returning id into p_item_id;

    if p_item_id is null then
      raise exception 'protocol item not found' using errcode = 'P0002';
    end if;

    insert into public.partner_protocol_use_drafts (partner_id, patient_id, item_type, food_id, notes, plan_context)
    values (current_partner_id, p_patient_id, 'food', p_item_id, nullif(btrim(p_notes), ''), p_plan_context)
    returning id into draft_id;
  else
    update public.partner_protocol_exercises
      set usage_count = usage_count + 1
      where id = p_item_id and partner_id = current_partner_id
      returning id into p_item_id;

    if p_item_id is null then
      raise exception 'protocol item not found' using errcode = 'P0002';
    end if;

    insert into public.partner_protocol_use_drafts (partner_id, patient_id, item_type, exercise_id, notes, plan_context)
    values (current_partner_id, p_patient_id, 'exercise', p_item_id, nullif(btrim(p_notes), ''), p_plan_context)
    returning id into draft_id;
  end if;

  return draft_id;
end;
$$;

create or replace function public.save_partner_client_prescription_note(
  p_patient_id uuid,
  p_title text,
  p_summary text,
  p_content text,
  p_instructions text,
  p_prescription_type text,
  p_status text
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
  note_id uuid;
begin
  if auth.uid() is null or current_partner_id is null or not public.current_partner_has_active_patient_link(p_patient_id) then
    raise exception 'partner does not have an active client link' using errcode = '42501';
  end if;

  if p_prescription_type not in ('general', 'nutrition', 'training', 'supplement', 'exam', 'behavior')
    or p_status not in ('draft', 'published') then
    raise exception 'invalid prescription input' using errcode = '22023';
  end if;

  select id into actor_profile_id from public.profiles where user_id = auth.uid();
  perform pg_advisory_xact_lock(hashtextextended(current_partner_id::text || ':' || p_patient_id::text || ':prescription', 0));
  select coalesce(max(version_number), 0) + 1 into next_version
    from public.partner_client_prescription_notes
    where partner_id = current_partner_id and patient_id = p_patient_id;

  insert into public.partner_client_prescription_notes (
    partner_id, patient_id, title, summary, content, instructions, prescription_type,
    status, version_number, published_at, archived_at, created_by_profile_id
  ) values (
    current_partner_id, p_patient_id, p_title, nullif(btrim(p_summary), ''), p_content,
    nullif(btrim(p_instructions), ''), p_prescription_type, p_status, next_version,
    case when p_status = 'published' then now() else null end, null, actor_profile_id
  ) returning id into note_id;

  return note_id;
end;
$$;

create index if not exists partner_form_response_answers_partner_patient_idx
  on public.partner_form_response_answers (partner_id, patient_id, response_id);

revoke all on function public.create_partner_protocol_use_draft(text, uuid, uuid, text, text) from public, anon;
grant execute on function public.create_partner_protocol_use_draft(text, uuid, uuid, text, text) to authenticated;
revoke all on function public.save_partner_client_prescription_note(uuid, text, text, text, text, text, text) from public, anon;
grant execute on function public.save_partner_client_prescription_note(uuid, text, text, text, text, text, text) to authenticated;
