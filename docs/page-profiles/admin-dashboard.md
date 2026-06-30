# Page Profile — Admin Dashboard

Rota: `/admin/dashboard`
Perfil: Super Admin (`profiles.role = 'admin'`, `profiles.status = 'active'`)
Fonte visual: Figma `Page / Super Admin - Visao Geral`, node `197:5`

## Objetivo da tela

Exibir uma visão executiva funcional da plataforma com dados lidos do Supabase local. Esta página não usa mais mocks fixos no componente e não chama Stripe, Resend, Supabase remoto ou Edge Functions.

## Métricas atuais

- Parceiros ativos: parceiros com `profiles.status = 'active'` e assinatura em `partner_subscriptions.status in ('active', 'trialing')` dentro do período atual.
- Clientes ativos: clientes distintos em `partner_clients.status = 'active'` vinculados a parceiros ativos.
- Receita recorrente mensal (MRR): soma mensalizada de `billing_plans.price_cents` nas assinaturas ativas. Plano anual é dividido por 12.
- Tickets abertos: tickets de parceiros ativos com `support_tickets.status in ('open', 'in_progress')`.
- Taxa de renovação: pagamentos de renovação bem-sucedidos sobre pagamentos de renovação elegíveis no mês.
- Pagamentos processados: soma de `billing_payments.amount_cents` com `status = 'succeeded'` e `paid_at` no mês.
- Tickets dentro do SLA: tickets resolvidos no mês com `resolved_at <= sla_due_at`.
- Documentos pendentes: documentos com `status in ('pending', 'in_review', 'expired')`.
- Profissionais por status: divisão dos registros em `partners` entre Ativos, Suspensos e Inativos. Ativos têm assinatura atual `active` ou `trialing`; Suspensos têm `profiles.status = 'suspended'` ou assinatura atual `past_due`/`incomplete`; demais entram como Inativos.
- Indicadores do mês: `Novos clientes (mês)`, `Churn de assinaturas` e `Pagamentos falhos` aparecem no espaço antes ocupado pela revisão de profissionais. `Novos clientes (mês)` conta `patient_id` distinto em vínculos `partner_clients.status = 'active'`, com `started_at` no mês atual e `partner_id` pertencente a profissionais efetivamente ativos.

## Tabelas usadas

- `profiles`
- `partners`
- `patients`
- `partner_clients`
- `billing_plans`
- `partner_subscriptions`
- `billing_payments`
- `support_tickets`
- `partner_documents`
- `platform_activity_events`

## Stripe

Stripe será o gateway oficial futuro. Nesta fase, apenas campos opcionais foram preparados no banco:

- `billing_plans.stripe_product_id`
- `billing_plans.stripe_price_id`
- `partner_subscriptions.stripe_customer_id`
- `partner_subscriptions.stripe_subscription_id`
- `billing_payments.stripe_payment_intent_id`

Nenhuma chave, webhook, checkout ou chamada de API Stripe deve ser configurada nesta página.

## Estados esperados

- Com dados locais: cards, gráficos, alertas, status de profissionais e movimentações aparecem preenchidos.
- Sem dados: gráficos e listas mostram estado vazio sem quebrar renderização.
- Sem sessão: guard redireciona para `/login`.
- Perfil não Admin: guard redireciona para a área correta ou bloqueia acesso.
- Sequências de KPIs e indicadores do mês mantêm cards com altura alinhada.
- Desktop usa colunas independentes; painéis laterais não herdam a altura dos gráficos da coluna principal.
- Títulos com ícone de informação têm tooltip funcional com explicação de uso/cálculo da seção.

## Checklist de manutenção

Antes de alterar esta página:

1. Ler `AGENTS.md`.
2. Ler este Page Profile.
3. Ler `src/lib/admin/dashboard-metrics.ts`.
4. Ler `src/lib/admin/dashboard-data.ts`.
5. Validar que não há service role no browser.
6. Validar que `Clientes` continua sendo o termo visual, mesmo que o schema técnico ainda use `patients`.
7. Rodar testes e build.

## Smoke local

Fluxo recomendado:

1. `npx supabase start`
2. `npx supabase db reset`
3. `npm run dev:seed-admin-dashboard-smoke`
4. `npm run dev`
5. Login local como Super Admin.
6. Abrir `/admin/dashboard` e verificar os dados populados.

O seed usa dados fictícios `.example.invalid` e não toca Supabase remoto.
