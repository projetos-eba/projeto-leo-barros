# Page Profile - Planos

Rota: `/planos`

## Objetivo

Apresentar o Plano Completo para visitantes e Parceiros, preservando o plano escolhido ate login/checkout.

## Regras

- Visitante segue para `/login/parceiros?next=/parceiros/checkout?plan=...`.
- Parceiro sem assinatura segue para checkout.
- Parceiro com assinatura ativa/trial segue para `/parceiros/configuracoes/assinatura`.
- Cliente e Admin nao contratam em nome proprio.
- Precos exibidos: R$ 119,90 mensal, R$ 99,90/mes anual, R$ 1.198,80 anual, R$ 1,99 por Cliente ativo.

## Estados

- Catalogo local seguro funciona sem Stripe.
- CTA preserva `complete-monthly` ou `complete-annual`.
- Layout responsivo em cards comparativos.
