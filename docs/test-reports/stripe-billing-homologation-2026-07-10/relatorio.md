# Homologacao Stripe Billing - 2026-07-10

## Ambiente

- Stripe test mode confirmado por API real.
- Supabase local resetado e validado.
- Next.js 16.2.2 identificado localmente.
- Playwright disponivel no projeto.
- Stripe CLI instalado nao foi mantido em listener E2E completo nesta execucao.

## Catalogo

Validado com `RUN_STRIPE_E2E=1 npm run test:billing:stripe`:

- `prod_UrR2wxpxk9UJxV`: `livemode=false`, ativo.
- `price_1TriAiPELBIpM2MneLhOLwW4`: `livemode=false`, ativo, BRL 11990, mensal, lookup unica.
- `price_1TriAiPELBIpM2Mn7s4EpKt5`: `livemode=false`, ativo, BRL 119880, anual, lookup unica.
- `prod_UrRGM5chV5eXLU`: `livemode=false`, ativo.
- `price_1TriNoPELBIpM2MnQRkRINCT`: `livemode=false`, ativo, BRL 199, mensal, `licensed`, `per_unit`, lookup unica.

O nome mutavel do produto principal foi reconciliado para o nome oficial no Stripe test mode. Nenhum Product ou Price foi criado, arquivado ou excluido.

## Correcoes

- API Stripe atualizada para `2026-06-24.dahlia`.
- SetupIntent deixou de fixar `payment_method_types`.
- Bootstrap de catalogo passou a validar IDs oficiais existentes em vez de criar catalogo.
- Funcoes autenticadas de billing passaram a rejeitar origem nao permitida quando `Origin` esta presente.
- Criacao de assinatura passou a validar catalogo oficial antes da Subscriptions API e persistir `partner_subscription_items`.
- Webhook passou a registrar eventos ignorados, rejeitar livemode, preservar idempotencia e impedir overwrite por eventos antigos.
- Migration adicionou `stripe_event_created_at` e `stripe_last_event_created_at`.
- Script `test:billing:stripe` criado com flag explicita `RUN_STRIPE_E2E=1`.

## Validacao Executada

- `npm run test`: PASS antes das correcoes, 153 testes.
- `npm run lint`: PASS com 7 warnings preexistentes de Fast Refresh em componentes UI.
- `RUN_STRIPE_E2E=1 BILLING_RECONCILE_PRODUCT_NAMES=1 npm run test:billing:stripe`: PASS.
- `npx supabase db reset`: PASS.
- `SUPABASE_NO_TELEMETRY=1 DO_NOT_TRACK=1 npx supabase test db`: PASS, 381 testes.
- `deno check` nas Edge Functions de billing e webhook: PASS apos correcao da funcao de assinatura.
- Teste focal `npm run test -- src/lib/billing/stripe-edge-contract.test.ts src/lib/billing/pricing.test.ts src/lib/admin/financial-metrics.test.ts`: PASS, 9 testes.
- Playwright smoke `/planos` desktop/mobile via `npx next start -p 3010`: PASS, screenshots em `screenshots/desktop-planos.png` e `screenshots/mobile-planos.png`.

## Bloqueios / Nao Concluido

Nao foi concluida homologacao E2E completa com Stripe Elements real, Stripe CLI listener mantido, webhooks reais de assinatura, Test Clocks, cancelamento, 3DS, Customer Portal e limpeza de assinaturas criadas pelo fluxo. Portanto este run nao deve ser tratado como PASS integral do criterio de aceite E2E completo.

## Evidencias

- `resource-manifest.json`: manifesto sanitizado dos recursos oficiais validados.
