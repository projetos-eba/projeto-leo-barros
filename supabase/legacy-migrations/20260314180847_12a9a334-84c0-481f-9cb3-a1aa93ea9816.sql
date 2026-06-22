
ALTER TABLE public.workout_exercises
  ADD COLUMN reps_s1 integer DEFAULT NULL,
  ADD COLUMN reps_s2 integer DEFAULT NULL,
  ADD COLUMN reps_s3 integer DEFAULT NULL,
  ADD COLUMN reps_s4 integer DEFAULT NULL,
  ADD COLUMN reps_s5 integer DEFAULT NULL,
  ADD COLUMN reps_s6 integer DEFAULT NULL;
