# Page Profile - Admin Financeiro & Planos

Data de referencia: 29 de junho de 2026.

## Objetivo

Permitir que o Super Admin acompanhe receita recorrente, assinaturas, inadimplencia, churn financeiro, distribuicao de planos, receita por canal e renovacoes criticas da plataforma.

## Rota

- `/admin/financeiro`
- Perfil: `admin`
- Layout: `src/app/admin/layout.tsx`

## Fontes de dados

- `billing_plans`
- `partner_subscriptions`
- `billing_payments`
- `profiles`
- `partners`

## Regras principais

- MRR considera assinaturas ativas/trialing de profissionais com `profiles.role = 'parceiro'` e `profiles.status = 'active'`.
- Planos anuais sao mensalizados para MRR.
- O adicional por Cliente ativo entra no MRR usando `partner_subscriptions.active_client_quantity * 199`.
- A quantidade de Clientes ativos e reconciliada pela funcao canonica `billing_active_client_count`.
- ARR = MRR x 12.
- Assinaturas ativas seguem a mesma regra efetiva usada na Visao Geral e em Profissionais.
- Inadimplencia considera cobrancas vencidas com status `failed` ou `pending`.
- Receita por canal mostra apenas `Renovacoes` e `Assinaturas do mes`; ajustes manuais nao entram no grafico.
- Na tabela de assinaturas, `trialing`, `past_due`, `incomplete` e `pending` aparecem como `Pendente`; nao ha status visual de teste.
- KPIs financeiros mantêm cards com altura alinhada.
- Layout desktop usa duas colunas independentes: coluna principal para evolucao/tabela e coluna lateral para distribuicoes/renovacoes.
- Stripe possui arquitetura por Edge Functions, webhook e catalogo oficial validado em modo teste. A tela consome o estado local reconciliado.

## Estados

- Dados carregados do Supabase server-side.
- Graficos possuem estado vazio quando nao ha serie ou distribuicao.
- Tabelas mostram estado vazio para ausencia de assinaturas ou renovacoes criticas.
- Sequências de KPIs mantêm cards com altura alinhada.
- Desktop usa colunas independentes; painéis laterais nao herdam a altura dos painéis principais.
- Títulos com ícone de informação têm tooltip funcional com explicação de uso/cálculo da seção.

## Pendencias

- Definir fluxo real de `Criar plano`.
- Expandir exportacao se for necessario um relatorio financeiro auditavel alem do CSV visivel.
- Expandir E2E visual autenticado do Admin Financeiro para cobrir todos os status financeiros reais.
