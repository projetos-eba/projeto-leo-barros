
-- Patients table
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer,
  sex text,
  objective text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update patients" ON public.patients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete patients" ON public.patients FOR DELETE TO authenticated USING (true);

-- Insert mock patients
INSERT INTO public.patients (name, age, sex, objective) VALUES
  ('Maria Silva', 32, 'F', 'Emagrecimento'),
  ('João Santos', 28, 'M', 'Hipertrofia'),
  ('Ana Costa', 45, 'F', 'Saúde Metabólica'),
  ('Pedro Lima', 35, 'M', 'Performance'),
  ('Carla Mendes', 29, 'F', 'Recomposição Corporal'),
  ('Lucas Oliveira', 40, 'M', 'Emagrecimento'),
  ('Fernanda Reis', 33, 'F', 'Hipertrofia'),
  ('Ricardo Alves', 50, 'M', 'Saúde Metabólica');

-- Diets table
CREATE TABLE public.diets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT 'Dieta',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.diets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read diets" ON public.diets FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert diets" ON public.diets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update diets" ON public.diets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete diets" ON public.diets FOR DELETE TO authenticated USING (true);

-- Diet meals table
CREATE TABLE public.diet_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_id uuid REFERENCES public.diets(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  time text,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.diet_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read diet_meals" ON public.diet_meals FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert diet_meals" ON public.diet_meals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update diet_meals" ON public.diet_meals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete diet_meals" ON public.diet_meals FOR DELETE TO authenticated USING (true);

-- Diet meal foods table
CREATE TABLE public.diet_meal_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_meal_id uuid REFERENCES public.diet_meals(id) ON DELETE CASCADE NOT NULL,
  food_id uuid REFERENCES public.foods(id) ON DELETE SET NULL,
  food_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  measure text NOT NULL DEFAULT 'g',
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.diet_meal_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read diet_meal_foods" ON public.diet_meal_foods FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert diet_meal_foods" ON public.diet_meal_foods FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update diet_meal_foods" ON public.diet_meal_foods FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete diet_meal_foods" ON public.diet_meal_foods FOR DELETE TO authenticated USING (true);
