-- Counter history for active hunts to enable recovery after accidental overwrites.
CREATE TABLE IF NOT EXISTS public.active_hunts_counter_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  old_counter INTEGER,
  new_counter INTEGER,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_active_hunts_counter_history_hunt_changed_at
  ON public.active_hunts_counter_history (hunt_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_active_hunts_counter_history_user_changed_at
  ON public.active_hunts_counter_history (user_id, changed_at DESC);

ALTER TABLE public.active_hunts_counter_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'active_hunts_counter_history'
      AND policyname = 'Users can view their own counter history'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own counter history" ON public.active_hunts_counter_history FOR SELECT USING (auth.uid() = user_id);';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.log_active_hunts_counter_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.active_hunts_counter_history (hunt_id, user_id, action, old_counter, new_counter)
    VALUES (NEW.id, NEW.user_id, 'insert', NULL, NEW.counter);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.counter IS DISTINCT FROM OLD.counter THEN
    INSERT INTO public.active_hunts_counter_history (hunt_id, user_id, action, old_counter, new_counter)
    VALUES (NEW.id, NEW.user_id, 'update', OLD.counter, NEW.counter);
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.active_hunts_counter_history (hunt_id, user_id, action, old_counter, new_counter)
    VALUES (OLD.id, OLD.user_id, 'delete', OLD.counter, NULL);
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_active_hunts_counter_history ON public.active_hunts;

CREATE TRIGGER trg_active_hunts_counter_history
AFTER INSERT OR UPDATE OR DELETE ON public.active_hunts
FOR EACH ROW
EXECUTE FUNCTION public.log_active_hunts_counter_changes();
