# Fase F.0 - Next.js como app oficial

Data de referencia: 28 de junho de 2026.

## Decisao

O Next.js App Router passa a ser a base oficial do produto Leo Barros. A camada Vite/React Router foi removida do caminho funcional principal para evitar divergencia de rotas, autenticacao, nomenclatura e schema.

## Base preservada

- Rotas Next oficiais ja validadas: /login, /admin/dashboard, /parceiros/dashboard e /cliente/inicio.
- Autenticacao Next com @supabase/ssr e cookies.
- Autorizacao baseada em profiles.role e profiles.status.
- Clients Supabase em src/lib/supabase.
- Componentes compartilhados em src/components/ui, src/components/auth e src/components/shells.
- Edge Functions oficiais: provision-partner e provision-client-for-partner.
- Migrations limpas em supabase/migrations.

## Fora do escopo

- Supabase remoto.
- Deploy.
- Envio real de e-mail ou Resend.
- Novas telas ou ajuste visual do Admin.
- Implementacao de /admin/profissionais.
- Migrar a antiga rota publica /form/:token.

## Observacao

Documentos historicos que descrevem Vite como aplicacao principal devem ser lidos como contexto de migracao, nao como fonte atual de runtime.
