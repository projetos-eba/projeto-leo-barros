# Page Profile - Parceiros Assinatura

Rota: `/parceiros/configuracoes/assinatura`

## Objetivo

Exibir somente dados essenciais da assinatura do Parceiro: status em pt-BR, plano, ciclo, plano-base, Clientes ativos, adicional atual, periodo de teste, renovacao e acesso ao portal de pagamentos.

## Layout

- Quando o Parceiro possui entitlement `trialing` ou `active`, usa o shell proprio de Configuracoes.
- Quando o Parceiro nao possui entitlement financeiro, permanece acessivel pelo shell independente de billing, sem menu operacional global de Parceiros.
- Deve continuar protegida por usuario autenticado, `profiles.role = parceiro` e `profiles.status = active`.
- Pode ser acessada sem assinatura ativa para orientar contratacao, acompanhar processamento ou tentar novamente.

## Dados

- `partner_subscriptions`
- `partner_subscription_financial_summaries`
- `billing_plans`
- `billing_payments`
- `billing_active_client_count`

Observacao: o historico financeiro detalhado permanece no Portal Stripe. A tela local exibe subtotal, desconto ativo e valor apos desconto quando o read model sincronizado pela Stripe estiver disponivel.

## Estados

- Sem assinatura.
- Trial/ativa.
- Pagamento pendente ou falho.
- Cancelada.
- Stripe nao configurado.

## Portal

Portal de pagamentos fica preparado via Edge Function, mas depende de credenciais e configuracao Stripe para uso real. A UI deve usar texto comercial: `Abrir portal de pagamentos`.

## Apresentacao

- Status tecnicos do Stripe e do banco permanecem em ingles na persistencia.
- A UI usa mapper unico em `src/lib/billing/presentation.ts` para status de assinatura, pagamentos, datas e periodo de teste.
- Status desconhecido deve aparecer como `Status indisponivel` e registrar somente observabilidade segura server-side.
- Assinatura sem trial mostra `Sem periodo de teste`.
- Assinatura `trialing` sem datas mostra `Nao foi possivel carregar o periodo de teste.` e registra inconsistencia estruturada.
- Nao exibir KPI de `Estimativa proximo ciclo` calculado apenas por `billing_plans.price_cents`.
- Nao exibir historico local vazio como se fosse fonte completa de faturas.
- Exibir `Subtotal`, `Desconto ativo` e `Valor apos desconto` usando `partner_subscription_financial_summaries`; quando ainda nao houver dados finais, usar copy de produto como `Em processamento`, sem simular desconto.
- Nao exibir mensagens de desenvolvimento ou detalhes tecnicos como read model, webhook, credenciais, Stripe nao configurado, sincronizacao, backend ou nomes de tabela em texto visivel ao usuario final.
- Exibir `Ir para o painel` quando o status local for `trialing` ou `active`.
