
ALTER TABLE public.foods 
ADD COLUMN kcal_per_unit numeric NOT NULL DEFAULT 0,
ADD COLUMN fiber_per_unit numeric NOT NULL DEFAULT 0;
