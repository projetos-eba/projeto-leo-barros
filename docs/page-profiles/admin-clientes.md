# Admin Clientes

## Objetivo

Tela operacional simplificada para o Super Admin acompanhar clientes cadastrados, seus vínculos com profissionais e a consistência dos indicadores da plataforma.

## Rota

- `/admin/clientes`
- Acesso: apenas admin ativo.

## Dados

- `profiles` com `role = cliente`
- `patients`
- `partner_clients`
- `partners`
- `profiles` com `role = parceiro`
- `partner_subscriptions`

## Métricas

- `Clientes ativos`: clientes distintos com `partner_clients.status = active` vinculados a profissionais efetivamente ativos.
- `Novos clientes (mês)`: clientes distintos iniciados no mês em profissionais efetivamente ativos.
- `Sem vínculo ativo`: clientes cadastrados sem vínculo ativo com profissional ativo.
- `Vínculos encerrados`: clientes com pelo menos um vínculo encerrado no mês.

## Interface

- KPIs superiores em sequência, com altura alinhada.
- Filtros por busca, profissional, escopo e status.
- Tabela principal com cliente, profissional, escopo, status, início, última atualização e ações.
- Drawer de detalhes com dados operacionais e histórico de vínculos.
- Painéis laterais de distribuição por status e top profissionais.
- Exportação CSV dos resultados filtrados.

## Decisões

- A tela não expõe dados clínicos, dieta, treino, anamnese ou prontuário.
- A tela não cria nem edita clientes nesta fase.
- Cliente ativo segue a mesma regra já usada pela Visão Geral: vínculo ativo em profissional efetivamente ativo.
