-- Add unobtainable marker to caught_shinies
ALTER TABLE public.caught_shinies
  ADD COLUMN IF NOT EXISTS is_unobtainable BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.caught_shinies.is_unobtainable IS 'Whether this shiny is marked as unobtainable';
