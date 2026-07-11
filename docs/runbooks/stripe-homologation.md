# Runbook - Homologacao Stripe

Data de referencia: 10 de julho de 2026.

## Requisitos

- Usar somente Stripe test mode.
- Nunca imprimir `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, service role, JWT, client secret ou dados de cartao.
- Confirmar prefixos: `pk_test` para public key e `sk_test` ou `rk_test` para chave server-side.
- Abortar qualquer escrita se uma resposta Stripe retornar `livemode=true`.

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

O secret do `stripe listen` local normalmente e diferente do secret de endpoint cadastrado no Dashboard. Use o `whsec_...` mostrado pelo listener apenas no runtime local da Edge Function e nao o registre em docs.

## Validacao De Catalogo

```bash
RUN_STRIPE_E2E=1 npm run test:billing:stripe
```

Para reconciliar somente nomes mutaveis de Products no Stripe test mode:

```bash
RUN_STRIPE_E2E=1 BILLING_RECONCILE_PRODUCT_NAMES=1 npm run test:billing:stripe
```

## Processos Locais

1. `npm run db:start`
2. `npx supabase db reset`
3. `npx supabase functions serve --env-file supabase/functions/.env`
4. `npm run dev`
5. Iniciar Stripe CLI:

```bash
stripe listen --events setup_intent.succeeded,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,customer.subscription.paused,customer.subscription.resumed,customer.subscription.trial_will_end,invoice.upcoming,invoice.created,invoice.finalized,invoice.finalization_failed,invoice.paid,invoice.payment_failed,invoice.payment_action_required,invoice.updated --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook
```

Atualize `STRIPE_WEBHOOK_SECRET` do runtime local com o secret exibido pelo listener e reinicie `supabase functions serve`.

## Fluxos

- `/planos` desktop/mobile.
- Login Parceiro e preservacao de `next=/parceiros/checkout?plan=...`.
- `/parceiros/checkout` com Payment Element real.
- SetupIntent confirmado.
- Assinatura mensal e anual com `billing_mode=flexible`.
- Trial de 7 dias uma vez por Parceiro.
- Cupom valido e invalido.
- Cartao aprovado, recusado e 3DS de teste.
- Webhooks assinados, duplicados, invalidos e desconhecidos.
- Alteracao de Clientes ativos e `billing-sync-active-clients` com `proration_behavior=none`.
- `billing-sync-active-clients` deve ser chamado apenas por processo interno usando Bearer da service role local; nunca pelo browser.
- Antes de analisar invoices/snapshots de quantidade, confirmar que o sync processou jobs coalescidos por Parceiro para evitar duplicidade de updates no mesmo run.
- Customer Portal e cancelamento.
- `/parceiros/configuracoes/assinatura`.
- `/admin/financeiro`.

## Validacao Final

```bash
SUPABASE_NO_TELEMETRY=1 DO_NOT_TRACK=1 npx supabase test db
npm run test
npm run lint
npm run build
git diff --check
```

Para Edge Functions:

```bash
deno check supabase/functions/billing-create-setup-intent/index.ts
deno check supabase/functions/billing-create-subscription/index.ts
deno check supabase/functions/billing-sync-active-clients/index.ts
deno check supabase/functions/billing-customer-portal/index.ts
deno check supabase/functions/stripe-bootstrap-catalog/index.ts
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
