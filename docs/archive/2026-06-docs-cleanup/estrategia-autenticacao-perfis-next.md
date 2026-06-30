# Estratégia de autenticação e perfis para a migração Next.js

Data de referência: 20 de junho de 2026.

Status: decisão técnica da Fase 4.1, sem implementação de runtime.

## 1. Decisão executiva

O projeto deve manter inicialmente um **login único temporário**.

Não é seguro criar agora logins funcionais separados para Cliente, Parceiros e Admin porque:

- `Cliente` existe parcialmente como usuário Auth com `user_metadata.role = "patient"` e registro em `public.patients`;
- `Admin` existe apenas como usuário Auth com `user_metadata.role = "admin"`, sem entidade pública própria;
- `Parceiro` não foi identificado como entidade, tabela ou role real;
- as telas operacionais atualmente chamadas de Admin correspondem majoritariamente ao perfil futuro de Parceiros;
- não existem guards de rota por perfil;
- as policies não distinguem Cliente, Parceiro e Admin;
- várias policies permitem acesso amplo para `public` ou para qualquer usuário `authenticated`.

Os logins separados devem ser uma camada posterior de experiência, construída somente depois que identidade, autorização e ownership estiverem definidos.

## 2. Funcionamento atual do login

Fluxo implementado em `src/pages/Login.tsx`:

1. o usuário informa CPF ou e-mail e senha;
2. quando a entrada tem 11 dígitos e não contém `@`, o frontend consulta `public.patients` pelo CPF;
3. se o paciente possui e-mail, esse e-mail é usado no Supabase Auth;
4. caso contrário, é usado o endereço sintético `{cpf}@patient.local`;
5. o frontend chama `supabase.auth.signInWithPassword`;
6. lê `data.user.user_metadata.role`;
7. `role === "patient"` navega para `/patient`;
8. qualquer outro valor, inclusive role ausente ou desconhecido, navega para `/admin`.

O login não valida uma matriz de permissões nem confirma o role em tabela de domínio.

## 3. Identidade atual dos perfis

### Cliente/Paciente

Evidências:

- Edge Function `create-patient` cria ou atualiza usuário Auth;
- grava `user_metadata` com `role: "patient"`, nome e CPF;
- cria registro em `public.patients`;
- vincula `patients.user_id` ao usuário de `auth.users`;
- partes do portal consultam `patients.user_id = auth user id`.

Limitação: o vínculo existe, mas a maioria das policies não usa `auth.uid()` para restringir dados ao próprio paciente.

### Admin

Evidências:

- Edge Function `create-admin` cria ou atualiza usuário Auth;
- grava somente `user_metadata.role = "admin"`;
- não foi identificada tabela `admins`, `profiles` ou `user_roles`;
- não existe guard protegendo `/admin`;
- as telas atuais de `/admin` são principalmente operação profissional sobre pacientes.

Admin é atualmente um marcador de metadata e um conjunto de rotas, não um perfil de autorização completo.

### Parceiro

Não identificado nos arquivos analisados:

- tabela de parceiros/profissionais;
- role `partner`;
- vínculo entre parceiro e clientes;
- ownership de pacientes por parceiro;
- Edge Function de criação de parceiro;
- policies específicas;
- guard ou redirecionamento próprio.

O perfil Parceiro está conceitualmente misturado nas rotas e funcionalidades atuais de `/admin`.

## 4. Sessão, guards e logout atuais

- O cliente Supabase persiste sessão em `localStorage` e renova tokens automaticamente.
- `src/App.tsx` não possui guards de autenticação ou perfil.
- `AdminLayout` não verifica sessão ou role.
- `PatientLayout` não verifica sessão ou role.
- qualquer visitante pode navegar diretamente para rotas Vite protegidas pelo frontend.
- somente algumas páginas de paciente chamam `supabase.auth.getUser()` para localizar `patients.user_id`.
- os botões de logout removem `localStorage.userRole`, mas não chamam `supabase.auth.signOut()`.
- não foi identificado código que grave `localStorage.userRole`.

Portanto, remover `userRole` não encerra a sessão Supabase atual.

## 5. Modelo de autorização atual

Não existe matriz Cliente/Parceiro/Admin no banco.

Achados:

- não há tabela canônica de perfil;
- não há enum de roles;
- não há relação parceiro-cliente;
- não há policies baseadas em `auth.uid()` para ownership do paciente;
- várias tabelas clínicas permitem operações com `USING (true)` e `WITH CHECK (true)`;
- tabelas de formulários permitem operações para `public`;
- várias tabelas permitem acesso integral a qualquer usuário `authenticated`;
- as Edge Functions `create-patient` e `create-admin` usam service role, mas não fazem validação explícita do perfil do chamador no código analisado.

`user_metadata` não deve ser a única fonte para autorização sensível. A fonte de verdade futura deve ser controlada pelo servidor/banco, podendo ser refletida em claims seguras para decisões de rota.

## 6. Matriz de perfis e rotas

| Perfil | Identidade atual | Rotas atuais | Login alvo do sitemap | Home futura recomendada | Estado |
| --- | --- | --- | --- | --- | --- |
| Cliente | Auth role `patient` + `patients.user_id` | `/patient/**` | `/cliente/login` | `/cliente/inicio` | Parcialmente modelado |
| Parceiro | Misturado no role `admin`; entidade própria não identificada | operação em `/admin/**` | `/parceiros/login` | `/parceiros/dashboard` | Não modelado |
| Admin | Auth role `admin`; sem tabela própria | `/admin/**`, misturado com operação profissional | `/admin/login` | `/admin/dashboard` | Role parcial; produto real não especificado |

## 7. Redirecionamentos

### Atuais

| Condição após login | Destino |
| --- | --- |
| `user_metadata.role === "patient"` | `/patient` |
| qualquer outro role ou role ausente | `/admin` |
| logout visual | `/`, sem `supabase.auth.signOut()` |

### Futuros recomendados

| Role canônico | Destino |
| --- | --- |
| `client` | `/cliente/inicio` |
| `partner` | `/parceiros/dashboard` |
| `admin` | `/admin/dashboard` |
| role ausente, inválido, inativo ou não autorizado | negar acesso e encerrar/invalidar a sessão conforme contrato aprovado |

Usuário autenticado que visitar uma tela de login deve ser redirecionado para a home do próprio perfil somente após a resolução segura do role.

## 8. Riscos de criar três logins agora

1. Parceiro seria apenas um rótulo visual sem entidade ou autorização real.
2. Admin e Parceiro continuariam compartilhando o mesmo role e os mesmos dados.
3. Um usuário sem role continuaria podendo cair em Admin se a lógica atual fosse reutilizada.
4. Rotas diferentes não impediriam acesso cruzado sem guards e RLS.
5. O cliente Supabase Vite depende de `import.meta.env` e `localStorage`, incompatíveis com uso direto em Server Components.
6. Separar páginas antes do contrato de sessão criaria duplicação de lógica.
7. Policies amplas poderiam transformar um erro de navegação em exposição ou mutação indevida de dados.
8. As Edge Functions administrativas precisam validar o chamador antes de serem tratadas como operações protegidas.

## 9. Arquitetura futura recomendada

### Fonte de verdade

Definir uma fonte de perfil controlada pelo servidor:

- tabela `profiles` ou estrutura equivalente ligada a `auth.users`;
- role canônico `client`, `partner` ou `admin`;
- status da conta;
- opcionalmente claims seguras em `app_metadata` para leitura eficiente;
- nunca confiar exclusivamente em `user_metadata` para autorização.

Se um usuário puder acumular perfis, substituir role único por uma relação `user_roles`. Essa decisão é de produto e precisa de aprovação.

### Entidades de domínio

- Cliente: preservar vínculo entre usuário Auth e paciente/cliente.
- Parceiro: criar entidade própria e relação explícita com os clientes que pode acessar.
- Admin: definir se é Super Admin global e quais operações exclusivas possui.

### Next.js e Supabase

Antes do login Next funcional:

- criar clientes Supabase separados para browser e servidor;
- definir variáveis públicas compatíveis com Next sem expor secrets;
- persistir sessão em cookies compatíveis com renderização servidor/cliente;
- criar resolução central de sessão e perfil;
- proteger layouts/rotas no servidor;
- usar middleware ou mecanismo equivalente somente como proteção inicial, nunca como substituto de RLS;
- implementar logout com `supabase.auth.signOut()`;
- tratar sessão expirada, usuário inativo e role inválido.

### RLS e ownership

RLS deve ser a barreira definitiva:

- Cliente acessa apenas dados associados ao próprio `auth.uid()`;
- Parceiro acessa apenas clientes vinculados a ele;
- Admin acessa somente operações administrativas aprovadas;
- tabelas de referência devem ter políticas explícitas;
- formulários e Storage precisam de ownership específico;
- mudanças devem entrar em novas migrations rastreáveis, sem reescrever migrations históricas.

## 10. O que pode ser preparado sem alterar auth

- tipos TypeScript para roles canônicos;
- matriz declarativa role → home futura;
- interface de resolução de perfil com implementação mockada;
- testes unitários da matriz de redirecionamento;
- testes do `LoginView`;
- contratos de sessão e erros;
- especificação da entidade Parceiro;
- inventário de tabelas por ownership;
- plano de novas policies;
- mocks de Cliente, Parceiro, Admin, role inválido e usuário inativo;
- desenho dos clientes Supabase browser/server;
- documentação da estratégia de transição Vite → Next.

Esses artefatos não devem ser conectados ao runtime antes das decisões de produto e segurança.

## 11. Plano de implementação em fases

### Fase A — decisões de produto

- confirmar role único ou múltiplos roles por usuário;
- definir Parceiro;
- definir Admin real;
- aprovar a matriz de rotas e capacidades;
- definir estados de conta.

### Fase B — contrato técnico sem runtime

- criar tipos canônicos;
- definir resolvedor de perfil e matriz de redirecionamento;
- criar testes unitários;
- documentar erros e estados de sessão.

### Fase C — modelo de identidade e ownership

- criar entidade/fonte canônica de perfil;
- modelar Parceiro e relação parceiro-cliente;
- migrar usuários existentes;
- manter compatibilidade temporária com `patient` e `admin`.

Exige aprovação para Supabase e migrations.

### Fase D — segurança de dados

- novas policies por role e ownership;
- revisão das Edge Functions administrativas;
- revisão de Storage;
- testes SQL de autorização.

Exige aprovação específica de RLS, migrations e Edge Functions.

### Fase E — infraestrutura Supabase no Next

- clientes browser/server;
- sessão por cookies;
- resolução de usuário e perfil no servidor;
- proteção de layouts;
- logout real;
- testes de sessão.

### Fase F — login Next único temporário

- reutilizar `LoginView`;
- usar uma única implementação de autenticação;
- redirecionar pela matriz canônica;
- preservar Vite durante a convivência;
- não criar três lógicas de login independentes.

### Fase G — entradas separadas por perfil

Somente depois de Cliente, Parceiro e Admin existirem como perfis reais:

- criar `/cliente/login`;
- criar `/parceiros/login`;
- criar `/admin/login`;
- reutilizar o mesmo serviço de autenticação;
- validar se o usuário possui o perfil correspondente à entrada escolhida;
- manter recuperação de senha e erros consistentes.

## 12. Testes recomendados

### Unitários

- CPF para e-mail do paciente;
- role atual `patient`;
- roles canônicos futuros;
- role ausente ou inválido;
- matriz role → home;
- conta inativa;
- logout;
- erros de autenticação.

### Integração

- sessão criada, renovada e encerrada;
- resolução de perfil no servidor;
- acesso permitido e negado por layout;
- usuário tentando acessar rota de outro perfil;
- compatibilidade durante Vite e Next paralelos;
- Edge Functions recusando chamadores sem permissão.

### Banco/RLS

- Cliente lê somente os próprios dados;
- Parceiro lê e altera somente clientes vinculados;
- Admin executa somente operações aprovadas;
- usuário autenticado sem role não recebe acesso;
- usuário anônimo não acessa dados clínicos;
- formulários e Storage respeitam ownership.

### E2E

- login e logout de cada perfil;
- destino pós-login;
- sessão expirada;
- acesso direto por URL;
- bloqueio cruzado entre perfis;
- recuperação após refresh.

## 13. Decisões pendentes de aprovação

1. Um usuário terá exatamente um role ou poderá acumular roles?
2. Parceiro é pessoa física, organização ou ambos?
3. Como Parceiro se relaciona com Cliente: vínculo direto, equipe, clínica ou assinatura?
4. Admin significa Super Admin global?
5. Quem pode criar, suspender e alterar roles?
6. Qual será a fonte canônica: tabela de perfis, `app_metadata` ou combinação?
7. Contas terão estados como `pending`, `active`, `suspended` e `disabled`?
8. O primeiro login Next único ficará em qual rota?
9. Quando as rotas Vite deixarão de aceitar navegação direta?
10. Qual estratégia de migração será usada para usuários Auth existentes?

Nenhuma dessas decisões foi implementada nesta fase.
