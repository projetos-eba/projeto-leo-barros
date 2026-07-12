# Page Profile - Parceiros Checkout

Rota: `/parceiros/checkout`

## Objetivo

Permitir que Parceiro ativo, mesmo sem entitlement financeiro, salve metodo de pagamento e inicie periodo de teste.

## Regras

- Requer `profiles.role = parceiro` e `profiles.status = active`.
- Nao exige assinatura ativa para acessar.
- Usa layout independente de billing, sem menu operacional de Parceiros.
- Backend recalcula Clientes ativos.
- Frontend nao envia valor, Price ID, quantidade, trial, Coupon ID, Promotion Code ID, percentual ou valor de desconto.
- Sem Stripe configurado, exibe estado seguro de pagamentos em configuracao.
- Zero Clientes ativos deve exibir adicional R$ 0,00 e nao criar cobranca ficticia.

## Stripe

- Payment Element.
- Aparencia configurada via Stripe Appearance para tema escuro.
- SetupIntent.
- Assinatura criada por Edge Function `billing-create-subscription`.
- Codigo promocional digitado pelo usuario e enviado como `promotionCode`; a Edge Function normaliza, limita tamanho, resolve Promotion Code ativo na Stripe e aplica o ID internamente.
- Mixed intervals com `billing_mode=flexible`.
- `proration_behavior=none`.

## Conteudo

- Cards de confianca: Pagamento seguro, Processado pela Stripe e Dados protegidos.
- Nao exibir detalhes tecnicos como SetupIntent, backend ou contagem recalculada em texto de rodape para o usuario final.
