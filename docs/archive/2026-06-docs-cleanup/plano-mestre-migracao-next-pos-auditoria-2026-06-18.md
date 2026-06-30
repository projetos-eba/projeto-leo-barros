# Plano mestre de migração para Next.js pós-auditoria

Data de referência: 18 de junho de 2026.

Raiz auditada: `/Users/antoniofelipe/Projeto_Leo_Barros`

Documento anterior consultado: `docs/plano-execucao-fases-1-a-7-migracao-next.md`

## 1. Objetivo

Este documento substitui o plano anterior como referência operacional atualizada para a migração controlada do Projeto Leo Barros de Vite + React Router para Next.js com App Router.

O plano foi recalibrado a partir do código real, da documentação central, do estado Git e das validações executadas. Ele não autoriza automaticamente nenhuma implementação. Cada fase continua dependendo de escopo explícito e dos gates de confirmação definidos em `AGENTS.md`.

## 2. Resumo da auditoria

O produto principal continua em Vite 5, React 18 e React Router DOM. A fundação Next.js 16.2.2 já existe em paralelo, isolada por arquivos `*.next.tsx`, configuração TypeScript própria e scripts dedicados.

As antigas Fases 1 e 2 já possuem implementação local:

- Fase 1: fundação Next.js, scripts, configuração, layout raiz e página técnica.
- Fase 2: `AppProviders`, Tailwind, cópia dos estilos globais e toasters.

Ambas geram build. Em 18 de junho de 2026, a Fase 2 foi formalmente encerrada após validação visual/runtime, remoção da dependência conceitual de `next-themes` no Sonner, ajuste do `components.json` para o App Router e criação de testes mínimos dos providers.

O legado Vite continua funcional e gera build, mas possui dívida técnica relevante:

- lint global com `99` erros e `25` avisos;
- apenas `1` teste automatizado, de exemplo;
- bundle principal Vite com aproximadamente `2,26 MB` minificado e `640,91 kB` gzip;
- forte acoplamento a React Router, `localStorage`, `window` e Supabase client-side;
- policies Supabase amplas, incluindo regras com `USING (true)`, `WITH CHECK (true)` e acesso `public`;
- diferença entre rotas atuais (`/patient` e operação profissional em `/admin`) e sitemap alvo (`/cliente`, `/parceiros`, `/admin`).

## 3. Caminhos acessados

### Governança e documentação

- `AGENTS.md`
- `README.md`
- `handoff_versao_16072026.md`
- `docs/plano-execucao-fases-1-a-7-migracao-next.md`
- `docs/sitemap-projeto-leo-barros.md`
- `docs/mapa-rotas-atuais-x-rotas-alvo.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/TOKENS.md`
- `docs/IMPLEMENTATION_ROADMAP.md`
- `docs/guia-desenvolvimento-inicial-migracao-next.md`

### Configuração e ferramentas

- `package.json`
- `package-lock.json`
- `next.config.ts`
- `vite.config.ts`
- `vitest.config.ts`
- `eslint.config.js`
- `tailwind.config.ts`
- `postcss.config.js`
- `components.json`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.next.json`
- `tsconfig.node.json`

### Aplicação Vite e fundação Next.js

- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `src/app/layout.next.tsx`
- `src/app/page.next.tsx`
- `src/app/providers.next.tsx`
- `src/app/globals.css`
- `src/layouts/**`
- `src/pages/**`
- `src/components/**`
- `src/hooks/**`
- `src/integrations/supabase/**`
- `src/test/**`

### Backend e banco

- `supabase/config.toml`
- `supabase/functions/**`
- `supabase/migrations/**`

Não foram lidos valores de `.env` ou `.env.local`.

## 4. Inventário técnico atual

| Área | Estado verificado |
|---|---|
| Aplicação produtiva | Vite 5 + React 18 + React Router DOM |
| Fundação paralela | Next.js 16.2.2 com App Router |
| UI | Tailwind CSS 3.4.17, shadcn/ui local e Radix UI |
| Cache client-side | TanStack Query 5 |
| Backend | Supabase client-side, 24 migrations e 3 Edge Functions |
| Testes | Vitest; 1 teste de exemplo |
| Lint | ESLint 9; baseline atual falha |
| TypeScript | Não estrito no legado; configuração Next isolada também não estrita |
| Rotas Next de negócio | Nenhuma |
| Storybook nesta raiz | Não identificado nos arquivos analisados. |
| Figma nesta auditoria | Não consultado; a auditoria foi estrutural e documental. |

Contagem aproximada do código auditado:

- `163` arquivos TypeScript/TSX em `src`;
- `49` arquivos em `src/components/ui`;
- `21` páginas React;
- `24` migrations Supabase;
- `3` Edge Functions;
- `6` arquivos de teste.

## 5. Estado da migração

| Marco | Estado | Evidência | Pendência para encerrar |
|---|---|---|---|
| Fase 0 — preparação e segurança | Parcial | `.env` e `.env.local` ignorados; `.env.example` rastreado | Verificar histórico Git e planejar rotação se houve exposição |
| Fase 1 — fundação Next.js | Implementada e compilando | `next.config.ts`, `tsconfig.next.json`, scripts e `src/app/*.next.tsx` | Registrar smoke local e critério formal de aceite |
| Fase 2 — providers e estilos | Encerrada em 18/06/2026 | Providers, estilos, Tooltip, toasters, `components.json`, testes e smoke runtime validados | Manter o baseline nas fases seguintes |
| Fase 3 — layouts globais | Encerrada em 18/06/2026 | Shells Público, Cliente, Parceiros e Admin, testes e build Next validados | Manter placeholders sem conteúdo de negócio |
| Fase 3.5 — infraestrutura mínima de testes | Encerrada em 19/06/2026 | Smoke Vite, smoke da página pública Next existente, contrato da rota legada e estratégia de mocks Supabase | Reavaliar Playwright quando uma rota pública for migrada |
| Fase 4.0 — preparação do login | Encerrada em 19/06/2026 | `LoginView` extraído; autenticação e navegação Vite preservadas | Manter componente apresentacional desacoplado |
| Fase 4.1 — estratégia de autenticação | Auditoria encerrada em 20/06/2026 | Modelo atual auditado em `docs/estrategia-autenticacao-perfis-next.md` | Aprovar perfil Parceiro, Admin real, fonte canônica de roles e ownership |
| Fase 4 — rotas públicas | Não iniciada | Apenas página técnica `/` no Next | Recomendado login único temporário; `/form/:token` foi excluída das candidatas públicas |
| Fase 5 — Cliente | Não iniciada | Rotas reais continuam em `/patient` no Vite | Migração por rota e plano de compatibilidade |
| Fase 6 — Parceiros | Não iniciada | Operação profissional continua em `/admin` no Vite | Separar Parceiros de Admin |
| Fase 7 — Admin real | Bloqueada por produto | Regras, métricas e contratos não estão definidos | Especificação funcional, dados e permissões |

## 6. Achados prioritários

### 6.1 Fundação Next.js

- `next.config.ts` usa `pageExtensions` para reconhecer apenas arquivos `*.next.*`. A estratégia permite convivência com o Vite, mas deve ser removida ou simplificada somente na fase final de consolidação.
- `tsconfig.next.json` inclui apenas `src/app/**`. Componentes importados são verificados durante o build, mas a cobertura TypeScript dedicada continua limitada.
- Não existe script `typecheck`.
- O build Next gera `/`, `/cliente/inicio`, `/parceiros/dashboard`, `/admin/dashboard` e `/_not-found`.

### 6.2 Providers e tema

- O `QueryClient` é criado por instância do componente com `useState`, evitando compartilhamento global entre requisições.
- Tooltip, toaster shadcn e Sonner foram conectados sem alterar `src/App.tsx`.
- `src/components/ui/sonner.tsx` não depende mais de `useTheme`; o tema foi fixado em `dark`, coerente com a única identidade visual implementada.
- `next-themes` permaneceu no `package.json` para evitar alteração de dependências nesta fase, mas não é necessário para os providers atuais.

### 6.3 CSS, Tailwind e shadcn/ui

- `src/app/globals.css` e `src/index.css` têm o mesmo conteúdo na auditoria.
- As classes `glass-card`, `glass-card-hover`, `bento-grid`, `btn-primary`, `page-enter` e `stagger-fade-in` estão preservadas.
- Tailwind permanece na versão 3 e o alias `@/*` aponta para `src/*`.
- `components.json` usa `"rsc": true`, mantém os aliases `@/*` e aponta para `src/app/globals.css`.
- A fonte e os tokens atuais continuam em Inter/Plus Jakarta Sans e background preto. A troca para Rethink Sans e `#0B1720` deve ocorrer em fase visual própria, não junto da migração estrutural.

### 6.4 Qualidade

- `npm run lint` falha com `124` ocorrências: `99` erros e `25` avisos.
- A maior concentração de erros é `@typescript-eslint/no-explicit-any`.
- Também existem dependências ausentes em hooks, interfaces vazias e `require()` no Tailwind.
- Há `6` arquivos e `13` testes cobrindo providers, shells, bootstrap Vite, página técnica Next, contrato da rota legada e `LoginView`. Supabase, autorização e fluxos de negócio continuam sem cobertura suficiente.
- Builds aprovados não equivalem a equivalência funcional.

### 6.5 Performance

- O build Vite produz um chunk JavaScript principal de aproximadamente `2.263,27 kB` minificado.
- A migração deve incluir code splitting por rota e carregamento tardio de módulos pesados, sem misturar otimização prematura com cada portabilidade de tela.

### 6.6 Rotas e perfis

- O Vite usa `/patient`; o sitemap alvo usa `/cliente`.
- A operação profissional está em `/admin`; o alvo correto é `/parceiros`.
- O Admin real ainda não possui requisitos nem fontes de dados suficientes.
- `/form/:token` foi reclassificada como implementação Vite legada/provisória. O fluxo futuro de formulários deve ser autenticado na área Cliente; prescrições, fotos e a rota definitiva de formulários ainda precisam de decisões explícitas no sitemap.

### 6.7 Supabase e segurança

- O cliente atual depende de `import.meta.env` e `localStorage`, portanto não pode ser reutilizado diretamente em Server Components.
- A primeira migração deve manter o cliente no browser para preservar comportamento; uma divisão browser/server deve vir depois.
- Há policies amplas para tabelas clínicas e operacionais, inclusive acesso `public` em módulos de formulários.
- A revisão de RLS é crítica antes de produção, mas deve ser uma trilha separada e aprovada; não deve ser embutida silenciosamente na migração de framework.

## 7. Princípios obrigatórios da execução

1. Manter Vite e Next executáveis até equivalência aprovada.
2. Migrar uma fatia funcional por vez.
3. Não renomear tabelas, campos ou tipos Supabase durante a portabilidade de UI.
4. Não criar redirects antes de a rota destino estar validada.
5. Não misturar migração de framework, redesenho visual e endurecimento de RLS na mesma entrega.
6. Tratar componentes com hooks, navegador, React Router ou Supabase client-side como Client Components inicialmente.
7. Usar o sitemap para URLs e nomenclatura; usar o código atual para comportamento; usar Figma e Design System para visual.
8. Não instalar ou atualizar dependências sem aprovação explícita.
9. Preservar estados de loading, vazio, erro e responsividade.
10. Não considerar uma fase concluída apenas porque o build passou.

## 8. Gates de qualidade

### Gate documental

- Escopo e arquivos previstos aprovados.
- Rota atual e rota alvo registradas.
- Dependências, integrações e riscos identificados.
- Node/frame do Figma registrado quando a entrega for visual.

### Gate técnico

- `npm run lint`.
- `npm run test`.
- `npm run build`.
- `npm run build:next`.
- Smoke manual das rotas tocadas.

Enquanto o lint global estiver vermelho, cada entrega deve:

- registrar o baseline global;
- garantir que não adicionou novos erros nos arquivos alterados;
- executar lint direcionado nos arquivos modificados quando aplicável.

### Gate funcional

- Fluxo principal executado.
- Loading, vazio e erro verificados.
- Navegação por teclado e foco básico verificados.
- Vite comparado com Next para a mesma tela.
- Consultas e mutações Supabase comparadas.

### Gate de encerramento

- Revisão do usuário.
- Riscos remanescentes documentados.
- Aprovação explícita antes da fase seguinte.

## 9. Plano de execução atualizado

### Fase A — congelar baseline e governança

Objetivo: transformar o estado atual em um ponto de comparação confiável.

Escopo:

- registrar os resultados atuais de lint, testes e builds;
- criar inventário de rotas, queries e componentes por página;
- definir política temporária para o lint global;
- decidir se a migração continuará na branch atual;
- verificar se segredos chegaram ao histórico Git, sem exibir valores.

Critérios de conclusão:

- baseline reproduzível;
- nenhum segredo rastreado no estado atual;
- política de qualidade aprovada;
- estratégia Git aprovada.

### Fase B — encerrar formalmente providers e fundação visual — concluída

Objetivo concluído em 18 de junho de 2026 sem expandir o escopo para shells ou rotas.

Escopo:

- validar a página técnica Next em runtime;
- testar Tooltip e ambos os toasters;
- decidir o tratamento de `next-themes`;
- decidir como `components.json` representará Vite e Next durante a convivência;
- manter CSS atual sem redesenho;
- confirmar ausência de regressão no Vite.

Fora de escopo:

- rotas de negócio;
- layouts de perfil;
- Rethink Sans;
- novos tokens;
- Supabase;
- auth;
- migrations e policies.

Critérios de conclusão:

- builds Vite e Next aprovados;
- providers testados em runtime;
- classes CSS preservadas;
- decisão de tema registrada;
- shadcn documentado para a convivência;
- nenhum novo erro de lint nos arquivos da fase.

### Fase C — infraestrutura de testes da migração — concluída

Objetivo concluído em 19 de junho de 2026: evitar migração guiada apenas por build.

Escopo:

- o teste exclusivamente fictício foi substituído por smoke tests úteis;
- `AppProviders` e shells continuam cobertos;
- o bootstrap Vite e a página pública Next existente possuem smoke tests;
- o contrato anterior de migração pública `/form/:token` para `/form/[token]` foi substituído por um contrato que preserva somente a rota Vite legada e mantém a criação da rota Next suspensa;
- a estratégia de mocks Supabase foi documentada;
- Playwright foi adiado: a biblioteca existe, mas não há configuração E2E versionada nem rota pública Next migrada.

Critérios de conclusão:

- providers com teste;
- smoke do Vite e do Next aprovados;
- estratégia de mocks Supabase documentada;
- nenhuma rota pública, Home, integração ou dependência foi alterada.

### Fase D — shells globais — concluída

Objetivo concluído em 18 de junho de 2026: layouts separados para Público, Cliente, Parceiros e Admin.

Escopo:

- converter `Outlet` para `{children}`;
- converter navegação para `Link` e `usePathname`;
- manter componentes acoplados ao browser como Client Components;
- usar o layout atual de `/admin` como referência exclusiva para Parceiros;
- criar apenas shell neutro para Admin real.

Decisões registradas:

- Cliente, Parceiros e Admin compartilham um shell configurável, sem duplicação de sidebar;
- navegação ativa usa `Link` e `usePathname`;
- itens de rotas futuras permanecem desabilitados e sem `href`;
- `MobilePreviewPanel` permanece exclusivamente no Vite até a migração do detalhe de cliente;
- layouts e placeholders permanecem Server Components; a navegação interativa é Client Component.

Critérios de conclusão:

- quatro shells renderizam conteúdo técnico;
- nenhuma rota legada foi removida;
- nenhuma permissão foi inventada.

### Fase E — rotas públicas e autenticação

Objetivo: migrar fluxos públicos sem alterar o modelo de auth.

Ordem:

1. `not-found.tsx`;
2. login após decisão sobre login único ou separado.

Decisões obrigatórias:

- login único temporário ou três logins;
- destino pós-login por perfil;
- estratégia de sessão no Next.

Critérios de conclusão:

- login aprovado equivalente;
- nenhum secret no cliente;
- rotas Vite preservadas até plano de transição.

Fora desta fase:

- `/form/:token` não é rota pública alvo e não deve ser migrada para `/form/[token]`;
- o fluxo futuro de formulários deve ser redesenhado dentro da área autenticada do Cliente em fase própria, considerando auth, ownership, Supabase e RLS;
- a rota Vite atual permanece intacta até existir transição aprovada.

### Fase F — primeira fatia de Parceiros

Objetivo: validar layout autenticado, navegação, Supabase e detalhe contextual.

Ordem:

1. `/admin/dashboard` para `/parceiros/dashboard`;
2. `/admin/patients` para `/parceiros/clientes`;
3. `/admin/patients/:id` para `/parceiros/clientes/[id]/visao-geral`.

Regras:

- preservar `patients` no banco e nos tipos;
- preservar `MobilePreviewPanel`;
- não migrar todas as abas de uma vez;
- não criar redirects nesta fase.

Critérios de conclusão:

- dados equivalentes;
- loading, vazio e erro cobertos;
- visual comparado;
- navegação de detalhe preserva o `id`.

### Fase G — módulos de Parceiros

Objetivo: migrar a operação profissional por blocos independentes.

Ordem sugerida:

1. abas contextuais de cliente;
2. agenda;
3. materiais;
4. alimentos e importação;
5. exercícios e técnicas;
6. formulários, após decisão de sitemap;
7. configurações do parceiro.

Cada bloco deve ter entrega e aceite próprios.

### Fase H — portal Cliente

Objetivo: migrar `/patient` para `/cliente` preservando comportamento.

Ordem:

1. `/patient` para `/cliente/inicio`;
2. dieta;
3. treino;
4. evolução;
5. exames e prescrições após decisão de produto;
6. configurações;
7. módulos novos de Saúde somente após requisitos aprovados.

Critérios:

- dados reais e mocks permanecem identificados;
- modo preview preservado;
- navegação e sessão equivalentes;
- rota antiga mantida até redirect aprovado.

### Fase I — Admin real

Objetivo: especificar e implementar a administração da plataforma sem reaproveitar silenciosamente Parceiros.

Pré-requisitos:

- modelo de parceiros/profissionais;
- papéis e permissões;
- métricas administrativas;
- assinatura e financeiro;
- auditoria;
- MFA;
- contratos de dados.

Ordem:

1. especificação funcional;
2. contratos de dados;
3. matriz de permissões;
4. protótipos validados;
5. implementação de uma tela por vez.

Sem esses pré-requisitos, registrar: `Não identificado nos arquivos analisados.`

### Fase J — auth, Supabase server-side e RLS

Objetivo: adaptar a arquitetura ao Next e endurecer segurança após equivalência funcional.

Escopo separado:

- helpers browser/server;
- cookies e sessão;
- middleware, se aprovado;
- matriz Cliente/Parceiro/Admin;
- revisão de RLS por ownership;
- revisão de Storage;
- testes de autorização.

Esta fase não deve reescrever migrations antigas sem estratégia. Correções devem usar novas migrations rastreáveis.

### Fase K — consolidação e retirada do Vite

Objetivo: tornar o Next.js a aplicação principal.

Pré-requisitos:

- rotas críticas equivalentes;
- redirects aprovados;
- auth e RLS validados;
- smoke E2E;
- monitoramento e rollback definidos;
- documentação atualizada.

Escopo:

- remover isolamento `*.next.*`;
- normalizar `src/app`;
- atualizar `components.json`;
- remover scripts e dependências Vite somente após análise de uso;
- remover React Router somente quando não houver consumidores;
- arquivar mapa de transição;
- executar validação final.

## 10. Ordem recomendada imediata

1. Definir política de lint para a migração.
2. Decidir e migrar as rotas públicas aprovadas.
3. Migrar a primeira fatia de Parceiros.
4. Migrar Cliente.
5. Especificar Admin real.
6. Executar trilha separada de auth/RLS.
7. Consolidar e retirar Vite somente no final.

## 11. Validação executada após o encerramento das Fases 2 e 3

### `npm run lint`

Falhou:

- `99` erros;
- `25` avisos;
- `124` ocorrências totais.

Os `99` erros são herdados do baseline. O lint direcionado aos arquivos criados na Fase 3 passou sem erros ou avisos.

### `npm run test`

Passou:

- `5` arquivos de teste;
- `10` testes aprovados;
- `3` testes cobrem a árvore de providers, Tooltip, toast shadcn e Sonner;
- `3` testes cobrem children, navegação ativa, rotas futuras desabilitadas e separação entre Parceiros e Admin;
- `1` teste cobre o bootstrap Vite;
- `1` teste cobre a página pública Next existente;
- `2` testes cobrem o contrato da rota Vite legada e a ausência de uma rota pública equivalente no Next.

A cobertura continua insuficiente para assegurar equivalência das telas de negócio, que ainda não foram migradas.

### `npm run build`

Passou:

- Vite 5.4.19;
- `3707` módulos transformados;
- bundle JavaScript principal aproximado de `2.261,83 kB` minificado e `640,24 kB` gzip;
- aviso de chunk acima de `500 kB`.

### `npm run build:next`

Passou:

- Next.js 16.2.2;
- compilação e TypeScript concluídos;
- rotas estáticas `/`, `/cliente/inicio`, `/parceiros/dashboard`, `/admin/dashboard` e `/_not-found`.

### Validações estáticas adicionais

- `src/index.css` e `src/app/globals.css` sem diferença na comparação executada;
- classes visuais obrigatórias encontradas;
- alias `@/*` preservado;
- Tailwind 3 preservado;
- app Vite e rotas existentes não foram removidos;
- `.env` e `.env.local` ignorados no estado atual;
- somente `.env.example` aparece rastreado entre os arquivos de ambiente consultados.

### Smoke em navegador

Executado em `http://localhost:3000`:

- página Next renderizada sem crash;
- Tooltip aberto por hover;
- toast shadcn disparado e renderizado;
- Sonner disparado e renderizado;
- nenhum erro ou aviso registrado no console do navegador;
- composição verificada em viewport desktop e em `390x844`.

### Render dos shells da Fase 3

As quatro rotas responderam HTTP `200` no servidor Next:

- `/`: `Shell público preservado`;
- `/cliente/inicio`: `Shell Cliente`;
- `/parceiros/dashboard`: `Shell Parceiros`;
- `/admin/dashboard`: `Shell Admin`.

O navegador interno não estava disponível durante a Fase 3. A inspeção visual desktop/mobile e a abertura da sidebar móvel não foram revalidadas nesta execução.

## 12. Comandos executados

```text
pwd
find . -name AGENTS.md -type f -print
sed -n ... AGENTS.md
sed -n ... documentos e arquivos de configuração
git status --short --branch
git log --oneline -8
git diff -- ...
find ... src, docs e supabase
rg ... dependências de navegador, React Router e policies
wc -l src/index.css src/app/globals.css
diff -u src/index.css src/app/globals.css
git ls-files .env .env.local .env.example
git check-ignore -v .env .env.local
npm run lint
npm run test
npm run build
npm run build:next
```

Nenhuma dependência foi instalada ou atualizada.

## 13. Arquivos das Fases 2 e 3

- `AGENTS.md`
- `components.json`
- `docs/plano-mestre-migracao-next-pos-auditoria-2026-06-18.md`
- `eslint.config.js`
- `src/app/layout.next.tsx`
- `src/app/(public)/layout.next.tsx`
- `src/app/(public)/page.next.tsx`
- `src/app/cliente/layout.next.tsx`
- `src/app/cliente/inicio/page.next.tsx`
- `src/app/parceiros/layout.next.tsx`
- `src/app/parceiros/dashboard/page.next.tsx`
- `src/app/admin/layout.next.tsx`
- `src/app/admin/dashboard/page.next.tsx`
- `src/app/foundation-validation.next.tsx`
- `src/app/globals.css`
- `src/app/providers.next.tsx`
- `src/app/providers.next.test.tsx`
- `src/components/shells/authenticated-shell.next.tsx`
- `src/components/shells/authenticated-shell.next.test.tsx`
- `src/components/shells/shell-placeholder.next.tsx`
- `src/components/ui/sonner.tsx`

## 14. Limitações

- O Figma não foi consultado nesta auditoria; não houve validação visual contra frames.
- Não foram testados login, fluxo autenticado futuro de formulários, queries ou mutações Supabase.
- Não foi auditado o histórico Git completo em busca de segredos.
- Não foram executados testes de autorização das policies.
- O smoke da fundação não comprova equivalência entre telas Vite e Next.
- A responsividade visual dos shells da Fase 3 não foi observada em navegador nesta execução.
- Não há cobertura automatizada suficiente para regressão.

## 15. Riscos

| Prioridade | Risco | Impacto |
|---|---|---|
| Crítica | Policies Supabase amplas | Exposição ou alteração indevida de dados |
| Alta | Separação Cliente/Parceiros/Admin não existe no modelo atual | Rotas e permissões incorretas |
| Alta | Cobertura de testes quase inexistente | Regressões silenciosas |
| Alta | Lint global com 99 erros | Baseline difícil de controlar |
| Alta | Cliente Supabase acoplado a `import.meta.env` e `localStorage` | Quebra ao mover código para contexto server |
| Média | Bundle Vite muito grande | Carregamento inicial e manutenção |
| Média | Documentação histórica contraditória | Decisões baseadas em estado antigo |
| Baixa | Browserslist desatualizado | Avisos e dados de compatibilidade antigos |

## 16. Próximos passos

Próxima entrega recomendada: auditar e decidir a Fase E — rotas públicas e autenticação.

Antes de implementar, decidir login único temporário ou logins separados. O redesenho de `/form/:token` pertence a uma fase autenticada própria e não bloqueia a definição dos fluxos realmente públicos.
