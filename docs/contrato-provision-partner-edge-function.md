# Contrato HTTP e transação da Edge Function `provision-partner`

Data de referência: 22 de junho de 2026.

Status: contrato definido na Fase 5.6 e atualizado pela Fase A com implementação e validação exclusivamente locais. Nenhuma integração de UI ou alteração remota foi realizada.

## 1. Resumo

`provision-partner` será a operação privilegiada usada pelo Super Admin para cadastrar um Parceiro.

A função será responsável por:

- autenticar e autorizar o chamador;
- validar e normalizar os dados do Parceiro;
- criar ou reconciliar a identidade no Supabase Auth;
- criar atomicamente `profiles` e `partners`;
- manter `profiles.role = 'parceiro'` como fonte canônica;
- criar o Parceiro com `profiles.status = 'active'`;
- iniciar o fluxo para o próprio Parceiro definir a senha por e-mail;
- tratar retries, conflitos e falhas parciais sem duplicar identidade;
- retornar somente dados mínimos e não sensíveis.

O Super Admin não informa, conhece, recebe ou visualiza a senha do Parceiro.

Planos, assinatura, billing e permissões comerciais não fazem parte desta função.

## 2. Endpoint

| Item | Contrato |
| --- | --- |
| Nome da função | `provision-partner` |
| Endpoint esperado | `POST /functions/v1/provision-partner` |
| Método funcional | `POST` |
| Preflight | `OPTIONS`, apenas para CORS |
| Autenticação | `Authorization: Bearer <JWT>` |
| Chamador permitido | Super Admin com profile e extensão válidos |
| Verificação JWT | habilitada |
| Content-Type | `application/json` |
| Resposta | `application/json` |

Métodos diferentes de `POST` e `OPTIONS` devem receber `405 Method Not Allowed`.

`OPTIONS` não executa autenticação nem regra de negócio; responde somente ao preflight da allowlist configurada.

### 2.1 Autorização exigida

O JWT válido é necessário, mas não suficiente.

O usuário autenticado somente pode continuar quando:

1. existe em `auth.users`;
2. possui registro em `profiles` associado ao `auth.uid()`;
3. `profiles.role = 'admin'`;
4. `profiles.status = 'active'`;
5. existe uma extensão correspondente em `admins`.

Não haverá autorização por:

- `user_metadata.role`;
- role enviado no body;
- rota acessada pelo usuário;
- estado da interface;
- informação armazenada apenas no JWT sobre o papel de negócio.

## 3. Payload de entrada

### 3.1 Exemplo

```json
{
  "email": "parceiro@example.com",
  "phone": "+5511999999999",
  "professionalType": "nutricionista",
  "professionalRegistryNumber": "12345",
  "displayName": "Marina Alves",
  "professionalName": "Dra. Marina Alves",
  "professionalRegistryType": "CRN",
  "idempotencyKey": "26485644-a422-4d99-9f3c-63295c13a970"
}
```

### 3.2 Campos

| Campo | Tipo | Obrigatoriedade de produto | Regra |
| --- | --- | --- | --- |
| `email` | string | obrigatório | e-mail válido, normalizado com `trim` e caixa baixa |
| `phone` | string | obrigatório | telefone válido; formato canônico recomendado E.164 |
| `professionalType` | string | obrigatório | `personal_trainer`, `nutricionista` ou `medico` |
| `professionalRegistryNumber` | string | obrigatório | não vazio após `trim` |
| `displayName` | string | obrigatório | nome comum gravado em `profiles.display_name` |
| `professionalName` | string | opcional | nome profissional; usa fallback para `displayName` |
| `professionalRegistryType` | string | obrigatório | `crm`, `crn`, `cref` ou `outro` |
| `idempotencyKey` | string UUID | opcional, recomendada | identifica uma tentativa lógica e seus retries; a função gera uma chave quando ausente |

### 3.3 Regras derivadas do schema vigente

A migration atual impõe:

- `profiles.display_name` obrigatório e não vazio;
- `partners.professional_name` obrigatório e não vazio;
- `professional_registry_type` e `professional_registry_number` nulos em conjunto ou preenchidos em conjunto.

Consequentemente:

1. `displayName` é obrigatório;
2. `professionalName` é opcional;
3. quando `professionalName` não vier, `displayName` também será usado como `professional_name`;
4. quando ambos vierem, cada valor será persistido no campo correspondente;
5. `professionalRegistryType` e `professionalRegistryNumber` são obrigatórios nesta operação.

### 3.4 Persistência do telefone

A Fase A definiu `profiles.phone` como campo canônico.

Regras:

- o campo é opcional no schema geral, pois também atende Admin e Cliente;
- é obrigatório no payload de `provision-partner`;
- usa formato E.164;
- não é armazenado em metadata como fonte canônica;
- não é gravado em `patients.phone`;
- alterações futuras passarão por `update-partner`.

## 4. Validações

### 4.1 Validações do chamador

Executar nesta ordem:

1. exigir header `Authorization`;
2. validar o JWT;
3. obter a identidade autenticada;
4. buscar `profiles` por `user_id = auth.uid()`;
5. confirmar `role = 'admin'`;
6. confirmar `status = 'active'`;
7. confirmar a extensão em `admins`;
8. somente depois criar ou usar o cliente administrativo com service role.

Para reduzir enumeração de estados internos, ausência de profile, role incompatível, status inativo ou ausência da extensão retornam o mesmo erro externo `FORBIDDEN`.

O motivo específico pode existir apenas em log interno sanitizado.

### 4.2 Validações do payload

#### `email`

- string;
- obrigatório;
- `trim`;
- convertido para caixa baixa;
- tamanho máximo a definir antes da implementação;
- formato validado na Edge Function;
- comparado por valor normalizado;
- não pode conflitar com profile de outro role.

#### `phone`

- string;
- obrigatório;
- não vazio;
- formato canônico recomendado: E.164;
- persistido em `profiles.phone`.

Formato recomendado:

```text
+[código do país][número]
```

Exemplo: `+5511999999999`.

#### `professionalType`

Aceitar somente:

- `personal_trainer`;
- `nutricionista`;
- `medico`.

Esse campo é classificação cadastral/comercial. Não autoriza módulos e não restringe `service_scope`.

#### `professionalRegistryNumber`

- string;
- obrigatório;
- não vazio depois de `trim`;
- formato específico por conselho ainda não definido;
- não é unique no schema atual;
- não deve ser usado como identidade ou autorização.

#### `professionalRegistryType`

Aceitar inicialmente:

- `crm`;
- `crn`;
- `cref`;
- `outro`.

Com a constraint atual, deve acompanhar `professionalRegistryNumber`.

Não haverá validação cruzada rígida entre `professionalType` e conselho no MVP. Uma inconsistência pode ser registrada para revisão cadastral futura, mas não deve virar autorização de módulos.

#### Nomes

- ao menos `displayName` ou `professionalName` deve existir;
- valores devem ser strings não vazias após `trim`;
- limites máximos devem ser definidos antes da implementação;
- não aceitar HTML ou controles invisíveis;
- aplicar a regra de fallback descrita na seção 3.3.

#### `idempotencyKey`

- quando fornecida, deve ser UUID válido;
- deve representar a mesma tentativa lógica em todos os retries;
- reutilização com payload normalizado diferente retorna conflito;
- não deve ser usada como segredo.

### 4.3 Campos desconhecidos

A recomendação é rejeitar campos desconhecidos com `400 INVALID_PAYLOAD`.

Isso evita aceitar silenciosamente:

- `role`;
- `status`;
- `password`;
- `plan`;
- `serviceScopes`;
- IDs internos;
- flags administrativas.

## 5. Ordem da operação

### 5.1 Sequência ideal

1. validar método e CORS;
2. validar JWT;
3. buscar o profile do chamador usando o contexto autenticado;
4. confirmar Super Admin ativo e extensão `admins`;
5. validar e normalizar o payload;
6. calcular hash seguro da entrada normalizada, caso exista ledger de idempotência;
7. consultar operação anterior pela `idempotencyKey`, quando disponível;
8. verificar `profiles` por `lower(email)`;
9. verificar se o e-mail já existe no Supabase Auth por operação administrativa segura;
10. classificar o estado encontrado como novo, completo, reconciliável ou conflitante;
11. criar ou reconciliar o Auth user sem senha definida pelo Admin;
12. executar atomicamente a parte relacional:
    - inserir ou reconciliar `profiles`;
    - garantir `role = 'parceiro'`;
    - garantir `status = 'active'`;
    - inserir ou reconciliar `partners`;
13. gerar o artefato de convite/definição de senha no backend;
14. enviar o e-mail pelo provedor aprovado;
15. registrar o resultado sanitizado;
16. retornar resposta sem token, link ou segredo.

### 5.2 Transação relacional

`profiles` e `partners` devem ser gravados em uma única transação PostgreSQL.

A implementação futura deverá criar uma operação interna, via migration separada, com as seguintes propriedades:

- chamada somente por contexto administrativo confiável;
- sem grant para `anon` ou usuários comuns;
- recebe o `auth_user_id` já criado ou reconciliado;
- recebe os dados normalizados;
- bloqueia linhas relevantes durante reconciliação;
- valida role e estado existentes;
- insere `profiles` e `partners` atomicamente;
- respeita constraints e triggers atuais;
- retorna `profile_id`, `partner_id` e classificação do resultado;
- não cria usuário Auth;
- não envia e-mail.

Nome ilustrativo, ainda não aprovado:

```text
provision_partner_records
```

A Edge Function permanece orquestradora. A operação SQL futura é apenas a fronteira transacional relacional.

### 5.3 Limite transacional

Supabase Auth, PostgreSQL e provedor de e-mail não compartilham uma única transação.

Portanto:

```text
Auth user
   │
   ├── transação PostgreSQL: profiles + partners
   │
   └── convite/e-mail
```

O fluxo deve usar idempotência e compensação, não fingir atomicidade distribuída.

## 6. Idempotência

### 6.1 Mesma requisição repetida

Com mesma `idempotencyKey` e mesmo payload normalizado:

- não criar novo Auth user;
- não criar outro profile;
- não criar outro partner;
- não reenviar convite automaticamente em todo retry;
- retornar o resultado anterior ou o recurso reconciliado.

Resposta esperada: `200` com `status = 'existing'` ou `status = 'reconciled'`.

Com a mesma chave e payload diferente:

- não executar alterações;
- retornar `409 IDEMPOTENCY_KEY_REUSED`.

### 6.2 Mesmo e-mail já associado a Parceiro completo

Quando Auth, `profiles` e `partners` existem e são compatíveis:

- tratar como idempotente;
- comparar os campos relevantes normalizados;
- retornar o recurso existente;
- não sobrescrever dados divergentes silenciosamente;
- não reenviar convite implicitamente.

Se houver pedido de novo convite, usar futuramente `resend-partner-invite`.

### 6.3 Auth user existente e profile ausente

Pode ser reconciliado somente quando:

- o e-mail normalizado coincide;
- não existe profile conflitante;
- a identidade Auth não está associada a outro domínio;
- a operação possui evidência suficiente para concluir que se trata de provisionamento incompleto;
- a reconciliação fica registrada em auditoria.

Sem evidência segura, retornar conflito e exigir intervenção manual.

Nunca excluir Auth user preexistente durante reconciliação.

### 6.4 Profile existente e Partner ausente

Pode ser reconciliado quando:

- `profiles.role = 'parceiro'`;
- `profiles.user_id` aponta para o Auth user esperado;
- o e-mail normalizado é compatível;
- não existe extensão incompatível;
- o payload não contradiz dados já persistidos.

A operação transacional cria somente `partners` e retorna `status = 'reconciled'`.

### 6.5 E-mail com outro role

Quando `profiles.email` pertence a `cliente` ou `admin`:

- não alterar role;
- não criar extensão Partner;
- não mesclar identidades;
- retornar `409 EMAIL_ROLE_CONFLICT`.

A resposta não deve revelar mais informações do que o necessário para o Super Admin autenticado.

### 6.6 Falha e reenvio de convite

Se a persistência terminou e o envio falhou:

- preservar Auth, profile e Partner;
- marcar entrega como `pending_retry` em mecanismo durável futuro;
- não recriar o Parceiro;
- não excluir o Auth user;
- permitir reenvio controlado;
- aplicar rate limit;
- não devolver o link.

Retries comuns de `provision-partner` não devem disparar e-mails ilimitados.

## 7. Tratamento de falhas parciais

### 7.1 Auth criado e transação relacional falha

Se o Auth user foi criado exclusivamente pela tentativa atual:

1. tentar remover o Auth user como compensação;
2. registrar apenas IDs e código de erro sanitizado;
3. marcar a operação como falha compensada ou pendente de reconciliação;
4. permitir retry com a mesma chave.

Se o Auth user já existia:

- nunca removê-lo;
- registrar necessidade de reconciliação;
- retornar erro seguro.

### 7.2 Profile criado e Partner ausente

Esse estado não deve ocorrer quando a operação relacional for transacional.

Se for encontrado como legado de uma tentativa anterior:

- bloquear/reconciliar pelo profile;
- validar role, user_id e e-mail;
- criar `partners` somente quando seguro;
- não criar novo Auth user.

### 7.3 Banco concluído e convite falha

Provisionamento e entrega devem ser tratados como estados distintos.

O recurso permanece válido e ativo. A resposta recomendada é:

- HTTP `202 Accepted`;
- `status = 'created'` ou `reconciled`;
- `invite.status = 'pending_retry'`;
- código seguro `INVITE_DELIVERY_PENDING`.

Não fazer rollback destrutivo de Auth e banco depois que a identidade canônica foi criada com sucesso.

### 7.4 Compensação falha

Quando não for possível desfazer o Auth user recém-criado:

- registrar estado `manual_review_required` em ledger futuro;
- emitir correlation ID;
- impedir tentativas cegas de criar outro usuário;
- retornar `500 INTERNAL_ERROR`;
- exigir reconciliação operacional.

### 7.5 Logs internos

Podem conter:

- correlation ID;
- execution ID;
- idempotency key;
- hash da entrada normalizada;
- ID do chamador;
- IDs de Auth/profile/Partner;
- etapa da falha;
- código sanitizado;
- duração;
- resultado da compensação.

Não podem conter:

- JWT;
- service role;
- senha;
- link ou token de convite;
- Authorization header;
- payload completo do provedor de e-mail;
- stack trace em resposta;
- dados pessoais além do estritamente necessário.

## 8. Resposta de sucesso

### 8.1 Parceiro criado

HTTP `201 Created`.

```json
{
  "requestId": "1ed1dd22-5746-42ce-9c27-2d1eef3266ef",
  "status": "created",
  "partner": {
    "profileId": "4f06c4ed-c16f-4a34-a866-ce2801f84340",
    "partnerId": "45ced5a5-98ec-4b17-9fbe-f0888ec8cd40",
    "accountStatus": "active"
  },
  "invite": {
    "status": "sent"
  }
}
```

### 8.2 Parceiro existente ou reconciliado

HTTP `200 OK`.

```json
{
  "requestId": "1ed1dd22-5746-42ce-9c27-2d1eef3266ef",
  "status": "existing",
  "partner": {
    "profileId": "4f06c4ed-c16f-4a34-a866-ce2801f84340",
    "partnerId": "45ced5a5-98ec-4b17-9fbe-f0888ec8cd40",
    "accountStatus": "active"
  },
  "invite": {
    "status": "not_resent"
  }
}
```

Valores previstos para `status`:

- `created`;
- `existing`;
- `reconciled`.

Valores previstos para `invite.status`:

- `sent`;
- `not_resent`;
- `pending_retry`.

Nenhuma resposta inclui senha, token, link de convite ou segredo.

## 9. Respostas de erro

### 9.1 Envelope

```json
{
  "requestId": "1ed1dd22-5746-42ce-9c27-2d1eef3266ef",
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "Os dados informados são inválidos.",
    "fields": {
      "phone": "required"
    }
  }
}
```

`fields` é opcional e só deve conter nomes de campos e classificações seguras.

### 9.2 Catálogo inicial

| HTTP | Código | Uso |
| --- | --- | --- |
| `400` | `INVALID_JSON` | corpo não é JSON válido |
| `400` | `INVALID_PAYLOAD` | campo ausente, inválido ou desconhecido |
| `401` | `AUTH_REQUIRED` | JWT ausente ou inválido |
| `403` | `FORBIDDEN` | chamador não é Super Admin ativo válido |
| `405` | `METHOD_NOT_ALLOWED` | método não suportado |
| `409` | `EMAIL_ROLE_CONFLICT` | e-mail pertence a outro role |
| `409` | `PARTNER_DATA_CONFLICT` | Parceiro existente possui dados incompatíveis |
| `409` | `IDEMPOTENCY_KEY_REUSED` | chave reutilizada com outro payload |
| `409` | `IDENTITY_RECONCILIATION_REQUIRED` | Auth/profile não podem ser reconciliados automaticamente |
| `422` | `INVALID_IDENTITY_STATE` | estado sintaticamente válido, mas incompatível |
| `429` | `RATE_LIMITED` | limite operacional excedido |
| `500` | `RELATIONAL_WRITE_FAILED` | falha relacional sanitizada |
| `500` | `INTERNAL_ERROR` | falha interna não classificável externamente |
| `502` | `AUTH_PROVIDER_FAILED` | falha transitória no Supabase Auth |
| `502` | `INVITE_PROVIDER_FAILED` | geração do convite falhou antes da conclusão |

Se o banco já concluiu e apenas a entrega do e-mail falhou, usar `202 INVITE_DELIVERY_PENDING`, não mascarar o provisionamento como inexistente.

Mensagens externas devem ser estáveis e não incluir:

- nomes de constraints;
- SQL;
- stack trace;
- resposta bruta do Auth;
- existência detalhada de outro usuário;
- tokens ou links.

## 10. Segurança

### 10.1 Service role

- existe somente no secret da Edge Function;
- nunca vai para browser, Next.js client-side ou mobile;
- nunca aparece em documentação com valor real;
- nunca é retornada ou registrada;
- só é usada depois da autorização do chamador;
- fica limitada à criação/reconciliação necessária.

### 10.2 JWT

- `provision-partner` não aceita chamada anônima;
- `verify_jwt` permanece habilitado;
- a função valida a identidade novamente no fluxo;
- ausência de profile ou profile inativo nega acesso;
- role de negócio vem de `profiles`;
- `user_metadata.role` é ignorado.

### 10.3 Credenciais do Parceiro

- senha não faz parte do payload;
- Super Admin não define senha;
- Super Admin não recebe senha;
- link de convite nunca volta na resposta;
- token não entra em logs;
- o Parceiro define a própria senha por fluxo de e-mail.

### 10.4 CORS e abuso

- usar allowlist por ambiente;
- não usar `Access-Control-Allow-Origin: *`;
- CORS não substitui autenticação;
- aplicar rate limit por chamador, e-mail alvo e janela;
- rejeitar retries abusivos de convite.

### 10.5 Dados e autorização

- `professionalType` não concede módulos;
- plano e assinatura não entram no provisionamento;
- o cliente não escolhe `role` ou `status`;
- IDs administrativos são derivados do chamador;
- constraints e triggers continuam valendo mesmo com service role;
- respostas seguem o princípio de minimização.

## 11. Fluxo de senha e convite

### 11.1 Resultado de negócio esperado

1. Parceiro é provisionado sem senha conhecida pelo Admin;
2. registros canônicos são concluídos;
3. backend gera um fluxo de convite/definição de senha;
4. e-mail é enviado;
5. Parceiro acessa uma rota futura segura;
6. Parceiro define a própria senha;
7. login futuro ocorre por e-mail e senha.

### 11.2 Decisão técnica ainda necessária

A implementação deverá validar no Supabase local a combinação correta das APIs Auth Admin para:

- criar ou reconciliar um usuário sem senha definida pelo Admin;
- gerar um convite para usuário novo;
- gerar novo fluxo seguro para usuário existente ainda sem senha;
- impedir envio antes da confirmação relacional;
- definir redirect permitido por ambiente.

As alternativas previstas são:

- link administrativo de tipo convite, com envio por provedor controlado;
- convite administrativo nativo;
- fluxo seguro equivalente para reenvio.

A escolha final deve preservar o contrato externo e não expor o link.

## 12. Funções futuras relacionadas

### `update-partner`

Responsabilidade futura:

- atualizar campos cadastrais permitidos;
- sincronizar e-mail de forma segura entre Auth e `profiles`;
- atualizar telefone após definição do campo canônico;
- alterar classificação profissional sem afetar autorização de módulos;
- exigir Super Admin ativo;
- possuir auditoria e controle de concorrência.

Não altera senha diretamente.

### `suspend-partner`

Responsabilidade futura:

- alterar `profiles.status` de forma controlada;
- impedir novos acessos quando suspenso;
- definir impacto sobre vínculos e operações futuras;
- registrar motivo e auditoria;
- exigir Super Admin ativo.

O efeito de inadimplência não deve ser confundido automaticamente com suspensão administrativa antes da modelagem de billing.

### `resend-partner-invite`

Função futura recomendada:

- exigir Super Admin ativo;
- localizar Partner canônico;
- validar se reenvio ainda é aplicável;
- gerar novo fluxo sem revelar token;
- aplicar rate limit;
- invalidar ou expirar fluxo anterior quando suportado;
- registrar tentativa e resultado.

Separar o reenvio evita que retries de `provision-partner` disparem e-mails repetidos.

## 13. Testes futuros

### 13.1 Contrato HTTP

- aceita `POST`;
- responde ao `OPTIONS` permitido;
- rejeita métodos não suportados;
- rejeita JSON inválido;
- rejeita campos desconhecidos;
- mantém envelope e códigos estáveis;
- não retorna dados sensíveis.

### 13.2 Autenticação e autorização

- sem JWT retorna `401`;
- JWT inválido retorna `401`;
- usuário sem profile retorna `403`;
- profile `pending`, `suspended` ou `disabled` retorna `403`;
- Cliente ativo tentando criar Parceiro retorna `403`;
- Parceiro ativo tentando criar Parceiro retorna `403`;
- Admin sem extensão `admins` retorna `403`;
- Super Admin ativo provisiona Parceiro;
- metadata divergente não altera a decisão.

### 13.3 Payload

- e-mail ausente ou inválido falha;
- telefone ausente falha;
- telefone inválido falha;
- `professionalType` inválido falha;
- registro profissional ausente falha;
- tipo de registro ausente com número presente falha;
- nomes ausentes falham por incompatibilidade com o schema;
- fallback entre `displayName` e `professionalName` funciona;
- idempotency key inválida falha;
- senha enviada como campo desconhecido falha.

### 13.4 Persistência

- cria Auth user sem senha conhecida pelo Admin;
- cria `profiles` com `role = 'parceiro'`;
- cria `profiles` com `status = 'active'`;
- cria `partners`;
- `professionalType` não ativa nem bloqueia módulos;
- profile e Partner são atômicos;
- triggers de role continuam efetivos;
- falha em Partner desfaz a transação relacional.

### 13.5 Idempotência e reconciliação

- mesma chave e payload retorna mesmo recurso;
- mesma chave com payload diferente retorna `409`;
- e-mail de Parceiro completo é idempotente;
- e-mail de outro role retorna `409`;
- Auth existente sem profile é reconciliado somente quando seguro;
- profile Parceiro sem extensão é reconciliado;
- profile com role conflitante nunca é convertido;
- duas chamadas concorrentes não duplicam Auth, profile ou Partner.

### 13.6 Falhas parciais

- Auth novo é compensado quando a transação falha;
- Auth preexistente nunca é removido;
- falha de compensação gera revisão manual;
- falha de e-mail preserva registros;
- retry de entrega não recria Parceiro;
- convite pendente retorna estado seguro.

### 13.7 Convite e segurança

- convite não vaza token ou link na resposta;
- link não aparece nos logs;
- service role não aparece nos logs;
- Authorization header não aparece nos logs;
- Super Admin não recebe senha;
- Parceiro consegue definir a própria senha;
- reenvio respeita rate limit;
- CORS rejeita origem não permitida.

## 14. Fora de escopo

Não fazem parte desta fase:

- implementação da Edge Function;
- criação de diretório em `supabase/functions`;
- migration da operação transacional;
- migration da coluna de telefone;
- tabela de idempotência ou auditoria;
- integração com UI Next.js;
- integração com aplicativo móvel;
- criação de `/login`;
- rota de conclusão do convite;
- escolha ou configuração do provedor de e-mail;
- templates de e-mail;
- planos mensal/anual;
- billing, assinatura e entitlement;
- edição de Parceiro;
- suspensão de Parceiro;
- provisionamento de Cliente;
- alteração da migration inicial;
- aplicação de SQL;
- mudança em banco local ou remoto.

## 15. Decisões pendentes após a implementação local

1. provedor e template de e-mail;
2. envio efetivo do link atualmente gerado;
3. redirect e rota de definição de senha por ambiente;
4. expiração, rate limit e quantidade máxima de reenvios;
5. implementação separada de `resend-partner-invite`;
6. se `outro` exige descrição adicional;
7. regras específicas de formato por conselho profissional;
8. limites e retenção de `provisioning_operations`;
9. allowlist CORS definitiva por ambiente;
10. observabilidade e procedimento de reconciliação manual;
11. política de limpeza/retenção de Auth users incompletos.

## 16. Estado da implementação local

A Fase A implementou:

- `profiles.phone`;
- validação E.164;
- vocabulário de tipo de registro;
- `provisioning_operations`;
- RPC transacional restrita à `service_role`;
- Edge Function `provision-partner`;
- validação de Super Admin ativo;
- criação/reconciliação de Auth, profile e Partner;
- geração de convite sem exposição do link;
- compensação de Auth recém-criado quando a transação falha;
- testes SQL e integração HTTP local.

O convite permanece `pending_delivery` até a escolha de um provedor de e-mail.

## 17. Próximos passos recomendados

1. revisar os resultados dos testes locais da Fase A;
2. definir o provedor de e-mail;
3. implementar a entrega do convite gerado;
4. implementar separadamente `resend-partner-invite`;
5. definir observabilidade e retenção do ledger;
6. executar revisão de segurança antes de qualquer deploy;
7. deixar `update-partner`, `suspend-partner` e billing para fases posteriores.

## 18. Referências relacionadas

- `AGENTS.md`
- `docs/estrategia-provisionamento-edge-functions.md`
- `docs/schema-limpo-inicial-supabase-next.md`
- `supabase/migrations/20260622102406_initial_clean_identity_ownership.sql`
- `supabase/tests/001_initial_clean_identity_ownership_schema.test.sql`
- `supabase/tests/002_initial_clean_identity_ownership_rls.test.sql`
- `supabase/tests/003_profile_extension_role_concurrency.sh`
- [Supabase — autenticação em Edge Functions](https://supabase.com/docs/guides/functions/auth)
- [Supabase — configuração por função](https://supabase.com/docs/guides/functions/function-configuration)
- [Supabase — secrets em Edge Functions](https://supabase.com/docs/guides/functions/secrets)
- [Supabase Auth Admin — gerar links](https://supabase.com/docs/reference/javascript/auth-admin-generatelink)
- [Supabase Auth Admin — convite por e-mail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)

## 19. Validação via MCP Supabase

A conexão MCP local confirmou:

- somente `profiles`, `admins`, `patients`, `partners` e `partner_clients` no schema `public`;
- RLS habilitada nas cinco tabelas;
- migration `20260622102406_initial_clean_identity_ownership` registrada;
- `profiles.display_name` obrigatório;
- `partners.professional_name` obrigatório;
- `partners.professional_type` restrito aos três valores oficiais;
- `partners` sem coluna de telefone;
- `profiles.phone` passou a existir após a migration complementar da Fase A;
- `professional_registry_type` e `professional_registry_number` presentes;
- ausência de dados nas cinco tabelas no momento da inspeção.

A documentação oficial consultada via MCP confirmou:

- `inviteUserByEmail` envia convite para um endereço de e-mail;
- `generateLink` suporta link de tipo `invite` para envio por provedor próprio;
- templates de convite servem para o usuário aceitar o convite e concluir a criação da conta.

A API Auth Admin definitiva para criação, reconciliação e reenvio ainda deverá ser validada por testes locais antes da implementação, especialmente para usuários já existentes.
