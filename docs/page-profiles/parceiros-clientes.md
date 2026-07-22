# Parceiros - Clientes

## Rota

- `/parceiros/clientes`
- Shell autenticado: `profile="parceiros"`
- Acesso: somente perfil `parceiro` ativo.

## Objetivo

Dar ao parceiro uma lista operacional dos seus Clientes vinculados, com busca, filtros, exportacao, detalhes resumidos e criacao de novo Cliente via convite pendente.

## Fontes de dados

- `partner_clients_list()`: RPC segura com uma linha por Cliente vinculado ao parceiro ativo.
- `partner_custom_plans`: nomes dos planos personalizados do parceiro.
- `partner_client_plan_subscriptions`: renovacoes e planos contratados pelos Clientes.
- `partner_service_plans`: planos ativos exibidos no drawer Novo Cliente para vinculo inicial.
- `partner_client_plan_contracts`: vinculos manuais criados ao cadastrar Cliente com plano.
- `provision-client-for-partner`: Edge Function usada pelo drawer Novo Cliente.

## Regras

- A interface usa sempre "Clientes"; `patients` permanece apenas como nome tecnico do schema.
- CPF pode ser enviado opcionalmente no cadastro, mas nao aparece na lista, drawer ou CSV.
- Nome, e-mail, telefone, idade, objetivo, modulos do plano e renovacao sao dados operacionais minimos para o parceiro vinculado.
- A RPC deve retornar somente Clientes vinculados ao parceiro autenticado e ativo.
- A criacao de Cliente nao recebe senha; convite fica `pending_delivery` ate a etapa futura de e-mail real.
- O drawer Novo Cliente seleciona um plano ativo em vez de escopos manuais; os modulos liberados sao derivados do plano escolhido.
- Ao concluir a criacao, a tela cria o vinculo financeiro manual com inicio, primeira cobranca e parcelas.
- A tela nao exclui, suspende ou edita Cliente nesta fase.

## Contrato visual Figma

- Referencia: Figma `vyskvKR1gCzdckeXHR2Ewj`, node `1:4604`.
- Tema escuro: fundo `#0b1720`, cards/tabela `#181d25`, controles `#161a22`, bordas `#303746`, acao primaria `#3b97e3`.
- Estrutura: titulo, subtitulo com total ativo, acoes Exportar/Novo Cliente, busca, filtros, tabela, paginacao.
- Desktop usa tabela densa; mobile preserva scroll horizontal interno na tabela sem overflow global da pagina.

## Estados

- Com Clientes ativos.
- Sem Clientes vinculados.
- Busca/filtros sem resultado.
- Criacao com validacao local.
- Erro seguro da Edge Function.
- Convite criado ou Cliente reconciliado.

## Validacao

- `src/lib/partners/clients-metrics.test.ts`
- `src/app/parceiros/clientes/partner-clients-view.test.tsx`
- `supabase/tests/011_partner_clients_list_rpc.test.sql`
- Smoke Playwright em `/parceiros/clientes` desktop/mobile.
