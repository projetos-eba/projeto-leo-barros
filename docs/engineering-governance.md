# Engineering Governance

Data de referencia: 10 de agosto de 2026.

Este documento define o fluxo operacional de PR, release, CI e evolucao de TypeScript para o Projeto Leo Barros. Ele complementa `AGENTS.md`, `docs/database-migrations.md` e `docs/deployment-database-checklist.md`.

## Diagnostico inicial

- Havia um workflow unico em `.github/workflows/schema-integrity.yml` que misturava integridade de banco, lint, testes e build.
- Nao havia template oficial de Pull Request.
- Nao havia script `typecheck` independente no `package.json`.
- `tsconfig.json` estava com `strict: false` e `strictNullChecks: true`; a intervencao ativou `strict: true` apos corrigir o typecheck base.
- O historico recente indicava fluxo real `dev`/`dev-vini` -> `homolog` -> `main`, com alguns merges diretos de `dev` para `main`.
- Branches remotas observadas em 10 de agosto de 2026: `origin/main`, `origin/homolog`, `origin/dev` e `origin/dev-vini`.

## PR Governance

Todo PR deve ter descricao suficiente para revisao segura. O template oficial fica em `.github/PULL_REQUEST_TEMPLATE.md`.

Campos obrigatorios na pratica:

- resumo objetivo;
- tipo de mudanca e classificacao de risco;
- branch destino;
- areas sensiveis impactadas;
- comandos executados;
- evidencias de validacao;
- plano de rollout/roll-forward quando houver banco, auth, RLS, billing, RPC, calculos clinicos ou rota.

Areas sensiveis exigem revisao mais cuidadosa:

- migrations Supabase;
- RLS, policies e grants;
- auth e permissoes;
- billing/Stripe;
- calculos clinicos;
- contratos Supabase/RPC;
- dependencias;
- rotas.

Titulo de PR e commits devem seguir Conventional Commits simples:

```text
feat: adiciona fluxo de cadastro
fix: corrige policy de clientes do parceiro
docs: formaliza release
ci: separa checks de aplicacao
test: cobre contrato de RPC
chore: atualiza configuracao sem runtime
```

Evite titulos genericos como `Homolog`, `Ajustes`, `Correcoes` ou `Versao nova` sem escopo.

### Politica para `main`

- `main` representa codigo de producao.
- PRs para `main` devem vir de `homolog`.
- Hotfix para `main` e permitido apenas quando a correcao precisa sair antes do ciclo normal; depois do merge, o commit deve ser propagado para `homolog` e `dev`.
- PR para `main` com migration deve documentar ordem de aplicacao, compatibilidade entre versoes e plano de roll-forward.

### CODEOWNERS

Nao foi criado `CODEOWNERS` porque o repositorio analisado nao identifica uma matriz real de responsaveis por area. Quando houver nomes ou times estaveis para auth, billing, banco e frontend, criar CODEOWNERS passa a fazer sentido.

## Release Process

Fluxo oficial recomendado: Opcao B, fluxo explicito com homologacao.

```text
feature/* ou fix/*
        ↓
       dev
        ↓
     homolog
        ↓
      main
```

Papeis das branches:

- `main`: producao.
- `homolog`: candidato de homologacao, proximo release.
- `dev`: integracao de desenvolvimento.
- `dev-vini`: branch pessoal/auxiliar existente; nao deve ser tratada como etapa oficial permanente.
- `feature/*`: novas capacidades.
- `fix/*`: correcoes planejadas.
- `hotfix/*`: correcao urgente a partir de `main`.

Como uma feature nasce:

1. Criar `feature/<escopo>` a partir de `dev`.
2. Abrir PR para `dev`.
3. Passar Application Quality e, se houver banco, Database Integrity.

Como chega a homologacao:

1. Agrupar mudancas aprovadas em `dev`.
2. Abrir PR `dev` -> `homolog`.
3. Rodar checks obrigatorios.
4. Aplicar migrations no ambiente de homologacao antes do codigo que depende delas, quando aplicavel.
5. Registrar evidencias de smoke em `docs/test-reports/<escopo>-YYYY-MM-DD/` quando houver validacao manual relevante.

Como chega a producao:

1. Abrir PR `homolog` -> `main`.
2. Confirmar checklist de release.
3. Confirmar migrations remotas pendentes e plano forward-only.
4. Aplicar migrations antes do codigo dependente, ou garantir compatibilidade entre versoes.
5. Publicar aplicacao somente depois dos checks obrigatorios.
6. Registrar release com SHA, PRs incluídos, migrations aplicadas e evidencias.

Hotfix:

1. Criar `hotfix/<escopo>` a partir de `main`.
2. Abrir PR para `main` com risco, validacao e plano de aplicacao.
3. Depois do merge, propagar para `homolog` e `dev`.
4. Se houver banco, preferir roll-forward corretivo.

## Migrations e rollback

- Toda alteracao de schema deve ser migration nova, forward-only.
- Nunca editar migration que ja possa ter sido aplicada.
- Codigo que depende de coluna/tabela/policy nova so deve ser publicado depois da migration aplicada, salvo se for compativel com os dois schemas durante a transicao.
- Rollback de codigo pode ser usado quando o schema permanece compativel.
- Rollback de banco destrutivo em producao exige autorizacao explicita, backup validado e plano separado.
- Para migrations ja aplicadas, prefira roll-forward corretivo.

## Checklist de release

Antes de producao:

- [ ] PR `homolog` -> `main` preenchido.
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run db:migration-integrity`
- [ ] `npm run db:reset`
- [ ] `npm run db:lint`
- [ ] `npm run test:db`
- [ ] Tipos Supabase gerados sem diff, quando houver banco.
- [ ] Migrations remotas comparadas quando o ambiente estiver linkado.
- [ ] Smoke/E2E essencial executado quando houver fluxo critico afetado.
- [ ] Evidencias registradas quando houver validacao manual.

## CI obrigatorio

Application Quality:

- install com `npm ci`;
- `npm run typecheck`;
- `npm run lint`;
- `npm run test`;
- `npm run build`.

Database Integrity:

- iniciar Supabase local;
- `npm run ci:schema`;
- gerar tipos Supabase locais;
- comparar `src/lib/supabase/database.types.ts` com os tipos gerados.

Branch protection recomendada para `main`:

- exigir PR;
- exigir branch atualizada antes de merge;
- exigir pelo menos uma revisao aprovada;
- bloquear force push;
- exigir status checks `Application Quality` e `Database Integrity`;
- exigir resolucao de conversas;
- exigir CODEOWNERS somente depois de existir matriz real de owners.

Branch protection recomendada para `homolog`:

- exigir PR;
- exigir `Application Quality`;
- exigir `Database Integrity` quando houver migrations, Supabase/RPC, RLS, auth ou billing.

## TypeScript strict

Estado inicial medido:

- `strict: false`;
- `strictNullChecks: true`;
- sem script `typecheck`;
- typecheck base falhava por setup de testes e fixtures defasados;
- strict temporario adicionava pelo menos implicit `any` em componente compartilhado de chart.

Estado final desta intervencao:

- `strict: true` ativo no `tsconfig.json` oficial;
- `npm run typecheck` como gate obrigatorio;
- `npm run typecheck:strict` mantido como alias explicito via `tsconfig.strict.json`;
- setup global de testes tipado para matchers do `@testing-library/jest-dom`;
- fixtures de testes atualizadas para contratos reais de financeiro, dashboard e execucao de treinos;
- mock de router de auth completo para a interface esperada.

Politica de manutencao:

1. Manter `npm run typecheck` verde antes de merge.
2. Corrigir primeiro dominios criticos: auth/autorizacao, Supabase/RPC, billing/Stripe, avaliacoes/calculos, prescricoes, formularios e relacao Parceiro/Cliente.
3. Evitar `as any`, `@ts-ignore` e `!` como solucao de massa.
4. Quando um tipo externo exigir cast, documentar o motivo no PR e preferir `unknown` + narrowing.

Categorias a acompanhar:

- implicit `any`;
- fixtures de testes defasadas em relacao aos contratos;
- mocks incompletos de APIs externas;
- tipos de Supabase/RPC;
- propriedades opcionais e `null`/`undefined`;
- formularios e callbacks React;
- casts excessivos.
