# Admin / Configurações

## Definição
- Rota: `/admin/configuracoes`.
- Origem visual: Figma `Projeto-Leo-Barros-Atualizado`, node `224:5`.
- Escopo atual: Geral, Usuários & Permissões, Integrações e Segurança.
- Fora desta fase: Aprovação manual de profissionais, Planos/Cobrança e Notificações.

## Dados
- `platform_settings`: guarda `general` e `security` em JSON público/não sensível.
- `platform_integrations`: guarda catálogo, status, configuração não secreta, último teste e mensagem.
- `platform_settings_activity`: alimenta “Últimas alterações”.
- `profiles`: lista admins em Usuários & Permissões.

## Regras
- Apenas admin ativo pode ler e alterar as configurações.
- Integrações não armazenam segredos em texto puro; salvam apenas referências/campos públicos.
- “Testar integrações” valida presença de configuração local e atualiza status, sem chamada externa ao Stripe.
- “Últimas alterações” fica abaixo do conteúdo da aba, não como painel lateral preso ao topo.

## Pendências
- Definir arquitetura Stripe real para criação de produtos, preços, assinaturas e webhooks.
- Definir armazenamento seguro de segredos de integração.
- Evoluir permissões granulares quando houver matriz de papéis administrativa.
- Reintroduzir notificações quando templates/canais forem definidos.
