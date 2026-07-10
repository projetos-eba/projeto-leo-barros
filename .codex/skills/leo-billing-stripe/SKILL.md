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
- Payment Element + SetupIntent.
- Assinatura criada pela Subscriptions API.
- Mixed intervals exigem `billing_mode=flexible`.
- Webhook reconcilia estado local.
- `profiles.status` nao representa inadimplencia.
- Secrets nunca no browser.
- Nunca confiar em Price ID, quantidade, valor ou trial vindo do cliente.
- RPC de trial fica restrito a `service_role`.
- Contagem faturavel via RPC autenticada deve respeitar RLS.

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

## Event Matrix

- `customer.subscription.created`: registra status local.
- `customer.subscription.updated`: atualiza status, periodos, trial e cancelamento.
- `customer.subscription.deleted`: marca assinatura cancelada.
- `invoice.finalized`: registra snapshot de Clientes ativos usado na cobranca.
- `invoice.payment_failed`: marca assinatura como `past_due` e registra pagamento `failed` quando houver PaymentIntent.
- `invoice.payment_action_required`: marca assinatura como `past_due` e registra pagamento `pending` quando houver PaymentIntent.
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

## Regra De Manutencao Obrigatoria

Sempre que uma alteracao modificar regra de negocio, preco, catalogo, trial, status, checkout, schema, Edge Function, evento Stripe, entitlement, calculo financeiro, estrategia de sincronizacao ou processo de homologacao, esta skill deve ser atualizada na mesma alteracao. Uma mudanca de billing nao esta concluida enquanto a skill e a documentacao relacionada estiverem desatualizadas.
