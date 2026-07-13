
ALTER TABLE public.patients
  ADD COLUMN cpf text UNIQUE,
  ADD COLUMN email text,
  ADD COLUMN phone text,
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
