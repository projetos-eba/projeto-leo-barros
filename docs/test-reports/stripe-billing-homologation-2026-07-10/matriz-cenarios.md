# Matriz De Cenarios

| ID | Cenario | Tipo | Resultado | Evidencia | Status |
|---|---|---|---|---|---|
| CAT-001 | Validar chaves Stripe como test mode sem imprimir valores | Real Stripe | Prefixos locais corretos; nenhum valor sensivel registrado | Checagem sanitizada | PASS |
| CAT-002 | Validar Products e Prices oficiais por API | Real Stripe | 2 Products e 3 Prices ativos com `livemode=false` | `resource-manifest.json` | PASS |
| CAT-003 | Validar lookup keys sem conflito ativo | Real Stripe | 1 Price ativo por lookup key | `npm run test:billing:stripe` | PASS |
| UI-001 | Ajustar `/planos` | Frontend | Gap de 16px entre adicional e CTA; cards de confianca no pagamento | Screenshots MCP e teste de contrato | PASS |
| UI-002 | `/planos` 1440, 1280, 768, 390, 375 | Playwright MCP | Sem overflow horizontal, textos e CTA legiveis | `screenshots/planos-*.png` | PASS |
| SEC-001 | Proteger sync interno | Edge Function | POST sem auth nao processa; com service role processa | Curl local, contrato estatico | PASS |
| E2E-001 | Checkout Mensal real | Payment Element | SetupIntent + Subscription real `trialing` | `e2e-monthly-*` | PASS |
| E2E-002 | Checkout Anual real | Payment Element | Mixed intervals: base anual + adicional mensal | `e2e-annual-*` | PASS |
| E2E-003 | Webhook real | Stripe CLI | Eventos assinados chegaram ao ledger | `stripe_webhook_events` | PASS |
| E2E-004 | Cartao recusado | Payment Element | Permaneceu no checkout; assinatura local = 0 | `e2e-declined-card-result.json` | PASS |
| E2E-005 | Customer Portal | Edge Function + Stripe | Sessao real retornada para `billing.stripe.com` | `e2e-customer-portal-result.json` | PASS |
| E2E-006 | Cancelamento agendado | Stripe API + webhook | `cancel_at_period_end=true` local e Stripe | `e2e-cancel-at-period-end-stripe.json` | PASS parcial |
| QTY-001 | Clientes ativos 10 | Banco + Stripe | Checkout mensal criou adicional com quantidade 10 | `e2e-monthly-stripe-subscription.json` | PASS |
| QTY-002 | Clientes ativos 12 | Banco + Stripe | Sync atualizou adicional para 12 | `e2e-monthly-quantity-after-add.json` | PASS parcial |
| QTY-003 | Clientes ativos 9 | Banco + Stripe | Sync final atualizou adicional para 9 | `e2e-monthly-quantity-final-9.json` | PASS parcial |
| QTY-004 | Jobs duplicados de outbox | Edge Function | Coalesce por Parceiro, `processedPartners=1` | `e2e-monthly-quantity-coalesced-final.json` | PASS |
| PROR-001 | Sem proration | Stripe API | Nenhuma invoice com valor positivo; `proration_behavior=none` no codigo | invoice details | PASS parcial |
| PROR-002 | Ausencia total de invoice extra | Stripe API | Stripe gerou invoices zero durante trial | invoice details | FAIL parcial |
| CUP-001 | Cupom real | Stripe | Nao identificado cupom de teste nos arquivos analisados | Sem evidencia | BLOCKED |
| 3DS-001 | 3D Secure | Payment Element | Nao executado | Sem evidencia | BLOCKED |
| CLOCK-001 | Fim de trial/renovacao/falha futura | Test Clock | Nao executado | Sem evidencia | BLOCKED |
| CLEAN-001 | Limpeza de recursos E2E | Stripe | Assinaturas E2E marcadas `cancel_at_period_end=true` | cancel artifacts | PASS parcial |
