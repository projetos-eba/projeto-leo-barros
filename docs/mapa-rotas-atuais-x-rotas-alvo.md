# Mapa de rotas atuais x rotas alvo

Data de referencia: 16 de junho de 2026.

Este documento compara as rotas reais implementadas hoje em `src/App.tsx` com as rotas alvo do sitemap oficial em `docs/sitemap-projeto-leo-barros.md`.

Objetivo: orientar a migracao de React + Vite + React Router para Next.js App Router sem quebrar fluxos existentes e sem misturar os perfis `Cliente`, `Parceiros` e `Admin`.

## 1. Regras de leitura

Status usados:

- `Implementada`: existe rota no React Router atual.
- `Parcial`: existe tela proxima, mas a rota ou o papel ainda diverge do sitemap.
- `Placeholder`: rota existe, mas aponta para tela generica ou reaproveitada.
- `Nova`: rota alvo nao existe no codigo atual.
- `Decisao`: precisa de decisao de produto/arquitetura antes de migrar.

Regras:

- Nao remover rotas atuais ate existir redirect ou substituto validado.
- Novas rotas devem usar `/cliente`, `/parceiros` e `/admin`.
- O codigo atual usa `patient`/`patients`; o sitemap alvo usa `cliente`/`clientes`.
- O codigo atual concentra operacao de parceiro em `/admin`; a migracao deve separar `/parceiros` de `/admin`.

## 2. Rotas publicas e acesso

| Rota atual | Tela atual | Rota alvo | Perfil | Status | Observacao |
| --- | --- | --- | --- | --- | --- |
| `/` | `Login` | `/cliente/login` | Cliente | Parcial | Login atual autentica CPF/email e redireciona por role. O sitemap pede login por perfil. |
| `/` | `Login` | `/parceiros/login` | Parceiros | Parcial | Pode reaproveitar UI, mas precisa separar fluxo e copy de parceiro. |
| `/` | `Login` | `/admin/login` | Admin | Parcial | Admin restrito deve ter rota propria. |
| `/form/:token` | `FormFill` | Decisao | Publica | Decisao | Rota publica por token nao aparece no sitemap. Recomendo manter como excecao documentada ate decisao. |
| Nao existe | Nao existe | `/cliente/cadastro` | Cliente | Nova | Criar quando cadastro de cliente for escopo. |
| Nao existe | Nao existe | `/cliente/recuperar-senha` | Cliente | Nova | Pode reaproveitar fluxo visual do login. |
| Nao existe | Nao existe | `/cliente/onboarding` | Cliente | Nova | Depende de campos iniciais e regras de negocio. |
| Nao existe | Nao existe | `/parceiros/cadastro` | Parceiros | Nova | Provavel solicitacao/registro de parceiro. |
| Nao existe | Nao existe | `/parceiros/recuperar-senha` | Parceiros | Nova | Criar junto da separacao de login. |
| Nao existe | Nao existe | `/parceiros/onboarding` | Parceiros | Nova | Depende de especialidade, plano e disponibilidade. |
| Nao existe | Nao existe | `/admin/seguranca` | Admin | Nova | MFA/seguranca ainda nao identificado. |
| Nao existe | Nao existe | `/admin/auditoria` | Admin | Nova | Auditoria ainda nao identificada. |

## 3. Cliente

| Rota atual | Tela atual | Rota alvo | Status | Observacao |
| --- | --- | --- | --- | --- |
| `/patient` | `PatientDashboard` | `/cliente/inicio` | Parcial | Mudar nomenclatura e revisar conteudo contra sitemap. |
| `/patient` | `PatientDashboard` | `/cliente/inicio/resumo` | Parcial | Pode virar subarea de resumo diario. |
| Nao existe | Nao existe | `/cliente/inicio/atalhos` | Nova | Atalhos/notificacoes podem sair do dashboard atual. |
| `/patient/diet` | `PatientDiet` | `/cliente/dieta` | Parcial | Rota existe em ingles; alvo em portugues. |
| `/patient/diet` | `PatientDiet` | `/cliente/dieta/plano` | Parcial | Plano alimentar atual deve ser mapeado para subarea. |
| Nao identificado | Componentes de dieta | `/cliente/dieta/refeicoes` | Parcial | Pode reaproveitar `PatientDietTab`/meal components. |
| Nao existe | Nao existe | `/cliente/dieta/substituicoes` | Nova | Nao identificado nos arquivos analisados. |
| `/patient/workout` | `PatientWorkout` | `/cliente/treino` | Parcial | Rota existe em ingles; alvo em portugues. |
| `/patient/workout` | `PatientWorkout` | `/cliente/treino/programa-atual` | Parcial | Reaproveitar leitura de programa atual. |
| Nao identificado | `InlineWorkoutCard` | `/cliente/treino/programa-atual/detalhes` | Parcial | Detalhe existe como componente, nao como rota propria. |
| Nao existe | Nao existe | `/cliente/treino/programa-atual/:divisao` | Nova | Treino A/B/C deve virar rota profunda. |
| Nao existe | Nao existe | `/cliente/treino/forca-relativa` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/cliente/treino/forca-relativa/calculo` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/cliente/treino/forca-relativa/resultado` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/cliente/saude` | Nova | Hoje saude esta espalhada entre exames, prescricoes e possiveis modulos clinicos. |
| Nao existe | Nao existe | `/cliente/saude/sono` | Nova | Sono aparece no Figma, mas nao como rota atual. |
| Nao existe | Nao existe | `/cliente/saude/sono/registro` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/cliente/saude/sono/historico` | Nova | Figma mostra historico, mas rota nao existe. |
| Nao existe | Nao existe | `/cliente/saude/mlpa` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/cliente/saude/mlpa/registro` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/cliente/saude/mlpa/historico` | Nova | Nao identificado nos arquivos analisados. |
| `/patient/evolution` | `PatientEvolution` | `/cliente/evolucao` | Parcial | Rota existe em ingles; alvo em portugues. |
| `/patient/evolution` | `PatientEvolution` | `/cliente/evolucao/corporal` | Parcial | Evolucao corporal provavelmente coberta. |
| Nao identificado | `PatientEvolutionTab` | `/cliente/evolucao/corporal/historico` | Parcial | Historico existe como componente/estado, nao rota propria. |
| `/patient/workout` | `PatientWorkout` | `/cliente/evolucao/treinamento` | Parcial | Pode haver compartilhamento de dados com treino. |
| Nao identificado | `WorkoutHistoryPanel` | `/cliente/evolucao/treinamento/detalhes` | Parcial | Painel existe, rota propria nao. |
| Nao existe | Nao existe | `/cliente/evolucao/treinamento/programa-atual` | Nova | Pode reaproveitar programa atual do treino. |
| Nao existe | Nao existe | `/cliente/configuracoes` | Nova | Configuracoes do cliente nao identificadas. |
| Nao existe | Nao existe | `/cliente/configuracoes/dados` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/cliente/configuracoes/seguranca` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/cliente/configuracoes/seguranca/senha` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/cliente/configuracoes/notificacoes` | Nova | Nao identificado nos arquivos analisados. |
| `/patient/exams` | `PatientExams` | Decisao | Cliente | Decisao | Sitemap coloca Exames no contexto de Parceiros/cliente selecionado, nao no menu Cliente atual. Avaliar se entra em `/cliente/saude`. |
| `/patient/prescriptions` | `PatientPrescriptions` | Decisao | Cliente | Decisao | Prescricoes nao aparecem no sitemap atual. Recomendo registrar decisao antes de migrar. |

## 4. Parceiros

| Rota atual | Tela atual | Rota alvo | Status | Observacao |
| --- | --- | --- | --- | --- |
| `/admin/dashboard` | `AdminDashboard` | `/parceiros/dashboard` | Parcial | A tela atual e operacional de carteira de pacientes, mais aderente a Parceiros do que Admin. |
| `/admin/dashboard` | `AdminDashboard` | `/parceiros/dashboard/visao-geral` | Parcial | Visao geral pode ser extraida da tela atual. |
| `/admin/dashboard` | `AdminDashboard` | `/parceiros/dashboard/indicadores` | Parcial | KPIs e graficos atuais podem alimentar esta subarea. |
| `/admin/dashboard` | `AdminDashboard` | `/parceiros/dashboard/alertas` | Parcial | Bloco `Atencao Prioritaria` pode migrar para alertas. |
| `/admin/patients` | `AdminPatients` | `/parceiros/clientes` | Parcial | Renomear Pacientes para Clientes e migrar rota. |
| `/admin/patients/:id` | `AdminPatientDetail` | `/parceiros/clientes/:id` | Parcial | Hoje e detalhe operacional completo. |
| `/admin/patients/:id` | `AdminPatientDetail` | `/parceiros/clientes/:id/visao-geral` | Parcial | Aba inicial deve virar rota contextual. |
| `/admin/patients/:id` | `AnamnesisTab` | `/parceiros/clientes/:id/anamnese` | Parcial | Aba existe; rota propria ainda nao. |
| `/admin/patients/:id` | `PatientEvolutionTab` / `PhysicalAssessmentModule` | `/parceiros/clientes/:id/avaliacoes` | Parcial | Agrupar avaliacao/evolucao conforme sitemap. |
| `/admin/patients/:id` | `PatientDietTab` | `/parceiros/clientes/:id/dietas` | Parcial | Aba existe; rota propria ainda nao. |
| `/admin/diets` | `AdminDiets` | `/parceiros/clientes/:id/dietas/editor` | Parcial | Editor/lista atual precisa ser separado entre biblioteca e dieta do cliente. |
| `/admin/patients/:id` | `PatientWorkoutTab` | `/parceiros/clientes/:id/treino` | Parcial | Aba existe; rota propria ainda nao. |
| `/admin/workouts` | `AdminPatients` | `/parceiros/clientes/:id/treino/editor` | Placeholder | Rota atual aponta para listagem de pacientes; precisa implementacao real. |
| `/admin/patients/:id` | `PatientCardioTab` | `/parceiros/clientes/:id/cardio` | Parcial | Aba existe; rota propria ainda nao. |
| `/admin/patients/:id` | `PatientExamsTab` | `/parceiros/clientes/:id/exames` | Parcial | Aba existe; rota propria ainda nao. |
| Nao identificado | `PatientInfoHeader` / planos | `/parceiros/clientes/:id/financeiro` | Parcial | Ha `patient_plans`; financeiro completo nao identificado. |
| `/admin/agenda` | `AdminAgenda` | `/parceiros/agenda` | Parcial | Migrar rota para perfil Parceiros. |
| `/admin/agenda` | `AdminAgenda` | `/parceiros/agenda/calendario` | Parcial | Calendario pode ser subarea principal. |
| Nao existe | Nao existe | `/parceiros/agenda/:id` | Nova | Atendimento individual nao identificado. |
| Nao existe | Nao existe | `/parceiros/agenda/:id/detalhes` | Nova | Nao identificado nos arquivos analisados. |
| `/admin/materials` | `AdminMaterials` | `/parceiros/materiais` | Parcial | Migrar biblioteca de materiais para Parceiros. |
| `/admin/materials` | `AdminMaterials` | `/parceiros/materiais/biblioteca` | Parcial | Biblioteca atual pode ser subarea. |
| Nao existe | Nao existe | `/parceiros/materiais/:id` | Nova | Detalhe de material nao identificado. |
| Nao existe | Nao existe | `/parceiros/materiais/:id/enviar` | Nova | Envio para cliente precisa fluxo dedicado. |
| `/admin/foods` | `AdminFoods` | `/parceiros/cadastros/alimentos` | Parcial | Migrar para Cadastros de Parceiros. |
| Nao identificado | `ImportFoodDialog` | `/parceiros/cadastros/alimentos/importar` | Parcial | Dialog existe; rota propria ainda nao. |
| Nao identificado | `taco-foods.ts` / `tbca-foods.ts` | `/parceiros/cadastros/alimentos/importar/taco-tcbio` | Parcial | Bases existem em data files; fluxo profundo precisa rota. |
| `/admin/exercises` | `AdminExercises` | `/parceiros/cadastros/treinos/exercicios` | Parcial | Migrar para Cadastros de Parceiros. |
| `/admin/techniques` | `AdminTechniques` | `/parceiros/cadastros/treinos` | Parcial | Tecnicas fazem parte de base de treino; rota alvo exata precisa decisao. |
| Nao existe | Nao existe | `/parceiros/cadastros/treinos/exercicios/novo` | Nova | Dialog de exercicio existe, mas rota propria nao. |
| `/admin/forms` | `AdminForms` | Decisao | Parceiros | Decisao | Formulario nao aparece no sitemap alvo; pode entrar em Cadastros ou Materiais. |
| `/admin/forms/new` | `AdminFormEditor` | Decisao | Parceiros | Decisao | Definir antes de migrar. |
| `/admin/forms/:id/edit` | `AdminFormEditor` | Decisao | Parceiros | Decisao | Definir antes de migrar. |
| `/admin/extras` | Nao roteada em `App.tsx` | Decisao | Parceiros | Placeholder | Aparece na sidebar como Materiais Extras, mas nao existe rota atual. |
| Nao existe | Nao existe | `/parceiros/configuracoes` | Nova | Configuracoes do parceiro nao identificadas. |
| Nao existe | Nao existe | `/parceiros/configuracoes/perfil` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/parceiros/configuracoes/preferencias` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/parceiros/configuracoes/disponibilidade` | Nova | Pode relacionar com agenda. |

## 5. Admin

| Rota atual | Tela atual | Rota alvo | Status | Observacao |
| --- | --- | --- | --- | --- |
| `/admin/dashboard` | `AdminDashboard` | `/admin/dashboard` | Decisao | Tela atual parece operacional de parceiro. Admin alvo deve ter metricas da plataforma. |
| Nao existe | Nao existe | `/admin/dashboard/metricas` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/dashboard/metricas/:indicador` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/dashboard/receita` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/dashboard/receita/assinaturas` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/profissionais` | Nova | Gestao de profissionais nao identificada no codigo atual. |
| Nao existe | Nao existe | `/admin/profissionais/contas` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/profissionais/:id` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/profissionais/:id/permissoes` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/profissionais/:id/assinatura` | Nova | Nao identificado nos arquivos analisados. |
| `/admin/patients` | `AdminPatients` | `/admin/clientes` | Decisao | Pode virar gestao administrativa de usuarios, mas tela atual e operacional. |
| Nao existe | Nao existe | `/admin/clientes/usuarios` | Nova | Nao identificado nos arquivos analisados. |
| `/admin/patients/:id` | `AdminPatientDetail` | `/admin/clientes/:id` | Decisao | Detalhe atual e operacional; Admin alvo deve ser gestao de usuario. |
| Nao existe | Nao existe | `/admin/clientes/:id/acessos` | Nova | Historico de acesso nao identificado. |
| Nao existe | Nao existe | `/admin/relatorios` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/relatorios/extracao` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/relatorios/extracao/filtros` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/relatorios/extracao/exportar` | Nova | Exportacao nao identificada como rota. |
| Nao existe | Nao existe | `/admin/relatorios/operacionais` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/relatorios/operacionais/engajamento` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/financeiro` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/financeiro/assinaturas` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/financeiro/assinaturas/planos` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/financeiro/assinaturas/:id/ajustar` | Nova | Nao identificado nos arquivos analisados. |
| Nao existe | Nao existe | `/admin/financeiro/receita` | Nova | Nao identificado nos arquivos analisados. |

## 6. Estrutura alvo sugerida para Next.js

```text
src/app/
  (public)/
    page.tsx
    form/[token]/page.tsx
  cliente/
    login/page.tsx
    cadastro/page.tsx
    recuperar-senha/page.tsx
    onboarding/page.tsx
    layout.tsx
    inicio/page.tsx
    dieta/page.tsx
    treino/page.tsx
    saude/page.tsx
    evolucao/page.tsx
    configuracoes/page.tsx
  parceiros/
    login/page.tsx
    cadastro/page.tsx
    recuperar-senha/page.tsx
    onboarding/page.tsx
    layout.tsx
    dashboard/page.tsx
    clientes/page.tsx
    clientes/[id]/layout.tsx
    clientes/[id]/visao-geral/page.tsx
    clientes/[id]/anamnese/page.tsx
    clientes/[id]/avaliacoes/page.tsx
    clientes/[id]/dietas/page.tsx
    clientes/[id]/treino/page.tsx
    clientes/[id]/cardio/page.tsx
    clientes/[id]/exames/page.tsx
    agenda/page.tsx
    materiais/page.tsx
    cadastros/page.tsx
    configuracoes/page.tsx
  admin/
    login/page.tsx
    layout.tsx
    dashboard/page.tsx
    profissionais/page.tsx
    clientes/page.tsx
    relatorios/page.tsx
    financeiro/page.tsx
```

## 7. Ordem recomendada de migracao

1. Manter app Vite funcional enquanto o mapa e a base Next sao preparados.
2. Criar uma base Next.js paralela ou uma branch de migracao.
3. Migrar providers globais: Query Client, Tooltip, Toasters e tema.
4. Migrar CSS/tokens e decidir como aproximar `Inter`/`Plus Jakarta Sans` de `Rethink Sans`.
5. Migrar primeiro `/admin/dashboard` para `/parceiros/dashboard`.
6. Migrar `/admin/patients` para `/parceiros/clientes`.
7. Migrar `/admin/patients/:id` para `/parceiros/clientes/:id/visao-geral` e rotas contextuais.
8. Migrar `/patient` para `/cliente/inicio`.
9. Migrar dieta, treino, evolucao e exames do cliente.
10. Criar Admin real somente depois de separar Parceiros.

## 8. Pendencias de decisao

- O que fazer com `/form/:token`: manter publica, mover ou documentar como excecao.
- Onde entram `Prescricoes`, `Fotos` e `Formularios`, pois nao aparecem claramente no sitemap alvo.
- Se `/admin/diets` vira biblioteca/cadastro, editor contextual ou ambos.
- Se `AdminDashboard` atual pertence integralmente a Parceiros.
- Como separar usuario `admin` de `parceiro` no Supabase auth.
- Quando aplicar `Rethink Sans` e tokens alvo sem perder fidelidade das telas atuais.

