# Billing Stripe - Smoke Local

Data: 09 de julho de 2026.

## Ambiente

- Next build servido com `npx next start -p 3010`.
- Supabase local reconstruido com `npx supabase db reset`.
- Credenciais Stripe reais ausentes.

## Playwright

Validado:

- `/planos` desktop renderiza Plano Mensal, Plano Anual, R$ 119,90 e R$ 99,90/mes.
- `/planos` mobile renderiza CTA `Comecar teste gratis`.

Screenshots:

- `screenshots/desktop-planos.png`
- `screenshots/mobile-planos.png`

## Limitacoes

- Checkout real, Payment Element conectado, Customer Portal, webhooks assinados e cobrancas reais nao foram homologados porque `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` nao estao configurados.
- Rotas autenticadas de billing foram cobertas por build, testes unitarios e SQL; smoke visual autenticado completo fica para a etapa com Playwright autenticado e credenciais/ambiente de billing.
