versao: 2026-07-08
revisado por: Codex
proxima revisao sugerida: ao alterar stack, auth, rotas oficiais ou modelo Supabase

# AGENTS.md

Constituicao tecnica e operacional do Projeto Leo Barros.

## Estado Oficial

O Next.js App Router e a base oficial do produto. A camada Vite/React Router legada nao e mais o caminho funcional principal.

Fonte operacional complementar: `docs/fase-f0-next-oficial.md`.

Stack atual:
- Next.js 16 com App Router em `src/app`.
- React 18, TypeScript, Tailwind CSS 3, shadcn/ui local e Radix UI.
- Supabase local com migrations em `supabase/migrations`, seed em `supabase/seed.sql` e Edge Functions em `supabase/functions`.
- Auth Next com `@supabase/ssr`, cookies, `profiles.role` e `profiles.status`.
- Vitest para testes, ESLint para qualidade estatica.
- npm e `package-lock.json` sao o caminho oficial de instalacao.

Arquivos principais:
- `src/app/**`: rotas, layouts e paginas App Router.
- `src/proxy.ts`: middleware/proxy de sessao e acesso.
- `src/lib/supabase/**`: clients Supabase, env publica e tipos.
- `src/components/ui/**`: componentes base shadcn/ui locais.
- `src/components/auth/**`: componentes de autenticacao.
- `src/components/shells/**`: shell autenticado compartilhado.
- `docs/page-profiles/**`: contratos funcionais de telas aprovadas.
- `docs/sitemap-projeto-leo-barros.md`: referencia de rotas e nomenclatura.
- `.codex/skills/projeto-leo-barros-auth/SKILL.md`: skill operacional para fluxos de autenticacao segmentados.

## Papel do Codex

O Codex atua como agente de desenvolvimento, manutencao, refatoracao, controle de qualidade e auditoria de consistencia.

Toda atuacao deve respeitar:
1. solicitacao atual do usuario;
2. este `AGENTS.md`;
3. Figma `Projeto Leo Barros Atualizado`, quando acessivel;
4. `docs/sitemap-projeto-leo-barros.md`;
5. Page Profile da tela em `docs/page-profiles/`, quando existir;
6. codigo real em `src/` e `supabase/`;
7. documentacao em `docs/`.

Quando uma informacao nao existir nas fontes analisadas, escrever: `Nao identificado nos arquivos analisados.`

## Gate de Confirmacao

Pausar e pedir decisao explicita do usuario antes de:
- alterar rota existente ou criar rota nova;
- modificar schema de banco, migration ou policy do Supabase;
- remover ou renomear componente, hook ou integracao existente;
- alterar arquitetura, providers ou estrutura de layouts;
- introduzir nova dependencia no `package.json`;
- afetar comportamento de autenticacao ou permissao.

Para alteracoes documentais, organizacionais, scripts sem mudanca de runtime, estilo ou texto em componente isolado: executar e reportar no resultado final.

## Fontes por Tipo de Tarefa

| Contexto | Arquivos a ler primeiro |
|---|---|
| Rotas, menus, navegacao | `docs/sitemap-projeto-leo-barros.md`, `src/app/**/page.tsx`, layouts relacionados |
| UI, componentes, tokens | `docs/DESIGN_SYSTEM.md`, `docs/TOKENS.md`, `src/app/globals.css`, `tailwind.config.ts`, `src/components/ui/**` |
| Dados, auth, permissoes | `src/lib/supabase/**`, `src/lib/auth/**`, `src/proxy.ts`, `supabase/migrations/**`, `supabase/functions/**` |
| Tela funcional aprovada | Page Profile em `docs/page-profiles/` e skill local correspondente, quando existir |
| Governanca e historico | `docs/fase-f0-next-oficial.md`, `handoff_versao_16072026.md`, `docs/archive/**` apenas como contexto historico |

Nao usar como fonte de decisao: `node_modules`, `.git`, `.next`, `dist`, `build`, caches, temporarios ou arquivos gerados que contradigam arquivos fonte.

## Figma e Design System

Usar Figma como fonte visual para telas, dashboards, componentes, espacamentos, hierarquia, densidade e atmosfera quando a tarefa envolver visual.

Regras:
- sempre que possivel, trabalhar com node/frame especifico;
- nao inventar estrutura quando o acesso falhar ou a ferramenta nao retornar o node esperado;
- registrar bloqueio quando o Figma nao puder ser acessado;
- para rotas e nomenclatura, validar contra o sitemap Markdown;
- nao aplicar visual padrao shadcn/ui como destino final;
- reutilizar componentes e tokens existentes antes de criar novos;
- preservar loading, erro, vazio e responsividade.

## Perfis e Rotas Oficiais

| Perfil | Prefixo oficial | Descricao |
|---|---|---|
| Cliente | `/cliente` | Usuario final que recebe atendimento |
| Parceiro | `/parceiros` | Profissional de saude que atende clientes |
| Admin | `/admin` | Operacao interna da plataforma |

Rotas novas devem usar `/cliente`, `/parceiros` e `/admin`.

Nao criar novas rotas com `/paciente`, `/patient`, `/profissional` ou `/form/[token]` sem plano aprovado. O fluxo legado `/form/:token` nao deve ser migrado diretamente; deve ser redesenhado dentro da experiencia autenticada do Cliente.

## Supabase, Auth e Banco

Regras obrigatorias:
- nunca expor service role key no browser;
- nunca mover secrets de Edge Function para client-side;
- nao alterar migrations, triggers, grants ou policies sem entender impacto e obter confirmacao quando necessario;
- dados estruturais ficam em migrations versionadas;
- dados de sistema, fixtures e smoke local ficam em `supabase/seed.sql`;
- a tela deve ler dados via camada server-side quando o Page Profile exigir;
- Stripe e billing real permanecem futuros enquanto nao houver configuracao aprovada.

Variaveis publicas client-side:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Seguranca

- Nunca commitar `.env`, credenciais ou tokens.
- Nunca repetir valores reais de secrets em respostas, logs ou documentacao.
- Se encontrar segredo real, informar apenas o tipo de risco e recomendar rotacao quando houver exposicao.
- `.env.example` deve conter apenas nomes de variaveis.

## Componentes

Regras:
- usar `Button` para comandos;
- usar `Input`, `Select`, `Textarea` e controles shadcn para dados editaveis;
- usar `Badge` para status curto;
- usar `Card` apenas para unidades significativas ou repetidas;
- usar `Tabs` para views irmas no mesmo contexto;
- usar tabelas para dados comparaveis;
- preferir composicao de componentes existentes;
- usar `cn` de `src/lib/utils.ts`.

## Qualidade e Validacao

Scripts oficiais:
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run test:watch`
- `npm run db:start`
- `npm run db:status`
- `npm run db:reset`
- `npm run db:stop`
- `npm run validate:admin-partner-flow`

Para codigo, executar `npm run lint`, `npm run test` e `npm run build` sempre que o ambiente permitir.

Vitest permanece intencionalmente no projeto como runner de testes. A presenca transitiva de Vite em `node_modules` via Vitest nao significa que a aplicacao use Vite como runtime.

## Inconsistencias Conhecidas

- Documentos em `docs/archive/**` e handoffs antigos podem mencionar Vite/React Router como principal; tratar apenas como historico.
- O sitemap e o banco ainda podem conter historico terminologico `patient`/`patients`; nao renomear sem plano aprovado.
- Figma pode ter divergencias de nomenclatura como `Paciente`; validar rotas contra o sitemap.
- Algumas policies Supabase historicas devem ser revisadas antes de producao.

## Formato de Entrega

Toda resposta final deve conter estas secoes quando aplicavel:

| Secao | Conteudo esperado |
|---|---|
| **Resumo** | O que foi feito e por que |
| **Arquivos alterados** | Lista de arquivos criados, editados ou removidos |
| **Validacao** | Como foi validado |
| **Comandos executados** | Lista de comandos; registrar falha quando ocorrer |
| **Limitacoes** | O que nao foi possivel validar |
| **Riscos** | Impactos, conflitos de fonte, pendencias |
| **Proximos passos** | Recomendacoes relacionadas ao trabalho entregue |
