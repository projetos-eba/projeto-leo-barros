---
name: projeto-leo-barros-auth
description: >
  Implementar, auditar, testar e manter os fluxos de autenticacao segmentados
  de Cliente, Parceiro e Admin do Projeto Leo Barros.
---

# Projeto Leo Barros Auth

Use esta skill ao alterar, auditar, testar ou documentar autenticacao, primeiro
acesso, cadastro de Parceiro, confirmacao de e-mail, reset de senha, roles,
guards, Edge Functions de auth, tokens, Resend ou variaveis de ambiente de auth.

## Fontes Obrigatorias

Leia antes de agir:

1. `AGENTS.md`
2. `docs/sitemap-projeto-leo-barros.md`
3. `docs/skills/auth-flow.md`
4. `docs/auth/environment-variables.md`
5. `src/app/login/**`
6. `src/app/auth/**`
7. `src/components/auth/**`
8. `src/lib/auth/**`
9. `src/lib/supabase/**`
10. `src/proxy.ts`
11. `supabase/config.toml`
12. `supabase/migrations/**`
13. `supabase/functions/**`
14. `supabase/seed.sql`
15. `scripts/dev/**`

## Roles Oficiais

- `cliente`: usuario final atendido por parceiro.
- `parceiro`: profissional que atende clientes.
- `admin`: operacao interna.

Use os prefixos oficiais `/cliente`, `/parceiros` e `/admin`.

## Rotas

- `/`: seletor "Quem esta acessando?"
- `/login`: Cliente.
- `/login/primeiro-acesso`: ativacao de Cliente ja vinculado.
- `/login/esqueci-senha`: reset Cliente.
- `/login/parceiros`: Parceiro.
- `/login/parceiros/cadastro`: cadastro publico de Parceiro.
- `/login/parceiros/esqueci-senha`: reset Parceiro.
- `/login/admin`: Admin.
- `/login/admin/esqueci-senha`: reset Admin.
- `/auth/confirmar-email?token=...`: confirmacao.
- `/auth/redefinir-senha?token=...`: nova senha.
- `/planos`: Parceiro sem plano ativo.

## Estados Da Conta

- Login exige `profiles.status = 'active'`.
- Cliente e Parceiro exigem `profiles.email_confirmed_at` confirmado.
- Admin nao exige confirmacao de dominio no login.
- Parceiro deve ter assinatura `active` ou `trialing` vigente; caso contrario vai
  para `/planos`.

## Confirmacao Pendente

- Apos primeiro acesso de Cliente ou cadastro publico de Parceiro, renderize a
  tela pendente com polling de `check-email-verification-status` a cada 5s.
- A Edge Function retorna somente estado e destino seguro: Cliente confirmado
  vai para `/cliente/inicio`; Parceiro confirmado com plano vigente vai para
  `/parceiros/dashboard`; Parceiro sem plano vigente vai para `/planos`.
- Se a aba que iniciou o fluxo ainda tiver a senha em memoria, apos confirmacao
  a UI deve autenticar via `loginWithPassword` antes de redirecionar, para criar
  cookies Supabase SSR. Nunca persistir senha em URL, localStorage,
  sessionStorage ou log.
- Quando o fluxo comeca em `/planos`, preservar `next=/parceiros/checkout?...`
  pelo login e pelo cadastro publico de Parceiro.
- O botao de reenvio deve ter cooldown de 60s no client, e
  `send-verification-email` deve aplicar o mesmo limite no backend.
- A tela `/auth/confirmar-email` deve usar o role retornado por
  `verify-email-token` para montar o link de login segmentado.
- Em telas de checkout/billing de Parceiro, logout deve voltar para
  `/login/parceiros`, nao para `/login`.

## Primeiro Acesso

Cliente nao tem cadastro publico. Primeiro acesso so pode ativar conta ja criada,
com `profiles.role = 'cliente'`, registro em `patients` e vinculo ativo em
`partner_clients`. A Server Action do Next deve apenas validar entrada e chamar
`complete-client-first-access`; a service role fica somente na Edge Function.
Falhas usam mensagem generica para evitar enumeracao.

## Cadastro De Parceiro

Cadastro publico chama `signup-partner`, que cria Auth user,
`profiles.role = 'parceiro'` e `partners` dentro da Edge Function. O Next nao
deve carregar service role para cadastro publico. Depois envia confirmacao ou
segue a politica de aprovacao/confirmacao automatica. Falhas parciais devem
tentar rollback dos registros criados.

## Admin

Admin usa `/login/admin`, nao tem cadastro publico e deve existir no seed local
como Auth confirmado, profile `admin` ativo e registro em `admins`.

## Confirmacao, Aprovacao E Reset

- Tokens ficam sempre hashados.
- Token puro nunca vai para banco, log, screenshot ou relatorio.
- Confirmacao expira em 24h e e de uso unico.
- Reset expira em 1h; a sessao curta de troca de senha expira em minutos e e de
  uso unico.
- Reset sempre envia e-mail ao titular da conta, nunca ao `EMAIL_ADMIN`.

## Flags

Precedencia:

1. `CONFIRMED_AUTOMATICALLY_EMAIL=true`: confirma automaticamente e nao envia e-mail.
2. `ALL_ACCOUNT_CREATE_APPROVAL_ADM=true`: envia aprovacao para `EMAIL_ADMIN`.
3. Ambas falsas: envia confirmacao ao titular da conta.

Se ambas forem verdadeiras, a confirmacao automatica vence.

## Resend

- `RESEND_API_KEY` existe apenas no ambiente das Edge Functions.
- `RESEND_FROM` deve ser `DeLoad Fit <noreply@deloadfit.app>` ou remetente
  equivalente do dominio verificado.
- Use tags `flow`, `role`, `environment` e `request_id` quando enviar.
- Registre o ID retornado pela Resend somente em ledger protegido por service role.
- Nao afirme entrega em caixa de entrada apenas por evento `delivered`.

## Variaveis

Consulte `docs/auth/environment-variables.md`. `APP_URL` e a fonte canonica
server-side para links de e-mail. `NEXT_PUBLIC_APP_URL` so deve ser usado por
Client Components quando houver necessidade real.

## Service Role

- Nunca expor service role no browser.
- Nunca prefixar com `NEXT_PUBLIC_`.
- O app Next nao deve ter client admin Supabase nem importar service role em
  Server Actions.
- Operacoes privilegiadas de auth devem ficar em Edge Functions.
- Excecoes exigem plano aprovado, justificativa documentada e teste
  arquitetural especifico.

## Supabase MCP E Playwright MCP

- Use Supabase MCP para inspecionar schema, migrations, constraints, indices, RLS,
  tabelas de tokens, ledger, fixtures e dados de Auth quando a ferramenta estiver
  disponivel.
- Se `search_docs` falhar, tente `execute_sql`/`list_tables` quando expostos pelo
  MCP local. Registre qual ferramenta foi usada.
- Use Playwright MCP para smoke real: rotas, foco, teclado, forms, console,
  network, redirecionamentos e links de e-mail mascarados.

## Matriz Minima

Teste seletor de perfil, Cliente primeiro acesso, Parceiro cadastro, Admin login,
confirmacao normal, aprovacao administrativa, confirmacao automatica, reset dos
tres perfis, role errada, parceiro com/sem plano, RLS dos tokens, token expirado
e token reutilizado.

Use `npm run test:e2e:auth:matrix` para a matriz local real com Resend. O script
usa Deno para rodar as Edge Functions de envio com flags isoladas e Playwright
para abrir links reais. Nunca persistir token puro em `artifacts/`.

## NUNCA

- cadastrar Cliente publicamente;
- expor service role;
- prefixar service role com `NEXT_PUBLIC_`;
- guardar token puro;
- logar token;
- usar `Boolean("false")`;
- usar `EMAIL_ADMIN` como conta Admin por suposicao;
- aplicar confirmacao automatica ao reset de senha;
- redirecionar reset para `EMAIL_ADMIN`;
- afirmar que E2E passou sem Playwright;
- afirmar que banco passou sem Supabase local;
- afirmar que e-mail chegou a caixa de entrada apenas pelo retorno da API.

## Comandos

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run validate:admin-partner-flow`
- `npm run test:e2e:auth`
- `npm run test:e2e:auth:matrix`
- `npx supabase status`
- `npx supabase db reset`
- `npx supabase test db`
- `deno fmt --check supabase/functions`
- `deno lint supabase/functions`
- `deno check supabase/functions/**/*.ts`
- `deno test --allow-env --allow-read supabase/functions/_shared/env.test.ts`

## Troubleshooting Local

- Se `validate-local-admin-partner-flow` travar apos subir o Next, conferir se o
  Parceiro sem assinatura esta esperando `/planos`, nao `/parceiros/dashboard`.
- Se `deno check` nao resolver `npm:@supabase/supabase-js@2.98.0`, executar
  `deno install --entrypoint` para as Edge Functions sem instalar Deno no Next.
- Se a Resend retornar 422 em homologacao local, validar destinatario autorizado,
  remetente do dominio verificado e evitar aliases nao aceitos pelo ambiente.
