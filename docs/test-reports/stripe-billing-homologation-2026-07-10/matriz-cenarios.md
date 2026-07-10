# Matriz De Cenarios

| ID | Cenario | Tipo | Resultado | Evidencia | Status |
|---|---|---|---|---|---|
| CAT-001 | Validar chaves Stripe como test mode sem imprimir valores | Real Stripe | Prefixos locais `pk_test`, `sk_test`, `whsec`; processo sem env carregado diretamente | Saida sanitizada do comando de validacao | PASS |
| CAT-002 | Validar Products e Prices oficiais por API | Real Stripe | 2 Products e 3 Prices ativos com `livemode=false` | `resource-manifest.json` | PASS |
| CAT-003 | Validar lookup keys sem conflito ativo | Real Stripe | 1 Price ativo por lookup key | `npm run test:billing:stripe` | PASS |
| CAT-004 | Reconciliar nome mutavel do Product principal | Real Stripe | Nome atualizado em test mode, sem criar/apagar Product ou Price | `npm run test:billing:stripe` com `BILLING_RECONCILE_PRODUCT_NAMES=1` | PASS |
| DB-001 | Aplicar migrations locais | Supabase | Reset local aplicou `20260710162000_billing_stripe_real_homologation_hardening.sql` | `npx supabase db reset` | PASS |
| DB-002 | Testes SQL de billing/RLS/outbox/ledger | Supabase | 381 testes SQL passaram | `npx supabase test db` com telemetria desativada | PASS |
| EDGE-001 | Typecheck das Edge Functions de billing | Deno | Todas as funcoes checadas apos correcao | `deno check supabase/functions/.../index.ts` | PASS |
| UNIT-001 | Contratos unitarios de billing | Unitario | 9 testes focais passaram | Vitest focal | PASS |
| UI-001 | `/planos` desktop/mobile | Playwright | Renderizou valores, trial, adicional e sem erros de console | `screenshots/desktop-planos.png`, `screenshots/mobile-planos.png` | PASS |
| E2E-001 | Checkout real com Payment Element | E2E Real Stripe | Nao executado ponta a ponta neste run | Nao ha trace/screenshot novo | BLOCKED |
| E2E-002 | Webhooks reais via Stripe CLI listener | E2E Real Stripe | Nao executado ponta a ponta neste run | Nao ha evento recebido novo | BLOCKED |
| E2E-003 | Test Clocks, 3DS, cancelamento e Portal | E2E Real Stripe | Nao executado ponta a ponta neste run | Nao ha trace/screenshot novo | BLOCKED |
