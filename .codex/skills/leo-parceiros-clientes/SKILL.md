---
name: leo-parceiros-clientes
description: Maintain and evolve the Projeto Leo Barros partner Clients page at /parceiros/clientes, including its Figma visual contract, secure partner-scoped client RPC, filters, CSV export, details drawer, and provision-client-for-partner creation flow.
---

# Leo Parceiros Clientes

Use this skill for work on `/parceiros/clientes` in `/Users/antoniofelipe/Projeto_Leo_Barros`.

## Required Reading

Before editing or validating the page, read:

1. `AGENTS.md`
2. `docs/page-profiles/parceiros-clientes.md`
3. `docs/contrato-provision-client-for-partner-edge-function.md`
4. `src/lib/partners/clients-data.ts`
5. `src/lib/partners/clients-metrics.ts`
6. `src/app/parceiros/clientes/page.tsx`
7. `src/app/parceiros/clientes/partner-clients-view.tsx`
8. `supabase/migrations/20260630103000_partner_clients_list_rpc.sql`

## Rules

- Use `Clientes` in UI copy; keep `patients` only for technical schema/type names.
- Do not expose CPF in list, detail drawer, CSV, logs, or documentation examples.
- Use `partner_clients_list()` for client identity fields visible to partners.
- Keep creation routed through `provision-client-for-partner`; never send password, role, status, service role, invite link, or token from the browser.
- Preserve mobile page-level no-overflow; dense tables may scroll internally.
- Update `docs/page-profiles/parceiros-clientes.md` when metrics, visible fields, workflows, or validation rules change.

## Validation

Prefer this validation set for material changes:

- `npx supabase db lint`
- `npx supabase test db`
- `npm run test`
- `npm run build`
- `npm run lint`
- `git diff --check`
- Playwright smoke on `/parceiros/clientes` desktop and mobile.
