# Page Profile - Parceiros Assinatura

Rota: `/parceiros/configuracoes/assinatura`

## Objetivo

Exibir plano, status, trial, renovacao, Clientes ativos, estimativa e cobrancas do Parceiro.

## Dados

- `partner_subscriptions`
- `billing_plans`
- `billing_payments`
- `billing_active_client_count`

## Estados

- Sem assinatura.
- Trial/ativa.
- Pagamento pendente ou falho.
- Cancelada.
- Stripe nao configurado.

## Portal

Customer Portal fica preparado via Edge Function, mas depende de credenciais e configuracao Stripe para uso real.
