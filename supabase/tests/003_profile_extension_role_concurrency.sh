#!/usr/bin/env bash

set -euo pipefail

PROJECT_ID="${SUPABASE_PROJECT_ID:-$(sed -n 's/^project_id = "\(.*\)"$/\1/p' supabase/config.toml | head -n 1)}"
DB_CONTAINER="supabase_db_${PROJECT_ID}"
PSQL=(docker exec -i "${DB_CONTAINER}" psql -v ON_ERROR_STOP=1 -U postgres -d postgres)

USER_ID="81000000-0000-0000-0000-000000000001"
PROFILE_ID="82000000-0000-0000-0000-000000000001"
PATIENT_ID="83000000-0000-0000-0000-000000000001"

cleanup() {
  "${PSQL[@]}" >/dev/null <<SQL || true
delete from public.patients where id = '${PATIENT_ID}';
delete from public.profiles where id = '${PROFILE_ID}';
delete from auth.users where id = '${USER_ID}';
SQL
}

trap cleanup EXIT
cleanup

seed_profile() {
  local role="$1"

  "${PSQL[@]}" >/dev/null <<SQL
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '${USER_ID}',
  'authenticated',
  'authenticated',
  'concurrency@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

insert into public.profiles (
  id,
  user_id,
  email,
  display_name,
  role,
  status
)
values (
  '${PROFILE_ID}',
  '${USER_ID}',
  'concurrency@example.invalid',
  'Concurrency Profile',
  '${role}',
  'active'
);
SQL
}

assert_failed_after_wait() {
  local status="$1"
  local elapsed="$2"
  local label="$3"

  if [[ "${status}" -eq 0 ]]; then
    echo "FAIL: ${label} deveria ser rejeitado."
    exit 1
  fi

  if [[ "${elapsed}" -lt 1 ]]; then
    echo "FAIL: ${label} não aguardou o lock concorrente."
    exit 1
  fi
}

echo "Cenário 1: extensão adquire lock antes da mudança de role."
seed_profile "cliente"

"${PSQL[@]}" >/tmp/leo-concurrency-session-a.log 2>&1 <<SQL &
begin;
insert into public.patients (id, profile_id)
values ('${PATIENT_ID}', '${PROFILE_ID}');
select pg_sleep(2);
commit;
SQL
session_a=$!

sleep 0.4
started_at=$(date +%s)
set +e
"${PSQL[@]}" >/tmp/leo-concurrency-session-b.log 2>&1 <<SQL
update public.profiles
set role = 'parceiro'
where id = '${PROFILE_ID}';
SQL
session_b_status=$?
set -e
elapsed=$(( $(date +%s) - started_at ))
wait "${session_a}"
assert_failed_after_wait "${session_b_status}" "${elapsed}" "mudança incompatível de role"

cleanup

echo "Cenário 2: mudança de role adquire lock antes da extensão."
seed_profile "cliente"

"${PSQL[@]}" >/tmp/leo-concurrency-session-a.log 2>&1 <<SQL &
begin;
update public.profiles
set role = 'parceiro'
where id = '${PROFILE_ID}';
select pg_sleep(2);
commit;
SQL
session_a=$!

sleep 0.4
started_at=$(date +%s)
set +e
"${PSQL[@]}" >/tmp/leo-concurrency-session-b.log 2>&1 <<SQL
insert into public.patients (id, profile_id)
values ('${PATIENT_ID}', '${PROFILE_ID}');
SQL
session_b_status=$?
set -e
elapsed=$(( $(date +%s) - started_at ))
wait "${session_a}"
assert_failed_after_wait "${session_b_status}" "${elapsed}" "criação de extensão incompatível"

echo "PASS: criação de extensão e mudança de role foram serializadas nos dois sentidos."

