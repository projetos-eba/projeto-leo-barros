# Parceiros - Cliente - Treinos

## Rota

`/parceiros/clientes/[id]?tab=treinos`

## Objetivo

Permitir que o Parceiro monte, edite, organize, publique e envie programas de treino para um Cliente vinculado, reutilizando a biblioteca de exercícios de Cadastros.

## Contrato funcional

- O perfil superior e as abas são compartilhados com Visão Geral, Avaliações e Dietas.
- A interface usa `Clientes`; `patients` permanece apenas no schema.
- `Cardio` agora é aba própria do perfil do Cliente. Treinos não mistura o domínio novo de Cardio, mas dados legados `cardio` fora desta aba continuam agrupados como `Treino`.
- Exercícios prescritos referenciam `partner_protocol_exercises` e preservam snapshot de nome, imagem e grupos musculares.
- Um Bi-set contém exatamente dois exercícios adjacentes da mesma divisão.
- A grade mostra 5 colunas de séries: séries existentes ficam editáveis, e colunas vazias aparecem como placeholders opacos clicáveis.
- Novos exercícios entram com pelo menos 3 séries; séries adicionais copiam reps, carga e intensidade da série anterior como valor editável.
- O volume considera apenas séries com reps e carga preenchidas.
- O mapa muscular usa somente tons de azul e conta quantos exercícios trabalham cada grupo, considerando grupo principal e secundários uma vez por exercício: 1 exercício = nível claro, 2 a 4 = nível médio, 5 ou mais = nível forte.
- A ordenação de exercícios é feita por setas de subir/descer no fim da linha; não há checkbox de execução do profissional.
- Templates pertencem ao Parceiro, não a um Cliente, e são clonados ao aplicar.
- Apenas um programa publicado ou enviado permanece ativo por Cliente.

## Banco

Migration principal:

`supabase/migrations/20260702013000_partner_client_workouts.sql`

Tabelas:

- `partner_workout_programs`
- `partner_workout_sessions`
- `partner_workout_exercises`
- `partner_workout_sets`
- `partner_workout_events`

RPCs:

- `partner_client_workouts(patient_id)`
- `partner_clone_workout_program(source_program_id, patient_id, as_template)`

## Segurança

- RLS usa `current_active_partner_id()` e `current_partner_has_active_patient_link()`.
- Nenhuma resposta da RPC inclui CPF.
- Templates e biblioteca são isolados por Parceiro.

## Smoke

- Login: `antonioferrari2002@gmail.com`
- Cliente: `/parceiros/clientes/a1000000-0000-4000-8000-000000000301?tab=treinos`
- Seed inclui programa publicado, divisões A/B/C, Bi-set, séries, mapa muscular e template.
