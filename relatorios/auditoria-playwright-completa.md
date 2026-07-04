# Relatório de Auditoria Playwright

## Resumo Executivo

- Data/hora: 04/07/2026, auditoria executada durante a sessão local.
- Ambiente: Next.js local em `http://localhost:3000`, Supabase local em `http://127.0.0.1:54321`.
- Navegador: MCP Playwright visual, Firefox, viewport desktop `1440x1000` e mobile `390x900`.
- Perfis testados: Parceiro (`antonioferrari2002@gmail.com`), Cliente (`cliente.seed.01@example.invalid`) e Admin (`antoniofelipe258@gmail.com`), todos com senha `123456`.
- Resultado geral: plataforma navegável e com grande parte dos fluxos principais funcionando após subir Supabase local. Há problemas funcionais relevantes em cadastro de cliente, logout, ação de saúde, seleção de treino e alguns botões sem feedback visível.

## Observações de Ambiente

No início, as credenciais do seed falhavam porque o frontend apontava para Supabase local, mas os containers locais não estavam ativos. Após iniciar o Supabase local, os logins passaram a funcionar.

O sitemap `docs/sitemap-projeto-leo-barros.md` informa que é uma arquitetura alvo, não uma lista completa de rotas já existentes. O código atual contém mais rotas implementadas do que o bloco inicial do sitemap lista.

## Rotas Testadas

| Rota | Perfil | Status | Problemas | Observações |
| --- | --- | --- | --- | --- |
| `/login` | Público | OK | Sem erro crítico | Login visual centralizado; erro correto para credenciais inválidas. |
| `/parceiros/dashboard` | Parceiro | Parcial | Textos que deveriam ter sido removidos ainda aparecem | Gráficos renderizam; cards carregam. |
| `/parceiros/clientes` | Parceiro | Parcial | Cadastro de cliente falha por CORS | Busca, filtros e lista funcionam. |
| `/parceiros/clientes/:id` | Parceiro | OK | Nenhum crítico | Header/perfil padronizado entre abas. |
| `/parceiros/clientes/:id?tab=avaliacoes` | Parceiro | OK | Nenhum crítico | Gráficos e Recalcular funcionam. |
| `/parceiros/clientes/:id?tab=dietas` | Parceiro | Parcial | “Mais ações” sem menu visível | Abas por dia funcionam. |
| `/parceiros/clientes/:id?tab=treinos` | Parceiro | OK | Nenhum crítico observado | Alternância A/B/C funciona. |
| `/parceiros/clientes/:id?tab=cardio` | Parceiro | OK | Nenhum crítico observado | Tela carregada sem erro. |
| `/parceiros/clientes/:id?tab=exames` | Parceiro | OK | Nenhum crítico observado | Subabas Dashboard/Resultados/Configurações funcionam. |
| `/parceiros/clientes/:id?tab=fotos` | Parceiro | Parcial | Carregamento lento | Tela e seção de fotos carregam sem erro de console. |
| `/parceiros/agenda` | Parceiro | OK | Nenhum crítico | Agendamento criado no detalhe aparece em 20/07/2026. |
| `/parceiros/materiais` | Parceiro | OK | Nenhum crítico | Busca, filtros e lista funcionam. |
| `/parceiros/materiais/:id` | Parceiro | Parcial | Arquivo/PDF retornou 500 no servidor local | Modal de compartilhamento abre. |
| `/parceiros/cadastros` | Parceiro | OK | Nenhum crítico | Exercício e importação abrem formulários completos. |
| `/cliente/inicio` | Cliente | OK | Navegação superior só mostra Home/Evolução | Cards levam aos módulos. |
| `/cliente/dieta` | Cliente | OK | Nenhum crítico observado | Painel diário e refeições carregam. |
| `/cliente/treino` | Cliente | Parcial | Seleção Treino B não respeitada ao iniciar | Execução abriu Treino A. |
| `/cliente/treino/executar/:sessionId` | Cliente | Parcial | Inconsistência com treino selecionado | Próximo exercício responde. |
| `/cliente/saude` | Cliente | Parcial | “Iniciar agora” falha com alerta inválido | Módulos de saúde carregam. |
| `/cliente/evolucao` | Cliente | OK | Página mobile muito longa, mas sem overflow aparente | Gráficos, fotos/seção visual e layout mobile carregam. |
| `/admin/dashboard` | Admin | OK | Nenhum crítico observado | Métricas e gráficos renderizam. |
| `/admin/profissionais` | Admin | OK | Erro acumulado de logout no console anterior | Filtros e modal de novo parceiro abrem. |
| `/admin/clientes` | Admin | OK | Nenhum crítico observado | Indicadores e tabela carregam. |
| `/admin/financeiro` | Admin | OK | Dados locais zerados | Coerente com plano local gratuito. |
| `/admin/suporte` | Admin | Parcial | “Novo ticket interno” sem feedback visível | Tickets/filtros carregam. |
| `/admin/configuracoes` | Admin | OK | Nenhum crítico observado | Abas Geral/Usuários/Integrações/Segurança alternam. |

## Detalhamento por Página

### `/login`

- O que funciona: tela carrega sem erro crítico; campos de e-mail/senha e botão Entrar funcionam; credenciais inválidas exibem “E-mail ou senha inválidos.”
- Formulários testados: parceiro, cliente e admin.
- Responsividade: desktop OK; mobile indiretamente validado ao retornar ao login.
- Console: warnings do ambiente/devtools; sem erro próprio no login inicial.

### `/parceiros/dashboard`

- O que funciona: métricas, agenda do dia, gráficos e tabelas carregam.
- Inconsistências: textos “Dados conectados ao Supabase local” e “Sem exposição clínica detalhada” ainda aparecem no rodapé, apesar do checklist indicar remoção.
- Interações testadas: período “Últimos 6 meses” recebeu clique sem erro, mas sem mudança/menu perceptível.
- Evidência: `auditoria-parceiros-dashboard-desktop.png`.

### `/parceiros/clientes`

- O que funciona: lista de clientes ativos, busca por “Ana”, filtros avançados, status e paginação desabilitada intencionalmente.
- Ícones dieta/treino: módulos aparecem na coluna de planos; ícone de saúde não aparece na listagem principal.
- Problema: criação de cliente falha.
- Dados usados: `Teste Auditoria Playwright`, `teste.auditoria.playwright@example.invalid`, `+5511999990000`, nascimento `1990-01-01`, CPF `00000000000`, escopos Dieta + Treino.
- Resultado: alerta “Não foi possível criar o Cliente agora.”
- Console: CORS bloqueando `http://127.0.0.1:54321/functions/v1/provision-client-for-partner`.
- Evidência: `auditoria-parceiros-clientes-desktop.png`.

### `/parceiros/clientes/:id`

- Cliente testado: Ana Ribeiro (`a1000000-0000-4000-8000-000000000301`).
- O que funciona: header, ações Exportar PDF/Mensagem/Agendar consulta, cards de métricas, gráficos, pendências.
- Agendamento testado: criado “Teste Auditoria Playwright” para 20/07/2026 09:00; apareceu na Agenda.
- Header/perfil: padronizado entre Visão Geral, Avaliações, Dietas, Treinos, Cardio, Exames e Fotos.
- Evidência: `auditoria-parceiros-cliente-detalhe-visao-geral.png`.

### Abas do Cliente Parceiro

- Avaliações: gráficos/histórico carregam; “Recalcular” funciona; ações persistentes foram evitadas.
- Dietas: abas por dia funcionam; “Mais ações” não mostra menu visível.
- Treinos: Treino A/B/C alternam; histórico e botões de salvar/publicar visíveis.
- Cardio: tela carregada sem erro; print registrado.
- Exames: Dashboard, Resultados e Configurações alternam.
- Fotos: carregou sem erro, mas com tempo perceptivelmente maior; print registrado.
- Evidências: `auditoria-parceiros-cliente-cardio.png`, `auditoria-parceiros-cliente-fotos.png`.

### `/parceiros/agenda`

- O que funciona: mês/semana/dia, filtros por modalidade/status, navegação de período.
- Cadastro indireto validado: compromisso “Teste Auditoria Playwright” criado pelo detalhe do cliente apareceu no dia 20/07/2026.
- Evidência: `auditoria-parceiros-agenda.png`.

### `/parceiros/materiais`

- O que funciona: estatísticas, filtros por categoria, busca por “Low Carb”, tipo/status/ordem, alternância grade/lista.
- Detalhe: modal Compartilhar abre com busca de clientes, lista e mensagem opcional.
- Problema observado nos logs do servidor local: chamadas para `/parceiros/materiais/:id/arquivo` e `?cover=1` retornaram 500, então o iframe/preview do PDF pode ficar vazio ou inconsistente mesmo quando o layout da página carrega.

### `/parceiros/cadastros`

- O que funciona: alternância Base de Alimentos/Biblioteca de Exercícios.
- Novo exercício: drawer com campos completos abre corretamente.
- Importar base: modal CSV/TSV abre com upload/colagem e contador de alimentos reconhecidos.

### `/cliente/inicio`

- O que funciona: saudação, cards e módulos principais.
- Observação: navegação superior do cliente só exibe Home, Minha Evolução e Configurações desabilitada; Dieta/Treino/Saúde aparecem como cards/rotas internas.

### `/cliente/dieta`

- O que funciona: painel diário, próxima refeição, resumo nutricional e refeições.
- Sem erros críticos observados.

### `/cliente/treino`

- O que funciona: cards Treino A/B/C e botão Iniciar treino.
- Problema: após selecionar Treino B, “Iniciar treino” abriu sessão de execução com título “Treino A” e exercício Supino reto.
- Sessão criada: `/cliente/treino/executar/0082af3e-ff2f-4218-a198-e448824a297f`.

### `/cliente/saude`

- O que funciona: painel de saúde, módulos sono/pressão, lembretes e linha do tempo carregam.
- Problema: botão “Iniciar agora” no lembrete de Ômega 3 abre alerta nativo “Acao de saude invalida.”

### `/cliente/evolucao`

- O que funciona: gráficos de composição, métricas de treinamento, nutrição/balanço energético e seção visual/fotos carregam.
- Console/logs: durante renderização houve warnings de gráfico com `width(-1)` e `height(-1)`, indicando risco de container sem dimensão em algum momento do layout.
- Fotos: a seção visual renderiza no fim da página; sem erro de console.
- Mapa muscular: seção de treinamento renderiza, mas a auditoria visual não identificou um mapa muscular nomeado explicitamente no snapshot.
- Mobile: `390x900` empilha os blocos sem overflow horizontal aparente; página muito longa.
- Evidências: `auditoria-cliente-evolucao-desktop.png`, `auditoria-cliente-evolucao-mobile.png`.

### Admin

- `/admin/dashboard`: métricas e gráficos carregam.
- `/admin/profissionais`: filtros e modal Novo parceiro funcionam.
- `/admin/clientes`: indicadores e tabela carregam.
- `/admin/financeiro`: gráficos/métricas carregam; valores locais zerados por plano gratuito.
- `/admin/suporte`: tickets e filtros carregam; “Novo ticket interno” não mostrou feedback visível.
- `/admin/configuracoes`: abas alternam corretamente; não foram salvas alterações.
- Evidência: `auditoria-admin-dashboard.png`.

## Problemas Encontrados

### Crítico

1. Cadastro de cliente por parceiro falha por CORS.
   - Página: `/parceiros/clientes`.
   - Passos: abrir Novo Cliente, preencher dados de teste e clicar Criar Cliente.
   - Resultado atual: alerta “Não foi possível criar o Cliente agora.”
   - Resultado esperado: cliente criado ou erro validado amigável.
   - Evidência: console indica bloqueio CORS em `provision-client-for-partner`.

### Alto

1. Logout gera erro de Next.js.
   - Páginas: shell de parceiro/cliente/admin.
   - Passos: clicar Sair.
   - Resultado atual: console registra `A "use server" file can only export async functions, found object`.
   - Resultado esperado: logout limpo sem erro.

2. Cliente seleciona Treino B, mas execução abre Treino A.
   - Página: `/cliente/treino`.
   - Passos: clicar Treino B e depois Iniciar treino.
   - Resultado atual: execução mostra “Treino A” e Supino reto.
   - Resultado esperado: execução do Treino B selecionado.

3. Ação de saúde visível falha.
   - Página: `/cliente/saude`.
   - Passos: clicar “Iniciar agora” no lembrete de Ômega 3.
   - Resultado atual: alerta “Acao de saude invalida.”
   - Resultado esperado: registrar/iniciar ação ou exibir fluxo correto.

### Médio

1. Textos removidos ainda aparecem no Dashboard Parceiro.
   - Página: `/parceiros/dashboard`.
   - Resultado atual: “Dados conectados ao Supabase local” e “Sem exposição clínica detalhada”.
   - Resultado esperado: textos removidos conforme checklist.

2. “Mais ações” na aba Dietas não abre menu visível.
   - Página: `/parceiros/clientes/:id?tab=dietas`.
   - Resultado atual: botão ganha foco/estado, mas não há menu perceptível.
   - Resultado esperado: menu/dropdown com ações.

3. “Novo ticket interno” não dá feedback visível.
   - Página: `/admin/suporte`.
   - Resultado atual: clique sem modal/URL/mensagem perceptível.
   - Resultado esperado: abrir formulário ou mostrar ação indisponível.

4. Preview/arquivo de material retorna erro 500 localmente.
   - Página: `/parceiros/materiais/:id`.
   - Resultado atual: logs do servidor indicaram 500 em `/arquivo` e `?cover=1`.
   - Resultado esperado: preview/download do arquivo carregar ou exibir mensagem de indisponibilidade.

5. Gráficos da Evolução emitem warnings de dimensão.
   - Página: `/cliente/evolucao`.
   - Resultado atual: warnings `width(-1)` e `height(-1)` durante renderização.
   - Resultado esperado: containers com dimensão estável antes de renderizar gráficos.

### Baixo / Ajustes Visuais

1. Aba Fotos do cliente parceiro carrega mais lentamente que as demais.
2. Página `/cliente/evolucao` mobile fica muito longa, embora sem overflow aparente.
3. Alguns botões de período, como “Últimos 6 meses” no dashboard parceiro, não deixam claro se são filtros reais ou placeholders.

## Formulários e Cadastros Testados

| Formulário | Dados usados | Resultado |
| --- | --- | --- |
| Login parceiro | `antonioferrari2002@gmail.com` / `123456` | OK após Supabase local iniciar |
| Login cliente | `cliente.seed.01@example.invalid` / `123456` | OK |
| Login admin | `antoniofelipe258@gmail.com` / `123456` | OK |
| Novo Cliente | `Teste Auditoria Playwright` | Falhou por CORS |
| Agendar consulta | `Teste Auditoria Playwright`, 20/07/2026 09:00 | OK, apareceu na Agenda |
| Compartilhar material | Modal aberto, sem submeter | OK |
| Novo exercício | Modal aberto, sem submeter | OK |
| Importar base | Modal aberto, sem submeter | OK |
| Novo parceiro admin | Modal aberto, sem submeter | OK |

## Botões e Interações

- Funcionaram: busca de clientes, filtros avançados, busca de materiais, lista/grade, compartilhar material, abas de exames, abas de configurações, agenda mês/semana, seleção de Treino B no parceiro, Recalcular em Avaliações.
- Falharam: Criar Cliente, Iniciar agora em Saúde, logout com erro de console.
- Sem feedback claro: Mais ações em Dietas, Novo ticket interno, alguns filtros de período.
- Desabilitados intencionalmente: Configurações no header do cliente; Anamnese, Prescrições e Formulários no detalhe do cliente parceiro.

## Responsividade

- Desktop `1440x1000`: telas principais carregam sem sobreposição evidente.
- Mobile `390x900`: `/cliente/evolucao` empilha cards, gráficos e seção visual sem overflow horizontal aparente.
- Dashboard parceiro mobile foi limitado pela troca de sessão e foco nas rotas críticas; recomenda-se uma segunda passada dedicada somente a mobile para parceiro/admin.

## Comparação com Sitemap

Rotas implementadas no código e testadas incluem:

- `/login`
- `/cliente/inicio`
- `/cliente/dieta`
- `/cliente/treino`
- `/cliente/treino/executar/:sessionId`
- `/cliente/saude`
- `/cliente/evolucao`
- `/parceiros/dashboard`
- `/parceiros/clientes`
- `/parceiros/clientes/:id`
- `/parceiros/agenda`
- `/parceiros/materiais`
- `/parceiros/materiais/:id`
- `/parceiros/cadastros`
- `/admin/dashboard`
- `/admin/profissionais`
- `/admin/clientes`
- `/admin/financeiro`
- `/admin/suporte`
- `/admin/configuracoes`

Rotas previstas no sitemap mas não implementadas como páginas próprias no código atual:

- Acessos específicos: `/cliente/login`, `/cliente/cadastro`, `/cliente/recuperar-senha`, `/cliente/onboarding`, `/parceiros/login`, `/parceiros/cadastro`, `/parceiros/recuperar-senha`, `/parceiros/onboarding`, `/admin/login`.
- Subrotas cliente: `/cliente/inicio/resumo`, `/cliente/dieta/plano`, `/cliente/treino/programa-atual`, `/cliente/saude/sono`, `/cliente/saude/mlpa`, `/cliente/evolucao/corporal`, `/cliente/configuracoes` e descendentes.
- Subrotas parceiro: `/parceiros/dashboard/visao-geral`, `/parceiros/clientes/:id/visao-geral`, `/parceiros/clientes/:id/dietas`, `/parceiros/agenda/calendario`, `/parceiros/materiais/biblioteca`, `/parceiros/cadastros/alimentos` e descendentes.
- Subrotas admin: `/admin/dashboard/metricas`, `/admin/profissionais/contas`, `/admin/relatorios`, `/admin/seguranca`, `/admin/auditoria` e descendentes.

Diferenças positivas: o app já possui páginas além do bloco “rotas implementadas hoje” do sitemap, especialmente `/cliente/dieta`, `/cliente/treino`, `/cliente/saude`, `/cliente/evolucao`, `/parceiros/agenda`, `/parceiros/materiais`, `/parceiros/cadastros`, `/admin/clientes`, `/admin/financeiro`, `/admin/suporte` e `/admin/configuracoes`.

## Fonte

O CSS global importa e aplica `Rethink Sans` via `--font-sans`, e o Tailwind também referencia `Rethink Sans`. A auditoria de código confirma a intenção de uso global dessa fonte.

## Recomendações

1. Corrigir CORS/deploy local da Edge Function `provision-client-for-partner`.
2. Corrigir exportações em arquivo `"use server"` que quebram logout.
3. Ajustar seleção de treino para que “Iniciar treino” respeite Treino A/B/C escolhido.
4. Corrigir ação de saúde “Iniciar agora” ou remover/desabilitar quando inválida.
5. Remover textos locais do dashboard parceiro conforme checklist.
6. Dar feedback real para “Mais ações”, “Novo ticket interno” e filtros de período.
7. Fazer segunda rodada mobile focada em parceiro/admin, principalmente tabelas largas e dashboard.

## Conclusão

A plataforma está funcional para navegação principal, leitura de dados, gráficos, abas e boa parte dos fluxos de parceiro, cliente e admin. Os bloqueios mais importantes antes de finalização são o cadastro de cliente, logout, ação de saúde e inconsistência da execução de treino. O sitemap está parcialmente implementado: várias rotas alvo ainda não existem como páginas próprias, mas o app já avançou além do bloco inicial de rotas implementadas descrito no próprio documento.
