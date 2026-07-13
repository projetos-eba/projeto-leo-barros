# Relatório Playwright - todas as páginas

Data: 2026-07-03
Base testada: http://localhost:3000
Projeto: /Users/antoniofelipe/Projeto_Leo_Barros

## Observação sobre MCP
O alvo de navegador MCP/in-app não estava disponível nesta sessão (`agent.browsers.list()` retornou lista vazia). A varredura abaixo foi executada com Playwright local/headless contra o mesmo servidor Next local.

## Preparação
- Servidor Next iniciado com `npm run dev` em `http://localhost:3000`.
- Supabase local estava ativo via containers Docker.
- Seeds executados: dashboard admin, assets de materiais e fotos de clientes.
- Credenciais usadas: admin smoke, parceiro smoke e cliente smoke do projeto.

## Logins
- Admin: destino após login `/admin/dashboard`; amostra: lß Leonardo Barros SAUDE | NUTRICAO | PERFORMANCE Visão Geral Parceiros/Profissionais Clientes Financeiro & Planos Suporte Configurações Sair ADMIN Super Admin — Visão Geral Acompanhe assinaturas, clientes, suporte e documentos com dados reais do banco local. 30 de jun - 31 de ju
- Parceiro: destino após login `/parceiros/dashboard`; amostra: lß Leonardo Barros SAUDE | NUTRICAO | PERFORMANCE Visão Geral Clientes Agenda Materiais Cadastro Configurações Sair Antonio Ferrari Acesso Local Parceiro · ativo Olá, Antonio Ferrari 👋 30 de jun - 31 de jul Ver agenda completa Adicionar cliente Clientes ativos 5 0% vs. mês anter
- Cliente: destino após login `/cliente/inicio`; amostra: lß Leonardo Barros SAUDE | NUTRICAO | PERFORMANCE Home Minha Evolução Configurações Ana Ribeiro A Sair Olá, Ana Bem-vindo ao seu painel central. Escolha por onde deseja iniciar hoje e acompanhe sua evolução entre dieta, treino e saúde. PLANO VENCE EM Plano ativo 11 JUL 2026 ATIVO

## Resumo Executivo
- Páginas/viewport testados: 52 (26 rotas em desktop e mobile).
- Sem inconsistências automatizadas: 31.
- Com atenção: 21.
- Verificação de proteção sem sessão: 15 rotas protegidas; 15 redirecionaram para login.

## Rotas Dinâmicas Usadas
- Cliente parceiro: a1000000-0000-4000-8000-000000000301.
- Material parceiro: c1000000-0000-4000-8000-000000000101.
- Sessão de treino cliente: e3000000-0000-4000-8000-000000000101.

## Público
### OK - Home pública (desktop)
- Rota: `/` -> `/`; status: 200.
- H1/amostra: Shell público preservado
- Interações detectadas: 3 botões, 0 links.
- Screenshot: [screenshots/desktop-home-p-blica.png](./screenshots/desktop-home-p-blica.png).

### OK - Home pública (mobile)
- Rota: `/` -> `/`; status: 200.
- H1/amostra: Shell público preservado
- Interações detectadas: 3 botões, 0 links.
- Screenshot: [screenshots/mobile-home-p-blica.png](./screenshots/mobile-home-p-blica.png).

### OK - Login (desktop)
- Rota: `/login` -> `/login`; status: 200.
- H1/amostra: Leonardo Barros
- Interações detectadas: 1 botões, 0 links.
- Screenshot: [screenshots/desktop-login.png](./screenshots/desktop-login.png).

### OK - Login (mobile)
- Rota: `/login` -> `/login`; status: 200.
- H1/amostra: Leonardo Barros
- Interações detectadas: 1 botões, 0 links.
- Screenshot: [screenshots/mobile-login.png](./screenshots/mobile-login.png).

## Admin
### OK - Dashboard admin (desktop)
- Rota: `/admin/dashboard` -> `/admin/dashboard`; status: 200.
- H1/amostra: Super Admin — Visão Geral
- Interações detectadas: 8 botões, 6 links.
- Screenshot: [screenshots/desktop-dashboard-admin.png](./screenshots/desktop-dashboard-admin.png).

### OK - Dashboard admin (mobile)
- Rota: `/admin/dashboard` -> `/admin/dashboard`; status: 200.
- H1/amostra: Super Admin — Visão Geral
- Interações detectadas: 8 botões, 6 links.
- Screenshot: [screenshots/mobile-dashboard-admin.png](./screenshots/mobile-dashboard-admin.png).

### OK - Profissionais admin (desktop)
- Rota: `/admin/profissionais` -> `/admin/profissionais`; status: 200.
- H1/amostra: Parceiros & Profissionais
- Interações detectadas: 32 botões, 6 links.
- Screenshot: [screenshots/desktop-profissionais-admin.png](./screenshots/desktop-profissionais-admin.png).

### OK - Profissionais admin (mobile)
- Rota: `/admin/profissionais` -> `/admin/profissionais`; status: 200.
- H1/amostra: Parceiros & Profissionais
- Interações detectadas: 32 botões, 6 links.
- Screenshot: [screenshots/mobile-profissionais-admin.png](./screenshots/mobile-profissionais-admin.png).

### OK - Clientes admin (desktop)
- Rota: `/admin/clientes` -> `/admin/clientes`; status: 200.
- H1/amostra: Clientes
- Interações detectadas: 53 botões, 6 links.
- Screenshot: [screenshots/desktop-clientes-admin.png](./screenshots/desktop-clientes-admin.png).

### OK - Clientes admin (mobile)
- Rota: `/admin/clientes` -> `/admin/clientes`; status: 200.
- H1/amostra: Clientes
- Interações detectadas: 53 botões, 6 links.
- Screenshot: [screenshots/mobile-clientes-admin.png](./screenshots/mobile-clientes-admin.png).

### OK - Financeiro admin (desktop)
- Rota: `/admin/financeiro` -> `/admin/financeiro`; status: 200.
- H1/amostra: Financeiro & Planos
- Interações detectadas: 9 botões, 6 links.
- Screenshot: [screenshots/desktop-financeiro-admin.png](./screenshots/desktop-financeiro-admin.png).

### OK - Financeiro admin (mobile)
- Rota: `/admin/financeiro` -> `/admin/financeiro`; status: 200.
- H1/amostra: Financeiro & Planos
- Interações detectadas: 9 botões, 6 links.
- Screenshot: [screenshots/mobile-financeiro-admin.png](./screenshots/mobile-financeiro-admin.png).

### OK - Suporte admin (desktop)
- Rota: `/admin/suporte` -> `/admin/suporte`; status: 200.
- H1/amostra: Suporte
- Interações detectadas: 13 botões, 6 links.
- Screenshot: [screenshots/desktop-suporte-admin.png](./screenshots/desktop-suporte-admin.png).

### OK - Suporte admin (mobile)
- Rota: `/admin/suporte` -> `/admin/suporte`; status: 200.
- H1/amostra: Suporte
- Interações detectadas: 13 botões, 6 links.
- Screenshot: [screenshots/mobile-suporte-admin.png](./screenshots/mobile-suporte-admin.png).

### OK - Configurações admin (desktop)
- Rota: `/admin/configuracoes` -> `/admin/configuracoes`; status: 200.
- H1/amostra: Configurações
- Interações detectadas: 11 botões, 6 links.
- Screenshot: [screenshots/desktop-configura-es-admin.png](./screenshots/desktop-configura-es-admin.png).

### OK - Configurações admin (mobile)
- Rota: `/admin/configuracoes` -> `/admin/configuracoes`; status: 200.
- H1/amostra: Configurações
- Interações detectadas: 11 botões, 6 links.
- Screenshot: [screenshots/mobile-configura-es-admin.png](./screenshots/mobile-configura-es-admin.png).

## Parceiros
### OK - Dashboard parceiro (desktop)
- Rota: `/parceiros/dashboard` -> `/parceiros/dashboard`; status: 200.
- H1/amostra: Olá, Antonio Ferrari
- Interações detectadas: 11 botões, 12 links.
- Screenshot: [screenshots/desktop-dashboard-parceiro.png](./screenshots/desktop-dashboard-parceiro.png).

### OK - Dashboard parceiro (mobile)
- Rota: `/parceiros/dashboard` -> `/parceiros/dashboard`; status: 200.
- H1/amostra: Olá, Antonio Ferrari
- Interações detectadas: 11 botões, 12 links.
- Screenshot: [screenshots/mobile-dashboard-parceiro.png](./screenshots/mobile-dashboard-parceiro.png).

### OK - Agenda parceiro (desktop)
- Rota: `/parceiros/agenda` -> `/parceiros/agenda`; status: 200.
- H1/amostra: Agenda de Parceiros
- Interações detectadas: 68 botões, 6 links.
- Screenshot: [screenshots/desktop-agenda-parceiro.png](./screenshots/desktop-agenda-parceiro.png).

### OK - Agenda parceiro (mobile)
- Rota: `/parceiros/agenda` -> `/parceiros/agenda`; status: 200.
- H1/amostra: Agenda de Parceiros
- Interações detectadas: 68 botões, 6 links.
- Screenshot: [screenshots/mobile-agenda-parceiro.png](./screenshots/mobile-agenda-parceiro.png).

### OK - Clientes parceiro (desktop)
- Rota: `/parceiros/clientes` -> `/parceiros/clientes`; status: 200.
- H1/amostra: Clientes
- Interações detectadas: 28 botões, 6 links.
- Screenshot: [screenshots/desktop-clientes-parceiro.png](./screenshots/desktop-clientes-parceiro.png).

### OK - Clientes parceiro (mobile)
- Rota: `/parceiros/clientes` -> `/parceiros/clientes`; status: 200.
- H1/amostra: Clientes
- Interações detectadas: 28 botões, 6 links.
- Screenshot: [screenshots/mobile-clientes-parceiro.png](./screenshots/mobile-clientes-parceiro.png).

### Atenção - Cliente parceiro - visão geral (desktop)
- Rota: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301` -> `/parceiros/clientes/a1000000-0000-4000-8000-000000000301`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/desktop-cliente-parceiro-vis-o-geral.png](./screenshots/desktop-cliente-parceiro-vis-o-geral.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/clientes/a1000000-0000-4000-8000-000000000301`.

### Atenção - Cliente parceiro - visão geral (mobile)
- Rota: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301` -> `/parceiros/clientes/a1000000-0000-4000-8000-000000000301`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/mobile-cliente-parceiro-vis-o-geral.png](./screenshots/mobile-cliente-parceiro-vis-o-geral.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/clientes/a1000000-0000-4000-8000-000000000301`.

### Atenção - Cliente parceiro - dietas (desktop)
- Rota: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=dietas` -> `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=dietas`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/desktop-cliente-parceiro-dietas.png](./screenshots/desktop-cliente-parceiro-dietas.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=dietas`.

### Atenção - Cliente parceiro - dietas (mobile)
- Rota: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=dietas` -> `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=dietas`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/mobile-cliente-parceiro-dietas.png](./screenshots/mobile-cliente-parceiro-dietas.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=dietas`.

### Atenção - Cliente parceiro - avaliações (desktop)
- Rota: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=avaliacoes` -> `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=avaliacoes`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/desktop-cliente-parceiro-avalia-es.png](./screenshots/desktop-cliente-parceiro-avalia-es.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=avaliacoes`.

### Atenção - Cliente parceiro - avaliações (mobile)
- Rota: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=avaliacoes` -> `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=avaliacoes`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/mobile-cliente-parceiro-avalia-es.png](./screenshots/mobile-cliente-parceiro-avalia-es.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=avaliacoes`.

### Atenção - Cliente parceiro - treinos (desktop)
- Rota: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=treinos` -> `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=treinos`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/desktop-cliente-parceiro-treinos.png](./screenshots/desktop-cliente-parceiro-treinos.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=treinos`.

### Atenção - Cliente parceiro - treinos (mobile)
- Rota: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=treinos` -> `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=treinos`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/mobile-cliente-parceiro-treinos.png](./screenshots/mobile-cliente-parceiro-treinos.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=treinos`.

### Atenção - Cliente parceiro - cardio (desktop)
- Rota: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=cardio` -> `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=cardio`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/desktop-cliente-parceiro-cardio.png](./screenshots/desktop-cliente-parceiro-cardio.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=cardio`.

### Atenção - Cliente parceiro - cardio (mobile)
- Rota: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=cardio` -> `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=cardio`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/mobile-cliente-parceiro-cardio.png](./screenshots/mobile-cliente-parceiro-cardio.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=cardio`.

### Atenção - Cliente parceiro - exames (desktop)
- Rota: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=exames` -> `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=exames`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/desktop-cliente-parceiro-exames.png](./screenshots/desktop-cliente-parceiro-exames.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=exames`.

### Atenção - Cliente parceiro - exames (mobile)
- Rota: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=exames` -> `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=exames`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/mobile-cliente-parceiro-exames.png](./screenshots/mobile-cliente-parceiro-exames.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=exames`.

### Atenção - Cliente parceiro - fotos (desktop)
- Rota: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=fotos` -> `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=fotos`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/desktop-cliente-parceiro-fotos.png](./screenshots/desktop-cliente-parceiro-fotos.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=fotos`.

### Atenção - Cliente parceiro - fotos (mobile)
- Rota: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=fotos` -> `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=fotos`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/mobile-cliente-parceiro-fotos.png](./screenshots/mobile-cliente-parceiro-fotos.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=fotos`.

### OK - Cadastros parceiro (desktop)
- Rota: `/parceiros/cadastros` -> `/parceiros/cadastros`; status: 200.
- H1/amostra: Base de Protocolos
- Interações detectadas: 56 botões, 6 links.
- Screenshot: [screenshots/desktop-cadastros-parceiro.png](./screenshots/desktop-cadastros-parceiro.png).

### OK - Cadastros parceiro (mobile)
- Rota: `/parceiros/cadastros` -> `/parceiros/cadastros`; status: 200.
- H1/amostra: Base de Protocolos
- Interações detectadas: 56 botões, 6 links.
- Screenshot: [screenshots/mobile-cadastros-parceiro.png](./screenshots/mobile-cadastros-parceiro.png).

### Atenção - Materiais parceiro (desktop)
- Rota: `/parceiros/materiais` -> `/parceiros/materiais`; status: 200.
- H1/amostra: Materiais
- Interações detectadas: 17 botões, 10 links.
- Screenshot: [screenshots/desktop-materiais-parceiro.png](./screenshots/desktop-materiais-parceiro.png).
- Inconsistências: 2 resposta(s) 4xx/5xx; Erro de console/runtime.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`; `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/materiais/c1000000-0000-4000-8000-000000000102/arquivo?cover=1`; `404 http://localhost:3000/parceiros/materiais/c1000000-0000-4000-8000-000000000101/arquivo?cover=1`.

### Atenção - Materiais parceiro (mobile)
- Rota: `/parceiros/materiais` -> `/parceiros/materiais`; status: 200.
- H1/amostra: Materiais
- Interações detectadas: 17 botões, 10 links.
- Screenshot: [screenshots/mobile-materiais-parceiro.png](./screenshots/mobile-materiais-parceiro.png).
- Inconsistências: 2 resposta(s) 4xx/5xx; Erro de console/runtime.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`; `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/materiais/c1000000-0000-4000-8000-000000000102/arquivo?cover=1`; `404 http://localhost:3000/parceiros/materiais/c1000000-0000-4000-8000-000000000101/arquivo?cover=1`.

### Atenção - Detalhe material parceiro (desktop)
- Rota: `/parceiros/materiais/c1000000-0000-4000-8000-000000000101` -> `/parceiros/materiais/c1000000-0000-4000-8000-000000000101`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/desktop-detalhe-material-parceiro.png](./screenshots/desktop-detalhe-material-parceiro.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/materiais/c1000000-0000-4000-8000-000000000101`.

### Atenção - Detalhe material parceiro (mobile)
- Rota: `/parceiros/materiais/c1000000-0000-4000-8000-000000000101` -> `/parceiros/materiais/c1000000-0000-4000-8000-000000000101`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/mobile-detalhe-material-parceiro.png](./screenshots/mobile-detalhe-material-parceiro.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/parceiros/materiais/c1000000-0000-4000-8000-000000000101`.

## Cliente
### OK - Início cliente (desktop)
- Rota: `/cliente/inicio` -> `/cliente/inicio`; status: 200.
- H1/amostra: Olá, Ana
- Interações detectadas: 4 botões, 5 links.
- Screenshot: [screenshots/desktop-in-cio-cliente.png](./screenshots/desktop-in-cio-cliente.png).

### OK - Início cliente (mobile)
- Rota: `/cliente/inicio` -> `/cliente/inicio`; status: 200.
- H1/amostra: Olá, Ana
- Interações detectadas: 4 botões, 5 links.
- Screenshot: [screenshots/mobile-in-cio-cliente.png](./screenshots/mobile-in-cio-cliente.png).

### OK - Saúde cliente (desktop)
- Rota: `/cliente/saude` -> `/cliente/saude`; status: 200.
- H1/amostra: Painel de Saúde
- Interações detectadas: 8 botões, 7 links.
- Screenshot: [screenshots/desktop-sa-de-cliente.png](./screenshots/desktop-sa-de-cliente.png).

### OK - Saúde cliente (mobile)
- Rota: `/cliente/saude` -> `/cliente/saude`; status: 200.
- H1/amostra: Painel de Saúde
- Interações detectadas: 8 botões, 7 links.
- Screenshot: [screenshots/mobile-sa-de-cliente.png](./screenshots/mobile-sa-de-cliente.png).

### OK - Dieta cliente (desktop)
- Rota: `/cliente/dieta` -> `/cliente/dieta`; status: 200.
- H1/amostra: Painel de Dieta
- Interações detectadas: 24 botões, 5 links.
- Screenshot: [screenshots/desktop-dieta-cliente.png](./screenshots/desktop-dieta-cliente.png).

### Atenção - Dieta cliente (mobile)
- Rota: `/cliente/dieta` -> `/cliente/dieta`; status: 200.
- H1/amostra: Painel de Dieta
- Interações detectadas: 24 botões, 5 links.
- Screenshot: [screenshots/mobile-dieta-cliente.png](./screenshots/mobile-dieta-cliente.png).
- Inconsistências: Overflow horizontal mobile (568px > 390px).

### OK - Treino cliente (desktop)
- Rota: `/cliente/treino` -> `/cliente/treino`; status: 200.
- H1/amostra: Painel de Treino
- Interações detectadas: 11 botões, 8 links.
- Screenshot: [screenshots/desktop-treino-cliente.png](./screenshots/desktop-treino-cliente.png).

### OK - Treino cliente (mobile)
- Rota: `/cliente/treino` -> `/cliente/treino`; status: 200.
- H1/amostra: Painel de Treino
- Interações detectadas: 11 botões, 8 links.
- Screenshot: [screenshots/mobile-treino-cliente.png](./screenshots/mobile-treino-cliente.png).

### Atenção - Execução treino cliente (desktop)
- Rota: `/cliente/treino/executar/e3000000-0000-4000-8000-000000000101` -> `/cliente/treino/executar/e3000000-0000-4000-8000-000000000101`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/desktop-execu-o-treino-cliente.png](./screenshots/desktop-execu-o-treino-cliente.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/cliente/treino/executar/e3000000-0000-4000-8000-000000000101`.

### Atenção - Execução treino cliente (mobile)
- Rota: `/cliente/treino/executar/e3000000-0000-4000-8000-000000000101` -> `/cliente/treino/executar/e3000000-0000-4000-8000-000000000101`; status: 404.
- H1/amostra: 404
- Interações detectadas: 0 botões, 0 links.
- Screenshot: [screenshots/mobile-execu-o-treino-cliente.png](./screenshots/mobile-execu-o-treino-cliente.png).
- Inconsistências: Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Console: `error: Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Respostas 4xx/5xx: `404 http://localhost:3000/cliente/treino/executar/e3000000-0000-4000-8000-000000000101`.

## Proteção de Rotas Sem Login
- /admin/dashboard: terminou em `/login` (OK).
- /admin/profissionais: terminou em `/login` (OK).
- /admin/clientes: terminou em `/login` (OK).
- /admin/financeiro: terminou em `/login` (OK).
- /admin/suporte: terminou em `/login` (OK).
- /admin/configuracoes: terminou em `/login` (OK).
- /parceiros/dashboard: terminou em `/login` (OK).
- /parceiros/agenda: terminou em `/login` (OK).
- /parceiros/clientes: terminou em `/login` (OK).
- /parceiros/cadastros: terminou em `/login` (OK).
- /parceiros/materiais: terminou em `/login` (OK).
- /cliente/inicio: terminou em `/login` (OK).
- /cliente/saude: terminou em `/login` (OK).
- /cliente/dieta: terminou em `/login` (OK).
- /cliente/treino: terminou em `/login` (OK).

## Itens A Investigar
- Cliente parceiro - visão geral (desktop, /parceiros/clientes/a1000000-0000-4000-8000-000000000301): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Cliente parceiro - visão geral (mobile, /parceiros/clientes/a1000000-0000-4000-8000-000000000301): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Cliente parceiro - dietas (desktop, /parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=dietas): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Cliente parceiro - dietas (mobile, /parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=dietas): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Cliente parceiro - avaliações (desktop, /parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=avaliacoes): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Cliente parceiro - avaliações (mobile, /parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=avaliacoes): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Cliente parceiro - treinos (desktop, /parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=treinos): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Cliente parceiro - treinos (mobile, /parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=treinos): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Cliente parceiro - cardio (desktop, /parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=cardio): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Cliente parceiro - cardio (mobile, /parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=cardio): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Cliente parceiro - exames (desktop, /parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=exames): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Cliente parceiro - exames (mobile, /parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=exames): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Cliente parceiro - fotos (desktop, /parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=fotos): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Cliente parceiro - fotos (mobile, /parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=fotos): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Materiais parceiro (desktop, /parceiros/materiais): 2 resposta(s) 4xx/5xx; Erro de console/runtime.
- Materiais parceiro (mobile, /parceiros/materiais): 2 resposta(s) 4xx/5xx; Erro de console/runtime.
- Detalhe material parceiro (desktop, /parceiros/materiais/c1000000-0000-4000-8000-000000000101): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Detalhe material parceiro (mobile, /parceiros/materiais/c1000000-0000-4000-8000-000000000101): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Dieta cliente (mobile, /cliente/dieta): Overflow horizontal mobile (568px > 390px).
- Execução treino cliente (desktop, /cliente/treino/executar/e3000000-0000-4000-8000-000000000101): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.
- Execução treino cliente (mobile, /cliente/treino/executar/e3000000-0000-4000-8000-000000000101): Status HTTP inicial 404; 1 resposta(s) 4xx/5xx; Erro de console/runtime; Conteúdo visível muito curto ou possível página vazia; Conteúdo indica 404/não encontrado.