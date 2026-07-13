-- Create patient energy profile table used by the calorie calculator.
CREATE TABLE IF NOT EXISTS public.patient_energy_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL UNIQUE REFERENCES public.patients(id) ON DELETE CASCADE,
  height numeric,
  activity_factor numeric NOT NULL DEFAULT 1.2,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_energy_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on patient_energy_profiles"
ON public.patient_energy_profiles FOR SELECT USING (true);

CREATE POLICY "Allow all insert on patient_energy_profiles"
ON public.patient_energy_profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update on patient_energy_profiles"
ON public.patient_energy_profiles FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow all delete on patient_energy_profiles"
ON public.patient_energy_profiles FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_patient_energy_profiles_patient
ON public.patient_energy_profiles(patient_id);

-- Add selected_formula column to patient_energy_profiles.
ALTER TABLE public.patient_energy_profiles
ADD COLUMN IF NOT EXISTS selected_formula text DEFAULT NULL;
