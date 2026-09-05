-- Global, per-asset visual corrections for Pokémon sprites.
CREATE TABLE IF NOT EXISTS public.sprite_scale_overrides (
  sprite_url text PRIMARY KEY,
  scale numeric(4, 2) NOT NULL CHECK (scale >= 0.25 AND scale <= 2.50),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sprite_scale_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read global sprite scale overrides"
  ON public.sprite_scale_overrides
  FOR SELECT
  USING (true);

CREATE POLICY "Sprite manager can create global sprite scale overrides"
  ON public.sprite_scale_overrides
  FOR INSERT
  TO authenticated
  WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'chritel04@gmail.com');

CREATE POLICY "Sprite manager can update global sprite scale overrides"
  ON public.sprite_scale_overrides
  FOR UPDATE
  TO authenticated
  USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'chritel04@gmail.com')
  WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'chritel04@gmail.com');

CREATE POLICY "Sprite manager can delete global sprite scale overrides"
  ON public.sprite_scale_overrides
  FOR DELETE
  TO authenticated
  USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'chritel04@gmail.com');

ALTER PUBLICATION supabase_realtime ADD TABLE public.sprite_scale_overrides;
