-- Create bingo_boards table for synced Bingo state
CREATE TABLE IF NOT EXISTS public.bingo_boards (
    user_id UUID NOT NULL PRIMARY KEY,
    grid_size INTEGER NOT NULL DEFAULT 4,
    grid_ids INTEGER[] NOT NULL DEFAULT '{}'::INTEGER[],
    marked_ids INTEGER[] NOT NULL DEFAULT '{}'::INTEGER[],
    generations INTEGER[] NOT NULL DEFAULT '{}'::INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bingo_boards ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bingo_boards'
      AND policyname = 'Users can view their own bingo boards'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own bingo boards" ON public.bingo_boards FOR SELECT USING (auth.uid() = user_id);';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bingo_boards'
      AND policyname = 'Users can insert their own bingo boards'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert their own bingo boards" ON public.bingo_boards FOR INSERT WITH CHECK (auth.uid() = user_id);';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bingo_boards'
      AND policyname = 'Users can update their own bingo boards'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own bingo boards" ON public.bingo_boards FOR UPDATE USING (auth.uid() = user_id);';
  END IF;
END $$;

-- Update updated_at on change
DROP TRIGGER IF EXISTS update_bingo_boards_updated_at ON public.bingo_boards;
CREATE TRIGGER update_bingo_boards_updated_at
BEFORE UPDATE ON public.bingo_boards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
