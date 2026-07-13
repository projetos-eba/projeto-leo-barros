# Documentacao do Projeto Leo Barros

Data de referencia: 29 de junho de 2026.

Esta pasta guarda apenas a documentacao de trabalho do projeto. Documentos de migracao, auditorias antigas e planos ja superados foram movidos para `archive/2026-06-docs-cleanup`.

## Fonte viva

Leia estes documentos como fonte atual:

| Documento | Uso |
| --- | --- |
| `fase-f0-next-oficial.md` | Decisao de base: Next.js App Router e o runtime oficial do produto. |
| `identidade-supabase-atual.md` | Estado atual de identidade, roles, tabelas, migrations e Edge Functions. |
| `integracao-local-next-supabase.md` | Como o app Next conversa com o Supabase local. |
| `sitemap-projeto-leo-barros.md` | Arquitetura alvo de rotas por Cliente, Parceiros e Admin. |
| `DESIGN_SYSTEM.md` | Fundacao visual, tokens e padroes de interface. |
| `contrato-provision-partner-edge-function.md` | Contrato da Edge Function de cadastro de Parceiro. |
| `contrato-provision-client-for-partner-edge-function.md` | Contrato da Edge Function de cadastro de Cliente pelo Parceiro. |
| `page-profiles/admin-dashboard.md` | Perfil funcional da tela Admin > Visao Geral. |
| `page-profiles/admin-profissionais.md` | Perfil funcional da tela Admin > Profissionais. |
| `page-profiles/admin-financeiro.md` | Perfil funcional da tela Admin > Financeiro & Planos. |

## Estado implementado hoje

Rotas Next implementadas no produto atual:

- `/login`;
- `/admin/dashboard`;
- `/admin/profissionais`;
- `/admin/financeiro`;
- `/parceiros/dashboard`;
- `/cliente/inicio`.

O sitemap inclui rotas alvo ainda nao implementadas. Quando houver divergencia entre sitemap e codigo, o page profile da tela implementada e o codigo em `src/app` prevalecem.

## Convencoes

- Interface usa "Clientes", nao "Pacientes", exceto quando o documento fala explicitamente da tabela tecnica `patients`.
- `profiles.role` e `profiles.status` sao a fonte canonica de autorizacao.
- `user_metadata.role` nao deve decidir permissao sensivel.
- Service role nunca fica no browser.
- Documentos em `archive` podem explicar contexto, mas nao devem ser usados como plano atual sem revisao.
