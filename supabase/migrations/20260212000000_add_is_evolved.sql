-- Add is_evolved field to caught_shinies table
ALTER TABLE public.caught_shinies ADD COLUMN IF NOT EXISTS is_evolved BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.caught_shinies.is_evolved IS 'Whether the Pokemon was caught as a pre-evolution and then evolved';
