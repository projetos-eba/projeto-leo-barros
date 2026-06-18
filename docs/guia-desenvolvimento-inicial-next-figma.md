# Guia de desenvolvimento inicial - Next.js com fidelidade ao Figma

Data de referencia: 16 de junho de 2026.

Este guia foi criado apos analise da pasta real do projeto:

`/Users/antoniofelipe/Projeto_Leo_Barros`

Objetivo: orientar o desenvolvimento inicial e a futura migracao para Next.js mantendo fidelidade visual ao Figma `Projeto Leo Barros Atualizado`, reduzindo gasto de tokens e evitando refatoracoes grandes demais.

## 1. Estado atual do projeto

O projeto real hoje nao esta em Next.js. Ele esta em:

- Vite 5.
- React 18.
- TypeScript.
- React Router DOM.
- Tailwind CSS.
- shadcn/ui.
- Radix UI.
- Supabase.
- TanStack Query.
- Vitest.
- ESLint.
- Lovable.

Scripts disponiveis:

- `npm run dev`
- `npm run build`
- `npm run build:dev`
- `npm run lint`
- `npm run preview`
- `npm run test`
- `npm run test:watch`

Rotas atuais ficam em `src/App.tsx` e usam `BrowserRouter`, `Routes` e `Route`.

Layouts principais:

- `src/layouts/AdminLayout.tsx`
- `src/layouts/PatientLayout.tsx`

Areas atuais:

- Admin: `/admin`, `/admin/dashboard`, `/admin/patients`, `/admin/patients/:id`, `/admin/diets`, `/admin/foods`, `/admin/exercises`, `/admin/techniques`, `/admin/forms`, `/admin/materials`, `/admin/agenda`.
- Paciente: `/patient`, `/patient/diet`, `/patient/workout`, `/patient/evolution`, `/patient/exams`, `/patient/prescriptions`.
- Publica: `/` e `/form/:token`.

Ponto critico: o sitemap alvo informado anteriormente usa `/cliente`, `/parceiros` e `/admin`, enquanto o codigo atual usa `/patient` e `/admin/patients`. Essa diferenca precisa virar um plano de migracao de rotas, nao uma troca silenciosa.

## 2. Fontes de verdade para proximas tarefas

Usar esta ordem pratica:

1. Pedido atual do usuario.
2. Figma `Projeto Leo Barros Atualizado`.
3. Sitemap oficial definido para o projeto.
4. Codigo real em `/Users/antoniofelipe/Projeto_Leo_Barros`.
5. Design System local ja analisado em `leo-design-system`, quando a tarefa envolver tokens/componentes/fidelidade.
6. Evidencias locais: `src/App.tsx`, layouts, `src/index.css`, componentes, migrations e funcoes Supabase.

Nesta pasta real nao foi encontrado `AGENTS.md`. Portanto, enquanto ele nao existir aqui, as regras devem ser trazidas do contexto do projeto e registradas em documentacao local.

## 3. Estrategia para migrar para Next.js sem gastar muito token

Nao recomendo reescrever tudo de uma vez. O caminho mais eficiente e migrar por camadas, preservando comportamento e visual.

Fluxo recomendado:

1. Congelar um mapa do estado atual.
   Registrar rotas, telas, dependencias Supabase, componentes reutilizados e diferencas de nomenclatura.

2. Criar uma base Next.js paralela ou branch de migracao.
   Evitar misturar a migracao estrutural com refatoracao visual profunda na mesma tarefa.

3. Migrar primeiro a fundacao.
   Levar `src/index.css`, Tailwind, aliases, `cn`, componentes `ui`, providers globais e cliente Supabase.

4. Migrar shell e layouts.
   Converter `AdminLayout` e `PatientLayout` para layouts do App Router, respeitando a futura separacao `/cliente`, `/parceiros` e `/admin`.

5. Migrar pagina por pagina.
   Cada pagina deve ter um ticket pequeno: rota, frame do Figma, componentes, dados, estados e validacao.

6. Refatorar nomenclatura por perfil.
   Trocar `patient` para `cliente` e separar `admin` de `parceiros` com cuidado, porque hoje o admin tambem executa tarefas operacionais de parceiro.

7. So depois endurecer arquitetura.
   Auth, permissoes, RLS e organizacao server/client devem vir quando a rota ja estiver fiel visualmente e funcional.

Modelo economico de prompt por tela:

```text
Migre/refatore a tela [nome] da rota atual [rota atual] para a rota alvo [rota alvo].
Use o Figma [node/link] como referencia visual.
Preserve as queries Supabase existentes.
Use componentes shadcn existentes, mas ajuste a aparencia para o Design System do Projeto Leo.
Atualize apenas arquivos relacionados.
Valide com npm run lint, npm run test e npm run build quando fizer sentido.
```

## 4. Melhor caminho: pagina por pagina, mas com fundacao antes

Refatorar pagina por pagina e o melhor caminho, desde que a fundacao venha antes.

Ordem sugerida:

1. Documentar o mapa Vite atual e o mapa Next alvo.
2. Criar ou atualizar um `AGENTS.md` dentro da raiz real.
3. Resolver seguranca de `.env` e versionamento.
4. Definir tokens finais do Design System no CSS/Tailwind.
5. Criar shell autenticado Next para `/cliente`, `/parceiros` e `/admin`.
6. Migrar primeira tela operacional: recomendo dashboard/listagem de clientes.
7. Migrar detalhe de cliente, porque concentra abas, dados, formularios, dieta, treino, exames e avaliacoes.
8. Migrar portal do cliente.
9. Migrar fluxos profundos: dieta, treino, exames, formularios, materiais, agenda e IA.

Primeiras telas recomendadas:

- Atual: `/admin/dashboard` -> alvo provavel: `/parceiros/dashboard`.
- Atual: `/admin/patients` -> alvo provavel: `/parceiros/clientes`.
- Atual: `/admin/patients/:id` -> alvo provavel: `/parceiros/clientes/:id/visao-geral`.
- Atual: `/patient` -> alvo provavel: `/cliente/inicio`.

## 5. Cuidados de fidelidade visual ao Figma

O projeto atual usa um visual escuro com `Inter` e `Plus Jakarta Sans`, tokens HSL e classes como `glass-card`, `glass-card-hover`, `bento-grid`, `btn-primary` e animacoes customizadas.

O Design System alvo do Projeto Leo usa:

- Tipografia `Rethink Sans`.
- Background `#0B1720`.
- Superficies densas.
- Azul como acao principal.
- Sidebar como navegacao global autenticada.
- Tabs apenas para navegacao local.
- Escala de spacing de 4px.
- Componentes e tokens semanticos.

Cuidados:

- Nao aplicar visual padrao de shadcn/ui como destino final.
- Nao criar um segundo Design System paralelo.
- Nao trocar tudo para `Rethink Sans` sem conferir impacto visual tela por tela.
- Nao remover `glass-card` ate existir substituto fiel no Design System.
- Nao transformar cards em wrappers genericos de pagina.
- Nao misturar rota, permissao e nomenclatura em uma unica refatoracao grande.
- Confirmar cada frame/node do Figma antes de refatorar uma tela.

Limitacao verificada: a consulta atual ao Figma retornou apenas a pagina `Design Telas`. O contexto anterior do projeto registra tambem `Design System` e `Sitemap`, entao cada tarefa visual deve confirmar o node exato antes de implementar.

## 6. Riscos e atencoes tecnicas

Seguranca:

- `.env` existe e esta rastreado pelo Git.
- O `.gitignore` nao ignora `.env` explicitamente.
- Nao repetir valores do `.env` em documentacao, logs ou prompts.
- Adicionar `.env` ao `.gitignore`, criar `.env.example` sem valores reais e revisar historico/rotacao caso algum segredo real tenha sido exposto.

Supabase:

- Ha migrations, cliente tipado e funcoes em `supabase/functions`.
- Funcoes usam service role por variavel de ambiente no ambiente Deno.
- Foram identificadas varias policies amplas com `USING (true)` e `WITH CHECK (true)`.
- Antes de producao, revisar RLS, ownership por usuario, acesso por perfil e isolamento entre cliente/parceiro/admin.

Rotas:

- Codigo atual usa `/patient`.
- Sitemap alvo usa `/cliente`.
- Codigo atual usa `patients`/`Pacientes`.
- Sitemap alvo usa `clientes`/`Clientes`.
- Codigo atual concentra funcoes operacionais em `/admin`; sitemap alvo separa `Parceiros` de `Admin`.

Next.js:

- A migracao precisa substituir React Router por App Router.
- Componentes que usam `useState`, `useEffect`, `useNavigate`, `localStorage`, `window` ou Supabase client no browser devem ser `use client`.
- Providers atuais (`QueryClientProvider`, tooltips e toasts) devem virar providers no layout raiz do Next.
- Supabase pode continuar client-side no inicio, mas auth/permissao devem ser desenhados antes de producao.

Qualidade:

- O TypeScript atual nao esta em modo estrito.
- Existe Vitest, mas o teste atual e apenas exemplo.
- Existe ESLint.
- Nao foi identificado Storybook nesta pasta real.

## 7. Skills recomendadas para este projeto

Criar primeiro:

- `leo-real-project-orientation`
  Leitura rapida da raiz real, stack, rotas, Supabase, scripts e riscos antes de qualquer tarefa.

- `leo-vite-to-next-migration`
  Guia para migrar uma tela Vite/React Router para Next App Router sem alterar comportamento e sem perder fidelidade visual.

- `leo-page-refactor-figma`
  Refatoracao tela por tela com rota atual, rota alvo, node do Figma, componentes usados, dados Supabase e checklist de estados.

- `leo-route-sitemap-sync`
  Compara `src/App.tsx` ou `src/app/**` com o sitemap alvo e aponta divergencias de `/patient`, `/cliente`, `/parceiros` e `/admin`.

- `leo-token-visual-guard`
  Procura cores soltas, radius fora da escala, fontes divergentes, classes visuais paralelas e uso indevido de shadcn default.

Criar depois:

- `leo-supabase-rls-audit`
  Revisa migrations, policies, funcoes e riscos de acesso amplo.

- `leo-env-security-audit`
  Garante que `.env` nao esteja versionado e que exemplos nao exponham valores reais.

- `leo-figma-react-visual-audit`
  Compara screenshot da tela implementada com o frame do Figma e gera uma lista objetiva de ajustes.

- `leo-a11y-interactions-audit`
  Revisa foco, aria, labels, dialogs, tabs, navegacao por teclado e contraste.

Prioridade:

1. `leo-real-project-orientation`.
2. `leo-vite-to-next-migration`.
3. `leo-page-refactor-figma`.
4. `leo-route-sitemap-sync`.
5. `leo-env-security-audit`.

## 8. Checklist antes de iniciar desenvolvimento pesado

- Criar `AGENTS.md` na raiz real.
- Criar `docs/sitemap-projeto-leo-barros.md` na raiz real ou apontar oficialmente para o arquivo valido.
- Decidir se a migracao para Next.js sera feita em branch, pasta paralela ou substituindo Vite gradualmente.
- Corrigir tratamento de `.env`.
- Mapear rota atual x rota alvo.
- Definir qual perfil vem primeiro: Cliente, Parceiros ou Admin.
- Escolher a primeira tela do Figma com node/frame especifico.
- Definir tokens finais antes de refatorar muitos componentes.
- Criar criterio de pronto por tela: visual, responsividade, estados, dados, lint, teste e build.

## 9. Validacao recomendada

Enquanto o projeto ainda estiver em Vite:

```bash
npm run lint
npm run test
npm run build
```

Durante migracao para Next.js:

```bash
npm run lint
npm run test
npm run build
```

Se Storybook for criado no futuro, adicionar validacao visual de componentes antes de migrar muitas telas.

## 10. Recomendacao objetiva

Minha recomendacao para comecar:

1. Criar `AGENTS.md` na raiz real com as regras oficiais.
2. Corrigir o risco do `.env` versionado.
3. Criar um documento de mapa de rotas atual x sitemap alvo.
4. Preparar uma branch/pasta de migracao Next.js.
5. Migrar primeiro `/admin/dashboard` para o papel de `/parceiros/dashboard`, porque essa tela valida layout, cards, graficos, filtros, estados vazios e Supabase.

