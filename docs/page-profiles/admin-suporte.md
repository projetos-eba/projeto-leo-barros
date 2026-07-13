# Page Profile - Admin Suporte

Data de referencia: 29 de junho de 2026.

## Rota

- `/admin/suporte`
- Perfil: `admin`
- Fonte visual: Figma `Page / Suporte`, node `230:5`

## Objetivo

Permitir que o Super Admin acompanhe tickets de suporte, filtre a fila operacional e abra um drawer lateral com detalhes do ticket selecionado.

## Fontes de dados

- `support_tickets`
- `partners`
- `profiles`

## Regras principais

- Tickets abertos consideram `support_tickets.status in ('open', 'in_progress')`.
- `Em SLA` considera tickets ativos com `sla_due_at >= now()`.
- Tickets com `sla_due_at < now()` e status ativo aparecem como `Atrasado`.
- Tempo medio de resposta usa, por enquanto, a diferença entre `updated_at` e `created_at`, pois ainda nao existe tabela de mensagens/interacoes.
- Categoria, tags e responsavel sao derivados de forma deterministica a partir de `subject`, `priority` e `status`, ate existir schema dedicado.
- O painel `Ticket selecionado` do Figma foi implementado como drawer lateral acionado pela tabela.

## Estados

- KPIs do topo mantêm altura alinhada.
- Filtros client-side: busca, status, prioridade, categoria e responsavel.
- Tabela exibe estado vazio quando nenhum ticket bate com os filtros.
- Drawer mostra dados do ticket, tags, timeline operacional derivada e composer funcional na UI.
- Composer adiciona mensagens localmente na sessao, mas ainda nao persiste no banco.
- Mobile mantém uma coluna, tabela com rolagem horizontal controlada e drawer em largura total.

## Pendencias

- Criar tabelas para mensagens/interacoes de suporte.
- Criar campo ou tabela para atribuicao real de responsavel.
- Criar campo ou tabela para categoria/tags reais.
- Definir se Admin poderá criar tickets internos e responder em massa com persistencia.
