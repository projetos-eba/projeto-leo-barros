# Integração local entre Next.js e Supabase

## 1. Estado atual

O produto ainda roda principalmente em Vite, React 18 e React Router. O
Next.js 16 existe em paralelo como fundação técnica no App Router, isolada em
arquivos `*.next.tsx`.

O Supabase local limpo contém a nova identidade canônica:

- `profiles`;
- `admins`;
- `patients`;
- `partners`;
- `partner_clients`;
- `provisioning_operations`.

As Edge Functions locais disponíveis para a integração futura são:

- `provision-partner`;
- `provision-client-for-partner`.

Após a Fase D, o front-end Next possui client Supabase separado do legado Vite,
sessão baseada em cookies, Proxy de renovação, rota `/login` e guards mínimos
nos shells técnicos.

## 2. Limites desta preparação

Esta preparação não:

- conecta projeto remoto;
- usa o project ref antigo como destino remoto;
- altera o login Vite;
- conecta UI de painel aos dados reais;
- expõe publishable key, service role, JWT ou senha;
- conecta UI às Edge Functions.

O `project_id` atual do `supabase/config.toml` é uma identificação herdada do
stack local. Ele não deve ser usado para vincular ou selecionar projeto remoto.
A troca desse identificador local exige atualização coordenada dos scripts de
teste que usam o nome dos containers e deve ocorrer em uma etapa própria.

## 3. Variáveis locais

Criar um `.env.local` ignorado pelo Git e preencher localmente:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

No ambiente local:

- `NEXT_PUBLIC_SUPABASE_URL` recebe a URL local da API;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` recebe a chave pública local destinada
  ao client;
- nenhuma variável `SUPABASE_SERVICE_ROLE_KEY` deve ser exposta ao Next.js
  client-side;
- valores devem ser obtidos diretamente da CLI local, sem copiá-los para
  documentação, logs, commits ou respostas.

As Edge Functions usam, no ambiente server-side local:

```dotenv
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PROVISIONING_ALLOWED_ORIGINS=
```

Essas variáveis não devem ser prefixadas com `NEXT_PUBLIC_`, exceto a URL e a
publishable key destinadas explicitamente ao browser.

## 4. Estrutura recomendada para o client Next

A Fase D criou:

```txt
src/lib/supabase/
  database.types.ts
  client.ts
  server.ts
  proxy.ts
```

Responsabilidades:

- `database.types.ts`: tipos gerados exclusivamente da base limpa local;
- `client.ts`: client para Client Components;
- `server.ts`: client cookie-aware para Server Components;
- `proxy.ts`: renovação segura da sessão e sincronização dos cookies.

O arquivo legado `src/integrations/supabase/client.ts` deve permanecer
inalterado enquanto o Vite ainda depender dele.

Os tipos atuais em `src/integrations/supabase/types.ts` descrevem o banco
legado e não contêm `profiles`, `admins`, `partners`, `partner_clients`,
`provisioning_operations` ou as RPCs novas. Eles não devem tipar a integração
Next com a base limpa.

Para SSR, a abordagem oficial do Supabase usa `@supabase/ssr`. Essa dependência
foi aprovada e instalada na Fase D.

## 5. Estratégia de sessão e autenticação

O fluxo recomendado para o login único futuro é:

1. autenticar e-mail e senha com Supabase Auth;
2. validar a identidade autenticada no servidor;
3. consultar o próprio registro em `profiles` por `user_id`;
4. usar somente `profiles.role` e `profiles.status` para autorização;
5. rejeitar role desconhecida ou conta diferente de `active`;
6. redirecionar apenas depois da validação canônica.

Não usar:

- `user_metadata.role`;
- fallback automático para Admin;
- consulta pública de CPF para descobrir e-mail;
- `getSession()` como prova de identidade no servidor;
- service role no browser.

O contrato puro existente em `src/lib/auth/identity-contracts.ts` deve ser
reutilizado para resolver o destino após o carregamento do profile.

## 6. Role e redirecionamento

| Role canônica | Status exigido | Destino |
|---|---|---|
| `admin` | `active` | `/admin/dashboard` |
| `parceiro` | `active` | `/parceiros/dashboard` |
| `cliente` | `active` | `/cliente/inicio` |

Uma conta `pending`, `suspended` ou `disabled` não recebe destino autenticado.
A experiência de conta inativa ainda precisa de decisão: mensagem no login com
encerramento da sessão ou página própria de acesso indisponível.

Os shells Next existentes ainda são placeholders, mas agora possuem proteção
mínima baseada em sessão, `profiles.role` e `profiles.status`.

## 7. Chamada das Edge Functions locais

Depois do login, o browser poderá chamar as funções pelo client Supabase
autenticado:

```ts
const { data, error } = await supabase.functions.invoke("provision-partner", {
  body: payload,
});
```

ou:

```ts
const { data, error } = await supabase.functions.invoke(
  "provision-client-for-partner",
  { body: payload },
);
```

O SDK envia o JWT da sessão. A Edge Function continua responsável por:

- validar o JWT;
- carregar `profiles`;
- conferir role, status e extensão;
- executar a RPC com service role no ambiente seguro;
- aplicar idempotência;
- retornar resposta sem link de convite, token ou segredo.

O front-end deve gerar e preservar uma `idempotencyKey` por tentativa lógica.
Retries da mesma ação reutilizam a mesma chave; uma nova ação usa outra chave.

Para desenvolvimento, `PROVISIONING_ALLOWED_ORIGINS` deve incluir somente as
origens locais realmente usadas, como o Next na porta `3000`. CORS não substitui
JWT, RLS ou autorização canônica.

## 8. Status da Fase D: `/login`

Implementado:

1. instalação de `@supabase/ssr`;
2. Supabase local usado sem vínculo remoto;
3. tipos da base limpa gerados em `src/lib/supabase/database.types.ts`;
4. clients browser e server cookie-aware;
5. Proxy do Next 16 para renovação da sessão;
6. `/login` reutilizando `LoginView`;
7. autenticação apenas por e-mail e senha;
8. consulta de `profiles.role` e `profiles.status`;
9. reutilização de `resolvePostLoginDestination`;
10. proteção mínima dos shells `/admin`, `/parceiros` e `/cliente`;
11. testes de contrato de login, guard e formulário;
12. login e rotas Vite preservados.

## 9. Riscos conhecidos

- O login Vite ainda consulta o schema legado e usa `user_metadata.role`.
- Os tipos Supabase atuais são incompatíveis com a base limpa.
- O identificador local do `config.toml` ainda tem o valor herdado usado pelos
  scripts de teste; isso não equivale a vínculo remoto.
- O fluxo para conta inativa e a rota de conclusão de convite permanecem
  decisões pendentes.
- O login Next depende de variáveis locais em `.env.local`; valores reais não
  devem ser versionados nem documentados.

## 10. Validação local Admin → Parceiro

A Fase E criou um script local/dev para validar o primeiro fluxo real:

```bash
npm run dev:validate-admin-partner-flow
```

O script:

1. usa somente o Supabase local;
2. lê as chaves locais a partir do container local em memória;
3. não imprime senha, JWT, service role ou link de convite;
4. cria/atualiza um Super Admin fictício;
5. valida login Auth do Admin;
6. chama `provision-partner` com contexto autorizado;
7. valida idempotência da function;
8. valida `profiles.role = 'parceiro'`, `profiles.status = 'active'` e extensão `partners`;
9. confirma convite `pending_delivery`;
10. define senha efêmera local/dev para o Parceiro fictício somente para teste;
11. testa login real no Next com navegador headless;
12. valida guards entre Admin e Parceiro.

Dados fictícios usados:

```txt
ADMIN_LOCAL_EMAIL=admin.local@example.com
PARTNER_LOCAL_EMAIL=partner.local@example.com
```

As senhas são geradas em memória a cada execução. Esse mecanismo é exclusivo
de desenvolvimento local e não representa fluxo de produção.

## 11. Referências técnicas

- Supabase: criação de clients SSR para Next.js:
  <https://supabase.com/docs/guides/auth/server-side/nextjs>
- Next.js: autenticação no App Router:
  <https://nextjs.org/docs/app/guides/authentication>
- Supabase CLI local:
  <https://supabase.com/docs/guides/local-development/cli/getting-started>
