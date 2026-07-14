# Page Profile - Planos

Rota: `/planos`

## Objetivo

Apresentar o Plano Completo para visitantes e Parceiros, preservando o plano escolhido ate login/checkout.

## Regras

- Visitante segue para `/login/parceiros?next=/parceiros/checkout?plan=...`.
- Se o visitante ainda nao tem conta e usa "Nao tenho cadastro", o `next` do
  checkout deve ser preservado no cadastro de Parceiro e consumido apos
  confirmacao/autenticacao.
- Parceiro sem assinatura segue para checkout.
- Parceiro com assinatura ativa/trial segue para `/parceiros/configuracoes/assinatura`.
- Cliente e Admin nao contratam em nome proprio.
- Precos exibidos vêm de `billing_public_catalog()`, sincronizado a partir do Stripe. Os valores homologados iniciais sao R$ 119,90 mensal, R$ 99,90/mes anual, R$ 1.198,80 anual e R$ 1,99 por Cliente ativo.
- Equivalente mensal anual e economia sao calculados a partir dos valores sincronizados.

## Estados

- Catalogo local seguro funciona sem Stripe.
- Catalogo incompleto ou Price/Product inativo bloqueia CTA daquele plano e mostra estado seguro de indisponibilidade.
- CTA preserva `complete-monthly` ou `complete-annual`.
- Layout responsivo em cards comparativos.
- Cards de plano separam conteudo principal, faixa de adicional e CTA por estrutura flex, mantendo espaco consistente entre a faixa `+ R$ 1,99/mes por Cliente ativo` e o botao.
- Rodape usa tres cards de confianca em pagamento: Pagamento seguro, Processado pela Stripe e Dados protegidos.
