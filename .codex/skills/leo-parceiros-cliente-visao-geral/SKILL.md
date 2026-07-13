---
name: leo-parceiros-cliente-visao-geral
description: Maintain and evolve the Projeto Leo Barros partner individual Client overview page at /parceiros/clientes/[id], including its Figma contract, partner-scoped overview RPC, clinical privacy rules, overview metrics, drawers, scheduling, tasks, print export, and shared Client profile header.
---

# Leo Parceiros Cliente Visao Geral

Use this skill for work on `/parceiros/clientes/[id]` in `/Users/antoniofelipe/Projeto_Leo_Barros`.

## Required Reading

Before editing or validating the page, read:

1. `AGENTS.md`
2. `docs/page-profiles/parceiros-cliente-visao-geral.md`
3. `docs/page-profiles/parceiros-clientes.md`
4. `src/lib/partners/client-overview-data.ts`
5. `src/lib/partners/client-overview-metrics.ts`
6. `src/app/parceiros/clientes/[id]/page.tsx`
7. `src/app/parceiros/clientes/[id]/partner-client-overview-view.tsx`
8. `src/app/parceiros/clientes/[id]/actions.ts`
9. `supabase/migrations/20260630173000_partner_client_overview.sql`

## Rules

- Use `Clientes` in UI copy; keep `patients` only for technical schema/type names.
- Do not expose CPF, `user_id`, auth identifiers, or other partners' data in the page, RPC, drawers, print view, tests, or docs.
- Use `partner_client_overview(patient_id)` for overview reads; do not query clinical tables directly from browser components.
- Mutations for appointments and tasks must use server actions plus Supabase RLS.
- Keep future tabs disabled until each tab is implemented deliberately.
- `Cardio` and `Exames` are now deliberate Client profile tabs. Outside Cardio, keep legacy `cardio` scopes grouped as `Treino`.
- Store database structure, RLS, indexes, functions and constraints in migrations. Store smoke/system data in `supabase/seed.sql`.

## Validation

Prefer this validation set for material changes:

- `npx supabase test db`
- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run git:local -- diff --check`
- Playwright smoke on `/parceiros/clientes/[id]` desktop and mobile after logging in as the smoke partner.
