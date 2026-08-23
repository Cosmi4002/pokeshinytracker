-- Add Legends Arceus marker to caught_shinies
ALTER TABLE public.caught_shinies
ADD COLUMN IF NOT EXISTS is_legends_arceus BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.caught_shinies.is_legends_arceus IS 'Whether this shiny was caught in Pokemon Legends: Arceus';
