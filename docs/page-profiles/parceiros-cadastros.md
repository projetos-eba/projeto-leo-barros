# Parceiros · Cadastro

## Rota

- `/parceiros/cadastros`
- Item de menu exibido como `Cadastro`.

## Objetivo

Base reutilizável de protocolos do parceiro, com alimentos e exercícios usados posteriormente nas telas de Dietas e Treinos. A experiência mantém o padrão dark clinical dashboard do perfil Parceiros, com alta densidade, cards translúcidos, azul primário e linguagem sempre orientada a `Clientes`.

## Banco e Dados

- Alimentos: `partner_protocol_foods`.
- Exercícios: `partner_protocol_exercises`.
- Rascunhos de uso em plano: `partner_protocol_use_drafts`.
- Histórico: `partner_protocol_events`.
- Todas as tabelas usam RLS por `current_active_partner_id()`.
- Rascunhos associados a Cliente exigem vínculo ativo via `current_partner_has_patient_link(patient_id)`.
- Importação de alimentos aceita CSV/TSV exportado de planilha, sem dependência externa.

## Funcionalidades

- Alternância entre `Base de Alimentos` e `Biblioteca de Exercícios`.
- Busca, filtros por categoria/origem ou grupo/equipamento, status e modos tabela/cards.
- Drawer de novo/editar alimento com porção, macros, micronutrientes, tags e usos sugeridos.
- Drawer de novo/editar exercício com grupo, equipamento, nível, objetivo, prescrição padrão, vídeo YouTube/Vimeo e orientações.
- Drawer `Importar base` para alimentos via CSV/TSV.
- Botão `Usar em plano` registra rascunho no banco para uso futuro em Dietas/Treinos.
- Arquivamento reversível preserva registros e histórico.

## Regras

- Não usar `Pacientes` na interface Parceiros.
- Não exibir CPF.
- Não exibir `Cardio`; quando houver condicionamento, usar linguagem de `Condicionamento`.
- `Cadastro` guarda bases reutilizáveis, não dados clínicos individuais.

## Validações

- Unitários: métricas, parser CSV/TSV, normalização de vídeo e interações da view.
- SQL: existência de tabelas, RLS entre parceiros e bloqueio de rascunho para Cliente sem vínculo.
- Smoke: desktop e mobile sem overflow horizontal, sem `Pacientes`, sem `Cardio`, drawers e importação funcionando.
