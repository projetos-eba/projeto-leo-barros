---
name: leo-parceiros-cliente-exames
description: Maintain the Projeto Leo Barros partner Client Exames tab, including exam catalog definitions, reference ranges, unit conversions, result collections, RLS/RPCs, seed fixtures, and the shared Client profile header.
---

# Parceiros - Cliente - Exames

Use this skill for changes to `/parceiros/clientes/[id]?tab=exames`.

## Required Reading

1. `docs/page-profiles/parceiros-cliente-exames.md`
2. `src/app/parceiros/clientes/[id]/partner-client-exams-view.tsx`
3. `src/lib/partners/client-exams-data.ts`
4. `src/lib/partners/client-exams-metrics.ts`
5. `src/app/parceiros/clientes/[id]/actions.ts`
6. `supabase/migrations/20260702183000_partner_client_exams.sql`

## Invariants

- Preserve the shared Client profile header and tabs exactly with the other implemented tabs.
- Use `Clientes` in UI copy and never expose CPF.
- `Configurações` edits the partner-wide exam catalog; saved result collections keep snapshots.
- Keep reference ranges, conversions, RLS, grants, constraints and functions in migrations.
- Keep smoke fixtures and the default catalog in `supabase/seed.sql`.
- Do not alter assessments, diets, workouts or cardio from exam result saves.

## Validation

Run:

```bash
npm run test -- client-exams-metrics partner-client-exams-view
npm run lint
npm run build
npx supabase test db
git diff --check
```
