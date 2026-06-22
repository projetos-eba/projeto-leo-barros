# Relatório de ambiguidades e backfill de `profiles`

Data de referência: 20 de junho de 2026.

Status: especificação documental da Fase 4.6, com consultas SQL somente leitura.

Este documento prepara consultas de diagnóstico para inventariar usuários Auth, pacientes, roles legados, candidatos a `profiles` e ambiguidades antes de qualquer migration ou backfill.

Nenhuma consulta deste documento deve escrever no banco. Esta fase não cria migration executável, não aplica SQL, não altera Supabase, não altera RLS, não altera policies, não altera Edge Functions, não altera runtime, não cria rotas, não cria guards e não cria middleware.

O objetivo é gerar evidência para tomada de decisão antes da futura criação de `profiles`.

## 1. Regras de segurança das consultas

As consultas deste documento são somente leitura e devem permanecer limitadas a:

- `select`;
- `count`;
- `group by`;
- `left join`;
- `where`;
- CTEs de leitura com `with`.

Não usar neste relatório:

- operações de escrita;
- comandos de alteração estrutural;
- comandos de permissão;
- funções com privilégio elevado;
- qualquer operação que modifique dados, schema, policies, RLS, Storage ou Auth.

As consultas devem ser executadas apenas em ambiente apropriado de administração/diagnóstico, por pessoa autorizada, sem expor secrets, tokens ou valores de `.env`.

## 2. Premissas do modelo canônico

Referências aprovadas nas fases anteriores:

- fonte canônica futura: `profiles`;
- roles oficiais futuras: `cliente`, `parceiro`, `admin`;
- status oficiais futuros: `pending`, `active`, `suspended`, `disabled`;
- legado atual de paciente: `user_metadata.role = 'patient'`;
- legado atual de admin: `user_metadata.role = 'admin'`;
- `patients.user_id` é a ponte legada mais confiável entre paciente e Auth;
- admin legado nunca deve virar Super Admin automaticamente;
- `/form/:token` permanece legado/provisório e não é alvo direto do Next;
- Storage clínico futuro deve ser protegido, não público.

## 3. Convenções usadas nas consultas

As consultas assumem:

- Supabase Auth em `auth.users`;
- metadata legada em `auth.users.raw_user_meta_data`;
- tabela de pacientes em `public.patients`;
- colunas legadas de paciente: `id`, `user_id`, `name`, `cpf`, `email`, `created_at`, `updated_at`.

Se alguma coluna não existir no ambiente real, a consulta deve ser ajustada antes de executar.

## 4. Total de usuários Auth

```sql
select
  count(*) as total_auth_users
from auth.users;
```

Uso esperado:

- dimensionar o universo total de usuários Auth;
- comparar com o total de pacientes;
- orientar volume de revisão manual.

## 5. Total de pacientes

```sql
select
  count(*) as total_patients
from public.patients;
```

Uso esperado:

- dimensionar o universo de clientes/pacientes existentes;
- comparar com usuários Auth vinculados.

## 6. Usuários por role legado em `user_metadata`

```sql
select
  coalesce(nullif(auth_users.legacy_role, ''), '<sem role>') as legacy_role,
  count(*) as total_users
from (
  select
    u.id,
    u.raw_user_meta_data ->> 'role' as legacy_role
  from auth.users as u
) as auth_users
group by coalesce(nullif(auth_users.legacy_role, ''), '<sem role>')
order by total_users desc, legacy_role asc;
```

Uso esperado:

- entender o volume de `patient`, `admin`, roles ausentes e roles inesperados;
- detectar divergência entre Auth legado e modelo canônico futuro.

## 7. Usuários com `user_metadata.role = 'patient'`

```sql
select
  u.id as auth_user_id,
  u.email as auth_email,
  u.raw_user_meta_data ->> 'name' as metadata_name,
  u.raw_user_meta_data ->> 'cpf' as metadata_cpf,
  u.created_at as auth_created_at
from auth.users as u
where u.raw_user_meta_data ->> 'role' = 'patient'
order by u.created_at asc;
```

Uso esperado:

- listar usuários legados candidatos a `profiles.role = 'cliente'`;
- cruzar com `patients.user_id` antes de qualquer escrita futura.

## 8. Usuários com `user_metadata.role = 'admin'`

```sql
select
  u.id as auth_user_id,
  u.email as auth_email,
  u.raw_user_meta_data ->> 'name' as metadata_name,
  u.created_at as auth_created_at
from auth.users as u
where u.raw_user_meta_data ->> 'role' = 'admin'
order by u.created_at asc;
```

Uso esperado:

- listar admins legados ambíguos;
- preparar revisão manual entre `parceiro`, `admin` real ou bloqueio;
- impedir promoção automática para Super Admin.

Regra de decisão:

- nenhum resultado desta consulta deve virar `profiles.role = 'admin'` automaticamente.

## 9. Usuários sem role

```sql
select
  u.id as auth_user_id,
  u.email as auth_email,
  u.raw_user_meta_data as metadata,
  u.created_at as auth_created_at
from auth.users as u
where u.raw_user_meta_data ->> 'role' is null
   or nullif(u.raw_user_meta_data ->> 'role', '') is null
order by u.created_at asc;
```

Uso esperado:

- listar usuários sem classificação confiável;
- enviar para revisão manual;
- negar acesso autenticado futuro até classificação segura.

## 10. Usuários com role inválido ou inesperado

```sql
select
  u.id as auth_user_id,
  u.email as auth_email,
  u.raw_user_meta_data ->> 'role' as legacy_role,
  u.raw_user_meta_data as metadata,
  u.created_at as auth_created_at
from auth.users as u
where u.raw_user_meta_data ->> 'role' is not null
  and nullif(u.raw_user_meta_data ->> 'role', '') is not null
  and u.raw_user_meta_data ->> 'role' not in (
    'patient',
    'admin',
    'cliente',
    'parceiro'
  )
order by legacy_role asc, u.created_at asc;
```

Uso esperado:

- detectar dados incompatíveis com o legado conhecido e com o modelo canônico futuro;
- evitar fallback inseguro para Admin.

## 11. Pacientes com `patients.user_id`

```sql
select
  p.id as patient_id,
  p.user_id,
  p.name,
  p.email,
  p.cpf,
  p.created_at,
  p.updated_at
from public.patients as p
where p.user_id is not null
order by p.created_at asc;
```

Uso esperado:

- identificar pacientes com vínculo Auth explícito;
- formar a base inicial de candidatos a `profiles.role = 'cliente'`.

## 12. Pacientes sem `patients.user_id`

```sql
select
  p.id as patient_id,
  p.name,
  p.email,
  p.cpf,
  p.created_at,
  p.updated_at
from public.patients as p
where p.user_id is null
order by p.created_at asc;
```

Uso esperado:

- listar pacientes sem usuário Auth vinculado;
- impedir criação automática de profile sem decisão;
- separar cadastro clínico sem login de conta autenticada.

## 13. Pacientes cujo `user_id` não encontra usuário Auth

```sql
select
  p.id as patient_id,
  p.user_id,
  p.name,
  p.email,
  p.cpf,
  p.created_at,
  p.updated_at
from public.patients as p
left join auth.users as u
  on u.id = p.user_id
where p.user_id is not null
  and u.id is null
order by p.created_at asc;
```

Uso esperado:

- detectar vínculo quebrado;
- impedir backfill para usuário inexistente;
- enviar para correção/revisão manual.

## 14. Usuários Auth sem paciente correspondente

```sql
select
  u.id as auth_user_id,
  u.email as auth_email,
  u.raw_user_meta_data ->> 'role' as legacy_role,
  u.created_at as auth_created_at
from auth.users as u
left join public.patients as p
  on p.user_id = u.id
where p.id is null
order by u.created_at asc;
```

Uso esperado:

- identificar usuários Auth que não são pacientes;
- separar possíveis admins legados, usuários órfãos e contas de teste;
- impedir criação automática de Cliente sem `patients`.

## 15. Possíveis clientes claros

Critério proposto:

- usuário Auth com `user_metadata.role = 'patient'`;
- paciente vinculado por `patients.user_id`;
- vínculo Auth encontrado;
- sem depender de rota pública por token.

```sql
select
  u.id as auth_user_id,
  u.email as auth_email,
  p.id as patient_id,
  p.name as patient_name,
  p.email as patient_email,
  p.cpf as patient_cpf,
  'cliente' as suggested_role,
  'active' as suggested_status,
  'auth role patient + patients.user_id correspondente' as reason
from auth.users as u
left join public.patients as p
  on p.user_id = u.id
where u.raw_user_meta_data ->> 'role' = 'patient'
  and p.id is not null
order by p.created_at asc;
```

Uso esperado:

- gerar lista inicial de candidatos a `profiles.role = 'cliente'`;
- sugerir `active` apenas quando o vínculo estiver claro.

Observação:

- a sugestão de `active` ainda precisa de aprovação antes de qualquer backfill.

## 16. Possíveis pacientes vinculados sem role `patient`

```sql
select
  u.id as auth_user_id,
  u.email as auth_email,
  u.raw_user_meta_data ->> 'role' as legacy_role,
  p.id as patient_id,
  p.name as patient_name,
  p.email as patient_email,
  p.cpf as patient_cpf,
  'cliente' as suggested_role,
  'pending' as suggested_status,
  'patient vinculado, mas role legado ausente ou diferente de patient' as reason
from public.patients as p
left join auth.users as u
  on u.id = p.user_id
where p.user_id is not null
  and u.id is not null
  and (
    u.raw_user_meta_data ->> 'role' is null
    or u.raw_user_meta_data ->> 'role' <> 'patient'
  )
order by p.created_at asc;
```

Uso esperado:

- detectar pacientes com vínculo Auth, mas metadata divergente;
- sugerir revisão antes de conceder `active`.

## 17. Admins legados ambíguos

```sql
select
  u.id as auth_user_id,
  u.email as auth_email,
  u.raw_user_meta_data as metadata,
  p.id as linked_patient_id,
  p.name as linked_patient_name,
  'revisao_manual' as required_action,
  'admin legado nunca deve virar Super Admin automaticamente' as reason
from auth.users as u
left join public.patients as p
  on p.user_id = u.id
where u.raw_user_meta_data ->> 'role' = 'admin'
order by u.created_at asc;
```

Uso esperado:

- listar todos os admins legados;
- verificar se algum admin também está vinculado a `patients`;
- separar manualmente entre futuro `parceiro`, futuro `admin` real ou conta a bloquear.

Regra obrigatória:

- não converter esses usuários automaticamente para `profiles.role = 'admin'`.

## 18. Usuários sem role para revisão manual

```sql
select
  u.id as auth_user_id,
  u.email as auth_email,
  p.id as linked_patient_id,
  p.name as linked_patient_name,
  'pending' as suggested_status,
  'sem role legado confiavel' as reason
from auth.users as u
left join public.patients as p
  on p.user_id = u.id
where u.raw_user_meta_data ->> 'role' is null
   or nullif(u.raw_user_meta_data ->> 'role', '') is null
order by u.created_at asc;
```

Uso esperado:

- listar contas que exigem decisão antes de qualquer profile ativo;
- evitar fallback para Admin.

## 19. Duplicidade: mais de um paciente para o mesmo `user_id`

```sql
select
  p.user_id,
  count(*) as total_patients,
  min(p.created_at) as first_patient_created_at,
  max(p.created_at) as last_patient_created_at
from public.patients as p
where p.user_id is not null
group by p.user_id
having count(*) > 1
order by total_patients desc, last_patient_created_at desc;
```

Uso esperado:

- identificar violação potencial de relação 1:1 entre Cliente e paciente;
- impedir preenchimento automático de `patients.profile_id` sem resolver duplicidade.

## 20. Duplicidade: e-mails em Auth

```sql
select
  lower(trim(u.email)) as normalized_email,
  count(*) as total_auth_users,
  min(u.created_at) as first_created_at,
  max(u.created_at) as last_created_at
from auth.users as u
where u.email is not null
group by lower(trim(u.email))
having count(*) > 1
order by total_auth_users desc, normalized_email asc;
```

Uso esperado:

- detectar duplicidade de credenciais/e-mails;
- avaliar impacto antes de criar `profiles`.

## 21. Duplicidade: e-mails em pacientes

```sql
select
  lower(trim(p.email)) as normalized_email,
  count(*) as total_patients,
  min(p.created_at) as first_created_at,
  max(p.created_at) as last_created_at
from public.patients as p
where p.email is not null
  and nullif(trim(p.email), '') is not null
group by lower(trim(p.email))
having count(*) > 1
order by total_patients desc, normalized_email asc;
```

Uso esperado:

- detectar e-mails repetidos na base clínica/cadastral;
- separar e-mail do paciente de identidade Auth.

## 22. Duplicidade: CPFs em pacientes

```sql
select
  regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g') as normalized_cpf,
  count(*) as total_patients,
  min(p.created_at) as first_created_at,
  max(p.created_at) as last_created_at
from public.patients as p
where p.cpf is not null
  and nullif(regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g'), '') is not null
group by regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g')
having count(*) > 1
order by total_patients desc, normalized_cpf asc;
```

Uso esperado:

- detectar duplicidade por CPF;
- bloquear automação de profile até resolver conflitos.

## 23. E-mails sintéticos `@patient.local`

```sql
select
  u.id as auth_user_id,
  u.email as auth_email,
  u.raw_user_meta_data ->> 'cpf' as metadata_cpf,
  p.id as linked_patient_id,
  p.name as linked_patient_name,
  p.cpf as patient_cpf
from auth.users as u
left join public.patients as p
  on p.user_id = u.id
where u.email ilike '%@patient.local'
order by u.created_at asc;
```

Uso esperado:

- identificar contas criadas pelo fluxo legado de CPF sem e-mail;
- revisar impacto em comunicação, login e suporte.

## 24. Pacientes cujo CPF sugere e-mail sintético esperado

```sql
select
  p.id as patient_id,
  p.user_id,
  p.name,
  p.cpf,
  p.email as patient_email,
  concat(
    regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g'),
    '@patient.local'
  ) as expected_synthetic_email,
  u.email as auth_email
from public.patients as p
left join auth.users as u
  on u.id = p.user_id
where p.cpf is not null
  and p.user_id is not null
  and u.email ilike '%@patient.local'
order by p.created_at asc;
```

Uso esperado:

- comparar CPF do paciente com o e-mail sintético do Auth;
- detectar inconsistências de vínculo.

## 25. Candidatos a `profiles` com status sugerido

```sql
with auth_patient_links as (
  select
    u.id as auth_user_id,
    u.email as auth_email,
    u.raw_user_meta_data ->> 'role' as legacy_role,
    p.id as patient_id,
    p.name as patient_name,
    p.email as patient_email,
    p.cpf as patient_cpf
  from auth.users as u
  left join public.patients as p
    on p.user_id = u.id
)
select
  auth_user_id,
  auth_email,
  legacy_role,
  patient_id,
  patient_name,
  patient_email,
  patient_cpf,
  case
    when legacy_role = 'patient' and patient_id is not null then 'cliente'
    when legacy_role = 'admin' then null
    else null
  end as suggested_role,
  case
    when legacy_role = 'patient' and patient_id is not null then 'active'
    when legacy_role = 'admin' then 'pending'
    when legacy_role is null then 'pending'
    else 'pending'
  end as suggested_status,
  case
    when legacy_role = 'patient' and patient_id is not null
      then 'cliente claro: role patient + patients.user_id'
    when legacy_role = 'admin'
      then 'admin legado ambiguo: revisao manual obrigatoria'
    when legacy_role is null
      then 'sem role: revisao manual'
    when patient_id is null
      then 'sem patient correspondente: revisao manual'
    else 'role inesperado: revisao manual'
  end as reason
from auth_patient_links
order by suggested_status asc, legacy_role asc, auth_email asc;
```

Uso esperado:

- consolidar uma primeira visão de candidatos;
- separar sugestão de status de decisão final;
- garantir que admin legado fique `pending`/revisão.

Observação:

- esta consulta não deve ser usada para escrita automática.

## 26. Casos que devem ir para revisão manual

```sql
with auth_patient_links as (
  select
    u.id as auth_user_id,
    u.email as auth_email,
    u.raw_user_meta_data ->> 'role' as legacy_role,
    p.id as patient_id,
    p.name as patient_name,
    p.cpf as patient_cpf
  from auth.users as u
  left join public.patients as p
    on p.user_id = u.id
)
select
  auth_user_id,
  auth_email,
  legacy_role,
  patient_id,
  patient_name,
  patient_cpf,
  case
    when legacy_role = 'admin'
      then 'admin legado: classificar manualmente entre parceiro, admin real ou bloqueio'
    when legacy_role is null
      then 'sem role: decidir se cria profile pending ou nenhum profile'
    when legacy_role not in ('patient', 'admin')
      then 'role inesperado: revisar origem'
    when legacy_role = 'patient' and patient_id is null
      then 'role patient sem patient vinculado'
    else 'revisar'
  end as review_reason
from auth_patient_links
where legacy_role = 'admin'
   or legacy_role is null
   or legacy_role not in ('patient', 'admin')
   or (legacy_role = 'patient' and patient_id is null)
order by review_reason asc, auth_email asc;
```

Uso esperado:

- formar a fila explícita de revisão manual;
- impedir backfill automático nos casos ambíguos.

## 27. Resumo final esperado para tomada de decisão

```sql
with auth_patient_links as (
  select
    u.id as auth_user_id,
    u.raw_user_meta_data ->> 'role' as legacy_role,
    p.id as patient_id
  from auth.users as u
  left join public.patients as p
    on p.user_id = u.id
),
classified as (
  select
    auth_user_id,
    case
      when legacy_role = 'patient' and patient_id is not null
        then 'candidato_cliente_active'
      when legacy_role = 'admin'
        then 'admin_legado_revisao_manual'
      when legacy_role is null
        then 'sem_role_revisao_manual'
      when legacy_role not in ('patient', 'admin')
        then 'role_inesperado_revisao_manual'
      when legacy_role = 'patient' and patient_id is null
        then 'patient_sem_patient_revisao_manual'
      else 'revisao_manual'
    end as classification
  from auth_patient_links
)
select
  classification,
  count(*) as total_users
from classified
group by classification
order by total_users desc, classification asc;
```

Uso esperado:

- produzir sumário executivo para aprovação do backfill futuro;
- responder quantos usuários podem virar Cliente ativo e quantos exigem revisão.

## 28. Categorias de usuários mapeadas

| Categoria | Critério | Ação futura sugerida |
| --- | --- | --- |
| Cliente claro | Auth role `patient` + `patients.user_id` correspondente | Candidato a `profiles.role = 'cliente'` e `status = 'active'`. |
| Patient sem patient | Auth role `patient` sem registro em `patients` | Revisão manual; não ativar automaticamente. |
| Admin legado | Auth role `admin` | Revisão manual; nunca Super Admin automático. |
| Sem role | Metadata sem role | Revisão manual; `pending` ou sem profile. |
| Role inesperado | Role diferente de `patient`/`admin` e diferente dos termos canônicos aceitos | Revisão manual. |
| Patient sem Auth | Registro em `patients` sem `user_id` | Revisão cadastral; não criar profile automaticamente. |
| Vínculo quebrado | `patients.user_id` sem Auth correspondente | Correção manual antes de profile. |
| Duplicidade | Mesmo `user_id`, e-mail ou CPF repetido | Bloquear automação até resolução. |

## 29. Critérios para candidatos a Cliente

Um usuário só deve ser considerado candidato claro a Cliente quando:

- existir em `auth.users`;
- tiver `user_metadata.role = 'patient'`;
- possuir registro em `public.patients`;
- `patients.user_id = auth.users.id`;
- não houver duplicidade relevante;
- não houver conflito de CPF/e-mail que exija revisão.

Status sugerido:

- `active`, apenas se o vínculo estiver claro.

Caso contrário:

- `pending` ou revisão manual.

## 30. Critérios para admins legados ambíguos

Todo usuário com `user_metadata.role = 'admin'` deve ser tratado como ambíguo.

Possibilidades futuras:

- virar `parceiro`, se for profissional operacional;
- virar `admin`, se for Super Admin real aprovado;
- permanecer `pending`;
- ser suspenso/desabilitado;
- não receber profile até decisão.

Regra obrigatória:

- admin legado nunca vira Super Admin automaticamente.

## 31. Critérios para revisão manual

Enviar para revisão manual:

- Auth sem role;
- Auth com role inesperado;
- Auth role `admin`;
- Auth role `patient` sem `patients`;
- paciente sem `user_id`;
- paciente com `user_id` quebrado;
- duplicidade de `user_id`;
- duplicidade de CPF;
- duplicidade de e-mail;
- e-mail sintético inconsistente;
- qualquer conflito entre metadata e `patients`.

## 32. Casos de risco

| Risco | Motivo |
| --- | --- |
| Promover admin legado para Super Admin | O `/admin` atual mistura funções futuras de Parceiro. |
| Criar Cliente sem `patients` | Pode gerar profile sem dados clínicos/cadastrais. |
| Criar profile para paciente sem Auth | Não há usuário autenticado correspondente. |
| Ignorar duplicidade de CPF/e-mail | Pode unir identidades distintas. |
| Confiar em `user_metadata` como fonte final | Metadata é legado/transição, não autorização canônica. |
| Usar token de formulário como destino final | `/form/:token` é legado/provisório. |
| Ignorar Storage clínico público | Arquivos clínicos futuros devem ser protegidos por ownership. |

## 33. O que não está implementado nesta fase

- Nenhuma migration executável.
- Nenhum SQL de escrita.
- Nenhum banco alterado.
- Nenhum Supabase alterado.
- Nenhuma RLS alterada.
- Nenhuma policy alterada.
- Nenhuma Edge Function alterada.
- Nenhum runtime alterado.
- Nenhum login Next criado.
- Nenhuma rota criada.
- Nenhum guard ou middleware criado.
- Nenhuma dependência instalada.

## 34. Como usar este relatório antes do backfill futuro

Fluxo recomendado:

1. Executar as consultas somente leitura em ambiente autorizado.
2. Exportar resultados sem secrets.
3. Revisar categorias com produto/segurança.
4. Aprovar regras de classificação.
5. Só então especificar migration de `profiles`.
6. Só depois criar backfill controlado.
7. Validar que nenhum admin legado virou Super Admin automaticamente.
8. Manter `/form/:token` fora do destino final de formulários.
9. Planejar proteção de Storage clínico antes de uso sensível em produção.

## 35. Critérios de aceite desta especificação

- Todas as consultas propostas são somente leitura.
- Candidatos a `profiles` estão classificados.
- Admin legado permanece ambíguo e exige revisão manual.
- Casos de revisão manual estão explícitos.
- Duplicidades são mapeadas antes de qualquer escrita.
- Nenhum SQL de escrita foi criado.
- Nenhum banco/runtime foi alterado.
- O projeto fica preparado para uma futura fase de migration `profiles`.
