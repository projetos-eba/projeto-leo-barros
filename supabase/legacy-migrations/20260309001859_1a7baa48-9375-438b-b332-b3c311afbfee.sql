-- Tabela de programas de treino
CREATE TABLE public.workout_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Treino',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de dias/divisões do treino (A, B, C, D)
CREATE TABLE public.workout_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.workout_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Tabela de exercícios do treino
CREATE TABLE public.workout_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_day_id UUID NOT NULL REFERENCES public.workout_days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '10-12',
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Tabela de exames laboratoriais
CREATE TABLE public.lab_exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de resultados dos exames
CREATE TABLE public.lab_exam_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_exam_id UUID NOT NULL REFERENCES public.lab_exams(id) ON DELETE CASCADE,
  marker_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  reference_min NUMERIC,
  reference_max NUMERIC,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Tabela de prescrições médicas
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  prescribed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permitir acesso autenticado)
CREATE POLICY "Allow authenticated select on workout_programs" ON public.workout_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on workout_programs" ON public.workout_programs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on workout_programs" ON public.workout_programs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on workout_programs" ON public.workout_programs FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated select on workout_days" ON public.workout_days FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on workout_days" ON public.workout_days FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on workout_days" ON public.workout_days FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on workout_days" ON public.workout_days FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated select on workout_exercises" ON public.workout_exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on workout_exercises" ON public.workout_exercises FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on workout_exercises" ON public.workout_exercises FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on workout_exercises" ON public.workout_exercises FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated select on lab_exams" ON public.lab_exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on lab_exams" ON public.lab_exams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on lab_exams" ON public.lab_exams FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on lab_exams" ON public.lab_exams FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated select on lab_exam_results" ON public.lab_exam_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on lab_exam_results" ON public.lab_exam_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on lab_exam_results" ON public.lab_exam_results FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on lab_exam_results" ON public.lab_exam_results FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated select on prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on prescriptions" ON public.prescriptions FOR DELETE TO authenticated USING (true);