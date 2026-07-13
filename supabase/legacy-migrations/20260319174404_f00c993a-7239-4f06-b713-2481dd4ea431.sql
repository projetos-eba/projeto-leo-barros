
-- Add new columns to form_questions for enhanced features
ALTER TABLE public.form_questions
  ADD COLUMN IF NOT EXISTS required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS scale_label_min text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS scale_label_max text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS multi_select boolean NOT NULL DEFAULT false;

-- Add access_token to form_assignments for public link access
ALTER TABLE public.form_assignments
  ADD COLUMN IF NOT EXISTS access_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');
