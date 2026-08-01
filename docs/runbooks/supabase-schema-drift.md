# Runbook - Supabase Schema Drift

Data de referencia: 1 de agosto de 2026.

## Sintomas

- Erros Postgres `42703` para coluna inexistente.
- REST `404` para tabela esperada pelo codigo.
- REST `400` em select com coluna nova.
- Boundary de erro em pagina server-side.

## Diagnostico

1. Liste migrations remotas via MCP Supabase.
2. Compare com `supabase/migrations/**`.
3. Consulte `information_schema.tables` e `information_schema.columns` para os objetos afetados.
4. Consulte constraints, indices, RLS, policies e grants.
5. Rode `npm run db:reset` local para provar se o Git reconstrui o schema.
6. Rode `npm run test:db`.

## Caso de 1 de agosto de 2026

O incidente em `/parceiros/cadastros` foi causado por deploy de codigo que esperava migrations de catalogos globais ainda nao aplicadas no projeto Supabase remoto.

Migrations locais relevantes:

- `20260730120000_global_catalog_libraries.sql`
- `20260731100000_system_exercise_media_ingest.sql`
- `20260731110000_catalog_import_items_fk_indexes.sql`
- `20260731120000_system_exercise_media_storage_listing_hardening.sql`

No remoto inspecionado, as migrations registradas paravam em `20260714190000_stripe_catalog_read_model`.

## Roll-forward padrao

- Aplicar migrations pendentes em ordem cronologica.
- Validar objetos criados e grants.
- Validar chamadas REST afetadas.
- Validar UI com Playwright MCP.

## Rollback

Para migrations forward-only, prefira roll-forward corretivo. Rollback destrutivo em producao exige autorizacao explicita, backup validado e plano separado.

## Evidencias minimas

- Lista de migrations remotas antes/depois.
- Resultado de `information_schema` para tabelas e colunas.
- Resultado de constraints, indices, RLS e policies.
- Resultado de `npm run ci:schema`.
- Screenshot e network smoke de `/parceiros/cadastros`.
