# Homologacao Stripe Catalog Webhook - 2026-07-14

Este diretorio registra a homologacao local real do catalogo Stripe com:

- Stripe CLI listener local.
- Supabase Edge Function `stripe-webhook`.
- Supabase local via MCP.
- Playwright MCP para navegacao publica/protegida.
- Playwright local/headless como fallback para sessoes autenticadas.

Nenhum secret foi incluido. Logs em `logs-sanitizados/` tiveram `whsec_*`,
chaves Stripe e JWTs mascarados.

Arquivos:

- `relatorio.md`: narrativa tecnica, ambiente, evidencias e falhas corrigidas.
- `matriz-cenarios.md`: matriz PASS/FAIL/BLOCKED por cenario.
- `resource-manifest.json`: IDs de fixtures e catalogo oficial usados.
- `screenshots/`: reservado para evidencias visuais versionaveis quando aplicavel.
- `traces/`: reservado para traces Playwright quando aplicavel.
- `logs-sanitizados/`: logs locais sanitizados do listener e Edge Functions.
