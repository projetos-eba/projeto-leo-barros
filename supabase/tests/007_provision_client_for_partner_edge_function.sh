#!/usr/bin/env bash

set -euo pipefail

PROJECT_ID="${SUPABASE_PROJECT_ID:-$(sed -n 's/^project_id = "\(.*\)"$/\1/p' supabase/config.toml | head -n 1)}"
DB_CONTAINER="supabase_db_${PROJECT_ID}"
FUNCTION_LOG="/tmp/leo-provision-client-function.log"
PARTNER_EMAIL="client-edge-partner@example.invalid"
OTHER_PARTNER_EMAIL="client-edge-other-partner@example.invalid"
INACTIVE_PARTNER_EMAIL="client-edge-inactive-partner@example.invalid"
ADMIN_EMAIL="client-edge-admin@example.invalid"
EXISTING_CLIENT_EMAIL="client-edge-existing@example.invalid"
TARGET_EMAIL="client-edge-target@example.invalid"
CPF_CONFLICT_EMAIL="client-edge-cpf-conflict@example.invalid"
PASSWORD="Local-Provision-Client-2026!"
IDEMPOTENCY_KEY="b1000000-0000-4000-8000-000000000001"
SECOND_IDEMPOTENCY_KEY="b1000000-0000-4000-8000-000000000002"
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
    '${PARTNER_EMAIL}',
    '${OTHER_PARTNER_EMAIL}',
    '${INACTIVE_PARTNER_EMAIL}'
  )
)
or resource_profile_id in (
  select id
  from public.profiles
  where email in (
    '${TARGET_EMAIL}',
    '${EXISTING_CLIENT_EMAIL}',
    '${CPF_CONFLICT_EMAIL}'
  )
);

delete from public.partner_clients
where partner_id in (
  select partner.id
  from public.partners as partner
  join public.profiles as profile on profile.id = partner.profile_id
  where profile.email in (
    '${PARTNER_EMAIL}',
    '${OTHER_PARTNER_EMAIL}',
    '${INACTIVE_PARTNER_EMAIL}'
  )
)
or patient_id in (
  select patient.id
  from public.patients as patient
  join public.profiles as profile on profile.id = patient.profile_id
  where profile.email in (
    '${TARGET_EMAIL}',
    '${EXISTING_CLIENT_EMAIL}',
    '${CPF_CONFLICT_EMAIL}'
  )
);

delete from public.patients
where profile_id in (
  select id
  from public.profiles
  where email in (
    '${TARGET_EMAIL}',
    '${EXISTING_CLIENT_EMAIL}',
    '${CPF_CONFLICT_EMAIL}'
  )
);

delete from public.partners
where profile_id in (
  select id
  from public.profiles
  where email in (
    '${PARTNER_EMAIL}',
    '${OTHER_PARTNER_EMAIL}',
    '${INACTIVE_PARTNER_EMAIL}'
  )
);

delete from public.admins
where profile_id in (
  select id
  from public.profiles
  where email = '${ADMIN_EMAIL}'
);

delete from public.profiles
where email in (
  '${PARTNER_EMAIL}',
  '${OTHER_PARTNER_EMAIL}',
  '${INACTIVE_PARTNER_EMAIL}',
  '${ADMIN_EMAIL}',
  '${EXISTING_CLIENT_EMAIL}',
  '${TARGET_EMAIL}',
  '${CPF_CONFLICT_EMAIL}'
);

delete from auth.users
where email in (
  '${PARTNER_EMAIL}',
  '${OTHER_PARTNER_EMAIL}',
  '${INACTIVE_PARTNER_EMAIL}',
  '${ADMIN_EMAIL}',
  '${EXISTING_CLIENT_EMAIL}',
  '${TARGET_EMAIL}',
  '${CPF_CONFLICT_EMAIL}'
);
SQL
}

trap cleanup EXIT
cleanup

create_auth_user() {
  local email="$1"
  local response
  local user_id

  response="$(
    curl --silent --show-error --fail-with-body \
      --request POST \
      --header "apikey: ${SERVICE_ROLE_KEY}" \
      --header "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
      --header "Content-Type: application/json" \
      --data "$(jq -cn --arg email "${email}" --arg password "${PASSWORD}" \
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
  local response
  local access_token

  response="$(
    curl --silent --show-error --fail-with-body \
      --request POST \
      --header "apikey: ${ANON_KEY}" \
      --header "Content-Type: application/json" \
      --data "$(jq -cn --arg email "${email}" --arg password "${PASSWORD}" \
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
        "${API_URL}/functions/v1/provision-client-for-partner" || true
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

partner_user_id="$(create_auth_user "${PARTNER_EMAIL}")"
other_partner_user_id="$(create_auth_user "${OTHER_PARTNER_EMAIL}")"
inactive_partner_user_id="$(create_auth_user "${INACTIVE_PARTNER_EMAIL}")"
admin_user_id="$(create_auth_user "${ADMIN_EMAIL}")"
existing_client_user_id="$(create_auth_user "${EXISTING_CLIENT_EMAIL}")"

psql_local >/dev/null <<SQL
insert into public.profiles (
  user_id,
  email,
  phone,
  display_name,
  role,
  status
)
values
  (
    '${partner_user_id}',
    '${PARTNER_EMAIL}',
    '+5511911111111',
    'Client Edge Partner',
    'parceiro',
    'active'
  ),
  (
    '${other_partner_user_id}',
    '${OTHER_PARTNER_EMAIL}',
    '+5511922222222',
    'Client Edge Other Partner',
    'parceiro',
    'active'
  ),
  (
    '${inactive_partner_user_id}',
    '${INACTIVE_PARTNER_EMAIL}',
    '+5511933333333',
    'Client Edge Inactive Partner',
    'parceiro',
    'suspended'
  ),
  (
    '${admin_user_id}',
    '${ADMIN_EMAIL}',
    '+5511944444444',
    'Client Edge Admin',
    'admin',
    'active'
  ),
  (
    '${existing_client_user_id}',
    '${EXISTING_CLIENT_EMAIL}',
    '+5511955555555',
    'Client Edge Existing',
    'cliente',
    'active'
  );

insert into public.partners (
  profile_id,
  professional_name,
  professional_type,
  professional_registry_type,
  professional_registry_number
)
select id, display_name, 'nutricionista', 'crn', 'edge-client-001'
from public.profiles
where email = '${PARTNER_EMAIL}'
union all
select id, display_name, 'personal_trainer', 'cref', 'edge-client-002'
from public.profiles
where email = '${OTHER_PARTNER_EMAIL}'
union all
select id, display_name, 'medico', 'crm', 'edge-client-003'
from public.profiles
where email = '${INACTIVE_PARTNER_EMAIL}';

insert into public.admins (profile_id)
select id
from public.profiles
where email = '${ADMIN_EMAIL}';

insert into public.patients (
  profile_id,
  cpf,
  birth_date
)
select id, '55555555555', '1995-05-05'
from public.profiles
where email = '${EXISTING_CLIENT_EMAIL}';

insert into public.partner_clients (
  partner_id,
  patient_id,
  service_scope,
  status
)
select
  partner.id,
  patient.id,
  'saude',
  'active'
from public.partners as partner
join public.profiles as partner_profile on partner_profile.id = partner.profile_id
cross join public.patients as patient
join public.profiles as patient_profile on patient_profile.id = patient.profile_id
where partner_profile.email = '${OTHER_PARTNER_EMAIL}'
  and patient_profile.email = '${EXISTING_CLIENT_EMAIL}';
SQL

partner_token="$(sign_in "${PARTNER_EMAIL}")"
inactive_partner_token="$(sign_in "${INACTIVE_PARTNER_EMAIL}")"
admin_token="$(sign_in "${ADMIN_EMAIL}")"

npx supabase functions serve provision-client-for-partner >"${FUNCTION_LOG}" 2>&1 &
FUNCTION_PID=$!

ready_status="000"
for _ in $(seq 1 60); do
  ready_status="$(
    curl --silent \
      --output /dev/null \
      --write-out '%{http_code}' \
      --header "apikey: ${ANON_KEY}" \
      --header "Authorization: Bearer ${partner_token}" \
      "${API_URL}/functions/v1/provision-client-for-partner" || true
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
    --output /tmp/leo-client-no-auth.json \
    --write-out '%{http_code}' \
    --request POST \
    --header "apikey: ${ANON_KEY}" \
    --header "Content-Type: application/json" \
    --data '{}' \
    "${API_URL}/functions/v1/provision-client-for-partner"
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
      displayName: "Client Edge Target",
      serviceScopes: ["dieta", "treino"],
      cpf: "12345678901",
      birthDate: "1992-06-15",
      idempotencyKey: $idempotencyKey
    }'
)"

admin_status="$(
  invoke_function \
    "${admin_token}" \
    "${valid_payload}" \
    /tmp/leo-client-admin-forbidden.json
)"

if [[ "${admin_status}" != "403" ]]; then
  echo "FAIL: Admin tentando provisionar Cliente deveria retornar 403."
  exit 1
fi

inactive_status="$(
  invoke_function \
    "${inactive_partner_token}" \
    "${valid_payload}" \
    /tmp/leo-client-inactive-forbidden.json
)"

if [[ "${inactive_status}" != "403" ]]; then
  echo "FAIL: Parceiro inativo deveria retornar 403."
  exit 1
fi

created_status="$(
  invoke_function \
    "${partner_token}" \
    "${valid_payload}" \
    /tmp/leo-client-created.json
)"

if [[ "${created_status}" != "202" ]] ||
  [[ "$(jq -r '.status' /tmp/leo-client-created.json)" != "created" ]] ||
  [[ "$(jq -r '.invite.status' /tmp/leo-client-created.json)" != "pending_delivery" ]]; then
  echo "FAIL: criação deveria retornar 202/created/pending_delivery."
  exit 1
fi

if [[ "$(jq -c '.relationships.serviceScopes' /tmp/leo-client-created.json)" != '["dieta","treino"]' ]]; then
  echo "FAIL: resposta não retornou os dois escopos normalizados."
  exit 1
fi

if grep -Eqi '"?(token|password|serviceRole|service_role|action_link|hashed_token)"?[[:space:]]*:' \
  /tmp/leo-client-created.json; then
  echo "FAIL: resposta contém campo sensível."
  exit 1
fi

stored_tuple="$(
  psql_local -At <<SQL
select
  profile.role || '|' ||
  profile.status || '|' ||
  profile.phone || '|' ||
  patient.cpf || '|' ||
  patient.birth_date::text || '|' ||
  (
    select array_agg(link.service_scope order by link.service_scope)::text
    from public.partner_clients as link
    where link.patient_id = patient.id
  ) || '|' ||
  operation.status || '|' ||
  operation.invite_status
from public.profiles as profile
join public.patients as patient on patient.profile_id = profile.id
join public.provisioning_operations as operation
  on operation.resource_patient_id = patient.id
where profile.email = '${TARGET_EMAIL}';
SQL
)"

if [[ "${stored_tuple}" != \
  "cliente|active|+5511991234567|12345678901|1992-06-15|{dieta,treino}|completed|pending_delivery" ]]; then
  echo "FAIL: dados relacionais não correspondem ao contrato."
  exit 1
fi

retry_status="$(
  invoke_function \
    "${partner_token}" \
    "${valid_payload}" \
    /tmp/leo-client-retry.json
)"

if [[ "${retry_status}" != "200" ]] ||
  [[ "$(jq -r '.status' /tmp/leo-client-retry.json)" != "existing" ]]; then
  echo "FAIL: retry idempotente deveria retornar 200/existing."
  exit 1
fi

changed_payload="$(
  printf '%s' "${valid_payload}" | jq '.phone = "+5511997654321"'
)"
changed_status="$(
  invoke_function \
    "${partner_token}" \
    "${changed_payload}" \
    /tmp/leo-client-changed.json
)"

if [[ "${changed_status}" != "409" ]] ||
  [[ "$(jq -r '.error.code' /tmp/leo-client-changed.json)" != "IDEMPOTENCY_KEY_REUSED" ]]; then
  echo "FAIL: mesma chave com payload diferente deveria retornar 409."
  exit 1
fi

same_client_payload="$(
  printf '%s' "${valid_payload}" |
    jq --arg idempotencyKey "${SECOND_IDEMPOTENCY_KEY}" \
      '.idempotencyKey = $idempotencyKey'
)"
same_client_status="$(
  invoke_function \
    "${partner_token}" \
    "${same_client_payload}" \
    /tmp/leo-client-existing.json
)"

if [[ "${same_client_status}" != "200" ]] ||
  [[ "$(jq -r '.status' /tmp/leo-client-existing.json)" != "existing" ]]; then
  echo "FAIL: Cliente completo compatível deveria ser idempotente."
  exit 1
fi

duplicate_scopes_payload="$(
  printf '%s' "${valid_payload}" |
    jq '.serviceScopes = ["dieta", "dieta"]'
)"
duplicate_scopes_status="$(
  invoke_function \
    "${partner_token}" \
    "${duplicate_scopes_payload}" \
    /tmp/leo-client-duplicate-scopes.json
)"

if [[ "${duplicate_scopes_status}" != "400" ]] ||
  [[ "$(jq -r '.error.fields.serviceScopes' /tmp/leo-client-duplicate-scopes.json)" != "invalid" ]]; then
  echo "FAIL: escopos duplicados deveriam retornar payload inválido."
  exit 1
fi

unknown_field_payload="$(
  printf '%s' "${valid_payload}" | jq '.password = "forbidden"'
)"
unknown_field_status="$(
  invoke_function \
    "${partner_token}" \
    "${unknown_field_payload}" \
    /tmp/leo-client-unknown-field.json
)"

if [[ "${unknown_field_status}" != "400" ]] ||
  [[ "$(jq -r '.error.fields.password' /tmp/leo-client-unknown-field.json)" != "unknown" ]]; then
  echo "FAIL: campo password deveria ser rejeitado."
  exit 1
fi

scope_conflict_payload="$(
  jq -cn \
    --arg email "${EXISTING_CLIENT_EMAIL}" \
    '{
      email: $email,
      phone: "+5511955555555",
      displayName: "Client Edge Existing",
      serviceScopes: ["saude"],
      cpf: "55555555555",
      birthDate: "1995-05-05",
      idempotencyKey: "b1000000-0000-4000-8000-000000000003"
    }'
)"
scope_conflict_status="$(
  invoke_function \
    "${partner_token}" \
    "${scope_conflict_payload}" \
    /tmp/leo-client-scope-conflict.json
)"

if [[ "${scope_conflict_status}" != "409" ]] ||
  [[ "$(jq -r '.error.code' /tmp/leo-client-scope-conflict.json)" != "SERVICE_SCOPE_CONFLICT" ]]; then
  echo "FAIL: conflito de escopo deveria retornar 409."
  exit 1
fi

cpf_conflict_payload="$(
  jq -cn \
    --arg email "${CPF_CONFLICT_EMAIL}" \
    '{
      email: $email,
      phone: "+5511966666666",
      displayName: "Client CPF Conflict",
      serviceScopes: ["cardio"],
      cpf: "55555555555",
      birthDate: "1996-06-06",
      idempotencyKey: "b1000000-0000-4000-8000-000000000004"
    }'
)"
cpf_conflict_status="$(
  invoke_function \
    "${partner_token}" \
    "${cpf_conflict_payload}" \
    /tmp/leo-client-cpf-conflict.json
)"

if [[ "${cpf_conflict_status}" != "409" ]] ||
  [[ "$(jq -r '.error.code' /tmp/leo-client-cpf-conflict.json)" != "CPF_CONFLICT" ]]; then
  echo "FAIL: CPF conflitante deveria retornar 409."
  exit 1
fi

if [[ "$(
  psql_local -At -c \
    "select count(*) from auth.users where email = '${CPF_CONFLICT_EMAIL}';"
)" != "0" ]]; then
  echo "FAIL: Auth user novo não foi compensado após conflito de CPF."
  exit 1
fi

echo "PASS: provision-client-for-partner validou autorização, escopos, idempotência e compensação local."
