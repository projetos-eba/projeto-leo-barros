create or replace function public.increment_partner_protocol_usage(
  p_item_type text,
  p_item_id uuid
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_usage_count integer;
begin
  if p_item_type = 'food' then
    update public.partner_protocol_foods
      set usage_count = usage_count + 1
      where id = p_item_id
        and partner_id = public.current_active_partner_id()
      returning usage_count into next_usage_count;
  elsif p_item_type = 'exercise' then
    update public.partner_protocol_exercises
      set usage_count = usage_count + 1
      where id = p_item_id
        and partner_id = public.current_active_partner_id()
      returning usage_count into next_usage_count;
  else
    raise exception 'invalid protocol item type' using errcode = '22023';
  end if;

  return next_usage_count;
end;
$$;

revoke all on function public.increment_partner_protocol_usage(text, uuid) from public, anon;
grant execute on function public.increment_partner_protocol_usage(text, uuid) to authenticated;
