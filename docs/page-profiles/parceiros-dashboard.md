# Parceiros - Dashboard / Visao Geral

## Rota

- `/parceiros/dashboard`
- Shell autenticado: `profile="parceiros"`
- Acesso: somente perfil `parceiro` com `profiles.status = active`

## Objetivo

Dar ao parceiro uma visao operacional da propria carteira: clientes ativos, atualizacoes pendentes, inativos, renovacoes proximas, receita prevista de planos personalizados, alertas operacionais e distribuicao dos planos ofertados.

## Fontes de dados

- `profiles`: profile autenticado do parceiro.
- `partners`: cadastro profissional do parceiro.
- `partner_clients`: vinculos operacionais entre parceiro e clientes.
- `billing_plans`: plano comercial da plataforma.
- `partner_subscriptions`: assinatura do parceiro na plataforma.
- `partner_custom_plans`: planos personalizados que o parceiro oferta aos clientes.
- `partner_client_plan_subscriptions`: assinaturas dos clientes nesses planos personalizados.
- `support_tickets`: tickets vinculados ao parceiro.
- `partner_documents`: documentos operacionais do parceiro.
- `platform_activity_events`: movimentacoes recentes.

## KPIs

- Clientes ativos: clientes distintos com vinculo ativo na data atual.
- Novos clientes: clientes distintos cujo vinculo ativo iniciou no mes atual.
- Receita prevista: soma mensalizada de assinaturas abertas em planos personalizados.
- Renovacoes proximas: assinaturas de clientes em planos personalizados que vencem nos proximos 30 dias.
- Proximos da atualizacao: assinaturas de clientes com `next_review_at` vencido.
- Clientes inativos: clientes distintos com vinculo encerrado ou assinatura de plano personalizado encerrada.
- Alertas clinicos: contagem operacional agregada de pendencias relevantes, sem detalhes clinicos.

## Painel de Performance

- Referencia visual especifica: Figma node `408:634`, com tres estados de card selecionado.
- Cards selecionaveis: `Adesão média no período`, `Clientes com plano` e `Receita do mês`.
- O card selecionado deve ser conectado ao painel por uma camada decorativa SVG absoluta (`PerformanceOutline`), nunca por `border` CSS no grafico ou no card ativo.
- O contorno usa um unico path azul claro, arredondado, com recortes curvos e estados `averageAdhesion`, `adherentClients` e `monthlyGoal`.
- O grafico troca a serie conforme o card selecionado, mantendo eixo e tooltip compactos.
- `Receita do mês` usa recebimentos manuais pagos em `partner_client_receivables`, por data de pagamento, e deve refletir registros feitos em Planos & Financeiro.
- A meta de adesao padrao desta fase e `80%`.

## Contrato visual Figma

- Referencia: Figma `vyskvKR1gCzdckeXHR2Ewj`, nodes `1:7754` e `408:634`.
- Tema escuro com sidebar fixa em desktop, largura aproximada de `193px`.
- Conteudo desktop com largura maxima aproximada de `1199px`.
- Tokens principais: fundo `#0b1720`, sidebar `#0e151a`, cards `#04111b`, nav ativa `#0a2c48`, azul primario `#1d7ece`, azul grafico `#68afe9`.
- Fonte preferencial: `Rethink Sans`.
- Estrutura: saudacao + acoes, KPIs superiores, grafico principal + agenda, tres cards secundarios, tabelas de pendencias e renovacoes.
- Mobile empilha os paineis e preserva scroll horizontal interno nas tabelas; a pagina nao deve gerar overflow horizontal global.
- Mobile compacta o card `Alertas clinicos` com icone acima do titulo para economizar largura e manter harmonia com os demais KPIs.

## Regras

- A tela nao exibe dados clinicos, CPF, detalhes de dieta, treino, anamnese ou evolucao individual.
- `patients` continua sendo o nome tecnico, mas a interface deve usar `Clientes`.
- `cardio` nao aparece como escopo visual separado nesta fase; qualquer dado legado com esse escopo deve ser agrupado em `Treino`.
- Planos personalizados do parceiro ficam separados de `billing_plans`, que representam os planos comerciais cobrados pela plataforma.
- Renovacoes de planos personalizados usam `current_period_end` de `partner_client_plan_subscriptions`.
- Receita prevista mensaliza planos trimestrais e anuais.
- Estados vazios devem ser funcionais e claros, sem simular criacao/edicao ainda nao implementada.

## Estados de tela

- Parceiro com dados operacionais.
- Parceiro sem cadastro `partners`: tela renderiza vazia com nome do profile.
- Sem planos personalizados: distribuicao e receita mostram estado vazio/zero.
- Sem renovacoes proximas: painel informa que nao ha renovacoes criticas.
- Sem pendencias de atualizacao: tabela informa ausencia de planos vencidos.

## Validacao

- Testes unitarios:
  - `src/lib/partners/dashboard-metrics.test.ts`
  - `src/app/parceiros/dashboard/partner-dashboard-view.test.tsx`
- Banco:
  - `supabase/tests/010_partner_custom_plans.test.sql`
- Validacoes recomendadas:
  - `npx supabase db lint`
  - `npx supabase test db`
  - `npm run test`
  - `npm run build`
  - `npm run lint`
  - `npm run git:local -- diff --check`

## Smoke local

- Validar o login com um parceiro local ativo antes do smoke visual.
- Caso um usuario seja criado por SQL direto em `auth.users`, normalize campos textuais opcionais de Auth para string vazia (`confirmation_token`, `recovery_token`, `email_change`, `phone`, `phone_change` e tokens relacionados), pois o GoTrue local v2.191 pode falhar ao escanear `NULL`.
