#!/usr/bin/env bash

set -euo pipefail

PROJECT_ID="${SUPABASE_PROJECT_ID:-$(sed -n 's/^project_id = "\(.*\)"$/\1/p' supabase/config.toml | head -n 1)}"
DB_CONTAINER="supabase_db_${PROJECT_ID}"
FUNCTION_LOG="/tmp/leo-provision-partner-function.log"
ADMIN_EMAIL="edge-admin@example.invalid"
PARTNER_CALLER_EMAIL="edge-partner-caller@example.invalid"
CLIENT_EMAIL="edge-client@example.invalid"
TARGET_EMAIL="edge-target-partner@example.invalid"
ADMIN_PASSWORD="LocalAdmin-Test-2026!"
PARTNER_PASSWORD="LocalPartner-Test-2026!"
IDEMPOTENCY_KEY="a1000000-0000-4000-8000-000000000001"
SECOND_IDEMPOTENCY_KEY="a1000000-0000-4000-8000-000000000002"
FUNCTION_PID=""

for command_name in curl jq docker npx; do
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "FAIL: comando obrigatório não encontrado: ${command_name}"
    exit 1
  fi
done

status_env="$(npx supabase status -o env)"
API_URL="$(printf '%s\n' "${status_env}" | sed -n 's/^API_URL="\([^"]*\)"$/\1/p')"
ANON_KEY="$(printf '%s\n' "${status_env}" | sed -n 's/^ANON_KEY="\([^"]*\)"$/\1/p')"
SERVICE_ROLE_KEY="$(printf '%s\n' "${status_env}" | sed -n 's/^SERVICE_ROLE_KEY="\([^"]*\)"$/\1/p')"

if [[ -z "${API_URL}" || -z "${ANON_KEY}" || -z "${SERVICE_ROLE_KEY}" ]]; then
  echo "FAIL: não foi possível resolver a configuração local do Supabase."
  exit 1
fi

psql_local() {
  docker exec -i "${DB_CONTAINER}" \
    psql -v ON_ERROR_STOP=1 -U postgres -d postgres "$@"
}

cleanup() {
  if [[ -n "${FUNCTION_PID}" ]] && kill -0 "${FUNCTION_PID}" >/dev/null 2>&1; then
    kill "${FUNCTION_PID}" >/dev/null 2>&1 || true
    wait "${FUNCTION_PID}" >/dev/null 2>&1 || true
  fi

  psql_local >/dev/null 2>&1 <<SQL || true
delete from public.provisioning_operations
where caller_profile_id in (
  select id
  from public.profiles
  where email in (
    '${ADMIN_EMAIL}',
    '${PARTNER_CALLER_EMAIL}',
    '${CLIENT_EMAIL}',
    '${TARGET_EMAIL}'
  )
)
or resource_profile_id in (
  select id
  from public.profiles
  where email = '${TARGET_EMAIL}'
);

delete from public.partners
where profile_id in (
  select id
  from public.profiles
  where email in ('${PARTNER_CALLER_EMAIL}', '${TARGET_EMAIL}')
);

delete from public.admins
where profile_id in (
  select id
  from public.profiles
  where email = '${ADMIN_EMAIL}'
);

delete from public.profiles
where email in (
  '${ADMIN_EMAIL}',
  '${PARTNER_CALLER_EMAIL}',
  '${CLIENT_EMAIL}',
  '${TARGET_EMAIL}'
);

delete from auth.users
where email in (
  '${ADMIN_EMAIL}',
  '${PARTNER_CALLER_EMAIL}',
  '${CLIENT_EMAIL}',
  '${TARGET_EMAIL}'
);
SQL
}

trap cleanup EXIT
cleanup

create_auth_user() {
  local email="$1"
  local password="$2"
  local response
  local user_id

  response="$(
    curl --silent --show-error --fail-with-body \
      --request POST \
      --header "apikey: ${SERVICE_ROLE_KEY}" \
      --header "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
      --header "Content-Type: application/json" \
      --data "$(jq -cn --arg email "${email}" --arg password "${password}" \
        '{email: $email, password: $password, email_confirm: true}')" \
      "${API_URL}/auth/v1/admin/users"
  )"

  user_id="$(printf '%s' "${response}" | jq -r '.id // empty')"
  if [[ -z "${user_id}" ]]; then
    echo "FAIL: criação de usuário Auth local não retornou ID."
    exit 1
  fi

  printf '%s' "${user_id}"
}

sign_in() {
  local email="$1"
  local password="$2"
  local response
  local access_token

  response="$(
    curl --silent --show-error --fail-with-body \
      --request POST \
      --header "apikey: ${ANON_KEY}" \
      --header "Content-Type: application/json" \
      --data "$(jq -cn --arg email "${email}" --arg password "${password}" \
        '{email: $email, password: $password}')" \
      "${API_URL}/auth/v1/token?grant_type=password"
  )"

  access_token="$(printf '%s' "${response}" | jq -r '.access_token // empty')"
  if [[ -z "${access_token}" ]]; then
    echo "FAIL: login local não retornou access token."
    exit 1
  fi

  printf '%s' "${access_token}"
}

invoke_function() {
  local token="$1"
  local payload="$2"
  local output_file="$3"
  local status="000"

  for _ in 1 2 3; do
    status="$(
      curl --silent --show-error \
        --output "${output_file}" \
        --write-out '%{http_code}' \
        --request POST \
        --header "apikey: ${ANON_KEY}" \
        --header "Authorization: Bearer ${token}" \
        --header "Content-Type: application/json" \
        --data "${payload}" \
        "${API_URL}/functions/v1/provision-partner" || true
    )"

    if [[ "${status}" != "000" ]] &&
      [[ "${status}" != "502" ]] &&
      [[ "${status}" != "503" ]]; then
      break
    fi

    sleep 1
  done

  printf '%s' "${status}"
}

admin_user_id="$(create_auth_user "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}")"
partner_caller_user_id="$(
  create_auth_user "${PARTNER_CALLER_EMAIL}" "${PARTNER_PASSWORD}"
)"
client_user_id="$(
  create_auth_user "${CLIENT_EMAIL}" "LocalClient-Test-2026!"
)"

psql_local >/dev/null <<SQL
insert into public.profiles (
  user_id,
  email,
  display_name,
  role,
  status
)
values
  (
    '${admin_user_id}',
    '${ADMIN_EMAIL}',
    'Edge Admin',
    'admin',
    'active'
  ),
  (
    '${partner_caller_user_id}',
    '${PARTNER_CALLER_EMAIL}',
    'Edge Partner Caller',
    'parceiro',
    'active'
  ),
  (
    '${client_user_id}',
    '${CLIENT_EMAIL}',
    'Edge Client',
    'cliente',
    'active'
  );

insert into public.admins (profile_id)
select id
from public.profiles
where email = '${ADMIN_EMAIL}';

insert into public.partners (
  profile_id,
  professional_name,
  professional_type,
  professional_registry_type,
  professional_registry_number
)
select
  id,
  'Edge Partner Caller',
  'nutricionista',
  'crn',
  'caller-001'
from public.profiles
where email = '${PARTNER_CALLER_EMAIL}';
SQL

admin_token="$(sign_in "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}")"
partner_token="$(
  sign_in "${PARTNER_CALLER_EMAIL}" "${PARTNER_PASSWORD}"
)"

npx supabase functions serve provision-partner >"${FUNCTION_LOG}" 2>&1 &
FUNCTION_PID=$!

ready_status="000"
for _ in $(seq 1 60); do
  ready_status="$(
    curl --silent \
      --output /dev/null \
      --write-out '%{http_code}' \
      --header "apikey: ${ANON_KEY}" \
      --header "Authorization: Bearer ${admin_token}" \
      "${API_URL}/functions/v1/provision-partner" || true
  )"
  if [[ "${ready_status}" == "405" ]]; then
    break
  fi

  if ! kill -0 "${FUNCTION_PID}" >/dev/null 2>&1; then
    echo "FAIL: processo da Edge Function encerrou durante a inicialização."
    exit 1
  fi

  sleep 1
done

if [[ "${ready_status}" != "405" ]]; then
  echo "FAIL: Edge Function local não ficou disponível."
  exit 1
fi

unauthenticated_status="$(
  curl --silent \
    --output /tmp/leo-provision-no-auth.json \
    --write-out '%{http_code}' \
    --request POST \
    --header "apikey: ${ANON_KEY}" \
    --header "Content-Type: application/json" \
    --data '{}' \
    "${API_URL}/functions/v1/provision-partner"
)"

if [[ "${unauthenticated_status}" != "401" ]]; then
  echo "FAIL: chamada sem JWT deveria retornar 401."
  exit 1
fi

valid_payload="$(
  jq -cn \
    --arg email "${TARGET_EMAIL}" \
    --arg idempotencyKey "${IDEMPOTENCY_KEY}" \
    '{
      email: $email,
      phone: "+5511991234567",
      professionalType: "medico",
      displayName: "Edge Target Partner",
      idempotencyKey: $idempotencyKey
    }'
)"

partner_status="$(
  invoke_function \
    "${partner_token}" \
    "${valid_payload}" \
    /tmp/leo-provision-partner-forbidden.json
)"

if [[ "${partner_status}" != "403" ]]; then
  echo "FAIL: Parceiro tentando provisionar Parceiro deveria retornar 403."
  exit 1
fi

created_status="$(
  invoke_function \
    "${admin_token}" \
    "${valid_payload}" \
    /tmp/leo-provision-created.json
)"

if [[ "${created_status}" != "202" ]]; then
  echo "FAIL: criação local deveria retornar 202 com convite pendente."
  exit 1
fi

if [[ "$(jq -r '.status' /tmp/leo-provision-created.json)" != "created" ]]; then
  echo "FAIL: resposta de criação não retornou status created."
  exit 1
fi

if [[ "$(jq -r '.invite.status' /tmp/leo-provision-created.json)" != "pending_delivery" ]]; then
  echo "FAIL: convite local deveria ficar pending_delivery."
  exit 1
fi

if grep -Eqi '"?(token|password|serviceRole|service_role|action_link|hashed_token)"?[[:space:]]*:' \
  /tmp/leo-provision-created.json; then
  echo "FAIL: resposta contém campo sensível."
  exit 1
fi

stored_tuple="$(
  psql_local -At <<SQL
select
  profile.role || '|' ||
  profile.status || '|' ||
  profile.phone || '|' ||
  partner.professional_name || '|' ||
  partner.professional_type || '|' ||
  coalesce(partner.professional_registry_type, 'sem-registro') || '|' ||
  operation.status || '|' ||
  operation.invite_status
from public.profiles as profile
join public.partners as partner on partner.profile_id = profile.id
join public.provisioning_operations as operation
  on operation.resource_profile_id = profile.id
where profile.email = '${TARGET_EMAIL}';
SQL
)"

if [[ "${stored_tuple}" != \
  "parceiro|active|+5511991234567|Edge Target Partner|medico|sem-registro|completed|pending_delivery" ]]; then
  echo "FAIL: dados provisionados não correspondem ao contrato."
  exit 1
fi

retry_status="$(
  invoke_function \
    "${admin_token}" \
    "${valid_payload}" \
    /tmp/leo-provision-retry.json
)"

if [[ "${retry_status}" != "200" ]] ||
  [[ "$(jq -r '.status' /tmp/leo-provision-retry.json)" != "existing" ]]; then
  echo "FAIL: retry idempotente deveria retornar 200/existing."
  exit 1
fi

changed_payload="$(
  printf '%s' "${valid_payload}" | jq '.phone = "+5511997654321"'
)"
changed_status="$(
  invoke_function \
    "${admin_token}" \
    "${changed_payload}" \
    /tmp/leo-provision-changed.json
)"

if [[ "${changed_status}" != "409" ]] ||
  [[ "$(jq -r '.error.code' /tmp/leo-provision-changed.json)" != "IDEMPOTENCY_KEY_REUSED" ]]; then
  echo "FAIL: mesma chave com payload diferente deveria retornar 409."
  exit 1
fi

same_email_payload="$(
  printf '%s' "${valid_payload}" |
    jq --arg idempotencyKey "${SECOND_IDEMPOTENCY_KEY}" \
      '.idempotencyKey = $idempotencyKey'
)"
same_email_status="$(
  invoke_function \
    "${admin_token}" \
    "${same_email_payload}" \
    /tmp/leo-provision-existing-email.json
)"

if [[ "${same_email_status}" != "200" ]] ||
  [[ "$(jq -r '.status' /tmp/leo-provision-existing-email.json)" != "existing" ]]; then
  echo "FAIL: e-mail de Parceiro compatível deveria ser idempotente."
  exit 1
fi

conflict_payload="$(
  printf '%s' "${valid_payload}" |
    jq --arg email "${CLIENT_EMAIL}" \
      --arg idempotencyKey "a1000000-0000-4000-8000-000000000003" \
      '.email = $email | .idempotencyKey = $idempotencyKey'
)"
conflict_status="$(
  invoke_function \
    "${admin_token}" \
    "${conflict_payload}" \
    /tmp/leo-provision-role-conflict.json
)"

if [[ "${conflict_status}" != "409" ]] ||
  [[ "$(jq -r '.error.code' /tmp/leo-provision-role-conflict.json)" != "EMAIL_ROLE_CONFLICT" ]]; then
  echo "FAIL: e-mail associado a Cliente deveria retornar conflito de role."
  exit 1
fi

missing_phone_payload="$(printf '%s' "${valid_payload}" | jq 'del(.phone)')"
missing_phone_status="$(
  invoke_function \
    "${admin_token}" \
    "${missing_phone_payload}" \
    /tmp/leo-provision-missing-phone.json
)"

if [[ "${missing_phone_status}" != "400" ]] ||
  [[ "$(jq -r '.error.fields.phone' /tmp/leo-provision-missing-phone.json)" != "required" ]]; then
  echo "FAIL: telefone ausente deveria retornar payload inválido."
  exit 1
fi

partial_registry_payload="$(
  printf '%s' "${valid_payload}" |
    jq --arg idempotencyKey "a1000000-0000-4000-8000-000000000004" \
      '.idempotencyKey = $idempotencyKey | .professionalRegistryType = "crm"'
)"
partial_registry_status="$(
  invoke_function \
    "${admin_token}" \
    "${partial_registry_payload}" \
    /tmp/leo-provision-partial-registry.json
)"

if [[ "${partial_registry_status}" != "400" ]] ||
  [[ "$(jq -r '.error.fields.professionalRegistryNumber' /tmp/leo-provision-partial-registry.json)" != "required" ]]; then
  echo "FAIL: registro profissional parcial deveria retornar payload inválido."
  exit 1
fi

echo "PASS: provision-partner validou autorização, payload, persistência e idempotência local."
