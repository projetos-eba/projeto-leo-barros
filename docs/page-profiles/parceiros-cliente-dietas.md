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
- Execução diária do Cliente: `client_diet_daily_logs`, `client_diet_meal_logs` e `client_diet_events`.
- Status do plano alimentar: `draft`, `scheduled`, `active`, `superseded`, `archived`.
- `Enviar ao Cliente` registra comunicação do plano, mas não altera o status funcional da dieta.
- Alimentos vêm de `partner_protocol_foods` e itens preservam snapshot nutricional.
- RPC: `partner_client_diet(patient_id)`.
- Acompanhamento da execução é enriquecido no servidor a partir dos logs diários reais do Cliente, respeitando RLS de parceiro vinculado.
- RLS: apenas parceiro autenticado com vínculo ativo ao Cliente.

## Funcionalidades

- Cabeçalho do Cliente, abas alinhadas e `Dietas` implementada.
- Resumo reativo ao dia e cardápio ativos: balanço energético com GET aplicado, VET real e gauge de ±30%; macronutrientes com proteína, carboidrato, gordura e fibra; distribuição calórica proporcional por refeição.
- Água permanece como meta compacta junto ao atalho de configuração. A meta de fibra é uma faixa opcional por plano; planos históricos sem configuração mostram meta não definida.
- Plano alimentar por dia da semana, refeições e itens.
- Busca e adição de alimentos da base de Cadastro, com autocomplete compacto acima do botão `Adicionar alimento` dentro de cada refeição; a lista suspensa deve aparecer durante a digitação, fechar ao clicar fora e não abrir uma tabela fixa abaixo do card.
- Sugestões usam rascunhos `partner_protocol_use_drafts` com `plan_context = dieta`.
- Editar porção, remover alimento/refeição, adicionar refeição, duplicar dieta, ativar plano, enviar aviso internamente e exportar PDF via impressão local.
- Considerações da dieta e histórico de alterações.
- Acompanhamento da execução dos últimos 7 dias recolhido por padrão, com resumo minimalista e expansão para adesão, refeições realizadas/parciais/puladas, pendências, água média, kcal estimadas consumidas por dia, fotos e observações enviadas pelo Cliente.

## Regras

- Interface Parceiros usa `Clientes`, nunca `Pacientes`.
- Não exibir CPF.
- `Cardio` é uma aba própria do perfil do Cliente; Dietas não exibe dados de Cardio dentro do plano alimentar.
- O Cliente só consome o plano `active` vigente; novas dietas nascem como `draft`.
- Ao ativar uma dieta, planos `active` ou `scheduled` anteriores do mesmo Cliente passam para `superseded`.
- `Enviar ao Cliente` é registro interno de comunicação nesta fase; não cria portal nem envio externo.
- A execução diária do Cliente registra refeições como `completed`, `partial`, `skipped` ou `pending`.
- A navegação diária em `/cliente/dieta?date=YYYY-MM-DD` deve preservar logs por data.
- Registros parciais entram como estimativa operacional de adesão, não como consumo nutricional exato.
- VET é a soma dos snapshots nutricionais das refeições exibidas. Balanço é `VET - GET`; a faixa central de equilíbrio é ±5% do GET. Percentuais de proteína, carboidrato e gordura usam 4, 4 e 9 kcal/g sobre o VET.
- GET ausente, peso ausente, cardápio sem alimentos e VET zero não exibem percentuais artificiais.
- Observações e anexos de registros ficam acessíveis por dialog ou drawer, sem alongar a lista de últimos registros.
- A aba do Parceiro separa prescrição de acompanhamento: o editor continua sendo a fonte da prescrição, e o painel de execução mostra o retorno real do Cliente.
- `Gerar com IA` do Figma não aparece na v1 para evitar ação falsa.

## Validações

- Unitários: cálculo por porção, balanço energético, posição do gauge, g/kg, percentuais energéticos, distribuição por refeição, agregação de plano, sugestões e kcal estimada a partir dos registros.
- View: render, busca inline/adicionar alimento, edição de porção, salvar considerações, publicar/enviar, ausência de termos proibidos.
- SQL: tabelas, RPC, RLS entre parceiros e vínculo ativo obrigatório.
- Smoke Playwright: desktop/mobile, console limpo e sem overflow horizontal.

## Busca local — atualização de 09/09/2026

- Campo e resultados têm estado próprio; digitar não renderiza toda a prescrição nem chama o servidor.
- Busca ignora acentos e caixa, com índice preparado quando o catálogo muda.
- Sugestões inline limitadas a seis; biblioteca lateral mostra 30 itens por vez com `Carregar mais`.
- Escape e perda de foco fecham a busca inline; somente a seleção explícita adiciona itens.
