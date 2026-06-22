
ALTER TABLE public.prescriptions 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS pdf_url text,
ADD COLUMN IF NOT EXISTS pdf_file_name text;
