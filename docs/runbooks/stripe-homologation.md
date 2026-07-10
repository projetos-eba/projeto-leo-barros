# Runbook - Homologacao Stripe

Data de referencia: 09 de julho de 2026.

## Local

1. Definir `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Definir `STRIPE_SECRET_KEY`.
3. Definir `STRIPE_WEBHOOK_SECRET`.
4. Definir `BILLING_ALLOWED_ORIGINS`.
5. Reiniciar Next.js e Supabase Functions.
6. Executar `npm run lint`.
7. Executar `npm run test`.
8. Executar `npm run build`.
9. Executar `npx supabase test db`.
10. Conferir advisors de seguranca/performance do Supabase local ou projeto de teste.

## Sandbox/Test

1. Servir/publicar Edge Functions.
2. Chamar `stripe-bootstrap-catalog` como Admin autenticado.
3. Confirmar Products no Stripe.
4. Confirmar Prices.
5. Confirmar lookup keys.
6. Confirmar moeda `brl`.
7. Confirmar R$ 119,90 mensal.
8. Confirmar R$ 1.198,80 anual.
9. Confirmar R$ 1,99 mensal por unidade.
10. Configurar webhook para `stripe-webhook`.
11. Selecionar eventos de subscription, invoice e payment failure.
12. Testar assinatura mensal.
13. Testar assinatura anual com mixed intervals.
14. Testar trial de 7 dias.
15. Testar Promotion Code valido.
16. Testar Promotion Code invalido.
17. Testar cartao aprovado.
18. Testar cartao recusado.
19. Testar autenticacao adicional.
20. Reenviar webhook duplicado.
21. Simular evento fora de ordem.
22. Simular pagamento falho.
23. Testar cancelamento.
24. Abrir Customer Portal.
25. Mudar Clientes ativos.
26. Executar `billing-sync-active-clients`.
27. Confirmar ausencia de proration.
28. Confirmar snapshot em `billing_active_client_snapshots`.
29. Validar `/admin/financeiro`.
30. Confirmar que RPC de trial nao e executavel por `anon` ou `authenticated`.

## Producao

1. Repetir bootstrap com chaves de producao.
2. Conferir allowlist de origem.
3. Conferir webhook assinado.
4. Conferir que nenhuma secret esta no browser.
5. Fazer compra controlada com Parceiro interno.
6. Conferir logs estruturados sem payload sensivel.

## Observacao

Nao afirmar homologacao Stripe real enquanto `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` estiverem ausentes.
