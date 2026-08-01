-- Repara drift de ambientes que aplicaram o schema legado de formularios.
-- O indice unico legado manteria o nome usado pela tabela normalizada criada
-- em 20260726130000; renomear o constraint evita colisao sem tocar nos dados.

do $$
begin
  if to_regclass('public.partner_client_notes') is not null
    and to_regclass('public.partner_form_responses') is not null
    and exists (
      select 1
      from pg_constraint
      where conrelid = 'public.partner_form_responses'::regclass
        and conname = 'partner_form_responses_assignment_client_key'
    )
  then
    alter table public.partner_form_responses
      rename constraint partner_form_responses_assignment_client_key
      to partner_form_responses_legacy_assignment_client_key;
  end if;
end
$$;
