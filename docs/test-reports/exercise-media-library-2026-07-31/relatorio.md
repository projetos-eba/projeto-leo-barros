# Relatorio final - Biblioteca global de exercicios com midias

Data: 2026-07-31

## Resumo

- Origem local validada: `/Users/antoniofelipe/Downloads/exercicios-gifs`.
- Arquivos GIF encontrados: 236.
- GIFs validos: 236.
- GIFs invalidos: 0.
- GIFs animados: 235.
- GIFs estaticos: 1.
- Duplicados por checksum: 0.
- Ambiguos: 0.
- Exercicios publicados no catalogo global: 236.
- Midias publicadas: 236 linhas em `system_exercise_media`.
- Objetos publicados no Storage: 708 (`source.gif`, `poster.webp`, `preview.webp` para cada exercicio).

Cada arquivo gerou um exercicio global com nome derivado do nome do arquivo, slug normalizado e codigo estavel preservado em manifesto versionado. Campos tecnicos nao fornecidos pela fonte, como grupo muscular, equipamento e dificuldade, permanecem `null` no catalogo global.

## Performance

- Tamanho original total: 1.842.614.936 bytes.
- Tamanho total dos posters: 5.741.538 bytes.
- Tamanho total dos previews: 423.601.630 bytes.
- Reducao aproximada de poster + preview em relacao aos GIFs originais: 76,7%.
- Maior original: `Rosca de bíceps na máquina` com 16.381.835 bytes.
- Maior preview: `Face pull (puxada facial)` com 3.210.402 bytes.
- Abertura inicial da grade no desktop baixou posters dos cards visiveis, sem baixar `preview.webp` ou `source.gif` em massa.
- Preview foi baixado somente sob interacao do usuario.

## Arquitetura

- Tabelas utilizadas: `system_exercises`, `system_exercise_media`, `partner_protocol_exercises`, `catalog_import_batches`, `catalog_import_items`.
- Migration principal: `supabase/migrations/20260731100000_system_exercise_media_ingest.sql`.
- Migration de indices: `supabase/migrations/20260731110000_catalog_import_items_fk_indexes.sql`.
- Migration de Storage: `supabase/migrations/20260731120000_system_exercise_media_storage_listing_hardening.sql`.
- Bucket reutilizado: `system-exercise-media`.
- Bucket publico mantido para URLs publicas de imagem, mas sem policy ampla de listagem em `storage.objects`.
- Escrita, update e delete no bucket ficam restritos a usuario admin autenticado pelas policies existentes.
- Paths imutaveis e versionados por checksum: `exercise-library/<exercise-code>/<checksum-curto>/source.gif`, `poster.webp`, `preview.webp`.
- Cache longo aplicado aos objetos versionados.
- Idempotencia garantida por checksum, codigo estavel, unique constraints e upload com `upsert: false`.
- O catalogo privado do parceiro referencia o exercicio global e usa as midias globais, sem copiar arquivos por parceiro.

## Pipeline

- Script criado: `scripts/dev/ingest-exercise-media.mjs`.
- Comandos criados: `npm run exercises:media:dry-run` e `npm run exercises:media:apply`.
- Manifesto criado: `supabase/seed-data/system-exercises.manifest.json`.
- O pipeline suporta `--source-dir`, `--dry-run`, `--apply`, `--resume`, `--force`, `--report-dir` e `--manifest`.
- O dry-run nao altera banco nem Storage.
- A segunda execucao aplicada foi idempotente: 0 uploads novos e 708 objetos ignorados por ja estarem processados.

## Interface

- `/parceiros/cadastros` exibe a biblioteca oficial de exercicios com poster inicial.
- Preview animado carrega sob hover/foco/clique/toque e respeita `prefers-reduced-motion`.
- Mobile nao simula hover; o preview inicia por toque e pode ser parado.
- A importacao oficial para a biblioteca privada do parceiro funciona e atualiza a tela.
- O exercicio importado apareceu na aba de Treinos do cliente e pode ser usado no fluxo real de criacao de treino.

## Validacao

- `npm run lint`: passou com 7 warnings preexistentes de Fast Refresh nos componentes UI base.
- `npm run test`: passou, 81 arquivos e 254 testes.
- `npm run build`: passou.
- `npm run mcp:playwright:check`: passou.
- `npm run mcp:supabase:check`: passou fora do sandbox local.
- `npx supabase db reset`: passou.
- `npx supabase test db --local supabase/tests`: passou, 29 arquivos e 512 testes SQL.
- `npm run git:local -- diff --check`: passou.

## Supabase MCP

- Migrations aplicadas confirmadas ate `20260731120000_system_exercise_media_storage_listing_hardening`.
- Consulta direta confirmou 236 exercicios publicados, 236 com `source`, `poster` e `preview`.
- Consulta direta confirmou 236 linhas publicadas em `system_exercise_media` e 236 checksums distintos.
- Consulta direta confirmou bucket `system-exercise-media` publico, limite de 33.554.432 bytes e MIME types permitidos de imagem.
- Consulta direta confirmou 708 objetos em `exercise-library/%`.
- RLS confirmado em `system_exercises`, `system_exercise_media`, `partner_protocol_exercises` e `catalog_import_items`.

## Playwright MCP

- Homologacao visual feita via Playwright MCP em desktop e mobile 390x844.
- Login real de parceiro validado.
- Navegacao real ate `/parceiros/cadastros` validada por cliques.
- Busca, visualizacao da biblioteca oficial, poster inicial, preview sob demanda e importacao foram validados.
- Persistencia validada apos refresh e novo login.
- Fluxo de uso em treino validado na aba Treinos do cliente.
- Console sem erros relevantes apos as correcoes.
- Network validou que a grade nao baixa todos os previews nem os GIFs originais inicialmente.
- Evidencias salvas em `docs/test-reports/exercise-media-library-2026-07-31/playwright/`.

## Problemas encontrados e corrigidos

- Severidade alta: URLs relativas das midias oficiais apontavam para o host Next e geravam 404. Causa: normalizacao ausente dos paths do Storage. Solucao: gerar URLs publicas absolutas do Supabase nos mappers. Teste: componente e Playwright com posters 200.
- Severidade media: preview por clique era abortado por alternancia imediata de estado. Causa: mesmo evento ativava e desativava preview. Solucao: estado de preview fixado por item, com `aria-pressed`. Teste: componente e Playwright desktop/mobile.
- Severidade media: exercicio importado aparecia na aba Treinos com midia relativa. Causa: mapper de treinos nao normalizava paths herdados do catalogo. Solucao: normalizacao no fluxo de workout. Teste: `client-workout-metrics` e Playwright na aba Treinos.
- Severidade media: advisor apontou listagem ampla no bucket publico de exercicios. Causa: policy SELECT ampla herdada da primeira arquitetura. Solucao: remover policy de listagem, mantendo URLs publicas por objeto. Teste: Supabase MCP em policies e bucket.
- Severidade baixa: advisor apontou FKs sem indice em `catalog_import_items`. Causa: indices ausentes na primeira entrega. Solucao: migration de indices. Teste: reset e testes SQL.

## Pendencias reais

- Fonte oficial com metadados tecnicos dos exercicios ainda nao foi fornecida; por isso grupo muscular, equipamento, dificuldade, instrucoes e contraindicacoes nao foram inventados.
- Integracao futura com Google Drive ficou fora da entrega principal; a ingestao local esta concluida e reproduzivel.
- Advisors do Supabase ainda listam avisos historicos fora do escopo desta entrega, principalmente SECURITY DEFINER em RPCs antigas, policies multiplas e FKs nao relacionadas ao catalogo global de exercicios.
