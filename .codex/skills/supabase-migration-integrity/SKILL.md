---
name: supabase-migration-integrity
description: Use ao criar, revisar, aplicar ou diagnosticar migrations Supabase, schema drift, tipos gerados, gates de CI de banco e incidentes de PostgREST por tabela/coluna ausente.
---

# Supabase Migration Integrity

## Regras

- Nunca alterar banco manualmente sem migration equivalente no Git.
- Nunca editar migration que ja possa ter sido aplicada.
- Criar nova migration forward-only.
- Preservar dados existentes.
- Nao executar reset, truncate, drop ou delete em massa no remoto.
- Manter secrets fora de comandos, logs, docs e respostas.

## Fontes

Leia primeiro:

- `AGENTS.md`
- `supabase/config.toml`
- `supabase/migrations/**`
- `supabase/tests/**`
- `src/lib/supabase/database.types.ts`
- `docs/database-migrations.md`
- `docs/deployment-database-checklist.md`
- `docs/runbooks/supabase-schema-drift.md`

## Checklist

1. Confirmar branch, SHA e worktree.
2. Mapear codigo que espera o objeto de banco.
3. Identificar migration que cria ou altera o objeto.
4. Comparar migrations locais e remotas via Supabase MCP/CLI.
5. Consultar `information_schema`, constraints, indices, RLS, policies e grants.
6. Rodar `npm run db:migration-integrity`.
7. Rodar `npm run db:reset` local.
8. Rodar `npm run db:lint`.
9. Rodar `npm run test:db`.
10. Regenerar tipos Supabase e comparar diff.
11. Rodar `npm run lint`, `npm run test` e `npm run build`.
12. Validar fluxo afetado com Playwright MCP.
13. Registrar plano de rollout e roll-forward.

## Definition Of Done

- Migrations do Git recriam o schema requerido a partir de banco vazio.
- Teste de contrato falha quando tabela, coluna, FK, indice ou policy obrigatoria esta ausente.
- Tipos Supabase estao sincronizados.
- Remoto registra as migrations esperadas.
- Fluxos afetados nao geram 400, 404, 42703 ou 500 relacionados.
- Evidencias MCP Supabase e Playwright estao documentadas.
