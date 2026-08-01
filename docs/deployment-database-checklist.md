# Deployment Database Checklist

Data de referencia: 1 de agosto de 2026.

Use este checklist antes de publicar codigo que depende de schema novo.

## Antes do deploy

- Confirmar branch, SHA e PR.
- Verificar `npm run git:local -- status --short`.
- Rodar `npm ci`.
- Rodar `npm run ci:schema`.
- Rodar `npm run lint`.
- Rodar `npm run test`.
- Rodar `npm run build`.
- Comparar migrations locais e remotas com Supabase CLI ou MCP.
- Confirmar que tipos Supabase gerados nao produzem diff.
- Revisar SQL exato de migrations pendentes.
- Confirmar backup/PITR ou estrategia de roll-forward.

## Aplicacao

- Aplicar migrations antes do codigo que depende delas, ou garantir compatibilidade entre versoes.
- Nao executar reset, truncate, drop ou delete em massa no remoto.
- Nao expor service role key, JWTs ou dados sensiveis em logs.
- Validar migrations registradas em `supabase_migrations.schema_migrations`.
- Recarregar schema cache do PostgREST somente se necessario.

## Depois do deploy

- Validar via MCP Supabase: tabelas, colunas, constraints, indices, RLS, policies e grants.
- Validar chamadas REST sem 400, 404, 42703 ou 500 relacionados.
- Validar via Playwright MCP o fluxo afetado.
- Registrar evidencias em `docs/test-reports/<escopo>-YYYY-MM-DD/`.
- Manter PR sem merge automatico ate revisao.
