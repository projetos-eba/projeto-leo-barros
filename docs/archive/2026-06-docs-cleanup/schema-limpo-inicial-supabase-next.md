# Draft técnico — schema limpo inicial para Next.js + Supabase

Data de referência: 22 de junho de 2026.

Status: rascunho consolidado após a Fase 5.1.1. **Não é migration executável e nenhum SQL foi aplicado.**

## 1. Decisão de reset controlado

O projeto seguirá com uma reconstrução controlada:

- aplicação principal futura em Next.js;
- novo Supabase limpo;
- novo schema criado por migrations rastreáveis;
- RLS restritiva desde a fundação;
- nenhuma migração dos usuários Auth atuais;
- nenhuma migração dos pacientes atuais;
- nenhum backfill do banco legado;
- nenhum reaproveitamento das policies permissivas atuais;
- login inicial futuro único e temporário em `/login`;
- `profiles` como fonte canônica de identidade, role e status.

O Supabase atual e seus dados são considerados ambiente de desenvolvimento/teste. Eles não serão promovidos para a base nova.

## 2. Precedência aplicada nesta especificação

Para esta fase foi aplicada a seguinte ordem:

1. `AGENTS.md`;
2. decisões formais do prompt desta Fase 5.1.1;
3. documentos de apoio;
4. código e schema legados apenas como evidência/inventário.

O `AGENTS.md` ainda descreve a migração gradual sobre a base existente e está desatualizado em relação à decisão posterior de reset controlado. A decisão formal desta fase prevalece para este draft, sem alteração do `AGENTS.md`, pois somente este documento está autorizado no escopo.

## 3. O que será ignorado do banco antigo

Não será migrado nem usado para gerar registros na base nova:

- usuários de `auth.users` atuais;
- `user_metadata.role`;
- pacientes atuais;
- CPFs, e-mails ou vínculos Auth atuais;
- admins legados;
- dados clínicos e operacionais atuais;
- relatórios de candidatos a backfill;
- `patients.user_id`;
- `form_assignments.access_token`;
- `/form/:token` como arquitetura final;
- buckets públicos atuais;
- policies com acesso `public`;
- policies genéricas com `USING (true)` ou `WITH CHECK (true)`;
- seeds/mock patients das migrations antigas;
- histórico atual de migrations como sequência oficial da base nova;
- Edge Functions atuais como implementação final.

Nenhum dado legado será apagado nesta fase. Ele apenas fica fora da reconstrução.

## 4. O que será reaproveitado apenas como inventário

`migration (1).sql`, `supabase/migrations/**`, `supabase/functions/**` e os tipos gerados atuais poderão orientar:

- nomes de módulos já explorados;
- lista de tabelas clínicas e operacionais;
- relações históricas por `patient_id`;
- campos úteis já experimentados;
- riscos encontrados nas policies;
- necessidades futuras de dietas, treinos, exames, prescrições, formulários, materiais e fotos;
- necessidade de revisar criação de usuários e operações administrativas.

Esses arquivos não são fonte executável para o novo Supabase.

`migration (1).sql` permanece exclusivamente como inventário legado e não deve ser copiado para `supabase/migrations/`.

## 5. Escopo da primeira migration limpa

A primeira migration oficial futura deverá conter somente a fundação de identidade e ownership:

1. função compartilhada para `updated_at`;
2. `profiles`;
3. `admins`;
4. `patients`;
5. `partners`;
6. `partner_clients`;
7. validações de role entre tabelas de extensão e `profiles`;
8. constraints e unicidade do vínculo por `service_scope`;
9. índices e FKs;
10. RLS inicial restritiva;
11. grants mínimos necessários;
12. suporte aos seeds mínimos de desenvolvimento.

Não entram nessa migration:

- formulários;
- dietas;
- treinos;
- exames;
- prescrições;
- materiais;
- fotos;
- Storage;
- Edge Functions;
- rotas, login, guards ou middleware.

### 5.1 Relação canônica

```text
auth.users
  └── profiles
        ├── admins
        ├── patients
        └── partners
              └── partner_clients ── patients
```

`partner_clients` pertence ao domínio do Parceiro, mas referencia simultaneamente `partners` e `patients`.

## 6. Convenções gerais

### 6.1 Identificadores

- Todas as tabelas usam `uuid`.
- Primary keys usam `gen_random_uuid()`.
- A disponibilidade de `pgcrypto` deve ser confirmada no projeto Supabase limpo antes da migration oficial.

### 6.2 Auditoria obrigatória

Todas as cinco tabelas terão:

- `created_at timestamptz not null default now()`;
- `updated_at timestamptz not null default now()`.

Uma função/trigger compartilhada deverá atualizar `updated_at` em toda alteração.

### 6.3 Soft delete

Decisão deste draft: **não criar `deleted_at` na primeira migration**.

Justificativa:

- não existe política aprovada de retenção ou exclusão;
- introduzir soft delete sem regras de consulta e RLS produziria registros “apagados” ainda acessíveis;
- `profiles.status` controla desativação de conta;
- `partner_clients.status` controla encerramento/suspensão do vínculo;
- exclusão física pelo cliente da aplicação ficará negada inicialmente;
- exclusão definitiva deverá ser fluxo administrativo futuro, auditado e compatível com obrigações de retenção.

Consequências por tabela:

| Tabela | Estratégia inicial |
| --- | --- |
| `profiles` | desativar com `status = 'disabled'`; sem delete pela aplicação |
| `admins` | desativar o `profile`; sem delete pela aplicação |
| `patients` | sem delete pela aplicação; política de retenção futura |
| `partners` | desativar o `profile`; sem delete pela aplicação |
| `partner_clients` | alterar status; preservar histórico do vínculo |

A decisão sobre `deleted_at` deverá ser reavaliada antes de módulos clínicos entrarem em produção.

### 6.4 Role e status

Roles oficiais:

- `cliente`;
- `parceiro`;
- `admin`.

Status oficiais:

- `pending`;
- `active`;
- `suspended`;
- `disabled`.

Role e status usarão `text + check constraint`. Não usar enum PostgreSQL.

### 6.5 Admin

`admin` é Super Admin global.

Haverá tabela `admins` desde a fundação inicial. O Admin será representado por:

- registro em `profiles`;
- `role = 'admin'`;
- `status = 'active'`;
- registro 1:1 em `admins`, como extensão operacional;
- policies administrativas explícitas.

No MVP:

- existe somente o Super Admin global;
- não existem níveis administrativos diferentes;
- Admin e Parceiro são entidades distintas;
- o Super Admin pode gerenciar usuários, profissionais, Clientes/Pacientes, planos e financeiro, além de visualizar os dados permitidos pelas policies;
- poderes administrativos não serão derivados de `user_metadata.role`.

### 6.6 Status de Parceiro

Decisão deste draft: `partners` não duplicará `status`.

O estado de acesso do profissional será `profiles.status`. Isso evita divergência entre `partners.status` e `profiles.status`.

Se futuramente existir um estado operacional diferente do estado da conta — por exemplo credenciamento profissional — ele deverá entrar em coluna própria com vocabulário próprio, em migration posterior.

## 7. Schema proposto

### 7.1 `profiles`

Fonte canônica de identidade do produto.

| Coluna | Tipo | Nulo | Default | Regra |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | não | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | não | — | FK para `auth.users.id`, único |
| `email` | `text` | não | — | cópia normalizada para uso do produto |
| `display_name` | `text` | não | — | nome comum exibível |
| `role` | `text` | não | — | check de roles oficiais |
| `status` | `text` | não | `'pending'` | check de status oficiais |
| `created_at` | `timestamptz` | não | `now()` | auditoria |
| `updated_at` | `timestamptz` | não | `now()` | auditoria |

Decisões:

- `profiles.user_id` é a única ligação direta do schema público com `auth.users`;
- `profiles.user_id` tem cardinalidade 1:1 com Auth;
- `email` é espelhado para consultas de produto e administração;
- Auth continua sendo a fonte das credenciais;
- alterações de e-mail deverão sincronizar Auth e `profiles` por operação confiável;
- `user_metadata.role` não participa da autorização;
- role/status ausente ou inválido deve negar acesso.

Unicidade:

- unique em `user_id`;
- unique case-insensitive em `lower(email)`.

Não será aplicada uma validação regex complexa de e-mail no banco. O formato será validado na camada de entrada; a unicidade normalizada permanece no banco.

### 7.2 `admins`

Extensão operacional exclusiva para profiles com role `admin`.

| Coluna | Tipo | Nulo | Default | Regra |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | não | `gen_random_uuid()` | PK |
| `profile_id` | `uuid` | não | — | FK para `profiles.id`, único |
| `created_at` | `timestamptz` | não | `now()` | auditoria |
| `updated_at` | `timestamptz` | não | `now()` | auditoria |

Decisões:

- `admins.profile_id` é único;
- um profile Admin possui no máximo um registro `admins`;
- não haverá nível, cargo ou hierarquia administrativa no MVP;
- a tabela não duplica role ou status;
- autorização continua baseada em `profiles.role = 'admin'` e `profiles.status = 'active'`;
- um profile com role diferente de `admin` não pode possuir registro em `admins`.

### 7.3 `patients`

Extensão de domínio exclusiva para profiles com role `cliente`.

| Coluna | Tipo | Nulo | Default | Regra |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | não | `gen_random_uuid()` | PK |
| `profile_id` | `uuid` | não | — | FK para `profiles.id`, único |
| `cpf` | `text` | sim | — | somente dígitos; único quando preenchido |
| `phone` | `text` | sim | — | contato do cliente |
| `birth_date` | `date` | sim | — | validada na entrada; regra temporal dinâmica não entra em `check` |
| `objective` | `text` | sim | — | objetivo inicial não clínico |
| `created_at` | `timestamptz` | não | `now()` | auditoria |
| `updated_at` | `timestamptz` | não | `now()` | auditoria |

Decisões:

- não existe `patients.user_id`;
- o caminho canônico é `patients.profile_id → profiles.id → profiles.user_id → auth.users.id`;
- `profile_id` é único: um profile Cliente possui no máximo um registro `patients`;
- nome e e-mail comuns permanecem em `profiles`, evitando duplicação;
- dados clínicos futuros não devem ser adicionados a `profiles`;
- `cpf` não será usado como fonte de autorização;
- caso CPF continue como opção de login futuramente, sua resolução deverá ocorrer por fluxo seguro, sem consulta pública direta;
- na interface e nas rotas, o termo oficial é Cliente e o prefixo futuro é `/cliente`;
- o Parceiro poderá criar Cliente já com login;
- no MVP, o provisionamento confiável desse fluxo criará o profile Cliente com `status = 'active'`.

Constraint de CPF proposta:

- nulo permitido;
- quando preenchido, exatamente 11 dígitos;
- unique parcial para valores não nulos.

### 7.4 `partners`

Extensão de domínio exclusiva para profiles com role `parceiro`.

| Coluna | Tipo | Nulo | Default | Regra |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | não | `gen_random_uuid()` | PK |
| `profile_id` | `uuid` | não | — | FK para `profiles.id`, único |
| `professional_name` | `text` | não | — | nome profissional |
| `professional_type` | `text` | não | — | check dos tipos profissionais oficiais |
| `professional_registry_type` | `text` | sim | — | tipo/conselho do registro profissional |
| `professional_registry_number` | `text` | sim | — | número do registro profissional |
| `created_at` | `timestamptz` | não | `now()` | auditoria |
| `updated_at` | `timestamptz` | não | `now()` | auditoria |

Decisões:

- `partners.profile_id` é único;
- status da conta vem de `profiles.status`;
- `professional_type` usa `text + check` com `personal_trainer`, `nutricionista` e `medico`;
- `professional_type` é uma classificação cadastral e comercial usada em perfil, segmentação, filtros e contexto;
- `professional_type` não limita módulos nem valores de `service_scope` no MVP;
- o acesso global do Parceiro aos módulos será definido futuramente por plano/permissão comercial;
- `professional_registry_type` e `professional_registry_number` são opcionais, mas devem ser preenchidos em conjunto quando usados;
- o registro profissional não será unique inicialmente, porque formato, jurisdição e chave de comparação ainda não foram especificados;
- credenciamento, documentos e validação profissional ficam para fase posterior;
- um Admin não precisa de registro em `partners`;
- um profile com role diferente de `parceiro` não pode possuir registro em `partners`.

### 7.5 `partner_clients`

Tabela de vínculo e ownership entre Parceiro e Cliente.

| Coluna | Tipo | Nulo | Default | Regra |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | não | `gen_random_uuid()` | PK |
| `partner_id` | `uuid` | não | — | FK para `partners.id` |
| `patient_id` | `uuid` | não | — | FK para `patients.id` |
| `service_scope` | `text` | não | — | check: `dieta`, `treino`, `saude` ou `cardio` |
| `status` | `text` | não | `'active'` | check de status oficiais |
| `started_at` | `timestamptz` | não | `now()` | início da validade operacional |
| `ended_at` | `timestamptz` | sim | — | momento de encerramento definitivo |
| `created_at` | `timestamptz` | não | `now()` | auditoria |
| `updated_at` | `timestamptz` | não | `now()` | auditoria |

Cardinalidade aprovada:

- N:N;
- um Parceiro pode ter vários Clientes;
- um Cliente pode ter mais de um Parceiro ativo somente quando os vínculos usam escopos diferentes;
- todos os Parceiros têm o mesmo peso.

Decisões:

- não existe `is_primary` na primeira migration;
- não haverá unique em `patient_id`;
- não haverá unique em `partner_id`;
- não pode haver dois vínculos `active` para o mesmo Cliente e o mesmo `service_scope`, independentemente do Parceiro;
- a mesma combinação Parceiro–Cliente–Escopo não pode ter mais de um vínculo simultaneamente aberto;
- vínculos `disabled` permanecem como histórico e permitem um novo vínculo futuro da mesma dupla;
- `suspended` interrompe autorização sem encerrar definitivamente;
- `ended_at` deverá ser preenchido quando o vínculo passar para `disabled`;
- o Cliente não troca de Parceiro no MVP;
- regras detalhadas de encerramento, suspensão, histórico e eventual troca ficam para fase futura;
- o Parceiro só poderá acessar dados criados durante vínculos válidos;
- um mesmo Parceiro pode manter mais de um vínculo com o mesmo Cliente, desde que cada vínculo represente um `service_scope` diferente;
- tabelas de módulos sensíveis futuros deverão registrar ownership suficiente por `partner_client_id`, `patient_id`, `partner_id` e `service_scope`, além de autoria e timestamps, para validar vínculo, período e escopo na RLS.

Unicidade proposta:

- índice unique parcial em `(patient_id, service_scope)` enquanto `status = 'active'`;
- índice unique parcial em `(partner_id, patient_id, service_scope)` enquanto `status` estiver em `pending`, `active` ou `suspended`;
- múltiplos registros históricos `disabled` são permitidos.

### 7.6 Separação entre classificação, vínculo e permissão comercial

O modelo usa três conceitos independentes:

| Conceito | Campo ou domínio | Responsabilidade |
| --- | --- | --- |
| Classificação cadastral/comercial | `partners.professional_type` | identificar perfil profissional, segmentar, filtrar e contextualizar o Parceiro |
| Escopo do atendimento por Cliente | `partner_clients.service_scope` | definir em qual área aquele Parceiro atende aquele Cliente |
| Acesso global aos módulos | plano/permissão comercial futura | definir quais módulos da plataforma estão disponíveis para a assinatura do Parceiro |

Regras:

- `professional_type` não autoriza nem bloqueia módulos ou escopos no MVP;
- não haverá trigger, função ou policy que relacione rigidamente `professional_type` a `service_scope`;
- qualquer Parceiro poderá possuir vínculos em `dieta`, `treino`, `saude` e/ou `cardio`, conforme o atendimento contratado ou definido;
- o plano/permissão comercial poderá limitar a disponibilidade global de módulos no futuro, mas não faz parte da primeira migration limpa;
- dentro de um módulo disponível no plano, o acesso aos dados de um Cliente depende de vínculo `active` no `service_scope` correspondente;
- `saude` engloba exames, prescrições e demais dados de saúde.

## 8. Relações e FKs

| Origem | Destino | Cardinalidade | `ON DELETE` proposto |
| --- | --- | --- | --- |
| `profiles.user_id` | `auth.users.id` | 1:1 | `RESTRICT` |
| `admins.profile_id` | `profiles.id` | 1:1 | `RESTRICT` |
| `patients.profile_id` | `profiles.id` | 1:1 | `RESTRICT` |
| `partners.profile_id` | `profiles.id` | 1:1 | `RESTRICT` |
| `partner_clients.partner_id` | `partners.id` | N:1 | `RESTRICT` |
| `partner_clients.patient_id` | `patients.id` | N:1 | `RESTRICT` |

Justificativa para `RESTRICT`:

- impedir exclusões acidentais que apaguem identidade ou histórico;
- forçar desativação por status;
- manter a futura política de retenção explícita;
- evitar cascata silenciosa sobre dados clínicos futuros.

Antes da migration oficial, o comportamento de remoção de usuários Auth deve ser validado em ambiente Supabase local/temporário.

## 9. Integridade entre role e tabela de extensão

Uma FK não garante que:

- `admins.profile_id` aponta para role `admin`;
- `patients.profile_id` aponta para role `cliente`;
- `partners.profile_id` aponta para role `parceiro`.

A migration oficial deverá incluir validação no banco, preferencialmente por triggers pequenos e testáveis:

- antes de inserir/alterar `admins`, confirmar `profiles.role = 'admin'`;
- antes de inserir/alterar `patients`, confirmar `profiles.role = 'cliente'`;
- antes de inserir/alterar `partners`, confirmar `profiles.role = 'parceiro'`;
- impedir mudança de `profiles.role` quando existir extensão incompatível;
- impedir que um mesmo profile possua extensões incompatíveis.

Service role não deve conseguir contornar a integridade de domínio silenciosamente.

Não criar validação de integridade que compare `partners.professional_type` com `partner_clients.service_scope`. A integridade de `partner_clients` deve validar somente o vocabulário de escopo, as FKs, o estado e as regras de unicidade do vínculo.

## 10. Índices recomendados

### `profiles`

- unique constraint/index em `user_id`;
- unique index em `lower(email)`;
- índice em `(role, status)`;
- índice em `status`.

### `patients`

- unique constraint/index em `profile_id`;
- unique index parcial em `cpf where cpf is not null`.

### `admins`

- unique constraint/index em `profile_id`.

### `partners`

- unique constraint/index em `profile_id`;
- índice em `professional_name`;
- índice em `professional_type`.

O par `professional_registry_type` + `professional_registry_number` não recebe unique até o domínio profissional e a jurisdição serem definidos.

### `partner_clients`

- índice em `partner_id`;
- índice em `patient_id`;
- índice em `service_scope`;
- índice em `(partner_id, status)`;
- índice em `(patient_id, status)`;
- índice em `(patient_id, service_scope, status)`;
- unique parcial em `(patient_id, service_scope)` para vínculos `active`;
- unique parcial em `(partner_id, patient_id, service_scope)` para vínculos abertos.

Não criar índice unique isolado em `patient_id`, pois isso impediria a cardinalidade N:N por escopo aprovada.

## 11. Rascunho SQL estrutural ilustrativo

O bloco abaixo é **somente uma proposta para revisão humana**. Não deve ser copiado ou executado como migration sem aprovação da fase seguinte.

```sql
-- RASCUNHO ILUSTRATIVO — NÃO EXECUTAR

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
  constraint profiles_user_id_key unique (user_id),
  constraint profiles_role_check
    check (role in ('cliente', 'parceiro', 'admin')),
  constraint profiles_status_check
    check (status in ('pending', 'active', 'suspended', 'disabled')),
  constraint profiles_display_name_not_blank
    check (length(btrim(display_name)) > 0),
  constraint profiles_email_not_blank
    check (length(btrim(email)) > 0)
);

create unique index profiles_email_lower_key
  on public.profiles (lower(email));

create index profiles_role_status_idx
  on public.profiles (role, status);

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint admins_profile_id_fkey
    foreign key (profile_id) references public.profiles(id) on delete restrict,
  constraint admins_profile_id_key unique (profile_id)
);

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
  constraint patients_profile_id_key unique (profile_id),
  constraint patients_cpf_check
    check (cpf is null or cpf ~ '^[0-9]{11}$')
);

create unique index patients_cpf_key
  on public.patients (cpf)
  where cpf is not null;

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
  constraint partners_profile_id_key unique (profile_id),
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
        and
        length(btrim(professional_registry_type)) > 0
        and length(btrim(professional_registry_number)) > 0
      )
    )
);

create index partners_professional_name_idx
  on public.partners (professional_name);

create index partners_professional_type_idx
  on public.partners (professional_type);

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
      (status <> 'disabled' and ended_at is null)
    )
);

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
```

Observação: função de `updated_at`, triggers de integridade de role e RLS foram separados abaixo para facilitar revisão. O SQL final não deverá criar trigger ou função que limite `service_scope` com base em `professional_type`.

## 12. Estratégia inicial de RLS

Princípio central: habilitar RLS em todas as cinco tabelas e não criar policy para `anon`.

Não usar:

- `TO public`;
- `USING (true)`;
- `WITH CHECK (true)` sem restrição de ownership;
- `user_metadata.role`;
- rota ou UI como barreira de autorização.

### 12.1 Helpers de autorização

A migration oficial poderá criar funções auxiliares internas, com revisão cuidadosa de segurança:

- `current_profile_id()`;
- `current_profile_role()`;
- `current_profile_is_active()`;
- `current_user_is_admin()`;
- `current_admin_id()`;
- `current_partner_id()`;
- `current_partner_can_access_patient(patient_id, service_scope)`;
- helper futuro para validar ownership temporal de dados de módulo por `partner_client_id`.

Requisitos:

- `security definer` somente quando necessário;
- `set search_path` fixo;
- owner controlado;
- sem permissão de alteração por roles de aplicação;
- testes contra recursão de RLS;
- negar por padrão quando não existir profile `active`.

### 12.2 `profiles`

SELECT:

- usuário autenticado lê o próprio profile;
- Admin `active` lê todos os profiles.

INSERT:

- negado diretamente a usuários comuns;
- criação via fluxo confiável de provisionamento.

UPDATE:

- negado diretamente na primeira versão;
- alterações de nome/e-mail/status/role passam por operação confiável;
- role e status nunca são autoeditáveis.

DELETE:

- negado pela aplicação.

### 12.3 `admins`

SELECT:

- Admin `active` lê o próprio registro;
- nenhum outro perfil lê a tabela diretamente.

INSERT/UPDATE/DELETE:

- negados diretamente na primeira versão;
- criação e manutenção somente por operação privilegiada, explícita e auditada.

### 12.4 `patients`

SELECT:

- Cliente `active` lê o registro cujo `profile_id` é seu próprio profile;
- Parceiro `active` lê pacientes com vínculo `partner_clients.status = 'active'` em pelo menos um escopo ativo;
- Admin `active` lê todos.

INSERT:

- negado diretamente na primeira versão;
- criação por fluxo confiável que cria Auth, profile e patient de forma transacional/idempotente;
- quando iniciado por Parceiro no MVP, o profile Cliente nasce `active` e o vínculo recebe o escopo contratado/definido.

UPDATE:

- negado diretamente para Cliente na primeira versão, pois RLS não restringe colunas;
- Parceiro não recebe update genérico até campos editáveis serem definidos;
- Admin pode atualizar em operação administrativa auditada, preferencialmente por função/RPC específica.

DELETE:

- negado pela aplicação.

### 12.5 `partners`

SELECT:

- Parceiro `active` lê o próprio registro;
- Cliente `active` pode futuramente ler dados públicos mínimos de parceiros vinculados, mas essa policy não entra na primeira versão;
- Admin `active` lê todos.

INSERT/UPDATE/DELETE:

- negados diretamente na primeira versão;
- geridos por operação administrativa confiável.

### 12.6 `partner_clients`

SELECT:

- Parceiro `active` lê seus próprios vínculos;
- Cliente `active` lê vínculos associados ao próprio patient;
- Admin `active` lê todos.

INSERT/UPDATE:

- negados diretamente a Cliente e Parceiro na primeira versão;
- Admin ou serviço confiável cria, suspende e desativa vínculos;
- fluxo de convite/autorização fica para fase futura.

DELETE:

- negado;
- histórico é preservado por status.

### 12.7 Ownership por escopo e período

`partner_clients` autoriza o relacionamento, mas não deve conceder acesso irrestrito a todo o histórico do Cliente.

Para cada módulo futuro:

- registros sensíveis criados por Parceiro deverão armazenar `partner_client_id`, `patient_id`, `partner_id`, `service_scope`, autoria e timestamps;
- a criação deverá ocorrer enquanto o vínculo estiver válido e `active`;
- o `service_scope` do vínculo deverá corresponder ao módulo;
- o Parceiro deverá possuir acesso comercial global ao módulo conforme plano/permissão futura;
- a leitura futura pelo Parceiro deverá respeitar o vínculo que originou o dado e seu período de validade;
- encerramento ou suspensão não transfere ownership automaticamente para outro Parceiro;
- o Cliente continua acessando os próprios dados conforme as policies do módulo;
- o Super Admin acessa somente por policies administrativas explícitas.

O desenho exato para leitura após encerramento, retenção histórica e auditoria permanece pendente para a fase dos módulos clínicos.

## 13. Rascunho SQL de RLS ilustrativo

O bloco abaixo é conceitual e incompleto. Ele demonstra a direção das policies, não substitui a revisão da migration oficial.

```sql
-- RASCUNHO ILUSTRATIVO — NÃO EXECUTAR

alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.patients enable row level security;
alter table public.partners enable row level security;
alter table public.partner_clients enable row level security;

-- Exemplo simples que não recorre em profiles:
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

-- Policies administrativas e de ownership dependerão de helpers
-- SECURITY DEFINER revisados e testados.

create policy patients_select_own
on public.patients
for select
to authenticated
using (
  profile_id = public.current_profile_id()
  and public.current_profile_role() = 'cliente'
  and public.current_profile_is_active()
);

create policy admins_select_own
on public.admins
for select
to authenticated
using (
  profile_id = public.current_profile_id()
  and public.current_profile_role() = 'admin'
  and public.current_profile_is_active()
);

create policy patients_select_linked_partner
on public.patients
for select
to authenticated
using (
  public.current_profile_role() = 'parceiro'
  and public.current_profile_is_active()
  and public.current_partner_can_access_patient(id, null)
);

create policy partners_select_own
on public.partners
for select
to authenticated
using (
  profile_id = public.current_profile_id()
  and public.current_profile_role() = 'parceiro'
  and public.current_profile_is_active()
);
```

No exemplo acima, `null` representa a consulta de existência de qualquer escopo ativo. Policies de módulos futuros deverão informar o escopo concreto, sem usar `null`.

As policies de Admin devem ser explícitas por operação. Não criar uma policy genérica antes de validar os helpers e a superfície administrativa.

## 14. Função de `updated_at`

Proposta para a migration oficial:

```sql
-- RASCUNHO ILUSTRATIVO — NÃO EXECUTAR

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

Criar um trigger `before update` para cada uma das cinco tabelas.

A função não deve ser exposta como operação RPC.

## 15. Seeds mínimos de desenvolvimento

Seeds são exclusivamente para ambiente local/desenvolvimento.

Nunca incluir:

- senhas reais;
- e-mails reais;
- CPF real;
- service role key;
- dados clínicos reais.

### 15.1 Registros necessários

1. um usuário Auth de Admin;
2. `profiles` correspondente com:
   - role `admin`;
   - status `active`;
3. um registro `admins`;
4. um usuário Auth de Parceiro;
5. `profiles` correspondente com:
   - role `parceiro`;
   - status `active`;
6. um registro `partners` com `professional_type`;
7. um usuário Auth de Cliente;
8. `profiles` correspondente com:
   - role `cliente`;
   - status `active`;
9. um registro `patients`;
10. um vínculo `partner_clients` com `service_scope = 'dieta'` e status `active`.

### 15.2 Estratégia recomendada

Usuários Auth não devem ser inseridos manualmente por SQL de aplicação.

Fluxo recomendado para desenvolvimento:

1. ferramenta de seed local ou script administrativo cria os três usuários via Supabase Auth;
2. o processo captura os `user_id`;
3. insere os três profiles;
4. insere Admin, Partner e Patient;
5. cria o vínculo com escopo;
6. executa assertions de integridade e RLS.

Identidades fictícias sugeridas:

| Perfil | E-mail fictício |
| --- | --- |
| Admin | `admin@example.invalid` |
| Parceiro | `parceiro@example.invalid` |
| Cliente | `cliente@example.invalid` |

As credenciais devem ser injetadas pelo ambiente local e nunca versionadas.

### 15.3 Validações dos seeds

- exatamente um profile por usuário Auth;
- role correto em cada profile;
- status `active`;
- exatamente um Admin para o profile Admin;
- exatamente um Partner para o profile Parceiro;
- exatamente um Patient para o profile Cliente;
- nenhuma extensão incompatível por profile;
- vínculo ativo entre o Partner e o Patient no escopo `dieta`;
- Cliente não lê outro Cliente;
- Parceiro não lê Cliente sem vínculo;
- alterar o `professional_type` do Parceiro não altera nem invalida seus vínculos por escopo;
- Admin acessa somente conforme policies explícitas.

## 16. Módulos e rotas futuras por perfil

Estas rotas são alvo de produto e não são criadas por este draft.

### Cliente

Módulos:

- dietas;
- treinos;
- saúde;
- evolução;
- formulários autenticados.

Rotas sugeridas:

- `/cliente/inicio`;
- `/cliente/dietas`;
- `/cliente/treinos`;
- `/cliente/saude`;
- `/cliente/evolucao`;
- `/cliente/formularios`.

### Parceiro

Módulos:

- dashboard;
- Clientes;
- dietas;
- treinos;
- anamnese;
- agenda;
- materiais;
- prescrições;
- exames;
- formulários;
- cardio;
- planos;
- financeiro;
- avaliações;
- fotos/evolução.

O acesso global a esses módulos será controlado futuramente pelo plano/permissão comercial da assinatura. Para operar dados de um Cliente específico, o Parceiro também deverá possuir vínculo `active` no `service_scope` correspondente.

Mapeamento inicial de escopo por domínio:

- `dieta`: dietas e dados relacionados;
- `treino`: treinos e dados relacionados;
- `saude`: saúde, exames, prescrições e demais dados de saúde;
- `cardio`: dados e rotinas de cardio.

Esse mapeamento não depende de `professional_type`.

Rotas sugeridas:

- `/parceiros/dashboard`;
- `/parceiros/clientes`;
- `/parceiros/dietas`;
- `/parceiros/treinos`;
- `/parceiros/anamnese`;
- `/parceiros/agenda`;
- `/parceiros/materiais`;
- `/parceiros/prescricoes`;
- `/parceiros/exames`;
- `/parceiros/formularios`;
- `/parceiros/cardio`;
- `/parceiros/planos`;
- `/parceiros/financeiro`;
- `/parceiros/avaliacoes`;
- `/parceiros/evolucao-fotos`.

### Admin / Super Admin

Módulos:

- dashboard;
- gestão de profissionais;
- gestão de Clientes/Pacientes;
- planos;
- financeiro.

Rotas sugeridas:

- `/admin/dashboard`;
- `/admin/profissionais`;
- `/admin/pacientes`;
- `/admin/planos`;
- `/admin/financeiro`.

## 17. Tabelas e módulos deixados para fases futuras

### Formulários autenticados

- templates;
- perguntas;
- assignments;
- respostas;
- autoria do Parceiro;
- ownership do Cliente;
- ownership por `partner_client_id`, escopo e período válido;
- status de preenchimento;
- nenhuma rota pública por token como destino final.

### Dietas

- planos;
- refeições;
- alimentos;
- liberação para Cliente;
- autoria e ownership por Parceiro;
- vínculo e escopo de origem.

### Treinos

- programas;
- dias;
- exercícios;
- histórico e liberação;
- vínculo e escopo de origem.

### Exames

- exames;
- resultados;
- documentos protegidos;
- escopo de leitura/escrita;
- vínculo e período de criação.

### Prescrições

- autoria;
- arquivos;
- histórico;
- regras clínicas;
- vínculo e período de criação.

### Storage protegido

Somente política declarada nesta fase:

- dados clínicos não podem usar bucket público;
- nenhuma estrutura de bucket ou policy será desenhada neste draft;
- desenho de buckets, paths, signed URLs e policies fica para fase futura.

### Edge Functions revisadas

- criação idempotente de Cliente;
- criação/aprovação de Parceiro;
- criação restrita de Admin;
- sincronização de e-mail;
- alteração de role/status;
- auditoria de operações privilegiadas;
- validação obrigatória do chamador;
- nenhuma confiança autorizativa em `user_metadata.role`.

## 18. Trilha futura de implementação

1. revisar e aprovar este draft;
2. criar a migration oficial somente com `profiles`, `admins`, `patients`, `partners` e `partner_clients`;
3. criar testes SQL de constraints, triggers e RLS;
4. validar a migration em Supabase local/temporário vazio;
5. criar o fluxo privilegiado e idempotente de provisionamento de Admin, Parceiro e Cliente;
6. implementar login único futuro em `/login`, consultando `profiles` como fonte canônica;
7. implementar guards/middleware por role e status;
8. migrar os módulos por perfil em fases;
9. desenhar planos/permissões comerciais para controlar a disponibilidade global dos módulos;
10. em cada módulo, implementar ownership por vínculo, escopo e período;
11. desenhar Storage protegido e revisar Edge Functions antes de dados clínicos reais.

## 19. Critérios para transformar o draft em migration oficial

Antes de criar qualquer `.sql`:

1. confirmar novo projeto Supabase ou reset limpo do atual;
2. confirmar a cardinalidade N:N controlada por `service_scope`;
3. confirmar ausência de parceiro principal e de `is_primary`;
4. confirmar `profiles.email` como cópia sincronizada e unique;
5. aprovar `ON DELETE RESTRICT`;
6. aprovar ausência inicial de `deleted_at`;
7. aprovar vocabulário de status em `partner_clients`;
8. aprovar separadamente os tipos profissionais cadastrais e os escopos iniciais de vínculo;
9. revisar a unicidade parcial de Cliente + escopo ativo;
10. definir quem provisiona Admin, Parceiro e Cliente;
11. definir quem cria/suspende/desativa vínculos;
12. revisar triggers de integridade de role e confirmar ausência de validação entre `professional_type` e `service_scope`;
13. revisar helpers `security definer`;
14. escrever testes SQL de constraints e RLS antes da aplicação;
15. testar migration em Supabase local/temporário vazio;
16. testar rollback conceitual;
17. confirmar que nenhum `.env` ou secret entra no versionamento;
18. revisar o SQL final linha por linha;
19. registrar nome, timestamp e escopo da migration;
20. confirmar que `migration (1).sql` não foi copiado;
21. confirmar que nenhuma tabela de módulo futuro entrou por conveniência;
22. obter aprovação explícita antes de aplicar.

## 20. Validações obrigatórias da migration futura

### Estrutura

- cinco tabelas criadas;
- todas com `created_at` e `updated_at`;
- nenhum `patients.user_id`;
- `admins.profile_id` 1:1 com profile Admin;
- `partners.professional_type` com valores oficiais;
- `partner_clients.service_scope` com valores oficiais;
- nenhum `is_primary`;
- role/status usando text + check;
- FKs válidas;
- índices presentes;
- unicidade ativa por `(patient_id, service_scope)`;
- nenhuma unicidade isolada que imponha 1:N em `partner_clients`.

### Integridade

- role inválida é rejeitada;
- status inválido é rejeitado;
- profile duplicado por Auth é rejeitado;
- e-mail duplicado ignorando caixa é rejeitado;
- Patient só aceita profile Cliente;
- Partner só aceita profile Parceiro;
- Admin só aceita profile Admin;
- extensões incompatíveis são rejeitadas;
- vínculo duplicado aberto da mesma combinação Parceiro–Cliente–Escopo é rejeitado;
- dois vínculos ativos para o mesmo Cliente e escopo são rejeitados;
- múltiplos parceiros diferentes podem vincular o mesmo Cliente em escopos diferentes;
- um Parceiro pode vincular múltiplos Clientes;
- qualquer `professional_type` aceita qualquer um dos quatro escopos iniciais;
- alterar `professional_type` não altera os vínculos existentes;
- nenhuma trigger ou função cruza `professional_type` com `service_scope`.

### RLS

- anônimo não lê nenhuma das cinco tabelas;
- usuário sem profile não acessa dados;
- profile não ativo não acessa área autenticada;
- Cliente lê apenas o próprio Patient;
- Parceiro lê apenas Patients com vínculo ativo;
- operações em módulos sensíveis exigem o `service_scope` correspondente;
- vínculo pending/suspended/disabled não concede acesso clínico;
- dados de módulos futuros respeitam vínculo, autoria, escopo e período;
- Admin ativo segue somente policies administrativas explícitas;
- writes não autorizados são negados;
- service role não invalida constraints de domínio.

### Seeds

- seeds usam somente dados fictícios;
- nenhum secret é versionado;
- três roles representadas;
- extensão `admins` representada;
- vínculo N:N por escopo validado sem restrição 1:N acidental.

## 21. Conflitos com documentos anteriores

### `AGENTS.md`

Ainda descreve a base atual e a migração gradual sobre o Supabase legado. Está desatualizado diante da decisão formal de reconstrução controlada.

### `docs/modelo-canonico-perfis-permissoes.md`

Conflitos superados:

- propõe manter `patients.user_id` como ponte de transição;
- trata `patients.profile_id` como decisão futura;
- aceita enum ou texto controlado;
- não fecha cardinalidade de `partner_clients`.

Neste draft:

- `patients.user_id` não existe;
- `patients.profile_id` nasce obrigatório;
- role/status usam exclusivamente text + check;
- N:N é controlado por `service_scope`, conforme decisão humana da Fase 5.1.

### `docs/especificacao-migrations-perfis-backfill.md`

Conflitos superados:

- orienta relatório e backfill;
- mantém compatibilidade com usuários existentes;
- considera `patients.profile_id` etapa posterior;
- propõe `is_primary`;
- propõe migrar usuários Auth atuais.

Neste draft:

- nenhum backfill;
- nenhum usuário/dado legado;
- `patients.profile_id` nasce na primeira migration;
- `is_primary` fica fora;
- base começa vazia.

### `docs/auditoria-sql-lovable-perfis.md`

O veredito de não aplicar `migration (1).sql` continua válido.

Trechos que sugerem backfill, enum ou preservação de `patients.user_id` ficam superados pela decisão de reset.

### `docs/plano-reset-controlado-base-next-supabase.md`

É o documento mais alinhado ao novo caminho, mas ainda deixava pendentes:

- `patients.profile_id`;
- permanência de `patients.user_id`;
- `ON DELETE`;
- `is_primary`;
- detalhes de RLS e soft delete.

Este draft propõe respostas técnicas explícitas, sujeitas aos critérios de aprovação da seção 19.

## 22. Decisões ainda pendentes

- fluxo técnico exato para Parceiro provisionar Auth + profile + Patient + vínculo de forma transacional/idempotente;
- máquina de estados e permissões para suspensão, encerramento e histórico de `partner_clients`;
- política de leitura histórica do Parceiro depois do encerramento de um vínculo;
- formato, jurisdição e unicidade dos registros profissionais;
- modelo de planos, assinaturas e permissões comerciais por módulo;
- interação futura entre suspensão/inadimplência do plano e acesso global aos módulos;
- sincronização de e-mail entre Auth e `profiles`;
- retenção, exclusão e eventual adoção de `deleted_at`;
- desenho de ownership de cada módulo futuro;
- desenho de buckets e policies de Storage protegido;
- auditoria detalhada e MFA para o Super Admin;
- se CPF continuará existindo como dado cadastral e se terá qualquer papel futuro no login.

## 23. Limitações

- Nenhum SQL foi executado.
- Nenhuma migration oficial foi criada.
- O novo projeto Supabase ainda não foi criado ou inspecionado.
- A disponibilidade/configuração de extensões no projeto novo não foi validada.
- Os helpers e triggers de RLS não foram implementados nem testados.
- A sincronização de e-mail entre Auth e `profiles` ainda não possui fluxo definido.
- Regras detalhadas de criação, suspensão, desativação e leitura histórica dos vínculos não estão definidas.
- A cardinalidade N:N por escopo foi definida, mas sua implementação ainda não foi testada em banco.
- Não foi definida uma política legal/operacional de retenção e exclusão; por isso `deleted_at` ficou fora.
- Não foi definido se CPF continuará sendo credencial de login.
- Não foram definidos conselho, formato ou unicidade do registro profissional.
- Storage protegido é apenas política declarada; buckets e policies não foram desenhados.
- Seeds Auth dependem de ferramenta/script futuro, ainda inexistente.
- `AGENTS.md` e documentos antigos não foram atualizados porque o escopo permite somente este arquivo.

## 24. Riscos

| Risco | Impacto | Mitigação antes da migration |
| --- | --- | --- |
| Unicidade parcial de Cliente + escopo ser implementada incorretamente | dois Parceiros ativos no mesmo escopo | testes concorrentes e revisão do índice parcial |
| Confundir `professional_type` com autorização | bloqueio indevido de módulos ou escopos | manter classificação cadastral separada de plano e vínculo |
| Plano comercial e vínculo por escopo serem tratados como a mesma permissão | acesso global ou por Cliente incorreto | modelar e testar as duas camadas separadamente |
| Duplicação de e-mail entre Auth e `profiles` | divergência de identidade | fluxo transacional/idempotente de sincronização |
| Helpers `security definer` incorretos | elevação de privilégio | revisão de segurança e testes SQL |
| `ON DELETE RESTRICT` dificultar remoção Auth | operação administrativa bloqueada | fluxo de desativação e teste em ambiente limpo |
| Sem soft delete | risco em exclusão administrativa futura | negar DELETE e definir retenção antes de produção |
| Status duplicado em vínculo | transições inconsistentes | máquina de estados e operações confiáveis futuras |
| CPF armazenado sem política específica | exposição de dado pessoal | RLS, minimização e revisão de necessidade |
| Triggers de role ausentes/incorretos | extensão ligada ao role errado | constraints por trigger e testes |
| Admin global excessivamente amplo | impacto sistêmico | policies por operação, MFA/auditoria futuros |
| Ownership temporal insuficiente nos módulos | Parceiro acessar dados fora do vínculo válido | `partner_client_id`, `patient_id`, `partner_id`, `service_scope`, autoria, timestamps e RLS por módulo |
| Provisionamento de Cliente parcialmente concluído | Auth/profile/Patient/vínculo inconsistentes | operação confiável, idempotente e compensável |
| Reintrodução de módulos legados cedo demais | primeira migration inflada e insegura | manter escopo estrito de cinco tabelas |
| Uso acidental de `migration (1).sql` | recriação do legado permissivo | revisão do diff e proibição documental |
| Storage clínico público | exposição de arquivos | não criar bucket até desenho protegido |

## 25. Critério de aceite deste draft

O draft está pronto para revisão humana quando:

- define as cinco tabelas iniciais;
- inclui `admins` como extensão própria do Super Admin;
- exclui `patients.user_id`;
- liga Patient e Partner diretamente a `profiles`;
- inclui `partners.professional_type` e registros profissionais opcionais;
- inclui `partner_clients.service_scope`;
- exclui `is_primary`;
- impede documentalmente dois vínculos ativos para o mesmo Cliente e escopo;
- documenta `professional_type` como classificação cadastral/comercial sem efeito autorizativo no MVP;
- separa `professional_type`, `service_scope` e plano/permissão comercial;
- não propõe trigger ou função que limite escopo por tipo profissional;
- documenta módulos e rotas futuras por perfil;
- usa text + check para role/status;
- documenta N:N por escopo sem impor 1:N;
- explicita ausência inicial de soft delete;
- propõe FKs, índices, unicidade e RLS;
- limita seeds a dados fictícios;
- separa módulos futuros;
- não cria ou aplica nenhum arquivo SQL.
