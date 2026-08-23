ALTER TABLE public.caught_shinies
ADD COLUMN IF NOT EXISTS total_value INTEGER;

COMMENT ON COLUMN public.caught_shinies.total_value IS 'Custom Total value to show on collection cards when show_total is true';
