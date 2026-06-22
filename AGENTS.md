versão: 2026-06-19
revisado por: Codex
próxima revisão sugerida: ao migrar para Next.js ou ao alterar stack

# AGENTS.md

> **NUNCA:**
> - Inventar stack, rota, componente, integração, regra de negócio ou estrutura do Figma.
> - Alterar código sem consultar as fontes relevantes listadas neste arquivo.
> - Criar componente equivalente a um já existente em `src/components/`.
> - Refatorar áreas não relacionadas ao pedido recebido.
> - Expor secrets, credenciais ou valores de `.env` em qualquer output.
> - Afirmar que validação ocorreu sem tê-la executado de fato.
> - Remover rota, componente ou migration sem plano de transição explícito.
> - Ignorar divergência entre Figma, código, sitemap ou banco; registrar sempre.

Constituição técnica e operacional do Projeto Leo Barros para todo trabalho futuro do Codex em `/Users/antoniofelipe/Projeto_Leo_Barros`.
Este arquivo governa desenvolvimento, manutenção, refatoração, auditoria de consistência, Figma, Design System, validação, segurança e futura migração para Next.js.

## 1. Papel do Codex no projeto
O Codex atua como agente de desenvolvimento, manutenção, refatoração, controle de qualidade e auditoria de consistência.
Toda atuação deve respeitar: solicitação atual do usuário; este `AGENTS.md`; Figma `Projeto Leo Barros Atualizado`, quando acessível; `docs/sitemap-projeto-leo-barros.md`; Design System em `docs/`; código real em `src/` e `supabase/`; evidências verificadas nos arquivos analisados.
Quando houver conflito, registrar inconsistência, explicar impacto e pedir decisão se a escolha alterar comportamento, arquitetura, rotas, permissão, design visual, banco de dados ou dados.
Quando uma informação não existir nas fontes, escrever: `Não identificado nos arquivos analisados.`

### Gate de confirmação
Pausar e pedir decisão explícita do usuário antes de:
- Alterar rota existente ou criar rota nova.
- Modificar schema de banco, migration ou policy do Supabase.
- Remover ou renomear componente, hook ou integração existente.
- Alterar arquitetura, providers ou estrutura de layouts.
- Introduzir nova dependência no `package.json`.
- Afetar comportamento de autenticação ou permissão.
Para alterações documentais, de estilo ou de texto em componente isolado: executar e reportar no resultado final.

## 2. Estado real do projeto em 19 de junho de 2026
Stack principal real: Vite 5, React 18, TypeScript, React Router DOM, Tailwind CSS 3, shadcn/ui, Radix UI, Supabase, TanStack Query, Vitest, ESLint e Lovable.
Fundação paralela: Next.js 16.2.2 com App Router técnico isolado por arquivos `*.next.tsx`; Fases 2, 3, 3.5, 4.0 e a auditoria 4.1 encerradas, ainda sem telas de negócio ou integrações migradas para o Next.
Arquivos e diretórios principais:
- `src/App.tsx`: roteamento atual com `BrowserRouter`.
- `src/layouts/AdminLayout.tsx`: shell administrativo/operacional atual.
- `src/layouts/PatientLayout.tsx`: shell atual do paciente.
- `src/components/AdminSidebar.tsx`: sidebar global atual do admin.
- `src/index.css`: tokens visuais atuais, fontes e classes utilitárias customizadas.
- `src/components/ui/**`: componentes shadcn/ui locais.
- `src/integrations/supabase/client.ts`: cliente Supabase gerado.
- `src/integrations/supabase/types.ts`: tipos Supabase.
- `supabase/migrations/**`: schema e policies.
- `supabase/functions/**`: Edge Functions.
- `docs/**`: documentação de Design System, sitemap, roadmap e guias.
- `handoff_versao_16072026.md`: handoff operacional lido nesta auditoria.
- `src/app/**`: fundação técnica paralela do Next.js.
- `src/app/providers.next.tsx`: Query Client, Tooltip e toasters no Next.js.
- `src/app/globals.css`: cópia controlada dos tokens e classes de `src/index.css`.
- `src/app/foundation-validation.next.tsx`: smoke técnico de Tooltip e toasters na página Next.
- `src/app/providers.next.test.tsx`: testes mínimos da árvore de providers.
- `src/test/vite-bootstrap.smoke.test.tsx`: smoke do bootstrap Vite com `App` mockado.
- `src/test/next-public-shell.smoke.test.tsx`: smoke da página pública Next existente dentro dos providers.
- `src/test/legacy-form-route.contract.test.ts`: contrato que preserva `/form/:token` apenas como implementação Vite legada e impede tratá-la como rota pública alvo do Next.
- `docs/estrategia-mocks-supabase-testes.md`: estratégia de mocks sem banco, rede ou ambiente real.
- `src/components/auth/login-view.tsx`: apresentação controlada do login, desacoplada de Supabase, React Router e Sonner.
- `src/components/auth/login-view.test.tsx`: testes de renderização, credenciais e loading do login apresentacional.
- `docs/estrategia-autenticacao-perfis-next.md`: auditoria dos perfis e estratégia recomendada de login único temporário antes da separação Cliente/Parceiro/Admin.
- `src/components/shells/authenticated-shell.next.tsx`: shell autenticado compartilhado por Cliente, Parceiros e Admin.
- `src/components/shells/shell-placeholder.next.tsx`: placeholder técnico reutilizável dos shells.
- `src/app/(public)/**`, `src/app/cliente/**`, `src/app/parceiros/**` e `src/app/admin/**`: layouts e páginas técnicas da Fase 3.
- `next.config.ts` e `tsconfig.next.json`: isolamento do Next.js em relação ao legado Vite.
Importante: o produto real ainda roda em Vite; o Next.js existe apenas como fundação paralela. O handoff e o `AGENTS.md` anterior tinham premissas antigas sobre Next.js, Storybook e ausência de Supabase, substituídas por esta leitura da raiz real.

## 3. Fontes de verdade e ordem de consulta
### Prioridade de fontes
| Prioridade | Fonte |
|---|---|
| 1 | Solicitação atual do usuário |
| 2 | Este `AGENTS.md` |
| 3 | Figma `Projeto Leo Barros Atualizado` |
| 4 | `docs/sitemap-projeto-leo-barros.md` |
| 5 | Código real em `src/` e `supabase/` |
| 6 | Documentação em `docs/` |
| 7 | `handoff_versao_16072026.md` (somente contexto histórico) |

### Arquivos por tipo de tarefa
| Contexto da tarefa | Arquivos a ler primeiro |
|---|---|
| Rotas, menus, navegação | `docs/sitemap-projeto-leo-barros.md`, `src/App.tsx` |
| UI, componentes, tokens | `docs/DESIGN_SYSTEM.md`, `docs/TOKENS.md`, `src/index.css`, `tailwind.config.ts` |
| Dados, auth, permissões | `src/integrations/supabase/`, `supabase/migrations/`, `supabase/functions/` |
| Governança, histórico | `handoff_versao_16072026.md` |
| Qualquer tarefa visual | Consultar Figma; usar node/frame específico quando possível |
Não usar como fonte de decisão: `node_modules`, `.git`, `.next`, `dist`, `build`, `storybook-static`, caches, temporários ou arquivos gerados que contradigam arquivos fonte.

## 4. Figma como referência visual
Arquivo principal: `https://www.figma.com/design/vyskvKR1gCzdckeXHR2Ewj/Projeto-Leo-Barros-Atualizado`
Status da consulta mais recente nesta sessão:
- Arquivo acessado via MCP.
- A ferramenta listou apenas uma página de topo: `Design Telas`.
- A busca por Design System não retornou variáveis, estilos ou componentes pesquisáveis.
- `get_libraries` não retornou bibliotecas adicionadas ao arquivo.
Status histórico informado pelo handoff/documentação:
- O handoff registra páginas `Deisgn Telas`, `Design System` e `Sitemap`.
- O handoff registra `32` component sets, `3` componentes standalone, `64` variáveis e `12` famílias `Converted/*`.
- Essa informação histórica é contexto; a disponibilidade atual via MCP deve ser confirmada antes de implementar tela.
Regras de uso:
- Usar Figma como fonte visual para telas, dashboards, componentes, espaçamentos, hierarquia, densidade e atmosfera.
- Sempre que possível, trabalhar com node/frame específico.
- Não inventar estrutura quando o acesso falhar ou a ferramenta não retornar o node esperado.
- Registrar bloqueio quando o Figma não puder ser acessado.
- Para rotas e nomenclatura, validar contra o sitemap Markdown, não apenas contra nomes do Figma.
Riscos conhecidos: o Figma usa `Paciente`; o handoff cita `Deisgn Telas`, mas a consulta atual retornou `Design Telas`; a documentação local cita `Design System` e `Sitemap`, não confirmados pela consulta MCP atual.

## 5. Design System
Identidade alvo: dashboards clínicos escuros, azul como ação principal, tipografia `Rethink Sans`, background `#0B1720`, escala de spacing 4px.
Estado atual do código: `Inter` e `Plus Jakarta Sans`, background preto via HSL, classes customizadas `glass-card`, `bento-grid`, `btn-primary`. Detalhes em `docs/DESIGN_SYSTEM.md`.
Regras operacionais:
- Não aplicar visual padrão shadcn/ui como destino final.
- Não remover classe visual sem substituto validado.
- Não usar hex solto quando houver token semântico.
- Não criar card dentro de card sem necessidade funcional.
- Preservar estados de loading, erro e vazio em toda alteração.
- Preservar responsividade.

## 6. Glossário de perfis
| Perfil | Prefixo de rota alvo | Nome no código atual | Descrição |
|---|---|---|---|
| Cliente | `/cliente` | `patient` / `patients` | Usuário final que recebe atendimento |
| Parceiro | `/parceiros` | (dentro de `/admin`) | Profissional de saúde que atende clientes |
| Admin | `/admin` | `/admin` | Operação interna da plataforma |
Em código novo, usar sempre os termos da coluna "Perfil" e os prefixos de rota alvo. Em código existente, não renomear sem plano de migração explícito e aprovado.

## 7. Sitemap, rotas atuais e rotas alvo
Fonte alvo: `docs/sitemap-projeto-leo-barros.md`.
Perfis e prefixos oficiais alvo: Cliente `/cliente`; Parceiros `/parceiros`; Admin `/admin`.
Rotas reais atuais em `src/App.tsx`:
- Pública: `/`.
- Tecnicamente pública, porém legada/provisória: `/form/:token`. O destino correto de produto é um fluxo autenticado do Cliente/Paciente, ainda sem rota alvo definida.
- Admin atual: `/admin`, `/admin/dashboard`, `/admin/patients`, `/admin/patients/:id`, `/admin/diets`, `/admin/workouts`, `/admin/exams`, `/admin/prescriptions`, `/admin/foods`, `/admin/exercises`, `/admin/techniques`, `/admin/forms`, `/admin/forms/new`, `/admin/forms/:id/edit`, `/admin/materials`, `/admin/agenda`.
- Paciente atual: `/patient`, `/patient/diet`, `/patient/workout`, `/patient/evolution`, `/patient/exams`, `/patient/prescriptions`.
Inconsistência principal:
- O código atual usa `/patient` e `patients`.
- O sitemap alvo usa `/cliente`, `/parceiros/clientes` e `/admin/clientes`.
- O código atual concentra operação de profissional/parceiro dentro de `/admin`.
- O sitemap alvo separa `Parceiros` de `Admin`.
Regras de rota:
- Não criar novas rotas com `/paciente` ou `/profissional`.
- Em rotas novas, preferir `/cliente`, `/parceiros` e `/admin`.
- Não remover rotas antigas sem plano de migração/redirect.
- O menu contextual dentro de `/parceiros/clientes/:id` depende sempre de cliente selecionado.
- Não migrar `/form/:token` diretamente para `/form/[token]`. O fluxo futuro deve ser redesenhado em fase própria dentro da experiência autenticada do Cliente, considerando auth, ownership, Supabase e RLS.

## 8. Arquitetura atual e futura migração para Next.js
Estado principal: Vite com `BrowserRouter`; providers globais em `src/App.tsx` (`QueryClientProvider`, `TooltipProvider`, `Toaster`, `Sonner`); alias `@/*` para `src/*`; Vite na porta `8080`.
Fundação Next.js: App Router técnico em `src/app`, Next na porta `3000`, configuração TypeScript isolada, providers globais, Tailwind e shells técnicos em `/`, `/cliente/inicio`, `/parceiros/dashboard` e `/admin/dashboard`. As Fases 2 e 3 foram validadas por testes e builds em 18 de junho de 2026.
Objetivo futuro: migrar gradualmente o produto para a fundação Next.js.
Regras:
- Não migrar tudo de uma vez.
- Migrar por camadas: fundação visual, providers, layouts, rotas, páginas, dados.
- Preservar comportamento Supabase antes de refatorar visual profundamente.
- Componentes com `useState`, `useEffect`, `localStorage`, `window`, `useNavigate`, `useSearchParams` ou Supabase client-side devem ser client-side no Next.js.
- Substituir React Router por App Router com cuidado.
- Cada tela migrada deve ter rota atual, rota alvo, frame do Figma e checklist de estados.

## 9. Supabase, auth, banco e integrações
Implementação identificada:
- Cliente Supabase em `src/integrations/supabase/client.ts`.
- Variáveis client-side: `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`.
- Edge Functions: `supabase/functions/create-patient/index.ts`, `supabase/functions/create-admin/index.ts`, `supabase/functions/generate-diet/index.ts`.
- `create-patient` e `create-admin` usam `SUPABASE_SERVICE_ROLE_KEY` no ambiente Deno.
- `generate-diet` usa `LOVABLE_API_KEY` no ambiente Deno e chama Lovable AI Gateway.
- Há migrations para pacientes, dietas, treinos, exames, prescrições, formulários, fotos, materiais e outros módulos.
Riscos: várias policies usam `USING (true)` e `WITH CHECK (true)`; algumas permitem acesso amplo para `public` ou `authenticated`; antes de produção, revisar RLS por perfil, ownership e isolamento entre cliente/parceiro/admin.
Regras: nunca expor service role key; nunca mover secrets de Edge Function para client-side; não alterar migrations/policies sem entender impacto em telas existentes; não inventar regras de permissão sem arquivos reais e decisão explícita.

## 10. Segurança e proteção de informações
Estado atual: `.env` existe localmente, está ignorado e foi removido do índice Git; `.env.example` contém somente nomes de variáveis.
Regras obrigatórias:
- Nunca commitar `.env`, credenciais ou tokens de acesso.
- Nunca expor segredos em logs, diagnósticos, outputs, documentação ou exemplos de código.
- Nunca copiar chaves privadas para documentação.
- Nunca ler ou repetir valores de `.env` em resposta final.
Quando encontrar segredo real: não repetir o valor; informar apenas o tipo de risco; recomendar rotação quando houver exposição; recomendar mover o valor para ambiente seguro.
Risco remanescente: avaliar rotação se valores reais já foram expostos no histórico antes da remoção do versionamento.

## 11. Componentes e regras de uso
Componentes base atuais: shadcn/ui em `src/components/ui/**`; componentes de domínio em `src/components/**`; layouts em `src/layouts/**`.
Componentes e padrões relevantes: `Button`, `Input`, `Select`, `Badge`, `Card`, `Tabs`, `Dialog`, `Toast`, `Table`, `Sidebar`, `Skeleton`, `AdminSidebar`, `PatientLayout`, `MobilePreviewPanel`, abas de cliente/paciente (dieta, treino, cardio, exames, prescrições, fotos, formulários, evolução, anamnese e energia).
Regras:
- Usar `Button` para comandos e ações.
- Usar `Input`, `Select`, `Textarea` e controles shadcn apenas para dados editáveis.
- Usar `Badge` para status e informação curta.
- Usar `Card` para unidades repetidas significativas, não wrapper genérico.
- Usar `Tabs` para views irmãs dentro do mesmo contexto.
- Usar sidebar para navegação global autenticada.
- Usar tabelas para dados comparáveis.
- Preferir componente existente, variante e composição antes de duplicar.
- Usar `cn` de `src/lib/utils.ts`.

## 12. Qualidade e validação
Scripts identificados: `npm run dev`, `npm run dev:next`, `npm run build`, `npm run build:next`, `npm run build:dev`, `npm run lint`, `npm run preview`, `npm run start:next`, `npm run test`, `npm run test:watch`.
Não identificado nos arquivos analisados: Storybook local nesta raiz real; script `typecheck` dedicado.
Baseline de testes em 19 de junho de 2026 após a Fase 4.0: `6` arquivos e `13` testes aprovados. Playwright `1.60.0` está instalado, mas não há configuração E2E versionada nem `@playwright/test` instalado diretamente.
Regras: para código, executar `npm run lint`, `npm run test` e `npm run build` sempre que o ambiente permitir; para docs, registrar validação por leitura manual; nunca afirmar comando não executado; registrar falha e impacto; TypeScript atual não estrito não equivale a cobertura forte de tipos.
Checklist final:
- Respeita este `AGENTS.md`, sitemap quando envolve navegação, Design System ou divergência registrada?
- Corresponde ao Figma quando envolve visual?
- Considera loading, erro, vazio e responsividade?
- Reutiliza componentes e tokens existentes?
- Preserva rotas antigas sem plano, Supabase, auth e RLS?
- Executou validações disponíveis ou registrou limitação?

## 13. Inconsistências registradas em 16 de junho de 2026
- `AGENTS.md` anterior e `handoff_versao_16072026.md` descreviam Next.js/Storybook como stack produtiva; o produto real ainda usa Vite/React Router e possui somente uma fundação Next.js paralela.
- `docs/PROJECT.md`, `docs/IMPLEMENTATION_ROADMAP.md` e `docs/README` de Design System falam de Next.js/Storybook; Next.js agora possui fundação local, mas Storybook continua não identificado.
- `docs/README.md` aparece no IDE do usuário, mas não foi encontrado no disco durante esta leitura.
- O Figma atual via MCP mostrou apenas `Design Telas`; `Design System` e `Sitemap` não foram confirmados, embora estejam no handoff.
- A busca de Design System no Figma não retornou variáveis, estilos ou componentes nesta execução.
- O sitemap alvo usa `/cliente` e `/parceiros`; o código atual usa `/patient` e concentra operação em `/admin`.
- O Design System alvo usa `Rethink Sans` e `#0B1720`; o código atual usa `Inter`, `Plus Jakarta Sans` e background preto via HSL.
- O código e banco ainda usam `patient`/`patients`; o sitemap alvo usa `cliente`/`clientes`.
- `.env` não está mais rastreado no estado atual, mas pode permanecer no histórico anterior até tratamento específico.
- Várias policies Supabase usam regras amplas `true`.
Essas inconsistências não bloqueiam toda evolução, mas devem ser consideradas em tarefas que toquem rotas, design, segurança, banco ou migração para Next.js.

## 14. Próximos passos
Próximos passos técnicos documentados em `docs/IMPLEMENTATION_ROADMAP.md`.

## Formato de entrega
Toda resposta final deve conter estas seções quando aplicável:
| Seção | Conteúdo esperado |
|---|---|
| **Resumo** | O que foi feito e por quê |
| **Arquivos alterados** | Lista de arquivos criados, editados ou removidos |
| **Validação** | Como foi validado (Figma, lint, testes, build ou leitura manual) |
| **Comandos executados** | Lista dos comandos; registrar falha quando ocorrer |
| **Limitações** | O que não foi possível validar; nunca afirmar o que não aconteceu |
| **Riscos** | Impactos, conflitos de fonte, pendências |
| **Próximos passos** | Recomendações relacionadas ao trabalho entregue |
