# Parceiros - Cliente - Avaliações

## Rota

- `/parceiros/clientes/[id]?tab=avaliacoes`

## Objetivo

Área técnica do Cliente individual para avaliações corporais, dobras cutâneas, circunferências, histórico de medidas, cálculo calórico dinâmico e análise gráfica.

## Regras de Produto

- A interface usa sempre `Clientes`; `patients` permanece apenas como nome técnico do schema.
- `Cardio` não aparece como aba, filtro ou módulo separado.
- As demais abas profundas continuam bloqueadas até implementação específica.
- `Aplicar ao plano` salva um snapshot aplicado como referência do plano atual; não cria editor de dieta nesta etapa.

## Dados

- RPC principal: `partner_client_assessments(patient_id)`.
- Tabelas clínicas:
  - `partner_client_assessments`
  - `partner_client_assessment_circumferences`
  - `partner_client_assessment_skinfolds`
  - `partner_client_calorie_calculations`
- A action de nova avaliação também grava `partner_client_body_measurements` para manter a Visão Geral atualizada.

## UX

- KPIs: peso, gordura corporal, massa muscular, massa magra, IMC e última avaliação.
- Metodologias no topo: Mifflin-St Jeor, Harris-Benedict, Cunningham e Tinsley, com método físico `Pollock 7`, `Pollock 3`, `Bioimpedância` ou `Manual técnico`.
- Cálculo calórico: dados do Cliente ao lado da projeção, eixo Y dinâmico e card azul de calorias para objetivo.
- Avaliação física: dobras cutâneas e circunferências reais salvas em tabelas normalizadas, com histórico lateral.
- Análise gráfica: composição corporal, distribuição de dobras e painel de circunferências com modos `Dinâmico/Stack`, `Geral/Por região/Radar`.
- Drawer/modal: nova avaliação com dados corporais, metodologia, dobras, circunferências, meta, prazo, atividade e observações.

## Segurança

- Leitura e escrita restritas ao parceiro autenticado com vínculo ativo ao Cliente.
- Admin não possui leitura clínica global.
- RPC não expõe CPF.

## Validação

- Unitários de métricas em `client-assessments-metrics.test.ts`.
- Testes da view em `partner-client-assessments-view.test.tsx`.
- SQL em `016_partner_client_assessments.test.sql`.
