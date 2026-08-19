-- Allow the Games random Pokemon picker to persist multiple selected generations.
ALTER TABLE public.bingo_boards
  ADD COLUMN IF NOT EXISTS random_generation_filters INTEGER[] NOT NULL DEFAULT '{}';
