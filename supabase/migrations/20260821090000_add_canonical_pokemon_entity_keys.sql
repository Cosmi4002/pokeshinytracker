-- Canonical Pokemon identity v2 (additive, backwards-compatible phase).
-- Legacy pokemon_id, pokemon_name and form columns remain authoritative until
-- the source-backed catalogue and backfill report have been fully reviewed.

ALTER TABLE public.caught_shinies
  ADD COLUMN IF NOT EXISTS entity_key TEXT,
  ADD COLUMN IF NOT EXISTS evolved_from_entity_key TEXT;

COMMENT ON COLUMN public.caught_shinies.entity_key IS
  'Canonical v2 Pokemon/form key (pokemon:<species_id>:<form_key>). Nullable during legacy migration.';
COMMENT ON COLUMN public.caught_shinies.evolved_from_entity_key IS
  'Canonical v2 key for the pre-evolution recorded by evolved_from_id/evolved_from_name.';

CREATE INDEX IF NOT EXISTS caught_shinies_user_entity_key_idx
  ON public.caught_shinies (user_id, entity_key)
  WHERE entity_key IS NOT NULL;

ALTER TABLE public.active_hunts
  ADD COLUMN IF NOT EXISTS pokemon_entity_keys TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.active_hunts.pokemon_entity_keys IS
  'Canonical v2 keys aligned with the encoded multi-slot Pokemon payload. Empty until migrated.';

ALTER TABLE public.bingo_boards
  ADD COLUMN IF NOT EXISTS grid_entity_keys TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS random_entity_key TEXT;

COMMENT ON COLUMN public.bingo_boards.grid_entity_keys IS
  'Canonical v2 keys aligned by position with grid_ids.';
COMMENT ON COLUMN public.bingo_boards.random_entity_key IS
  'Canonical v2 key corresponding to random_pokemon_id/random_pokemon_name.';

