# Fase F.0 - Next.js como app oficial

Data de referencia: 29 de junho de 2026.

## Decisao

O Next.js App Router e a base oficial do produto Leo Barros. A camada Vite/React Router nao e mais o caminho funcional principal para novas telas, regras de autenticacao, nomenclatura ou schema.

## Base atual

- Rotas Next validadas: `/login`, `/admin/dashboard`, `/admin/profissionais`, `/parceiros/dashboard` e `/cliente/inicio`.
- Autenticacao Next com `@supabase/ssr` e cookies.
- Autorizacao baseada em `profiles.role` e `profiles.status`.
- Clients Supabase em `src/lib/supabase`.
- Componentes compartilhados em `src/components/ui`, `src/components/auth` e `src/components/shells`.
- Edge Functions oficiais: `provision-partner` e `provision-client-for-partner`.
- Migrations limpas em `supabase/migrations`.

## Fora do escopo atual

- Supabase remoto.
- Deploy.
- Envio real de e-mail ou Resend.
- Billing real e webhooks.
- Migrar a antiga rota publica `/form/:token`.

## Regra de leitura

Documentos historicos que descrevem Vite como aplicacao principal, Next como paralelo, ou entidades canonicas como "a criar" devem ser lidos apenas como contexto de migracao.
