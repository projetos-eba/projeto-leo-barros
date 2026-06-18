# Plano de execução das Fases 1 a 7 da migração para Next.js

Data de referência: 18 de junho de 2026.

Este documento orienta a migração controlada do Projeto Leo Barros de Vite + React Router para Next.js com App Router após a conclusão da Fase 0.

Regras gerais para todas as fases:

- Ler `AGENTS.md` antes de agir.
- Executar uma fase por vez.
- Não remover o legado Vite enquanto a equivalência funcional não estiver validada.
- Não alterar rotas, arquitetura, providers, layouts, dependências, autenticação ou permissões sem autorização explícita.
- Preservar Supabase, tokens, classes visuais e comportamento antes de otimizar.
- Executar `npm run lint`, `npm run test` e `npm run build` quando houver código alterado.
- Registrar qualquer validação que não puder ser executada.

## Fase 1 - Fundação Next.js

### Objetivo

Criar a fundação mínima do Next.js com App Router sem migrar telas de negócio e sem remover o Vite.

### Análise

O projeto ainda usa `src/main.tsx`, `src/App.tsx`, `BrowserRouter` e scripts Vite. A Fase 1 deve introduzir o Next.js de forma paralela ou controlada, mantendo a aplicação atual como referência executável.

Decisões que exigem aprovação:

- Versão de Next.js e React.
- Instalação de `next` e dependências relacionadas.
- Estratégia de convivência entre Vite e Next.js.
- Scripts e diretório usados para executar cada aplicação.

### Escopo sugerido

- Confirmar versões compatíveis de Next.js e React.
- Instalar somente dependências aprovadas.
- Criar `src/app/layout.tsx` e uma página mínima de verificação.
- Configurar TypeScript, alias `@/*` e metadata básica.
- Não migrar rotas reais.
- Não remover `src/main.tsx`, `src/App.tsx`, Vite ou React Router.

### Critério de conclusão

- Next.js inicia e gera build mínimo.
- Vite permanece intacto e executável.
- Nenhuma rota de negócio foi alterada.

### Prompt sugerido

```text
Codex, leia obrigatoriamente o AGENTS.md antes de qualquer ação.

Autorizo implementar somente a Fase 1 da migração: Fundação Next.js.

Antes de instalar qualquer dependência, confirme as versões recomendadas e apresente o impacto no package.json. Pare e peça minha aprovação explícita para a instalação.

Após a aprovação:
- Crie a fundação mínima do Next.js com App Router.
- Preserve integralmente o app Vite, src/App.tsx, src/main.tsx e React Router.
- Configure TypeScript e o alias @/*.
- Crie apenas root layout e uma página técnica mínima, sem migrar rotas de negócio.
- Não altere Supabase, auth, providers atuais, layouts atuais, migrations, policies ou Edge Functions.
- Execute lint, testes e builds disponíveis para os dois ambientes.
- Não faça commit.

Entregue Resumo, Arquivos alterados, Validação, Comandos executados, Limitações, Riscos e Próximos passos.
```

## Fase 2 - Providers, Tailwind, shadcn/ui e tokens

### Objetivo

Transportar a fundação visual e os providers globais para o Next.js sem alterar a aparência ou o comportamento do Vite.

### Análise

Hoje `src/App.tsx` cria `QueryClientProvider`, `TooltipProvider`, Toaster e Sonner. `src/index.css` concentra variáveis HSL e classes customizadas. O Next.js precisará de um `providers.tsx` client-side e de `globals.css`.

Pontos de atenção:

- O `QueryClient` não deve ser compartilhado entre requisições.
- `sonner.tsx` usa `next-themes`, mas não há `ThemeProvider` global identificado.
- `components.json` está com `rsc: false`.
- A maioria dos componentes Radix precisa de fronteira client-side.

### Escopo sugerido

- Criar `src/app/providers.tsx`.
- Migrar Query Client, Tooltip e toasters.
- Copiar tokens e classes atuais para `globals.css` sem redesenho.
- Preservar Tailwind 3 inicialmente.
- Classificar componentes UI entre server-compatible e client-side.
- Não trocar ainda as fontes atuais por `Rethink Sans`.

### Critério de conclusão

- Providers funcionam no shell Next.js.
- Classes visuais atuais continuam disponíveis.
- Não há regressão visual no conteúdo técnico mínimo.

### Prompt sugerido

```text
Codex, leia obrigatoriamente o AGENTS.md antes de qualquer ação.

Autorizo implementar somente a Fase 2: providers, Tailwind, shadcn/ui e tokens no Next.js.

- Crie um providers.tsx client-side para TanStack Query, Tooltip e os toasters existentes.
- Preserve os providers e o comportamento do app Vite.
- Migre src/index.css para a fundação globals.css do Next.js sem alterar valores visuais.
- Preserve as classes glass-card, glass-card-hover, bento-grid, btn-primary, page-enter e stagger-fade-in.
- Mantenha Tailwind 3 e o alias @/*.
- Não altere rotas, layouts de negócio, Supabase, auth, migrations, policies ou Edge Functions.
- Não instale dependências sem minha aprovação explícita.
- Execute lint, testes e builds disponíveis.
- Não faça commit.

Entregue Resumo, Arquivos alterados, Validação, Comandos executados, Limitações, Riscos e Próximos passos.
```

## Fase 3 - Layouts globais

### Objetivo

Criar os shells de navegação Público, Cliente, Parceiros e Admin no App Router.

### Análise

Os layouts atuais dependem de `Outlet`, React Router, `localStorage` e navegação imperativa. A área `/admin` atual representa principalmente Parceiros, enquanto o Admin alvo deve ser separado.

Pontos de atenção:

- Converter `Outlet` para `{children}`.
- Converter `NavLink` para `Link` combinado com `usePathname`.
- Manter `AdminSidebar`, `PatientLayout` e `MobilePreviewPanel` como Client Components inicialmente.
- Não criar rotas finais ou regras de permissão nesta fase sem aprovação.

### Escopo sugerido

- Criar estruturas de layout sem páginas funcionais.
- Criar shell Público.
- Criar shell Cliente.
- Criar shell Parceiros baseado no layout administrativo atual.
- Criar shell Admin vazio e visualmente consistente, sem inventar funcionalidades.

### Critério de conclusão

- Os quatro shells renderizam conteúdo de teste.
- A navegação ainda não substitui as rotas legadas.
- Nenhuma permissão foi inventada.

### Prompt sugerido

```text
Codex, leia obrigatoriamente o AGENTS.md antes de qualquer ação.

Autorizo implementar somente a Fase 3: layouts globais do App Router.

- Crie shells separados para Público, Cliente, Parceiros e Admin.
- Use {children} no lugar de Outlet.
- Preserve AdminLayout, PatientLayout, AdminSidebar e MobilePreviewPanel do Vite.
- Use o layout administrativo atual apenas como referência para Parceiros.
- Não invente conteúdo ou permissões para o Admin real.
- Não migre páginas de negócio e não crie redirects.
- Não altere Supabase, auth, migrations, policies ou Edge Functions.
- Não instale dependências sem aprovação.
- Valide responsividade básica, lint, testes e build.
- Não faça commit.

Entregue Resumo, Arquivos alterados, Validação, Comandos executados, Limitações, Riscos e Próximos passos.
```

## Fase 4 - Rotas públicas

### Objetivo

Migrar login, formulário público por token e página não encontrada.

### Análise

A rota `/` concentra login de Cliente e Admin/Parceiro. O sitemap exige logins separados. `/form/:token` não consta no sitemap, mas possui funcionalidade real e deve ser preservada como exceção pública até decisão.

Decisões necessárias:

- Manter login único temporário ou criar três logins.
- Destino pós-login de Parceiro e Admin.
- Preservação da rota `/form/:token`.

### Escopo sugerido

- Migrar `NotFound` para `not-found.tsx`.
- Migrar `/form/:token` para `/form/[token]`.
- Migrar o login apenas após decisão explícita.
- Preservar o fluxo Supabase atual nesta fase.

### Critério de conclusão

- Formulário público mantém comportamento por token.
- Login aprovado funciona sem regressão.
- Rotas legadas continuam disponíveis ou têm redirect aprovado.

### Prompt sugerido

```text
Codex, leia obrigatoriamente o AGENTS.md antes de qualquer ação.

Autorizo analisar e implementar somente a Fase 4: rotas públicas.

Antes de editar, apresente para minha decisão:
1. login único temporário; ou
2. logins separados para Cliente, Parceiros e Admin.

Após minha decisão:
- Migre somente as rotas públicas aprovadas.
- Preserve /form/:token como fluxo funcional, usando /form/[token] no App Router.
- Crie not-found.tsx.
- Não altere comportamento de autenticação, Supabase, RLS ou Edge Functions.
- Não remova rotas Vite e não crie redirects sem aprovação explícita.
- Preserve aparência, loading, erro e estados concluídos.
- Execute lint, testes e builds disponíveis.
- Não faça commit.

Entregue Resumo, Arquivos alterados, Validação, Comandos executados, Limitações, Riscos e Próximos passos.
```

## Fase 5 - Área Cliente

### Objetivo

Migrar o portal atual `/patient` para a nomenclatura alvo `/cliente`.

### Análise

As telas atuais misturam dados reais e mocks. Dieta, evolução e exames possuem partes mockadas; treino e prescrições consultam o usuário no Supabase. A migração de framework não deve ser misturada com substituição de dados.

Mapa principal:

- `/patient` para `/cliente/inicio`.
- `/patient/diet` para `/cliente/dieta` ou `/cliente/dieta/plano`.
- `/patient/workout` para `/cliente/treino` ou `/cliente/treino/programa-atual`.
- `/patient/evolution` para `/cliente/evolucao` ou `/cliente/evolucao/corporal`.
- Exames e prescrições dependem de decisão de produto.

### Escopo sugerido

- Migrar uma rota por entrega.
- Preservar mocks e consultas atuais.
- Converter navegação para `next/navigation`.
- Criar redirects somente após aprovação.
- Preservar o modo preview do cliente.

### Critério de conclusão

- Cada tela migrada mantém comportamento e aparência.
- Loading, vazio e erro foram verificados.
- O legado não foi removido antes da validação.

### Prompt sugerido

```text
Codex, leia obrigatoriamente o AGENTS.md antes de qualquer ação.

Autorizo implementar somente a primeira entrega da Fase 5: migrar /patient para /cliente/inicio.

- Preserve o comportamento e os dados atuais, inclusive mocks existentes.
- Não migre ainda dieta, treino, evolução, exames ou prescrições.
- Não altere Supabase, auth, migrations, policies ou Edge Functions.
- Preserve o modo de preview e a responsividade.
- Não remova /patient e não crie redirect sem minha aprovação explícita.
- Use componentes existentes e os tokens atuais.
- Consulte o Figma somente com node/frame verificável; registre limitação se não estiver acessível.
- Execute lint, testes e builds disponíveis.
- Não faça commit.

Entregue Resumo, Arquivos alterados, Validação, Comandos executados, Limitações, Riscos e Próximos passos.
```

## Fase 6 - Área Parceiros

### Objetivo

Migrar a operação profissional atualmente localizada em `/admin` para `/parceiros`.

### Análise

O dashboard, a listagem de pacientes e o detalhe do paciente são funcionalidades de Parceiros. O detalhe usa abas locais, enquanto o sitemap pede rotas contextuais com `:id`.

Primeira fatia recomendada:

- `/admin/dashboard` para `/parceiros/dashboard`.
- `/admin/patients` para `/parceiros/clientes`.
- `/admin/patients/:id` para `/parceiros/clientes/:id/visao-geral`.

As rotas de agenda, materiais, cadastros, formulários, dietas e treino devem ser migradas em entregas posteriores.

### Escopo sugerido

- Migrar uma fatia vertical que valide layout, Supabase e navegação.
- Preservar nomenclatura do banco `patients` inicialmente.
- Não transformar todas as abas em rotas de uma vez.
- Manter `MobilePreviewPanel`.

### Critério de conclusão

- Dashboard, lista e visão geral funcionam em `/parceiros`.
- Consultas Supabase permanecem equivalentes.
- Legado `/admin` continua acessível até redirects aprovados.

### Prompt sugerido

```text
Codex, leia obrigatoriamente o AGENTS.md antes de qualquer ação.

Autorizo implementar somente a primeira fatia da Fase 6:
- /admin/dashboard para /parceiros/dashboard
- /admin/patients para /parceiros/clientes
- /admin/patients/:id para /parceiros/clientes/:id/visao-geral

Antes de criar as rotas, apresente o plano exato de arquivos e aguarde minha confirmação final.

Após a confirmação:
- Preserve queries Supabase e comportamento atual.
- Preserve MobilePreviewPanel.
- Não renomeie tabelas, campos ou tipos patient/patients.
- Não altere auth, RLS, migrations, policies ou Edge Functions.
- Não remova rotas legadas e não crie redirects sem aprovação.
- Não migre ainda abas contextuais, agenda, materiais ou cadastros.
- Execute lint, testes e builds disponíveis.
- Não faça commit.

Entregue Resumo, Arquivos alterados, Validação, Comandos executados, Limitações, Riscos e Próximos passos.
```

## Fase 7 - Área Admin

### Objetivo

Criar a área administrativa real da plataforma sem reutilizar silenciosamente as telas operacionais de Parceiros.

### Análise

O sitemap define Dashboard, Profissionais, Clientes, Relatórios e Financeiro. Implementações e regras de negócio correspondentes não foram identificadas nos arquivos analisados.

`Não identificado nos arquivos analisados.`:

- Métricas administrativas reais.
- Modelo de profissionais/parceiros.
- Regras de assinatura e financeiro.
- Auditoria administrativa.
- MFA.
- Permissões detalhadas do Super Admin.

Esta fase exige definição de produto antes de código.

### Escopo sugerido

- Começar por especificação funcional e contratos de dados.
- Não criar telas fictícias como se fossem produção.
- Criar apenas shells ou placeholders explicitamente aprovados.
- Adiar alterações de banco e permissão para uma fase de segurança dedicada.

### Critério de conclusão

- Regras de negócio e fontes de dados estão aprovadas.
- Cada tela possui escopo e permissões definidos.
- Não há mistura entre Parceiros e Admin.

### Prompt sugerido

```text
Codex, leia obrigatoriamente o AGENTS.md antes de qualquer ação.

Trabalhe somente em auditoria e especificação da Fase 7: área Admin real.

Não edite arquivos nesta etapa.

Para cada área do sitemap Admin — Dashboard, Profissionais, Clientes, Relatórios e Financeiro:
- Liste o que já existe no código e banco.
- Escreva “Não identificado nos arquivos analisados.” quando não houver evidência.
- Liste decisões de produto, dados e permissão necessárias.
- Proponha uma ordem de implementação sem criar rotas ou componentes.
- Não invente métricas, regras financeiras, papéis ou permissões.

Entregue um relatório e um prompt posterior para implementar apenas a primeira tela que tiver requisitos aprovados.
```

## Dependências entre fases

| Fase | Depende de |
|---|---|
| 1 | Fase 0 concluída e aprovação para instalar Next.js |
| 2 | Fundação Next.js funcionando |
| 3 | Providers e estilos carregando |
| 4 | Shell público e decisão sobre logins |
| 5 | Layout Cliente e decisões de rotas |
| 6 | Layout Parceiros e decisões de transição |
| 7 | Definições de produto, dados e permissões |

## Regra de encerramento

Não iniciar uma fase seguinte apenas porque a anterior gerou build. Cada fase exige revisão dos riscos, validação funcional e aprovação explícita do usuário.
