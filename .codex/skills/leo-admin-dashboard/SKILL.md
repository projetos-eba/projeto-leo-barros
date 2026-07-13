---
name: leo-admin-dashboard
description: Maintain and evolve the Projeto Leo Barros Super Admin dashboard at /admin/dashboard. Use when Codex is asked to change, validate, debug, smoke-test, document, or extend the Admin overview dashboard, its KPIs, Supabase local data model, Recharts visualizations, or Page Profile.
---

# Leo Admin Dashboard

Use this skill for work on `/admin/dashboard` in `/Users/antoniofelipe/Projeto_Leo_Barros`.

## Required Reading

Before editing or validating the page, read:

1. `AGENTS.md`
2. `docs/page-profiles/admin-dashboard.md`
3. `docs/sitemap-projeto-leo-barros.md`
4. `src/lib/admin/dashboard-metrics.ts`
5. `src/lib/admin/dashboard-data.ts`
6. `src/app/admin/dashboard/page.tsx`
7. `src/app/admin/dashboard/admin-dashboard-view.tsx`
8. `supabase/migrations/*admin_dashboard_operational_domain.sql`

## Rules

- Keep visual language aligned with the Figma frame `Page / Super Admin - Visao Geral`, node `197:5`.
- Use `Clientes` in UI copy, even while the technical schema still has `patients`.
- Never use service role in browser code.
- Do not configure Stripe, checkout, webhooks, secrets, Resend, deploys, or Supabase remote from this page work.
- Treat Stripe fields in the database as future-compatible placeholders only.
- Keep metrics derived from Supabase tables through server-side helpers.
- Update `docs/page-profiles/admin-dashboard.md` whenever metrics, tables, page states, or validation rules change.

## Validation

Prefer this validation set for material changes:

- `npx supabase db reset`
- `npx supabase db lint`
- `npx supabase test db`
- regenerate local Supabase types
- `npm run dev:seed-admin-dashboard-smoke`
- `npm run test`
- `npm run build`
- `npm run build:next`
- `npm run lint`
- `npm run git:local -- diff --check`

For browser smoke, use Playwright/MCP only when available and keep the test local.
