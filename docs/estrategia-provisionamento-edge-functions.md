# Estratégia de provisionamento via Supabase Edge Functions

Data de referência: 22 de junho de 2026.

Status: decisão arquitetural e estratégia técnica da Fase 5.5. Nenhuma Edge Function, seed, migration ou integração de runtime foi criada nesta fase.

## 1. Resumo da decisão

Supabase Edge Functions serão a camada principal de backend para operações sensíveis e compartilhadas.

Clientes previstos:

- aplicação web em Next.js;
- aplicativo móvel futuro;
- integrações e webhooks futuros.

Todos os clientes chamarão a mesma camada de Edge Functions. Next.js não será a fonte canônica das regras de provisionamento e não duplicará essas operações em Route Handlers ou Server Actions.

As Edge Functions serão responsáveis por:

- validar identidade e autorização do chamador;
- usar privilégios administrativos somente depois da autorização;
- criar usuários no Supabase Auth;
- coordenar gravações nas tabelas canônicas;
- disparar convites para definição de senha;
- aplicar idempotência e compensação de falhas;
- retornar respostas mínimas e sem dados sensíveis.

## 2. Por que Edge Functions foram escolhidas

Esta decisão:

- centraliza regras usadas por web e mobile;
- evita duplicar provisionamento entre Next.js e aplicativo móvel;
- mantém `service role` fora dos clientes;
- permite integrar Auth, banco, e-mail e webhooks em ambiente confiável;
- facilita adicionar assinatura mensal/anual sem acoplar o backend ao framework web;
- preserva o Supabase como camada compartilhada de identidade e dados.

Next.js continua responsável por interface, experiência web, navegação e consumo autenticado das funções.

## 3. Arquitetura proposta

```text
Next.js web ───────┐
                   ├── JWT do usuário ──> Supabase Edge Functions
App móvel futuro ─┘                         ├── valida chamador
                                            ├── aplica regra de negócio
                                            ├── usa Auth Admin quando autorizado
                                            ├── chama operação transacional interna
                                            └── envia convite/e-mail
                                                        │
                                                        v
                                              Supabase Auth + Postgres
```

Para webhooks:

```text
Gateway de pagamento
        │
        ├── corpo bruto
        ├── assinatura do provedor
        └── identificador do evento
                  │
                  v
          billing-webhook futuro
                  ├── verifica assinatura
                  ├── impede replay
                  └── atualiza domínio financeiro futuro
```

### Separação de clientes Supabase dentro da função

Cada função interna deverá trabalhar com dois contextos distintos:

1. cliente do chamador:
   - recebe o `Authorization` original;
   - identifica o usuário;
   - respeita RLS;
   - é usado para carregar o profile e a extensão do chamador;
2. cliente administrativo:
   - usa chave secreta disponível somente no ambiente da Edge Function;
   - ignora RLS;
   - só é usado depois que o chamador foi autenticado e autorizado.

O simples recebimento de um JWT válido não autoriza uma operação administrativa.

## 4. Contratos canônicos

As funções devem obedecer ao modelo:

- `profiles.user_id → auth.users.id`;
- `profiles.role` é a fonte canônica do papel;
- `profiles.status` controla acesso geral;
- `admins`, `partners` e `patients` são extensões de domínio;
- `partner_clients` controla vínculo e escopo;
- `user_metadata.role` não participa de decisões de autorização;
- `professional_type` é classificação cadastral/comercial;
- `professional_type` não limita módulos ou `service_scope`.

E-mails devem ser normalizados com `trim` e caixa baixa antes de comparação ou persistência. CPF, quando fornecido, deve ser normalizado para onze dígitos.

## 5. Funções previstas

| Função | Chamador | JWT | Finalidade |
| --- | --- | --- | --- |
| `provision-partner` | Super Admin ativo | obrigatório | criar/reconciliar Auth, profile e Partner |
| `provision-client-for-partner` | Parceiro ativo | obrigatório | criar/reconciliar Auth, profile, Patient e vínculos |
| `manage-client-scopes` | Parceiro ativo | obrigatório | adicionar ou encerrar escopos do próprio vínculo |
| `provision-admin` | operação local/privada | não será endpoint comum | criar o primeiro Super Admin |
| `billing-webhook` | gateway futuro | desabilitado no gateway Supabase | processar eventos assinados do provedor |

`manage-client-scopes` é necessário porque os escopos podem ser adicionados depois do provisionamento inicial. Ele não deve permitir que um Parceiro altere vínculos pertencentes a outro Parceiro.

## 6. Fluxo do primeiro Super Admin

### Desenvolvimento local

O primeiro Super Admin será criado por seed de desenvolvimento futuro:

1. criar usuário Auth fictício e controlado;
2. inserir `profiles` com `role = 'admin'` e `status = 'active'`;
3. inserir `admins`;
4. validar integridade e acesso;
5. não versionar senha real.

### Produção

O primeiro Super Admin será criado por script privado ou operação manual controlada.

Requisitos:

- execução fora do browser e do aplicativo móvel;
- credenciais administrativas obtidas de ambiente seguro;
- confirmação explícita do projeto Supabase alvo;
- operação idempotente por e-mail;
- logs sem senha, token, link ou chave;
- validação de que o profile existente possui role `admin`;
- criação de apenas um Super Admin no MVP por procedimento operacional, sem constraint singleton no banco.

### `provision-admin`

Se implementada como Edge Function:

- não será chamada pelo app;
- não terá CORS público;
- não ficará exposta como fluxo comum;
- deverá exigir segredo operacional específico ou ser disponibilizada somente localmente;
- deverá ser desativada ou não implantada depois do bootstrap de produção.

## 7. Fluxo de criação de Parceiro

Função: `provision-partner`.

Chamador permitido: usuário autenticado cujo:

- profile exista;
- `profiles.role = 'admin'`;
- `profiles.status = 'active'`;
- extensão `admins` exista.

### Entrada proposta

```json
{
  "email": "parceiro@example.com",
  "displayName": "Nome do parceiro",
  "professionalName": "Nome profissional",
  "professionalType": "nutricionista",
  "idempotencyKey": "uuid-do-cliente"
}
```

Campos de registro profissional são opcionais no MVP e, se enviados futuramente, devem ser enviados em conjunto.

### Sequência

1. aceitar somente `POST` e `OPTIONS`;
2. validar origem CORS contra allowlist do ambiente;
3. validar JWT;
4. carregar profile e `admins` do chamador;
5. confirmar role e status;
6. normalizar e validar a entrada;
7. consultar `profiles` por e-mail normalizado;
8. reconciliar operação anterior ou detectar conflito;
9. criar ou localizar usuário Auth;
10. executar atomicamente a gravação de `profiles` e `partners`;
11. criar profile com:
    - `role = 'parceiro'`;
    - `status = 'active'`;
12. iniciar o fluxo de convite para o Parceiro definir senha, caso a criação manual pelo Admin adote o mesmo padrão seguro do Cliente;
13. retornar somente identificadores públicos necessários e estado da operação.

### Resposta proposta

```json
{
  "status": "created",
  "profileId": "uuid",
  "partnerId": "uuid",
  "inviteStatus": "sent"
}
```

Também são válidos:

- `status = 'existing'` para repetição idempotente;
- `inviteStatus = 'pending_retry'` quando os dados existem, mas o envio precisa ser repetido.

O detalhe de como Parceiros criados manualmente definirão senha permanece decisão de produto pendente. A recomendação é usar convite, sem senha conhecida pelo Admin.

## 8. Fluxo de Parceiro após assinatura

No modelo SaaS futuro:

1. checkout cria ou associa uma intenção de assinatura;
2. gateway envia evento assinado;
3. `billing-webhook` valida assinatura e idempotência;
4. domínio financeiro registra assinatura e entitlement;
5. um fluxo interno provisiona ou ativa o Parceiro;
6. `profiles.role` continua `parceiro`;
7. `professional_type` continua apenas cadastral;
8. módulos disponíveis são definidos por plano/permissão comercial.

O webhook não deve chamar diretamente um endpoint público de provisionamento sem autenticação adicional. A integração deverá usar operação interna compartilhada ou função protegida por segredo específico.

Não está decidido se inadimplência mudará `profiles.status` para `suspended` ou se haverá status de assinatura separado. A recomendação é manter estado financeiro separado e derivar entitlement, evitando confundir suspensão comercial com bloqueio administrativo da conta.

## 9. Fluxo de criação de Cliente

Função: `provision-client-for-partner`.

Chamador permitido: usuário autenticado cujo:

- profile exista;
- `profiles.role = 'parceiro'`;
- `profiles.status = 'active'`;
- extensão `partners` exista.

### Entrada proposta

```json
{
  "email": "cliente@example.com",
  "displayName": "Nome do cliente",
  "cpf": "12345678901",
  "phone": null,
  "birthDate": null,
  "objective": null,
  "serviceScopes": ["dieta", "treino"],
  "idempotencyKey": "uuid-do-cliente"
}
```

Regras:

- e-mail é obrigatório;
- CPF é opcional conforme o schema atual, mas, quando informado, deve ter onze dígitos;
- `serviceScopes` deve conter pelo menos um item;
- itens duplicados são removidos antes da gravação;
- somente `dieta`, `treino`, `saude` e `cardio` são aceitos;
- senha não faz parte da entrada.

### Sequência

1. validar método e CORS;
2. validar JWT;
3. carregar profile e Partner do chamador;
4. confirmar role e status;
5. normalizar entrada;
6. verificar conflitos por e-mail e CPF;
7. verificar previamente conflitos ativos por Cliente e escopo quando o Patient já existir;
8. criar ou reconciliar usuário Auth;
9. executar atomicamente:
   - criação/reconciliação de `profiles`;
   - criação/reconciliação de `patients`;
   - criação dos vínculos `partner_clients`;
10. criar profile Cliente com `role = 'cliente'` e `status = 'active'`;
11. enviar convite para definição da própria senha;
12. retornar IDs e estado, sem senha ou link.

## 10. Fluxo de senha e convite

O Parceiro não fornece, conhece, recebe ou redefine a senha do Cliente.

### Estratégia recomendada

Usar geração administrativa de link de convite no backend e envio por provedor de e-mail controlado:

1. gerar link de tipo `invite`;
2. não devolver nem registrar o link em logs;
3. concluir a transação relacional;
4. enviar o link para o e-mail do Cliente;
5. Cliente abre uma rota futura de confirmação;
6. Cliente define a senha;
7. login futuro ocorre por e-mail e senha.

Essa ordem evita enviar convite antes da criação de `profiles`, `patients` e vínculos.

Supabase também oferece envio direto de convite por e-mail. Esse caminho é mais simples, mas envia o e-mail antes de haver controle completo sobre a transação relacional. A implementação deverá preferir `generateLink` mais provedor de e-mail quando a infraestrutura estiver disponível.

### Falha no envio

Se Auth e banco já estiverem consistentes, falha de e-mail não deve apagar o Cliente:

- marcar a entrega como pendente em mecanismo durável futuro;
- permitir reenvio idempotente;
- responder sem expor link;
- não criar novo Auth user em cada tentativa.

São decisões pendentes:

- provedor de e-mail;
- template;
- domínio remetente;
- tempo de expiração;
- rota web/mobile de conclusão;
- política de reenvio e rate limit.

## 11. Fluxo de múltiplos escopos

Na criação:

- cada item de `serviceScopes` gera uma linha em `partner_clients`;
- todos usam o mesmo `partner_id` e `patient_id`;
- cada linha tem seu próprio `service_scope`;
- status inicial é `active`.

Depois da criação:

- `manage-client-scopes` recebe `patientId` e escopos desejados;
- valida que o chamador corresponde ao `partner_id` do vínculo;
- adiciona escopos ausentes;
- não reativa silenciosamente vínculos encerrados;
- não altera vínculos de outro Parceiro;
- deixa o índice único parcial resolver corridas concorrentes;
- converte conflitos de unicidade em resposta `409`.

O banco continua sendo a última barreira contra dois Parceiros ativos no mesmo escopo para o mesmo Cliente.

`professional_type` nunca participa dessa validação.

## 12. Validação do chamador

Funções internas devem manter verificação JWT habilitada.

Fluxo mínimo:

1. exigir header `Authorization`;
2. validar JWT antes de executar regra de negócio;
3. obter `auth.uid()`/identidade validada;
4. buscar `profiles` por `user_id`;
5. negar quando profile não existir;
6. negar quando status não for `active`;
7. confirmar role canônica;
8. confirmar extensão correspondente;
9. somente então criar o cliente administrativo.

Não confiar em:

- role recebido no body;
- role em query string;
- `user_metadata.role`;
- rota da interface;
- menu visível;
- informação enviada pelo cliente sobre o próprio `partner_id` ou `admin_id`.

O `partner_id` e o `admin_id` devem ser derivados da identidade autenticada.

## 13. Uso seguro de service role

Regras:

- nunca enviar para browser, Next.js client-side ou aplicativo móvel;
- nunca retornar em resposta;
- nunca registrar em log;
- nunca colocar em documentação com valor real;
- manter somente em secrets do ambiente da função;
- criar o cliente administrativo depois da validação do chamador;
- limitar seu uso ao trecho mínimo de escrita privilegiada;
- preservar constraints e triggers do banco;
- não interpretar bypass de RLS como bypass de regras de negócio.

Secrets de gateway, e-mail e webhooks seguem as mesmas regras.

## 14. Idempotência

### Identificadores

Cada chamada deverá aceitar `idempotencyKey`, gerada pelo cliente por tentativa lógica.

Chaves naturais complementares:

- e-mail normalizado para Auth e `profiles`;
- CPF normalizado, quando presente, para `patients`;
- `profiles.user_id`;
- `partners.profile_id`;
- `patients.profile_id`;
- `(patient_id, service_scope)` para vínculo ativo;
- `(partner_id, patient_id, service_scope)` para vínculo aberto.

### Resultado esperado em repetição

Repetir a mesma operação não deve:

- criar outro usuário Auth;
- criar outro profile;
- criar outra extensão;
- duplicar vínculos;
- reenviar e-mail ilimitadamente.

Se os dados existentes forem equivalentes, retornar o recurso existente. Se e-mail ou CPF apontarem para identidades diferentes, retornar conflito sem mesclar automaticamente.

### Ledger durável recomendado

Para idempotência robusta em produção, criar futuramente uma tabela como `provisioning_operations`, fora do escopo desta fase, com:

- chave idempotente;
- tipo de operação;
- chamador;
- hash seguro da entrada normalizada;
- estado;
- IDs criados;
- tentativa de e-mail;
- erro sanitizado;
- timestamps.

Sem esse ledger, constraints e reconciliação por e-mail/CPF cobrem o MVP, mas não oferecem observabilidade completa para falhas intermediárias.

## 15. Tratamento de falhas parciais

Auth Admin e Postgres não compartilham automaticamente uma única transação.

### Operação relacional

As gravações relacionadas devem ser agrupadas em uma operação transacional interna futura:

- `profiles + partners`;
- ou `profiles + patients + partner_clients`.

Recomendação:

- Edge Function permanece como orquestradora;
- uma RPC interna, sem grant para clientes comuns, executa a parte relacional em uma transação;
- a RPC recebe IDs já validados;
- constraints e triggers continuam ativas.

### Compensação

Se a função criar um Auth user novo e a transação relacional falhar:

- excluir o Auth user somente quando foi criado naquela tentativa;
- nunca excluir usuário preexistente durante reconciliação;
- registrar falha sanitizada;
- permitir retry com a mesma chave.

Se o banco concluir e o e-mail falhar:

- preservar Auth e registros canônicos;
- marcar convite pendente;
- permitir reenvio;
- não repetir toda a criação.

Se a compensação falhar:

- registrar operação para reconciliação;
- retornar erro genérico;
- não esconder o estado incompleto em logs internos;
- não expor detalhes ao cliente.

## 16. Configuração JWT por função

| Função | `verify_jwt` esperado | Validação adicional |
| --- | --- | --- |
| `provision-partner` | habilitado | profile Admin ativo + extensão `admins` |
| `provision-client-for-partner` | habilitado | profile Parceiro ativo + extensão `partners` |
| `manage-client-scopes` | habilitado | Parceiro ativo e ownership do vínculo |
| `provision-admin` | não será pública | segredo operacional/local e procedimento controlado |
| `billing-webhook` | `false` | assinatura do provedor, timestamp e proteção contra replay |

Desabilitar `verify_jwt` não transforma um webhook em seguro. A assinatura deve ser verificada sobre o corpo bruto antes de parsear ou processar o evento.

## 17. Webhooks futuros

`billing-webhook` deverá:

- aceitar somente métodos previstos pelo provedor;
- ler o corpo bruto;
- validar assinatura e timestamp;
- rejeitar replay;
- persistir o identificador único do evento;
- responder rapidamente;
- processar operações idempotentes;
- não confiar em e-mail isoladamente para localizar Parceiro;
- associar customer/subscription a identificadores internos;
- não registrar payloads com dados sensíveis desnecessários;
- suportar reentrega do provedor.

Eventos mínimos futuros:

- checkout concluído;
- assinatura criada;
- assinatura renovada;
- pagamento falhou;
- assinatura cancelada;
- chargeback ou disputa, conforme gateway escolhido.

Planos, subscriptions, entitlements e eventos financeiros exigirão migration própria.

## 18. Contratos HTTP e erros

### Códigos recomendados

| Código | Uso |
| --- | --- |
| `200` | retry idempotente retornando recurso existente |
| `201` | provisionamento criado |
| `400` | payload inválido |
| `401` | JWT ausente ou inválido |
| `403` | profile sem role/status/extensão permitida |
| `409` | conflito de e-mail, CPF ou escopo |
| `422` | estado válido sintaticamente, mas incompatível com a operação |
| `429` | rate limit |
| `500` | falha interna sanitizada |
| `502` | falha de provedor externo, como e-mail |

### Respostas

Podem retornar:

- status da operação;
- IDs de profile/extensão;
- escopos efetivamente criados;
- estado do convite;
- código de erro estável.

Não podem retornar:

- senha;
- token;
- link de convite;
- service role;
- stack trace;
- SQL;
- payload bruto do provedor;
- detalhes internos de constraints.

## 19. CORS, rate limit e auditoria

### CORS

- não usar `Access-Control-Allow-Origin: *` em provisionamento;
- usar allowlist por ambiente para aplicações web;
- aceitar preflight somente com headers necessários;
- CORS não substitui autenticação.

### Rate limit

Aplicar limites por:

- usuário chamador;
- função;
- e-mail alvo normalizado;
- IP quando disponível e apropriado;
- janela de reenvio de convite.

### Auditoria

Registrar de forma estruturada:

- correlation ID;
- execution ID;
- tipo de operação;
- chamador;
- resultado;
- IDs internos necessários;
- duração;
- código de erro sanitizado.

Não registrar CPF completo, senha, token, link ou chave.

Uma tabela de auditoria durável fica para migration futura.

## 20. Testes futuros necessários

### Unitários

- normalização e validação de payload;
- deduplicação de escopos;
- mapeamento seguro de erros;
- CORS por origem;
- rejeição de método;
- ausência de dados sensíveis nas respostas.

### Autenticação e autorização

- sem JWT;
- JWT inválido;
- usuário sem profile;
- profile pending/suspended/disabled;
- Cliente tentando provisionar;
- Parceiro tentando criar outro Parceiro;
- Parceiro ativo criando Cliente;
- Admin ativo criando Parceiro;
- role em metadata divergente do banco.

### Integração local

- criação completa de Parceiro;
- criação completa de Cliente;
- múltiplos escopos;
- conflito de escopo ativo;
- idempotência por e-mail;
- idempotência por CPF;
- retry com mesma chave;
- Auth criado e transação relacional falhando;
- e-mail falhando depois do banco;
- compensação de Auth;
- concorrência de duas chamadas iguais;
- constraints e RLS permanecendo efetivas.

### Convite

- link gerado sem aparecer em logs/resposta;
- envio único;
- reenvio controlado;
- expiração;
- definição da senha pelo usuário;
- Parceiro sem acesso à senha.

### Webhook futuro

- assinatura válida e inválida;
- corpo alterado;
- timestamp expirado;
- evento duplicado;
- reentrega;
- ordem diferente de eventos;
- segredo ausente;
- erro transitório do banco.

### Contrato entre clientes

Next.js e aplicativo móvel devem usar o mesmo contrato HTTP e receber os mesmos códigos e formatos.

## 21. O que fica para fases futuras

- implementação das Edge Functions;
- helpers compartilhados de autenticação, CORS e resposta;
- migration de RPCs transacionais;
- migration de `provisioning_operations`;
- seed local do primeiro Admin;
- script privado de bootstrap em produção;
- provedor e templates de e-mail;
- rota web/mobile para definição de senha;
- rate limiting;
- tabela de auditoria;
- módulo financeiro;
- tabelas de subscriptions e entitlements;
- `billing-webhook`;
- gestão de secrets por ambiente;
- desativação formal das funções legadas;
- integração de Next.js e aplicativo móvel.

## 22. Riscos

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| usar service role antes da autorização | escalada de privilégio | validar JWT, profile, status, role e extensão primeiro |
| confiar em `user_metadata.role` | autorização divergente | consultar sempre `profiles` |
| convite enviado antes do banco | usuário recebe fluxo quebrado | gerar link, concluir banco e depois enviar |
| Auth e banco divergirem | conta órfã ou profile incompleto | transação relacional, compensação e ledger |
| retry duplicar recursos | usuários ou vínculos duplicados | idempotency key, constraints e reconciliação |
| e-mail/CPF conflitarem | mescla indevida de identidades | retornar `409`, nunca mesclar automaticamente |
| CORS aberto | superfície desnecessária | allowlist por ambiente |
| erros detalhados | vazamento de estrutura interna | respostas sanitizadas e correlation ID |
| webhook sem assinatura | fraude de assinatura | validar corpo bruto e assinatura do provedor |
| replay de webhook | alterações repetidas | event ID único e janela de timestamp |
| desativação por inadimplência mal modelada | bloqueio indevido da conta | separar status financeiro de status geral |
| funções legadas permanecerem acessíveis | bypass do modelo novo | desativar/remover em fase controlada antes de produção |

## 23. Divergências com as funções legadas

As funções atuais `create-admin` e `create-patient` não são base para a implementação nova.

Problemas identificados:

- não validam explicitamente o profile do chamador;
- usam CORS aberto;
- recebem ou alteram senha definida por terceiros;
- gravam role em `user_metadata`;
- `create-patient` usa o antigo `patients.user_id`;
- listam usuários Auth para localizar e-mail;
- não coordenam Auth e banco de forma transacional;
- podem retornar mensagens internas do provedor.

Elas devem ser tratadas como implementação legada e substituídas em fase própria, sem alteração nesta documentação.

## 24. Decisões pendentes

- provedor de e-mail e templates;
- rota web/mobile de conclusão do convite;
- convite do Parceiro criado manualmente pelo Admin;
- tempo de expiração e política de reenvio;
- formato definitivo dos payloads;
- tabela `provisioning_operations`;
- RPCs transacionais internas;
- política de compensação e reconciliação manual;
- rate limit e solução técnica;
- gateway de pagamento;
- modelagem de subscription/entitlement;
- efeito de inadimplência sobre `profiles.status`;
- ferramenta de observabilidade e retenção de logs;
- allowlist de origens por ambiente.

## 25. Próximos passos recomendados

1. revisar e aprovar esta estratégia;
2. definir contrato HTTP definitivo de `provision-partner`;
3. definir contrato HTTP definitivo de `provision-client-for-partner`;
4. especificar migration das operações transacionais e ledger de idempotência;
5. escolher provedor de e-mail e fluxo de convite;
6. implementar helpers compartilhados;
7. implementar primeiro `provision-partner`;
8. implementar e testar `provision-client-for-partner`;
9. implementar `manage-client-scopes`;
10. criar seed local e procedimento privado do primeiro Admin;
11. desativar funções legadas antes de conectar o runtime;
12. deixar billing e webhook para fase posterior.

## 26. Referências técnicas oficiais

- [Supabase — segurança e autenticação de Edge Functions](https://supabase.com/docs/guides/functions/auth)
- [Supabase — configuração por função e `verify_jwt`](https://supabase.com/docs/guides/functions/function-configuration)
- [Supabase — secrets e chaves em Edge Functions](https://supabase.com/docs/guides/functions/secrets)
- [Supabase Auth Admin — `inviteUserByEmail`](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- [Supabase Auth Admin — `generateLink`](https://supabase.com/docs/reference/javascript/auth-admin-generatelink)
