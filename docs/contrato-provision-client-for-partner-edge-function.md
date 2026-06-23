# Contrato da Edge Function `provision-client-for-partner`

Data de referência: 23 de junho de 2026.

Status: implementação e validação exclusivamente locais da Fase B.

## 1. Objetivo

`provision-client-for-partner` permite que um Parceiro autenticado e ativo crie ou reconcilie um Cliente ativo, seu registro técnico em `patients` e um ou mais vínculos em `partner_clients`.

Next.js e o futuro aplicativo móvel serão consumidores desse mesmo contrato.

## 2. Endpoint e autorização

| Item | Contrato |
| --- | --- |
| Endpoint | `POST /functions/v1/provision-client-for-partner` |
| Preflight | `OPTIONS` |
| JWT | obrigatório |
| Chamador | profile `parceiro` com status `active` e extensão `partners` |
| Content-Type | `application/json` |

JWT válido não basta. A função consulta `profiles` e `partners`. `user_metadata.role` não participa da autorização.

## 3. Payload

```json
{
  "email": "cliente@example.com",
  "phone": "+5511999999999",
  "displayName": "Nome do Cliente",
  "serviceScopes": ["dieta", "treino"],
  "cpf": "12345678901",
  "birthDate": "1992-06-15",
  "idempotencyKey": "uuid"
}
```

Obrigatórios:

- `email`;
- `phone`, em E.164;
- `displayName`;
- `serviceScopes`, array não vazio e sem duplicatas.

Opcionais:

- `cpf`, com onze dígitos;
- `birthDate`, em `YYYY-MM-DD`, válida e não futura;
- `idempotencyKey`, gerada pela função quando ausente.

Escopos permitidos:

- `dieta`;
- `treino`;
- `saude`;
- `cardio`.

Campos desconhecidos são rejeitados, inclusive `password`, `role` e `status`.

## 4. Persistência

O telefone canônico fica em `profiles.phone`.

A RPC transacional grava:

1. `profiles`, com `role = 'cliente'` e `status = 'active'`;
2. `patients`, sem `patients.user_id`;
3. uma linha em `partner_clients` para cada escopo;
4. `provisioning_operations`.

`patients.phone` não é duplicado pelo novo fluxo.

## 5. Transação e conflitos

`provision_client_for_partner_records` executa a parte relacional em uma única transação.

Qualquer conflito provoca rollback integral:

- e-mail com outro role;
- CPF associado a outro Cliente;
- dados divergentes do Cliente existente;
- escopo ativo associado a outro Parceiro;
- vínculo aberto incompatível;
- mesma idempotency key com outro payload.

O banco continua sendo a barreira final contra dois Parceiros ativos no mesmo escopo do mesmo Cliente.

## 6. Idempotência

O ledger usa:

- `operation_type = 'provision_client_for_partner'`;
- profile do Parceiro chamador;
- `idempotencyKey`;
- SHA-256 do payload normalizado.

Comportamento:

- mesma chave e payload: retorna `existing`;
- mesma chave e payload diferente: `409 IDEMPOTENCY_KEY_REUSED`;
- Cliente completo e vínculos compatíveis: `existing`;
- Cliente compatível com escopos faltantes do mesmo Parceiro: `reconciled`;
- nenhum recurso é duplicado.

## 7. Auth, senha e convite

A função usa `generateLink({ type: 'invite' })` para criar a identidade Auth e gerar o fluxo de definição de senha.

Regras:

- Parceiro não informa nem conhece a senha;
- link e token não são retornados;
- link e token não são registrados;
- nenhum e-mail é enviado nesta fase;
- estado inicial do convite: `pending_delivery`;
- falha relacional compensa o Auth user criado na tentativa, quando seguro;
- Auth user preexistente nunca é removido durante reconciliação.

## 8. Resposta

Criação com entrega pendente: HTTP `202`.

```json
{
  "requestId": "uuid",
  "status": "created",
  "client": {
    "profileId": "uuid",
    "patientId": "uuid",
    "accountStatus": "active"
  },
  "relationships": {
    "ids": ["uuid", "uuid"],
    "serviceScopes": ["dieta", "treino"]
  },
  "invite": {
    "status": "pending_delivery"
  },
  "idempotencyKey": "uuid"
}
```

Retries compatíveis retornam HTTP `200` com `existing` ou `reconciled`.

## 9. Erros seguros

| HTTP | Código |
| --- | --- |
| `400` | `INVALID_JSON`, `INVALID_PAYLOAD` |
| `401` | `AUTH_REQUIRED` |
| `403` | `FORBIDDEN`, `ORIGIN_NOT_ALLOWED` |
| `405` | `METHOD_NOT_ALLOWED` |
| `409` | `EMAIL_ROLE_CONFLICT` |
| `409` | `CPF_CONFLICT` |
| `409` | `SERVICE_SCOPE_CONFLICT` |
| `409` | `RELATIONSHIP_CONFLICT` |
| `409` | `CLIENT_DATA_CONFLICT` |
| `409` | `IDEMPOTENCY_KEY_REUSED` |
| `409` | `IDENTITY_RECONCILIATION_REQUIRED` |
| `500` | `RELATIONAL_WRITE_FAILED`, `INTERNAL_ERROR` |

Respostas não incluem SQL, constraints, stack trace, senha, JWT, service role ou link.

## 10. Segurança

- service role somente no ambiente da Edge Function;
- autorização do chamador ocorre antes do cliente administrativo;
- CORS usa allowlist;
- logs contêm somente request ID, código sanitizado e resultado de compensação;
- escrita direta do front-end continua bloqueada;
- `profiles.role` e `profiles.status` são canônicos.

## 11. Testes locais

Cobertura:

- JWT ausente;
- Admin negado;
- Parceiro inativo negado;
- Parceiro ativo autorizado;
- payload inválido;
- campos desconhecidos;
- múltiplos escopos;
- escopos duplicados;
- conflito de escopo;
- conflito de CPF;
- retry idempotente;
- mesma chave com payload diferente;
- compensação do Auth user;
- ausência de dados sensíveis;
- cleanup das fixtures.

## 12. E-mail postergado

Resend, templates, domínio, DNS, API key e envio real não foram configurados.

Uma fase futura deverá:

- escolher remetente e domínio;
- configurar Resend como secret server-side;
- criar templates;
- enviar o link já gerado;
- implementar retry e `resend-client-invite`;
- definir expiração e rate limit.

## 13. Fora de escopo

- UI;
- rotas Next;
- `/login`;
- billing;
- update/suspend de Parceiro;
- provisionamento de Parceiro;
- envio real de e-mail;
- dados reais;
- Supabase remoto;
- `/form/:token`.
