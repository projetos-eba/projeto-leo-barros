# Page Profile - Admin / Parceiros & Profissionais

## Rota

- `/admin/profissionais`

## Objetivo

Permitir que o Super Admin acompanhe e gerencie a rede SaaS de Parceiros/Profissionais da plataforma com dados reais do Supabase local.

## Fonte visual

- Figma: `Page / Parceiros & Profissionais`
- Node: `216:5`
- Link: `https://www.figma.com/design/vyskvKR1gCzdckeXHR2Ewj/Projeto-Leo-Barros-Atualizado?node-id=216-5&m=dev`

## Fontes de dados

- `profiles`
- `partners`
- `partner_subscriptions`
- `billing_plans`
- `billing_payments`
- `partner_clients`
- `patients`

## Camadas

- Rota server-side: `src/app/admin/profissionais/page.tsx`
- Leitura de dados: `src/lib/admin/professionals-data.ts`
- Métricas puras: `src/lib/admin/professionals-metrics.ts`
- View: `src/app/admin/profissionais/admin-professionals-view.tsx`
- Gráficos: `src/app/admin/profissionais/admin-professionals-charts.tsx`
- Cadastro visual/funcional: `src/app/admin/profissionais/create-partner-dialog.tsx`

## Métricas

- Profissionais ativos: profissionais com status efetivo `Ativo`, derivado de assinatura atual `active` ou `trialing`.
- Assinaturas ativas: assinaturas atuais com `partner_subscriptions.status in ('active', 'trialing')`.
- Receita média por profissional: MRR das assinaturas ativas dividido pelos profissionais com status efetivo `Ativo`; a UI mostra a base como `MRR ativo / parceiros ativos`.
- Novos profissionais no mês: profiles de parceiros criados no mês atual.
- Profissionais suspensos: profissionais com status efetivo `Suspenso`, derivado de assinatura atual `past_due`/`incomplete` ou status cadastral suspenso.
- Churn de profissionais: assinaturas canceladas no mês sobre assinaturas abertas no início do mês.
- NPS dos profissionais: placeholder explícito até existir tabela de pesquisa/feedback.

### Status efetivo SaaS

A tabela usa um status operacional para evitar divergência entre cadastro e assinatura:

- `Ativo`: assinatura atual `active` ou `trialing`;
- `Suspenso`: assinatura atual `past_due`/`incomplete` ou cadastro suspenso;
- `Inativo`: sem assinatura atual ativa, assinatura cancelada/expirada ou cadastro desabilitado.

O status cadastral original do profile continua disponível no modal `Ver perfil`, mas não é o estado principal da tela.

## Estados

- Lista preenchida com seed local idempotente.
- Estado vazio para tabela e gráficos.
- Formulário de novo parceiro com validação local e chamada autenticada a `provision-partner`.
- Abas `Todos`, `Ativos`, `Suspensos` e `Inativos` filtram a tabela client-side sobre dados carregados server-side.
- Busca por nome/e-mail, filtros de tipo profissional, plano e status, paginação e seletor de quantidade por página.
- `Exportar` baixa CSV do recorte filtrado.
- `Ver perfil` abre modal com dados operacionais do profissional.
- Menu `Ações` permite abrir perfil, copiar e-mail, filtrar por plano e filtrar por status.
- Status principais na UI: `Ativo`, `Suspenso`, `Inativo`.
- Não há aprovação manual de documentos no MVP.
- Sequências de KPIs e métricas do mesmo grupo mantêm cards com altura alinhada.
- Painéis analíticos de naturezas diferentes alinham pelo topo; um painel não deve herdar a altura do painel mais alto ao lado.
- Títulos de seções analíticas usam tooltip funcional para explicar a função ou cálculo exibido.

## Seed local

Rodar:

```bash
npm run dev:seed-admin-profissionais-smoke
```

O script reaproveita `scripts/dev/seed-admin-dashboard-smoke.mjs` e cria dados fictícios locais `.example.invalid`.

O seed mantém coerência entre status efetivo e assinatura: profissionais ativos possuem assinatura atual ativa ou em teste; profissionais suspensos possuem cobrança pendente/incompleta; profissionais inativos possuem assinatura cancelada/expirada ou cadastro desabilitado.

## Pendências

- Substituir o placeholder de NPS quando houver domínio de feedback/pesquisa.
- Substituir `Último acesso` quando houver fonte pública e segura de acesso por perfil.
- Conectar mutações reais de assinatura/status quando o domínio financeiro completo estiver implementado.
