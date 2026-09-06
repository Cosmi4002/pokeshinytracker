-- Allows the outer outline of the “Evolved from” badge to be customized independently.
ALTER TABLE public.caught_shinies
  ADD COLUMN IF NOT EXISTS evolved_icon_outline_color TEXT;

COMMENT ON COLUMN public.caught_shinies.evolved_icon_outline_color IS
  'Outer outline colour for the evolved-from icon.';
