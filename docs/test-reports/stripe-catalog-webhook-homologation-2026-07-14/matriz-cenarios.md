# Matriz De Cenarios

| Cenario | Resultado | Evidencia |
|---|---|---|
| Stripe CLI iniciado | PASS | listener ativo, HTTP 200 no log sanitizado |
| Secret local configurado | PASS | Edge aceitou eventos assinados reais; secret nao impresso |
| `product.created` | PASS | fixture ignorada e fixture HML aplicada |
| `product.updated` | PASS | `evt_1Tt7zoPELBIpM2MnRAVdaaCA`, `applied` |
| Product arquivado | PASS | `product.updated` com `active=false` aplicado |
| Product reativado | PASS | `product.updated` com `active=true` aplicado |
| `product.deleted` | PASS | `evt_1Tt84GPELBIpM2MnJGegUg5e`, `deleted_at` preenchido |
| `price.created` | PASS | `evt_1Tt80KPELBIpM2MnU9MgaVrn`, Price A |
| `price.updated` | PASS | metadata/active/lookup de Price A |
| Troca de Price | PASS | Price B `price_1Tt81MPELBIpM2Mn32vnu5a9` com lookup vigente |
| Price antigo preservado | PASS | Price A inativo, valor 10000 preservado, lookup removido |
| `price.deleted` | BLOCKED | Stripe Price nao tem delete real comum; validado arquivamento |
| Evento duplicado | PASS | replay assinado retornou `duplicate=true`, ledger com 1 linha |
| Evento fora de ordem | PASS | `ignored_out_of_order`, estado nao regrediu |
| Objeto nao pertencente | PASS | fixture sem `catalog_role` ignorada e ausente da UI |
| Reconciliacao | PASS | bootstrap + reconcile duas vezes sem duplicar |
| Webhook perdido | PASS | listener parado, alteracao recuperada por reconcile |
| Assinatura invalida | PASS | sem assinatura, invalida e payload alterado retornaram 400 e sem escrita |
| Modo incompatível | PASS | evento sintético `livemode=true` rejeitado sem escrita |
| Supabase | PASS | MCP validou RLS, constraints, tabelas e catalogo publico |
| `/planos` desktop | PASS | MCP Playwright, screenshot `planos-desktop-hml.png` |
| `/planos` mobile | PASS | MCP Playwright, screenshot `planos-mobile-hml.png` |
| Checkout | PASS | MCP validou redirect anonimo; fallback autenticado validou resumo |
| Assinatura historica | PASS | fallback autenticado carregou sem Price ID/fixture |
| Admin Financeiro | PASS | fallback autenticado carregou sem Price ID/fixture |
| Cache/SLA | PASS | eventos reais refletiram no banco em cerca de 1-2s; UI atualiza em refresh |
