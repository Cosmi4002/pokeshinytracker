ALTER TABLE public.caught_shinies
ADD COLUMN IF NOT EXISTS show_total BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.caught_shinies.show_total IS 'Whether to show the crosshair/Total badge on collection cards';

ALTER TABLE public.caught_shinies
ADD COLUMN IF NOT EXISTS show_encounters BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.caught_shinies.show_encounters IS 'Whether to display the encounters counter on collection cards';
