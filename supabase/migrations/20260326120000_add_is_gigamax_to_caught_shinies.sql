ALTER TABLE public.caught_shinies
ADD COLUMN IF NOT EXISTS is_gigamax BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.caught_shinies.is_gigamax IS 'Whether the shiny is marked as Gigantamax-capable in Sword/Shield';
