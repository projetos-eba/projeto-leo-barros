# Parceiros - Cliente - Treinos

## Rota

`/parceiros/clientes/[id]?tab=treinos`

## Objetivo

Permitir que o Parceiro monte, edite, organize, publique e envie programas de treino para um Cliente vinculado, reutilizando a biblioteca de exercícios de Cadastros.

## Contrato funcional

- O perfil superior e as abas são compartilhados com Visão Geral, Avaliações e Dietas.
- A interface usa `Clientes`; `patients` permanece apenas no schema.
- `Cardio` não é uma aba ou módulo separado.
- Exercícios prescritos referenciam `partner_protocol_exercises` e preservam snapshot de nome, imagem e grupos musculares.
- Um Bi-set contém exatamente dois exercícios adjacentes da mesma divisão.
- Uma nova série copia reps, carga e intensidade da série anterior como valor editável.
- O volume considera apenas séries com reps e carga preenchidas.
- O mapa muscular soma grupo principal e grupos secundários, com peso menor para os secundários.
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
