# Resultado do relatório de ambiguidades para futuro backfill de `profiles`

Data de execução: 21 de junho de 2026.

Status: análise da Fase 4.7 com consultas SQL somente leitura.

Ambiente: Supabase conectado ao projeto via ferramenta segura de SQL. O usuário confirmou que o ambiente não é produção.

Esta análise executou apenas consultas de leitura (`select`, `count`, `group by`, `left join`, `where` e CTEs de leitura). Nenhuma operação de escrita foi executada.

## 1. Escopo

Objetivo desta execução:

- inventariar usuários Auth;
- inventariar pacientes;
- identificar roles legados;
- identificar candidatos seguros a `profiles`;
- identificar ambiguidades antes de qualquer migration ou backfill;
- preservar dados sensíveis por agregação e mascaramento.

Fora do escopo:

- criar migration;
- aplicar SQL de escrita;
- alterar banco;
- alterar Supabase;
- alterar RLS;
- alterar policies;
- alterar Edge Functions;
- alterar runtime;
- criar Supabase Next;
- criar rotas, guards ou middleware.

## 2. Regras de proteção aplicadas

- E-mails foram mascarados.
- CPFs foram mascarados.
- UUIDs foram truncados.
- Nenhum secret foi lido ou exposto.
- Nenhum token foi consultado ou exposto.
- Nenhum `access_token` de formulário foi listado.
- Nenhum dado clínico foi exportado.
- Resultados agregados foram priorizados.

## 3. Consultas executadas

Foram executadas consultas somente leitura para:

1. métricas agregadas gerais;
2. distribuição de roles legados em `auth.users`;
3. classificação agregada de usuários para tomada de decisão;
4. admins legados ambíguos com dados mascarados;
5. usuários `patient` sem vínculo em `patients` com dados mascarados;
6. pacientes vinculados a Auth com role diferente de `patient` com dados mascarados;
7. pacientes sem `user_id` com dados mascarados.

Nenhuma consulta de escrita foi executada.

## 4. Resultados agregados

| Métrica | Total |
| --- | ---: |
| Usuários Auth | 2 |
| Pacientes | 9 |
| Usuários Auth com role legado `admin` | 1 |
| Usuários Auth com role legado `patient` | 1 |
| Usuários Auth sem role | 0 |
| Usuários Auth com role inesperado | 0 |
| Pacientes com `user_id` | 1 |
| Pacientes sem `user_id` | 8 |
| Pacientes com `user_id` sem Auth correspondente | 0 |
| Usuários Auth sem patient correspondente | 1 |
| Candidatos claros a Cliente ativo | 0 |
| Usuários `patient` sem patient correspondente | 1 |
| Pacientes vinculados a Auth com role diferente de `patient` | 1 |
| Admins legados ambíguos | 1 |
| Grupos duplicados por `patients.user_id` | 0 |
| Grupos duplicados por e-mail Auth | 0 |
| Grupos duplicados por e-mail em pacientes | 0 |
| Grupos duplicados por CPF em pacientes | 0 |
| E-mails sintéticos `@patient.local` | 0 |

## 5. Distribuição de roles legados

| Role legado | Total |
| --- | ---: |
| `admin` | 1 |
| `patient` | 1 |

Não foram encontrados usuários sem role nem roles inesperados.

## 6. Classificação para tomada de decisão

| Classificação | Total |
| --- | ---: |
| `admin_legado_revisao_manual` | 1 |
| `patient_sem_patient_revisao_manual` | 1 |

Resultado crítico:

- não há candidato claro a `cliente active` pelo critério estrito da Fase 4.6;
- nenhum usuário deve entrar em backfill automático neste momento.

## 7. Candidatos claros a Cliente

Total: `0`.

Critério esperado:

- Auth com `user_metadata.role = 'patient'`;
- vínculo correspondente em `patients.user_id`;
- ausência de duplicidade relevante.

Resultado:

- nenhum usuário atende ao critério completo.

Consequência:

- não há base segura para criar `profiles.role = 'cliente'` automaticamente nesta execução.

## 8. Admins legados ambíguos

Total: `1`.

Caso mascarado:

| Auth | E-mail mascarado | Role legado | Possui patient vinculado? | Patient | Ação |
| --- | --- | --- | --- | --- | --- |
| `25336172…` | `a***@gmail.com` | `admin` | Sim | `08718ae7…` | Revisão manual obrigatória |

Interpretação:

- existe um usuário Auth com role legado `admin`;
- esse usuário está vinculado a um registro em `patients`;
- isso reforça a ambiguidade central já prevista: admin legado não pode virar Super Admin automaticamente.

Recomendação:

- classificar manualmente esse usuário antes de qualquer backfill;
- opções futuras possíveis: `parceiro`, `admin` real aprovado, `pending`, `suspended`, `disabled` ou ausência de profile até decisão.

## 9. Usuários `patient` sem vínculo em `patients`

Total: `1`.

Caso mascarado:

| Auth | E-mail mascarado | Role legado | Possui patient vinculado? | Ação |
| --- | --- | --- | --- | --- |
| `76d5de90…` | `p***@example.com` | `patient` | Não | Revisão manual |

Interpretação:

- há um usuário Auth com role legado `patient`;
- ele não possui registro correspondente em `patients.user_id`;
- portanto, não deve virar Cliente ativo automaticamente.

Recomendação:

- verificar se é conta de teste, cadastro incompleto, usuário órfão ou vínculo faltante;
- manter fora do backfill automático até decisão.

## 10. Pacientes vinculados a Auth com role diferente de `patient`

Total: `1`.

Caso mascarado:

| Patient | E-mail mascarado | CPF mascarado | Auth | Role Auth | Ação |
| --- | --- | --- | --- | --- | --- |
| `08718ae7…` | `a***@gmail.com` | `***.***.***-44` | `25336172…` | `admin` | Revisão manual |

Interpretação:

- existe paciente com `user_id`;
- o Auth correspondente tem role legado `admin`, não `patient`;
- esse registro bloqueia qualquer backfill automático simples.

Recomendação:

- decidir se esse Auth representa um paciente real, parceiro/profissional, admin real ou conta usada indevidamente em testes.

## 11. Pacientes sem `user_id`

Total: `8`.

Casos mascarados:

| Patient | E-mail mascarado | CPF mascarado | Ação |
| --- | --- | --- | --- |
| `93ab1380…` | Não informado | Não informado | Revisão cadastral |
| `0f3bf159…` | Não informado | Não informado | Revisão cadastral |
| `b15e8463…` | Não informado | Não informado | Revisão cadastral |
| `a39f99cd…` | Não informado | Não informado | Revisão cadastral |
| `95385afe…` | Não informado | Não informado | Revisão cadastral |
| `e18448a4…` | Não informado | Não informado | Revisão cadastral |
| `e8a97ae6…` | Não informado | Não informado | Revisão cadastral |
| `dbc3e37e…` | Não informado | Não informado | Revisão cadastral |

Interpretação:

- a maior parte dos pacientes não possui vínculo Auth;
- esses registros não devem receber `profiles` automaticamente;
- podem representar cadastros clínicos sem login, dados incompletos ou registros legados.

## 12. Pacientes com vínculo quebrado

Total: `0`.

Interpretação:

- não foram encontrados pacientes com `user_id` apontando para Auth inexistente.

## 13. Duplicidades encontradas

| Tipo de duplicidade | Total |
| --- | ---: |
| `patients.user_id` duplicado | 0 |
| e-mail em Auth duplicado | 0 |
| e-mail em pacientes duplicado | 0 |
| CPF em pacientes duplicado | 0 |

Interpretação:

- não há bloqueio por duplicidade nesta amostra;
- o bloqueio principal é de vínculo/role, não de duplicidade.

## 14. Usuários sem role ou role inválido

| Categoria | Total |
| --- | ---: |
| Sem role | 0 |
| Role inesperado | 0 |

Interpretação:

- todos os usuários Auth têm roles legados conhecidos: `admin` ou `patient`;
- ainda assim, ambos exigem revisão por inconsistência de vínculo.

## 15. Casos que exigem revisão manual

Revisão manual obrigatória:

1. Auth `admin` vinculado a patient.
2. Auth `patient` sem patient correspondente.
3. Oito pacientes sem `user_id`.

Nenhum desses casos deve receber profile ativo automaticamente.

## 16. Recomendação para futura migration `profiles`

Não iniciar backfill automático ainda.

Antes da migration real de `profiles`, resolver:

1. classificar o usuário `admin` vinculado a patient;
2. decidir se o Auth `patient` sem patient é teste, órfão ou cadastro incompleto;
3. decidir o destino dos oito pacientes sem `user_id`;
4. definir se algum paciente sem Auth deve receber login futuro;
5. documentar a classificação manual antes de qualquer escrita.

Backfill seguro neste momento:

- `cliente active`: `0`;
- `admin active`: `0`;
- `parceiro active`: `0`;
- `pending/revisão`: pelo menos `10` registros/casos de atenção considerando Auth e patients.

## 17. O que não foi implementado

- Nenhuma migration foi criada.
- Nenhum SQL de escrita foi executado.
- Nenhum banco foi alterado.
- Nenhum Supabase client foi alterado.
- Nenhuma RLS foi alterada.
- Nenhuma policy foi alterada.
- Nenhuma Edge Function foi alterada.
- Nenhum runtime foi alterado.
- Nenhuma rota foi criada.
- Nenhum guard ou middleware foi criado.
- Nenhuma dependência foi instalada.

## 18. Validação

Validação feita por:

- execução de consultas SQL somente leitura;
- uso de resultados agregados;
- mascaramento dos casos individuais;
- não exposição de secrets, tokens, CPF completo ou e-mail completo.

## 19. Próximos passos recomendados

1. Fazer classificação manual dos casos ambíguos.
2. Registrar decisão para o Auth `admin` vinculado a patient.
3. Registrar decisão para o Auth `patient` sem patient.
4. Decidir política para pacientes sem `user_id`.
5. Só depois especificar a primeira migration executável de `profiles`.
6. Manter a migration de `profiles` separada do backfill.
7. Manter RLS para fase própria, com testes SQL.
