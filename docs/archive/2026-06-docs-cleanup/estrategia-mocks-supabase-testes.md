# Estratégia de mocks Supabase para testes

Data de referência: 19 de junho de 2026.

Este documento define a estratégia mínima de mocks Supabase durante a migração gradual de Vite para Next.js. Ele não altera o cliente, o banco, as migrations, as policies ou as Edge Functions.

## Princípios

- Nunca conectar testes automatizados ao projeto Supabase real.
- Nunca carregar ou registrar valores de `.env`, credenciais ou secrets.
- Mockar `@/integrations/supabase/client` no teste que consome a integração.
- Modelar respostas explicitamente como `{ data, error }`.
- Limpar mocks entre testes para evitar estado compartilhado.
- Testar sucesso, erro e estado vazio quando uma tela migrada depender desses estados.
- Criar factories compartilhadas somente quando o mesmo contrato aparecer em duas ou mais suítes.

## Auth

Mockar somente os métodos usados pela unidade em teste, por exemplo:

```ts
const signInWithPassword = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword,
    },
  },
}));
```

Cada teste deve definir seu retorno:

```ts
signInWithPassword.mockResolvedValue({
  data: { user: { user_metadata: { role: "patient" } } },
  error: null,
});
```

## Queries encadeadas

Para cadeias como `from().select().eq().single()`, criar apenas os métodos realmente usados:

```ts
const single = vi.fn();
const eq = vi.fn(() => ({ single }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from },
}));
```

Não criar um cliente genérico que aceite qualquer operação silenciosamente. O mock deve falhar quando a unidade passar a usar um método não previsto pelo contrato do teste.

## Storage e Edge Functions

- Mockar `storage.from()` e `functions.invoke()` somente nas suítes que realmente usam essas APIs.
- Nunca usar `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY` ou qualquer secret em testes client-side.
- Edge Functions devem ter testes próprios quando entrarem no escopo; não são cobertas pelos smoke tests de Vite ou Next.

## Aplicação durante a migração

- Smoke tests de bootstrap e shell não devem importar o cliente Supabase real.
- Ao migrar uma página, mockar a integração no nível da página ou hook.
- Preservar os nomes atuais de tabelas e campos nos mocks enquanto o código real ainda usa `patient` e `patients`.
- Não usar mocks para inventar regras de permissão ainda não documentadas.

## Formulários atribuídos ao Cliente

- `/form/:token` permanece somente como implementação Vite legada/provisória e não deve orientar um contrato de rota pública no Next.
- Testes do fluxo futuro devem representar um Cliente autenticado e uma atribuição vinculada ao próprio usuário/paciente.
- Os mocks deverão cobrir `form_assignments`, ownership e respostas de autorização sem acessar banco, rede ou ambiente real.
- Não presumir a rota autenticada, a policy RLS ou o contrato de sessão antes da fase específica de redesenho.
- A implementação real exigirá validação conjunta de auth, Supabase, ownership e RLS.
