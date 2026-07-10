# Page Profile - Parceiros Checkout

Rota: `/parceiros/checkout`

## Objetivo

Permitir que Parceiro ativo, mesmo sem entitlement financeiro, salve metodo de pagamento e inicie trial.

## Regras

- Requer `profiles.role = parceiro` e `profiles.status = active`.
- Nao exige assinatura ativa para acessar.
- Backend recalcula Clientes ativos.
- Frontend nao envia valor, Price ID, quantidade ou trial.
- Sem Stripe configurado, exibe estado seguro de pagamentos em configuracao.

## Stripe

- Payment Element.
- SetupIntent.
- Assinatura criada por Edge Function `billing-create-subscription`.
- Mixed intervals com `billing_mode=flexible`.
- `proration_behavior=none`.
