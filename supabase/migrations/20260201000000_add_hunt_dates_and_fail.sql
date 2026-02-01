-- Add hunt start date and is_fail to caught_shinies
ALTER TABLE public.caught_shinies
  ADD COLUMN IF NOT EXISTS hunt_start_date DATE,
  ADD COLUMN IF NOT EXISTS is_fail BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.caught_shinies.hunt_start_date IS 'Date when the shiny hunt started';
COMMENT ON COLUMN public.caught_shinies.is_fail IS 'Whether this entry is a failed hunt (e.g. phase)';
