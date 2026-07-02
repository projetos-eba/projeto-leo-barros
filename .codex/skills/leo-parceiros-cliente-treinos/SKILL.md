---
name: leo-parceiros-cliente-treinos
description: Maintain the Projeto Leo Barros partner Client workout prescription tab, including programs, sessions, exercise library integration, sets, Bi-set, templates, muscle heat map, RLS, RPCs and seed smoke data.
---

# Parceiros - Cliente - Treinos

Use this skill for changes to `/parceiros/clientes/[id]?tab=treinos`.

## Invariants

- Preserve the shared Client profile header and tabs.
- Use `Clientes` in UI and never expose CPF.
- Keep Cardio inside Treino, never as a separate tab.
- Read exercises from `partner_protocol_exercises`; do not create a second exercise library.
- Keep workout database objects, RLS, grants, constraints and functions in migrations.
- Keep smoke fixtures in `supabase/seed.sql`.
- Require exactly two adjacent exercises for Bi-set.
- Preserve templates as independent clones.
- Derive muscle heat from primary and secondary muscle groups.

## Validation

Run:

```bash
npm run test -- client-workout-metrics partner-client-workout-view partner-protocols-view
npm run lint
npm run build
npx supabase test db
git diff --check
```

Read `docs/page-profiles/parceiros-cliente-treinos.md` before changing behavior or schema.
