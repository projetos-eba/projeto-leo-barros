# Parceiros - Agenda

## Rota

- `/parceiros/agenda`
- Shell autenticado: `profile="parceiros"`
- Acesso: somente perfil `parceiro` ativo.

## Objetivo

Dar ao parceiro uma agenda operacional para visualizar, criar, remarcar, confirmar e cancelar compromissos com Clientes, além de bloquear horários sem vínculo com Cliente.

## Referências Visuais

- Não há frame Figma dedicado nesta fase.
- Referências anexadas no ciclo de implementação: agenda em tema escuro com views Mês, Semana, Dia e drawer de Novo compromisso.
- A tela segue tokens já usados em Parceiros: fundo `#0b1720`, sidebar `#0e151a`, cards translúcidos, azul primário `#1d7ece`, azul informativo `#68afe9`, bordas `#263747`/`#314353`.

## Fontes de Dados

- `partners`: parceiro autenticado.
- RPC `partner_clients_list`: lista de Clientes vinculados usada no seletor e filtros.
- `partner_client_appointments`: compromissos vinculados a Clientes.
- `partner_calendar_blocks`: bloqueios de horários sem Cliente.
- `patients` e `profiles`: identidade mínima do Cliente para cards e detalhes.

## Experiência

- Topo com título, subtítulo, seletor Mês/Semana/Dia, filtros e botão `Novo compromisso`.
- Mês: calendário mensal com compromissos agregados e bloqueios.
- Semana: grade horária com eventos posicionados por horário e legenda.
- Dia: timeline do dia, painel de detalhes e próximos atendimentos.
- Drawer: criação/edição de compromisso e criação de bloqueio.
- Ações: confirmar, cancelar, remarcar por modal, salvar compromisso e bloquear horário.

## Privacidade e Linguagem

- Interface usa sempre `Clientes`.
- Não exibe CPF.
- Não exibe `Cardio`; se surgir escopo legado em clientes, deve ser tratado como `Treino` na camada de métricas.
- “Profissional responsável” é o parceiro autenticado nesta versão.

## Estados

- Agenda com compromissos e bloqueios.
- Agenda vazia.
- Dia sem compromissos.
- Sem cadastro `partners`: tela vazia com nome genérico.
- Cliente inexistente no seletor: botão de salvar fica indisponível.
- Erros de validação e erros de server action aparecem como feedback inline.

## Arquivos

- `src/app/parceiros/agenda/page.tsx`
- `src/app/parceiros/agenda/partner-agenda-view.tsx`
- `src/app/parceiros/agenda/actions.ts`
- `src/lib/partners/agenda-data.ts`
- `src/lib/partners/agenda-metrics.ts`
- `supabase/migrations/20260630210000_partner_agenda.sql`
- `supabase/tests/013_partner_agenda.test.sql`

## Validação

- `src/lib/partners/agenda-metrics.test.ts`
- `src/app/parceiros/agenda/partner-agenda-view.test.tsx`
- `supabase/tests/013_partner_agenda.test.sql`
- Smoke recomendado: login parceiro, abrir `/parceiros/agenda`, alternar Mês/Semana/Dia, criar compromisso, bloquear horário, confirmar/cancelar/remarcar, desktop/mobile e console limpo.
