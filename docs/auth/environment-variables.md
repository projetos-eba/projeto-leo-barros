# Variaveis de Ambiente de Auth

Data de referencia: 2026-07-09.

## RESEND_API_KEY

- Runtime: Supabase Edge Functions.
- Obrigatoria: sim para envio real.
- Segredo: sim.
- Local: configurar em `supabase/functions/.env`.
- Producao: configurar no ambiente das Edge Functions.
- Ausente: envio real falha com erro sanitizado.
- Risco: nunca imprimir, versionar ou expor ao navegador.

## RESEND_FROM

- Runtime: Supabase Edge Functions.
- Obrigatoria: sim quando houver envio.
- Segredo: nao, mas e configuracao operacional.
- Local: `DeLoad Fit <noreply@deloadfit.app>`.
- Producao: `DeLoad Fit <noreply@deloadfit.app>`.
- Ausente: envio falha antes de chamar a Resend.
- Risco: remetente fora do dominio verificado causa falha de entrega.

## APP_URL

- Runtime: server-side e Supabase Edge Functions.
- Obrigatoria: sim para gerar links.
- Segredo: nao.
- Local: `http://localhost:3000`.
- Producao: `https://deloadfit.app`.
- Ausente: geracao de link falha.
- Risco: nao usar `Host` arbitrario nem fallback ambiguo para montar links.

## NEXT_PUBLIC_APP_URL

- Runtime: Client Components quando houver necessidade real de origem publica.
- Obrigatoria: nao.
- Segredo: nao.
- Local: `http://localhost:3000`.
- Producao: `https://deloadfit.app`.
- Ausente: Client Components devem usar alternativa explicita.
- Risco: nao usar como fonte canonica de Edge Functions.

## EMAIL_ADMIN

- Runtime: Supabase Edge Functions.
- Obrigatoria: somente quando `ALL_ACCOUNT_CREATE_APPROVAL_ADM=true`.
- Segredo: nao, mas dado pessoal.
- Local: e-mail de aprovacao definido pelo ambiente local.
- Producao: caixa operacional de aprovacao.
- Ausente: fluxo de aprovacao administrativa falha.
- Risco: nao assumir que este e-mail e a conta master Admin.

## ALL_ACCOUNT_CREATE_APPROVAL_ADM

- Runtime: Supabase Edge Functions.
- Obrigatoria: nao, default seguro `false`.
- Segredo: nao.
- Local: `false` ou `true` para cenario de aprovacao.
- Producao: conforme politica operacional.
- Ausente: tratado como `false`.
- Risco: parser deve aceitar apenas `true`, `false`, vazio ou ausente.

## CONFIRMED_AUTOMATICALLY_EMAIL

- Runtime: Supabase Edge Functions.
- Obrigatoria: nao, default seguro `false`.
- Segredo: nao.
- Local: `false`, exceto cenario de teste especifico.
- Producao: usar somente se aprovado.
- Ausente: tratado como `false`.
- Risco: tem precedencia sobre aprovacao administrativa, mas nunca se aplica a reset.

## SUPABASE_SERVICE_ROLE_KEY

- Runtime: Supabase Edge Functions e scripts locais de desenvolvimento que
  inspecionam ou semeiam fixtures.
- Obrigatoria: sim para operacoes privilegiadas.
- Segredo: sim.
- Local: `supabase/functions/.env` ou ambiente do Supabase local/CLI.
- Producao: secrets das Edge Functions, nunca ambiente publico do app.
- Ausente: operacoes privilegiadas nas Edge Functions falham com erro
  sanitizado.
- Risco: nunca prefixar com `NEXT_PUBLIC_`, nunca colocar no `.env.local` do
  Next, nunca importar client admin no app Next e nunca imprimir o valor.

## Regra de arquitetura Next

- O app Next usa apenas `NEXT_PUBLIC_SUPABASE_URL` e
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para clientes Supabase.
- Server Actions de auth devem chamar Edge Functions para operacoes
  privilegiadas; elas nao podem carregar `SUPABASE_SERVICE_ROLE_KEY`.
- Cadastro publico de Parceiro usa `signup-partner`.
- Primeiro acesso de Cliente usa `complete-client-first-access`.

## Validacao Local

- `APP_URL` local deve ser `http://localhost:3000`, sem HTTPS.
- `RESEND_FROM` local homologado: `DeLoad Fit <noreply@deloadfit.app>`.
- Para matriz real com flags e Resend, usar `npm run test:e2e:auth:matrix`.
- Para Edge Functions, usar:
  - `deno fmt --check supabase/functions`
  - `deno lint supabase/functions`
  - `deno check supabase/functions/**/*.ts`
  - `deno test --allow-env --allow-read supabase/functions/_shared/env.test.ts`
- Quando o runtime local em `54321` ja estiver ativo, `supabase functions serve`
  pode nao substituir flags em execucao. Para homologacao das flags, preferir
  uma execucao isolada via Deno, como faz o script da matriz.
