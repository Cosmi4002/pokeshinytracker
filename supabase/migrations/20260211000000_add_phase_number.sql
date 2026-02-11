-- Add phase_number column to caught_shinies table
ALTER TABLE public.caught_shinies
ADD COLUMN IF NOT EXISTS phase_number INTEGER NULL;

COMMENT ON COLUMN public.caught_shinies.phase_number IS 'Phase number for shiny hunts (e.g., phase 1, phase 2)';
