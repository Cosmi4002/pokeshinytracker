-- Realtime co-op shiny hunts with invite-only rooms and atomic counters.
CREATE TABLE IF NOT EXISTS public.hunt_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  pokemon_id INTEGER NOT NULL,
  pokemon_name TEXT NOT NULL,
  pokemon_form TEXT,
  sprite_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'closed')),
  winner_user_id UUID,
  max_members INTEGER NOT NULL DEFAULT 8 CHECK (max_members BETWEEN 2 AND 12),
  found_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hunt_room_members (
  room_id UUID NOT NULL REFERENCES public.hunt_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
  counter INTEGER NOT NULL DEFAULT 0 CHECK (counter >= 0),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_hunt_rooms_host_updated_at
  ON public.hunt_rooms (host_user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_hunt_room_members_user_joined_at
  ON public.hunt_room_members (user_id, joined_at DESC);

ALTER TABLE public.hunt_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hunt_room_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_hunt_room_member(
  checked_room_id UUID
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hunt_room_members
    WHERE room_id = checked_room_id
      AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.is_hunt_room_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_hunt_room_member(UUID) TO authenticated;

DROP POLICY IF EXISTS "Room members can view their rooms" ON public.hunt_rooms;
CREATE POLICY "Room members can view their rooms"
  ON public.hunt_rooms
  FOR SELECT
  USING (public.is_hunt_room_member(id));

DROP POLICY IF EXISTS "Room members can view participants" ON public.hunt_room_members;
CREATE POLICY "Room members can view participants"
  ON public.hunt_room_members
  FOR SELECT
  USING (public.is_hunt_room_member(room_id));

CREATE OR REPLACE FUNCTION public.create_hunt_room(
  room_name TEXT,
  target_pokemon_id INTEGER,
  target_pokemon_name TEXT,
  target_pokemon_form TEXT,
  target_sprite_url TEXT
)
RETURNS UUID AS $$
DECLARE
  new_room_id UUID;
  generated_code TEXT;
  attempt INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF char_length(trim(room_name)) NOT BETWEEN 1 AND 60 THEN
    RAISE EXCEPTION 'Room name must contain between 1 and 60 characters';
  END IF;

  IF target_pokemon_id IS NULL OR char_length(trim(target_pokemon_name)) = 0 THEN
    RAISE EXCEPTION 'A target Pokémon is required';
  END IF;

  LOOP
    attempt := attempt + 1;
    generated_code := upper(substr(md5(gen_random_uuid()::TEXT), 1, 6));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.hunt_rooms WHERE invite_code = generated_code
    );
    IF attempt >= 10 THEN
      RAISE EXCEPTION 'Unable to generate a unique room code';
    END IF;
  END LOOP;

  INSERT INTO public.hunt_rooms (
    host_user_id,
    invite_code,
    name,
    pokemon_id,
    pokemon_name,
    pokemon_form,
    sprite_url
  )
  VALUES (
    auth.uid(),
    generated_code,
    trim(room_name),
    target_pokemon_id,
    trim(target_pokemon_name),
    NULLIF(trim(target_pokemon_form), ''),
    NULLIF(trim(target_sprite_url), '')
  )
  RETURNING id INTO new_room_id;

  INSERT INTO public.hunt_room_members (room_id, user_id, display_name)
  VALUES (
    new_room_id,
    auth.uid(),
    left(
      COALESCE(
        (SELECT NULLIF(trim(username), '') FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
        'Trainer-' || upper(substr(auth.uid()::TEXT, 1, 4))
      ),
      40
    )
  );

  RETURN new_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.join_hunt_room(room_code TEXT)
RETURNS UUID AS $$
DECLARE
  selected_room public.hunt_rooms%ROWTYPE;
  member_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
    INTO selected_room
  FROM public.hunt_rooms
  WHERE invite_code = upper(trim(room_code))
  FOR UPDATE;

  IF NOT FOUND OR selected_room.status <> 'active' THEN
    RAISE EXCEPTION 'Active room not found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.hunt_room_members
    WHERE room_id = selected_room.id AND user_id = auth.uid()
  ) THEN
    RETURN selected_room.id;
  END IF;

  SELECT count(*) INTO member_count
  FROM public.hunt_room_members
  WHERE room_id = selected_room.id;

  IF member_count >= selected_room.max_members THEN
    RAISE EXCEPTION 'This room is full';
  END IF;

  INSERT INTO public.hunt_room_members (room_id, user_id, display_name)
  VALUES (
    selected_room.id,
    auth.uid(),
    left(
      COALESCE(
        (SELECT NULLIF(trim(username), '') FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
        'Trainer-' || upper(substr(auth.uid()::TEXT, 1, 4))
      ),
      40
    )
  );

  RETURN selected_room.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.increment_hunt_room_counter(
  selected_room_id UUID,
  counter_delta INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  updated_counter INTEGER;
BEGIN
  IF counter_delta IS NULL OR counter_delta = 0 OR counter_delta NOT BETWEEN -1000 AND 1000 THEN
    RAISE EXCEPTION 'Counter increment must be between -1000 and 1000, excluding zero';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.hunt_rooms
    WHERE id = selected_room_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'This hunt is no longer active';
  END IF;

  UPDATE public.hunt_room_members
  SET counter = greatest(0, counter + counter_delta),
      updated_at = now()
  WHERE room_id = selected_room_id
    AND user_id = auth.uid()
  RETURNING counter INTO updated_counter;

  IF updated_counter IS NULL THEN
    RAISE EXCEPTION 'You are not a member of this room';
  END IF;

  UPDATE public.hunt_rooms SET updated_at = now() WHERE id = selected_room_id;
  RETURN updated_counter;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.mark_hunt_room_found(selected_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_hunt_room_member(selected_room_id) THEN
    RAISE EXCEPTION 'You are not a member of this room';
  END IF;

  UPDATE public.hunt_rooms
  SET status = 'completed',
      winner_user_id = auth.uid(),
      found_at = now(),
      updated_at = now()
  WHERE id = selected_room_id
    AND status = 'active';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.close_hunt_room(selected_room_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.hunt_rooms
  SET status = 'closed', updated_at = now()
  WHERE id = selected_room_id
    AND host_user_id = auth.uid()
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only the host can close an active room';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.leave_hunt_room(selected_room_id UUID)
RETURNS VOID AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.hunt_rooms
    WHERE id = selected_room_id
      AND host_user_id = auth.uid()
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'The host must close the room before leaving';
  END IF;

  DELETE FROM public.hunt_room_members
  WHERE room_id = selected_room_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room membership not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.create_hunt_room(TEXT, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_hunt_room(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_hunt_room_counter(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_hunt_room_found(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.close_hunt_room(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leave_hunt_room(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_hunt_room(TEXT, INTEGER, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_hunt_room(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_hunt_room_counter(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_hunt_room_found(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_hunt_room(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_hunt_room(UUID) TO authenticated;

ALTER TABLE public.hunt_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.hunt_room_members REPLICA IDENTITY FULL;

DO $realtime$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'hunt_rooms'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.hunt_rooms';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'hunt_room_members'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.hunt_room_members';
  END IF;
END;
$realtime$;

COMMENT ON TABLE public.hunt_rooms IS 'Invite-only realtime group shiny hunts.';
COMMENT ON TABLE public.hunt_room_members IS 'Per-user counters and membership for realtime hunt rooms.';
