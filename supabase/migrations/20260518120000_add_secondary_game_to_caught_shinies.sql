-- Add optional secondary game to caught_shinies (for multi-game hunts / transfers)
ALTER TABLE public.caught_shinies
ADD COLUMN IF NOT EXISTS secondary_game TEXT;

COMMENT ON COLUMN public.caught_shinies.secondary_game IS 'Optional second game to display on collection cards (e.g. emerald -> violet)';

