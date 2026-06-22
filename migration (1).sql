-- =====================================================================
-- MIGRAÇÃO COMPLETA DO BANCO DE DADOS
-- Sistema de Gestão Médico-Nutricional
-- Compatível com PostgreSQL 14+ / Supabase
-- =====================================================================
-- Ordem de execução:
--   1. Extensões
--   2. Tabelas (CREATE TABLE)
--   3. Índices e Unique Constraints
--   4. Habilitar RLS
--   5. Policies
--   6. (Opcional) Foreign Keys recomendadas
--   7. (Opcional) Storage Buckets
-- =====================================================================


-- =====================================================================
-- 1. EXTENSÕES
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Extensões adicionais já presentes em projetos Supabase por padrão:
--   plpgsql, pg_stat_statements, pg_graphql, supabase_vault


-- =====================================================================
-- 2. TABELAS
-- =====================================================================

-- ---------- patients ----------
CREATE TABLE public.patients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text,
  phone       text,
  cpf         text UNIQUE,
  birth_date  date,
  sex         text,
  objective   text,
  user_id     uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- anamneses ----------
CREATE TABLE public.anamneses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid NOT NULL,
  content     text NOT NULL DEFAULT ''::text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- body_measurements ----------
CREATE TABLE public.body_measurements (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid NOT NULL,
  measured_at      date NOT NULL DEFAULT CURRENT_DATE,
  weight           numeric,
  body_fat_pct     numeric,
  muscle_mass_pct  numeric,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------- diets ----------
CREATE TABLE public.diets (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id         uuid NOT NULL,
  name               text NOT NULL DEFAULT 'Dieta'::text,
  notes              text NOT NULL DEFAULT ''::text,
  calories_snapshot  numeric,
  weight_snapshot    numeric,
  released_at        timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ---------- diet_meals ----------
CREATE TABLE public.diet_meals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_id     uuid NOT NULL,
  name        text NOT NULL,
  time        text,
  sort_order  integer NOT NULL DEFAULT 0
);

-- ---------- diet_meal_foods ----------
CREATE TABLE public.diet_meal_foods (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_meal_id  uuid NOT NULL,
  food_id       uuid,
  food_name     text NOT NULL,
  measure       text NOT NULL DEFAULT 'g'::text,
  quantity      numeric NOT NULL DEFAULT 0,
  protein       numeric NOT NULL DEFAULT 0,
  carbs         numeric NOT NULL DEFAULT 0,
  fat           numeric NOT NULL DEFAULT 0,
  sort_order    integer NOT NULL DEFAULT 0
);

-- ---------- foods ----------
CREATE TABLE public.foods (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  category          text NOT NULL DEFAULT 'Outros'::text,
  measure           text NOT NULL DEFAULT 'g'::text,
  kcal_per_unit     numeric NOT NULL DEFAULT 0,
  protein_per_unit  numeric NOT NULL DEFAULT 0,
  carbs_per_unit    numeric NOT NULL DEFAULT 0,
  fat_per_unit      numeric NOT NULL DEFAULT 0,
  fiber_per_unit    numeric NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------- exercise_catalog ----------
CREATE TABLE public.exercise_catalog (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  muscle_group  text NOT NULL DEFAULT 'PEITO'::text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------- technique_catalog ----------
CREATE TABLE public.technique_catalog (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  description  text NOT NULL DEFAULT ''::text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------- workout_programs ----------
CREATE TABLE public.workout_programs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   uuid NOT NULL,
  name         text NOT NULL DEFAULT 'Treino'::text,
  description  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------- workout_days ----------
CREATE TABLE public.workout_days (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id     uuid NOT NULL,
  name           text NOT NULL,
  rep_range      text DEFAULT '10-12'::text,
  rest_interval  text DEFAULT '60s'::text,
  sort_order     integer NOT NULL DEFAULT 0
);

-- ---------- workout_exercises ----------
CREATE TABLE public.workout_exercises (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_day_id  uuid NOT NULL,
  name            text NOT NULL,
  sets            integer NOT NULL DEFAULT 3,
  reps            text NOT NULL DEFAULT '10-12'::text,
  rest_seconds    integer DEFAULT 60,
  technique       text,
  notes           text,
  sort_order      integer NOT NULL DEFAULT 0,
  reps_s1         integer,
  reps_s2         integer,
  reps_s3         integer,
  reps_s4         integer,
  reps_s5         integer,
  reps_s6         integer,
  load_s1         text,
  load_s2         text,
  load_s3         text,
  load_s4         text,
  load_s5         text,
  load_s6         text
);

-- ---------- lab_exams ----------
CREATE TABLE public.lab_exams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid NOT NULL,
  exam_date   date NOT NULL DEFAULT CURRENT_DATE,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- lab_exam_results ----------
CREATE TABLE public.lab_exam_results (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_exam_id    uuid NOT NULL,
  marker_name    text NOT NULL,
  value          numeric NOT NULL,
  unit           text NOT NULL DEFAULT ''::text,
  reference_min  numeric,
  reference_max  numeric,
  sort_order     integer NOT NULL DEFAULT 0
);

-- ---------- materials_pdfs ----------
CREATE TABLE public.materials_pdfs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  description  text NOT NULL DEFAULT ''::text,
  category     text NOT NULL DEFAULT ''::text,
  file_name    text NOT NULL,
  file_url     text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------- materials_videos ----------
CREATE TABLE public.materials_videos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text NOT NULL DEFAULT ''::text,
  youtube_id   text NOT NULL,
  youtube_url  text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------- form_templates ----------
CREATE TABLE public.form_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  description  text NOT NULL DEFAULT ''::text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------- form_questions ----------
CREATE TABLE public.form_questions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_template_id  uuid NOT NULL,
  question_text     text NOT NULL,
  question_type     text NOT NULL DEFAULT 'text'::text,
  description       text NOT NULL DEFAULT ''::text,
  options           jsonb DEFAULT '[]'::jsonb,
  multi_select      boolean NOT NULL DEFAULT false,
  scale_min         integer DEFAULT 1,
  scale_max         integer DEFAULT 10,
  scale_label_min   text NOT NULL DEFAULT ''::text,
  scale_label_max   text NOT NULL DEFAULT ''::text,
  required          boolean NOT NULL DEFAULT false,
  image_url         text,
  sort_order        integer NOT NULL DEFAULT 0
);

-- ---------- form_assignments ----------
CREATE TABLE public.form_assignments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_template_id  uuid NOT NULL,
  patient_id        uuid NOT NULL,
  access_token      text UNIQUE DEFAULT encode(extensions.gen_random_bytes(16), 'hex'::text),
  assigned_at       timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

-- ---------- form_responses ----------
CREATE TABLE public.form_responses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_assignment_id  uuid NOT NULL,
  form_question_id    uuid NOT NULL,
  answer_text         text DEFAULT ''::text,
  answer_number       numeric,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ---------- patient_energy_profiles ----------
CREATE TABLE public.patient_energy_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        uuid NOT NULL UNIQUE,
  height            numeric,
  activity_factor   numeric NOT NULL DEFAULT 1.2,
  selected_formula  text,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------- patient_plans ----------
CREATE TABLE public.patient_plans (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid NOT NULL UNIQUE,
  diet_active      boolean NOT NULL DEFAULT false,
  workout_active   boolean NOT NULL DEFAULT false,
  medical_active   boolean NOT NULL DEFAULT false,
  plan_starts_at   date,
  plan_expires_at  date,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------- patient_schedule_dates ----------
CREATE TABLE public.patient_schedule_dates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL,
  scheduled_date  date NOT NULL,
  label           text NOT NULL DEFAULT 'Atualização mensal'::text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------- photo_sessions ----------
CREATE TABLE public.photo_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid NOT NULL,
  session_date  date NOT NULL DEFAULT CURRENT_DATE,
  front_url     text,
  back_url      text,
  left_url      text,
  right_url     text,
  crop_data     jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------- prescriptions ----------
CREATE TABLE public.prescriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL,
  title           text NOT NULL,
  content         text NOT NULL,
  type            text NOT NULL DEFAULT 'manual'::text,
  prescribed_at   date NOT NULL DEFAULT CURRENT_DATE,
  pdf_url         text,
  pdf_file_name   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);


-- =====================================================================
-- 3. ÍNDICES
-- =====================================================================
CREATE INDEX idx_body_measurements_patient
  ON public.body_measurements USING btree (patient_id, measured_at DESC);


-- =====================================================================
-- 4. HABILITAR ROW LEVEL SECURITY
-- =====================================================================
ALTER TABLE public.anamneses                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_meal_foods          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_meals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diets                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_catalog         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_assignments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_questions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_templates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_exam_results         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_exams                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials_pdfs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials_videos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_energy_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_plans            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_schedule_dates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_catalog        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_days             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_programs         ENABLE ROW LEVEL SECURITY;


-- =====================================================================
-- 5. POLICIES
-- =====================================================================
-- ⚠️  ATENÇÃO: várias tabelas (patients, diets, diet_meals, diet_meal_foods,
-- foods, form_*, body_measurements) usam policies extremamente permissivas
-- com role `public` e `USING true`. Isto preserva o comportamento original,
-- porém recomenda-se endurecer estas regras após migração.

-- ---------- anamneses ----------
CREATE POLICY "Allow authenticated select on anamneses" ON public.anamneses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on anamneses" ON public.anamneses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on anamneses" ON public.anamneses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on anamneses" ON public.anamneses FOR DELETE TO authenticated USING (true);

-- ---------- body_measurements ----------
CREATE POLICY "Allow all select on body_measurements" ON public.body_measurements FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on body_measurements" ON public.body_measurements FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on body_measurements" ON public.body_measurements FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on body_measurements" ON public.body_measurements FOR DELETE TO public USING (true);

-- ---------- diet_meal_foods ----------
CREATE POLICY "Allow all select on diet_meal_foods" ON public.diet_meal_foods FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on diet_meal_foods" ON public.diet_meal_foods FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on diet_meal_foods" ON public.diet_meal_foods FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on diet_meal_foods" ON public.diet_meal_foods FOR DELETE TO public USING (true);

-- ---------- diet_meals ----------
CREATE POLICY "Allow all select on diet_meals" ON public.diet_meals FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on diet_meals" ON public.diet_meals FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on diet_meals" ON public.diet_meals FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on diet_meals" ON public.diet_meals FOR DELETE TO public USING (true);

-- ---------- diets ----------
CREATE POLICY "Allow all select on diets" ON public.diets FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on diets" ON public.diets FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on diets" ON public.diets FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on diets" ON public.diets FOR DELETE TO public USING (true);

-- ---------- exercise_catalog ----------
CREATE POLICY "Allow authenticated select on exercise_catalog" ON public.exercise_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on exercise_catalog" ON public.exercise_catalog FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on exercise_catalog" ON public.exercise_catalog FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on exercise_catalog" ON public.exercise_catalog FOR DELETE TO authenticated USING (true);

-- ---------- foods ----------
CREATE POLICY "Allow all select on foods" ON public.foods FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on foods" ON public.foods FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on foods" ON public.foods FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on foods" ON public.foods FOR DELETE TO public USING (true);

-- ---------- form_assignments ----------
CREATE POLICY "Allow all select on form_assignments" ON public.form_assignments FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on form_assignments" ON public.form_assignments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on form_assignments" ON public.form_assignments FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on form_assignments" ON public.form_assignments FOR DELETE TO public USING (true);

-- ---------- form_questions ----------
CREATE POLICY "Allow all select on form_questions" ON public.form_questions FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on form_questions" ON public.form_questions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on form_questions" ON public.form_questions FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on form_questions" ON public.form_questions FOR DELETE TO public USING (true);

-- ---------- form_responses ----------
CREATE POLICY "Allow all select on form_responses" ON public.form_responses FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on form_responses" ON public.form_responses FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on form_responses" ON public.form_responses FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on form_responses" ON public.form_responses FOR DELETE TO public USING (true);

-- ---------- form_templates ----------
CREATE POLICY "Allow all select on form_templates" ON public.form_templates FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on form_templates" ON public.form_templates FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on form_templates" ON public.form_templates FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on form_templates" ON public.form_templates FOR DELETE TO public USING (true);

-- ---------- lab_exam_results ----------
CREATE POLICY "Allow authenticated select on lab_exam_results" ON public.lab_exam_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on lab_exam_results" ON public.lab_exam_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on lab_exam_results" ON public.lab_exam_results FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on lab_exam_results" ON public.lab_exam_results FOR DELETE TO authenticated USING (true);

-- ---------- lab_exams ----------
CREATE POLICY "Allow authenticated select on lab_exams" ON public.lab_exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on lab_exams" ON public.lab_exams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on lab_exams" ON public.lab_exams FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on lab_exams" ON public.lab_exams FOR DELETE TO authenticated USING (true);

-- ---------- materials_pdfs ----------
CREATE POLICY "Allow authenticated select on materials_pdfs" ON public.materials_pdfs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on materials_pdfs" ON public.materials_pdfs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on materials_pdfs" ON public.materials_pdfs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on materials_pdfs" ON public.materials_pdfs FOR DELETE TO authenticated USING (true);

-- ---------- materials_videos ----------
CREATE POLICY "Allow authenticated select on materials_videos" ON public.materials_videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on materials_videos" ON public.materials_videos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on materials_videos" ON public.materials_videos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on materials_videos" ON public.materials_videos FOR DELETE TO authenticated USING (true);

-- ---------- patient_energy_profiles ----------
-- (Original sem policy de DELETE)
CREATE POLICY "Allow authenticated select on patient_energy_profiles" ON public.patient_energy_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated insert on patient_energy_profiles" ON public.patient_energy_profiles FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow authenticated update on patient_energy_profiles" ON public.patient_energy_profiles FOR UPDATE TO public USING (true);

-- ---------- patient_plans ----------
CREATE POLICY "Authenticated users can manage patient plans" ON public.patient_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- patient_schedule_dates ----------
CREATE POLICY "Authenticated users can manage schedule dates" ON public.patient_schedule_dates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- patients ----------
CREATE POLICY "Allow all select on patients" ON public.patients FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on patients" ON public.patients FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on patients" ON public.patients FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on patients" ON public.patients FOR DELETE TO public USING (true);

-- ---------- photo_sessions ----------
CREATE POLICY "Allow authenticated select on photo_sessions" ON public.photo_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on photo_sessions" ON public.photo_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on photo_sessions" ON public.photo_sessions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on photo_sessions" ON public.photo_sessions FOR DELETE TO authenticated USING (true);

-- ---------- prescriptions ----------
CREATE POLICY "Allow authenticated select on prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on prescriptions" ON public.prescriptions FOR DELETE TO authenticated USING (true);

-- ---------- technique_catalog ----------
CREATE POLICY "Allow authenticated select on technique_catalog" ON public.technique_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on technique_catalog" ON public.technique_catalog FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on technique_catalog" ON public.technique_catalog FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on technique_catalog" ON public.technique_catalog FOR DELETE TO authenticated USING (true);

-- ---------- workout_days ----------
CREATE POLICY "Allow authenticated select on workout_days" ON public.workout_days FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on workout_days" ON public.workout_days FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on workout_days" ON public.workout_days FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on workout_days" ON public.workout_days FOR DELETE TO authenticated USING (true);

-- ---------- workout_exercises ----------
CREATE POLICY "Allow authenticated select on workout_exercises" ON public.workout_exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on workout_exercises" ON public.workout_exercises FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on workout_exercises" ON public.workout_exercises FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on workout_exercises" ON public.workout_exercises FOR DELETE TO authenticated USING (true);

-- ---------- workout_programs ----------
CREATE POLICY "Allow authenticated select on workout_programs" ON public.workout_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on workout_programs" ON public.workout_programs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on workout_programs" ON public.workout_programs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on workout_programs" ON public.workout_programs FOR DELETE TO authenticated USING (true);


-- =====================================================================
-- 6. FUNÇÕES E TRIGGERS
-- =====================================================================
-- Nenhuma function ou trigger custom existe no schema `public` no banco original.


-- =====================================================================
-- 7. FOREIGN KEYS RECOMENDADAS (OPCIONAL)
-- =====================================================================
-- O banco original NÃO declara foreign keys. As relações são lógicas.
-- Aplique os blocos abaixo para garantir integridade referencial.
-- ATENÇÃO: rode somente após carregar dados consistentes.
--
-- ALTER TABLE public.anamneses               ADD CONSTRAINT anamneses_patient_id_fkey               FOREIGN KEY (patient_id)       REFERENCES public.patients(id)          ON DELETE CASCADE;
-- ALTER TABLE public.body_measurements       ADD CONSTRAINT body_measurements_patient_id_fkey       FOREIGN KEY (patient_id)       REFERENCES public.patients(id)          ON DELETE CASCADE;
-- ALTER TABLE public.diets                   ADD CONSTRAINT diets_patient_id_fkey                   FOREIGN KEY (patient_id)       REFERENCES public.patients(id)          ON DELETE CASCADE;
-- ALTER TABLE public.diet_meals              ADD CONSTRAINT diet_meals_diet_id_fkey                 FOREIGN KEY (diet_id)          REFERENCES public.diets(id)             ON DELETE CASCADE;
-- ALTER TABLE public.diet_meal_foods         ADD CONSTRAINT diet_meal_foods_diet_meal_id_fkey       FOREIGN KEY (diet_meal_id)     REFERENCES public.diet_meals(id)        ON DELETE CASCADE;
-- ALTER TABLE public.diet_meal_foods         ADD CONSTRAINT diet_meal_foods_food_id_fkey            FOREIGN KEY (food_id)          REFERENCES public.foods(id)             ON DELETE SET NULL;
-- ALTER TABLE public.workout_programs        ADD CONSTRAINT workout_programs_patient_id_fkey        FOREIGN KEY (patient_id)       REFERENCES public.patients(id)          ON DELETE CASCADE;
-- ALTER TABLE public.workout_days            ADD CONSTRAINT workout_days_program_id_fkey            FOREIGN KEY (program_id)       REFERENCES public.workout_programs(id)  ON DELETE CASCADE;
-- ALTER TABLE public.workout_exercises       ADD CONSTRAINT workout_exercises_workout_day_id_fkey   FOREIGN KEY (workout_day_id)   REFERENCES public.workout_days(id)      ON DELETE CASCADE;
-- ALTER TABLE public.lab_exams               ADD CONSTRAINT lab_exams_patient_id_fkey               FOREIGN KEY (patient_id)       REFERENCES public.patients(id)          ON DELETE CASCADE;
-- ALTER TABLE public.lab_exam_results        ADD CONSTRAINT lab_exam_results_lab_exam_id_fkey       FOREIGN KEY (lab_exam_id)      REFERENCES public.lab_exams(id)         ON DELETE CASCADE;
-- ALTER TABLE public.form_questions          ADD CONSTRAINT form_questions_form_template_id_fkey    FOREIGN KEY (form_template_id) REFERENCES public.form_templates(id)    ON DELETE CASCADE;
-- ALTER TABLE public.form_assignments        ADD CONSTRAINT form_assignments_form_template_id_fkey  FOREIGN KEY (form_template_id) REFERENCES public.form_templates(id)    ON DELETE CASCADE;
-- ALTER TABLE public.form_assignments        ADD CONSTRAINT form_assignments_patient_id_fkey        FOREIGN KEY (patient_id)       REFERENCES public.patients(id)          ON DELETE CASCADE;
-- ALTER TABLE public.form_responses          ADD CONSTRAINT form_responses_form_assignment_id_fkey  FOREIGN KEY (form_assignment_id) REFERENCES public.form_assignments(id) ON DELETE CASCADE;
-- ALTER TABLE public.form_responses          ADD CONSTRAINT form_responses_form_question_id_fkey    FOREIGN KEY (form_question_id) REFERENCES public.form_questions(id)    ON DELETE CASCADE;
-- ALTER TABLE public.patient_energy_profiles ADD CONSTRAINT patient_energy_profiles_patient_id_fkey FOREIGN KEY (patient_id)       REFERENCES public.patients(id)          ON DELETE CASCADE;
-- ALTER TABLE public.patient_plans           ADD CONSTRAINT patient_plans_patient_id_fkey           FOREIGN KEY (patient_id)       REFERENCES public.patients(id)          ON DELETE CASCADE;
-- ALTER TABLE public.patient_schedule_dates  ADD CONSTRAINT patient_schedule_dates_patient_id_fkey  FOREIGN KEY (patient_id)       REFERENCES public.patients(id)          ON DELETE CASCADE;
-- ALTER TABLE public.photo_sessions          ADD CONSTRAINT photo_sessions_patient_id_fkey          FOREIGN KEY (patient_id)       REFERENCES public.patients(id)          ON DELETE CASCADE;
-- ALTER TABLE public.prescriptions           ADD CONSTRAINT prescriptions_patient_id_fkey           FOREIGN KEY (patient_id)       REFERENCES public.patients(id)          ON DELETE CASCADE;


-- =====================================================================
-- 8. STORAGE BUCKETS (Supabase)
-- =====================================================================
-- Crie via dashboard ou SQL abaixo:
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('patient-photos', 'patient-photos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('materials',      'materials',      true);
--
-- Policies de storage (exemplo permissivo, ajustar conforme necessidade):
-- CREATE POLICY "Public read patient-photos" ON storage.objects FOR SELECT USING (bucket_id = 'patient-photos');
-- CREATE POLICY "Auth write patient-photos"  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'patient-photos');
-- CREATE POLICY "Public read materials"      ON storage.objects FOR SELECT USING (bucket_id = 'materials');
-- CREATE POLICY "Auth write materials"       ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'materials');

-- =====================================================================
-- FIM DA MIGRAÇÃO
-- =====================================================================
