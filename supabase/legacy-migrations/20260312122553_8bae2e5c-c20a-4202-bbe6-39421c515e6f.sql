
ALTER TABLE public.diets 
  ADD COLUMN released_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN calories_snapshot numeric DEFAULT NULL,
  ADD COLUMN weight_snapshot numeric DEFAULT NULL;
