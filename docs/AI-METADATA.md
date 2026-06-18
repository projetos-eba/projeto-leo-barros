# AI Metadata Contract

This design system is prepared for AI-assisted interface generation. The Figma components and React components share the same component names, variant language, and token vocabulary.

## Component Selection Rules

- Use `Button` for explicit commands and form actions.
- Use `Icon` for semantic icon sizing. Do not default to generic activity-like symbols.
- Use `Avatar` only for identity, never for action affordances.
- Use `Boolean Control` for checkbox and switch behavior.
- Use `Tabs` for local sibling views inside one context.
- Use `Sidebar` for global authenticated navigation.
- Use `Navigation Item` inside `Sidebar` only.
- Use `Input` and `Select` for editable form controls only.
- Use `KPI Card` for compact dashboard metrics.
- Use `Shortcut Card` for module entry points.
- Use `Measurement Field` for evaluation metrics and short numeric capture.
- Use `Workout Set Cell` for reps/carga progression blocks.
- Use `Meal Card` for meal summaries and macro blocks.
- Use `Card` or `Data Card` for repeated, meaningful content units. Do not nest cards.
- Use `Table` in Figma and `DataTable` in React for comparable row/column data.
- Use `Table Row` when generating dense operational lists inside tables.
- Use `Modal` for blocking decisions or focused edits.
- Use `Toast` for temporary feedback.
- Use `Header` and `Page Shell` for page-level structure.

## Converted Layer Rules

- Use `Converted/*` families when the goal is to match existing production Figma screens with minimal visual drift.
- Treat `Converted/*` as a migration bridge, not as the long-term semantic API of the system.
- Prefer canonical system families such as `KPI Card`, `Shortcut Card`, `Navigation Item`, and `Measurement Field` for newly generated interfaces.

## Token Rules

- Use semantic colors first: `color-primary`, `color-surface`, `color-text-muted`.
- Avoid raw hex values in product components.
- Use the 4px spacing scale.
- Use official radius tokens and avoid one-off radii.
- Use `Rethink Sans` only.
- Use layout tokens for sidebar width, desktop width, and KPI icon containers.
- Use effect styles for elevation and focus instead of ad hoc shadows.

## Naming Rules

- Figma: `Atoms/Button`, `Molecules/KPI Card`, `Organisms/Sidebar`, `Templates/Page Shell`.
- React: `Button`, `Card`, `Sidebar`.
- Variants: `variant`, `size`, `state`, `tone`, `type`, `role`, `badge`, `collapsed`, `checked`, `emphasis`.
- States: `default`, `hover`, `focus`, `disabled`, `loading`, `error`, `selected`, `active`.
- Converted families: preserve the `Converted/...` prefix during migration work so AI and humans can distinguish screen-derived components from canonical abstractions.
