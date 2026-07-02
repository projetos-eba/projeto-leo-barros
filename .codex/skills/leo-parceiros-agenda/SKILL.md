---
name: leo-parceiros-agenda
description: Use ao trabalhar na tela /parceiros/agenda do Projeto Leo Barros.
---

# Parceiros - Agenda

Antes de alterar a Agenda de Parceiros, leia:

1. `AGENTS.md`
2. `docs/page-profiles/parceiros-agenda.md`
3. `src/app/parceiros/agenda/partner-agenda-view.tsx`
4. `src/app/parceiros/agenda/actions.ts`
5. `src/lib/partners/agenda-data.ts`
6. `src/lib/partners/agenda-metrics.ts`
7. `supabase/migrations/20260630210000_partner_agenda.sql`

Regras obrigatórias:

- A interface usa `Clientes`, nunca `Pacientes`.
- CPF não aparece em tela, drawer, exportação ou logs.
- `Cardio` não aparece como filtro, módulo ou escopo visual.
- Bloqueios ficam em `partner_calendar_blocks`; não criar compromisso sem Cliente para representar indisponibilidade.
- Não adicionar dependência de calendário sem decisão explícita.
- Preservar RLS por parceiro ativo e vínculo com Cliente.
- Validar com testes unitários, SQL e smoke visual quando houver alteração funcional.
