# ADR - Catalogo Stripe Como Fonte Comercial

Data: 14 de julho de 2026.

## Problema

Mudancas comerciais no Stripe, como novo Price, transferencia de `lookup_key`,
arquivamento e alteracao de nome de Product, precisavam de codigo ou bootstrap
manual para aparecer em `/planos`, checkout e billing.

## Decisao

Stripe e a fonte comercial externa para Product e Price. Supabase guarda um
read model local sincronizado:

- `billing_products`: Products pertencentes ao catalogo Leo Barros.
- `billing_prices`: Prices historicos e vigentes.
- `billing_plans` e `billing_plan_addons`: compatibilidade operacional para
  telas, assinaturas existentes e Admin Financeiro.

O pertencimento ao catalogo e centralizado por:

- `metadata.application = leo-barros`;
- `metadata.catalog_role = complete-plan` ou `active-client-addon`;
- compatibilidade com IDs oficiais de Products/Prices e lookup keys
  conhecidas.

Nome de Product e tratado como dado mutavel de exibicao, nao como criterio de
pertencimento ao catalogo. Um Product externo com nome igual ao oficial deve ser
ignorado salvo se possuir metadata oficial ou ID homologado.

Para homologacao local de webhooks, a role `hml-plan` pode ser habilitada
somente com `BILLING_ALLOW_HML_CATALOG_FIXTURES=1` no runtime local. Essa role
grava `billing_products`/`billing_prices`, mas nao atualiza `billing_plans`,
`billing_plan_addons` nem `billing_public_catalog()`.

## Eventos

O webhook processa apenas eventos necessarios:

- `product.created`, `product.updated`, `product.deleted`;
- `price.created`, `price.updated`, `price.deleted`;
- eventos financeiros ja existentes.

Eventos fora de ordem com `event.created` anterior ao ultimo evento aplicado no
Product ou Price local sao ignorados e registrados no ledger como
`ignored_out_of_order`.

## Checkout E Renderizacao

`/planos` usa `billing_public_catalog()` e nao chama Stripe. O checkout recebe
somente `planSlug`, resolve o Price ativo no catalogo local e valida o Price na
Stripe antes de criar a assinatura.

Cache: as rotas de billing permanecem dinamicas (`force-dynamic`). A alteracao
aparece no proximo refresh/render apos o webhook ou reconciliação atualizar o
Supabase, sem endpoint publico de revalidacao.

## Consequencias

- Troca de Price afeta novas contratacoes.
- Assinaturas existentes continuam ligadas ao Price historico via Stripe
  Subscription Item e registros locais.
- Reconciliacao administrativa `stripe-reconcile-catalog` corrige divergencias
  Stripe -> Supabase sem criar Product ou Price remoto.
