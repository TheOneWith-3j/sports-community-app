BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.profiles
SET onboarding_completed = TRUE
WHERE display_name <> 'New member';

GRANT UPDATE (onboarding_completed)
  ON TABLE public.profiles TO authenticated;

COMMIT;
