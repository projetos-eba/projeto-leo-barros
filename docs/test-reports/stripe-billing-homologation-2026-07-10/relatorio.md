# Homologacao Stripe Billing - 2026-07-10

## Resumo

Run local de homologacao real em Stripe test mode para Billing com Payment Element, SetupIntent, Subscriptions API, webhook assinado, mixed intervals, pagina `/planos` e sincronizacao de Clientes ativos.

Nao declarar como homologacao completa: Test Clocks, 3DS, falha futura de pagamento, cupom real e cancelamento efetivo por avanco de tempo permanecem sem evidencia completa neste run.

## Ambiente

- Stripe test mode: confirmado por API, todos os recursos consultados com `livemode=false`.
- Supabase local: `http://127.0.0.1:54321`.
- Next.js local: `http://localhost:3011`.
- Edge Functions local: `supabase functions serve` com signing secret temporario do `stripe listen`.
- Stripe CLI: listener ativo durante os checkouts reais.
- Playwright MCP: usado para screenshots e snapshots de `/planos`.
- Playwright programatico: usado para fluxos reais de checkout com Payment Element.
- Traces Playwright foram capturados durante o run, mas descartados do artefato final porque podem conter `client_secret` de SetupIntent.

## Cenarios

| Cenario | Resultado | Evidencia |
|---|---:|---|
| Catalogo oficial | PASS | `resource-manifest.json`, `RUN_STRIPE_E2E=1 npm run test:billing:stripe` |
| `/planos` desktop/tablet/mobile | PASS | `screenshots/planos-1440x900.png`, `planos-1280x800.png`, `planos-768x1024.png`, `planos-390x844.png`, `planos-375x812.png` |
| Mensal real | PASS | `e2e-monthly-browser-result.json`, `e2e-monthly-stripe-subscription.json`, screenshots `e2e-monthly-*` |
| Anual real mixed intervals | PASS | `e2e-annual-browser-result.json`, `e2e-annual-stripe-subscription.json`, screenshots `e2e-annual-*` |
| Trial com metodo salvo | PASS | Assinaturas `trialing`, `trial_start/trial_end=true`, invoices de trial total zero |
| Webhook real assinado | PASS | Ledger com `setup_intent.succeeded`, `customer.subscription.created`, `invoice.created`, `invoice.finalized`, `invoice.paid`, `customer.subscription.updated` |
| Clientes ativos 10 -> 12 -> 9 | PASS parcial | Stripe e banco chegaram a 9; sem invoice de valor positivo; Stripe gerou invoices zero de `subscription_update` durante trial |
| Sem proration | PASS parcial | `proration_behavior=none`; invoices geradas tinham `total=0`; resíduo: Stripe cria invoices zero durante trial |
| Cartao recusado | PASS | `e2e-declined-card-result.json`, `subscriptions_for_declined_fixture=0` |
| Customer Portal | PASS | `e2e-customer-portal-result.json` com host `billing.stripe.com`, sem URL persistida |
| Cancelamento agendado | PASS parcial | `cancel_at_period_end=true` em mensal e anual; cancelamento efetivo por Test Clock nao executado |
| Cupom | BLOCKED | Nao identificado cupom real de teste nos arquivos analisados. |
| 3DS | BLOCKED | Challenge 3DS nao executado neste run. |
| Falha futura | BLOCKED | Test Clock/Simulation nao executado neste run. |
| Renovacao | BLOCKED | Test Clock/Simulation nao executado neste run. |

## Falhas Corrigidas

### Espacamento e rodape de `/planos`

Problema: a faixa `+ R$ 1,99/mes por Cliente ativo` podia ficar colada no CTA do card anual; os cards do rodape ainda falavam de trial/clientes/proration.

Causa: CTA usava `mt-auto` diretamente apos a faixa, sem uma area inferior estruturada; conteudo do rodape nao refletia confianca no pagamento.

Correcao: card passou a separar conteudo principal e `footer` com `gap-4`; rodape passou a exibir Pagamento seguro, Processado pela Stripe e Dados protegidos.

Teste: `planos-page-contract.test.ts`; Playwright MCP nos cinco viewports; medicao automatizada confirmou gap de 16px e zero overflow horizontal.

Resultado: PASS.

### Sync interno exposto demais

Problema: `billing-sync-active-clients` usava service role internamente, mas nao exigia Bearer interno alem de CORS/origin.

Causa: endpoint aceitava POST permitido por origem sem validar credencial de processo interno.

Correcao: adicionada `requireServiceRoleRequest`; sync agora exige `Authorization: Bearer <service role>`.

Teste: POST sem Authorization nao processa; POST com service role retorna 200; contrato estatico e Deno check.

Resultado: PASS.

### Jobs duplicados de quantidade

Problema: multiplos outbox jobs do mesmo Parceiro causavam varios updates Stripe, snapshots duplicados e invoices zero duplicadas.

Causa: loop processava cada job individualmente mesmo quando todos representavam a mesma quantidade final canonica.

Correcao: `billing-sync-active-clients` coalesce jobs por `partner_id`, chama Stripe uma vez por Parceiro e marca todos os jobs daquele Parceiro como concluidos.

Teste: inseridos jobs duplicados artificiais; sync retornou `processedPartners: 1`; quantidade Stripe final reconciliada.

Resultado: PASS com resíduo Stripe: cada update real durante trial ainda gera invoice zero.

## Evidencias

- Mensal: `sub_1TrkUwPELBIpM2Mn6zr6M6XH`, status `trialing`, base `complete_monthly_brl`, adicional `active_client_monthly_brl`.
- Anual: `sub_1TrkXMPELBIpM2Mnq3zmNHS9`, status `trialing`, base anual `complete_annual_brl`, adicional mensal `active_client_monthly_brl`, `billing_mode=flexible`.
- Portal: sessao criada para host `billing.stripe.com`; URL completa nao persistida.
- Cancelamento: `cancel_at_period_end=true` para as assinaturas E2E mensal e anual.

## Testes

| Comando | Resultado |
|---|---|
| `RUN_STRIPE_E2E=1 npm run test:billing:stripe` | PASS |
| `SUPABASE_NO_TELEMETRY=1 DO_NOT_TRACK=1 npx supabase test db` | PASS, 381 testes |
| `deno check` nas Edge Functions de billing/webhook | PASS |
| `npm run test -- src/lib/billing/stripe-edge-contract.test.ts src/app/planos/planos-page-contract.test.ts` | PASS |
| `npm run test` | FAIL por timeout em 2 testes fora do escopo alterado; 159 testes passaram |
| `npm run test -- src/app/cliente/dieta/client-diet-view.test.tsx src/app/parceiros/clientes/[id]/partner-client-workout-view.test.tsx` | PASS no rerun focal, 4 testes |
| `npm run lint` | PASS com 7 warnings preexistentes de Fast Refresh em `src/components/ui/**` |
| `npm run build` | PASS |
| `git diff --check` | PASS, somente avisos CRLF |

## Riscos Residuais

- Stripe gera invoices zero de `subscription_update` ao mudar quantidade durante trial. Nao houve cobranca, credito, debito ou invoice com valor positivo, mas isso nao satisfaz literalmente o criterio "ausencia de invoice extra".
- Test Clocks/Simulations nao foram executados; renovacao, fim de trial, falha futura e cancelamento efetivo seguem sem evidencia.
- `setup_intent.succeeded`, `invoice.created` e `invoice.upcoming` sao ledgerizados como `ignored`; isso esta consistente com o contrato atual, mas deve ser decisao explicita antes de producao.
- Fluxo 3DS e cupom real nao foram homologados.

## Limpeza

- Nenhum Product ou Price oficial foi criado, apagado, arquivado ou duplicado.
- Assinaturas E2E criadas em test mode foram marcadas com `cancel_at_period_end=true`.
- Secrets temporarios do listener nao foram registrados no relatorio.
