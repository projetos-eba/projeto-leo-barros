# Implementation Roadmap

## Completed Foundation

- Figma page `Design System` created.
- Figma variables created for color, spacing, sizing, radius, motion, shadow support, opacity, z-index, layout, and typography support.
- Figma text styles created with `Rethink Sans`.
- Figma base components created with Auto Layout, variants, and AI metadata.
- Design System expanded to `32` component sets and `3` standalone components.
- `Converted/*` component families created from real screens for safe migration.
- Local Next.js package scaffolded with App Router and Storybook.

## Next Product Integration Steps

1. Replace repeated sidebar items with `Converted/Navigation Item` or `Molecules/Navigation Item` instances, depending on migration fidelity needs.
2. Replace repeated KPI and shortcut cards with `Converted/KPI Card`, `Converted/Shortcut Card`, `Molecules/KPI Card`, and `Molecules/Shortcut Card`.
3. Replace repeated form layers with `Converted/Form Field`, `Atoms/Form Controls`, and `Molecules/Measurement Field`.
4. Replace repeated table rows and status badges with `Converted/Table Row`, `Molecules/Table Row`, and `Atoms/Badge`.
5. Replace workout and meal patterns with `Converted/Workout Set Cell`, `Converted/Meal Block`, `Molecules/Workout Set Cell`, and `Molecules/Meal Card`.
6. Promote the strongest screen shells into template-driven production screens using `Organisms/Header`, `Organisms/Sidebar`, and `Templates/Page Shell`.
7. Add Code Connect once the production repository path is available.
8. Install dependencies, run the Next.js app, and run Storybook visual QA.

## Migration Strategy

Use a two-track adoption model:

1. `Converted/*` components for high-fidelity replacement of existing screen fragments.
2. Canonical `Atoms/*`, `Molecules/*`, `Organisms/*`, and `Templates/*` for all new screen generation.

This reduces visual regressions while gradually moving the file toward a cleaner semantic API.

## Storybook Usage

```bash
npm install
npm run dev
npm run storybook
```

Next.js runs on `http://localhost:3000` and Storybook runs on `http://localhost:6006` by default.

## Próximos passos — revisão 2026-06-16

1. Corrigir segurança de `.env` versionado.
2. Criar mapa `rotas atuais x rotas alvo`.
3. Atualizar documentos `docs/PROJECT.md` e `docs/IMPLEMENTATION_ROADMAP.md` para refletir Vite atual e migração futura para Next.js.
4. Definir se a migração para Next.js será feita em branch, pasta paralela ou substituição gradual.
5. Criar skill ou checklist `leo-vite-to-next-migration`.
6. Criar auditoria `Figma x React` por tela, sempre com node/frame específico.
