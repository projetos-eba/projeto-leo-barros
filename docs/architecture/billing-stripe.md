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
3. Edge Function `billing-create-setup-intent` cria ou reutiliza Customer e cria SetupIntent.
4. Payment Element confirma o SetupIntent no navegador.
5. Edge Function `billing-create-subscription` valida SetupIntent, ownership, trial e Promotion Code.
6. Assinatura e criada server-side via Subscriptions API com `billing_mode[type]=flexible`, API `2026-06-24.dahlia`.
7. Webhook `stripe-webhook` reconcilia status, invoice e snapshots.
8. `billing-sync-active-clients` processa outbox somente com Bearer da service role e atualiza quantidade com `proration_behavior=none`.

## Webhook E Pagamentos

- `customer.subscription.created`, `customer.subscription.updated` e `customer.subscription.deleted` atualizam status local da assinatura.
- `invoice.finalized` captura snapshot da quantidade de Clientes ativos usada para cobranca.
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

`stripe-bootstrap-catalog` nao cria Products nem Prices. A funcao valida os IDs oficiais existentes, reconcilia apenas nome mutavel de Product quando seguro e grava os IDs no catalogo local.

`test:billing:stripe` executa validacao real do catalogo somente com `RUN_STRIPE_E2E=1` e aborta com qualquer chave live.

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
