ALTER TABLE public.patients ADD COLUMN birth_date date NULL;
ALTER TABLE public.patients DROP COLUMN IF EXISTS age;