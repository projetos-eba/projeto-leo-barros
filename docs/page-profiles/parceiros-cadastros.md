# Parceiros · Cadastro

## Rota

- `/parceiros/cadastros`
- Item de menu exibido como `Cadastro`.

## Objetivo

Base reutilizável de protocolos do parceiro, com alimentos e exercícios usados posteriormente nas telas de Dietas e Treinos. A experiência mantém o padrão dark clinical dashboard do perfil Parceiros, com alta densidade, cards translúcidos, azul primário e linguagem sempre orientada a `Clientes`.

## Banco e Dados

- Catálogo global de alimentos: `system_foods`.
- Catálogo global de exercícios: `system_exercises`.
- Versões de mídia oficiais dos exercícios: `system_exercise_media`.
- Alimentos: `partner_protocol_foods`.
- Exercícios: `partner_protocol_exercises`.
- Auditoria de importações: `catalog_import_batches` e `catalog_import_items`.
- Rascunhos de uso em plano: `partner_protocol_use_drafts`.
- Histórico: `partner_protocol_events`.
- Tabelas privadas usam RLS por `current_active_partner_id()`.
- Catálogos globais expõem apenas registros publicados para usuários autenticados e não aceitam escrita de parceiros.
- Alimentos importados preservam `system_food_id`, snapshot da fonte, versão e checksum.
- Exercícios importados preservam `system_exercise_id`, snapshot da fonte, checksum, versão e caminhos de mídia quando disponíveis.
- Rascunhos associados a Cliente exigem vínculo ativo via `current_partner_has_patient_link(patient_id)`.
- Importação de alimentos aceita CSV/TSV exportado de planilha, sem dependência externa.
- Importação TACO usa seed versionado gerado por `scripts/dev/ingest-taco-foods.mjs` a partir de `tabelas_nutricionais.xlsx`.

## Funcionalidades

- Alternância entre `Base de Alimentos` e `Biblioteca de Exercícios`.
- Busca, filtros por categoria/origem ou grupo/equipamento, status e modos tabela/cards.
- Drawer de novo/editar alimento com porção, macros, micronutrientes, tags e usos sugeridos.
- Drawer de novo/editar exercício com grupo, equipamento, nível, objetivo, prescrição padrão, vídeo YouTube/Vimeo e orientações.
- Drawer `Importar TACO` para alimentos globais com busca, categoria TACO, macronutriente, seleção da página, seleção dos resultados filtrados, importação selecionada e importação total.
- Drawer `Exercícios oficiais` com busca, grupo muscular, equipamento, seleção em lote, indicação de itens já importados, poster inicial e preview animado sob demanda.
- Drawer `CSV/TSV` para alimentos via planilha própria do parceiro.
- Botão `Usar em plano` registra rascunho no banco para uso futuro em Dietas/Treinos.
- Arquivamento reversível preserva registros e histórico.

## Regras

- Não usar `Pacientes` na interface Parceiros.
- Não exibir CPF.
- Não exibir `Cardio`; quando houver condicionamento, usar linguagem de `Condicionamento`.
- `Cadastro` guarda bases reutilizáveis, não dados clínicos individuais.
- Importar novamente o mesmo item global não gera duplicata; a chave única é `partner_id + system_*_id`.
- Itens arquivados podem ser reativados por nova importação.
- Customizações locais não alteram o catálogo global.
- Valores nulos da fonte TACO permanecem nulos no snapshot; campos operacionais privados respeitam constraints legadas.
- Resíduos negativos da TACO são preservados no snapshot e zerados apenas nos campos operacionais privados.
- Mídias oficiais de exercícios usam o bucket público `system-exercise-media`; escrita é restrita a Admin e extensões aceitas são GIF/WebP/PNG/JPEG.
- A carga oficial de GIFs usa `scripts/dev/ingest-exercise-media.mjs`, manifesto em `supabase/seed-data/system-exercises.manifest.json` e paths versionados por checksum (`exercise-library/<exercise-code>/<checksum-curto>/source.gif`, `poster.webp`, `preview.webp`).
- A listagem carrega `poster.webp` inicialmente; `preview.webp` é carregado apenas por hover/foco/toque e respeita `prefers-reduced-motion`. `source.gif` fica preservado como mestre/fallback e não é baixado na abertura normal da grade.

## Validações

- Unitários: métricas, contrato da carga TACO, parser CSV/TSV, normalização de vídeo e interações da view.
- SQL: existência de tabelas, RLS entre parceiros, importação idempotente, bloqueio de edição global, bloqueio de Storage para parceiro comum e bloqueio de rascunho para Cliente sem vínculo.
- Smoke: desktop e mobile sem overflow horizontal, sem `Pacientes`, sem `Cardio`, drawers e importação funcionando.

## Integração com onboarding

- `/parceiros/cadastros` é a rota real para profissionais novos e existentes montarem suas bibliotecas.
- `/parceiros/onboarding` está previsto no sitemap, mas não está implementado no App Router nos arquivos analisados.
- Quando o onboarding de Parceiros for implementado, os CTAs `Monte sua biblioteca de alimentos` e `Escolha exercícios para começar` devem navegar para `/parceiros/cadastros`, sem bloquear o acesso ao dashboard caso o parceiro pule a etapa.
