# Arquitetura Billing Stripe

Data de referencia: 10 de julho de 2026.

## Objetivo

Preparar o Projeto Leo Barros para cobrar o Parceiro por assinatura do Plano Completo e por Clientes ativos adicionais, sem cobrar o Cliente diretamente.

## Catalogo

- Plano Completo mensal: `complete-monthly`, `complete_monthly_brl`, R$ 119,90 por mes.
- Plano Completo anual: `complete-annual`, `complete_annual_brl`, R$ 1.198,80 por ano, exibido como R$ 99,90/mes.
- Cliente ativo adicional: `active-client-monthly`, `active_client_monthly_brl`, R$ 1,99/mes por unidade.
- Trial: 7 dias, protegido por `partner_billing_trial_usage`.
- Catalogo Stripe homologado em modo teste:
  - Produto principal: `prod_UrR2wxpxk9UJxV`.
  - Mensal: `price_1TriAiPELBIpM2MneLhOLwW4`.
  - Anual: `price_1TriAiPELBIpM2Mn7s4EpKt5`.
  - Produto adicional: `prod_UrRGM5chV5eXLU`.
  - Adicional: `price_1TriNoPELBIpM2MnQRkRINCT`.

## Fluxo

1. Parceiro seleciona plano em `/planos`.
2. `/parceiros/checkout` recalcula Clientes ativos no banco.
3. Edge Function `billing-create-setup-intent` cria ou reutiliza Customer e cria um SetupIntent novo para a tentativa atual de checkout. A idempotencia fica restrita a `checkout_attempt_id`, nunca a `partner_id + plan_slug`.
4. Antes do cartao, Edge Function `billing-preview-subscription` valida Promotion Code, recalcula Clientes ativos e usa `stripe.invoices.createPreview` para retornar subtotal, desconto e total seguro para exibicao.
5. Payment Element confirma o SetupIntent no navegador.
6. Edge Function `billing-create-subscription` valida SetupIntent, ownership, trial e Promotion Code. Se a assinatura falhar depois do SetupIntent confirmado, o frontend deve retentar apenas esta Edge Function com o mesmo `setupIntentId`, sem reconfirmar o Payment Element. O navegador envia somente o codigo digitavel (`promotionCode`); Coupon ID, Promotion Code ID, percentual, valor e desconto calculado sao rejeitados.
7. Assinatura e criada server-side via Subscriptions API com `billing_mode[type]=flexible`, API `2026-06-24.dahlia`.
8. Webhook `stripe-webhook` reconcilia status, invoice, snapshots e o read model `partner_subscription_financial_summaries`.
9. `billing-sync-active-clients` processa outbox somente com Bearer da service role e atualiza quantidade com `proration_behavior=none`.

## Layout E UI

- `/parceiros/checkout`, `/parceiros/checkout/sucesso` e `/parceiros/configuracoes/assinatura` usam shell independente de billing quando nao ha entitlement financeiro, sem menu operacional de Parceiros.
- Parceiro com assinatura `trialing` ou `active` usa shell proprio de Configuracoes em `/parceiros/configuracoes/**`.
- A ausencia do menu nao altera seguranca: as rotas seguem autenticadas e restritas a Parceiro ativo administrativamente.
- Payment Element usa Stripe Appearance em tema escuro para integrar inputs, foco, bordas e mensagens ao visual do Projeto Leo Barros.
- O checkout apresenta a forma de pagamento como opcao selecionavel antes dos campos; a opcao Cartao de credito ou debito abre o Payment Element. A selecao visual nao fixa `payment_method_types`; a elegibilidade real continua vindo dos metodos dinamicos da Stripe.
- Cada montagem do Payment Element gera uma tentativa propria de checkout. Reutilizar SetupIntent por Parceiro e plano e proibido, pois uma segunda confirmacao de SetupIntent ja concluido falha no Stripe.
- A tela deve bloquear submissao concorrente e, apos SetupIntent confirmado, deve retentar somente a criacao da assinatura em caso de erro transiente.
- Codigo promocional fica no card de resumo/subtotal do checkout e continua sendo validado por acao explicita antes da criacao da assinatura.
- Mensagens de confianca no checkout devem ser comerciais e claras: Pagamento seguro, Processado pela Stripe e Dados protegidos.
- A tela de assinatura usa `src/lib/billing/presentation.ts` para status pt-BR, datas em formato `dd/MM/yyyy`, pagamentos e periodo de teste. Valores de desconto e total sincronizado vêm de `partner_subscription_financial_summaries` quando disponiveis. Enums tecnicos permanecem apenas no banco, Stripe e logs seguros.
- A UI final nao deve exibir mensagens de desenvolvimento ou implementacao como backend, Edge Function, webhook, read model, SetupIntent, sincronizacao interna, credenciais, nomes de tabela ou estado reconciliado.

## Webhook E Pagamentos

- `customer.subscription.created`, `customer.subscription.updated` e `customer.subscription.deleted` atualizam status local da assinatura.
- `invoice.finalized` captura snapshot da quantidade de Clientes ativos usada para cobranca.
- `customer.subscription.created` e `customer.subscription.updated` atualizam `partner_subscription_financial_summaries` com preview oficial da proxima cobranca da assinatura.
- `invoice.paid`, `invoice.payment_failed` e `invoice.payment_action_required` atualizam status financeiro e registram `billing_payments` quando o evento traz `payment_intent`.
- Eventos desconhecidos sao registrados como `ignored`.
- Eventos duplicados retornam 2xx sem novo efeito de negocio.
- `partner_subscriptions.stripe_last_event_created_at` impede que evento antigo sobrescreva estado mais recente.

## Fonte Canonica De Quantidade

`billing_active_client_count(target_partner_id)` usa:

```sql
count(distinct patient_id)
```

Somente `partner_clients.status = 'active'` entra na contagem. Escopos duplicados do mesmo Cliente contam uma vez.

## Zero Clientes

A estrategia implementada preserva item licenciado com quantidade `0` quando ele ja existe. Se a assinatura remota ainda nao tiver item adicional e a quantidade for zero, a Edge Function nao cria item desnecessario. Essa escolha evita cobranca ficticia e segue a documentacao de quantidades licenciadas do Stripe.

## Sem Proporcionalidade

Toda sincronizacao usa quantidade total recalculada e `proration_behavior: "none"`. Nao ha incremento/decremento cego, invoice item manual ou ajuste proporcional.

`billing-sync-active-clients` e um endpoint interno: exige `Authorization: Bearer <service role local>` alem de CORS/origin quando `Origin` esta presente. O navegador nunca deve chamar essa funcao. A funcao coalesce jobs pendentes por Parceiro antes de chamar Stripe, evitando updates e snapshots duplicados para a mesma quantidade.

## Catalogo E Credenciais

As Edge Functions nao criam cliente Stripe no topo do modulo. Sem `STRIPE_SECRET_KEY` ou `STRIPE_WEBHOOK_SECRET`, retornam `STRIPE_NOT_CONFIGURED` com HTTP 503.

`BILLING_ALLOWED_ORIGINS` define os origins autorizados a chamar as Edge Functions de billing pelo navegador. O valor e uma lista separada por virgulas, sem barra final e contendo protocolo, host e porta quando houver. Localmente, usar `http://localhost:3000`. Em producao, usar somente o dominio publico HTTPS do app, por exemplo `https://app.exemplo.com`; incluir dominios de preview apenas quando eles precisarem executar checkout real.

`stripe-bootstrap-catalog` nao cria Products nem Prices. Em test mode, a funcao valida os IDs oficiais homologados; em live mode, valida Products e Prices ativos por `lookup_key`, valores, moeda, intervalo, tipo de uso e nomes oficiais de Product, gravando os IDs reais do ambiente no catalogo local.

Mensal e anual podem compartilhar o mesmo Stripe Product em `billing_plans.stripe_product_id`. A unicidade operacional do catalogo fica em `stripe_price_id` e `lookup_key`, porque cada plano comercial e representado por um Price distinto.

`test:billing:stripe` executa validacao real do catalogo somente com `RUN_STRIPE_E2E=1` e continua restrito a chaves test mode.

## Escopo De RPC E RLS

- `billing_active_client_count` roda como `security invoker` para chamadas autenticadas respeitarem RLS.
- `billing_partner_trial_available` fica restrita a `service_role`; o frontend nao decide elegibilidade de trial.
- `billing_sync_outbox` e `stripe_webhook_events` nao expõem leitura ao usuario final e possuem policy explicita apenas para `service_role`.
- Policies SELECT de tabelas de billing combinam acesso Admin ou proprio Parceiro em uma unica policy por tabela para evitar policies permissivas duplicadas.
- `billing_public_plans` nao e dependencia da pagina publica `/planos`; a UI publica usa catalogo local seguro.

## Referencias Stripe

- Mixed intervals e flexible billing mode: https://docs.stripe.com/billing/subscriptions/mixed-interval
- Billing mode: https://docs.stripe.com/billing/subscriptions/billing-mode
- SetupIntent: https://docs.stripe.com/api/setup_intents
- Quantidades: https://docs.stripe.com/billing/subscriptions/quantities
