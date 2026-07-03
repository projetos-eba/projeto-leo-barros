# Parceiros · Cliente · Dietas

## Rota

- `/parceiros/clientes/[id]?tab=dietas`

## Objetivo

Aba técnica de plano alimentar do Cliente no perfil Parceiros, baseada no Figma `1:10828`. A tela usa a base de alimentos de `/parceiros/cadastros`, calcula macros por porção e mantém histórico do plano.

## Banco e Dados

- Planos: `partner_client_diet_plans`.
- Refeições: `partner_client_diet_meals`.
- Itens: `partner_client_diet_meal_items`.
- Histórico: `partner_client_diet_events`.
- Alimentos vêm de `partner_protocol_foods` e itens preservam snapshot nutricional.
- RPC: `partner_client_diet(patient_id)`.
- RLS: apenas parceiro autenticado com vínculo ativo ao Cliente.

## Funcionalidades

- Cabeçalho do Cliente, abas alinhadas e `Dietas` implementada.
- Resumo geral com kcal, proteínas, carboidratos, gorduras, água e objetivo calórico.
- Plano alimentar por dia da semana, refeições e itens.
- Busca e adição de alimentos da base de Cadastro.
- Sugestões usam rascunhos `partner_protocol_use_drafts` com `plan_context = dieta`.
- Editar porção, remover alimento/refeição, adicionar refeição, duplicar dieta, publicar, enviar internamente e exportar PDF via impressão local.
- Considerações da dieta e histórico de alterações.

## Regras

- Interface Parceiros usa `Clientes`, nunca `Pacientes`.
- Não exibir CPF.
- `Cardio` é uma aba própria do perfil do Cliente; Dietas não exibe dados de Cardio dentro do plano alimentar.
- `Enviar ao Cliente` é registro interno nesta fase; não cria portal nem envio externo.
- `Gerar com IA` do Figma não aparece na v1 para evitar ação falsa.

## Validações

- Unitários: cálculo por porção, distribuição macro, agregação de plano e sugestões.
- View: render, busca/adicionar alimento, edição de porção, salvar considerações, publicar/enviar, ausência de termos proibidos.
- SQL: tabelas, RPC, RLS entre parceiros e vínculo ativo obrigatório.
- Smoke Playwright: desktop/mobile, console limpo e sem overflow horizontal.
