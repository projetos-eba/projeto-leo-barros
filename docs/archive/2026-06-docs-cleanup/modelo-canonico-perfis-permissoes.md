# Modelo canônico de perfis, permissões e ownership

Data de referência: 20 de junho de 2026.

Status: proposta técnica da Fase 4.3, sem implementação de runtime.

Este documento prepara o modelo futuro de identidade, perfis, permissões e ownership para a migração gradual para Next.js. Ele não cria migrations, não altera Supabase, não muda autenticação, não cria guards, não cria middleware e não conecta nenhuma regra ao runtime atual.

## 1. Escopo desta fase

Esta fase documenta a base conceitual para:

- tabela canônica futura `profiles`;
- tabela própria futura `partners`, ligada a `profiles`;
- continuidade da tabela atual `patients`, ligada a usuários Auth por `user_id`;
- vínculo futuro Parceiro–Cliente;
- matriz inicial de permissões;
- matriz inicial de acesso por rotas;
- impactos futuros em RLS, Edge Functions, guards, middleware e Supabase no Next.js.

Fica explicitamente fora do escopo:

- criar migration;
- alterar banco;
- alterar policies/RLS;
- alterar Edge Functions;
- alterar `src/App.tsx`;
- alterar `Login.tsx`;
- alterar contratos da Fase 4.2;
- criar `/login` em runtime;
- criar `/cliente/login`, `/parceiros/login` ou `/admin/login`;
- criar Supabase Next;
- criar middleware ou guards;
- migrar `/form/:token`;
- criar `/form/[token]`.

## 2. Decisões aprovadas

| Tema | Decisão |
| --- | --- |
| Fonte canônica futura | `profiles` |
| Vínculo com Supabase Auth | `profiles.user_id` referencia `auth.users.id` |
| Roles oficiais | `cliente`, `parceiro`, `admin` |
| Estados oficiais | `pending`, `active`, `suspended`, `disabled` |
| Login Next inicial | `/login`, único e temporário |
| Logins separados | Fase futura |
| `user_metadata.role` | legado/transição, não fonte canônica |
| `app_metadata` | pode espelhar role/status futuramente, mas não é a única fonte do produto |
| Admin | Super Admin global da plataforma |
| Parceiro | profissional que acompanha clientes |
| Cliente | usuário acompanhado |
| `/form/:token` | rota Vite legada/provisória; não é alvo público do Next |

Regra de segurança central: role ausente, inválido, inativo ou não autorizado nunca pode cair em Admin.

## 3. Estado atual observado

O sistema atual ainda não possui a modelagem canônica descrita neste documento.

Evidências nos arquivos analisados:

- `profiles` não existe.
- `partners` não existe.
- vínculo Parceiro–Cliente não existe.
- Cliente/Paciente existe parcialmente por `public.patients.user_id`.
- Edge Function `create-patient` cria usuário Auth e grava `user_metadata.role = "patient"`.
- Edge Function `create-admin` cria usuário Auth e grava `user_metadata.role = "admin"`.
- Admin real ainda não existe como entidade de domínio.
- A área Vite `/admin` mistura funções de operação profissional com funções que, no alvo, pertencem a perfis diferentes.

## 4. Observação crítica sobre `/admin` atual

O `/admin` atual não deve ser interpretado como o Admin futuro completo.

Pelo sitemap e pelo mapa de rotas, grande parte das telas hoje dentro de `/admin` pertence ao futuro perfil `parceiro`, especialmente:

- dashboard operacional de carteira;
- lista de pacientes/clientes;
- detalhe de paciente/cliente;
- dietas;
- treinos;
- exames;
- prescrições;
- formulários;
- agenda;
- materiais;
- cadastros operacionais.

O Admin futuro deve representar o Super Admin global da plataforma, com responsabilidades diferentes:

- gestão de profissionais/parceiros;
- gestão administrativa de clientes;
- relatórios globais;
- financeiro da plataforma;
- auditoria;
- segurança administrativa;
- métricas executivas.

Portanto, nenhuma regra futura deve assumir que todo usuário atual que cai em `/admin` é Super Admin. Essa confusão é um dos principais riscos de autorização da migração.

## 5. Modelo canônico proposto para `profiles`

`profiles` deve ser a fonte canônica futura de identidade de produto.

Modelo mínimo proposto:

| Campo | Tipo esperado | Obrigatório | Observação |
| --- | --- | --- | --- |
| `id` | `uuid` | Sim | Identificador interno do perfil. |
| `user_id` | `uuid` | Sim | Referência a `auth.users.id`; deve ser único. |
| `role` | enum/text controlado | Sim | `cliente`, `parceiro` ou `admin`. |
| `status` | enum/text controlado | Sim | `pending`, `active`, `suspended` ou `disabled`. |
| `display_name` | text | Sim | Nome exibível comum. |
| `created_at` | timestamptz | Sim | Auditoria básica. |
| `updated_at` | timestamptz | Sim | Auditoria básica. |

Campos opcionais recomendados, a validar antes de migration:

| Campo | Justificativa |
| --- | --- |
| `email` | Facilita consultas administrativas sem depender somente de Auth Admin API. Deve ser sincronizado com cuidado. |
| `phone` | Pode ser dado comum de contato quando não pertence apenas ao paciente. |
| `avatar_url` | Identidade visual comum a todos os perfis. |
| `metadata` | JSONB para atributos não autorizativos e de baixa criticidade. Não deve substituir colunas de permissão. |
| `last_seen_at` | Útil para auditoria e engajamento. |

Regras recomendadas:

- `profiles.user_id` deve ter relação 1:1 com `auth.users.id`.
- `profiles.role` deve ser a fonte de autorização do produto.
- `profiles.status` deve bloquear acesso autenticado quando diferente de `active`.
- `user_metadata.role` deve ser tratado apenas como legado/transição.
- `app_metadata` pode espelhar role/status para otimização futura, mas não deve substituir `profiles` como fonte de produto.
- O role oficial deve permanecer em português, alinhado aos contratos da Fase 4.2: `cliente`, `parceiro`, `admin`.

## 6. Modelo proposto para Parceiro

`partners` deve ser tabela própria ligada a `profiles`, porque Parceiro possui dados profissionais e responsabilidades que não pertencem ao perfil genérico.

Modelo mínimo proposto:

| Campo | Tipo esperado | Obrigatório | Observação |
| --- | --- | --- | --- |
| `id` | `uuid` | Sim | Identificador interno do parceiro. |
| `profile_id` | `uuid` | Sim | Referência a `profiles.id`; deve apontar para role `parceiro`. |
| `professional_name` | text | Sim | Nome profissional exibido para clientes e operações. |
| `status` | enum/text controlado | Sim | Estado operacional do parceiro. Pode espelhar ou detalhar `profiles.status`. |
| `metadata` | jsonb | Não | Dados profissionais flexíveis, não autorizativos. |
| `created_at` | timestamptz | Sim | Auditoria básica. |
| `updated_at` | timestamptz | Sim | Auditoria básica. |

Campos opcionais recomendados, a validar:

| Campo | Justificativa |
| --- | --- |
| `document` | Registro profissional/documento, se o produto exigir. |
| `specialty` | Especialidade profissional. |
| `bio` | Apresentação do profissional. |
| `timezone` | Agenda e disponibilidade. |
| `settings` | Preferências operacionais do parceiro, sem permissão sensível. |

Regras recomendadas:

- Todo `partner` deve ter exatamente um `profile`.
- Um `profile` com role diferente de `parceiro` não deve possuir registro ativo em `partners`.
- A criação/ativação de parceiro deve ser ação de Admin ou fluxo aprovado.
- Parceiro não deve herdar permissões de Admin.
- Parceiro deve acessar somente clientes vinculados a ele, salvo exceções aprovadas e auditáveis.

## 7. Modelo proposto para Cliente

A tabela atual `patients` deve continuar representando os dados específicos do cliente/paciente.

Estado atual observado em `src/integrations/supabase/types.ts`:

- `patients.id`;
- `patients.user_id`;
- `patients.name`;
- `patients.cpf`;
- `patients.email`;
- `patients.phone`;
- `patients.birth_date`;
- `patients.sex`;
- `patients.objective`;
- `patients.created_at`;
- `patients.updated_at`.

Modelo futuro recomendado:

| Entidade | Responsabilidade |
| --- | --- |
| `profiles` | Identidade de produto, role e status. |
| `patients` | Dados clínicos e cadastrais específicos do cliente acompanhado. |
| `auth.users` | Credenciais e sessão Supabase Auth. |

Relações recomendadas:

- `profiles.user_id` referencia `auth.users.id`.
- `patients.user_id` deve continuar como ponte legada para `auth.users.id` durante a transição.
- Futuramente, avaliar adicionar `patients.profile_id` para ligar explicitamente `patients` a `profiles.id`.
- Durante a migração, `patients.user_id` e `profiles.user_id` devem ser conciliados para evitar duplicidade.

Regras recomendadas:

- Um Cliente ativo deve ter `profiles.role = 'cliente'`.
- Um Cliente acompanhado deve ter registro em `patients`.
- O dado clínico não deve morar em `profiles`.
- `profiles.display_name` pode ser derivado de `patients.name` na migração inicial, mas a fonte clínica permanece `patients`.
- A nomenclatura de produto nova é Cliente; a tabela `patients` pode permanecer por compatibilidade técnica até fase própria de renomeação, se algum dia for aprovada.

## 8. Vínculo Parceiro–Cliente

A relação entre Parceiro e Cliente deve ser modelada por uma tabela de atribuição futura.

Nome sugerido: `partner_clients`.

Modelo mínimo proposto:

| Campo | Tipo esperado | Obrigatório | Observação |
| --- | --- | --- | --- |
| `id` | `uuid` | Sim | Identificador do vínculo. |
| `partner_id` | `uuid` | Sim | Referência a `partners.id`. |
| `patient_id` | `uuid` | Sim | Referência a `patients.id`. |
| `status` | enum/text controlado | Sim | Estado do vínculo. |
| `created_at` | timestamptz | Sim | Auditoria básica. |
| `updated_at` | timestamptz | Sim | Auditoria básica. |

Estados iniciais sugeridos para o vínculo:

| Status | Uso |
| --- | --- |
| `active` | Parceiro pode acompanhar o cliente. |
| `pending` | Convite ou atribuição ainda não confirmada. |
| `ended` | Relação encerrada, preservando histórico. |
| `revoked` | Acesso removido administrativamente. |

Campos opcionais recomendados, a validar:

| Campo | Justificativa |
| --- | --- |
| `created_by_profile_id` | Identifica quem criou o vínculo. |
| `ended_at` | Encerramento temporal do acompanhamento. |
| `ended_by_profile_id` | Auditoria de encerramento. |
| `metadata` | Dados operacionais flexíveis sem permissão sensível. |

Regras recomendadas:

- Parceiro só acessa dados de clientes com vínculo ativo.
- Cliente acessa somente os próprios dados.
- Admin pode criar, suspender, remover ou auditar vínculos, conforme regra de produto.
- Parceiro pode solicitar vínculo ou convidar cliente se o produto permitir, mas a criação efetiva precisa de regra aprovada.
- Histórico clínico não deve ser perdido quando o vínculo é encerrado.
- Vínculo encerrado não deve autorizar novas leituras/mutações pelo parceiro.

## 9. Matriz inicial de permissões por perfil

Esta matriz é conceitual e prepara RLS/guards futuros. Ela ainda não está implementada.

| Área | Cliente | Parceiro | Admin |
| --- | --- | --- | --- |
| Próprio perfil | Ler e atualizar dados permitidos | Ler e atualizar dados profissionais permitidos | Ler e atualizar dados próprios permitidos |
| Dados clínicos próprios | Ler; escrever apenas campos permitidos | Não se aplica | Auditar quando autorizado |
| Clientes vinculados | Não se aplica | Ler e operar dados necessários ao acompanhamento | Auditar/gerir conforme escopo global |
| Clientes não vinculados | Sem acesso | Sem acesso | Acesso administrativo conforme regra aprovada |
| Dietas/treinos do cliente | Ler os próprios liberados | Criar/editar para clientes vinculados | Auditar/gerir conforme regra aprovada |
| Formulários atribuídos | Preencher os próprios dentro da área autenticada | Criar/atribuir para clientes vinculados | Auditar/gerir modelos e uso |
| Materiais | Ler os próprios/permitidos | Criar/enviar para clientes vinculados | Gerir biblioteca global se aprovado |
| Agenda | Ver compromissos próprios | Gerir agenda própria e atendimentos vinculados | Auditar/gerir operação global se aprovado |
| Profissionais/parceiros | Sem acesso | Ler/editar próprio perfil profissional | Criar, suspender e administrar parceiros |
| Financeiro da plataforma | Sem acesso | Ver dados próprios se houver | Administrar financeiro global |
| Auditoria | Sem acesso | Sem acesso ou escopo próprio limitado | Acesso administrativo global |

Princípios:

- Cliente nunca deve ler dados de outro cliente.
- Parceiro nunca deve acessar cliente sem vínculo ativo.
- Admin não deve ser fallback de erro.
- Admin deve ser Super Admin, não sinônimo de profissional.
- Toda permissão sensível deve ser reforçada por RLS, não apenas por UI ou middleware.

## 10. Matriz inicial de rotas por perfil

Esta matriz orienta guards futuros. Ela ainda não cria rotas nem redirects.

| Rota | Cliente | Parceiro | Admin | Observação |
| --- | --- | --- | --- | --- |
| `/login` | Pode acessar quando não autenticado | Pode acessar quando não autenticado | Pode acessar quando não autenticado | Login único temporário futuro. |
| `/cliente/**` | Permitido quando `active` | Negado | Negado | Perfil Cliente. |
| `/parceiros/**` | Negado | Permitido quando `active` | Negado por padrão | Admin pode ter ferramentas próprias, não deve operar como parceiro sem regra explícita. |
| `/admin/**` | Negado | Negado | Permitido quando `active` | Super Admin global. |
| `/form/:token` | Legado Vite | Legado Vite | Legado Vite | Não migrar diretamente; futuro fluxo deve ser autenticado na área Cliente. |

Regras de negação:

- role ausente: negar;
- role inválido: negar;
- status diferente de `active`: negar;
- usuário sem `profile`: negar e tratar onboarding/migração em fluxo próprio;
- erro ao resolver perfil: negar de forma segura;
- nenhum caso inválido pode redirecionar para `/admin/dashboard`.

## 11. Impactos futuros em RLS

RLS será uma fase crítica e não está resolvida aqui.

Este documento prepara as seguintes diretrizes:

- criar policies baseadas em `profiles`, `partners`, `patients` e `partner_clients`;
- substituir policies amplas com `USING (true)` e `WITH CHECK (true)`;
- proteger tabelas clínicas por ownership;
- garantir que `patients.user_id = auth.uid()` ou vínculo equivalente autorize o Cliente;
- garantir que Parceiro leia/escreva apenas clientes vinculados por `partner_clients`;
- garantir que Admin tenha políticas específicas e auditáveis;
- remover dependência autorizativa de `user_metadata`;
- tratar formulários por ownership autenticado, não por rota pública de token como destino final.

RLS deve ser a barreira definitiva. Guards, middleware e UI são camadas complementares, não substitutas.

## 12. Impactos futuros em Edge Functions

As Edge Functions atuais usam service role e criam usuários com `user_metadata`.

Fases futuras devem revisar:

- validação do chamador antes de operações administrativas;
- criação de `profiles` junto da criação de usuários;
- criação de `patients` somente quando o role for `cliente`;
- criação de `partners` somente quando o role for `parceiro`;
- criação de Admin restrita a Super Admin autorizado;
- espelhamento eventual em `app_metadata`;
- remoção gradual da dependência de `user_metadata.role`;
- logs e auditoria de criação/alteração de perfis.

Nenhuma Edge Function foi alterada nesta fase.

## 13. Impactos futuros em guards, middleware e Supabase Next

Antes de conectar o login Next real:

- criar cliente Supabase browser compatível com Next;
- criar cliente Supabase server/cookies compatível com Next;
- resolver sessão no servidor quando necessário;
- resolver `profile` canônico a partir do usuário autenticado;
- negar acesso de forma segura quando não houver profile ativo;
- proteger layouts por perfil;
- manter RLS como camada definitiva;
- implementar logout real com Supabase Auth;
- preservar Vite até equivalência aprovada.

Middleware pode ser útil como filtro inicial, mas não deve conter toda a regra de autorização.

## 14. Migração de usuários existentes

Plano futuro recomendado, sem executar agora:

1. inventariar usuários Auth existentes;
2. criar `profiles` para usuários com `patients.user_id`;
3. mapear legado `user_metadata.role = "patient"` para `profiles.role = "cliente"`;
4. mapear legado `user_metadata.role = "admin"` para decisão manual entre `parceiro` e `admin`;
5. criar registros em `partners` somente para profissionais confirmados;
6. manter Admin real restrito a Super Admin aprovado;
7. validar usuários sem role ou com role inválido;
8. suspender ou bloquear usuários sem perfil confiável;
9. somente depois considerar espelhamento em `app_metadata`.

Ponto crítico: usuários legados com role `admin` não podem ser migrados automaticamente para Super Admin. A maioria das funções atuais de `/admin` pertence ao futuro `/parceiros`, então essa classificação exige revisão manual ou regra de negócio aprovada.

## 15. Decisões ainda pendentes

- Nome final da tabela de vínculo: `partner_clients` ou outro.
- Se `patients.profile_id` será adicionado ou se a ponte permanecerá por `user_id`.
- Enum SQL ou constraints textuais para `profiles.role` e `profiles.status`.
- Status final de `partners.status` e `partner_clients.status`.
- Quem pode criar parceiro.
- Quem pode vincular parceiro a cliente.
- Se parceiro pode convidar cliente diretamente.
- Como tratar múltiplos parceiros por cliente.
- Como tratar troca de parceiro.
- Como migrar usuários legados com `user_metadata.role = "admin"`.
- Quais ações de Admin real entram na primeira versão.
- Como auditar alterações de perfil, status e vínculo.

## 16. Próximas fases recomendadas

1. Especificar migration de `profiles`, sem aplicar ainda, com enum/constraints e estratégia de backfill.
2. Especificar migration de `partners`, ligada a `profiles`.
3. Especificar migration de `partner_clients`, ligada a `partners` e `patients`.
4. Desenhar policies RLS por tabela e por ownership.
5. Revisar Edge Functions administrativas.
6. Criar testes SQL de autorização.
7. Criar Supabase Next browser/server.
8. Criar resolução server-side de sessão e profile.
9. Implementar login único `/login` no Next, usando os contratos da Fase 4.2.
10. Só depois avaliar logins separados por perfil.

## 17. Critérios de aceite desta documentação

- `profiles` está proposto como fonte canônica.
- `partners` está proposto como tabela própria ligada a `profiles`.
- `patients` permanece como tabela de dados atuais do paciente/cliente.
- vínculo Parceiro–Cliente está proposto por tabela própria.
- permissões por perfil estão mapeadas.
- rotas por perfil estão mapeadas.
- RLS está preparado como fase crítica futura, sem ser resolvido agora.
- nenhuma migration foi criada.
- nenhum runtime foi alterado.
- Supabase, auth, rotas e Edge Functions permanecem intactos.
