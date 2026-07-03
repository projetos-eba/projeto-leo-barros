---
name: leo-parceiros-cliente-cardio
description: Maintain the Projeto Leo Barros partner Client Cardio tab, including cardio plans, MET calculations, weekly sessions, heart-rate zones, RLS/RPCs, seed fixtures, and the shared Client profile header.
---

# Parceiros - Cliente - Cardio

Use this skill for changes to `/parceiros/clientes/[id]?tab=cardio`.

## Required Reading

1. `docs/page-profiles/parceiros-cliente-cardio.md`
2. `src/app/parceiros/clientes/[id]/partner-client-cardio-view.tsx`
3. `src/lib/partners/client-cardio-data.ts`
4. `src/lib/partners/client-cardio-metrics.ts`
5. `src/app/parceiros/clientes/[id]/actions.ts`
6. `supabase/migrations/20260702140000_partner_client_cardio.sql`

## Invariants

- Preserve the shared Client profile header and tabs exactly with the other implemented tabs.
- Use `Clientes` in UI copy and never expose CPF.
- Cardio is now a deliberate Client profile tab; outside this tab, legacy `cardio` scopes remain grouped as `Treino`.
- Use the MET formula `MET * 3.5 * pesoKg / 200 * minutos`.
- Use zones from `FCmáx = 220 - idade`.
- Weekly completion comes only from registered sessions.
- Keep database structure, RLS, grants, constraints and functions in migrations.
- Keep smoke fixtures in `supabase/seed.sql`.

## Validation

Run:

```bash
npm run test -- client-cardio-metrics partner-client-cardio-view
npm run lint
npm run build
npx supabase test db
git diff --check
```
