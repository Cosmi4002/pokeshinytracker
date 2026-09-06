-- Stores the foreground colour of the “Evolved from” badge separately from its background.
ALTER TABLE public.caught_shinies
  ADD COLUMN IF NOT EXISTS evolved_icon_arrow_color TEXT;

COMMENT ON COLUMN public.caught_shinies.evolved_icon_arrow_color IS
  'Foreground colour for the circle and arrow in the evolved-from icon.';
