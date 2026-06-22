# Auditoria do SQL Lovable para perfis, permissões e ownership

Data de referência: 20 de junho de 2026.

Status: auditoria documental da Fase 4.4, sem aplicação de migration.

Arquivo auditado: `migration (1).sql`.

Este documento compara o SQL gerado anteriormente pelo Lovable com o modelo canônico aprovado em `docs/modelo-canonico-perfis-permissoes.md` e com os contratos puros da Fase 4.2 em `src/lib/auth/identity-contracts.ts`.

Nenhuma migration foi aplicada. Nenhum banco, RLS, policy, Edge Function, rota, login, middleware, guard ou runtime foi alterado.

## 1. Veredito executivo

O SQL `migration (1).sql` **não deve ser aplicado como migration de perfis**.

Ele pode ser aproveitado parcialmente como inventário consolidado do schema legado atual, mas não está alinhado ao modelo canônico aprovado para identidade, perfis, Parceiro, vínculo Parceiro–Cliente e RLS.

Principais motivos:

- não cria `profiles`;
- não cria `partners`;
- não cria vínculo Parceiro–Cliente;
- não usa roles oficiais `cliente`, `parceiro`, `admin`;
- não cria status de conta;
- não referencia `auth.users.id` a partir de `profiles`;
- preserva `patients.user_id`, mas sem constraint para `auth.users`;
- mantém `form_assignments.access_token` e policies públicas para formulários;
- cria muitas policies amplas com `USING (true)` e `WITH CHECK (true)`;
- não diferencia Admin real de Parceiro;
- não possui backfill de usuários existentes;
- por ser uma migration completa com `CREATE TABLE`, tende a falhar ou colidir em um banco que já possui essas tabelas.

Recomendação: **descartar como migration executável para a Fase 4.x e reescrever uma sequência incremental de migrations futuras**, começando por `profiles`, depois `partners`, depois vínculo Parceiro–Cliente, e só então RLS.

## 2. Fontes comparadas

- `AGENTS.md`;
- `docs/modelo-canonico-perfis-permissoes.md`;
- `docs/estrategia-autenticacao-perfis-next.md`;
- `src/lib/auth/identity-contracts.ts`;
- `src/integrations/supabase/types.ts`;
- `supabase/migrations/**`;
- `supabase/functions/**`;
- `migration (1).sql`.

## 3. Respostas às perguntas da auditoria

| Pergunta | Resposta |
| --- | --- |
| O SQL está alinhado com roles oficiais `cliente`, `parceiro`, `admin`? | Não. O SQL não modela roles oficiais. |
| Usa nomes antigos ou termos em inglês incompatíveis? | Usa fortemente `patients`/`patient_id`, coerente com legado técnico, mas não introduz a nomenclatura canônica de perfis. Não usa `cliente` ou `parceiro`. |
| Existe tabela `profiles`? | Não. |
| `profiles` referencia `auth.users.id`? | Não se aplica, pois `profiles` não existe. |
| Existe status de conta? | Não. |
| Existe tabela de Parceiro própria? | Não. |
| Parceiro está ligado a `profiles`? | Não. |
| Existe vínculo Parceiro–Cliente? | Não. |
| O vínculo protege ownership? | Não há vínculo; ownership não é modelado. |
| Preserva compatibilidade com `patients.user_id`? | Parcialmente. A coluna existe, mas sem constraint para `auth.users.id`. |
| Altera ou quebra tabelas existentes? | Sim, se aplicado em banco existente: usa `CREATE TABLE` sem `IF NOT EXISTS` para tabelas que já existem. |
| Cria policies amplas ou inseguras? | Sim. Há várias policies com `public`, `USING (true)` e `WITH CHECK (true)`. |
| Trata `/form/:token` como fluxo público definitivo? | Não menciona rota, mas reforça o modelo público por token via `form_assignments.access_token` e policies públicas em `form_*`. |
| Diferencia Admin real de Parceiro? | Não. |
| Há backfill de usuários existentes? | Não. |
| Há risco de transformar admins legados em Super Admin automaticamente? | O SQL não faz backfill nem roles, então não transforma diretamente; porém também não previne esse risco. |
| O que pode ser aproveitado? | Inventário de tabelas legadas, lista de colunas, alguns índices e mapa de FKs como referência. |
| O que deve ser descartado? | A migration completa como executável, policies permissivas e qualquer tentativa de usá-la como base de auth/perfis. |
| O que precisa ser reescrito? | Toda a parte de identidade, perfis, parceiros, vínculo, ownership, backfill e RLS. |

## 4. Pontos compatíveis com o modelo canônico

Poucos pontos são compatíveis diretamente:

1. `patients.user_id` existe.
   - Isso preserva a ponte legada entre Cliente/Paciente e Supabase Auth.
   - Ainda falta ligar isso a `profiles.user_id` e, possivelmente no futuro, a `patients.profile_id`.

2. A tabela `patients` contém os dados atuais do paciente/cliente.
   - Isso conversa com a decisão de manter `patients` como tabela de dados clínicos/cadastrais.

3. O SQL lista tabelas clínicas com `patient_id`.
   - Isso ajuda a mapear ownership futuro por Cliente.

4. O bloco de Foreign Keys recomendadas é útil como referência.
   - Ele não deve ser aplicado sem validação dos dados existentes.
   - Pode orientar a fase futura de integridade referencial.

5. O SQL reconhece, em comentário, que as policies são permissivas.
   - Isso não resolve o problema, mas confirma o risco já identificado.

## 5. Pontos incompatíveis

### 5.1 Identidade e perfis

O SQL não cria:

- `profiles`;
- role canônico;
- status de conta;
- relação 1:1 entre `profiles.user_id` e `auth.users.id`;
- espelhamento futuro para `app_metadata`;
- tratamento de `user_metadata` como legado.

Isso o torna incompatível com a Fase 4.2 e com o modelo canônico da Fase 4.3.

### 5.2 Parceiro

O SQL não cria:

- `partners`;
- `partners.profile_id`;
- `professional_name`;
- `partners.status`;
- `partners.metadata`;
- qualquer entidade equivalente a profissional/parceiro.

Portanto, não separa Parceiro de Admin e não prepara a migração da operação atual de `/admin` para `/parceiros`.

### 5.3 Vínculo Parceiro–Cliente

O SQL não cria:

- `partner_clients`;
- `partner_id`;
- `patient_id` como vínculo de ownership;
- status do vínculo;
- auditoria de criação/encerramento do vínculo.

Sem isso, Parceiro não tem fronteira de acesso por carteira de clientes.

### 5.4 Admin real

O SQL não diferencia:

- Super Admin global;
- profissional/parceiro;
- usuário legado com `user_metadata.role = "admin"`.

Isso não resolve o principal risco da migração: o `/admin` atual contém muitas funções que pertencem ao futuro `/parceiros`.

### 5.5 RLS

O SQL habilita RLS, mas cria policies muito amplas.

Exemplos de risco:

- `patients` com acesso `public` e `USING (true)`;
- `diets`, `diet_meals`, `diet_meal_foods` com acesso `public`;
- `form_assignments`, `form_questions`, `form_responses`, `form_templates` com acesso `public`;
- várias tabelas clínicas com `authenticated USING (true)`;
- Storage com exemplos de leitura pública.

Isso não prepara ownership seguro. Na prática, tende a preservar ou ampliar o modelo permissivo atual.

### 5.6 Formulários e `/form/:token`

O SQL mantém:

- `form_assignments.access_token`;
- policies públicas para `form_assignments`;
- policies públicas para `form_responses`;
- policies públicas para `form_templates` e `form_questions`.

Embora o SQL não crie rotas, ele fortalece o desenho de formulário público por token. Isso conflita com a decisão de produto: `/form/:token` é legado/provisório, e o futuro correto deve ser autenticado dentro da área Cliente.

### 5.7 Aplicação em banco existente

O arquivo é uma migration completa com `CREATE TABLE public.*`.

Riscos:

- falha por `relation already exists`;
- divergência com migrations versionadas atuais;
- impossibilidade de aplicar incrementalmente sem reescrita;
- risco de recriar estrutura sem backfill;
- risco de mascarar a história real das migrations já aplicadas.

## 6. Riscos se fosse aplicado agora

| Risco | Severidade | Motivo |
| --- | --- | --- |
| Falha imediata por tabelas existentes | Alta | O projeto já possui migrations e tabelas correspondentes. |
| Manutenção de RLS inseguro | Alta | Muitas policies usam `public`, `USING (true)`, `WITH CHECK (true)`. |
| Ausência de `profiles` | Alta | Não cria a fonte canônica aprovada. |
| Ausência de `partners` | Alta | Não separa Parceiro de Admin. |
| Ausência de vínculo Parceiro–Cliente | Alta | Não há ownership por carteira. |
| Formulários públicos continuarem como destino final | Alta | `access_token` e policies públicas reforçam o legado. |
| Admin legado continuar ambíguo | Alta | Não há backfill nem classificação manual. |
| Quebra de integridade ou duplicidade | Média/Alta | Arquivo completo não é incremental. |
| Storage público sem ownership | Média/Alta | Exemplos permissivos de buckets. |
| Incompatibilidade com contratos da Fase 4.2 | Média | Não usa roles oficiais em português. |

## 7. O que pode ser reaproveitado

Reaproveitar apenas como referência, não como migration pronta:

- inventário de tabelas clínicas e operacionais atuais;
- lista de colunas de `patients`;
- lista de tabelas relacionadas por `patient_id`;
- índice `idx_body_measurements_patient`;
- bloco comentado de Foreign Keys como mapa preliminar;
- reconhecimento explícito de que as policies são permissivas;
- confirmação de que o schema legado gira em torno de `patients` e `patient_id`.

## 8. O que deve ser descartado

Descartar como base executável:

- arquivo completo `migration (1).sql` como migration única;
- `CREATE TABLE` das tabelas já existentes;
- policies públicas/permissivas;
- qualquer abordagem que mantenha `form_*` público como destino final;
- qualquer inferência de que o schema atual resolve perfis;
- qualquer uso do SQL como solução para RLS;
- exemplos permissivos de Storage.

## 9. O que precisa ser reescrito

Reescrever em migrations incrementais e rastreáveis:

1. tipos/enums/constraints de `role` e `status`;
2. tabela `profiles`;
3. tabela `partners`;
4. vínculo `partner_clients`;
5. backfill de `profiles` a partir de `patients.user_id` e usuários Auth;
6. classificação manual ou assistida de usuários legados `admin`;
7. RLS por ownership;
8. revisão de `form_assignments` para fluxo autenticado futuro;
9. revisão de Storage por ownership;
10. revisão de Edge Functions.

## 10. Proposta de sequência futura de migrations

Esta sequência é proposta, não implementada.

### Migration 1 — enums/constraints e `profiles`

Objetivo:

- criar fonte canônica de identidade.

Conteúdo esperado:

- enum ou constraint para roles: `cliente`, `parceiro`, `admin`;
- enum ou constraint para status: `pending`, `active`, `suspended`, `disabled`;
- tabela `profiles`;
- `profiles.user_id` único e referenciando `auth.users.id`;
- timestamps;
- índices mínimos;
- RLS inicial restritiva, se a fase incluir segurança.

Observação: se a fase for apenas estrutural, criar RLS bloqueante por padrão e liberar em fase dedicada.

### Migration 2 — backfill inicial de `profiles`

Objetivo:

- criar perfis para usuários existentes.

Conteúdo esperado:

- mapear `patients.user_id` para `profiles.role = 'cliente'`;
- marcar status inicial como `active` ou `pending`, conforme decisão aprovada;
- não migrar automaticamente `user_metadata.role = 'admin'` para Super Admin;
- gerar relatório/consulta de usuários sem classificação confiável.

### Migration 3 — `partners`

Objetivo:

- criar entidade profissional separada de Admin.

Conteúdo esperado:

- tabela `partners`;
- `partners.profile_id` referenciando `profiles.id`;
- `professional_name`;
- `status`;
- `metadata`;
- constraints para impedir parceiro sem profile válido, se viável;
- nenhum reaproveitamento automático de todo `admin` legado.

### Migration 4 — vínculo Parceiro–Cliente

Objetivo:

- modelar ownership operacional.

Conteúdo esperado:

- tabela `partner_clients`;
- `partner_id` referenciando `partners.id`;
- `patient_id` referenciando `patients.id`;
- `status`;
- auditoria básica;
- índice por `partner_id`;
- índice por `patient_id`;
- unicidade para evitar vínculo ativo duplicado, se aprovado.

### Migration 5 — RLS por ownership

Objetivo:

- substituir permissões amplas.

Conteúdo esperado:

- policies para Cliente acessar apenas dados próprios;
- policies para Parceiro acessar apenas clientes vinculados;
- policies para Admin real acessar operações aprovadas;
- testes SQL de autorização;
- remoção ou substituição gradual de policies `USING (true)`;
- revisão de tabelas clínicas, materiais, fotos, formulários e Storage.

### Migration 6 — formulários autenticados

Objetivo:

- redesenhar `/form/:token` como legado e preparar fluxo autenticado.

Conteúdo esperado:

- decidir rota autenticada de formulários dentro de `/cliente`;
- restringir `form_assignments` por ownership;
- restringir `form_responses` ao cliente dono e parceiro vinculado;
- decidir destino do `access_token`: manter temporariamente, migrar, expirar ou remover em fase própria.

### Migration 7 — revisão de Edge Functions

Objetivo:

- alinhar criação/alteração de usuários ao modelo canônico.

Conteúdo esperado:

- `create-patient` passa a criar/atualizar `profiles` e `patients`;
- futura criação de parceiro cria/atualiza `profiles` e `partners`;
- criação de Admin fica restrita a Super Admin autorizado;
- `user_metadata` deixa de ser fonte canônica;
- eventual espelhamento em `app_metadata` é controlado.

## 11. Decisões pendentes

- Usar enum SQL ou `text` com `check constraint` para role/status?
- `profiles.status` inicial será `active` ou `pending` para usuários migrados?
- `partners.status` reutiliza os mesmos status de conta ou terá enum próprio?
- Nome final do vínculo será `partner_clients`?
- Um cliente pode ter múltiplos parceiros ativos?
- Quem cria vínculo: Admin, Parceiro, convite aceito pelo Cliente ou combinação?
- `patients.profile_id` será adicionado ou a ponte continuará por `user_id`?
- Como classificar usuários legados com `user_metadata.role = "admin"`?
- Qual será o primeiro conjunto de policies RLS a endurecer?
- O que acontece com `form_assignments.access_token` no fluxo futuro?
- Storage `patient-photos` e `materials` continuará público ou passará a ser protegido?

## 12. Recomendação final

Não aplicar `migration (1).sql`.

Usar o arquivo apenas como referência histórica/inventário do schema legado. A próxima fase deve criar uma especificação de migration incremental para `profiles`, com backfill e riscos, ainda sem aplicar no banco. Depois disso, especificar `partners`, `partner_clients` e só então RLS.

O caminho seguro é:

1. especificar `profiles`;
2. especificar backfill;
3. especificar `partners`;
4. especificar `partner_clients`;
5. desenhar RLS com testes;
6. revisar Edge Functions;
7. só então conectar Supabase Next e login `/login`.

## 13. O que não foi implementado

- Nenhuma migration foi criada.
- Nenhuma migration foi aplicada.
- Nenhum banco foi alterado.
- Nenhuma policy foi alterada.
- Nenhuma Edge Function foi alterada.
- Nenhum arquivo de runtime foi alterado.
- Nenhuma rota foi criada.
- Nenhum guard ou middleware foi criado.
- Nenhuma dependência foi instalada.

## 14. Validação documental

Validação executada:

- leitura do SQL completo `migration (1).sql`;
- comparação contra `docs/modelo-canonico-perfis-permissoes.md`;
- comparação contra `src/lib/auth/identity-contracts.ts`;
- comparação contra `src/integrations/supabase/types.ts`;
- busca por `profiles`, `partners`, `partner_clients`, roles, policies amplas, `access_token` e referências de auth;
- revisão de que a entrega é documental.

Não foi executado build/test/lint porque não houve alteração de código de runtime.
