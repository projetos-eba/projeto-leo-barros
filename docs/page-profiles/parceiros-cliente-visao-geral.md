# Parceiros - Cliente Visao Geral

## Rota

- `/parceiros/clientes/[id]`
- Aba default: `Visao Geral`
- Shell autenticado: `profile="parceiros"`
- Acesso: somente parceiro ativo com vinculo ao Cliente solicitado.

## Objetivo

Entregar ao parceiro uma visao operacional individual do Cliente, com dados de acompanhamento, plano atual, tarefas, alertas, historico e agendamento. Abas profundas aparecem bloqueadas apenas ate serem implementadas uma a uma.

## Figma

- Arquivo: `Projeto-Leo-Barros-Atualizado`
- Node: `1:8648`
- Nome do frame: `Paciente Visao Geral`
- Adaptacao de linguagem: usar `Clientes` na interface; `patients` permanece apenas no schema tecnico.

## Fontes de dados

- RPC `partner_client_overview(patient_id)`: retorna somente os campos necessarios ao parceiro vinculado.
- `patients`: identidade minima, `gender` e `avatar_url`.
- `partner_clients`: vinculo, status e escopos.
- `partner_client_goals`: metas de peso, gordura e adesao.
- `partner_client_body_measurements`: peso e gordura corporal; massa magra/gorda sao calculadas no frontend/data layer.
- `partner_client_adherence_snapshots`: adesao semanal de dieta e treino.
- `partner_client_appointments`: consultas agendadas e concluidas.
- `partner_client_observations`: registros resumidos e alertas.
- `partner_client_tasks`: checklist operacional.
- `partner_client_plan_modules`: resumo dos modulos do plano personalizado.
- `partner_client_plan_subscriptions`: assinatura personalizada e renovacao.

## Privacidade

- CPF, `user_id` e dados de outros parceiros nao aparecem na RPC, tela, drawers ou PDF.
- Admin nao possui leitura global das tabelas clinicas criadas nesta entrega.
- `Cardio` e `Exames` sao abas próprias implementadas no perfil do Cliente. Em demais telas parceiras, dados legados de `cardio` continuam agrupados como `Treino`.
- PDF usa `window.print()` e oculta controles interativos.

## Experiencia

- Cabecalho com avatar, nome, status, idade, genero, nascimento, telefone, periodo do plano, objetivo e modulos ativos.
- KPIs: peso atual, gordura corporal, adesao geral, proxima consulta e alertas.
- Blocos: evolucao corporal, desempenho semanal, ultimos registros, resumo do plano atual e checklist de tarefas.
- Acoes: Historico completo, Exportar PDF, Mensagem via WhatsApp e Agendar consulta.
- Tarefas podem ser criadas e concluidas/reabertas.
- Alertas abrem drawer com observacoes de atencao, baixa adesao e tarefas relevantes.

## Estados

- Cliente com dados completos.
- Cliente sem medicoes, sem plano, sem agenda ou sem tarefas.
- Cliente inexistente ou nao autorizado: `not-found`.
- Loading de navegacao.
- Erro de validacao em agendamento e tarefa.
- Mobile: abas com scroll interno e grids reorganizados sem overflow global.

## Arquivos

- `src/app/parceiros/clientes/[id]/page.tsx`
- `src/app/parceiros/clientes/[id]/partner-client-overview-view.tsx`
- `src/app/parceiros/clientes/[id]/client-overview-chart.tsx`
- `src/app/parceiros/clientes/[id]/actions.ts`
- `src/lib/partners/client-overview-data.ts`
- `src/lib/partners/client-overview-metrics.ts`
- `supabase/migrations/20260630173000_partner_client_overview.sql`
- `supabase/seed.sql`
- `public/avatars/ana-ribeiro-seed.png`

## Validacao

- `src/lib/partners/client-overview-metrics.test.ts`
- `src/app/parceiros/clientes/[id]/partner-client-overview-view.test.tsx`
- `supabase/tests/012_partner_client_overview.test.sql`
- Smoke Playwright: login parceiro, abrir a partir da listagem, filtros, drawers, tarefa, agendamento, desktop/mobile e console limpo.
