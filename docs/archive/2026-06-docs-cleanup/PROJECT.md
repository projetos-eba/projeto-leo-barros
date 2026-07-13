# Project

## Objetivo do produto

Construir a base oficial do Design System do produto Leo Barros para acelerar design e desenvolvimento de interfaces clínicas e operacionais com consistência visual, reutilização real e leitura adequada para futuras IAs.

O projeto local desta pasta representa:

- a biblioteca inicial de componentes React
- a estrutura Storybook
- a documentação de tokens, componentes e metadados
- a ponte entre a biblioteca em código e a biblioteca consolidada no Figma

## Stack

- `Next.js 15`
- `React 18`
- `TypeScript 5`
- `Storybook 8`
- `Tailwind CSS 3`
- `Radix UI`
- `lucide-react`
- convenções estruturais compatíveis com `shadcn/ui`

## Regras de arquitetura

- O Figma é a fonte de verdade visual.
- O pacote local deve refletir os nomes, variantes e tokens do sistema antes de inventar novas abstrações.
- Preferir composição simples e previsível em vez de hierarquias profundas.
- Toda recorrência deve ser resolvida por componente ou variante, não por duplicação manual.
- Componentes de infraestrutura visual devem permanecer semanticamente separados:
  `Button` não vira `Tab`, `Card` não vira `Page Section`, `Sidebar` não vira menu solto.
- Novos componentes devem nascer com:
  descrição, API de variantes, tokens usados, estados previstos e exemplos de uso.
- Para migração, `Converted/*` pode coexistir com componentes canônicos, mas não deve virar a API final de longo prazo.

## Regras de design

- Usar somente `Rethink Sans`.
- Preservar a linguagem do produto: dashboard clínico escuro, superfícies densas, azul como ação principal.
- Não copiar o visual padrão do shadcn/ui.
- Não criar cards dentro de cards sem necessidade real.
- Não usar hex solto quando existir token semântico.
- Não criar novos tamanhos arbitrários de ícone, input ou botão fora da escala oficial.
- Navegação global usa sidebar; navegação local usa tabs.
- KPI card é para métrica, shortcut card é para destino, data card é para conteúdo.
- Ícones devem ser semanticamente coerentes com o texto.

## Como rodar o projeto

Na pasta `outputs/leo-design-system`:

```bash
npm install
npm run dev
```

Next.js sobe em `http://localhost:3000`.

Para rodar o Storybook:

```bash
npm run storybook
```

Storybook sobe em `http://localhost:6006`.

Para checagem de tipos:

```bash
npm run typecheck
```

Para build do Storybook:

```bash
npm run build-storybook
```

## Como validar entrega

- Confirmar no Figma se o componente existe na página `Design System` com variants e documentação.
- Confirmar se o nome do componente está alinhado entre Figma, docs e código local.
- Confirmar se o componente usa tokens semânticos, não valores arbitrários novos.
- Validar no Storybook:
  variantes, estados, tamanhos e legibilidade visual.
- Validar se a entrega reduziu duplicação em vez de aumentar o número de componentes paralelos.
- Para mudanças de alto impacto, verificar se há caminho claro para migrar telas existentes para instâncias.

## O que nunca fazer

- Nunca tratar o código local como fonte visual acima do Figma.
- Nunca duplicar componente porque faltou pensar em variante.
- Nunca criar cor, radius, spacing ou sombra solta sem avaliar token existente.
- Nunca usar componente `Converted/*` como solução permanente para novos fluxos.
- Nunca trocar o visual do produto por “cara padrão de biblioteca”.
- Nunca misturar navegação, ação e estado em um mesmo componente sem semântica clara.
- Nunca quebrar a relação entre nome do componente, propósito e variante.
- Nunca documentar menos do que foi realmente implementado.

## Links importantes

- Figma principal:
  [Projeto Leo Barros Atualizado](https://www.figma.com/design/vyskvKR1gCzdckeXHR2Ewj/Projeto-Leo-Barros-Atualizado)
- Package local:
  [package.json](/Users/antoniofelipe/Documents/Codex/2026-06-08/codex-liste-os-5-projetos-mais/outputs/leo-design-system/package.json)
- Tokens:
  [docs/TOKENS.md](/Users/antoniofelipe/Documents/Codex/2026-06-08/codex-liste-os-5-projetos-mais/outputs/leo-design-system/docs/TOKENS.md)
- Metadados de IA:
  [docs/AI-METADATA.md](/Users/antoniofelipe/Documents/Codex/2026-06-08/codex-liste-os-5-projetos-mais/outputs/leo-design-system/docs/AI-METADATA.md)
- Roadmap:
  [docs/IMPLEMENTATION_ROADMAP.md](/Users/antoniofelipe/Documents/Codex/2026-06-08/codex-liste-os-5-projetos-mais/outputs/leo-design-system/docs/IMPLEMENTATION_ROADMAP.md)
- Ledger da consolidação no Figma:
  [figma-refinement-ledger.json](/Users/antoniofelipe/Documents/Codex/2026-06-08/codex-liste-os-5-projetos-mais/outputs/leo-design-system/figma-refinement-ledger.json)
