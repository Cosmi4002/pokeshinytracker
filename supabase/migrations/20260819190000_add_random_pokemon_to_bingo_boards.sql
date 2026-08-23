-- Persist the Games page random Pokemon picker across sessions/devices.
ALTER TABLE public.bingo_boards
  ADD COLUMN IF NOT EXISTS random_pokemon_id INTEGER,
  ADD COLUMN IF NOT EXISTS random_pokemon_name TEXT,
  ADD COLUMN IF NOT EXISTS random_generation_filter INTEGER;
