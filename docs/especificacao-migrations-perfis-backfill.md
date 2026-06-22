# Especificação de migrations futuras para perfis e backfill

Data de referência: 20 de junho de 2026.

Status: especificação documental da Fase 4.5, sem migration executável.

Este documento especifica uma sequência segura, incremental e revisável de migrations futuras para identidade, perfis, parceiros, vínculo Parceiro–Cliente, backfill de usuários existentes e preparação de RLS.

Nenhum SQL deste documento deve ser aplicado diretamente. Esta fase não cria migration executável, não aplica SQL, não altera banco, não altera Supabase, não altera RLS, não altera policies, não altera Edge Functions, não altera rotas, não cria guards, não cria middleware e não conecta runtime.

O arquivo `migration (1).sql` permanece apenas como inventário legado e não deve ser aplicado como migration oficial.

## 1. Decisões aprovadas

| Tema | Decisão |
| --- | --- |
| Fonte canônica futura | `profiles` |
| Tipagem inicial de role/status | `text + check constraint`, não enum SQL |
| Roles oficiais | `cliente`, `parceiro`, `admin` |
| Status oficiais | `pending`, `active`, `suspended`, `disabled` |
| Vínculo Auth | `profiles.user_id` referencia `auth.users.id` |
| `user_metadata.role` | legado/transição, não fonte canônica futura |
| Admin legado | nunca converter automaticamente em Super Admin |
| Cliente legado claro | `patients.user_id` pode indicar candidato a `cliente active` |
| Admin legado ambíguo | exigir revisão manual ou iniciar como `pending` |
| Parceiro | entidade própria ligada a `profiles` |
| Vínculo Parceiro–Cliente | permite múltiplos parceiros por cliente e suporte futuro a parceiro principal |
| `/form/:token` | legado/provisório até redesenho autenticado |
| Storage clínico futuro | protegido, não público |

## 2. Princípios de execução futura

1. Cada migration deve ser pequena, incremental e reversível conceitualmente.
2. Nenhuma etapa deve depender do SQL Lovable como executável.
3. Antes de qualquer escrita de backfill, gerar relatório de ambiguidades.
4. Usuários legados com `user_metadata.role = "admin"` não devem virar Super Admin automaticamente.
5. RLS deve ser planejado como fase crítica própria.
6. Policies permissivas atuais devem ser substituídas gradualmente, com testes.
7. O runtime Vite deve permanecer funcional durante a transição.
8. `user_metadata` deve servir apenas como pista de migração, nunca como fonte canônica final.
9. `app_metadata` pode espelhar informações futuramente, mas não substitui `profiles`.
10. Storage e formulários precisam de ownership antes de endurecimento definitivo.

## 3. Sequência proposta de migrations futuras

| Ordem | Migration futura | Objetivo |
| --- | --- | --- |
| 1 | `profiles` | Criar fonte canônica de identidade, role e status. |
| 2 | Relatório e backfill inicial de `profiles` | Mapear usuários existentes sem promover Admin legado automaticamente. |
| 3 | `partners` | Criar entidade profissional ligada a `profiles`. |
| 4 | `partner_clients` | Criar vínculo de ownership entre Parceiro e Cliente. |
| 5 | `patients.profile_id` | Avaliar e, se aprovado, ligar `patients` diretamente a `profiles`. |
| 6 | Preparação para RLS | Preparar helper functions, índices e estratégia de policies restritivas. |
| 7 | Preparação para formulários autenticados | Planejar substituição do fluxo público por token. |
| 8 | Revisão de Edge Functions | Alinhar criação/alteração de usuários ao modelo canônico. |

## 4. Migration futura 1 — `profiles`

### Objetivo

Criar a fonte canônica futura de identidade de produto, separando autorização de `user_metadata`.

### Tabelas afetadas

- Criar `public.profiles`.
- Não alterar `patients` nesta etapa.
- Não alterar `auth.users`, apenas referenciar.

### Colunas propostas

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | `uuid` | Primary key, default `gen_random_uuid()`. |
| `user_id` | `uuid` | Referência a `auth.users.id`, único e obrigatório. |
| `role` | `text` | Check constraint com `cliente`, `parceiro`, `admin`. |
| `status` | `text` | Check constraint com `pending`, `active`, `suspended`, `disabled`. |
| `display_name` | `text` | Nome exibível. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Default `now()`. |

Campos opcionais para fase posterior, não necessários na primeira migration:

- `email`;
- `phone`;
- `avatar_url`;
- `metadata`;
- `last_seen_at`.

### Constraints propostas

- Primary key em `id`.
- Foreign key `profiles.user_id -> auth.users.id`.
- Unique constraint em `user_id`.
- Check constraint para `role in ('cliente', 'parceiro', 'admin')`.
- Check constraint para `status in ('pending', 'active', 'suspended', 'disabled')`.
- `role` not null.
- `status` not null.
- `display_name` not null.

### Índices propostos

- Índice único em `user_id`.
- Índice simples em `role`.
- Índice simples em `status`.
- Índice composto opcional em `(role, status)`.

### FKs propostas

- `profiles.user_id` referencia `auth.users(id)`.

Decisão a validar na migration real:

- `ON DELETE CASCADE` remove o perfil se o usuário Auth for removido.
- `ON DELETE RESTRICT` evita exclusão acidental.

Recomendação inicial: preferir comportamento conservador e documentado, com remoções de usuários tratadas por fluxo administrativo.

### Riscos

- Usuários Auth existentes sem perfil ficarão sem autorização canônica até backfill.
- Role/status incorretos podem bloquear acesso futuro.
- `display_name` pode duplicar informação de `patients.name`, mas isso é aceitável como dado de identidade exibível.

### Pré-requisitos

- Confirmar que `gen_random_uuid()` está disponível.
- Confirmar estratégia de delete entre Auth e `profiles`.
- Confirmar se RLS será bloqueante por padrão na própria migration ou na fase de RLS.

### Validações

- Verificar que `profiles.user_id` é único.
- Inserir registros de teste em ambiente seguro com roles válidos.
- Confirmar que roles inválidos são rejeitados.
- Confirmar que status inválidos são rejeitados.
- Confirmar que não existe profile sem usuário.

### Rollback conceitual

- Se nenhuma tabela futura depender ainda de `profiles`, remover `profiles`.
- Se já houver dependências futuras, remover primeiro FKs dependentes.
- Em produção, rollback deve preservar relatório de usuários afetados antes de drop.

## 5. Migration futura 2 — relatório e backfill inicial de `profiles`

### Objetivo

Criar perfis canônicos para usuários existentes, sem promover Admin legado automaticamente.

Antes de qualquer escrita futura, esta etapa deve gerar um relatório de ambiguidades.

### Tabelas afetadas

- `profiles`;
- `patients`;
- leitura de `auth.users` via contexto administrativo/migration planejada;
- nenhuma alteração em `patients` nesta etapa.

### Relatório obrigatório antes de escrita

O relatório deve listar:

1. pacientes com `patients.user_id` preenchido;
2. pacientes sem `patients.user_id`;
3. usuários Auth com `user_metadata.role = "patient"`;
4. usuários Auth com `user_metadata.role = "admin"`;
5. usuários Auth sem role;
6. usuários Auth com role inválido/desconhecido;
7. usuários Auth com e-mail sintético `@patient.local`;
8. conflitos entre `patients.user_id` e metadata;
9. possíveis duplicidades por CPF/e-mail;
10. usuários candidatos a `cliente active`;
11. usuários que exigem revisão manual.

### Regras de backfill propostas

| Origem | Ação proposta |
| --- | --- |
| `patients.user_id` claro e válido | Criar `profiles.role = 'cliente'`. |
| `user_metadata.role = "patient"` com vínculo em `patients.user_id` | Candidato a `cliente`. |
| `user_metadata.role = "patient"` sem vínculo em `patients` | `pending` ou revisão. |
| `user_metadata.role = "admin"` | Não converter para Super Admin; revisão manual ou `pending`. |
| role ausente | `pending` ou sem profile até revisão. |
| role inválido | `pending` ou sem profile até revisão. |
| usuário sem evidência confiável | não conceder acesso autenticado. |

### Status inicial sugerido

- Clientes com vínculo claro em `patients.user_id`: candidatos a `active`.
- Admins legados: `pending` até classificação manual.
- Usuários sem role/ambíguos: `pending` ou sem profile, conforme decisão final.

### Colunas preenchidas

- `user_id`;
- `role`;
- `status`;
- `display_name`;
- `created_at`;
- `updated_at`.

### Constraints propostas

- Respeitar constraints de `profiles`.
- Não criar profile duplicado para o mesmo `user_id`.

### Índices propostos

- Usar índices já previstos em `profiles`.
- Índices temporários não devem ser necessários, salvo volume real exigir.

### FKs propostas

- Usar FK já criada em `profiles.user_id`.

### Riscos

- Usuário com metadata antiga pode ser classificado errado.
- Admin legado pode ser profissional/parceiro, Super Admin ou conta de teste.
- Pacientes sem `user_id` exigem tratamento manual.
- Backfill automático sem relatório pode conceder acesso indevido.

### Pré-requisitos

- Relatório de ambiguidades aprovado.
- Decisão sobre status inicial de cada grupo.
- Decisão sobre manter usuários ambíguos sem profile ou com profile `pending`.

### Validações

- Contar usuários Auth antes/depois.
- Contar pacientes com/sem profile.
- Confirmar zero `admin` legado convertido automaticamente para Super Admin.
- Confirmar zero profiles duplicados por `user_id`.
- Confirmar que usuários ambíguos permanecem sem acesso ativo.

### Rollback conceitual

- Marcar perfis criados por backfill com metadata/auditoria da operação futura, se aprovado.
- Remover apenas perfis criados pelo backfill, preservando perfis manuais.
- Se rollback físico for arriscado, alterar status para `disabled` ou `pending`.

## 6. Migration futura 3 — `partners`

### Objetivo

Criar a entidade própria de Parceiro, ligada a `profiles`, para separar profissional de Super Admin.

### Tabelas afetadas

- Criar `public.partners`.
- Referenciar `public.profiles`.

### Colunas propostas

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `profile_id` | `uuid` | Referência a `profiles.id`. |
| `professional_name` | `text` | Nome profissional exibido. |
| `status` | `text` | Check constraint inicial. |
| `metadata` | `jsonb` | Dados profissionais flexíveis e não autorizativos. |
| `created_at` | `timestamptz` | Auditoria. |
| `updated_at` | `timestamptz` | Auditoria. |

Campos opcionais para fase posterior:

- `document`;
- `specialty`;
- `bio`;
- `timezone`;
- `settings`.

### Constraints propostas

- Primary key em `id`.
- FK `partners.profile_id -> profiles.id`.
- Unique constraint em `profile_id`.
- `professional_name` not null.
- `status` not null.
- Check constraint inicial para status.

Status inicial possível:

- reutilizar `pending`, `active`, `suspended`, `disabled`; ou
- criar check próprio para estado operacional.

Recomendação inicial: reutilizar os status oficiais enquanto não houver necessidade real de um segundo vocabulário.

### Índices propostos

- Índice único em `profile_id`.
- Índice em `status`.

### FKs propostas

- `partners.profile_id` referencia `profiles(id)`.

### Riscos

- Criar parceiros automaticamente a partir de Admin legado pode promover usuários indevidos.
- `partners.status` pode divergir de `profiles.status` se não houver regra clara.
- Sem `partner_clients`, parceiro ainda não possui ownership operacional.

### Pré-requisitos

- `profiles` criado.
- Backfill ou criação manual de profiles para parceiros.
- Decisão de quais usuários são parceiros.
- Garantia de que Super Admin não será confundido com parceiro.

### Validações

- Todo `partner.profile_id` aponta para profile existente.
- Todo profile ligado a partner tem `role = 'parceiro'`.
- Nenhum `admin` vira partner sem decisão explícita.
- Nenhum partner ativo sem profile ativo, se essa regra for aprovada.

### Rollback conceitual

- Se ainda não houver vínculos, remover `partners`.
- Se houver vínculos futuros, remover/encerrar vínculos antes.
- Alternativa segura: alterar `partners.status` para `disabled`.

## 7. Migration futura 4 — `partner_clients`

### Objetivo

Modelar ownership operacional entre Parceiros e Clientes, permitindo múltiplos parceiros por cliente e suporte futuro a parceiro principal.

### Tabelas afetadas

- Criar `public.partner_clients`.
- Referenciar `public.partners`.
- Referenciar `public.patients`.
- Opcionalmente referenciar `public.profiles` para auditoria.

### Colunas propostas

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `partner_id` | `uuid` | Referência a `partners.id`. |
| `patient_id` | `uuid` | Referência a `patients.id`. |
| `status` | `text` | Estado do vínculo. |
| `is_primary` | `boolean` | Suporte futuro a parceiro principal. |
| `created_by_profile_id` | `uuid` | Auditoria opcional. |
| `ended_at` | `timestamptz` | Encerramento do vínculo. |
| `ended_by_profile_id` | `uuid` | Auditoria opcional. |
| `metadata` | `jsonb` | Dados operacionais não autorizativos. |
| `created_at` | `timestamptz` | Auditoria. |
| `updated_at` | `timestamptz` | Auditoria. |

### Constraints propostas

- Primary key em `id`.
- FK `partner_id -> partners.id`.
- FK `patient_id -> patients.id`.
- Check constraint para `status`.
- `is_primary` default `false`.
- Evitar vínculo ativo duplicado para mesmo `partner_id + patient_id`.
- Se aprovado, permitir apenas um parceiro principal ativo por cliente.

Status sugeridos:

- `pending`;
- `active`;
- `ended`;
- `revoked`.

### Índices propostos

- Índice em `partner_id`.
- Índice em `patient_id`.
- Índice composto em `(partner_id, patient_id)`.
- Índice composto em `(patient_id, is_primary)` filtrado por status ativo, se aprovado.
- Índice em `status`.

### FKs propostas

- `partner_clients.partner_id` referencia `partners(id)`.
- `partner_clients.patient_id` referencia `patients(id)`.
- `created_by_profile_id` referencia `profiles(id)`, se usado.
- `ended_by_profile_id` referencia `profiles(id)`, se usado.

### Riscos

- Múltiplos parceiros exigem regra clara de escopo de edição.
- Parceiro principal pode virar regra de negócio sensível.
- Encerrar vínculo não deve apagar histórico clínico.
- Vínculo ativo indevido pode expor dados.

### Pré-requisitos

- `profiles` criado.
- `partners` criado.
- Clientes existentes identificados em `patients`.
- Decisão sobre quem pode criar/remover vínculo.
- Decisão sobre parceiro principal.

### Validações

- Parceiro só acessa cliente vinculado em testes futuros de RLS.
- Vínculo duplicado ativo é rejeitado.
- Cliente pode ter múltiplos parceiros ativos, se aprovado.
- Apenas um parceiro principal ativo por cliente, se essa regra for aplicada.
- Vínculo encerrado não autoriza acesso futuro.

### Rollback conceitual

- Se não houver RLS dependente, remover tabela.
- Se houver dados, mudar vínculos para `revoked`/`ended`.
- Preservar histórico antes de qualquer drop.

## 8. Migration futura 5 — `patients.profile_id`

### Objetivo

Avaliar e, se aprovado, criar ponte direta entre `patients` e `profiles`, reduzindo dependência indireta por `patients.user_id`.

### Recomendação

`patients.profile_id` é recomendado no médio prazo, mas não precisa ser a primeira migration.

Motivo:

- `patients.user_id` já existe e referencia Auth.
- `profiles.user_id` também referencia Auth.
- Adicionar `patients.profile_id` melhora clareza e joins de RLS, mas cria risco de duplicidade se mal preenchido.

### Tabelas afetadas

- Alterar `public.patients`.
- Referenciar `public.profiles`.

### Colunas propostas

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `profile_id` | `uuid` | Referência opcional inicialmente; pode virar obrigatória depois de backfill. |

### Constraints propostas

- FK `patients.profile_id -> profiles.id`.
- Unique constraint em `profile_id`, se cada profile cliente tiver no máximo um patient.
- Check indireto ou validação futura para garantir `profiles.role = 'cliente'`.

### Índices propostos

- Índice em `profile_id`.
- Índice único em `profile_id`, se regra 1:1 for aprovada.

### FKs propostas

- `patients.profile_id` referencia `profiles(id)`.

### Riscos

- Divergência entre `patients.user_id` e `profiles.user_id`.
- Pacientes sem usuário Auth não terão profile imediato.
- Migração incorreta pode duplicar identidade.
- Obrigatoriedade cedo demais pode quebrar pacientes legados.

### Pré-requisitos

- `profiles` populado.
- Relatório de pacientes sem `user_id`.
- Decisão se cada cliente tem exatamente um registro em `patients`.

### Validações

- Para cada `patients.profile_id`, o profile existe.
- Para cada `patients.profile_id`, `profiles.role = 'cliente'`.
- `patients.user_id = profiles.user_id` quando ambos existirem.
- Não há duplicidade de `profile_id`.

### Rollback conceitual

- Remover FK e coluna se ainda não houver dependências.
- Se houver dependências de RLS, desabilitar policies dependentes antes.
- Preservar `patients.user_id` como ponte de segurança.

## 9. Migration futura 6 — preparação para RLS

### Objetivo

Preparar a substituição de policies amplas por policies baseadas em perfil e ownership.

Esta etapa ainda pode ser apenas preparatória; o endurecimento completo deve ocorrer com testes.

### Tabelas afetadas

Potencialmente:

- `profiles`;
- `partners`;
- `partner_clients`;
- `patients`;
- tabelas clínicas com `patient_id`;
- `form_assignments`;
- `form_responses`;
- Storage clínico;
- materiais.

### Elementos propostos

- Helpers SQL estáveis para resolver profile atual, se aprovado.
- Índices necessários para joins de ownership.
- Policies iniciais bloqueantes para novas tabelas.
- Planejamento de substituição das policies legadas amplas.

### Regras futuras de RLS

| Perfil | Regra |
| --- | --- |
| Cliente | vê apenas dados próprios. |
| Parceiro | vê apenas clientes vinculados via `partner_clients active`. |
| Admin | acessa globalmente conforme permissão aprovada. |
| Anônimo | não acessa dados clínicos. |
| Usuário sem profile ativo | não acessa dados autenticados. |

### `/form/:token`

`/form/:token` permanece legado/provisório até redesenho autenticado.

Enquanto existir:

- não deve orientar o modelo final;
- deve ser isolado como compatibilidade;
- deve ser revisado antes de endurecer formulários;
- não deve virar `/form/[token]` no Next como destino final.

### Storage clínico

Storage clínico futuro deve ser protegido, não público.

Pontos a revisar:

- `patient-photos`;
- materiais enviados a clientes;
- PDFs clínicos;
- qualquer arquivo associado a `patient_id`.

### Riscos

- RLS mal escrito pode bloquear o app inteiro.
- RLS permissivo demais expõe dados clínicos.
- Funções helper inseguras podem ampliar acesso.
- Storage público pode vazar material clínico.

### Pré-requisitos

- `profiles` populado.
- `partners` e `partner_clients` validados.
- Testes SQL de autorização prontos.
- Inventário de tabelas por ownership.

### Validações

- Cliente não lê outro cliente.
- Parceiro não lê cliente não vinculado.
- Parceiro lê cliente vinculado ativo.
- Vínculo encerrado não autoriza.
- Admin só passa nos casos aprovados.
- Usuário sem profile ativo não passa.
- Anônimo não acessa dados clínicos.

### Rollback conceitual

- Manter migrations de policy separadas por módulo.
- Reverter policies por tabela, não em bloco gigante.
- Manter snapshot de policies antigas para emergência, sem restaurar permissividade em produção sem aprovação.

## 10. Migration futura 7 — preparação para formulários autenticados

### Objetivo

Preparar o redesenho do fluxo de formulários para área autenticada do Cliente.

### Tabelas afetadas

- `form_assignments`;
- `form_responses`;
- `form_templates`;
- `form_questions`;
- potencialmente `partner_clients`;
- potencialmente `patients`.

### Diretrizes

- `form_assignments.access_token` permanece legado/provisório.
- O destino final não deve ser rota pública por token.
- Cliente deve preencher formulários dentro da área autenticada.
- Parceiro deve atribuir formulários apenas a clientes vinculados.
- Respostas devem pertencer ao assignment do cliente.

### Colunas possíveis futuras

Não implementar agora, mas avaliar:

- `assigned_by_partner_id`;
- `status`;
- `due_at`;
- `submitted_by_profile_id`;
- `submitted_at`;
- `legacy_access_token_expires_at`;

### Constraints propostas

- `form_assignments.patient_id` permanece obrigatório.
- FK futura para `partners` em quem atribuiu, se aprovado.
- Status controlado por check constraint.

### Índices propostos

- Índice em `patient_id`.
- Índice em `assigned_by_partner_id`, se criado.
- Índice em `status`.
- Índice em `access_token` enquanto legado existir.

### Riscos

- Remover token cedo quebra fluxo atual.
- Manter token sem limite perpetua risco público.
- RLS de formulário precisa considerar Cliente, Parceiro vinculado e Admin.

### Pré-requisitos

- Definir rota autenticada futura de formulários.
- Definir política de expiração/migração de tokens.
- Ter `partner_clients` para ownership de parceiro.
- Ter `profiles` para submitted_by/assigned_by.

### Validações

- Cliente acessa apenas seus assignments.
- Parceiro acessa apenas assignments de clientes vinculados.
- Resposta não pode ser criada para assignment de outro cliente.
- Token legado, se mantido, tem comportamento documentado.

### Rollback conceitual

- Preservar `access_token` durante transição.
- Evitar drop de colunas na primeira fase.
- Usar status/flags para desligar fluxo legado progressivamente.

## 11. Migration futura 8 — revisão de Edge Functions

### Objetivo

Alinhar criação e atualização de usuários ao modelo canônico.

### Funções afetadas

- `create-patient`;
- `create-admin`;
- futura função de criação de parceiro;
- possíveis funções administrativas futuras.

### Plano para `create-patient`

Futuro comportamento esperado:

1. validar chamador;
2. criar/atualizar usuário Auth;
3. criar/atualizar `profiles` com `role = 'cliente'`;
4. criar/atualizar `patients`;
5. sincronizar `patients.user_id`;
6. opcionalmente preencher `patients.profile_id`, se existir;
7. tratar `user_metadata.role = "patient"` apenas como legado;
8. opcionalmente espelhar em `app_metadata` conforme política aprovada.

### Plano para `create-admin`

Futuro comportamento esperado:

1. exigir chamador Super Admin;
2. criar/atualizar usuário Auth;
3. criar/atualizar `profiles` com `role = 'admin'`;
4. não usar como criação de parceiro;
5. não promover admin legado automaticamente;
6. auditar operação.

### Plano para criação futura de parceiro

Futuro comportamento esperado:

1. exigir chamador autorizado;
2. criar/atualizar usuário Auth;
3. criar/atualizar `profiles` com `role = 'parceiro'`;
4. criar/atualizar `partners`;
5. iniciar `partners.status` conforme aprovação;
6. não herdar permissões de Admin.

### Riscos

- Service role sem validação pode criar perfis privilegiados.
- `user_metadata` pode continuar divergindo de `profiles`.
- Função de Admin pode ser confundida com função de Parceiro.

### Pré-requisitos

- `profiles` criado.
- `partners` criado.
- regras de quem pode criar cada perfil aprovadas.
- estratégia de auditoria definida.

### Validações

- Chamador sem permissão não cria usuário privilegiado.
- `profiles` é criado corretamente.
- `partners` só existe para role `parceiro`.
- Admin criado não é confundido com parceiro.
- Metadata legada não é fonte final de autorização.

### Rollback conceitual

- Versionar funções por alteração pequena.
- Manter compatibilidade temporária com fluxo Vite.
- Se função nova falhar, desabilitar caminho novo e manter fluxo legado até correção aprovada.

## 12. Plano consolidado de backfill

### Etapa 0 — somente relatório

Antes de qualquer escrita futura, gerar relatório com:

- total de usuários Auth;
- total de pacientes;
- pacientes com `user_id`;
- pacientes sem `user_id`;
- usuários com `user_metadata.role = "patient"`;
- usuários com `user_metadata.role = "admin"`;
- usuários sem role;
- usuários com role desconhecido;
- usuários Auth sem patient;
- patients com user_id sem Auth correspondente;
- possíveis duplicidades por CPF/e-mail;
- e-mails sintéticos `@patient.local`;
- candidatos a `cliente active`;
- candidatos a revisão manual;
- candidatos a bloqueio/suspensão.

### Etapa 1 — clientes claros

Critério:

- `patients.user_id` preenchido;
- usuário Auth correspondente existe;
- sem conflito de role;
- dados mínimos consistentes.

Ação futura:

- criar `profile` com `role = 'cliente'`;
- status candidato: `active`;
- `display_name` a partir de `patients.name`.

### Etapa 2 — pacientes sem vínculo Auth

Critério:

- registro em `patients`;
- `user_id` ausente ou inválido.

Ação futura:

- não criar profile automaticamente;
- listar para revisão;
- decidir se cria usuário Auth, corrige vínculo ou mantém como registro clínico sem login.

### Etapa 3 — `user_metadata.role = "patient"`

Critério:

- usuário Auth com role legado `patient`.

Ação futura:

- se houver `patients.user_id` correspondente, candidato a `cliente`;
- se não houver, `pending` ou revisão manual.

### Etapa 4 — `user_metadata.role = "admin"`

Critério:

- usuário Auth com role legado `admin`.

Ação futura:

- não converter automaticamente para `admin`;
- gerar lista de revisão;
- classificar manualmente como `parceiro`, `admin` ou bloqueado;
- status inicial recomendado: `pending`, salvo confirmação explícita.

### Etapa 5 — usuários sem role ou role inválido

Critério:

- ausência de role;
- role desconhecido;
- metadata inconsistente.

Ação futura:

- negar acesso por padrão;
- profile `pending` ou ausência de profile, conforme decisão;
- revisão manual.

### Etapa 6 — verificação pós-backfill

Validações futuras:

- nenhum `user_id` duplicado em `profiles`;
- nenhum Admin legado convertido automaticamente em Super Admin;
- clientes claros têm profile;
- ambiguidades permanecem pendentes;
- contagens antes/depois batem;
- logs/relatórios preservados.

## 13. Decisões pendentes antes de executar migrations

- Confirmar `ON DELETE` entre `profiles.user_id` e `auth.users.id`.
- Confirmar status inicial de clientes claros: `active` ou `pending`.
- Confirmar se usuários ambíguos recebem profile `pending` ou ficam sem profile.
- Confirmar se `patients.profile_id` será criado e em qual momento.
- Confirmar regra de parceiro principal.
- Confirmar se múltiplos parceiros ativos por cliente são sempre permitidos ou limitados por contexto.
- Confirmar quem pode criar/remover vínculo Parceiro–Cliente.
- Confirmar política de expiração para `form_assignments.access_token`.
- Confirmar quando Storage deixará de ser público.
- Confirmar primeira leva de tabelas que receberá RLS restritivo.
- Confirmar formato dos testes SQL de autorização.
- Confirmar estratégia de auditoria para alterações de role/status/vínculo.

## 14. O que não está implementado nesta fase

- Nenhuma migration executável.
- Nenhum SQL aplicável.
- Nenhum banco alterado.
- Nenhuma policy alterada.
- Nenhuma RLS alterada.
- Nenhuma Edge Function alterada.
- Nenhum Supabase client alterado.
- Nenhum runtime alterado.
- Nenhuma rota criada.
- Nenhum guard ou middleware criado.
- Nenhum login Next criado.
- Nenhuma dependência instalada.

## 15. Critérios de aceite desta especificação

- Sequência incremental de migrations futuras está documentada.
- Backfill de usuários existentes está planejado.
- Admin legado não é convertido automaticamente em Super Admin.
- SQL Lovable permanece apenas como inventário legado.
- `text + check constraint` é a estratégia inicial documentada.
- `profiles`, `partners`, `partner_clients` e `patients.profile_id` estão especificados.
- RLS futuro está preparado, sem ser resolvido.
- Edge Functions futuras estão planejadas, sem alteração.
- `/form/:token` permanece legado/provisório.
- Storage clínico futuro deve ser protegido.
