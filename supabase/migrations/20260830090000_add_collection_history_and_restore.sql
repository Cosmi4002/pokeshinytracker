-- Auditable collection history with safe, user-scoped restore support.
CREATE TABLE IF NOT EXISTS public.collection_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete', 'restore')),
  before_data JSONB,
  after_data JSONB,
  changed_fields TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  source_event_id UUID REFERENCES public.collection_history(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collection_history_user_created_at
  ON public.collection_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_collection_history_record_created_at
  ON public.collection_history (record_id, created_at DESC);

ALTER TABLE public.collection_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'collection_history'
      AND policyname = 'Users can view their own collection history'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own collection history" ON public.collection_history FOR SELECT USING (auth.uid() = user_id);';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.log_caught_shinies_changes()
RETURNS TRIGGER AS $$
DECLARE
  old_snapshot JSONB := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  new_snapshot JSONB := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
  fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF current_setting('pokeshiny.history_suppressed', true) = 'on' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(array_agg(field ORDER BY field), ARRAY[]::TEXT[])
      INTO fields
    FROM jsonb_object_keys(old_snapshot || new_snapshot) AS keys(field)
    WHERE field <> 'updated_at'
      AND (old_snapshot -> field) IS DISTINCT FROM (new_snapshot -> field);

    -- Ignore writes which only refresh updated_at.
    IF cardinality(fields) = 0 THEN
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.collection_history (
    user_id,
    record_id,
    action,
    before_data,
    after_data,
    changed_fields
  )
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(NEW.id, OLD.id),
    lower(TG_OP),
    old_snapshot,
    new_snapshot,
    fields
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_caught_shinies_history ON public.caught_shinies;

CREATE TRIGGER trg_caught_shinies_history
AFTER INSERT OR UPDATE OR DELETE ON public.caught_shinies
FOR EACH ROW
EXECUTE FUNCTION public.log_caught_shinies_changes();

CREATE OR REPLACE FUNCTION public.restore_collection_history_event(history_event_id UUID)
RETURNS UUID AS $$
DECLARE
  history_event public.collection_history%ROWTYPE;
  current_snapshot JSONB;
  target_snapshot JSONB;
  fields TEXT[] := ARRAY[]::TEXT[];
  restored_event_id UUID;
  playlist_value TEXT;
BEGIN
  SELECT *
    INTO history_event
  FROM public.collection_history
  WHERE id = history_event_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'History event not found or access denied';
  END IF;

  IF history_event.action = 'restore' THEN
    RAISE EXCEPTION 'A restore event cannot be restored again';
  END IF;

  SELECT to_jsonb(caught_shiny)
    INTO current_snapshot
  FROM public.caught_shinies AS caught_shiny
  WHERE id = history_event.record_id
    AND user_id = auth.uid();

  IF history_event.action = 'insert' THEN
    IF current_snapshot IS NULL THEN
      RAISE EXCEPTION 'This collection entry no longer exists';
    END IF;
    target_snapshot := NULL;
  ELSE
    target_snapshot := history_event.before_data;

    IF target_snapshot IS NULL THEN
      RAISE EXCEPTION 'This history event has no restorable snapshot';
    END IF;

    IF target_snapshot ->> 'user_id' IS DISTINCT FROM auth.uid()::TEXT
      OR target_snapshot ->> 'id' IS DISTINCT FROM history_event.record_id::TEXT THEN
      RAISE EXCEPTION 'Invalid history snapshot';
    END IF;

    -- A playlist may have been deleted after the snapshot was created.
    -- In that case restore the Pokémon without the obsolete playlist link.
    playlist_value := target_snapshot ->> 'playlist_id';
    IF playlist_value IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.shiny_playlists
        WHERE id = playlist_value::UUID
          AND user_id = auth.uid()
      ) THEN
      target_snapshot := jsonb_set(target_snapshot, '{playlist_id}', 'null'::JSONB);
    END IF;
  END IF;

  PERFORM set_config('pokeshiny.history_suppressed', 'on', true);

  DELETE FROM public.caught_shinies
  WHERE id = history_event.record_id
    AND user_id = auth.uid();

  IF target_snapshot IS NOT NULL THEN
    INSERT INTO public.caught_shinies
    SELECT (jsonb_populate_record(NULL::public.caught_shinies, target_snapshot)).*;
  END IF;

  SELECT COALESCE(array_agg(field ORDER BY field), ARRAY[]::TEXT[])
    INTO fields
  FROM jsonb_object_keys(
    COALESCE(current_snapshot, '{}'::JSONB) || COALESCE(target_snapshot, '{}'::JSONB)
  ) AS keys(field)
  WHERE field <> 'updated_at'
    AND (current_snapshot -> field) IS DISTINCT FROM (target_snapshot -> field);

  INSERT INTO public.collection_history (
    user_id,
    record_id,
    action,
    before_data,
    after_data,
    changed_fields,
    source_event_id
  )
  VALUES (
    auth.uid(),
    history_event.record_id,
    'restore',
    current_snapshot,
    target_snapshot,
    fields,
    history_event.id
  )
  RETURNING id INTO restored_event_id;

  RETURN restored_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.restore_collection_history_event(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_collection_history_event(UUID) TO authenticated;

COMMENT ON TABLE public.collection_history IS
  'Immutable per-user audit log for caught_shinies changes and restore operations.';

COMMENT ON FUNCTION public.restore_collection_history_event(UUID) IS
  'Restores the snapshot before a collection change, or undoes the selected insert.';
