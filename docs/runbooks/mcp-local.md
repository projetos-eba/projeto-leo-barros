# Runbook - MCP Local

Data de referencia: 14 de julho de 2026.

## Objetivo

Padronizar a verificacao dos MCPs locais do projeto e evitar que limitacoes
repetidas de descoberta de ferramentas virem fallback permanente.

## Playwright MCP

O servidor Playwright MCP fica em `.mcp.json`, usa `@playwright/mcp` local e
deve solicitar exposicao completa de ferramentas com:

```json
"tools": ["*"]
```

Antes de smoke visual ou interativo:

```bash
npm run mcp:playwright:check
```

O check valida a versao instalada, a configuracao local e a presenca das
ferramentas criticas documentadas pelo pacote:

- `browser_click`
- `browser_type`
- `browser_fill_form`
- `browser_cookie_set`

Quando o cliente Codex nao listar acoes de clique, preenchimento ou cookies na
primeira descoberta, executar `tool_search` com uma busca especifica antes de
registrar fallback:

```text
Playwright MCP browser_click browser_type browser_fill_form browser_cookie_set click type fill form set cookie
```

No ambiente de 14 de julho de 2026, `browser_click`, `browser_type` e
`browser_fill_form` apareceram depois de uma busca especifica. A ferramenta
`browser_cookie_set` estava documentada no pacote instalado, mas nao foi exposta
pela descoberta do cliente da sessao; nesse caso, usar `browser_run_code_unsafe`
ou `storage-state` somente como fallback registrado.

## Supabase MCP

Com a stack local ativa:

```bash
npm run mcp:supabase:check
```

O endpoint esperado e `http://127.0.0.1:54321/mcp`. Nunca apontar MCP para
producao durante desenvolvimento local.

## Regra De Manutencao

Quando uma limitacao MCP se repetir e houver solucao objetiva, a mesma alteracao
deve atualizar o que for aplicavel:

- dependencia de desenvolvimento ou configuracao MCP;
- script de validacao local;
- runbook/documentacao;
- skill operacional afetada;
- teste de contrato, quando a limitacao puder voltar silenciosamente.
