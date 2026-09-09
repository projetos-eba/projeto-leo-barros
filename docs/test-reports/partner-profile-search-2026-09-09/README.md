# Correções de perfil, buscas e mapa muscular — 09/09/2026

## Entrega local

- Drawer completo na lista de Clientes; drawer de bio compartilhado por todas as 11 abas e pelos atalhos de Avaliações.
- RPCs aditivas para leitura mínima e atualização transacional de cadastro, sem alterar credenciais ou e-mail; isolamento entre parceiros coberto por pgTAP.
- Busca com estado isolado, índice normalizado, até 6 sugestões inline e páginas de 30 itens nas bibliotecas laterais.
- Catálogo explícito por identificador com 201 exercícios classificados e [35 pendências](pending-classifications.md). Importação de mídia preserva classificações; rotina operacional de reparo oferece simulação e auditoria antes/depois.

## Diagnóstico de produção

- A interface observada apresentava `outros` como grupo dos exercícios e o estado de representação indisponível. O importador antigo gravava `primary_muscle_group: null`; a importação privada convertia null para `outros`.
- As 16 imagens PNG responderam HTTP 200 no domínio www.deloadfit.app: [resultado](production-assets.json). Não é uma ausência geral dos arquivos.
- `main` estava em `5422e170a925392465ec6679a39629498ee8568b`, inclui `dde7a0e` (GitHub compare: ahead 9, behind 0) e possui status Vercel `success`. A identidade exata do build servido pelo alias www não foi obtida.
- O código anterior mantinha os estados de busca na view completa e renderizava a biblioteca inteira. A correção reduz o trabalho de renderização por tecla e limita os resultados montados. Não foi realizado perfil de CPU antes/depois em produção; o peso exato de cada fator no delay remoto ainda não foi medido.

## Validação

- Build Next de produção concluído. O primeiro build no sandbox foi bloqueado ao abrir processo/porta do Turbopack; execução com acesso local passou.
- Typecheck passou; ESLint: zero erros e sete avisos preexistentes em componentes UI.
- Suite final de aplicação: 319 testes passaram em 93 arquivos. O drawer foi revalidado após restringir o payload aos campos editáveis.
- Banco reconstruído a partir das migrations e seed. Todos os 575 testes SQL passaram, incluindo reparo histórico, idempotência, auditoria e preservação de classificações manuais.
- Integridade das migrations passou. Lint do schema `public`: nenhum erro. O lint geral reportou problemas internos de funções `extensions._*` do pgTAP, sem erros nas funções da aplicação.
- Tipos Supabase regenerados a partir do banco local.
- Playwright MCP no build de produção local: bio abriu em todas as 11 abas sem mudar a URL; testes mobile em 390 × 844 sem overflow; drawer completo abriu na lista, manteve e-mail somente leitura, salvou e persistiu um objetivo de teste local, restaurado em seguida.
- Imagens e camadas do boneco carregaram no navegador. Capturas inspecionadas visualmente: [Treinos desktop](workout-desktop.png) e [Bio mobile](bio-mobile.png).

## Medições locais

Build de produção em localhost:3100, sessão autenticada do seed. A amostra da interface usa catálogo pequeno (6 exercícios e 12 alimentos no banco); não equivale à carga de produção.

| Medição | Treinos | Dietas |
|---|---:|---:|
| Navegação até campo disponível | 672 ms | 470 ms |
| Entrada até frames seguintes, 6 amostras | 3,4–27,8 ms | 2,7–23,8 ms |
| POSTs durante digitação | 0 | 0 |

A medição de frames usa dois requestAnimationFrame após o evento input; é uma aproximação de atualização visual, não um perfil independente de pintura/composição. Resultados filtrados foram verificados. Com 10.000 itens sintéticos, construção do índice levou 7,98 ms e a busca pelo último item teve p95 de 0,307 ms em 500 execuções: [benchmark](filter-benchmark.json). Testes de interface cobrem paginação de 65 itens, busca sem acentos, seis sugestões e ausência de adição durante digitação.

[Lista dos arquivos da entrega](changed-files.md).

## Comandos principais

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test -- classification-catalog`
- `npm run test -- client-profile-drawer`
- `npm run build`
- `npm run db:reset`
- `npm run db:migration-integrity`
- `npm run test:db`
- `npm run db:lint`
- `npx supabase db lint --local --schema public`
- `npx supabase gen types typescript --local`
- `npm run git:local -- diff --check`
- `npm run start -- -p 3100` para smoke via Playwright MCP.

## Publicação pendente

A CLI retornou `Access token not provided` ao consultar os projetos remotos. Nenhuma migration nem reparo foi aplicado em produção, e nenhum build dependente foi publicado. [Ordem de publicação e recuperação](rollout.md). Figma indisponível nas ferramentas desta sessão; foram preservados os componentes e o padrão visual existentes.
