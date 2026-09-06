ALTER TABLE public.caught_shinies
  ADD COLUMN IF NOT EXISTS evolved_icon_color TEXT;

COMMENT ON COLUMN public.caught_shinies.evolved_icon_color IS
  'Optional hexadecimal color chosen for the evolved-from badge.';
