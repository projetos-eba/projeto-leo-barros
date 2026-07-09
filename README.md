# Projeto Leo Barros

Aplicacao oficial em Next.js App Router para os perfis Cliente, Parceiros e Admin.

## Stack atual

- Next.js 16 com App Router
- React 18 e TypeScript
- Tailwind CSS e componentes shadcn/ui locais
- Supabase local com migrations, seed e Edge Functions
- Vitest para testes unitarios e de componentes
- ESLint para qualidade estatica

## Primeira instalacao

```bash
npm install
npm run db:start
npm run dev
```

A aplicacao roda em `http://localhost:3000`.
O Supabase Studio local roda em `http://127.0.0.1:54323`.

## Comandos principais

```bash
npm run dev       # Next.js em desenvolvimento
npm run build     # build de producao
npm run start     # servidor Next apos build
npm run lint      # ESLint
npm run test      # Vitest
npm run test:watch
```

## Banco local

```bash
npm run db:start   # inicia Supabase local
npm run db:status  # mostra URLs e status local
npm run db:reset   # recria o banco local aplicando migrations e seed
npm run db:stop    # para Supabase local
```

As migrations ficam em `supabase/migrations` e dados de sistema/smoke ficam em `supabase/seed.sql`.

## Variaveis locais

Copie `.env.example` para `.env.local` e preencha as variaveis publicas locais:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Nao coloque service role ou segredos em codigo client-side.

## Validacoes de desenvolvimento

```bash
npm run validate:admin-partner-flow
npm run dev:seed-admin-dashboard-smoke
npm run dev:seed-partner-materials-storage
npm run dev:seed-client-photos-storage
```

Use `docs/fase-f0-next-oficial.md` e os Page Profiles em `docs/page-profiles/` como referencia operacional antes de alterar telas funcionais.
