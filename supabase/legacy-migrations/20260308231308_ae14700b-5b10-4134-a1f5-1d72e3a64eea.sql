CREATE TABLE public.body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  measured_at date NOT NULL DEFAULT CURRENT_DATE,
  weight numeric,
  body_fat_pct numeric,
  muscle_mass_pct numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on body_measurements" ON public.body_measurements FOR SELECT USING (true);
CREATE POLICY "Allow all insert on body_measurements" ON public.body_measurements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on body_measurements" ON public.body_measurements FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on body_measurements" ON public.body_measurements FOR DELETE USING (true);

CREATE INDEX idx_body_measurements_patient ON public.body_measurements(patient_id, measured_at DESC);