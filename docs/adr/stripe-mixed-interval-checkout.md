# ADR - Checkout Stripe Com Mixed Intervals

Data: 09 de julho de 2026.

## Problema

O plano anual combina item-base anual com adicional mensal por Cliente ativo. Uma Checkout Session `mode=subscription` simples nao e a decisao final apropriada para controlar mixed intervals, trial unico, quantidade canonica e ownership.

## Opcoes Avaliadas

- Checkout Session: rapido, mas deixa a criacao da assinatura mista menos controlada.
- Embedded Checkout: valido como referencia visual, mas nao sera o fluxo final de assinatura.
- Payment Element + SetupIntent + Subscriptions API: separa coleta segura do metodo de pagamento da criacao server-side da assinatura.

## Decisao

Usar Stripe Payment Element com SetupIntent e criar a assinatura no backend pela Subscriptions API.

## Detalhes

- API Stripe fixada no codigo: `2025-06-30.basil`.
- Mixed intervals exigem `billing_mode[type]=flexible`.
- Trial de 7 dias com metodo de pagamento salvo previamente.
- Promotion Codes sao resolvidos no backend.
- Quantidade e sempre recalculada por `billing_active_client_count`.
- Atualizacoes de quantidade usam `proration_behavior=none`.
- Webhook assinado e ledger `stripe_webhook_events` cuidam da reconciliacao.

## Consequencias

- Requer bootstrap do catalogo antes da homologacao real.
- Customer Portal fica restrito a metodo de pagamento, dados de cobranca, faturas e cancelamento conforme configuracao Stripe.
- A alteracao de plano pelo Portal nao esta liberada ate existir teste especifico para mixed intervals.

## Riscos

- A homologacao real depende das credenciais Stripe.
- A configuracao final do Customer Portal precisa ser validada no Dashboard Stripe.
- A estrategia de item adicional com quantidade zero deve ser confirmada no ambiente Stripe de teste antes de producao.
