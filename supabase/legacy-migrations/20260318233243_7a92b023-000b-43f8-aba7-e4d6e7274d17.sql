
-- Table for PDF materials
CREATE TABLE public.materials_pdfs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  file_url text NOT NULL,
  file_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.materials_pdfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated select on materials_pdfs" ON public.materials_pdfs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on materials_pdfs" ON public.materials_pdfs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated delete on materials_pdfs" ON public.materials_pdfs FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated update on materials_pdfs" ON public.materials_pdfs FOR UPDATE TO authenticated USING (true);

-- Table for video materials
CREATE TABLE public.materials_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  youtube_url text NOT NULL,
  youtube_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.materials_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated select on materials_videos" ON public.materials_videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on materials_videos" ON public.materials_videos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated delete on materials_videos" ON public.materials_videos FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated update on materials_videos" ON public.materials_videos FOR UPDATE TO authenticated USING (true);

-- Storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true);

CREATE POLICY "Allow authenticated upload to materials" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'materials');
CREATE POLICY "Allow public read from materials" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
CREATE POLICY "Allow authenticated delete from materials" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'materials');
