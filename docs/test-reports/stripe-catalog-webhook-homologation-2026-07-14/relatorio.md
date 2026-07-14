# Relatorio De Homologacao - Catalogo Stripe Webhook

Data: 2026-07-14.

## Ambiente

- Stripe: test mode confirmado (`livemode=false`) para produtos e precos oficiais.
- Stripe CLI: 1.43.7.
- Supabase local: `http://127.0.0.1:54321`.
- Webhook local: `http://127.0.0.1:54321/functions/v1/stripe-webhook`.
- Edge Functions locais: `supabase functions serve --env-file supabase/functions/.env`.
- Next.js local: `http://localhost:3000`.
- MCP Supabase: disponivel.
- MCP Playwright: disponivel.

Listener iniciado: sim.
Signing secret local configurado: sim.
Secret exposto: nao.

## Eventos Reais Observados

| Evento | Event ID | HTTP | Ledger | Banco |
|---|---|---:|---|---|
| `product.created` fixture ignorada | `evt_1Tt7vHPELBIpM2MnLZwMnStJ` | 200 | `ignored_not_catalog` | sem linha no read model |
| `product.updated` fixture ignorada | `evt_1Tt7vmPELBIpM2Mn4Ls2kXwt` | 200 | `ignored_not_catalog` | sem linha no read model |
| `product.updated` HML aplicado | `evt_1Tt7zoPELBIpM2MnRAVdaaCA` | 200 | `applied` | `billing_products` atualizado |
| `product.deleted` HML aplicado | `evt_1Tt84GPELBIpM2MnJGegUg5e` | 200 | `applied` | `active=false`, `deleted_at` preenchido |
| `price.created` Price A | `evt_1Tt80KPELBIpM2MnU9MgaVrn` | 200 | `applied` | BRL 10000, mensal, ativo |
| `price.updated` Price A | `evt_1Tt816PELBIpM2MnjsuMg428` | 200 | `applied` | metadata/estado atualizados |
| `price.updated` Price A arquivado/lookup removido | `evt_1Tt81MPELBIpM2MnWhSPmHzy` | 200 | `applied` | `active=false`, `lookup_key=null` |
| `price.created` Price B | `evt_1Tt81MPELBIpM2MnBKbk6DOI` | 200 | `applied` | BRL 12000, lookup vigente |
| replay duplicado | `evt_1Tt81MPELBIpM2MnBKbk6DOI` | 200 | `duplicate=true` | uma unica linha |
| fora de ordem assinado | `evt_hml_out_of_order_ed4bd6ce268e` | 200 | `ignored_out_of_order` | estado nao regrediu |

`price.deleted` real ficou bloqueado pela propria API/CLI Stripe: Price e descontinuado por `active=false` e troca de Price, nao por delete fisico comum.

## Banco

Validado por MCP Supabase:

- `billing_products` e `billing_prices` com RLS ativo.
- `billing_products.catalog_role` aceita `complete-plan`, `active-client-addon` e `hml-plan`.
- Fixtures `hml-plan` entraram apenas no read model normalizado.
- `billing_public_catalog()` retornou somente:
  - `complete-monthly`, R$ 119,90;
  - `complete-annual`, R$ 1.198,80;
  - `active-client-monthly`, R$ 1,99.
- Catalogo oficial reconciliado com:
  - `prod_UrR2wxpxk9UJxV`;
  - `prod_UrRGM5chV5eXLU`;
  - `price_1TriAiPELBIpM2MneLhOLwW4`;
  - `price_1TriAiPELBIpM2Mn7s4EpKt5`;
  - `price_1TriNoPELBIpM2MnQRkRINCT`.

## UI

MCP Playwright:

- `/planos` desktop: valores oficiais, sem fixture, sem erro de console.
- `/planos` mobile: valores oficiais, sem fixture, sem erro de console.
- `/parceiros/checkout?plan=complete-monthly`: redireciona para login quando anonimo.
- `/parceiros/checkout?plan=complete-annual`: redireciona para login quando anonimo.
- `/parceiros/configuracoes/assinatura`: redireciona para login quando anonimo.
- `/admin/financeiro`: redireciona para login quando anonimo.

Fallback Playwright local/headless para sessao autenticada:

- Checkout mensal: R$ 119,90, sem Price ID e sem fixture.
- Checkout anual: R$ 1.198,80, sem Price ID e sem fixture.
- Assinatura do Parceiro: pagina carregou sem Price ID/fixture.
- Admin Financeiro: pagina carregou sem Price ID/fixture.

## Falhas Encontradas E Corrigidas

1. Product era classificado por nome oficial.
   - Causa: `product.name` era aceito como criterio de pertencimento.
   - Correcao: pertencer ao catalogo agora exige metadata oficial, ID oficial homologado ou role HML local habilitada.
   - Regressao: contrato em `src/lib/billing/stripe-edge-contract.test.ts`.

2. Necessidade de fixture aplicada sem afetar catalogo publico.
   - Causa: somente roles oficiais podiam ser persistidas.
   - Correcao: role local `hml-plan`, habilitada por `BILLING_ALLOW_HML_CATALOG_FIXTURES=1`, sem atualizar `billing_plans`, `billing_plan_addons` ou `billing_public_catalog()`.
   - Regressao: teste SQL garante que fixture HML nao aparece no catalogo publico.

3. Ledger gravava UUID local em `payload_summary.stripe_object_id` para Product aplicado.
   - Causa: retorno de `upsertCatalogProduct` usava `data.id`.
   - Correcao: retorno agora usa sempre ID Stripe real.
   - Regressao: contrato de edge.

4. `product.deleted` podia nao preencher `deleted_at`.
   - Causa: payload real veio como Product sem `deleted: true`; handler dependia apenas do shape do objeto.
   - Correcao: handler recebe `eventType` e trata `product.deleted` como soft delete.
   - Validacao: novo Product HML deletado realmente gerou `deleted_at`.

## Recuperacao

Webhook perdido simulado:

1. listener Stripe parado;
2. Product HML alterado na Stripe;
3. banco permaneceu com nome anterior;
4. `stripe-reconcile-catalog` executado;
5. read model atualizado sem duplicar Product.

## Limpeza

- Product de delete sem Price foi deletado na Stripe test mode.
- Price A foi arquivado (`active=false`) e preservado historicamente.
- Price B foi arquivado (`active=false`) apos a coleta de evidencias.
- Product HML principal foi desativado (`active=false`) apos a coleta de evidencias.
- Produtos oficiais nao foram alterados, arquivados ou deletados.

## Observacoes

- O MCP Playwright desta sessao nao expunha preenchimento/click/setCookie; por isso a parte autenticada usou Playwright local/headless como fallback, depois de validar navegacao real anonima via MCP.
- `npx supabase status` imprime chaves locais por padrao; valores nao foram reproduzidos neste relatorio.
