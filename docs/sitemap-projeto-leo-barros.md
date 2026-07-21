# Sitemap otimizado - Projeto Leo Barros

Documentacao da arquitetura da informacao refinada e simplificada do Projeto Leo Barros.

Data de referencia: 29 de junho de 2026.

## Estado de implementacao

Este sitemap descreve a arquitetura alvo. Ele nao significa que todas as rotas ja existem.

Rotas implementadas hoje no app Next:

- `/login`;
- `/planos`;
- `/admin/clientes`;
- `/admin/configuracoes`;
- `/admin/dashboard`;
- `/admin/financeiro`;
- `/admin/profissionais`;
- `/admin/suporte`;
- `/cliente/dieta`;
- `/cliente/evolucao`;
- `/cliente/formularios`;
- `/cliente/formularios/:assignmentClientId`;
- `/parceiros/dashboard`;
- `/cliente/inicio`;
- `/cliente/saude`;
- `/cliente/treino`;
- `/parceiros/agenda`;
- `/parceiros/cadastros`;
- `/parceiros/clientes`;
- `/parceiros/clientes/:id`;
- `/parceiros/checkout`;
- `/parceiros/checkout/sucesso`;
- `/parceiros/configuracoes`;
- `/parceiros/configuracoes/geral`;
- `/parceiros/configuracoes/assinatura`;
- `/parceiros/materiais`;
- `/parceiros/materiais/:id`.

As demais rotas continuam como direcao de produto. Para telas ja implementadas, os documentos em `docs/page-profiles` e o codigo em `src/app` prevalecem sobre qualquer detalhe antigo deste mapa.

## 1. Principio da reorganizacao

O sitemap foi otimizado para evitar repeticao desnecessaria de niveis. Em vez de listar varios caminhos completos repetindo login e menu em toda linha, a arquitetura agora e apresentada por perfil de acesso, com um bloco unico de entrada e uma arvore compacta de menus e subniveis.

Perfis e prefixos oficiais:

| Perfil | Prefixo | Uso |
| --- | --- | --- |
| Cliente | `/cliente` | Jornada do usuario final, antes tratada como paciente. |
| Parceiros | `/parceiros` | Jornada dos profissionais/parceiros que operam clientes. |
| Admin | `/admin` | Jornada do Super Admin e gestao da plataforma. |

## 2. Convencao de niveis

| Nivel | Funcao | Como ler |
| --- | --- | --- |
| N1 | Acesso | Login, cadastro, recuperacao de senha e onboarding do perfil. |
| N2 | Menu principal | Areas visiveis na navegacao principal apos autenticacao. |
| N3 | Subarea | Primeira camada interna de uma area do menu. |
| N4 | Modulo ou funcao | Funcionalidade especifica dentro de uma subarea. |
| N5 | Detalhe ou acao | Pagina profunda, editor, historico, importacao, exportacao ou detalhe critico. |

Leitura recomendada:

`Perfil > N1 Acesso > N2 Menu > N3 Subarea > N4 Modulo > N5 Detalhe`

## 3. Jornada Cliente

Prefixo: `/cliente`

Objetivo: concentrar a experiencia do usuario final em rotina diaria, dieta, treino, saude, evolucao e configuracoes pessoais.

### 3.1 N1 - Acesso Cliente

| Tela | Rota | Objetivo |
| --- | --- | --- |
| Login | `/cliente/login` | Autenticar cliente recorrente. |
| Cadastro | `/cliente/cadastro` | Criar conta de cliente. |
| Recuperar senha | `/cliente/recuperar-senha` | Redefinir credenciais. |
| Onboarding | `/cliente/onboarding` | Capturar dados iniciais, objetivos e preferencias. |

### 3.2 N2 a N5 - Menu Cliente

| N2 Menu | Rota | Subniveis otimizados |
| --- | --- | --- |
| Inicio | `/cliente/inicio` | N3 Resumo diario `/cliente/inicio/resumo`; N3 Atalhos e notificacoes `/cliente/inicio/atalhos`. |
| Dieta | `/cliente/dieta` | N3 Plano alimentar `/cliente/dieta/plano`; N4 Refeicoes `/cliente/dieta/refeicoes`; N4 Substituicoes `/cliente/dieta/substituicoes`. |
| Treino | `/cliente/treino` | N3 Programa atual `/cliente/treino/programa-atual`; N4 Detalhes do treino `/cliente/treino/programa-atual/detalhes`; N5 Treino A, B e C `/cliente/treino/programa-atual/:divisao`; N3 Forca relativa `/cliente/treino/forca-relativa`; N4 Calculo por exercicio `/cliente/treino/forca-relativa/calculo`; N5 Resultado comparativo `/cliente/treino/forca-relativa/resultado`. |
| Saude | `/cliente/saude` | N3 Modulo de Sono `/cliente/saude/sono`; N4 Registro de sono `/cliente/saude/sono/registro`; N5 Historico e insights `/cliente/saude/sono/historico`; N3 Modulo MLPA `/cliente/saude/mlpa`; N4 Registro de medidas `/cliente/saude/mlpa/registro`; N5 Historico e alertas `/cliente/saude/mlpa/historico`. |
| Minha Evolucao | `/cliente/evolucao` | N3 Metricas corporais `/cliente/evolucao/corporal`; N4 Comparativo historico `/cliente/evolucao/corporal/historico`; N3 Metricas de treinamento `/cliente/evolucao/treinamento`; N4 Detalhes do treino `/cliente/evolucao/treinamento/detalhes`; N5 Programa atual `/cliente/evolucao/treinamento/programa-atual`. |
| Configuracoes | `/cliente/configuracoes` | N3 Dados pessoais `/cliente/configuracoes/dados`; N3 Seguranca `/cliente/configuracoes/seguranca`; N4 Alterar senha `/cliente/configuracoes/seguranca/senha`; N3 Notificacoes `/cliente/configuracoes/notificacoes`. |

### 3.3 Decisoes de IA - Cliente

- `Saude` concentra os modulos clinicos e de bem-estar, incluindo Sono e MLPA.
- `Minha Evolucao` concentra leitura historica e progresso, sem duplicar o papel operacional de Treino.
- `Treino` abriga Forca Relativa porque a ferramenta depende de exercicios, carga e programa atual.
- `Detalhes do treino` pode ser acessado por Treino ou Minha Evolucao, mas a URL deve preservar o contexto de origem.

### 3.4 Formularios atribuidos ao Cliente

O fluxo correto de produto para formularios e autenticado e contextual:

1. o profissional/parceiro cria ou seleciona um formulario;
2. o formulario e atribuido a um cliente especifico;
3. o cliente recebe a pendencia dentro do proprio perfil autenticado;
4. o cliente preenche e envia o formulario dentro da area Cliente.

A antiga implementacao Vite em `/form/:token` permanece apenas como referencia legada/provisoria para compatibilidade historica. Ela nao e uma rota publica alvo do sitemap e nao deve ser migrada diretamente para `/form/[token]`.

A rota autenticada definitiva no app Next e `/cliente/formularios`, com preenchimento em `/cliente/formularios/:assignmentClientId`.

## 4. Jornada Parceiros

Prefixo: `/parceiros`

Objetivo: dar ao parceiro uma operacao clara para acompanhar clientes, prescrever dieta/treino, organizar agenda, compartilhar materiais e manter bases reutilizaveis.

### 4.1 N1 - Acesso Parceiros

| Tela | Rota | Objetivo |
| --- | --- | --- |
| Login | `/parceiros/login` | Autenticar parceiro recorrente. |
| Cadastro | `/parceiros/cadastro` | Criar ou solicitar conta de parceiro. |
| Recuperar senha | `/parceiros/recuperar-senha` | Redefinir credenciais. |
| Onboarding | `/parceiros/onboarding` | Configurar dados profissionais, especialidade, plano e disponibilidade inicial. |

### 4.2 N2 a N5 - Menu Parceiros

| N2 Menu | Rota | Subniveis otimizados |
| --- | --- | --- |
| Dashboard | `/parceiros/dashboard` | N3 Visao geral `/parceiros/dashboard/visao-geral`; N3 Indicadores da carteira `/parceiros/dashboard/indicadores`; N4 Alertas prioritarios `/parceiros/dashboard/alertas`. |
| Clientes | `/parceiros/clientes` | N3 Lista e filtros `/parceiros/clientes`; N3 Cliente selecionado `/parceiros/clientes/:id`; N4 Visao geral `/parceiros/clientes/:id/visao-geral`; N4 Anamnese `/parceiros/clientes/:id/anamnese`; N4 Avaliacoes `/parceiros/clientes/:id/avaliacoes`; N4 Dietas `/parceiros/clientes/:id/dietas`; N5 Editor de plano `/parceiros/clientes/:id/dietas/editor`; N4 Treino `/parceiros/clientes/:id/treino`; N5 Editor de programa `/parceiros/clientes/:id/treino/editor`; N4 Cardio `/parceiros/clientes/:id/cardio`; N4 Exames `/parceiros/clientes/:id/exames`; N4 Planos/Financeiro `/parceiros/clientes/:id/financeiro`. |
| Agenda | `/parceiros/agenda` | N3 Calendario `/parceiros/agenda/calendario`; N4 Atendimento `/parceiros/agenda/:id`; N5 Detalhe do atendimento `/parceiros/agenda/:id/detalhes`. |
| Materiais | `/parceiros/materiais` | N3 Biblioteca `/parceiros/materiais/biblioteca`; N4 Material educativo `/parceiros/materiais/:id`; N5 Enviar para cliente `/parceiros/materiais/:id/enviar`. |
| Cadastros | `/parceiros/cadastros` | N3 Alimentos `/parceiros/cadastros/alimentos`; N4 Importacao nutricional `/parceiros/cadastros/alimentos/importar`; N5 TACO/TCBIO `/parceiros/cadastros/alimentos/importar/taco-tcbio`; N3 Treinos `/parceiros/cadastros/treinos`; N4 Exercicios `/parceiros/cadastros/treinos/exercicios`; N5 Novo exercicio `/parceiros/cadastros/treinos/exercicios/novo`. |
| Configuracoes | `/parceiros/configuracoes` | N3 Assinatura `/parceiros/configuracoes/assinatura`; N3 Perfil profissional `/parceiros/configuracoes/perfil`; N3 Preferencias `/parceiros/configuracoes/preferencias`; N4 Disponibilidade `/parceiros/configuracoes/disponibilidade`. |

### 4.3 Menu contextual do cliente

Dentro de `/parceiros/clientes/:id`, o parceiro acessa um menu contextual do cliente selecionado:

- Visao geral
- Anamnese
- Avaliacoes
- Dietas
- Treino
- Cardio
- Exames
- Planos/Financeiro

Esse menu nao e global. Ele depende sempre de um cliente selecionado e deve manter `:id` em todas as rotas internas.

### 4.4 Decisoes de IA - Parceiros

- `Clientes` substitui `Pacientes` para acompanhar a nova nomenclatura de perfil `/cliente`.
- `Cadastros` deve guardar bases reutilizaveis, nao dados individuais de clientes.
- TACO/TCBIO fica em N5 porque e uma acao profunda dentro da importacao nutricional.
- `Agenda` e `Materiais` continuam independentes, mas podem se conectar a um cliente no momento da acao.

## 5. Jornada Admin

Prefixo: `/admin`

Objetivo: permitir gestao executiva e operacional da plataforma sem misturar menus de cliente ou parceiro.

### 5.1 N1 - Acesso Admin

| Tela | Rota | Objetivo |
| --- | --- | --- |
| Login restrito | `/admin/login` | Autenticar Super Admin. |
| MFA / seguranca | `/admin/seguranca` | Camada de protecao administrativa. |
| Auditoria | `/admin/auditoria` | Registro administrativo de eventos sensiveis. |

### 5.2 N2 a N5 - Menu Admin

| N2 Menu | Rota | Subniveis otimizados |
| --- | --- | --- |
| Dashboard | `/admin/dashboard` | N3 Metricas gerais `/admin/dashboard/metricas`; N4 Drilldown de indicador `/admin/dashboard/metricas/:indicador`; N3 Receita total `/admin/dashboard/receita`; N4 Assinaturas ativas `/admin/dashboard/receita/assinaturas`. |
| Profissionais | `/admin/profissionais` | N3 Gestao de contas `/admin/profissionais/contas`; N4 Detalhe do profissional `/admin/profissionais/:id`; N5 Status e permissoes `/admin/profissionais/:id/permissoes`; N4 Assinatura do profissional `/admin/profissionais/:id/assinatura`. |
| Clientes | `/admin/clientes` | N3 Gestao de usuarios `/admin/clientes/usuarios`; N4 Detalhe do cliente `/admin/clientes/:id`; N5 Historico de acesso `/admin/clientes/:id/acessos`. |
| Relatorios | `/admin/relatorios` | N3 Extracao de dados `/admin/relatorios/extracao`; N4 Filtros por periodo `/admin/relatorios/extracao/filtros`; N5 Exportar CSV/PDF `/admin/relatorios/extracao/exportar`; N3 Operacionais `/admin/relatorios/operacionais`; N4 Adocao e engajamento `/admin/relatorios/operacionais/engajamento`. |
| Financeiro | `/admin/financeiro` | N3 Assinaturas do sistema `/admin/financeiro/assinaturas`; N4 Planos e cobrancas `/admin/financeiro/assinaturas/planos`; N5 Ajustar assinatura `/admin/financeiro/assinaturas/:id/ajustar`; N3 Receita `/admin/financeiro/receita`. |

### 5.3 Decisoes de IA - Admin

- `Clientes` substitui `Pacientes` na gestao administrativa para manter consistencia com `/cliente`.
- `Financeiro` fica focado em assinaturas, planos, cobrancas, ajustes e receita.
- `Relatorios` concentra extracao de dados e exportacao, evitando misturar analise com telas de gestao.

## 6. Regras de navegacao e permissao

| Regra | Aplicacao |
| --- | --- |
| Separacao por perfil | Cliente, Parceiros e Admin possuem acesso, layout e permissoes independentes. |
| Prefixos oficiais | Usar `/cliente`, `/parceiros` e `/admin` como bases de roteamento. |
| Sem repeticao de login | Login e cadastro aparecem uma vez por jornada, nao em todos os caminhos internos. |
| Menu contextual | O menu dentro de `/parceiros/clientes/:id` existe apenas quando ha cliente selecionado. |
| Profundidade maxima | O mapa trabalha com ate N5, mas so usa profundidade quando ha ganho real de clareza. |
| Ferramentas profundas | Forca Relativa, MLPA, TACO/TCBIO, editores e exportacoes recebem rotas proprias. |

## 7. Entrega no Figma

O sitemap visual foi atualizado na pagina `IA - Sitemap`, dentro do frame:

`Sitemap - Projeto Leo Barros`

Formato atual:

- Bloco `Cliente`, com prefixo `/cliente`.
- Bloco `Parceiros`, com prefixo `/parceiros`.
- Bloco `Admin`, com prefixo `/admin`.
- Acesso unico por perfil no topo.
- Cards de menu N2 com subniveis N3, N4 e N5 agrupados internamente.

## 8. Resumo executivo

A versao atual e mais enxuta porque remove repeticoes estruturais e deixa o sitemap orientado por decisao:

- Quem esta acessando?
- Qual menu principal esse perfil ve?
- Quais subareas pertencem a cada menu?
- Quais ferramentas precisam de rotas profundas?
- Quais detalhes justificam chegar ao N5?

Essa organizacao deve ser usada como base para navegacao, permissao, rotas e planejamento das telas futuras.
