-- Persist the counter's selected game with each hunt so reopening it does not
-- fall back to the legacy Black 2 default.
ALTER TABLE public.active_hunts
  ADD COLUMN IF NOT EXISTS selected_game_id TEXT;
