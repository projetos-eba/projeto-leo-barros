---
name: leo-parceiros-dashboard
description: Maintain and evolve the Projeto Leo Barros partner dashboard at /parceiros/dashboard. Use when Codex is asked to change, validate, debug, smoke-test, document, or extend the Parceiros overview dashboard, its KPIs, Supabase local data model, custom partner plans, renewals, or Page Profile.
---

# Leo Parceiros Dashboard

Use this skill for work on `/parceiros/dashboard` in `/Users/antoniofelipe/Projeto_Leo_Barros`.

## Required Reading

Before editing or validating the page, read:

1. `AGENTS.md`
2. `docs/page-profiles/parceiros-dashboard.md`
3. `docs/sitemap-projeto-leo-barros.md`
4. `src/lib/partners/dashboard-metrics.ts`
5. `src/lib/partners/dashboard-data.ts`
6. `src/app/parceiros/dashboard/page.tsx`
7. `src/app/parceiros/dashboard/partner-dashboard-view.tsx`
8. `supabase/migrations/20260629213000_partner_custom_plans.sql`

## Rules

- Keep `/parceiros/dashboard` focused on the authenticated partner's own operation.
- Use `Clientes` in UI copy, even when technical schema uses `patients`.
- Do not expose `cardio` as a separate visible scope on partner screens; group legacy `cardio` data into `Treino`.
- Do not expose clinical details, medical notes, diet details, training details, CPF, or sensitive client data on this page.
- Custom plans offered by partners are stored separately from platform billing plans.
- Renewal indicators come from `partner_client_plan_subscriptions.current_period_end`.
- Platform plan/status comes from `partner_subscriptions` and `billing_plans`; client offer revenue comes from `partner_custom_plans`.
- Keep metrics derived from Supabase tables through server-side helpers.
- Never use service role in browser code.
- Update `docs/page-profiles/parceiros-dashboard.md` whenever metrics, tables, page states, or validation rules change.

## Figma Visual Contract

Use Figma nodes `1:7754` and `408:634` from file `vyskvKR1gCzdckeXHR2Ewj` as the source for the partner dashboard visual system.

- Base colors: page `#0b1720`, sidebar `#0e151a`, card base `#04111b`, active nav `#0a2c48`, primary blue `#1d7ece`, chart blue `#68afe9`, text `#ffffff` / `#d7dae0`, secondary text `#828a9c`.
- Use `Rethink Sans` on the partner dashboard and keep letter spacing at zero.
- Desktop shell: fixed dark sidebar near `193px`, content max width near `1199px`, compact top greeting/actions, KPI row, main chart plus agenda, three secondary cards, and two operational tables.
- Cards use restrained dark gradients, borders, and 10-14px radii; avoid marketing hero sections and decorative blobs.
- The performance panel follows node `408:634`: three selectable cards, initial left card selected, chart series swapping by click, and a liquid connected light-blue outline rendered by an absolute SVG layer (`PerformanceOutline`), never by chart/card CSS borders.
- Preserve the active outline states `averageAdhesion`, `adherentClients`, and `monthlyGoal` unless the Figma contract changes.
- `Alertas clínicos` must keep red alert styling when there are alerts: red border/glow, red icon, large white count, and red bullet copy.
- `Distribuição de adesão por módulo` uses larger blue/green rings, a dark center, compact labels, and a vertical divider.
- Preserve internal horizontal scroll for dense tables on mobile, but the page itself must not have horizontal overflow.
- On mobile, prioritize stacked panels and functional content. Partner mobile navigation is still a product gap unless added separately.

## Validation

Prefer this validation set for material changes:

- `npx supabase db reset`
- `npx supabase db lint`
- `npx supabase test db`
- regenerate local Supabase types
- `npm run test`
- `npm run build`
- `npm run lint`
- `git diff --check`

For browser smoke, use Playwright/MCP only when available and keep the test local.
