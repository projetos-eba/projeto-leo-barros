# Fluxo Auth Segmentado

Data de referencia: 2026-07-08.

## Roles oficiais

- `cliente`: usuario final atendido por um parceiro.
- `parceiro`: profissional ou prestador que atende clientes.
- `admin`: operacao interna da plataforma.

## Rotas publicas de auth

- `/`: seletor "Quem esta acessando?"
- `/login`: login do Cliente.
- `/login/primeiro-acesso`: ativacao de Cliente ja vinculado.
- `/login/esqueci-senha`: recuperacao de senha de Cliente.
- `/login/parceiros`: login do Parceiro.
- `/login/parceiros/cadastro`: cadastro publico de Parceiro.
- `/login/parceiros/esqueci-senha`: recuperacao de senha de Parceiro.
- `/login/admin`: login Admin.
- `/login/admin/esqueci-senha`: recuperacao de senha Admin.
- `/auth/confirmar-email?token=...`: confirmacao de e-mail.
- `/auth/redefinir-senha?token=...`: redefinicao de senha.
- `/planos`: placeholder seguro para Parceiro sem plano ativo.

## Rotas pos-login

- Cliente: `/cliente/inicio`.
- Parceiro com plano ativo: `/parceiros/dashboard`.
- Parceiro sem plano ativo: `/planos`.
- Admin: `/admin/dashboard`.

## Confirmacao pendente

- Depois do primeiro acesso de Cliente ou cadastro publico de Parceiro, a UI
  exibe a tela "Confirme seu e-mail" e nao tenta autenticar enquanto o dominio
  estiver sem `profiles.email_confirmed_at`.
- A tela consulta `check-email-verification-status` a cada 5 segundos usando
  `profileId` e `role`; a Edge Function usa service role apenas no runtime
  Supabase e retorna somente `confirmed` e `destination`.
- Quando a confirmacao e detectada na mesma aba que iniciou o cadastro/primeiro
  acesso, a UI faz login por senha via Server Action antes de redirecionar. A
  senha digitada fica apenas em memoria React, nunca em URL, storage ou log.
- Apos login, Cliente vai para `/cliente/inicio`; Parceiro com assinatura
  `active` ou `trialing` vigente vai para `/parceiros/dashboard`; Parceiro sem
  plano vigente vai para `/planos` ou para o `next` seguro preservado, como
  `/parceiros/checkout?plan=...`.
- O botao "Reenviar e-mail" fica bloqueado por 60 segundos no client e o mesmo
  cooldown e aplicado na Edge Function `send-verification-email`.
- A pagina `/auth/confirmar-email` usa o role retornado por `verify-email-token`
  para direcionar "Ir para o login": Cliente `/login`, Parceiro
  `/login/parceiros`, Admin `/login/admin`.
- O logout deve preservar o segmento: Cliente retorna para `/login`, Parceiro
  retorna para `/login/parceiros` e Admin retorna para `/login/admin`.

## Cliente / Primeiro acesso

- Cliente nao tem cadastro publico.
- O primeiro acesso apenas ativa conta ja criada por Parceiro.
- A Server Action do Next apenas valida o contrato de entrada e chama a Edge
  Function publica controlada `complete-client-first-access`.
- A Edge Function valida `profiles.role = 'cliente'`, `profiles.status =
  'active'`, extensao `patients` e vinculo ativo em `partner_clients` antes de
  alterar senha ou disparar confirmacao.
- Falhas retornam mensagem generica para evitar enumeracao.
- A senha e definida no Auth, o dominio fica aguardando confirmacao por e-mail.
- O Cliente so acessa a area autenticada depois da confirmacao de e-mail.

## Parceiro / Cadastro / Planos

- Parceiro pode usar `/login/parceiros/cadastro`.
- Campos minimos: nome, e-mail, telefone, tipo profissional, registro quando aplicavel, senha e confirmacao.
- Senha nao e campo normalizavel: nunca aplicar `trim()`, lowercase,
  mascara, transformacao, serializacao em URL/storage ou qualquer mutacao antes
  de gravar no Supabase Auth ou antes de chamar `loginWithPassword`. O valor
  usado no auto-login deve ser exatamente o valor aceito na criacao da conta.
- Registro profissional vazio e aceito e persiste como `null` em `partners.professional_registry_type` e `partners.professional_registry_number`.
- Quando o registro for informado parcialmente, a UI deve mostrar erro especifico no campo faltante; quando completo, o tipo e normalizado para `cref`, `crn`, `crm` ou `outro`.
- A Server Action do Next nao usa service role; ela valida o contrato e chama a
  Edge Function publica controlada `signup-partner`.
- `signup-partner` cria Auth user, `profiles.role = 'parceiro'` e `partners`
  com service role apenas dentro do runtime da Edge Function. Se houver falha
  apos criacao parcial, tenta rollback de `auth.users`, `profiles`,
  `partners`, tokens e ledger de e-mail.
- Depois da confirmacao, o login valida plano ativo em `partner_subscriptions`.
- Status aceitos: `active` e `trialing`, com periodo vigente.
- Sem plano ativo, login valido deve retornar sucesso e redirecionar para
  `/planos`; falta de assinatura nunca deve virar erro de e-mail/senha.
- A tela pendente so deve tratar o Parceiro como autenticado depois de
  `loginWithPassword` criar sessao/cookies. Se o auto-login falhar, manter a
  tela com orientacao segura de novo login/reset, sem redirecionar para
  `/planos` como se houvesse sessao.

## Admin

- Admin usa `/login/admin`.
- Nao ha cadastro publico.
- Reset de senha existe.
- Confirmacao de e-mail nao e exigida no login Admin.
- O seed local cria Auth user confirmado, `profiles.role = 'admin'`, `profiles.status = 'active'` e extensao `admins`.

## Edge Functions

- `signup-partner`: cadastro publico de Parceiro, com validacao defensiva,
  criacao privilegiada, envio/auto-confirmacao e rollback de falha parcial.
- `complete-client-first-access`: primeiro acesso publico de Cliente ja
  provisionado, com validacao de ownership antes de alterar senha.
- `send-verification-email`: gera token forte, armazena hash e envia link via Resend.
- `verify-email-token`: valida hash, expira em 24h, consome token e confirma Auth/domino.
- `check-email-verification-status`: consulta confirmacao e destino pos-confirmacao
  sem retornar dados sensiveis.
- `send-password-reset-email`: valida role esperada, responde de forma generica, envia reset ao dono da conta.
- `verify-password-reset-token`: valida token de reset, gera sessao curta hashada.
- `update-password-with-token`: atualiza senha via Admin API e consome sessao.

## Variaveis de ambiente

- `APP_URL`: origem canonica server-side dos links.
- `NEXT_PUBLIC_APP_URL`: origem publica apenas quando Client Components precisarem.
- `RESEND_API_KEY`: chave Resend usada somente em Edge Function.
- `RESEND_FROM`: remetente obrigatorio do dominio verificado.
- `ALL_ACCOUNT_CREATE_APPROVAL_ADM`: quando `true`, confirmacoes de conta vao para `EMAIL_ADMIN`.
- `EMAIL_ADMIN`: obrigatoria quando `ALL_ACCOUNT_CREATE_APPROVAL_ADM=true`.
- `CONFIRMED_AUTOMATICALLY_EMAIL`: quando `true`, confirma e-mail automaticamente apenas no fluxo de confirmacao.

Detalhamento operacional: `docs/auth/environment-variables.md`.

## ALL_ACCOUNT_CREATE_APPROVAL_ADM

Quando ativo, a Edge Function envia o link de confirmacao para `EMAIL_ADMIN`, sem hardcode. O e-mail informa qual conta aguarda confirmacao e o link confirma a conta solicitante. Nao se aplica ao reset de senha.

## CONFIRMED_AUTOMATICALLY_EMAIL

Quando ativo, as Edge Functions de confirmacao nao chamam Resend. Elas confirmam
o Auth user e atualizam `profiles.email_confirmed_at`. Para Cliente em primeiro
acesso, tambem atualizam `first_access_completed_at`.

Se `CONFIRMED_AUTOMATICALLY_EMAIL=true` e `ALL_ACCOUNT_CREATE_APPROVAL_ADM=true`, a confirmacao automatica tem precedencia e nenhum e-mail e enviado.

## Checklist de seguranca

- Nao cadastrar Cliente publicamente.
- Nao hardcodar e-mail admin.
- Nao armazenar token puro.
- Nao usar service role em Client Component.
- Nao vazar se e-mail existe em primeiro acesso ou reset.
- Nao logar senha, token, action link, access token ou refresh token.
- Nao mover secrets de Edge Function para client-side.
- Nao usar `Boolean("false")` para flags.
- Nao usar `EMAIL_ADMIN` como conta Admin por suposicao.
- Nao aplicar confirmacao automatica ao reset de senha.
- Nao declarar e-mail entregue em caixa de entrada apenas por retorno `queued`
  ou `accepted` da Resend.
- Nao salvar URL completa com token em artefatos; usar `token=[REDACTED]`.

## Comandos de teste

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run test:e2e:auth`
- `npm run test:e2e:auth:matrix`
- `npm run validate:admin-partner-flow`
- Quando o Supabase local estiver disponivel: `npm run db:reset`
- `npx supabase test db`
- `deno fmt --check supabase/functions`
- `deno lint supabase/functions`
- `deno check supabase/functions/**/*.ts`
- `deno test --allow-env --allow-read supabase/functions/_shared/env.test.ts`

## Homologacao local com Resend

O script `npm run test:e2e:auth:matrix` cria fixtures descartaveis, executa as
quatro combinacoes das flags de confirmacao para Cliente e Parceiro, executa
reset para Cliente, Parceiro e Admin nas quatro combinacoes, consulta a Resend
pelo provider ID e abre os links reais no Playwright.

Para variar flags sem depender da instancia ja exposta em `54321`, o script roda
as Edge Functions de envio via `deno run` em porta local temporaria. As funcoes
de verificacao continuam sendo exercitadas pelo Next/Supabase local ao abrir os
links reais.
