# AGENTS.md

Constituicao tecnica e operacional do Projeto Leo Barros para todo trabalho futuro do Codex.

Este arquivo deve ser lido antes de qualquer tarefa neste projeto. Ele governa desenvolvimento, manutencao, refatoracao, auditoria de consistencia, uso do Figma, uso do Design System, validacao e seguranca.

## 1. Papel Do Codex No Projeto

O Codex atua como agente de desenvolvimento, manutencao, refatoracao, controle de qualidade e auditoria de consistencia do Projeto Leo Barros.

Toda atuacao deve respeitar, nesta ordem operacional:

- A solicitacao atual do usuario.
- Este `AGENTS.md`.
- O Figma `Projeto Leo Barros Atualizado`.
- O sitemap atualizado.
- O Design System.
- Os componentes React existentes.
- O codigo existente.
- Evidencias verificadas nos arquivos analisados.

O Codex deve preservar a coerencia entre produto, design, codigo, documentacao e rotas. Quando houver conflito entre fontes, o Codex deve registrar a inconsistencia, explicar o impacto e pedir decisao quando a escolha alterar comportamento, arquitetura, rotas, permissao, design visual ou dados.

## 2. Contexto Real Do Projeto

A raiz atual do projeto em `/Users/antoniofelipe/Projeto_Leo_Barros` contem documentacao do produto e deve conter este `AGENTS.md`.

O pacote tecnico principal analisado esta em:

`/Users/antoniofelipe/Projeto_Leo_Barros/docs/`

Esse pacote contem a implementacao local do Design System, componentes React, Storybook, tokens, estilos globais e documentacao tecnica.

O sitemap atualizado tambem esta em:

- `/Users/antoniofelipe/Projeto_Leo_Barros/docs/sitemap-projeto-leo-barros.md`


## 3. Ordem De Leitura Obrigatoria

Antes de alterar qualquer arquivo, o Codex deve seguir esta ordem:

1. Ler `/Users/antoniofelipe/Projeto_Leo_Barros/AGENTS.md`.

Diretorios que nao devem servir como fonte de decisao:

- `node_modules`
- `.git`
- `.next`
- `dist`
- `build`
- `storybook-static`
- caches
- arquivos temporarios
- arquivos gerados que contradigam arquivos fonte

Arquivos gerados podem ser atualizados quando necessario, mas a decisao deve vir de fonte, documentacao, Figma ou codigo-fonte.

## 4. Fontes De Verdade E Prioridade

Prioridade quando houver conflito:

1. Solicitacao atual do usuario.
2. `AGENTS.md`.
3. Figma atualizado `Projeto Leo Barros Atualizado`.
4. Sitemap e documentacao de rotas.
5. `DESIGN_SYSTEM.md`.
6. `PROJECT.md`.
7. `docs/AI-METADATA.md`.
8. `docs/TOKENS.md` e tokens fonte em `src/tokens/**` e `src/styles.css`.
9. Componentes reutilizaveis em `src/components/**`.
10. Stories em `src/stories/**`.
11. Codigo existente.
12. Padroes inferidos a partir de repeticao real.

Regras de conflito:

- Se Figma e codigo divergirem visualmente, priorizar Figma para visual e registrar a diferenca no codigo.
- Se Figma usar nomenclatura antiga e o sitemap usar nomenclatura atual, priorizar o sitemap para rotas e perfis.
- Se o usuario solicitar mudanca que conflite com Design System, explicar o impacto antes de aplicar.
- Se um comando, rota, componente, integracao ou regra nao existir nas fontes, escrever: `Não identificado nos arquivos analisados.`
- Nao assumir decisoes silenciosamente quando o impacto atingir arquitetura, rotas, permissao, dados, token global ou componente base.

## 5. Figma Como Referencia Visual

Arquivo Figma principal:

`https://www.figma.com/design/vyskvKR1gCzdckeXHR2Ewj/Projeto-Leo-Barros-Atualizado`

Status verificado:

- Figma acessado com sucesso via ferramenta MCP.
- Paginas identificadas: `Deisgn Telas`, `Design System`, `Sitemap`.
- A pagina `Design System` foi confirmada com `32` component sets e `3` componentes standalone.
- Variaveis locais foram confirmadas em `9` colecoes: `DS / Color`, `DS / Size`, `DS / Radius`, `DS / Motion`, `DS / Shadow`, `DS / Opacity`, `DS / Z Index`, `DS / Layout`, `DS / Typography`.
- O ledger local registra `64` variaveis, `3` effect styles, `32` component sets, `3` standalone components e `12` familias `Converted/*`.

Regras de uso do Figma:

- Usar o Figma como fonte visual essencial para telas, dashboards, componentes, espacamentos, hierarquia, densidade e atmosfera.
- Consultar a pagina `Design System` antes de criar ou alterar componente visual.
- Consultar `Deisgn Telas` para entender telas reais, padroes recorrentes e migracao visual.
- Consultar `Sitemap` para referencia visual do mapa, mas validar rotas contra `docs/sitemap-projeto-leo-barros.md`.
- Registrar bloqueio quando o Figma nao puder ser acessado.
- Nao inventar estrutura do Figma quando o acesso falhar.

Risco conhecido:

- O Figma ainda possui nomenclaturas antigas como `Paciente` e `Profissional`, enquanto o sitemap atual usa `Cliente` e `Parceiros`.
- A pagina `Deisgn Telas` tem nome com erro de digitacao.
- O node `121:3` de uma captura recente do sitemap nao foi localizado via API durante a analise; a pagina `Sitemap` acessivel tinha o frame `Sitemap - Projeto Leo Barros` com blocos `Perfil / Cliente`, `Perfil / Parceiros` e `Perfil / Admin`.

## 6. Design System Do Projeto

O Design System local fica em:

`/Users/antoniofelipe/Documents/Codex/2026-06-08/codex-liste-os-5-projetos-mais/outputs/leo-design-system`

Stack identificada:

- Next.js 15
- React 18
- TypeScript 5
- Storybook 8
- Tailwind CSS 3
- Radix UI
- lucide-react
- Estrutura compativel com shadcn/ui

Regra critica:

- Usar a estrutura e acessibilidade do shadcn/ui quando fizer sentido, mas nunca importar a aparencia visual padrao do shadcn/ui.

Identidade visual:

- Produto de dashboards clinicos e operacionais escuros.
- Superficies densas.
- Azul como cor de acao principal.
- Tipografia oficial `Rethink Sans`.
- Background padrao `#0B1720`.
- Navegacao global por sidebar.
- Navegacao local por tabs.

Tokens principais confirmados:

- `color-background`: `#0B1720`
- `color-surface`: `#07111B`
- `color-surface-elevated`: `#161B23`
- `color-surface-muted`: `#181C26`
- `color-surface-subtle`: `#101721`
- `color-border`: `#2E3848`
- `color-border-strong`: `#41505C`
- `color-primary`: `#3B97E3`
- `color-primary-hover`: `#1D7ECE`
- `color-primary-subtle`: `#0A2C48`
- `color-text`: `#F9FAFB`
- `color-text-muted`: `#B9C2D0`
- `color-text-subtle`: `#798697`
- `color-text-disabled`: `#656F82`
- `color-success`: `#22C55E`
- `color-warning`: `#F59E0B`
- `color-danger`: `#EF4444`
- `color-info`: `#68AFE9`

Escalas confirmadas:

- Spacing: `0`, `4`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `48`.
- Radius: `0`, `4`, `6`, `8`, `10`, `12`, `14`, `20`, `9999`.
- Motion: `120ms`, `180ms`, `240ms`.
- Controles dominantes: `32px`, `40px`, `44px`.
- Sidebar: `280px`.

## 7. Sitemap E Rotas

Fonte: `docs/sitemap-projeto-leo-barros.md`.

Perfis e prefixos oficiais:

- Cliente: `/cliente`
- Parceiros: `/parceiros`
- Admin: `/admin`

Convencao de niveis:

- `N1`: acesso.
- `N2`: menu principal.
- `N3`: subarea.
- `N4`: modulo ou funcao.
- `N5`: detalhe ou acao.

Menus oficiais:

- Cliente: `Inicio`, `Dieta`, `Treino`, `Saude`, `Minha Evolucao`, `Configuracoes`.
- Parceiros: `Dashboard`, `Clientes`, `Agenda`, `Materiais`, `Cadastros`, `Configuracoes`.
- Admin: `Dashboard`, `Profissionais`, `Clientes`, `Relatorios`, `Financeiro`.

Regras de rota:

- Nao usar `/paciente` em novas rotas.
- Nao usar `/profissional` em novas rotas.
- Nao usar `/admin/financeiro/receita/pendentes`.
- O menu dentro de `/parceiros/clientes/:id` e contextual e depende sempre de um cliente selecionado.
- Ferramentas profundas como Forca Relativa, MLPA, TACO/TCBIO, editores e exportacoes devem ter rotas proprias.

## 8. Regras De Fidelidade Visual

Preservar obrigatoriamente:

- Cores semanticas.
- Tipografia `Rethink Sans`.
- Escala de spacing de 4px.
- Radius oficiais.
- Sombras oficiais.
- Componentes existentes.
- Cards, botoes, inputs, selects, badges, tabs, sidebar, tabelas, modais e toasts.
- Menus e navegacao.
- Dashboards densos.
- Estados vazios.
- Estados de loading.
- Estados de erro.
- Responsividade.
- Hierarquia visual.
- Atmosfera de produto clinico operacional escuro.

Regras:

- Nao criar padrao visual novo quando ja existir padrao definido.
- Nao usar hex solto quando existir token semantico.
- Nao criar novo tamanho de botao, input, icone ou card fora da escala sem justificar.
- Nao criar card dentro de card sem necessidade funcional clara.
- Nao trocar densidade operacional por layout generico de landing page.
- Nao usar o visual padrao de shadcn/ui.
- Nao substituir sidebar por menu solto em areas autenticadas.
- Nao usar tabs para navegacao global.

## 9. Regras De Implementacao

Antes de criar codigo novo:

- Procurar componente existente em `src/components/**`.
- Procurar variant existente no componente.
- Procurar familia correspondente no Figma.
- Procurar regra em `docs/AI-METADATA.md`.
- Procurar token em `src/tokens/index.ts`, `src/tokens/tokens.json`, `src/styles.css` e `docs/TOKENS.md`.
- Procurar story existente em `src/stories/**`.

Regras de codigo:

- Preferir componentes existentes antes de criar novos.
- Preferir variantes antes de duplicar componente.
- Usar `Converted/*` apenas como ponte de migracao de alta fidelidade, nao como API final para novos fluxos.
- Evitar duplicacao.
- Fazer alteracoes pequenas, rastreaveis e ligadas ao pedido.
- Nao refatorar fora do escopo sem justificar.
- Nao quebrar rotas existentes.
- Nao alterar arquitetura sem necessidade.
- Nao remover codigo sem entender dependencias.
- Nao criar abstracoes excessivas.
- Manter consistencia entre areas publicas e privadas.
- Manter metadados de IA em componentes novos ou alterados quando o padrao do projeto ja usar metadados.
- Usar `cn` de `src/lib/cn.ts` para composicao de classes quando estiver trabalhando no pacote React.
- Preservar acessibilidade de controles interativos: foco visivel, aria quando necessario, role correto para tabs, modal e feedback.

## 10. Componentes E Regras De Uso

Componentes React identificados:

- `Button`
- `Input`
- `Select`
- `Badge`
- `Card`
- `Tabs`
- `Modal`
- `Toast`
- `Sidebar`
- `DataTable`

Regras de escolha:

- Usar `Button` para comandos e acoes de formulario.
- Usar `Input` e `Select` apenas para dados editaveis.
- Usar `Badge` para status, categoria ou informacao curta.
- Usar `Card` para unidades repetidas e significativas; nao usar como wrapper generico de pagina.
- Usar `Tabs` para views irmas dentro do mesmo contexto.
- Usar `Sidebar` para navegacao global autenticada.
- Usar `DataTable` para dados comparaveis em linhas e colunas.
- Usar `Modal` para decisoes bloqueantes ou edicao focada.
- Usar `Toast` para feedback temporario.

Diferença conhecida:

- Figma usa `Organisms/Table`; React usa `DataTable`.

## 11. Controle De Qualidade Obrigatorio

Checklist obrigatorio antes de concluir qualquer tarefa:

- A alteracao respeita este `AGENTS.md`?
- A alteracao respeita o sitemap?
- A UI segue o Design System?
- A implementacao corresponde ao Figma quando a tarefa envolve visual?
- A tela esta responsiva?
- Existem estados de loading quando ha espera, carregamento ou acao assíncrona?
- Existem estados de erro quando ha falha possivel?
- Existem estados vazios quando listas, tabelas ou paineis podem nao ter dados?
- Houve reutilizacao adequada de componentes existentes?
- Existe duplicacao desnecessaria?
- O codigo esta tipado corretamente?
- O codigo evita hex solto quando existe token?
- O codigo evita novos padroes paralelos?
- O impacto colateral foi verificado?
- As rotas oficiais foram preservadas?
- A experiencia do usuario permanece consistente?
- A documentacao afetada foi atualizada?
- Os comandos de validacao disponiveis foram executados ou a limitacao foi registrada?

## 12. Comandos De Validacao

Todos os comandos abaixo foram identificados no projeto `leo-design-system`.

Instalacao:

```bash
npm install
```

Desenvolvimento local:

```bash
npm run dev
```

Build Next.js:

```bash
npm run build
```

Start do build:

```bash
npm run start
```

Storybook:

```bash
npm run storybook
```

Build do Storybook:

```bash
npm run build-storybook
```

Typecheck:

```bash
npm run typecheck
```

Comandos importantes nao identificados:

- Lint: `Não identificado nos arquivos analisados.`
- Testes automatizados: `Não identificado nos arquivos analisados.`

Regra:

- Nao afirmar que lint ou testes passaram quando nao houver script ou execucao real.
- Para mudancas de componente, token, CSS, Storybook ou Design System, executar `npm run typecheck` e `npm run build-storybook` sempre que o ambiente permitir.
- Para mudancas no app Next.js, executar `npm run typecheck` e `npm run build` sempre que o ambiente permitir.

## 13. Autenticacao, Banco De Dados E Integracoes

Implementacao de autenticacao: `Não identificado nos arquivos analisados.`

Banco de dados: `Não identificado nos arquivos analisados.`

Schema de banco: `Não identificado nos arquivos analisados.`

Rotas API: `Não identificado nos arquivos analisados.`

Middleware: `Não identificado nos arquivos analisados.`

Arquivos `.env`: `Não identificado nos arquivos analisados.`

Integracao Supabase em codigo: `Não identificado nos arquivos analisados.`

Observacao:

- O `package.json` possui dependencia de desenvolvimento `supabase`, mas nenhuma integracao de Supabase foi identificada no codigo analisado.
- Nao criar regras de banco, autenticacao, permissoes ou deploy sem arquivos reais que sustentem a decisao.

## 14. Regra De Atualizacao Continua

Atualizar este `AGENTS.md` quando houver mudancas em:

- Stack.
- Design System.
- Tokens.
- Sitemap.
- Estrutura de pastas.
- Regras de negocio.
- Fluxos principais.
- Componentes base.
- Padroes de codigo.
- Scripts.
- Integracoes.
- Autenticacao.
- Banco de dados.
- Permissoes.
- Deploy.
- Relacao entre Figma, docs e codigo.

O Codex deve sugerir atualizacao deste arquivo quando detectar que ele esta incompleto, contraditorio ou desatualizado.

Tambem atualizar documentacao correlata quando a mudanca afetar:

- `docs/sitemap-projeto-leo-barros.md`
- `DESIGN_SYSTEM.md`
- `PROJECT.md`
- `README.md`
- `docs/TOKENS.md`
- `docs/AI-METADATA.md`
- `docs/IMPLEMENTATION_ROADMAP.md`
- Stories do Storybook
- Tokens fonte

## 15. Definicao De Pronto

Uma tarefa so pode ser considerada concluida quando:

- Respeita a documentacao.
- Respeita o Figma quando envolve visual.
- Nao cria inconsistencias visuais.
- Nao quebra rotas.
- Usa componentes corretos.
- Usa tokens corretos.
- Passa nas validacoes disponiveis ou registra por que nao foi possivel validar.
- Foi revisada contra o Design System.
- Foi revisada contra o sitemap quando envolve navegacao, perfil, menu ou rota.
- Possui resumo final claro.
- Lista arquivos alterados.
- Lista comandos executados.
- Lista riscos ou pendencias.
- Lista limitacoes de validacao.

## 16. Formato De Resposta Esperado Do Codex

Toda entrega final deve conter:

### Resumo

O que foi feito e por que.

### Arquivos Alterados

Lista completa dos arquivos criados, editados ou removidos.

### Validacao

Como foi validado, incluindo Figma, Design System, sitemap, typecheck, build, Storybook ou leitura manual.

### Comandos Executados

Lista dos comandos usados. Quando um comando falhar, informar a falha e o impacto.

### Limitacoes

O que nao foi possivel validar. Nunca afirmar validacao que nao aconteceu.

### Riscos

Possiveis impactos, conflitos de fonte, pendencias tecnicas ou pontos de revisao manual.

### Proximos Passos

Recomendacoes futuras diretamente relacionadas ao trabalho entregue.

## 17. Seguranca E Protecao De Informacoes

O Codex deve tratar credenciais e dados sensiveis como informacoes protegidas.

Regras obrigatorias:

- Nunca commitar arquivos `.env`.
- Nunca commitar credenciais.
- Nunca commitar tokens de acesso.
- Nunca expor segredos em logs.
- Nunca incluir credenciais em diagnosticos.
- Nunca incluir credenciais em outputs.
- Nunca copiar chaves privadas para documentacao.
- Nunca registrar segredos em exemplos de codigo.
- Nunca assumir valores de ambiente sem confirmacao.
- Nunca exibir dados sensiveis em exemplos.
- Nunca transformar valores reais de segredo em placeholders documentados.
- Alertar quando identificar risco de seguranca.
- Respeitar configuracoes de seguranca existentes.

Quando encontrar segredo real:

- Nao repetir o valor.
- Informar apenas o tipo de risco.
- Recomendar rotacao quando houver exposicao.
- Recomendar mover o valor para ambiente seguro.

## 18. O Que O Codex Nao Deve Fazer Nunca

### Nao inventar informacoes

Nunca inventar:

- Stack.
- Rotas.
- Componentes.
- Scripts.
- Integracoes.
- Regras de negocio.
- Estrutura do Figma.
- Autenticacao.
- Banco de dados.
- Deploy.

Quando nao souber algo, escrever exatamente:

`Não identificado nos arquivos analisados.`

### Nao ignorar documentacao

Nunca alterar codigo sem consultar as fontes de verdade definidas neste arquivo.

### Nao criar padroes paralelos

Nunca criar:

- Novos componentes equivalentes aos existentes.
- Novos tokens sem justificativa.
- Novos padroes visuais sem aprovacao.
- Novas rotas fora do sitemap sem registrar a decisao.
- Novas nomenclaturas que conflitem com `/cliente`, `/parceiros` e `/admin`.

### Nao alterar escopo silenciosamente

Nunca:

- Refatorar areas nao relacionadas.
- Alterar arquitetura sem justificativa.
- Modificar comportamento fora da solicitacao.
- Remover arquivos sem entender dependencias.
- Recriar componente existente com outro nome.

### Nao ocultar limitacoes

Nunca afirmar que validou algo que nao foi validado.

### Nao comprometer seguranca

Nunca:

- Commitar `.env`.
- Commitar segredos.
- Commitar credenciais.
- Expor tokens.
- Expor chaves privadas.
- Logar informacoes sensiveis.
- Incluir credenciais em diagnosticos.
- Incluir credenciais em outputs.
- Exibir dados sensiveis em exemplos.

### Nao mascarar conflitos

Nunca ignorar divergencias entre:

- Figma.
- Design System.
- Codigo.
- Documentacao.
- Sitemap.
- Componentes.
- Tokens.

Registrar conflitos explicitamente e explicar impacto.

## 19. Recomendacoes Para Futuras Skills

Criar ou instalar Skills especificas quando o projeto amadurecer nas areas abaixo:

- Auditoria Figma versus React para comparar tokens, componentes e telas.
- Sincronizacao de sitemap entre Markdown, Figma e rotas implementadas.
- QA visual de Storybook com capturas e comparacao de estados.
- Governanca de tokens para impedir valores hardcoded fora do Design System.
- Auditoria de acessibilidade para componentes interativos.
- Validacao de rotas e permissoes quando autenticacao for implementada.
- Auditoria de seguranca para `.env`, segredos, logs e configuracoes de deploy.

Essas Skills devem ser baseadas em arquivos reais do projeto e nao podem criar regras sem evidencia.
