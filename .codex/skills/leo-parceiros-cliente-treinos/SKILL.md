---
name: leo-parceiros-cliente-treinos
description: Maintain the Projeto Leo Barros partner Client workout prescription tab, including programs, sessions, exercise library integration, sets, Bi-set, templates, muscle heat map, RLS, RPCs and seed smoke data.
---

# Parceiros - Cliente - Treinos

Use this skill for changes to `/parceiros/clientes/[id]?tab=treinos`.

## Invariants

- Preserve the shared Client profile header and tabs.
- Use `Clientes` in UI and never expose CPF.
- `Cardio` is now a separate Client profile tab. Keep Treinos focused on strength/workout prescription and only group legacy `cardio` scopes as `Treino` outside the Cardio tab.
- Read exercises from `partner_protocol_exercises`; do not create a second exercise library.
- Keep workout database objects, RLS, grants, constraints and functions in migrations.
- Keep smoke fixtures in `supabase/seed.sql`.
- Require exactly two adjacent exercises for Bi-set.
- Use row selection for Bi-set without rendering execution checkboxes for the professional.
- Show fixed series columns with editable existing sets and subdued clickable placeholders for missing sets.
- New exercises should start with at least 3 prescribed sets.
- Reorder exercises with up/down actions at the end of the row, not drag handles beside the name.
- Preserve templates as independent clones.
- Derive muscle heat from primary and secondary muscle groups using blue-only intensity: 1 exercise = light, 2-4 = medium, 5+ = strong.

## Validation

Run:

```bash
npm run test -- client-workout-metrics partner-client-workout-view partner-protocols-view
npm run lint
npm run build
npx supabase test db
npm run git:local -- diff --check
```

Read `docs/page-profiles/parceiros-cliente-treinos.md` before changing behavior or schema.
