# Runbook - Homologacao Stripe

Data de referencia: 10 de julho de 2026.

## Requisitos

- Usar somente Stripe test mode.
- Nunca imprimir `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, service role, JWT, client secret ou dados de cartao.
- Confirmar prefixos: `pk_test` para public key e `sk_test` ou `rk_test` para chave server-side.
- Abortar qualquer escrita se uma resposta Stripe retornar `livemode=true`.
- Usar Supabase MCP local quando disponivel para inspecionar tabelas, webhooks, snapshots e RLS. O endpoint local esperado e `http://127.0.0.1:54321/mcp`.
- Usar Playwright MCP para cliques reais, console, network, screenshots desktop/mobile e validacao visual. O servidor esta configurado em `.mcp.json` via `@playwright/mcp`; se o cliente MCP da sessao nao expuser o servidor, registrar a limitacao e usar Playwright local/headless somente como fallback.
- Antes de desistir de clique, preenchimento, digitacao ou cookie no Playwright MCP, executar `npm run mcp:playwright:check` e buscar ferramentas com `tool_search`: `Playwright MCP browser_click browser_type browser_fill_form browser_cookie_set click type fill form set cookie`.
- Para detalhes e manutencao de limitacoes repetidas de MCP, seguir `docs/runbooks/mcp-local.md`.

## Catalogo Oficial

- Produto principal: `prod_UrR2wxpxk9UJxV`.
- Mensal: `price_1TriAiPELBIpM2MneLhOLwW4`, `complete_monthly_brl`, BRL 11990, `month`.
- Anual: `price_1TriAiPELBIpM2Mn7s4EpKt5`, `complete_annual_brl`, BRL 119880, `year`.
- Produto adicional: `prod_UrRGM5chV5eXLU`.
- Adicional: `price_1TriNoPELBIpM2MnQRkRINCT`, `active_client_monthly_brl`, BRL 199, `month`, `licensed`, `per_unit`.

## Variaveis

Arquivos locais esperados:

- `.env.local`: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- `supabase/functions/.env`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BILLING_ALLOWED_ORIGINS`.

Preenchimento de `BILLING_ALLOWED_ORIGINS`:

```bash
# Local, quando o Next roda em npm run dev -p 3000
BILLING_ALLOWED_ORIGINS=http://localhost:3000

# Local com mais de um host de teste
BILLING_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Producao
BILLING_ALLOWED_ORIGINS=https://app.seu-dominio.com
```

Use origins exatos, separados por virgula, sem espacos e sem barra final. Nao use `*` em billing. Em preview/staging, adicione apenas os dominios HTTPS que realmente precisam acionar checkout, portal ou preview de assinatura.

O secret do `stripe listen` local normalmente e diferente do secret de endpoint cadastrado no Dashboard. Use o `whsec_...` mostrado pelo listener apenas no runtime local da Edge Function e nao o registre em docs.

## Producao Live

Em producao, o runtime deve usar chaves Stripe live coerentes entre frontend,
Edge Functions e webhook:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` com prefixo `pk_live_`.
- `STRIPE_SECRET_KEY` ou restricted key com prefixo `sk_live_` ou `rk_live_`.
- `STRIPE_WEBHOOK_SECRET` do endpoint live cadastrado no Dashboard.
- `BILLING_ALLOWED_ORIGINS` com os dominios HTTPS reais do checkout, separados por virgula e sem barra final.

O codigo aceita objetos Stripe live apenas quando a chave server-side tambem e live. Se a chave for test mode e um objeto live aparecer, ou o inverso, a Edge Function rejeita a operacao com erro interno de incompatibilidade de modo.

Antes do primeiro checkout live, crie no Dashboard live os Products e Prices oficiais com os mesmos `lookup_key`s do test mode:

- `complete_monthly_brl`
- `complete_annual_brl`
- `active_client_monthly_brl`

Os valores, moeda, intervalo, tipo de uso e nomes de Product devem seguir o catalogo oficial. Depois disso, execute `stripe-bootstrap-catalog` autenticado como Admin para gravar os IDs live reais no catalogo local.

### Executar `stripe-bootstrap-catalog` Em Producao

Use este procedimento somente depois de confirmar que:

- `stripe-bootstrap-catalog` esta deployada no projeto Supabase correto.
- `STRIPE_SECRET_KEY` de producao esta em live mode.
- `BILLING_ALLOWED_ORIGINS` contem `https://www.deloadfit.app`.
- Existem no Stripe live Products e Prices ativos com os lookup keys oficiais:
  - `complete_monthly_brl`
  - `complete_annual_brl`
  - `active_client_monthly_brl`

No PowerShell, nunca grave senha, token ou secrets em arquivo. Informe as credenciais Admin apenas na sessao atual:

```powershell
$env:ADMIN_EMAIL = "admin@exemplo.com"
$env:ADMIN_PASSWORD = "senha-do-admin"

$envLines = Get-Content .env.production
$supabaseUrl = (($envLines | Where-Object { $_ -match '^NEXT_PUBLIC_SUPABASE_URL=' }) -replace '^NEXT_PUBLIC_SUPABASE_URL=', '').Trim()
$publishableKey = (($envLines | Where-Object { $_ -match '^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=' }) -replace '^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=', '').Trim()

$authBody = @{
  email = $env:ADMIN_EMAIL
  password = $env:ADMIN_PASSWORD
} | ConvertTo-Json

$auth = Invoke-RestMethod `
  -Method Post `
  -Uri "$supabaseUrl/auth/v1/token?grant_type=password" `
  -Headers @{
    apikey = $publishableKey
    "Content-Type" = "application/json"
  } `
  -Body $authBody

$result = Invoke-RestMethod `
  -Method Post `
  -Uri "$supabaseUrl/functions/v1/stripe-bootstrap-catalog" `
  -Headers @{
    apikey = $publishableKey
    Authorization = "Bearer $($auth.access_token)"
    "Content-Type" = "application/json"
    Origin = "https://www.deloadfit.app"
  } `
  -Body '{}'

$result | ConvertTo-Json -Depth 10

Remove-Item Env:\ADMIN_EMAIL -ErrorAction SilentlyContinue
Remove-Item Env:\ADMIN_PASSWORD -ErrorAction SilentlyContinue
Remove-Variable auth -ErrorAction SilentlyContinue
```

A resposta esperada deve conter `success: true`, os tres `lookupKeys` e os IDs live resolvidos no objeto `catalog`.

Depois da execucao, valide no banco sem imprimir secrets:

```bash
npx supabase db query "select slug, stripe_product_id is not null as has_product, stripe_price_id is not null as has_price from public.billing_plans where slug in ('complete-monthly','complete-annual') union all select slug, stripe_product_id is not null, stripe_price_id is not null from public.billing_plan_addons where slug = 'active-client-monthly' order by slug;" --linked
```

Todas as linhas devem retornar `has_product = true` e `has_price = true`. A funcao faz upsert idempotente das linhas oficiais em `billing_plans` e `billing_plan_addons`, entao o catalogo local pode estar vazio antes da primeira execucao.

Se a funcao retornar `403 FORBIDDEN`, o token usado nao pertence a um profile `admin` ativo. Se retornar sucesso mas a consulta do banco continuar vazia, nao considerar o bootstrap concluido: verificar logs de `stripe-bootstrap-catalog` e confirmar se a versao deployada contem upsert local do catalogo.

## Validacao De Catalogo

```bash
RUN_STRIPE_E2E=1 npm run test:billing:stripe
```

Para reconciliar somente nomes mutaveis de Products no Stripe test mode:

```bash
RUN_STRIPE_E2E=1 BILLING_RECONCILE_PRODUCT_NAMES=1 npm run test:billing:stripe
```

## Sincronizacao Automatica Do Catalogo

Eventos esperados no listener local:

```bash
stripe listen --events product.created,product.updated,product.deleted,price.created,price.updated,price.deleted,setup_intent.succeeded,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.finalized,invoice.paid,invoice.payment_failed,invoice.payment_action_required --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook
```

O webhook sincroniza apenas objetos classificados como catalogo Leo Barros por
metadata oficial, lookup key conhecida ou compatibilidade com IDs homologados.
Nome de Product igual ao oficial nao e criterio de pertencimento.
Fixtures com `purpose = catalog_sync_homologation` sem `catalog_role` oficial
devem ser ignoradas pela aplicacao.

Para testar eventos aplicados sem alterar o catalogo oficial, habilite
temporariamente `BILLING_ALLOW_HML_CATALOG_FIXTURES=1` apenas em
`supabase/functions/.env` local e use `metadata.catalog_role = hml-plan`.
Essas fixtures entram somente em `billing_products`/`billing_prices` e nao sao
expostas por `/planos` ou checkout.

Para recuperar divergencias ou fazer bootstrap sem depender de replay de evento,
usar a Edge Function administrativa `stripe-reconcile-catalog`. Ela exige token
Admin e sincroniza Stripe -> Supabase sem criar Products ou Prices.

## Processos Locais

1. `npm run db:start`
2. `npx supabase db reset`
3. `npx supabase functions serve --env-file supabase/functions/.env`
4. `npm run dev`
5. Validar MCPs locais:

```bash
npm run mcp:playwright:check
npm run mcp:supabase:check
```

6. Iniciar Stripe CLI:

```bash
stripe listen --events product.created,product.updated,product.deleted,price.created,price.updated,price.deleted,setup_intent.succeeded,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,customer.subscription.paused,customer.subscription.resumed,customer.subscription.trial_will_end,invoice.upcoming,invoice.created,invoice.finalized,invoice.finalization_failed,invoice.paid,invoice.payment_failed,invoice.payment_action_required,invoice.updated --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook
```

Atualize `STRIPE_WEBHOOK_SECRET` do runtime local com o secret exibido pelo listener e reinicie `supabase functions serve`.

## Fluxos

- `/planos` desktop/mobile.
- Login Parceiro e preservacao de `next=/parceiros/checkout?plan=...`.
- `/parceiros/checkout` com Payment Element real.
- Preview de cupom antes do cartao: aplicar, remover e reaplicar Promotion Code sem SetupIntent confirmado.
- SetupIntent confirmado.
- Repetir o clique apos uma falha simulada de criacao da assinatura: o frontend deve retentar somente `billing-create-subscription` com o `setupIntentId` ja confirmado e nao deve chamar `confirmSetup` novamente.
- Reabrir o checkout apos um SetupIntent concluido sem assinatura local: a nova montagem deve solicitar outro SetupIntent, nunca reutilizar a chave fixa de Parceiro e plano.
- Assinatura mensal e anual com `billing_mode=flexible`.
- Trial de 7 dias uma vez por Parceiro.
- Cupom valido e invalido.
- Cartao aprovado, recusado e 3DS de teste.
- Webhooks assinados, duplicados, invalidos e desconhecidos.
- Invoices de assinatura devem gravar `stripe_invoice_id` e `stripe_subscription_id` no ledger usando `invoice.subscription` ou `invoice.parent.subscription_details.subscription`.
- Apos `invoice.paid`, confirmar que `partner_subscriptions.status`, `current_period_start` e `current_period_end` foram reconciliados com a Subscription Stripe; parceiro pago nao deve ficar preso ao fim do trial local.
- Alteracao de Clientes ativos e `billing-sync-active-clients` com `proration_behavior=none`.
- `billing-sync-active-clients` deve ser chamado apenas por processo interno usando Bearer da service role local; nunca pelo browser.
- Antes de analisar invoices/snapshots de quantidade, confirmar que o sync processou jobs coalescidos por Parceiro para evitar duplicidade de updates no mesmo run.
- Confirmar `partner_subscription_financial_summaries` apos checkout com cupom e apos webhook `customer.subscription.updated`: subtotal, desconto e total devem refletir preview oficial da Stripe.
- Customer Portal e cancelamento.
- `/parceiros/configuracoes/assinatura`.
- `/admin/financeiro`.

## Validacao Final

```bash
SUPABASE_NO_TELEMETRY=1 DO_NOT_TRACK=1 npx supabase test db
npm run test
npm run lint
npm run build
npm run git:local -- diff --check
```

Para Edge Functions:

```bash
deno check supabase/functions/billing-create-setup-intent/index.ts
deno check supabase/functions/billing-create-subscription/index.ts
deno check supabase/functions/billing-sync-active-clients/index.ts
deno check supabase/functions/billing-customer-portal/index.ts
deno check supabase/functions/stripe-bootstrap-catalog/index.ts
deno check supabase/functions/stripe-reconcile-catalog/index.ts
deno check supabase/functions/stripe-webhook/index.ts
```

## Troubleshooting

- `STRIPE_NOT_CONFIGURED`: conferir arquivo de env usado por `functions serve`.
- Webhook 400: conferir secret do listener local e corpo bruto.
- Falha de telemetria Supabase CLI no Windows: repetir com `SUPABASE_NO_TELEMETRY=1 DO_NOT_TRACK=1`.
- `LOOKUP_KEY_CONFLICT`: nao criar novo Price silenciosamente; corrigir catalogo Stripe test ou documentar substituicao.
- Evento antigo nao aplicado: verificar `partner_subscriptions.stripe_last_event_created_at`.

## Limpeza

Ao final de um run E2E real, cancelar assinaturas e remover recursos criados somente quando tiverem `metadata.test_run_id` do run atual. Nunca apagar Products ou Prices oficiais.
