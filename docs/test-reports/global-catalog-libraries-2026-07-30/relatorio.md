# Homologação · Bibliotecas globais

Data: 30/07/2026

## Escopo validado

- Login real de parceiro seed em `/login/parceiros`.
- Navegação real para `/parceiros/cadastros` pelo shell de Parceiros.
- Abertura do drawer `Importar TACO`.
- Listagem de 597 alimentos globais publicados.
- Seleção e importação de `Abacate, cru` para a base privada do parceiro.
- Refresh automático da tela após a importação.
- Abertura do drawer `Exercícios oficiais`.
- Estado vazio real para exercícios oficiais, pois a fonte oficial de exercícios/GIFs ainda não foi fornecida.
- Responsividade básica em viewport `390x844`.

## Evidências

- `global-food-import-abacate.png`
- `global-exercises-empty-state.png`
- `global-catalog-mobile.png`
- `global-catalog-console-errors.txt`
- `global-catalog-network.txt`

## Resultado

- Console: 0 erros, 0 warnings relevantes.
- Rede: requisições críticas de login, dashboard, cadastros e importação retornaram 200.

## Pendências externas

- Planilha/lista oficial dos exercícios.
- Arquivos GIF/posters oficiais e licenças de mídia.
- Implementação da rota `/parceiros/onboarding`, prevista no sitemap mas inexistente no App Router analisado.
