## Resumo

-

## Tipo e risco

- Tipo: <!-- feat | fix | chore | docs | refactor | test | ci -->
- Risco: <!-- baixo | medio | alto -->
- Destino: <!-- dev | homolog | main -->

## Areas sensiveis

Marque o que se aplica:

- [ ] Migration Supabase
- [ ] RLS/policy/grants
- [ ] Auth/permissoes
- [ ] Billing/Stripe
- [ ] Calculos clinicos
- [ ] Contratos Supabase/RPC
- [ ] Dependencias
- [ ] Rotas

## Rollout

- Plano de rollout/roll-forward: <!-- obrigatorio quando houver banco ou mudanca sensivel -->
- Rollback: <!-- explicar quando rollback nao for seguro e preferir roll-forward -->

## Validacao

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run db:migration-integrity` <!-- se aplicavel -->
- [ ] `npm run db:reset` <!-- se aplicavel -->
- [ ] `npm run db:lint` <!-- se aplicavel -->
- [ ] `npm run test:db` <!-- se aplicavel -->

Evidencias:

-

## Checklist de merge

- [ ] Titulo segue Conventional Commits simples (`feat:`, `fix:`, `docs:`, `ci:`, `test:`, `chore:`).
- [ ] PR para `main` veio de `homolog`, exceto hotfix documentado.
- [ ] Nao ha secrets, logs sensiveis ou valores reais de credenciais.
- [ ] Mudancas de banco sao forward-only e possuem plano de aplicacao antes do codigo dependente.
