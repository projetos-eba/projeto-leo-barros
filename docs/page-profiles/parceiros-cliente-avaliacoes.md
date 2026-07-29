# Parceiros - Cliente - Avaliações

## Rota

- `/parceiros/clientes/[id]?tab=avaliacoes`

## Objetivo

Área técnica do Cliente individual para avaliações corporais, dobras cutâneas, circunferências, histórico de medidas, cálculo calórico dinâmico e análise gráfica.

## Regras de Produto

- A interface usa sempre `Clientes`; `patients` permanece apenas como nome técnico do schema.
- `Cardio` é uma aba própria do perfil do Cliente; esta aba de Avaliações não mistura dados de Cardio.
- `Anamnese`, `Prescrições`, `Formulários`, `Cardio`, `Exames` e `Fotos` agora são abas implementadas no perfil individual do Cliente.
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
- Metodologias no topo: Mifflin-St Jeor, Harris-Benedict, Cunningham e Tinsley, com método físico `3 dobras Guedes`, `3 dobras Jackson & Pollock`, `4 dobras Durnin & Womersley`, `4 dobras Faulkner`, `7 dobras Jackson, Pollock & Ward`, `Bioimpedância` ou `Manual técnico`.
- Bio do Cliente: edição de nascimento, sexo biológico e objetivo a partir do header do perfil individual.
- Cálculo calórico: dados do Cliente ao lado da projeção de meta por peso ao longo do tempo, eixo Y dinâmico e card azul de calorias para objetivo.
- Avaliação física: resultado calculado da última avaliação, faixas de IMC/% gordura/FFMI, dobras cutâneas e circunferências reais salvas em tabelas normalizadas.
- Histórico de avaliações: tabela técnica com data, protocolo, peso, IMC, FFMI, percentual de gordura, massa magra e massa gorda, com ações para visualizar e editar uma avaliação específica.
- Análise gráfica: composição corporal, distribuição de dobras e painel de circunferências com seleção de variáveis e modos `Dinâmico/Stack`, `Geral/Por região/Radar`.
- Drawer/modal: nova avaliação e edição de avaliação existente com dados corporais, metodologia, dobras, circunferências, meta, prazo, atividade e observações.

## Segurança

- Leitura e escrita restritas ao parceiro autenticado com vínculo ativo ao Cliente.
- Admin não possui leitura clínica global.
- RPC não expõe CPF.

## Validação

- Unitários de métricas em `client-assessments-metrics.test.ts`.
- Testes da view em `partner-client-assessments-view.test.tsx`.
- SQL em `016_partner_client_assessments.test.sql`.
