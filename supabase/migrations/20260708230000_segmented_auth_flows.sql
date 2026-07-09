-- Fluxos segmentados de autenticacao: confirmacao de e-mail e reset de senha.

alter table public.profiles
add column if not exists email_confirmed_at timestamptz,
add column if not exists first_access_completed_at timestamptz,
add column if not exists last_auth_flow_at timestamptz;

update public.profiles as profile
set email_confirmed_at = auth_user.email_confirmed_at
from auth.users as auth_user
where profile.user_id = auth_user.id
  and profile.email_confirmed_at is null
  and auth_user.email_confirmed_at is not null;

create table if not exists public.email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  auth_user_id uuid not null,
  token_hash text not null,
  purpose text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),

  constraint email_verification_tokens_profile_id_fkey
    foreign key (profile_id) references public.profiles(id) on delete cascade,
  constraint email_verification_tokens_purpose_check
    check (purpose in ('client_first_access', 'partner_signup', 'admin_approval')),
  constraint email_verification_tokens_token_hash_not_blank
    check (length(btrim(token_hash)) > 0),
  constraint email_verification_tokens_consumed_after_created
    check (consumed_at is null or consumed_at >= created_at),
  constraint email_verification_tokens_expires_after_created
    check (expires_at > created_at)
);

create unique index if not exists email_verification_tokens_token_hash_key
  on public.email_verification_tokens (token_hash);

create index if not exists email_verification_tokens_profile_idx
  on public.email_verification_tokens (profile_id, created_at desc);

create index if not exists email_verification_tokens_expires_idx
  on public.email_verification_tokens (expires_at);

create unique index if not exists email_verification_tokens_active_profile_purpose_key
  on public.email_verification_tokens (profile_id, purpose)
  where consumed_at is null;

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  auth_user_id uuid not null,
  role text not null,
  token_hash text not null,
  reset_session_hash text,
  expires_at timestamptz not null,
  validated_at timestamptz,
  session_expires_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),

  constraint password_reset_tokens_profile_id_fkey
    foreign key (profile_id) references public.profiles(id) on delete cascade,
  constraint password_reset_tokens_role_check
    check (role in ('cliente', 'parceiro', 'admin')),
  constraint password_reset_tokens_token_hash_not_blank
    check (length(btrim(token_hash)) > 0),
  constraint password_reset_tokens_reset_session_hash_not_blank
    check (reset_session_hash is null or length(btrim(reset_session_hash)) > 0),
  constraint password_reset_tokens_expires_after_created
    check (expires_at > created_at),
  constraint password_reset_tokens_session_after_validated
    check (
      session_expires_at is null
      or (
        validated_at is not null
        and session_expires_at > validated_at
      )
    ),
  constraint password_reset_tokens_consumed_after_created
    check (consumed_at is null or consumed_at >= created_at)
);

create unique index if not exists password_reset_tokens_token_hash_key
  on public.password_reset_tokens (token_hash);

create unique index if not exists password_reset_tokens_reset_session_hash_key
  on public.password_reset_tokens (reset_session_hash)
  where reset_session_hash is not null;

create index if not exists password_reset_tokens_profile_idx
  on public.password_reset_tokens (profile_id, created_at desc);

create index if not exists password_reset_tokens_expires_idx
  on public.password_reset_tokens (expires_at);

create unique index if not exists password_reset_tokens_active_profile_key
  on public.password_reset_tokens (profile_id)
  where consumed_at is null;

alter table public.email_verification_tokens enable row level security;
alter table public.password_reset_tokens enable row level security;

revoke all on table public.email_verification_tokens from public, anon, authenticated;
revoke all on table public.password_reset_tokens from public, anon, authenticated;

grant select, insert, update, delete on table public.email_verification_tokens to service_role;
grant select, insert, update, delete on table public.password_reset_tokens to service_role;

comment on table public.email_verification_tokens
is 'Tokens hashados de confirmacao de e-mail para primeiro acesso, cadastro de parceiro e aprovacao administrativa.';

comment on table public.password_reset_tokens
is 'Tokens hashados de redefinicao de senha. Usados apenas por Edge Functions com service role.';
