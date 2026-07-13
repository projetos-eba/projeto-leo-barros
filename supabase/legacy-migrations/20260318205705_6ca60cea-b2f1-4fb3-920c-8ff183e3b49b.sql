
-- Create photo_sessions table
CREATE TABLE public.photo_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  front_url TEXT,
  back_url TEXT,
  left_url TEXT,
  right_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.photo_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Allow authenticated select on photo_sessions" ON public.photo_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on photo_sessions" ON public.photo_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on photo_sessions" ON public.photo_sessions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on photo_sessions" ON public.photo_sessions FOR DELETE TO authenticated USING (true);

-- Create storage bucket for patient photos
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-photos', 'patient-photos', true);

-- Storage policies
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'patient-photos');
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'patient-photos');
CREATE POLICY "Allow authenticated delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'patient-photos');
