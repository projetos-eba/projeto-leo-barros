
-- Form templates created by admin
CREATE TABLE public.form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on form_templates" ON public.form_templates FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on form_templates" ON public.form_templates FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on form_templates" ON public.form_templates FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on form_templates" ON public.form_templates FOR DELETE TO public USING (true);

-- Questions belonging to a form template
CREATE TABLE public.form_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_template_id uuid NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'text',
  options jsonb DEFAULT '[]'::jsonb,
  scale_min integer DEFAULT 1,
  scale_max integer DEFAULT 10,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on form_questions" ON public.form_questions FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on form_questions" ON public.form_questions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on form_questions" ON public.form_questions FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on form_questions" ON public.form_questions FOR DELETE TO public USING (true);

-- Assignments: link a form template to a patient
CREATE TABLE public.form_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_template_id uuid NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz DEFAULT NULL
);

ALTER TABLE public.form_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on form_assignments" ON public.form_assignments FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on form_assignments" ON public.form_assignments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on form_assignments" ON public.form_assignments FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on form_assignments" ON public.form_assignments FOR DELETE TO public USING (true);

-- Responses: patient answers to questions
CREATE TABLE public.form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_assignment_id uuid NOT NULL REFERENCES public.form_assignments(id) ON DELETE CASCADE,
  form_question_id uuid NOT NULL REFERENCES public.form_questions(id) ON DELETE CASCADE,
  answer_text text DEFAULT '',
  answer_number numeric DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on form_responses" ON public.form_responses FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on form_responses" ON public.form_responses FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on form_responses" ON public.form_responses FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on form_responses" ON public.form_responses FOR DELETE TO public USING (true);
