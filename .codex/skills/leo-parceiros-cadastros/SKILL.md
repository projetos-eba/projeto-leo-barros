---
name: leo-parceiros-cadastros
description: Use ao alterar a tela /parceiros/cadastros do Projeto Leo Barros, incluindo Base de Protocolos, alimentos, exercícios, importação CSV/TSV, rascunhos de uso em plano, banco/RLS, seeds e testes relacionados.
---

# Leo Parceiros Cadastros

## Contexto

- Rota principal: `/parceiros/cadastros`.
- Menu Parceiros exibe `Cadastro`, mas a página é a `Base de Protocolos`.
- A interface deve seguir o visual dark clinical dashboard já consolidado em Dashboard, Clientes, Agenda e Materiais.
- Use sempre `Clientes`; nunca `Pacientes` na UI Parceiros.
- Não exiba CPF.
- Não exiba `Cardio`; para condicionamento, use `Condicionamento`.

## Banco

- Estrutura oficial fica em migrations.
- Fixtures/smoke ficam em `supabase/seed.sql`.
- Tabelas da tela:
  - `partner_protocol_foods`
  - `partner_protocol_exercises`
  - `partner_protocol_use_drafts`
  - `partner_protocol_events`
- RLS deve isolar por `current_active_partner_id()`.
- Rascunhos com `patient_id` devem exigir Cliente vinculado via `current_partner_has_patient_link(patient_id)`.

## Implementação

- Data layer: `src/lib/partners/protocols-data.ts`.
- Métricas e normalizadores: `src/lib/partners/protocols-metrics.ts`.
- Server actions: `src/app/parceiros/cadastros/actions.ts`.
- View: `src/app/parceiros/cadastros/partner-protocols-view.tsx`.
- A importação de alimentos é CSV/TSV sem dependência nova.
- O botão `Usar em plano` registra rascunho em `partner_protocol_use_drafts`; não simular editor de Dietas/Treinos enquanto essas telas não existirem.

## Validação

- Rodar `npm run test`, `npm run lint`, `npm run build`, `npx supabase test db` e `git diff --check`.
- Testar no navegador `/parceiros/cadastros` em desktop e mobile.
- Conferir sem overflow horizontal global, sem `Pacientes`, sem `Cardio`, drawers funcionando e importação criando alimentos.
