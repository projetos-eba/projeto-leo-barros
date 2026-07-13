# Page Profile - Parceiros Configuracoes

Rotas:

- `/parceiros/configuracoes`
- `/parceiros/configuracoes/geral`
- `/parceiros/configuracoes/assinatura`

## Objetivo

Oferecer uma area propria de configuracoes do Parceiro, separada do menu operacional.

## Regras

- Requer usuario autenticado com `profiles.role = parceiro` e `profiles.status = active`.
- `/parceiros/configuracoes` redireciona para `/parceiros/configuracoes/geral`.
- Parceiro com entitlement `trialing` ou `active` acessa Geral e Assinatura pelo shell proprio de Configuracoes.
- Parceiro sem entitlement financeiro nao recebe menu operacional; mantem acesso a planos, checkout, assinatura/recuperacao e logout conforme regra de billing.
- Nao renderizar duas sidebars ao mesmo tempo.

## Navegacao

- Desktop: sidebar propria com `Voltar ao painel`, `Geral`, `Assinatura` e `Sair`.
- Mobile: navegacao horizontal acessivel com `Geral`, `Assinatura`, volta ao painel e logout.
- Item ativo deve refletir a rota atual.
- `Voltar ao painel` e `Ir para o painel` levam para `/parceiros/dashboard` e devem trocar para o shell operacional principal, sem manter a sidebar de Configuracoes.

## Geral

Exibe somente dados existentes e seguros:

- nome;
- nome profissional;
- e-mail;
- telefone;
- tipo profissional;
- registro profissional.

Edicao de dados profissionais nao esta implementada nesta fase.

## Assinatura

Direciona para `/parceiros/configuracoes/assinatura` e segue o Page Profile de assinatura.
