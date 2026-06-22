-- Primeira migration oficial da base limpa.
-- Escopo: identidade, extensões de perfil e vínculo Parceiro–Cliente.
-- Não contém seeds, backfill, módulos clínicos ou dados legados.

create extension if not exists pgcrypto with schema extensions;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  display_name text not null,
  role text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete restrict,
  constraint profiles_user_id_key
    unique (user_id),
  constraint profiles_role_check
    check (role in ('cliente', 'parceiro', 'admin')),
  constraint profiles_status_check
    check (status in ('pending', 'active', 'suspended', 'disabled')),
  constraint profiles_email_not_blank
    check (length(btrim(email)) > 0),
  constraint profiles_display_name_not_blank
    check (length(btrim(display_name)) > 0)
);

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint admins_profile_id_fkey
    foreign key (profile_id) references public.profiles(id) on delete restrict,
  constraint admins_profile_id_key
    unique (profile_id)
);

comment on table public.admins
is 'Extensão operacional do Super Admin global. Múltiplos registros são tecnicamente permitidos, mas o MVP provisionará apenas um Super Admin.';

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  cpf text,
  phone text,
  birth_date date,
  objective text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint patients_profile_id_fkey
    foreign key (profile_id) references public.profiles(id) on delete restrict,
  constraint patients_profile_id_key
    unique (profile_id),
  constraint patients_cpf_check
    check (cpf is null or cpf ~ '^[0-9]{11}$')
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  professional_name text not null,
  professional_type text not null,
  professional_registry_type text,
  professional_registry_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partners_profile_id_fkey
    foreign key (profile_id) references public.profiles(id) on delete restrict,
  constraint partners_profile_id_key
    unique (profile_id),
  constraint partners_professional_name_not_blank
    check (length(btrim(professional_name)) > 0),
  constraint partners_professional_type_check
    check (professional_type in ('personal_trainer', 'nutricionista', 'medico')),
  constraint partners_professional_registry_pair_check
    check (
      (
        professional_registry_type is null
        and professional_registry_number is null
      )
      or
      (
        professional_registry_type is not null
        and professional_registry_number is not null
        and length(btrim(professional_registry_type)) > 0
        and length(btrim(professional_registry_number)) > 0
      )
    )
);

create table public.partner_clients (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  patient_id uuid not null,
  service_scope text not null,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_clients_partner_id_fkey
    foreign key (partner_id) references public.partners(id) on delete restrict,
  constraint partner_clients_patient_id_fkey
    foreign key (patient_id) references public.patients(id) on delete restrict,
  constraint partner_clients_service_scope_check
    check (service_scope in ('dieta', 'treino', 'saude', 'cardio')),
  constraint partner_clients_status_check
    check (status in ('pending', 'active', 'suspended', 'disabled')),
  constraint partner_clients_ended_at_check
    check (
      (
        status = 'disabled'
        and ended_at is not null
        and ended_at >= started_at
      )
      or
      (
        status <> 'disabled'
        and ended_at is null
      )
    )
);

create unique index profiles_email_lower_key
  on public.profiles (lower(email));

create index profiles_role_status_idx
  on public.profiles (role, status);

create unique index patients_cpf_key
  on public.patients (cpf)
  where cpf is not null;

create index partners_professional_name_idx
  on public.partners (professional_name);

create index partners_professional_type_idx
  on public.partners (professional_type);

create index partner_clients_partner_status_idx
  on public.partner_clients (partner_id, status);

create index partner_clients_patient_status_idx
  on public.partner_clients (patient_id, status);

create index partner_clients_patient_scope_status_idx
  on public.partner_clients (patient_id, service_scope, status);

create unique index partner_clients_active_patient_scope_key
  on public.partner_clients (patient_id, service_scope)
  where status = 'active';

create unique index partner_clients_open_relationship_key
  on public.partner_clients (partner_id, patient_id, service_scope)
  where status in ('pending', 'active', 'suspended');

-- Mantém cada extensão vinculada ao role canônico correspondente.
create function public.enforce_profile_extension_role()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  expected_role text := tg_argv[0];
  actual_role text;
begin
  select profile.role
  into actual_role
  from public.profiles as profile
  where profile.id = new.profile_id
  for update;

  if actual_role is distinct from expected_role then
    raise exception
      'profile % must have role % for table %',
      new.profile_id,
      expected_role,
      tg_table_name;
  end if;

  return new;
end;
$$;

-- O UPDATE de profiles já mantém lock na linha; inserts de extensões adquirem
-- o mesmo lock em enforce_profile_extension_role antes de validar o role.
-- Assim, a mudança de role e a criação da extensão são serializadas.
create function public.prevent_incompatible_profile_role_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.role = old.role then
    return new;
  end if;

  if exists (
    select 1 from public.admins where profile_id = new.id
  ) and new.role <> 'admin' then
    raise exception 'profile % already has an admin extension', new.id;
  end if;

  if exists (
    select 1 from public.patients where profile_id = new.id
  ) and new.role <> 'cliente' then
    raise exception 'profile % already has a patient extension', new.id;
  end if;

  if exists (
    select 1 from public.partners where profile_id = new.id
  ) and new.role <> 'parceiro' then
    raise exception 'profile % already has a partner extension', new.id;
  end if;

  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger admins_set_updated_at
before update on public.admins
for each row execute function public.set_updated_at();

create trigger patients_set_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

create trigger partners_set_updated_at
before update on public.partners
for each row execute function public.set_updated_at();

create trigger partner_clients_set_updated_at
before update on public.partner_clients
for each row execute function public.set_updated_at();

create trigger admins_enforce_profile_role
before insert or update of profile_id on public.admins
for each row execute function public.enforce_profile_extension_role('admin');

create trigger patients_enforce_profile_role
before insert or update of profile_id on public.patients
for each row execute function public.enforce_profile_extension_role('cliente');

create trigger partners_enforce_profile_role
before insert or update of profile_id on public.partners
for each row execute function public.enforce_profile_extension_role('parceiro');

create trigger profiles_prevent_incompatible_role_change
before update of role on public.profiles
for each row execute function public.prevent_incompatible_profile_role_change();

-- Helpers mínimos de leitura. SECURITY DEFINER evita recursão entre policies.
create function public.current_active_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select profile.id
  from public.profiles as profile
  where profile.user_id = auth.uid()
    and profile.status = 'active'
  limit 1;
$$;

create function public.current_active_admin_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select admin.id
  from public.admins as admin
  join public.profiles as profile on profile.id = admin.profile_id
  where profile.user_id = auth.uid()
    and profile.role = 'admin'
    and profile.status = 'active'
  limit 1;
$$;

create function public.current_active_patient_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select patient.id
  from public.patients as patient
  join public.profiles as profile on profile.id = patient.profile_id
  where profile.user_id = auth.uid()
    and profile.role = 'cliente'
    and profile.status = 'active'
  limit 1;
$$;

create function public.current_active_partner_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select partner.id
  from public.partners as partner
  join public.profiles as profile on profile.id = partner.profile_id
  where profile.user_id = auth.uid()
    and profile.role = 'parceiro'
    and profile.status = 'active'
  limit 1;
$$;

create function public.current_partner_has_active_patient_link(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.partner_clients as relationship
    where relationship.partner_id = public.current_active_partner_id()
      and relationship.patient_id = target_patient_id
      and relationship.status = 'active'
  );
$$;

comment on function public.enforce_profile_extension_role()
is 'Trigger interno que bloqueia a linha do profile e garante que cada extensão use o role canônico correspondente.';

comment on function public.prevent_incompatible_profile_role_change()
is 'Trigger interno que impede mudanças de role incompatíveis com extensões já existentes.';

comment on function public.current_active_profile_id()
is 'Retorna o profile ativo do usuário autenticado sem depender de policies recursivas.';

comment on function public.current_active_admin_id()
is 'Retorna o admin ativo do usuário autenticado para policies explícitas de Super Admin.';

comment on function public.current_active_patient_id()
is 'Retorna o patient ativo do usuário autenticado para leitura do próprio registro e vínculos.';

comment on function public.current_active_partner_id()
is 'Retorna o partner ativo do usuário autenticado para leitura do próprio registro e vínculos.';

comment on function public.current_partner_has_active_patient_link(uuid)
is 'Verifica vínculo ativo entre o Parceiro autenticado e um Cliente sem aplicar restrição por classificação profissional.';

revoke all on function public.set_updated_at() from public;
revoke all on function public.enforce_profile_extension_role() from public;
revoke all on function public.prevent_incompatible_profile_role_change() from public;
revoke all on function public.current_active_profile_id() from public;
revoke all on function public.current_active_admin_id() from public;
revoke all on function public.current_active_patient_id() from public;
revoke all on function public.current_active_partner_id() from public;
revoke all on function public.current_partner_has_active_patient_link(uuid) from public;

grant execute on function public.current_active_profile_id() to authenticated;
grant execute on function public.current_active_admin_id() to authenticated;
grant execute on function public.current_active_patient_id() to authenticated;
grant execute on function public.current_active_partner_id() to authenticated;
grant execute on function public.current_partner_has_active_patient_link(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.patients enable row level security;
alter table public.partners enable row level security;
alter table public.partner_clients enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.admins from public, anon, authenticated;
revoke all on table public.patients from public, anon, authenticated;
revoke all on table public.partners from public, anon, authenticated;
revoke all on table public.partner_clients from public, anon, authenticated;

grant select on table public.profiles to authenticated;
grant select on table public.admins to authenticated;
grant select on table public.patients to authenticated;
grant select on table public.partners to authenticated;
grant select on table public.partner_clients to authenticated;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

comment on policy profiles_select_own on public.profiles
is 'Leitura do próprio profile é intencional mesmo quando o status não é active; extensões e vínculos continuam restritos a profiles ativos.';

create policy profiles_select_active_admin
on public.profiles
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy admins_select_own
on public.admins
for select
to authenticated
using (profile_id = public.current_active_profile_id());

create policy admins_select_active_admin
on public.admins
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy patients_select_own
on public.patients
for select
to authenticated
using (id = public.current_active_patient_id());

create policy patients_select_linked_partner
on public.patients
for select
to authenticated
using (public.current_partner_has_active_patient_link(id));

create policy patients_select_active_admin
on public.patients
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy partners_select_own
on public.partners
for select
to authenticated
using (id = public.current_active_partner_id());

create policy partners_select_active_admin
on public.partners
for select
to authenticated
using (public.current_active_admin_id() is not null);

create policy partner_clients_select_own_partner
on public.partner_clients
for select
to authenticated
using (partner_id = public.current_active_partner_id());

create policy partner_clients_select_own_patient
on public.partner_clients
for select
to authenticated
using (patient_id = public.current_active_patient_id());

create policy partner_clients_select_active_admin
on public.partner_clients
for select
to authenticated
using (public.current_active_admin_id() is not null);
