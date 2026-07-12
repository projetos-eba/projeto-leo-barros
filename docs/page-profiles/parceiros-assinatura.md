# Page Profile - Parceiros Assinatura

Rota: `/parceiros/configuracoes/assinatura`

## Objetivo

Exibir plano, status da assinatura em pt-BR, periodo de teste, renovacao, Clientes ativos, estimativa e cobrancas do Parceiro.

## Layout

- Usa layout independente de billing, sem menu operacional global de Parceiros.
- Deve continuar protegida por usuario autenticado, `profiles.role = parceiro` e `profiles.status = active`.
- Pode ser acessada sem assinatura ativa para orientar contratacao, acompanhar processamento ou tentar novamente.

## Dados

- `partner_subscriptions`
- `billing_plans`
- `billing_payments`
- `billing_active_client_count`

## Estados

- Sem assinatura.
- Trial/ativa.
- Pagamento pendente ou falho.
- Cancelada.
- Stripe nao configurado.

## Portal

Portal de pagamentos fica preparado via Edge Function, mas depende de credenciais e configuracao Stripe para uso real.

## Apresentacao

- Status tecnicos do Stripe e do banco permanecem em ingles na persistencia.
- A UI usa mapper unico em `src/lib/billing/presentation.ts` para status de assinatura, pagamentos, datas e periodo de teste.
- Status desconhecido deve aparecer como `Status indisponivel` e registrar somente observabilidade segura server-side.
- Assinatura sem trial mostra `Sem periodo de teste`.
- Assinatura `trialing` sem datas mostra `Nao foi possivel carregar o periodo de teste.` e registra inconsistencia estruturada.
