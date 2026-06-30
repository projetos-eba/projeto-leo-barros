# Plano de reset controlado da base para Next.js + Supabase

Data de referência: 21 de junho de 2026.

Status: planejamento documental. Nenhuma ação operacional executada.

Este documento registra a decisão humana aprovada pelo Caminho B: abandonar backfill/migration dos dados atuais de teste e preparar uma base nova, limpa e coerente com Next.js, Supabase, perfis, ownership, RLS e login único temporário.

Esta fase não cria migration, não aplica SQL, não altera banco, não altera Supabase, não altera `.env`, não altera RLS, não altera policies, não altera Edge Functions, não altera runtime, não cria Supabase Next, não cria `/login`, não cria rotas, não cria guards e não cria middleware.

## 1. Decisão aprovada

Decisão: seguir com reset controlado da base.

Não vamos continuar com backfill/migration dos dados atuais.

Motivos aprovados:

- os dados atuais são de teste;
- os usuários Auth atuais podem ser recriados;
- não há dado clínico real a preservar;
- o Supabase atual é apenas desenvolvimento;
- o objetivo agora é criar uma versão melhor em Next.js;
- vamos reaproveitar documentação, aprendizados, contratos, componentes úteis e decisões arquiteturais, não os dados de teste;
- o modelo atual tem inconsistências entre Auth, `patients`, admin legado, `/form/:token` e policies amplas.

Consequência:

- os documentos de backfill e relatório de ambiguidades continuam úteis como evidência, mas deixam de orientar uma migração de dados dos registros atuais;
- a próxima evolução deve partir de schema limpo e coerente.

## 2. Evidências que justificam o reset

As fases anteriores identificaram:

- `profiles` não existe;
- `partners` não existe;
- vínculo Parceiro–Cliente não existe;
- Admin real não está separado de Parceiro;
- `/admin` atual mistura operação profissional com administração global;
- `user_metadata.role` é legado/transição, não fonte canônica segura;
- o login Vite atual redireciona qualquer role diferente de `patient` para `/admin`;
- o SQL Lovable não cria o modelo canônico e possui policies permissivas;
- `/form/:token` é fluxo legado/provisório, não arquitetura final;
- o relatório real encontrou 0 candidatos claros a `cliente active`;
- os dados atuais são de desenvolvimento/teste.

## 3. O que será preservado

Preservar como base intelectual/técnica:

### Documentação

- `AGENTS.md`;
- sitemap e mapas de rotas;
- estratégia de autenticação e perfis;
- modelo canônico de perfis, permissões e ownership;
- auditoria do SQL Lovable;
- especificação de migrations futuras;
- relatório de ambiguidades;
- resultado do relatório de ambiguidades;
- documentação de mocks/testes;
- plano mestre da migração Next.

### Contratos de auth

- roles oficiais: `cliente`, `parceiro`, `admin`;
- status oficiais: `pending`, `active`, `suspended`, `disabled`;
- matriz role → home futura;
- comportamento seguro de role/status inválido;
- regra de nunca cair em Admin por fallback.

### Componentes úteis

- `LoginView` como componente apresentacional;
- componentes shadcn/ui locais;
- componentes visuais e de domínio que puderem ser reutilizados com adaptação segura;
- tokens/classes visuais já preservados na fundação Next.

### Fundação Next

- providers globais;
- shells técnicos Público, Cliente, Parceiros e Admin;
- estrutura `src/app/**`;
- `globals.css` e tokens visuais migrados;
- testes mínimos de providers/shells/smokes.

### Aprendizados arquiteturais

- login único temporário primeiro;
- logins separados somente depois;
- Parceiro e Admin são perfis diferentes;
- Admin futuro é Super Admin global;
- área `/admin` atual contém funções do futuro `/parceiros`;
- RLS deve nascer com ownership;
- Storage clínico deve ser protegido;
- formulários devem ser autenticados no futuro fluxo de Cliente.

## 4. O que será descartado

Descartar como base de produto futura:

- dados Auth atuais;
- pacientes de teste atuais;
- vínculos inconsistentes entre Auth e `patients`;
- backfill dos dados atuais;
- tentativa de migrar admins legados automaticamente;
- policies permissivas antigas como modelo;
- `/form/:token` como arquitetura final;
- `form_assignments.access_token` como destino definitivo;
- SQL Lovable como migration executável;
- fallback para Admin;
- confiança em `user_metadata.role` como autorização canônica;
- schema atual como fonte final de ownership.

Observação:

- descartar não significa apagar imediatamente nesta fase. Este documento apenas planeja o reset; nenhuma operação foi executada.

## 5. Recomendação: novo Supabase limpo ou reset do atual

Recomendação: criar um novo projeto Supabase limpo.

Essa opção é preferível porque:

- reduz risco de carregar migrations e policies permissivas antigas;
- separa historicamente a base legada/de desenvolvimento da base nova;
- permite desenhar RLS desde o começo;
- evita confusão entre dados de teste e estrutura final;
- facilita validar migrations novas em ordem limpa;
- reduz chance de reaproveitar acidentalmente `user_metadata.role`, `/form/:token` ou policies amplas;
- dá uma fronteira clara entre legado Vite e alvo Next.

Resetar o Supabase atual só deve ser escolhido se houver impedimento técnico, custo operacional ou limitação de projeto.

Se resetar o atual:

- fazer snapshot/export documental antes;
- confirmar que não há dado real;
- confirmar que nenhum ambiente depende dele;
- registrar que o histórico de migrations antigas não será usado como base canônica;
- recriar schema limpo a partir de migrations novas.

Preferência atual aprovada:

- favorecer novo projeto Supabase limpo, salvo impedimento técnico.

## 6. Arquitetura alvo limpa

### `profiles`

Fonte canônica de identidade de produto.

Campos mínimos planejados:

- `id`;
- `user_id`;
- `role`;
- `status`;
- `display_name`;
- `created_at`;
- `updated_at`.

Regras:

- `user_id` referencia `auth.users.id`;
- role usa valores oficiais `cliente`, `parceiro`, `admin`;
- status usa `pending`, `active`, `suspended`, `disabled`;
- usar inicialmente `text + check constraint`, não enum SQL;
- role/status ausente ou inválido nega acesso;
- nenhum fallback para Admin.

### `patients`

Tabela de dados específicos do Cliente/Paciente.

Responsabilidades:

- dados cadastrais/clínicos do cliente acompanhado;
- vínculo com Auth e/ou `profiles`;
- manter dados clínicos fora de `profiles`.

Recomendação para base limpa:

- criar `patients` já alinhada a `profiles`;
- avaliar se `profile_id` entra desde a primeira versão limpa;
- manter `user_id` somente se for necessário para compatibilidade operacional ou joins simples.

### `partners`

Tabela própria do profissional/parceiro.

Responsabilidades:

- dados profissionais;
- estado operacional;
- ligação com `profiles`;
- separação explícita de Admin.

Campos mínimos planejados:

- `id`;
- `profile_id`;
- `professional_name`;
- `status`;
- `metadata`;
- `created_at`;
- `updated_at`.

### `partner_clients`

Tabela de ownership entre Parceiro e Cliente.

Responsabilidades:

- controlar quais clientes um parceiro pode acessar;
- permitir múltiplos parceiros por cliente;
- suportar futuro parceiro principal;
- permitir encerramento/revogação sem apagar histórico.

Campos mínimos planejados:

- `id`;
- `partner_id`;
- `patient_id`;
- `status`;
- `is_primary`, se aprovado;
- campos de auditoria;
- `created_at`;
- `updated_at`.

### Formulários autenticados

Modelo futuro:

- Parceiro cria/atribui formulário a cliente vinculado;
- Cliente preenche dentro da área autenticada;
- respostas pertencem ao assignment do cliente;
- `/form/:token` não deve ser destino final.

### Storage protegido

Storage clínico deve ser privado/protegido desde o início.

Regras:

- sem bucket público para dados clínicos;
- policies por ownership;
- Cliente acessa apenas seus próprios arquivos;
- Parceiro acessa apenas arquivos de clientes vinculados;
- Admin acessa conforme permissão administrativa explícita.

### Edge Functions revisadas

Funções futuras devem:

- validar o chamador;
- criar `profiles` junto com usuários Auth;
- criar `patients` somente para role `cliente`;
- criar `partners` somente para role `parceiro`;
- criar Admin somente por ação autorizada de Super Admin;
- evitar `user_metadata.role` como fonte final;
- auditar operações sensíveis.

### RLS desde o começo

RLS deve nascer como parte da fundação da base limpa.

Princípios:

- Cliente vê apenas os próprios dados;
- Parceiro vê apenas clientes vinculados;
- Admin acessa globalmente apenas conforme regra aprovada;
- usuário sem `profile active` não acessa área autenticada;
- anônimo não acessa dados clínicos;
- UI, guards e middleware não substituem RLS.

## 7. Ordem futura de implementação

Sequência recomendada:

1. criar novo projeto Supabase limpo;
2. configurar variáveis de ambiente novas em fase própria, sem expor valores;
3. criar migrations iniciais limpas;
4. criar `profiles`;
5. criar `patients`;
6. criar `partners`;
7. criar `partner_clients`;
8. criar tabelas de formulários autenticados;
9. criar Storage protegido;
10. criar policies RLS desde a primeira versão;
11. criar seeds de desenvolvimento;
12. criar/revisar Edge Functions;
13. criar Supabase Next browser/server;
14. criar `/login` único temporário;
15. conectar contratos de role/status;
16. criar resolução segura de sessão e profile;
17. criar guards/layout protection;
18. criar áreas `/cliente`, `/parceiros`, `/admin`;
19. redesenhar formulários autenticados;
20. só depois avaliar logins separados.

## 8. Riscos do reset

| Risco | Mitigação |
| --- | --- |
| Perder aprendizado embutido nas migrations antigas | Usar docs e auditorias como inventário, não como migration executável. |
| Recriar menos tabelas que o produto precisa | Fazer inventário de módulos antes da primeira migration limpa. |
| Quebrar integração local existente | Executar mudança de `.env` e Supabase Next em fase própria. |
| Subestimar RLS | Planejar RLS junto das primeiras tabelas, com testes SQL. |
| Recriar `/form/:token` por hábito | Documentar fluxo autenticado antes de migrar formulários. |
| Confundir Admin e Parceiro novamente | Criar `partners` e `admin` como domínios separados desde o início. |

## 9. Riscos de continuar migration/backfill

Continuar com backfill dos dados atuais teria riscos maiores:

- promover admin legado indevidamente;
- criar `profiles` a partir de dados de teste inconsistentes;
- carregar policies permissivas antigas;
- manter `/form/:token` como desenho de produto;
- construir RLS sobre ownership ausente;
- criar complexidade para preservar dados que não precisam ser preservados;
- atrasar a versão limpa em Next.js;
- transformar inconsistência de desenvolvimento em dívida de produção.

## 10. Checklist para evitar perda de informações úteis

Antes do reset operacional futuro:

- preservar documentos de auditoria;
- preservar contratos TypeScript;
- preservar testes úteis;
- preservar componentes reutilizáveis;
- preservar inventário de tabelas e módulos;
- preservar decisões de produto sobre Cliente/Parceiro/Admin;
- preservar decisão sobre login único temporário;
- preservar decisão de `/form/:token` como legado;
- preservar aprendizados de RLS e policies permissivas;
- preservar `LoginView`;
- preservar shells Next;
- preservar mocks/estratégia de testes;
- preservar `migration (1).sql` apenas como inventário legado, se ainda for útil para consulta.

## 11. Checklist para não carregar legado inseguro

Não carregar para a base limpa:

- policies `USING (true)`/`WITH CHECK (true)` como padrão;
- acesso público a dados clínicos;
- Storage clínico público;
- `user_metadata.role` como autorização final;
- fallback para Admin;
- Admin legado como Super Admin;
- `/form/:token` como destino final;
- SQL Lovable como migration oficial;
- schema sem `profiles`;
- operação de Parceiro dentro de Admin sem separação;
- seeds com dados sensíveis reais;
- dependência de dados Auth atuais.

## 12. Decisões pendentes

Antes da primeira migration limpa, decidir:

- criar novo projeto Supabase ou resetar o atual;
- se `patients.profile_id` nasce desde a primeira versão;
- se `patients.user_id` permanece em paralelo;
- estratégia de `ON DELETE` entre `profiles` e `auth.users`;
- status inicial de seeds;
- se haverá Super Admin seedado manualmente;
- formato dos testes SQL de RLS;
- primeira versão do modelo de formulários autenticados;
- buckets e policies de Storage;
- quais Edge Functions entram na primeira leva;
- se `partner_clients.is_primary` entra já na primeira migration.

## 13. O que não foi implementado nesta fase

- Nenhuma migration criada.
- Nenhum SQL aplicado.
- Nenhum banco alterado.
- Nenhum projeto Supabase criado.
- Nenhum `.env` alterado.
- Nenhuma RLS alterada.
- Nenhuma policy alterada.
- Nenhuma Edge Function alterada.
- Nenhum runtime alterado.
- Nenhum Login/LoginView alterado.
- Nenhum `App.tsx` alterado.
- Nenhum Supabase Next criado.
- Nenhuma rota criada.
- Nenhum guard ou middleware criado.
- Nenhuma dependência instalada.
- Nenhum commit criado.

## 14. Próximo prompt recomendado

```text
Codex, leia obrigatoriamente o AGENTS.md e docs/plano-reset-controlado-base-next-supabase.md antes de qualquer ação.

Vamos iniciar somente a próxima fase: especificação da primeira migration limpa para Supabase novo, sem aplicar.

Objetivo:
Criar uma especificação SQL revisável, ainda não executável/aplicada, para a base limpa inicial com profiles, patients, partners e partner_clients, usando roles cliente/parceiro/admin, status pending/active/suspended/disabled, text + check constraint, RLS planejada desde o começo e sem carregar dados legados.

Antes de editar, audite o plano de reset, modelo canônico, contratos de auth e docs de RLS. Apresente o plano exato de arquivos e aguarde confirmação antes de criar qualquer arquivo.

Restrições:
Não aplicar SQL, não criar projeto Supabase, não alterar banco, não alterar .env, não alterar runtime, não criar Supabase Next, não criar /login, não criar rotas, não alterar Edge Functions, não instalar dependências e não fazer commit.
```

## 15. Critérios de aceite deste plano

- decisão de reset controlado registrada;
- dados atuais não serão backfillados;
- preservações e descartes estão claros;
- recomendação por novo Supabase limpo está explícita;
- arquitetura alvo limpa está definida;
- ordem futura de implementação está documentada;
- nenhuma alteração operacional foi executada.
