# Parceiros - Cliente - Cardio

## Rota

`/parceiros/clientes/[id]?tab=cardio`

## Objetivo

Aba técnica de prescrição e acompanhamento de Cardio do Cliente individual, baseada no Figma `1:13041`.

## Contrato funcional

- O perfil superior e as abas são compartilhados com Visão Geral, Avaliações, Dietas e Treinos.
- A interface usa `Clientes`; `patients` permanece apenas no schema.
- Cardio é uma exceção deliberada à regra antiga: agora aparece como aba própria no perfil do Cliente.
- Fora desta aba, escopos legados `cardio` continuam agrupados como `Treino` nas telas parceiras existentes.
- O cálculo usa `MET * 3.5 * pesoKg / 200 * minutos`.
- Zonas cardíacas usam `FCmáx = 220 - idade`: Z1 50-60%, Z2 60-70%, Z3 70-80%, Z4 80-90% e Z5 90-100%.
- O realizado semanal vem de sessões registradas, não de edição manual.

## Banco

- `partner_client_cardio_plans`
- `partner_client_cardio_calculations`
- `partner_client_cardio_sessions`
- `partner_client_cardio_events`
- RPC: `partner_client_cardio(patient_id)`

## UI

- KPIs: meta semanal, realizado na semana, kcal estimadas e zona predominante.
- Calculadora editável: peso, duração, meta semanal, atividade principal, comparação e zona-alvo.
- Catálogo orientado a dados em `src/lib/partners/client-cardio-metrics.ts`, agrupado por Caminhada, Corrida, Ciclismo, Natação, Musculação, Esportes, Rotina/sedentário e Outros.
- As chaves legadas de Cardio continuam válidas para preservar histórico. As atividades vindas do print de 2026-08-10 usam a tabela MET aprovada em 2026-08-11 e calculam pela fórmula oficial.
- Gráfico comparativo por duração: 0, 15, 30, 45 e 60 minutos.
- Resumo com kcal, kcal/min, MET e registro compacto de sessão.
- Tabela de zonas cardíacas calculada pelo Cliente.

## Segurança

- RLS usa `current_active_partner_id()` e `current_partner_has_active_patient_link()`.
- Nenhuma resposta da RPC inclui CPF.
- Admin não possui leitura clínica global por bypass da interface.

## Validação

- Unitários de métricas em `client-cardio-metrics.test.ts`.
- Testes da view em `partner-client-cardio-view.test.tsx`.
- SQL em `018_partner_client_cardio.test.sql`.
- Smoke: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=cardio`.

## Fonte MET operacional

- Fórmula: `kcal = MET * 3,5 * peso(kg) / 200 * duração(min)`.
- Tabela aprovada em 2026-08-11 para as atividades do print: Dormir 0,9; Assistir TV 1,1; Caminhada 3,2 km/h 2,5; Caminhada 4,0 km/h 2,9; Musculação leve 3,0; Caminhada 4,8 km/h 3,3; Musculação moderada 3,75; Caminhada 6,0 km/h 3,9; Ciclismo 16 km/h 4,0; Sexo 4,0; Natação leve 4,5; Natação moderada 5,9; Corrida 6,5 km/h 6,0; Ciclismo 20 km/h 6,0; Musculação intensa 6,0; Futebol 8,5; Corrida 9,7 km/h 9,8; Jiu-Jitsu 10,0; Natação competição 11,0; Ciclismo 25 km/h 12,0.
