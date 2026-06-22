
-- Fix RLS policies: drop restrictive ones and recreate as permissive

-- diets
DROP POLICY IF EXISTS "Anyone can read diets" ON public.diets;
DROP POLICY IF EXISTS "Authenticated can insert diets" ON public.diets;
DROP POLICY IF EXISTS "Authenticated can update diets" ON public.diets;
DROP POLICY IF EXISTS "Authenticated can delete diets" ON public.diets;

CREATE POLICY "Allow all select on diets" ON public.diets FOR SELECT USING (true);
CREATE POLICY "Allow all insert on diets" ON public.diets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on diets" ON public.diets FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on diets" ON public.diets FOR DELETE USING (true);

-- diet_meals
DROP POLICY IF EXISTS "Anyone can read diet_meals" ON public.diet_meals;
DROP POLICY IF EXISTS "Authenticated can insert diet_meals" ON public.diet_meals;
DROP POLICY IF EXISTS "Authenticated can update diet_meals" ON public.diet_meals;
DROP POLICY IF EXISTS "Authenticated can delete diet_meals" ON public.diet_meals;

CREATE POLICY "Allow all select on diet_meals" ON public.diet_meals FOR SELECT USING (true);
CREATE POLICY "Allow all insert on diet_meals" ON public.diet_meals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on diet_meals" ON public.diet_meals FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on diet_meals" ON public.diet_meals FOR DELETE USING (true);

-- diet_meal_foods
DROP POLICY IF EXISTS "Anyone can read diet_meal_foods" ON public.diet_meal_foods;
DROP POLICY IF EXISTS "Authenticated can insert diet_meal_foods" ON public.diet_meal_foods;
DROP POLICY IF EXISTS "Authenticated can update diet_meal_foods" ON public.diet_meal_foods;
DROP POLICY IF EXISTS "Authenticated can delete diet_meal_foods" ON public.diet_meal_foods;

CREATE POLICY "Allow all select on diet_meal_foods" ON public.diet_meal_foods FOR SELECT USING (true);
CREATE POLICY "Allow all insert on diet_meal_foods" ON public.diet_meal_foods FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on diet_meal_foods" ON public.diet_meal_foods FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on diet_meal_foods" ON public.diet_meal_foods FOR DELETE USING (true);

-- patients
DROP POLICY IF EXISTS "Anyone can read patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated can update patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated can delete patients" ON public.patients;

CREATE POLICY "Allow all select on patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Allow all insert on patients" ON public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on patients" ON public.patients FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on patients" ON public.patients FOR DELETE USING (true);

-- foods (fix same issue)
DROP POLICY IF EXISTS "Anyone can read foods" ON public.foods;
DROP POLICY IF EXISTS "Authenticated users can delete foods" ON public.foods;
DROP POLICY IF EXISTS "Authenticated users can insert foods" ON public.foods;
DROP POLICY IF EXISTS "Authenticated users can update foods" ON public.foods;

CREATE POLICY "Allow all select on foods" ON public.foods FOR SELECT USING (true);
CREATE POLICY "Allow all insert on foods" ON public.foods FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on foods" ON public.foods FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on foods" ON public.foods FOR DELETE USING (true);
