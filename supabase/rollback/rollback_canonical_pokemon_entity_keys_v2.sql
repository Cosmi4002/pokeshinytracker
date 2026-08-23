-- Manual rollback for Canonical Pokemon identity v2 additive columns.
--
-- Use only if the v2 rollout must be cancelled before the app starts relying on
-- entity_key columns. The legacy columns are not touched by the forward
-- migration, so dropping these additive columns restores the previous schema
-- shape for Pokemon/form identity storage.
--
-- Do not run this file automatically as part of normal Supabase migrations.

DROP INDEX IF EXISTS public.caught_shinies_user_entity_key_idx;

ALTER TABLE public.bingo_boards
  DROP COLUMN IF EXISTS random_entity_key,
  DROP COLUMN IF EXISTS grid_entity_keys;

ALTER TABLE public.active_hunts
  DROP COLUMN IF EXISTS pokemon_entity_keys;

ALTER TABLE public.caught_shinies
  DROP COLUMN IF EXISTS evolved_from_entity_key,
  DROP COLUMN IF EXISTS entity_key;
