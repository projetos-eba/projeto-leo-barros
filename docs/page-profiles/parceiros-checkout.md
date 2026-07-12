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
- Preview de codigo promocional antes do cartao via Edge Function `billing-preview-subscription`, usando `stripe.invoices.createPreview`.
- Assinatura criada por Edge Function `billing-create-subscription`.
- Codigo promocional digitado pelo usuario e enviado como `promotionCode`; a Edge Function normaliza, limita tamanho, resolve Promotion Code ativo na Stripe e aplica o ID internamente.
- Mixed intervals com `billing_mode=flexible`.
- `proration_behavior=none`.

## Conteudo

- Cards de confianca: Pagamento seguro, Processado pela Stripe e Dados protegidos.
- Metodos de pagamento exibidos como opcoes selecionaveis; selecionar Cartao de credito ou debito abre o Payment Element no proprio card.
- Campo de codigo promocional no card de resumo/subtotal, com botao Aplicar, estado de loading, sucesso, erro e remocao.
- Resumo exibe subtotal, desconto e primeira cobranca apos o periodo de teste quando ha preview valido.
- Nao exibir mensagens de desenvolvimento ou detalhes tecnicos como SetupIntent, backend, Edge Function, webhook, contagem recalculada, revalidacao interna ou estado reconciliado em texto visivel ao usuario final.
