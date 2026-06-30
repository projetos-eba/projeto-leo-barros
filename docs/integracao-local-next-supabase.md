# Integracao local entre Next.js e Supabase

Data de referencia: 29 de junho de 2026.

## Estado atual

O produto roda oficialmente em Next.js App Router. O ambiente local esperado usa:

- app web em `localhost:3000`;
- Supabase local;
- autenticacao com `@supabase/ssr`;
- sessao baseada em cookies;
- autorizacao por `profiles.role` e `profiles.status`;
- Edge Functions locais para provisionamento.

Rotas Next ja implementadas:

- `/login`;
- `/admin/dashboard`;
- `/admin/profissionais`;
- `/parceiros/dashboard`;
- `/cliente/inicio`.

## Limites atuais

Ainda estao fora do escopo:

- Supabase remoto;
- deploy;
- envio real de e-mail;
- Resend;
- billing real;
- webhooks de pagamento;
- migracao da rota publica legada `/form/:token`.

## Variaveis locais

O arquivo `.env.local` fica fora do Git.

Variaveis usadas pelo Next:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Regras:

- usar somente a URL e a chave publica local destinadas ao browser;
- nunca expor `SUPABASE_SERVICE_ROLE_KEY` no client;
- nao registrar chaves, JWTs, senhas ou links em documentacao, logs ou commits.

Variaveis server-side usadas pelas Edge Functions:

```dotenv
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PROVISIONING_ALLOWED_ORIGINS=
```

`PROVISIONING_ALLOWED_ORIGINS` deve incluir somente origens locais realmente usadas, como `http://localhost:3000`.

## Estrutura Supabase no Next

Arquivos principais:

```txt
src/lib/supabase/
  database.types.ts
  client.ts
  server.ts
  proxy.ts
```

Responsabilidades:

- `database.types.ts`: tipos gerados da base local;
- `client.ts`: client para Client Components;
- `server.ts`: client cookie-aware para Server Components;
- `proxy.ts`: renovacao segura de sessao e sincronizacao dos cookies.

## Fluxo de autenticacao

O login deve:

1. autenticar e-mail e senha no Supabase Auth;
2. validar a identidade no servidor;
3. buscar o profile por `user_id`;
4. usar somente `profiles.role` e `profiles.status` para decidir acesso;
5. negar role desconhecido ou conta sem status ativo;
6. redirecionar apenas depois da validacao canonica.

Destinos atuais:

| Role | Status exigido | Destino |
| --- | --- | --- |
| `admin` | `active` | `/admin/dashboard` |
| `parceiro` | `active` | `/parceiros/dashboard` |
| `cliente` | `active` | `/cliente/inicio` |

Nao usar:

- `user_metadata.role` para autorizacao sensivel;
- fallback automatico para Admin;
- service role no browser;
- `getSession()` como prova unica de identidade no servidor.

## Edge Functions locais

Functions atuais:

- `provision-partner`;
- `provision-client-for-partner`.

O browser chama as funcoes com sessao autenticada:

```ts
const { data, error } = await supabase.functions.invoke("provision-partner", {
  body: payload,
});
```

A Edge Function deve:

- validar JWT;
- carregar `profiles`;
- conferir role, status e extensao do chamador;
- usar service role somente depois da autorizacao;
- aplicar idempotencia;
- retornar resposta sem senha, token, link de convite ou segredo.

## Validacao local Admin -> Parceiro

Script de validacao:

```bash
npm run dev:validate-admin-partner-flow
```

O script usa somente Supabase local, cria fixtures de desenvolvimento, valida login Auth, chama `provision-partner`, testa idempotencia e confirma guards entre Admin e Parceiro.

Dados ficticios usados:

```txt
ADMIN_LOCAL_EMAIL=admin.local@example.com
PARTNER_LOCAL_EMAIL=partner.local@example.com
```

Senhas sao geradas em memoria a cada execucao. Esse mecanismo e exclusivo de desenvolvimento local.

## Referencias

- Supabase SSR para Next.js: <https://supabase.com/docs/guides/auth/server-side/nextjs>
- Next.js App Router auth: <https://nextjs.org/docs/app/guides/authentication>
- Supabase CLI local: <https://supabase.com/docs/guides/local-development/cli/getting-started>
