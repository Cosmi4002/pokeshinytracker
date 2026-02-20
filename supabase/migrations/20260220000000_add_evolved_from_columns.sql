-- Store evolution origin selected from collection evolve dialog
ALTER TABLE public.caught_shinies
  ADD COLUMN IF NOT EXISTS evolved_from_id integer,
  ADD COLUMN IF NOT EXISTS evolved_from_name text;

COMMENT ON COLUMN public.caught_shinies.evolved_from_id IS 'Pokemon id this shiny evolved from (optional)';
COMMENT ON COLUMN public.caught_shinies.evolved_from_name IS 'Pokemon/form slug this shiny evolved from (optional)';
