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

## Cliente / Primeiro acesso

- Cliente nao tem cadastro publico.
- O primeiro acesso apenas ativa conta ja criada por Parceiro.
- O backend valida `profiles.role = 'cliente'`, extensao `patients` e vinculo ativo em `partner_clients`.
- Falhas retornam mensagem generica para evitar enumeracao.
- A senha e definida no Auth, o dominio fica aguardando confirmacao por e-mail.
- O Cliente so acessa a area autenticada depois da confirmacao de e-mail.

## Parceiro / Cadastro / Planos

- Parceiro pode usar `/login/parceiros/cadastro`.
- Campos minimos: nome, e-mail, telefone, tipo profissional, registro quando aplicavel, senha e confirmacao.
- O cadastro cria Auth user, `profiles.role = 'parceiro'` e `partners`.
- Depois da confirmacao, o login valida plano ativo em `partner_subscriptions`.
- Status aceitos: `active` e `trialing`, com periodo vigente.
- Sem plano ativo, redireciona para `/planos`.

## Admin

- Admin usa `/login/admin`.
- Nao ha cadastro publico.
- Reset de senha existe.
- Confirmacao de e-mail nao e exigida no login Admin.
- O seed local cria Auth user confirmado, `profiles.role = 'admin'`, `profiles.status = 'active'` e extensao `admins`.

## Edge Functions

- `send-verification-email`: gera token forte, armazena hash e envia link via Resend.
- `verify-email-token`: valida hash, expira em 24h, consome token e confirma Auth/domino.
- `send-password-reset-email`: valida role esperada, responde de forma generica, envia reset ao dono da conta.
- `verify-password-reset-token`: valida token de reset, gera sessao curta hashada.
- `update-password-with-token`: atualiza senha via Admin API e consome sessao.

## Variaveis de ambiente

- `APP_URL` ou `NEXT_PUBLIC_APP_URL`: base publica dos links.
- `RESEND_API_KEY`: chave Resend usada somente em Edge Function.
- `RESEND_FROM`: remetente; fallback apenas para desenvolvimento.
- `ALL_ACCOUNT_CREATE_APPROVAL_ADM`: quando `true`, confirmacoes de conta vao para `EMAIL_ADMIN`.
- `EMAIL_ADMIN`: obrigatoria quando `ALL_ACCOUNT_CREATE_APPROVAL_ADM=true`.
- `CONFIRMED_AUTOMATICALLY_EMAIL`: quando `true`, confirma e-mail automaticamente apenas no fluxo de confirmacao.

## ALL_ACCOUNT_CREATE_APPROVAL_ADM

Quando ativo, a Edge Function envia o link de confirmacao para `EMAIL_ADMIN`, sem hardcode. O e-mail informa qual conta aguarda confirmacao e o link confirma a conta solicitante. Nao se aplica ao reset de senha.

## CONFIRMED_AUTOMATICALLY_EMAIL

Quando ativo, `send-verification-email` nao chama Resend. Ela confirma o Auth user e atualiza `profiles.email_confirmed_at`. Para Cliente em primeiro acesso, tambem atualiza `first_access_completed_at`.

## Checklist de seguranca

- Nao cadastrar Cliente publicamente.
- Nao hardcodar e-mail admin.
- Nao armazenar token puro.
- Nao usar service role em Client Component.
- Nao vazar se e-mail existe em primeiro acesso ou reset.
- Nao logar senha, token, action link, access token ou refresh token.
- Nao mover secrets de Edge Function para client-side.

## Comandos de teste

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run validate:admin-partner-flow`
- Quando o Supabase local estiver disponivel: `npm run db:reset`
