ALTER TABLE public.hunt_rooms
  ADD COLUMN IF NOT EXISTS pokemon_gender TEXT,
  ADD COLUMN IF NOT EXISTS pokemon_game TEXT;

DROP FUNCTION IF EXISTS public.create_hunt_room(TEXT, INTEGER, TEXT, TEXT, TEXT);

CREATE FUNCTION public.create_hunt_room(
  room_name TEXT,
  target_pokemon_id INTEGER,
  target_pokemon_name TEXT,
  target_pokemon_form TEXT,
  target_pokemon_gender TEXT,
  target_pokemon_game TEXT,
  target_sprite_url TEXT
)
RETURNS UUID AS $$
DECLARE new_room_id UUID; generated_code TEXT; attempt INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF char_length(trim(room_name)) NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'Room name must contain between 1 and 60 characters'; END IF;
  IF target_pokemon_id IS NULL OR char_length(trim(target_pokemon_name)) = 0 THEN RAISE EXCEPTION 'A target Pokémon is required'; END IF;
  LOOP
    attempt := attempt + 1;
    generated_code := upper(substr(md5(gen_random_uuid()::TEXT), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.hunt_rooms WHERE invite_code = generated_code);
    IF attempt >= 10 THEN RAISE EXCEPTION 'Unable to generate a unique room code'; END IF;
  END LOOP;
  INSERT INTO public.hunt_rooms (host_user_id, invite_code, name, pokemon_id, pokemon_name, pokemon_form, pokemon_gender, pokemon_game, sprite_url)
  VALUES (auth.uid(), generated_code, trim(room_name), target_pokemon_id, trim(target_pokemon_name), NULLIF(trim(target_pokemon_form), ''), NULLIF(trim(target_pokemon_gender), ''), NULLIF(trim(target_pokemon_game), ''), NULLIF(trim(target_sprite_url), ''))
  RETURNING id INTO new_room_id;
  INSERT INTO public.hunt_room_members (room_id, user_id, display_name)
  VALUES (new_room_id, auth.uid(), left(COALESCE((SELECT NULLIF(trim(username), '') FROM public.profiles WHERE user_id = auth.uid() LIMIT 1), 'Trainer-' || upper(substr(auth.uid()::TEXT, 1, 4))), 40));
  RETURN new_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.create_hunt_room(TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_hunt_room(TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
