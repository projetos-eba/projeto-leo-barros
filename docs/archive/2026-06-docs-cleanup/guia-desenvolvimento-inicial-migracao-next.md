# Guia de desenvolvimento inicial para migracao e upgrade

Data de referencia: 16 de junho de 2026.

Este guia substitui operacionalmente o guia inicial anterior para orientar a migracao do projeto real de React + Vite para Next.js, mantendo o produto atual utilizavel durante o processo.

Raiz real:

`/Users/antoniofelipe/Projeto_Leo_Barros`

## 1. Objetivo

Migrar o Projeto Leo Barros de Vite + React Router para Next.js App Router, preservando:

- Funcionalidade atual.
- Integracao Supabase.
- Fidelidade visual ao Figma.
- Design System documentado.
- Sitemap alvo com `/cliente`, `/parceiros` e `/admin`.
- Capacidade de validar por etapas.

## 2. Principio de migracao

Nao fazer big bang.

A migracao deve ser feita por faixas pequenas:

1. Documentacao e mapa de rotas.
2. Base Next.js.
3. Providers e estilos globais.
4. Layouts por perfil.
5. Rotas de Parceiros.
6. Rotas de Cliente.
7. Rotas reais de Admin.
8. Endurecimento de auth, RLS e deploy.

## 3. Estado atual

Stack atual:

- Vite 5.
- React 18.
- React Router DOM.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Radix UI.
- Supabase.
- TanStack Query.
- Vitest.
- ESLint.

Pontos estruturais atuais:

- Rotas em `src/App.tsx`.
- Layout admin em `src/layouts/AdminLayout.tsx`.
- Layout paciente em `src/layouts/PatientLayout.tsx`.
- Sidebar em `src/components/AdminSidebar.tsx`.
- Tokens e classes globais em `src/index.css`.
- Cliente Supabase em `src/integrations/supabase/client.ts`.
- Edge Functions em `supabase/functions/**`.

## 4. Estado alvo

Stack alvo recomendada:

- Next.js com App Router.
- React preservado inicialmente na versao compativel definida no projeto de migracao.
- TypeScript.
- Tailwind CSS.
- shadcn/ui com visual customizado do Projeto Leo.
- Radix UI.
- Supabase.
- TanStack Query quando houver necessidade de cache client-side.
- Vitest ou suite equivalente para testes de regras e componentes.
- Playwright futuramente para smoke visual de rotas criticas.

Regra importante:

Confirmar versoes atuais de Next.js, React e dependencias antes de instalar ou atualizar pacotes. Nao assumir versao mais recente sem verificacao no momento da execucao.

## 5. Estrategia de branch ou pasta paralela

Recomendacao:

Criar uma branch de migracao ou uma pasta paralela temporaria para Next.js, mantendo o Vite como aplicacao funcional ate a primeira faixa de rotas estar validada.

Opcoes:

- `branch`: melhor se o objetivo e substituir o app inteiro no mesmo repositorio.
- `pasta paralela`: melhor se quiser comparar Vite e Next lado a lado por mais tempo.
- `substituicao direta`: nao recomendado neste momento, porque ha muitas rotas, Supabase e divergencias de sitemap.

## 6. Estrutura inicial recomendada no Next.js

```text
src/app/
  layout.tsx
  providers.tsx
  globals.css
  (public)/
    page.tsx
  cliente/
    layout.tsx
    login/page.tsx
    inicio/page.tsx
    dieta/page.tsx
    treino/page.tsx
    saude/page.tsx
    evolucao/page.tsx
    configuracoes/page.tsx
  parceiros/
    layout.tsx
    login/page.tsx
    dashboard/page.tsx
    clientes/page.tsx
    clientes/[id]/layout.tsx
    clientes/[id]/visao-geral/page.tsx
    clientes/[id]/anamnese/page.tsx
    clientes/[id]/avaliacoes/page.tsx
    clientes/[id]/dietas/page.tsx
    clientes/[id]/treino/page.tsx
    clientes/[id]/cardio/page.tsx
    clientes/[id]/exames/page.tsx
    agenda/page.tsx
    materiais/page.tsx
    cadastros/page.tsx
  admin/
    layout.tsx
    login/page.tsx
    dashboard/page.tsx
    profissionais/page.tsx
    clientes/page.tsx
    relatorios/page.tsx
    financeiro/page.tsx
```

## 7. Ordem pratica de implementacao

### Fase 0 - seguranca e preparacao

- Corrigir `.env` versionado.
- Criar `.env.example` sem valores reais.
- Decidir branch ou pasta paralela.
- Rodar baseline do Vite: `npm run lint`, `npm run test`, `npm run build`.

### Fase 1 - fundacao Next.js

- Criar app Next.js.
- Migrar Tailwind, PostCSS e aliases.
- Migrar `src/lib/utils.ts`.
- Migrar componentes `src/components/ui/**`.
- Criar `providers.tsx` com Query Client, Tooltip e Toasters.
- Migrar `src/index.css` para `globals.css` com cuidado.

### Fase 2 - shells

- Criar layout publico.
- Criar layout de Cliente.
- Criar layout de Parceiros.
- Criar layout de Admin real.
- Separar sidebar global de Parceiros da futura sidebar Admin.

### Fase 3 - primeira fatia funcional

Migrar primeiro:

1. `/admin/dashboard` atual -> `/parceiros/dashboard`.
2. `/admin/patients` atual -> `/parceiros/clientes`.
3. `/admin/patients/:id` atual -> `/parceiros/clientes/:id/visao-geral`.

Motivo:

Essas telas validam Supabase, cards, graficos, filtros, listagem, detalhe de cliente, abas e layout autenticado.

### Fase 4 - portal Cliente

Migrar:

1. `/patient` -> `/cliente/inicio`.
2. `/patient/diet` -> `/cliente/dieta`.
3. `/patient/workout` -> `/cliente/treino`.
4. `/patient/evolution` -> `/cliente/evolucao`.
5. Decidir destino de `/patient/exams` e `/patient/prescriptions`.

### Fase 5 - Admin real

Criar telas novas apenas quando houver decisao de produto:

- `/admin/dashboard`
- `/admin/profissionais`
- `/admin/clientes`
- `/admin/relatorios`
- `/admin/financeiro`

## 8. Como migrar uma tela

Checklist por tela:

1. Identificar rota atual.
2. Identificar rota alvo no mapa.
3. Identificar componente de pagina atual.
4. Identificar queries Supabase usadas.
5. Identificar componentes de UI reutilizados.
6. Identificar estados de loading, vazio e erro.
7. Identificar frame/node do Figma, quando houver.
8. Criar page/layout no Next.
9. Adaptar navegacao de `useNavigate` para `next/navigation`.
10. Adaptar parametros de rota de React Router para params/searchParams do Next.
11. Marcar componente como client-side quando necessario.
12. Validar visual e comportamento.

Modelo de pedido para o Codex:

```text
Migre a rota atual [rota atual] para [rota alvo].
Use [componente atual] como base.
Preserve Supabase e comportamento.
Use o mapa de rotas e o sitemap.
Nao remova a rota antiga sem redirect.
Valide com lint, test e build se houver codigo alterado.
```

## 9. Supabase no Next.js

No primeiro momento:

- Manter client-side Supabase onde ja existe.
- Preservar queries atuais antes de otimizar.
- Nao mover `SUPABASE_SERVICE_ROLE_KEY` para cliente.
- Edge Functions continuam em `supabase/functions/**`.

Depois:

- Avaliar client/server split.
- Criar helpers de auth.
- Revisar RLS.
- Separar permissoes de Cliente, Parceiros e Admin.

## 10. Design System e Figma

Regras:

- Figma e fonte visual quando houver frame/node validado.
- Sitemap e fonte para rota/nomenclatura.
- Codigo atual e fonte para comportamento implementado.
- Design System documentado e fonte para tokens e componentes alvo.

Limite atual:

A consulta Figma mais recente retornou apenas `Design Telas`; a busca de Design System nao retornou variaveis/componentes nesta sessao. Portanto, cada tela migrada deve informar o node/frame quando a fidelidade visual for exigida.

## 11. Upgrade visual

O codigo atual usa:

- `Inter`.
- `Plus Jakarta Sans`.
- background preto via HSL.
- classes `glass-card`, `glass-card-hover`, `bento-grid`, `page-enter`, `stagger-fade-in`.

O alvo documentado usa:

- `Rethink Sans`.
- `#0B1720`.
- tokens semanticos do Design System.
- dashboards escuros densos.

Regra:

Nao trocar tudo de uma vez. Migrar visual por tela ou por token com comparacao visual. Primeiro preservar a tela, depois aproximar do Design System.

## 12. Validacao

Baseline Vite:

```bash
npm run lint
npm run test
npm run build
```

Durante Next:

```bash
npm run lint
npm run test
npm run build
```

Adicionar futuramente:

- Smoke visual com Playwright.
- Teste de redirects.
- Auditoria de rotas.
- Auditoria de RLS.

## 13. Cuidados essenciais

- Nao quebrar rotas antigas antes de redirects.
- Nao misturar Parceiros e Admin em novos nomes.
- Nao criar `/paciente` nem `/profissional`.
- Nao inventar permissao sem base real.
- Nao expor valores de `.env`.
- Nao migrar Supabase service role para cliente.
- Nao remover `MobilePreviewPanel` sem decisao, pois ele liga detalhe admin ao preview mobile.
- Nao criar componentes paralelos se `src/components/ui/**` ja resolve a base.

## 14. Proxima entrega recomendada

Criar um plano de execucao da Fase 0 e Fase 1:

1. Resolver `.env`.
2. Criar branch/pasta de migracao.
3. Gerar base Next.js.
4. Migrar providers, Tailwind e componentes UI.
5. Subir primeira rota `/parceiros/dashboard` em Next.
