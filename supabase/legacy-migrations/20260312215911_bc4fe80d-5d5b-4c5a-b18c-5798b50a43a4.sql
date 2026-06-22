
ALTER TABLE public.workout_days 
  ADD COLUMN rep_range text DEFAULT '10-12',
  ADD COLUMN rest_interval text DEFAULT '60s';

ALTER TABLE public.workout_exercises 
  ADD COLUMN technique text DEFAULT NULL,
  ADD COLUMN load_s1 text DEFAULT NULL,
  ADD COLUMN load_s2 text DEFAULT NULL,
  ADD COLUMN load_s3 text DEFAULT NULL,
  ADD COLUMN load_s4 text DEFAULT NULL,
  ADD COLUMN load_s5 text DEFAULT NULL,
  ADD COLUMN load_s6 text DEFAULT NULL;
