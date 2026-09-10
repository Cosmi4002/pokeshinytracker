-- One reversible setting replaces the previous per-sprite bulk overrides.
CREATE TABLE public.sprite_scale_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  sword_shield_scale numeric(4, 2) NOT NULL DEFAULT 1.00 CHECK (sword_shield_scale IN (1.00, 1.90)),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.sprite_scale_settings (id, sword_shield_scale)
VALUES (true, 1.00)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.sprite_scale_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read Sword Shield sprite scale"
  ON public.sprite_scale_settings FOR SELECT USING (true);

CREATE POLICY "Sprite manager can update Sword Shield sprite scale"
  ON public.sprite_scale_settings FOR UPDATE TO authenticated
  USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'chritel04@gmail.com')
  WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'chritel04@gmail.com');

ALTER PUBLICATION supabase_realtime ADD TABLE public.sprite_scale_settings;
