
CREATE TABLE public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Outros',
  measure TEXT NOT NULL DEFAULT 'g',
  protein_per_unit NUMERIC NOT NULL DEFAULT 0,
  carbs_per_unit NUMERIC NOT NULL DEFAULT 0,
  fat_per_unit NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

-- Public read access (foods are reference data)
CREATE POLICY "Anyone can read foods" ON public.foods FOR SELECT USING (true);

-- Only authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can insert foods" ON public.foods FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update foods" ON public.foods FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete foods" ON public.foods FOR DELETE TO authenticated USING (true);
