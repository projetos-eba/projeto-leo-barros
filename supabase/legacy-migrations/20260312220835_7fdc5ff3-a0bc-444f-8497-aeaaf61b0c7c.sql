
CREATE TABLE public.exercise_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  muscle_group text NOT NULL DEFAULT 'PEITO',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.exercise_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated select on exercise_catalog" ON public.exercise_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on exercise_catalog" ON public.exercise_catalog FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on exercise_catalog" ON public.exercise_catalog FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on exercise_catalog" ON public.exercise_catalog FOR DELETE TO authenticated USING (true);
