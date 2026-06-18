# Design System

## Visão geral

Este documento consolida a fundação do Design System do projeto Leo Barros com base na auditoria do arquivo Figma `Projeto Leo Barros Atualizado` e no pacote local em `outputs/leo-design-system`.

Princípios-base:

- O Figma é a fonte de verdade visual.
- A arquitetura segue a lógica de composição do `shadcn/ui`, mas sem herdar seu visual padrão.
- Componentes novos devem nascer por variante, não por duplicação.
- Toda tela nova deve priorizar tokens semânticos, instâncias e padrões documentados.

## Estado visual atual do código

O código real em `src/index.css` ainda não está totalmente alinhado ao alvo documentado:

- Importa `Inter` e `Plus Jakarta Sans`; a tipografia alvo documentada é `Rethink Sans`.
- Usa variáveis shadcn em HSL como `--background`, `--foreground`, `--card`, `--primary` e `--border`.
- O background atual é preto via HSL (`0 0% 0%`), diferente do alvo `#0B1720`.
- Mantém classes utilitárias customizadas como `glass-card`, `glass-card-hover`, `bento-grid`, `btn-primary`, `page-enter` e `stagger-fade-in`.

Durante a migração, essas classes não devem ser removidas sem substituto validado visualmente.

## Tokens

### Color

- `color/background`: fundo principal da aplicação, `#0B1720`.
- `color/surface`: superfícies-base de campos e painéis.
- `color/surface/elevated`: superfícies elevadas como modais e cards mais densos.
- `color/surface/muted`: painéis escuros e cards operacionais.
- `color/surface/subtle`: containers sutis e estados de apoio.
- `color/border`: borda padrão.
- `color/border/strong`: borda de ênfase.
- `color/primary`: ação principal.
- `color/primary/hover`: hover da ação principal.
- `color/primary/subtle`: navegação ativa e superfícies de apoio à ação.
- `color/text`: texto primário.
- `color/text/muted`: texto secundário.
- `color/text/subtle`: texto de baixa ênfase.
- `color/text/disabled`: texto desabilitado.
- `color/success`, `color/warning`, `color/danger`, `color/info`: feedback semântico.

### Typography

Família oficial:

- `Rethink Sans`

Escala principal:

- `display-lg`: `48/56`
- `display-md`: `40/48`
- `heading-lg`: `32/40`
- `heading-md`: `24/32`
- `title-lg`: `20/30`
- `title-md`: `18/28`
- `body-lg`: `16/24`
- `body-md`: `14/20`
- `body-sm`: `12/16`
- `label-md`: `14/20`
- `label-sm`: `12/16`
- `caption`: `10/14`

### Spacing

Escala oficial em `4px`:

- `0`, `4`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `48`

### Radius

- `radius/none`: `0`
- `radius/xs`: `4`
- `radius/sm`: `6`
- `radius/md`: `8`
- `radius/lg`: `10`
- `radius/xl`: `12`
- `radius/2xl`: `14`
- `radius/panel`: `20`
- `radius/full`: `9999`

### Shadows

- `shadow/elevation/sm`: dropdowns, toasts, elevação leve.
- `shadow/elevation/md`: modais e painéis promovidos.
- `shadow/focus/primary`: foco visível e estado ativo forte.

### Size

- `size/icon/sm`: `16`
- `size/icon/md`: `20`
- `size/icon/lg`: `24`
- `size/control/sm`: `32`
- `size/control/md`: `40`
- `size/control/lg`: `44`
- `size/sidebar`: largura canônica da navegação lateral no pacote local.

### Layout

- `layout/screen/desktop`: largura-base desktop.
- `layout/sidebar/width`: largura da sidebar usada nas telas.
- `layout/content/max`: região máxima de conteúdo.
- `layout/card/iconBox/lg`: container de ícone para KPI e shortcut cards grandes.
- `layout/card/iconBox/md`: container de ícone para cards compactos.

### Motion

- `motion/fast`: `120ms`
- `motion/base`: `180ms`
- `motion/slow`: `240ms`

### Opacity

- `opacity/disabled`
- `opacity/overlay`

### Z-Index

- `z/base`
- `z/sticky`
- `z/modal`

## Componentes

### Atoms

- `Atoms/Icon`
  Variantes: `size=sm|md|lg|xl`
- `Atoms/Avatar`
  Variantes: `size=sm|md|lg`, `status=true|false`
- `Atoms/Boolean Control`
  Variantes: `type=checkbox|switch`, `state=checked|unchecked|on|off`
- `Atoms/Button`
  Variantes: `variant=primary|secondary|outline|ghost|destructive|icon`, `size=sm|md|lg`, `state=default|hover|disabled|loading`
- `Atoms/Form Controls`
  Variantes: `type=input|search|select|textarea|date|number`, `state=default|focus|error|disabled`
- `Atoms/Badge`
  Variantes: `tone=neutral|info|success|warning|danger|premium|inactive|paid|pending`

### Molecules

- `Molecules/Navigation Item`
  Variantes: `state=default|active`, `badge=true|false`
- `Molecules/KPI Card`
  Variantes: `emphasis=default|highlight`
- `Molecules/Shortcut Card`
  Variantes: `state=default|selected`
- `Molecules/Card`
  Variantes: `surface|metric|shortcut|data|plan|meal|interactive|glass`
- `Molecules/Data Card`
  Variantes: `summary|chart|interactive|glass`
- `Molecules/Measurement Field`
  Variantes: `state=default|focus|error|disabled`
- `Molecules/Table Row`
  Variantes: `state=default|hover|selected`
- `Molecules/Chart Legend`
  Variantes: `checked=true|false`
- `Molecules/Workout Set Cell`
  Variantes: `state=default|active`
- `Molecules/Meal Card`
  Variantes: `state=default|selected`
- `Molecules/Tabs`
  Variantes: `state=default|active`, `icon=true|false`

### Organisms

- `Organisms/Sidebar`
  Variantes: `role=professional|patient`, `collapsed=true|false`
- `Organisms/Header`
- `Organisms/Table`
  Variantes: `state=default|loading|empty`
- `Organisms/Modal`
  Variantes: `type=confirm|form|destructive`
- `Organisms/Toast`
  Variantes: `tone=success|error|warning|info`

### Templates

- `Templates/Page Shell`

### Converted Families

Essas famílias preservam a aparência das telas reais e funcionam como ponte de migração:

- `Converted/Navigation Item`
- `Converted/KPI Card`
- `Converted/Shortcut Card`
- `Converted/Button`
- `Converted/Form Field`
- `Converted/Badge`
- `Converted/Table Row`
- `Converted/Measurement Field Group`
- `Converted/Workout Set Cell`
- `Converted/Meal Block`
- `Converted/Sidebar`
- `Converted/Chart Legend`

## Padrões de layout

### Estrutura de tela

- Sidebar fixa à esquerda para contexto autenticado desktop.
- Header no topo da área de conteúdo para título, subtítulo e ações.
- Conteúdo principal organizado em bandas e grids, não em cartões empilhados arbitrariamente.
- Regra geral: evitar `card dentro de card`.

### Hierarquia visual

- KPI cards: valor dominante, label secundária, ícone em container próprio.
- Shortcut cards: ícone de destino + label curta em até duas linhas.
- Data cards: título, descrição curta, área de conteúdo claramente delimitada.
- Tabelas: header fixo, linhas densas, badges e ações previsíveis.

### Campos e controles

- Alturas dominantes: `40px`, `44px`, `96px` para textarea.
- Radius dominante de campos: `8px` a `10px`.
- Estados de formulário devem ser resolvidos por variant, não por frame manual.

### Navegação

- Sidebar e navigation items são o padrão oficial para navegação global.
- Tabs são navegação local de contexto, não substituem sidebar.

## Inconsistências encontradas

### Estruturais

- As telas principais ainda têm muitas cópias soltas e `0` instâncias aplicadas na camada produtiva auditada.
- Só cerca de uma pequena parte dos frames das telas usa Auto Layout; muita estrutura ainda é manual.
- Havia padrões muito recorrentes fora da biblioteca: sidebar, nav item, KPI card, measurement field, meal block, workout cells, table rows.

### De tokens e estilos

- A página `Design System` originalmente tinha tokens incompletos para `shadow`, `opacity`, `z-index`, `layout` e suporte de tipografia.
- Os text styles existiam, mas a camada produtiva ainda não estava totalmente governada por estilo/instância.
- Nem todos os componentes do produto estavam vinculados à camada semântica de tokens.

### De componentes

- Botões semelhantes apareciam com diferenças desnecessárias de tamanho, cor e estrutura.
- Inputs, selects e measurement fields tinham alturas e radius variados sem uma família única.
- Cards de KPI, cards de atalho e cards de dados conviviam sem uma taxonomia clara.
- Havia ícones semanticamente fracos em alguns contextos, como `activity` e `apple 2` em blocos onde o significado era mais específico.

### De nomenclatura

- Parte do projeto usava convenções em português e outra parte em inglês.
- O arquivo tem a página `Deisgn Telas` com nome digitado incorretamente.
- Há diferença entre nomes do Figma e do pacote React em alguns pontos, como `Table` no Figma e `DataTable` no código local.

## Regras de evolução

- Toda recorrência nova deve ser absorvida por variante antes de virar novo componente.
- Toda família nova deve entrar com metadado de IA: descrição, quando usar, quando não usar, tokens usados e relações.
- Toda tela nova deve preferir componentes canônicos; `Converted/*` serve para migração com alta fidelidade visual.
- Nenhum valor hardcoded novo deve entrar sem avaliar se já existe token equivalente.
