---
name: leo-billing-stripe
description: Maintain and evolve the Projeto Leo Barros billing domain, including plans, Partner subscriptions, Stripe Payment Element checkout, mixed interval subscriptions, trials, active Client billing, Promotion Codes, webhooks, financial entitlements, Admin Financeiro integration, Supabase schema, Edge Functions and local validation.
---

# Leo Billing Stripe

## Objetivo

Manter o dominio de billing do Projeto Leo Barros: planos comerciais, checkout, assinatura do Parceiro, cobranca por Cliente ativo, Stripe, webhooks, entitlement financeiro e Admin Financeiro.

## Quando usar

Obrigatoria para qualquer alteracao relacionada a planos, preco, trial, checkout, Stripe, Customer, Payment Element, SetupIntent, Subscription, Subscription Item, cupom, Promotion Code, webhook, invoice, pagamento, cobranca, Cliente ativo, entitlement ou Admin Financeiro.

## Required Reading

1. `AGENTS.md`
2. `docs/architecture/billing-stripe.md`
3. `docs/adr/stripe-mixed-interval-checkout.md`
4. `docs/page-profiles/planos.md`
5. `docs/page-profiles/parceiros-checkout.md`
6. `docs/page-profiles/parceiros-assinatura.md`
7. `docs/page-profiles/admin-financeiro.md`
8. `supabase/migrations/20260709220000_billing_stripe_architecture.sql`
9. `supabase/migrations/20260710110548_billing_stripe_security_hardening.sql`
10. `supabase/migrations/20260710110622_billing_stripe_rpc_scope_hardening.sql`
11. `supabase/migrations/20260710110939_billing_stripe_policy_performance.sql`
12. `supabase/functions/**/index.ts`
13. `src/lib/billing/**`
14. `docs/runbooks/stripe-homologation.md`

## Regras Imutaveis

- Parceiro paga; Cliente nao paga.
- Mensal R$ 119,90.
- Anual R$ 1.198,80, equivalente a R$ 99,90/mes.
- Adicional R$ 1,99 por Cliente ativo.
- Trial de 7 dias, uma vez por Parceiro.
- Sem proporcionalidade.
- Contagem distinta por `patient_id`.
- Quantidade calculada no backend.
- Sync de quantidade deve coalescer jobs por Parceiro antes de chamar Stripe para evitar atualizacoes e snapshots duplicados.
- Payment Element + SetupIntent.
- Assinatura criada pela Subscriptions API.
- Mixed intervals exigem `billing_mode=flexible`.
- Webhook reconcilia estado local.
- `profiles.status` nao representa inadimplencia.
- Secrets nunca no browser.
- `billing-sync-active-clients` e interno e exige Bearer da service role; o browser nao pode acionar sincronizacao global de outbox.
- Nunca confiar em Price ID, quantidade, valor ou trial vindo do cliente.
- SetupIntent deve omitir `payment_method_types`; usar metodos dinamicos Stripe.
- `stripe-bootstrap-catalog` valida catalogo oficial existente e nao cria Products/Prices.
- RPC de trial fica restrito a `service_role`.
- Contagem faturavel via RPC autenticada deve respeitar RLS.

## Catalogo Stripe Homologado

- API Stripe: `2026-06-24.dahlia`.
- Produto principal: `prod_UrR2wxpxk9UJxV`, `Plano Completo — Nutrição + Treinamento`.
- Mensal: `price_1TriAiPELBIpM2MneLhOLwW4`, `complete_monthly_brl`, BRL 11990, `month`.
- Anual: `price_1TriAiPELBIpM2Mn7s4EpKt5`, `complete_annual_brl`, BRL 119880, `year`.
- Produto adicional: `prod_UrRGM5chV5eXLU`, `Cliente ativo adicional`.
- Adicional: `price_1TriNoPELBIpM2MnQRkRINCT`, `active_client_monthly_brl`, BRL 199, `month`, `licensed`, `per_unit`.
- IDs oficiais podem existir server-side para validacao/homologacao; nunca enviar Price ID pelo browser.
- Validar catalogo real com `RUN_STRIPE_E2E=1 npm run test:billing:stripe`.
- Reconciliar apenas nome mutavel de Product com `RUN_STRIPE_E2E=1 BILLING_RECONCILE_PRODUCT_NAMES=1 npm run test:billing:stripe`.

## Arquivos Criticos

- `src/lib/billing/catalog.ts`
- `src/lib/billing/pricing.ts`
- `src/lib/billing/data.ts`
- `src/lib/billing/entitlement.ts`
- `src/app/planos/page.tsx`
- `src/app/parceiros/checkout/**`
- `src/app/parceiros/configuracoes/assinatura/page.tsx`
- `src/app/parceiros/layout.tsx`
- `src/lib/admin/financial-*.ts`
- `supabase/migrations/20260709220000_billing_stripe_architecture.sql`
- `supabase/migrations/20260710110548_billing_stripe_security_hardening.sql`
- `supabase/migrations/20260710110622_billing_stripe_rpc_scope_hardening.sql`
- `supabase/migrations/20260710110939_billing_stripe_policy_performance.sql`
- `supabase/functions/_shared/billing/stripe.ts`
- `supabase/functions/billing-create-setup-intent/index.ts`
- `supabase/functions/billing-create-subscription/index.ts`
- `supabase/functions/billing-sync-active-clients/index.ts`
- `supabase/functions/billing-customer-portal/index.ts`
- `supabase/functions/stripe-bootstrap-catalog/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

## UI De Planos

- `/planos` deve preservar os slugs `complete-monthly` e `complete-annual` nos CTAs.
- Cards de plano devem manter a faixa `+ R$ 1,99/mes por Cliente ativo` visualmente separada do CTA por estrutura de layout, sem colar no botao em desktop, tablet ou mobile.
- O rodape de `/planos` deve focar confianca no pagamento: Pagamento seguro, Processado pela Stripe e Dados protegidos, sem prometer seguranca absoluta ou certificacao nao comprovada.

## Event Matrix

- `customer.subscription.created`: registra status local.
- `customer.subscription.updated`: atualiza status, periodos, trial e cancelamento.
- `customer.subscription.deleted`: marca assinatura cancelada.
- `invoice.finalized`: registra snapshot de Clientes ativos usado na cobranca.
- `invoice.payment_failed`: marca assinatura como `past_due` e registra pagamento `failed` quando houver PaymentIntent.
- `invoice.payment_action_required`: marca assinatura como `past_due` e registra pagamento `pending` quando houver PaymentIntent.
- Eventos desconhecidos: registrar como `ignored` e retornar 2xx.
- Eventos duplicados: retornar 2xx sem novo efeito de negocio.
- Eventos fora de ordem: comparar `event.created` com `partner_subscriptions.stripe_last_event_created_at`.

## Stripe CLI Local

```bash
stripe listen --events setup_intent.succeeded,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,customer.subscription.paused,customer.subscription.resumed,customer.subscription.trial_will_end,invoice.upcoming,invoice.created,invoice.finalized,invoice.finalization_failed,invoice.paid,invoice.payment_failed,invoice.payment_action_required,invoice.updated --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook
```

O `whsec_...` do listener local pode divergir do Dashboard. Nao documentar o valor; atualizar apenas o runtime local e reiniciar `supabase functions serve --env-file supabase/functions/.env`.
- `invoice.paid`: marca assinatura como `active` e registra pagamento `succeeded` quando houver PaymentIntent.

## Validacao

```bash
npx supabase test db
npm run test
npm run lint
npm run build
git diff --check
```

Adicionar validacoes Edge, Deno e Playwright desktop/mobile para mudancas em checkout, webhook, entitlement ou Admin Financeiro.
Para Edge Functions alteradas, executar `deno check supabase/functions/<nome>/index.ts`.

## Regra De Manutencao Obrigatoria

Sempre que uma alteracao modificar regra de negocio, preco, catalogo, trial, status, checkout, schema, Edge Function, evento Stripe, entitlement, calculo financeiro, estrategia de sincronizacao ou processo de homologacao, esta skill deve ser atualizada na mesma alteracao. Uma mudanca de billing nao esta concluida enquanto a skill e a documentacao relacionada estiverem desatualizadas.
