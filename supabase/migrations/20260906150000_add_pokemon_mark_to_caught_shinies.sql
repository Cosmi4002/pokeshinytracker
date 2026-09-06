-- Stores an optional Pokémon Mark, available only in games that support Marks.
ALTER TABLE public.caught_shinies
ADD COLUMN IF NOT EXISTS pokemon_mark TEXT;

COMMENT ON COLUMN public.caught_shinies.pokemon_mark IS 'Optional Pokémon Mark earned by the caught Pokémon.';
