# Parceiros - Cliente - Exames

## Rota

`/parceiros/clientes/[id]?tab=exames`

## Objetivo

Aba de exames laboratoriais do Cliente individual, baseada no Figma `1:13744`, com dashboard, registro de resultados e configuração do catálogo do parceiro.

## Contrato funcional

- O perfil superior e as abas são compartilhados com Visão Geral, Avaliações, Dietas, Treinos e Cardio.
- A interface usa `Clientes`; `patients` permanece apenas no schema.
- `Exames` e `Fotos` agora são abas implementadas; Anamnese, Prescrições e Formulários seguem bloqueadas.
- `Configurações` edita o catálogo do parceiro inteiro.
- Resultados salvos preservam snapshot de exame, categoria, unidade, conversão e referência usada.
- O catálogo base vem de `exames-catalogo.md`: 72 exames em 11 categorias.

## Banco

- `partner_exam_categories`
- `partner_exam_definitions`
- `partner_exam_reference_ranges`
- `partner_exam_alternative_units`
- `partner_client_exam_collections`
- `partner_client_exam_results`
- `partner_client_exam_events`
- RPC: `partner_client_exams(patient_id)`

## UI

- Subabas internas: Dashboard, Resultados e Configurações.
- Dashboard: KPIs, alertas fora da referência, categorias expansíveis e mini gráficos.
- Resultados: histórico lateral, data da coleta, inputs por exame, unidade alternativa quando existir, limpar e salvar.
- Configurações: busca, edição/criação/arquivamento de exames, faixas de referência e conversões.

## Segurança

- RLS usa `current_active_partner_id()` e `current_partner_has_active_patient_link()`.
- Nenhuma resposta da RPC inclui CPF.
- Admin não possui leitura clínica global por bypass da interface.

## Validação

- Unitários de métricas em `client-exams-metrics.test.ts`.
- Testes da view em `partner-client-exams-view.test.tsx`.
- SQL em `019_partner_client_exams.test.sql`.
- Smoke: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=exames`.
