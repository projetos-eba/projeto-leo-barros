# Leo Barros Design System

Design System extracted from the Figma project `Projeto Leo Barros Atualizado`.

The system uses Next.js, shadcn/ui architecture, and naming conventions while preserving the product identity: dark clinical dashboards, blue action color, dense data surfaces, and `Rethink Sans`.

Current Figma status:

- `Design System` page refined and expanded.
- `64` variables across color, size, radius, motion, shadow, opacity, z-index, layout, and typography support collections.
- `32` component sets plus `3` standalone components.
- `12` `Converted/*` component families cloned from real product screens to preserve visual fidelity while the library is adopted.

## What Is Included

- Figma-ready token model: colors, typography, spacing, radius, shadows, sizing, motion, z-index.
- Next.js App Router shell with React components using shadcn-like composition and variants.
- Storybook stories for foundations, atoms, molecules, and organisms.
- AI metadata documentation for future interface generation.
- `components.json` prepared for shadcn-compatible workflows.
- A local execution ledger in `figma-refinement-ledger.json`.

## Components

- Atoms: `Icon`, `Avatar`, `Boolean Control`, `Button`, `Form Controls`, `Badge`.
- Molecules: `Navigation Item`, `KPI Card`, `Shortcut Card`, `Card`, `Data Card`, `Measurement Field`, `Table Row`, `Chart Legend`, `Workout Set Cell`, `Meal Card`, `Tabs`.
- Organisms: `Sidebar`, `Header`, `Table`, `Modal`, `Toast`.
- Templates: `Page Shell`.

## Converted Families

These component sets were extracted from real Figma screens and kept as a parallel library layer for migration work:

- `Converted/Navigation Item`
- `Converted/KPI Card`
- `Converted/Shortcut Card`
- `Converted/Button`
- `Converted/Form Field`
- `Converted/Badge`
- `Converted/Table Row`
- `Converted/Measurement Field Group`
- `Converted/Workout Set Cell`
- `Converted/Meal Block`
- `Converted/Sidebar`
- `Converted/Chart Legend`

## Run Next.js

```bash
npm install
npm run dev
```

Next.js will run at `http://localhost:3000`.

## Run Storybook

```bash
npm run storybook
```

Storybook will run at `http://localhost:6006`.

## Design Principles

- Figma remains the visual source of truth.
- Use semantic tokens before raw values.
- Prefer variants over duplicate components.
- Keep the interface dense, clear, and operational.
- Do not import the default visual style of shadcn/ui; only use its structure and accessibility patterns.
- Prefer the system component sets first; use `Converted/*` while replacing repeated production layers safely.
