# leo-parceiros-cliente-dietas

Use esta skill ao trabalhar na aba `Dietas` do Cliente em `/parceiros/clientes/[id]?tab=dietas`.

## Contexto

- Visual principal: Figma `1:10828` (`Paciente Dieta`), adaptado para Parceiros.
- A interface deve dizer `Clientes`, nunca `Pacientes`.
- `Cardio` é uma aba própria do perfil do Cliente; Dietas não exibe dados de Cardio dentro do plano alimentar.
- A base de alimentos oficial é `partner_protocol_foods`, criada em `/parceiros/cadastros`.

## Banco

- `partner_client_diet_plans`
- `partner_client_diet_meals`
- `partner_client_diet_meal_items`
- `partner_client_diet_events`
- RPC: `partner_client_diet(patient_id)`
- RLS exige `current_active_partner_id()` e vínculo ativo com o Cliente.

## UI

- Topo: dieta atual, status, data e ações.
- Resumo geral: kcal/macros/água/objetivo.
- Coluna esquerda: plano alimentar por dia, refeições e itens.
- Coluna direita: adicionar alimentos, considerações e histórico.
- `Gerar com IA` não entra na v1.
- `Enviar ao Cliente` é registro interno.

## Testes esperados

- `npm run test`
- `npm run lint`
- `npm run build`
- `npx supabase test db`
- `npm run git:local -- diff --check`
- Smoke Playwright MCP desktop/mobile quando o browser estiver disponível.
