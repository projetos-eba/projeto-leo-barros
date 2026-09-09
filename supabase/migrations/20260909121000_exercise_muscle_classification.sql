-- Canonical, reviewable classification by stable source key; never by display-name guessing.
create table public.exercise_muscle_classifications (
  source_key text primary key,
  primary_muscle_group text,
  secondary_muscle_groups text[] not null default '{}',
  review_status text not null check (review_status in ('classified', 'pending_review')),
  version text not null,
  constraint exercise_muscle_classification_primary_check check (
    (review_status = 'pending_review' and primary_muscle_group is null)
    or (review_status = 'classified' and primary_muscle_group is not null and primary_muscle_group in ('peito','costas','pernas','ombros','biceps','triceps','core','gluteos','cardio_condicionamento','mobilidade'))
  ),
  constraint exercise_muscle_classification_secondary_check check (
    secondary_muscle_groups <@ array['peito','costas','pernas','ombros','biceps','triceps','core','gluteos']::text[]
    and cardinality(secondary_muscle_groups) <= 4 and not (primary_muscle_group = any(secondary_muscle_groups))
  )
);
alter table public.exercise_muscle_classifications enable row level security;
revoke all on public.exercise_muscle_classifications from anon, authenticated;
grant select on public.exercise_muscle_classifications to service_role;

create table public.exercise_muscle_repair_audit (
  id bigint generated always as identity primary key,
  repaired_at timestamptz not null default now(),
  classification_version text not null,
  table_name text not null,
  record_id uuid not null,
  before_values jsonb not null,
  after_values jsonb not null
);
alter table public.exercise_muscle_repair_audit enable row level security;
revoke all on public.exercise_muscle_repair_audit from anon, authenticated;
grant select on public.exercise_muscle_repair_audit to service_role;

insert into public.exercise_muscle_classifications (source_key, primary_muscle_group, secondary_muscle_groups, review_status, version) values
('exercise-library:EX-ABDOMINAL-BICICLETA','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ABDOMINAL-COM-ELEVACAO-DE-QUADRIL','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ABDOMINAL-CRUNCH','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ABDOMINAL-DECLINADO','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ABDOMINAL-DECLINADO-SIT-UP','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ABDOMINAL-DECLINADO-COM-PESO','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ABDOMINAL-INVERTIDO','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ABDOMINAL-NA-MAQUINA','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ABDOMINAL-NA-MAQUINA-AB-COASTER','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ABDOMINAL-NA-POLIA','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ABDOMINAL-SIT-UP','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ABDOMINAL-V-V-UP','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ABDUCAO-DE-QUADRIL-DEITADO','gluteos',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ABDUCAO-DE-QUADRIL-NA-MAQUINA','gluteos',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ABDUCAO-DE-QUADRIL-NA-POLIA','gluteos',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-AFUNDO-LUNGE','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AFUNDO-COM-HALTERES','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AFUNDO-COM-ROTACAO-E-KETTLEBELL','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AFUNDO-PARADO-COM-BARRA','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-AFUNDO-COM-HALTERES','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-AFUNDO-NO-SMITH','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-BULGARO-COM-BARRA','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-BULGARO-COM-HALTERES','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-COM-HALTERES','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-COM-PAUSA-BARRA-NAS-COSTAS','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-COM-SALTO','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-EM-V-INVERTIDO','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-FRONTAL','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-GOBLET-COM-KETTLEBELL','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-HACK-NA-MAQUINA','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-NO-APARELHO-EM-V','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-NO-SMITH','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-OVERHEAD-COM-BARRA','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-PISTOL-UNILATERAL','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-PISTOL-NA-CAIXA','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-SUMO-COM-HALTERES','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-SUMO-COM-KETTLEBELL','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-AGACHAMENTO-SUMO-LIVRE','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-ARRANCO-SNATCH',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-ARRANCO-COM-HALTER',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-ARRANCO-COM-KETTLEBELL',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-ARRANCO-SUSPENSO-HANG-SNATCH',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-ARREMESSO-JERK',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-BALANCO-COM-KETTLEBELL-SWING',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-BALANCO-UNILATERAL-COM-KETTLEBELL',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-BARRA-FIXA-PULL-UP','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-BARRA-FIXA-ASSISTIDA-NA-MAQUINA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-BARRA-FIXA-SUPINADA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-BOM-DIA-GOOD-MORNING','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-CADEIRA-ADUTORA-ADUCAO-DE-COXA','pernas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-CANIVETE-PILATES-JACKKNIFE','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-COICE-DE-GLUTEO','gluteos',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-COICE-DE-GLUTEO-NA-MAQUINA','gluteos',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-COICE-DE-GLUTEO-NA-POLIA','gluteos',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-CONCHA-DEITADO-DE-LADO-CLAM','gluteos',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-CRUCIFIXO-COM-HALTERES','peito',array['ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-CRUCIFIXO-DECLINADO-COM-HALTERES','peito',array['ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-CRUCIFIXO-EM-PE-NA-POLIA','peito',array['ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-CRUCIFIXO-INCLINADO-NA-POLIA','peito',array['ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-CRUCIFIXO-INVERTIDO-NA-MAQUINA-PECK-DECK','ombros',array['costas']::text[],'classified','2026-09-09'),
('exercise-library:EX-CRUCIFIXO-INVERTIDO-NA-POLIA','ombros',array['costas']::text[],'classified','2026-09-09'),
('exercise-library:EX-CRUCIFIXO-NA-POLIA-BAIXA','peito',array['ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-DEAD-BUG-INSETO-MORTO','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-DESENVOLVIMENTO-ARNOLD-COM-HALTERES','ombros',array['triceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-DESENVOLVIMENTO-COM-ANILHA','ombros',array['triceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-DESENVOLVIMENTO-COM-HALTERES','ombros',array['triceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-DESENVOLVIMENTO-LANDMINE','ombros',array['triceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-DESENVOLVIMENTO-LANDMINE-UNILATERAL','ombros',array['triceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-DESENVOLVIMENTO-MILITAR','ombros',array['triceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-DESENVOLVIMENTO-NA-MAQUINA','ombros',array['triceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-DESENVOLVIMENTO-POR-TRAS-DA-NUCA','ombros',array['triceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-DESENVOLVIMENTO-SENTADO-COM-BARRA','ombros',array['triceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-DESENVOLVIMENTO-SENTADO-COM-HALTERES','ombros',array['triceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-DE-GLUTEO-E-POSTERIOR-GHR','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-DE-JOELHOS-NA-CADEIRA-DO-CAPITAO','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-DE-JOELHOS-SENTADO','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-DE-PANTURRILHA-EM-PE','pernas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-DE-PANTURRILHA-SENTADO','pernas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-DE-PERNAS','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-DE-PERNAS-NA-BARRA','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-DE-QUADRIL-HIP-THRUST','gluteos',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-DE-QUADRIL-COM-BARRA-HIP-THRUST','gluteos',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-DE-QUADRIL-NA-MAQUINA','gluteos',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-EM-Y-COM-HALTERES','ombros',array['costas']::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-FRONTAL-COM-BARRA-W','ombros',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-FRONTAL-COM-HALTERES','ombros',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-FRONTAL-NA-POLIA','ombros',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-LATERAL-COM-HALTERES','ombros',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-LATERAL-CURVADO-COM-HALTERES','ombros',array['costas']::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-LATERAL-NA-MAQUINA','ombros',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-LATERAL-NA-POLIA','ombros',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-LATERAL-POSTERIOR-SENTADO-COM-HALTERES','ombros',array['costas']::text[],'classified','2026-09-09'),
('exercise-library:EX-ELEVACAO-LATERAL-UNILATERAL-NA-POLIA','ombros',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ELIPTICO-MAQUINA','cardio_condicionamento',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ENCOLHIMENTO-COM-BARRA','costas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ENCOLHIMENTO-COM-HALTERES','costas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ENCOLHIMENTO-NA-MAQUINA','costas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ENCOLHIMENTO-NA-POLIA','costas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ENCOLHIMENTO-NO-SMITH','costas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ESCALADOR-MOUNTAIN-CLIMBER','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ESTEIRA','cardio_condicionamento',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-EXTENSAO-DE-PERNA-CADEIRA-EXTENSORA','pernas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-EXTENSAO-DE-PERNA-UNILATERAL','pernas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-EXTENSAO-DE-TRICEPS-ACIMA-DA-CABECA-NA-POLIA','triceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-EXTENSAO-DE-TRICEPS-COM-HALTERES','triceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-EXTENSAO-DE-TRICEPS-DEITADO-NA-POLIA','triceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-EXTENSAO-DE-TRICEPS-NA-MAQUINA','triceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-EXTENSAO-DE-TRICEPS-NA-POLIA','triceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-EXTENSAO-DE-TRICEPS-SENTADO-COM-HALTERES','triceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-EXTENSAO-LOMBAR','costas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-FACE-PULL-PUXADA-FACIAL','ombros',array['costas']::text[],'classified','2026-09-09'),
('exercise-library:EX-FLEXAO-ARCHER-ARQUEIRO','peito',array['triceps','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-FLEXAO-COM-PEGADA-FECHADA','triceps',array['peito','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-FLEXAO-DE-BRACO','peito',array['triceps','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-FLEXAO-DE-PERNA-MESA-FLEXORA','pernas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-FLEXAO-DE-PERNA-COM-HALTER','pernas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-FLEXAO-DE-PERNA-SENTADO-CADEIRA-FLEXORA','pernas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-FLEXAO-DE-PERNA-UNILATERAL','pernas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-FLEXAO-DE-PERNA-UNILATERAL-SENTADO','pernas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-FLEXAO-LATERAL-A-45-GRAUS','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-FLEXAO-LATERAL-NA-POLIA','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-FLEXAO-PIKE','ombros',array['triceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-HIPEREXTENSAO-LOMBAR','costas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-LEG-PRESS','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-LEG-PRESS-HORIZONTAL','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-LEG-PRESS-HORIZONTAL-UNILATERAL','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-LEG-PRESS-UNILATERAL','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-LEVANTAMENTO-TERRA-COM-TRAP-BAR','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-LEVANTAMENTO-TERRA-NO-SMITH','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-LEVANTAMENTO-TERRA-ROMENO-COM-HALTERES','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-LEVANTAMENTO-TERRA-SUMO-COM-PAUSA','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-LEVANTAMENTO-TERRA-UNILATERAL-COM-HALTERES','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-MAQUINA-DE-GLUTEO-MONSTER-GLUTE','gluteos',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-MERGULHO-NAS-PARALELAS',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-MERGULHO-NO-BANCO','triceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-MERGULHO-SENTADO-NA-MAQUINA','triceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-MUSCLE-UP-NA-BARRA',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-NADADOR-SWIMMING',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-PARALELAS-ASSISTIDAS-NA-MAQUINA',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-PES-NA-BARRA-TOES-TO-BAR','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-POLICHINELO','cardio_condicionamento',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-PONTE-DE-GLUTEO','gluteos',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-PONTE-DE-GLUTEO-UNILATERAL','gluteos',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-PRANCHA-LATERAL','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-PRANCHA-RKC','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-PULAR-CORDA','cardio_condicionamento',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-PULL-THROUGH-NA-POLIA',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-PULLOVER-COM-BARRA',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-PULLOVER-COM-HALTER',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-PUSH-PRESS',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-PUXADA-ABERTA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-PUXADA-ABERTA-UNILATERAL','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-PUXADA-ALTA-DO-ARRANCO',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-PUXADA-ALTA-DO-TERRA-SUMO',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-PUXADA-ALTA-SUMO-COM-KETTLEBELL',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-PUXADA-COM-BRACOS-ESTENDIDOS-NA-POLIA','costas',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-PUXADA-COM-PEGADA-MAG','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-PUXADA-COM-PEGADA-NEUTRA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-PUXADA-FRONTAL-PULLDOWN','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-PUXADA-POR-TRAS-DA-NUCA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-PUXADA-SUPINADA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-PUXADA-UNILATERAL-NA-POLIA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-ALTA-COM-BARRA',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-REMADA-ALTA-COM-BARRA-W',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-REMADA-ALTA-COM-HALTERES',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-REMADA-ALTA-NA-MAQUINA',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-REMADA-ALTA-PEGADA-SUPINADA-NA-MAQUINA',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-REMADA-ALTA-UNILATERAL-NA-MAQUINA',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-REMADA-BAIXA-NA-MAQUINA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-BAIXA-SENTADO-NA-POLIA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-BAIXA-SENTADO-NO-CHAO-NA-POLIA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-BAIXA-UNILATERAL-NA-MAQUINA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-CAVALINHO-NA-MAQUINA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-COM-BARRA-PEGADA-SUPINADA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-COM-HALTERES','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-DEITADO-COM-BARRA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-INCLINADA-COM-BARRA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-INCLINADA-COM-HALTERES','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-INVERTIDA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-NO-SMITH','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-PENDLAY','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-SENTADO-NA-MAQUINA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-SENTADO-UNILATERAL-NA-POLIA','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMADA-UNILATERAL-COM-HALTER-SERROTE','costas',array['biceps']::text[],'classified','2026-09-09'),
('exercise-library:EX-REMO-MAQUINA','cardio_condicionamento',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ROLO-ABDOMINAL-ROLL-OUT','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ROSCA-DE-BICEPS-NA-MAQUINA','biceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ROSCA-DE-PUNHO-COM-BARRA',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-ROSCA-DE-PUNHO-COM-BARRA-W',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-ROSCA-DE-PUNHO-COM-HALTERES',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-ROSCA-DE-PUNHO-INVERSA-COM-BARRA',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-ROSCA-DE-PUNHO-INVERSA-COM-HALTERES',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-ROSCA-DIRETA-COM-BARRA-W','biceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ROSCA-DIRETA-COM-HALTERES','biceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ROSCA-DIRETA-NA-POLIA','biceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ROSCA-INCLINADA-COM-HALTERES','biceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ROSCA-INVERSA-COM-BARRA','biceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ROSCA-MARTELO-COM-HALTERES','biceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ROSCA-MARTELO-NA-POLIA','biceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ROSCA-SCOTT-COM-BARRA','biceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ROSCA-SCOTT-COM-BARRA-W','biceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ROSCA-SCOTT-COM-HALTERES','biceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ROSCA-SCOTT-NA-MAQUINA','biceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ROTACAO-DE-TRONCO-NA-POLIA','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-ROTACAO-EXTERNA-NA-POLIA',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-ROTACAO-INTERNA-NA-POLIA',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-ROTACAO-RUSSA-RUSSIAN-TWIST','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-SIMULADOR-DE-ESCADA-STEPMILL','cardio_condicionamento',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-SKI-ERG-ERGOMETRO-DE-ESQUI','cardio_condicionamento',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-SNATCH-BALANCE',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-STIFF-TERRA-PERNAS-RIGIDAS','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-STIFF-COM-HALTERES','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-STIFF-UNILATERAL-COM-BARRA','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-SUBIDA-NO-BANCO-STEP-UP','pernas',array['gluteos']::text[],'classified','2026-09-09'),
('exercise-library:EX-SUPINO-COM-PEGADA-FECHADA','triceps',array['peito','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-SUPINO-DECLINADO-NA-MAQUINA','peito',array['triceps','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-SUPINO-INCLINADO-COM-BARRA','peito',array['triceps','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-SUPINO-INCLINADO-COM-HALTERES','peito',array['triceps','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-SUPINO-INCLINADO-COM-ROTACAO-E-HALTERES','peito',array['triceps','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-SUPINO-INCLINADO-NA-MAQUINA','peito',array['triceps','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-SUPINO-INCLINADO-NA-MAQUINA-CHEST-PRESS','peito',array['triceps','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-SUPINO-INCLINADO-NO-SMITH','peito',array['triceps','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-SUPINO-NA-MAQUINA-CHEST-PRESS','peito',array['triceps','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-SUPINO-NA-MAQUINA-HAMMER','peito',array['triceps','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-SUPINO-NO-SMITH','peito',array['triceps','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-SUPINO-RETO','peito',array['triceps','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-SUPINO-RETO-COM-HALTERES','peito',array['triceps','ombros']::text[],'classified','2026-09-09'),
('exercise-library:EX-THRUSTER-2',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-THRUSTER-COM-HALTERES',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-TOQUE-NO-OMBRO-PRANCHA','core',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-TRICEPS-COICE-COM-HALTERES','triceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-TRICEPS-PUSHDOWN-NA-POLIA','triceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-TRICEPS-TESTA','triceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-TRICEPS-TESTA-DEITADO','triceps',array[]::text[],'classified','2026-09-09'),
('exercise-library:EX-TURKISH-GET-UP',null,array[]::text[],'pending_review','2026-09-09'),
('exercise-library:EX-VOADOR-PECK-DECK','peito',array['ombros']::text[],'classified','2026-09-09');

-- New imports receive classifications; media reimports cannot clear existing classifications.
create function public.apply_system_exercise_muscle_classification()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare classification public.exercise_muscle_classifications;
begin
  if tg_op = 'UPDATE' and old.primary_muscle_group is not null and old.primary_muscle_group <> 'outros'
    and (new.primary_muscle_group is null or new.primary_muscle_group = 'outros') then
    new.primary_muscle_group := old.primary_muscle_group;
    new.secondary_muscle_groups := old.secondary_muscle_groups;
  end if;
  if (new.primary_muscle_group is null or new.primary_muscle_group = 'outros') and cardinality(new.secondary_muscle_groups) = 0 then
    select * into classification from public.exercise_muscle_classifications where source_key = new.source_key and review_status = 'classified';
    if found then
      new.primary_muscle_group := classification.primary_muscle_group;
      new.secondary_muscle_groups := classification.secondary_muscle_groups;
    end if;
  end if;
  return new;
end; $$;
revoke all on function public.apply_system_exercise_muscle_classification() from public, anon, authenticated;
create trigger system_exercise_muscle_classification before insert or update on public.system_exercises
for each row execute function public.apply_system_exercise_muscle_classification();

-- Explicit dry-run first. No automatic changes to historical prescriptions during migration.
create function public.repair_exercise_muscle_classifications(p_dry_run boolean default true)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare counts jsonb; candidate record; candidates jsonb;
begin
  -- Restrict callable repair to the operational service role / database owner.
  if current_user <> session_user and coalesce(auth.role(), '') <> 'service_role' and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select coalesce(jsonb_agg(to_jsonb(rows)), '[]'::jsonb) into candidates from (
  select 'system_exercises'::text as table_name, e.id, c.version,
    e.primary_muscle_group as old_primary, e.secondary_muscle_groups as old_secondary,
    c.primary_muscle_group as new_primary, c.secondary_muscle_groups as new_secondary
  from public.system_exercises e join public.exercise_muscle_classifications c using(source_key)
  where c.review_status = 'classified' and (e.primary_muscle_group is null or e.primary_muscle_group = 'outros') and cardinality(e.secondary_muscle_groups) = 0
  union all
  select 'partner_protocol_exercises', e.id, c.version, e.muscle_group, e.secondary_muscle_groups, c.primary_muscle_group, c.secondary_muscle_groups
  from public.partner_protocol_exercises e join public.system_exercises s on s.id = e.system_exercise_id join public.exercise_muscle_classifications c on c.source_key = s.source_key
  where c.review_status = 'classified' and e.muscle_group = 'outros' and cardinality(e.secondary_muscle_groups) = 0
  union all
  select 'partner_workout_exercises', w.id, c.version, w.snapshot_muscle_group, w.snapshot_secondary_muscle_groups, c.primary_muscle_group, c.secondary_muscle_groups
  from public.partner_workout_exercises w join public.partner_protocol_exercises e on e.id = w.exercise_id and e.partner_id = w.partner_id
    join public.system_exercises s on s.id = e.system_exercise_id join public.exercise_muscle_classifications c on c.source_key = s.source_key
  where c.review_status = 'classified' and w.snapshot_muscle_group = 'outros' and cardinality(w.snapshot_secondary_muscle_groups) = 0
    and (e.muscle_group = 'outros' and cardinality(e.secondary_muscle_groups) = 0 or e.muscle_group = c.primary_muscle_group and e.secondary_muscle_groups = c.secondary_muscle_groups)
  ) rows;
  select jsonb_build_object('dryRun', p_dry_run, 'system', count(*) filter(where table_name = 'system_exercises'),
    'library', count(*) filter(where table_name = 'partner_protocol_exercises'), 'snapshots', count(*) filter(where table_name = 'partner_workout_exercises'),
    'pendingReview', (select count(*) from public.exercise_muscle_classifications where review_status = 'pending_review')) into counts from jsonb_to_recordset(candidates) as r(table_name text);
  if not p_dry_run then
    for candidate in select * from jsonb_to_recordset(candidates) as r(table_name text, id uuid, version text, old_primary text, old_secondary text[], new_primary text, new_secondary text[]) loop
      if candidate.table_name = 'system_exercises' then
        update public.system_exercises set primary_muscle_group = candidate.new_primary, secondary_muscle_groups = candidate.new_secondary where id = candidate.id and primary_muscle_group is not distinct from candidate.old_primary and secondary_muscle_groups = candidate.old_secondary;
      elsif candidate.table_name = 'partner_protocol_exercises' then
        update public.partner_protocol_exercises set muscle_group = candidate.new_primary, secondary_muscle_groups = candidate.new_secondary where id = candidate.id and muscle_group = candidate.old_primary and secondary_muscle_groups = candidate.old_secondary;
      else
        update public.partner_workout_exercises set snapshot_muscle_group = candidate.new_primary, snapshot_secondary_muscle_groups = candidate.new_secondary where id = candidate.id and snapshot_muscle_group = candidate.old_primary and snapshot_secondary_muscle_groups = candidate.old_secondary;
      end if;
      if found then
        insert into public.exercise_muscle_repair_audit(classification_version, table_name, record_id, before_values, after_values)
        values(candidate.version, candidate.table_name, candidate.id,
          jsonb_build_object('primary', candidate.old_primary, 'secondary', candidate.old_secondary),
          jsonb_build_object('primary', candidate.new_primary, 'secondary', candidate.new_secondary));
      end if;
    end loop;
  end if;
  return counts;
end; $$;
revoke all on function public.repair_exercise_muscle_classifications(boolean) from public, anon, authenticated;
grant execute on function public.repair_exercise_muscle_classifications(boolean) to service_role;
