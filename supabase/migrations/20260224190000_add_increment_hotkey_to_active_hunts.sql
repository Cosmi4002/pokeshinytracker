ALTER TABLE public.active_hunts
ADD COLUMN IF NOT EXISTS increment_hotkey TEXT;
