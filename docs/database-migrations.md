# Database Migrations

Data de referencia: 1 de agosto de 2026.

## Fonte de verdade

O schema oficial do Projeto Leo Barros deve ser reconstruivel a partir de:

- `supabase/migrations/**`
- `supabase/seed.sql`
- `supabase/seed-data/**`
- `src/lib/supabase/database.types.ts`
- `supabase/tests/**`

Alteracoes manuais no Supabase Studio ou SQL Editor precisam ter migration equivalente no Git antes de deploy.

## Regras

- Nunca edite migration que ja possa ter sido aplicada em qualquer ambiente.
- Crie nova migration forward-only para toda alteracao de schema.
- Preserve dados existentes; use `alter table ... add column`, `if not exists` e constraints explicitas quando apropriado.
- Campos de vinculo com catalogos globais devem permanecer opcionais quando itens customizados do parceiro forem validos.
- Rode um reset local limpo antes de abrir PR.
- Atualize tipos Supabase e versiona o resultado.
- Rode testes SQL de contrato.

## Comandos

```bash
npm run db:migration-integrity
npm run db:reset
npm run db:lint
npm run test:db
npm run lint
npm run test
npm run build
```

O gate agregado e:

```bash
npm run ci:schema
```

## Catalogos globais

`/parceiros/cadastros` depende de:

- `public.system_foods`
- `public.system_exercises`
- `public.system_exercise_media`
- `public.catalog_import_batches`
- `public.catalog_import_items`
- `public.partner_protocol_foods.system_food_id`
- `public.partner_protocol_exercises.system_exercise_id`

O teste `supabase/tests/033_global_catalog_libraries.test.sql` deve falhar se esse contrato estiver ausente.

## Catalogo global de exames

O catalogo padrao de exames do modulo Parceiro e estrutural e deve ser reproduzivel por Git:

- `public.system_exam_categories`
- `public.system_exam_definitions`
- `public.system_exam_reference_ranges`
- `public.system_exam_alternative_units`

A migration `20260810181000_global_exam_catalog.sql` promoveu os 72 exames padrao e 11 categorias antes presentes no seed local para catalogo global versionado. A funcao `public.sync_partner_system_exam_catalog(partner_id)` materializa esse catalogo nas tabelas `partner_exam_*` para preservar resultados existentes, FKs, RLS e exames customizados do parceiro.

Regras:

- Nunca cadastrar exames padrao manualmente em producao sem migration correspondente.
- Nao apagar exames customizados do parceiro ao sincronizar catalogo global.
- Alteracoes futuras no catalogo global devem ser forward-only, idempotentes e cobertas por `supabase/tests/019_partner_client_exams.test.sql`.
