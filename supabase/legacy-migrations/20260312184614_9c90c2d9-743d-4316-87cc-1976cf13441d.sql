
-- Table for plan toggles and expiration
CREATE TABLE public.patient_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  diet_active boolean NOT NULL DEFAULT false,
  workout_active boolean NOT NULL DEFAULT false,
  medical_active boolean NOT NULL DEFAULT false,
  plan_expires_at date NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage patient plans"
ON public.patient_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Table for scheduled update dates
CREATE TABLE public.patient_schedule_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  scheduled_date date NOT NULL,
  label text NOT NULL DEFAULT 'Atualização mensal',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_schedule_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage schedule dates"
ON public.patient_schedule_dates FOR ALL TO authenticated USING (true) WITH CHECK (true);
