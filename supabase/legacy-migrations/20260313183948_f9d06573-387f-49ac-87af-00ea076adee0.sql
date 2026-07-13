
CREATE TABLE public.technique_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.technique_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated select on technique_catalog" ON public.technique_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on technique_catalog" ON public.technique_catalog FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on technique_catalog" ON public.technique_catalog FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on technique_catalog" ON public.technique_catalog FOR DELETE TO authenticated USING (true);
