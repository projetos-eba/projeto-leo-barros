# Identidade e Supabase - estado atual

Data de referencia: 29 de junho de 2026.

Este documento substitui os planos historicos de backfill, reset e modelo canonico. Ele descreve o estado atual esperado para desenvolvimento local.

## Runtime

- Next.js App Router e a base oficial do produto.
- O app local roda em `localhost:3000`.
- Supabase local e a base de desenvolvimento validada.
- Supabase remoto, deploy e envio real de e-mail ainda estao fora do escopo atual.

## Identidade canonica

Fonte de verdade:

- `profiles.user_id` vincula a identidade ao Supabase Auth.
- `profiles.role` define o perfil de negocio.
- `profiles.status` define se a conta pode acessar o produto.
- Tabelas de extensao guardam dados especificos por papel.

Roles usadas:

| Role | Prefixo | Extensao | Home |
| --- | --- | --- | --- |
| `admin` | `/admin` | `admins` | `/admin/dashboard` |
| `parceiro` | `/parceiros` | `partners` | `/parceiros/dashboard` |
| `cliente` | `/cliente` | `patients` | `/cliente/inicio` |

Status de acesso:

- `active`: acesso permitido quando o role e a extensao tambem forem validos;
- `pending`, `suspended`, `disabled`: sem destino autenticado comum.

## Tabelas principais

- `profiles`;
- `admins`;
- `partners`;
- `patients`;
- `partner_clients`;
- `provisioning_operations`;
- tabelas operacionais de dashboard admin, assinaturas e pagamentos criadas pelas migrations mais recentes.

## Migrations atuais

As migrations oficiais ficam em `supabase/migrations`:

- `20260622102406_initial_clean_identity_ownership.sql`;
- `20260622190000_provision_partner_support.sql`;
- `20260623090000_provision_client_for_partner_support.sql`;
- `20260628170000_admin_dashboard_operational_domain.sql`;
- `20260629110000_provision_partner_optional_registry.sql`.

Nao reescrever migrations historicas aplicadas. Mudancas novas devem entrar como migration nova.

## Edge Functions atuais

- `signup-partner`;
- `complete-client-first-access`;
- `send-verification-email`;
- `verify-email-token`;
- `send-password-reset-email`;
- `verify-password-reset-token`;
- `update-password-with-token`;
- `provision-partner`;
- `provision-client-for-partner`.

As funcoes publicas de auth validam payload/origem, retornam mensagens
sanitizadas e usam service role apenas dentro do runtime da Edge Function. As
funcoes administrativas exigem JWT, validam `profiles` e a extensao do
chamador, usam service role apenas depois da autorizacao e retornam respostas
sem senha, token, link de convite ou segredo. O app Next nao carrega client
admin Supabase.

## Regras de autorizacao

- `user_metadata.role` nao participa de decisao sensivel.
- O browser usa somente chaves publicas destinadas ao cliente.
- Service role e secrets ficam fora do Next client-side e das Server Actions.
- RLS e validacoes server-side continuam sendo a barreira final.
- Vínculos entre Parceiro e Cliente passam por `partner_clients`.

## Pendencias de produto

- experiencia final para conta inativa;
- envio real de convites por e-mail;
- fluxo definitivo de formularios atribuidos ao Cliente;
- billing real e webhooks;
- Supabase remoto e deploy.
