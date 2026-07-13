
CREATE TABLE public.anamneses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated select on anamneses" ON public.anamneses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on anamneses" ON public.anamneses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on anamneses" ON public.anamneses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on anamneses" ON public.anamneses FOR DELETE TO authenticated USING (true);
