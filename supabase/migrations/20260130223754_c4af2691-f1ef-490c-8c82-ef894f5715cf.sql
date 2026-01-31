-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can view their own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can update their own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can insert their own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);';
  END IF;
END $$;

-- Create caught_shinies table for saved Pokemon
CREATE TABLE IF NOT EXISTS public.caught_shinies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    pokemon_id INTEGER NOT NULL,
    pokemon_name TEXT NOT NULL,
    sprite_url TEXT,
    attempts INTEGER DEFAULT 1,
    method TEXT NOT NULL,
    gender TEXT, -- 'male', 'female', 'genderless'
    pokeball TEXT NOT NULL DEFAULT 'pokeball',
    caught_date DATE NOT NULL DEFAULT CURRENT_DATE,
    game TEXT NOT NULL,
    has_shiny_charm BOOLEAN DEFAULT false,
    form TEXT, -- 'normal', 'alola', 'galar', 'hisui', 'paldea', etc.
    notes TEXT,
    playlist_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.caught_shinies ENABLE ROW LEVEL SECURITY;

-- Caught shinies policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'caught_shinies'
      AND policyname = 'Users can view their own caught shinies'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own caught shinies" ON public.caught_shinies FOR SELECT USING (auth.uid() = user_id);';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'caught_shinies'
      AND policyname = 'Users can insert their own caught shinies'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert their own caught shinies" ON public.caught_shinies FOR INSERT WITH CHECK (auth.uid() = user_id);';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'caught_shinies'
      AND policyname = 'Users can update their own caught shinies'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own caught shinies" ON public.caught_shinies FOR UPDATE USING (auth.uid() = user_id);';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'caught_shinies'
      AND policyname = 'Users can delete their own caught shinies'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete their own caught shinies" ON public.caught_shinies FOR DELETE USING (auth.uid() = user_id);';
  END IF;
END $$;

-- Create playlists/categories table
CREATE TABLE IF NOT EXISTS public.shiny_playlists (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category_type TEXT NOT NULL DEFAULT 'custom', -- 'generation', 'game', 'method', 'custom'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shiny_playlists ENABLE ROW LEVEL SECURITY;

-- Playlists policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shiny_playlists'
      AND policyname = 'Users can view their own playlists'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own playlists" ON public.shiny_playlists FOR SELECT USING (auth.uid() = user_id);';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shiny_playlists'
      AND policyname = 'Users can insert their own playlists'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert their own playlists" ON public.shiny_playlists FOR INSERT WITH CHECK (auth.uid() = user_id);';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shiny_playlists'
      AND policyname = 'Users can update their own playlists'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own playlists" ON public.shiny_playlists FOR UPDATE USING (auth.uid() = user_id);';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shiny_playlists'
      AND policyname = 'Users can delete their own playlists'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete their own playlists" ON public.shiny_playlists FOR DELETE USING (auth.uid() = user_id);';
  END IF;
END $$;

-- Add foreign key for playlist_id in caught_shinies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'caught_shinies'
      AND constraint_name = 'fk_caught_shinies_playlist'
  ) THEN
    EXECUTE 'ALTER TABLE public.caught_shinies ADD CONSTRAINT fk_caught_shinies_playlist FOREIGN KEY (playlist_id) REFERENCES public.shiny_playlists(id) ON DELETE SET NULL;';
  END IF;
END $$;

-- Create active hunts table (for counter page)
CREATE TABLE IF NOT EXISTS public.active_hunts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    pokemon_id INTEGER,
    pokemon_name TEXT,
    method TEXT NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    has_shiny_charm BOOLEAN DEFAULT false,
    increment_amount INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.active_hunts ENABLE ROW LEVEL SECURITY;

-- Active hunts policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'active_hunts'
      AND policyname = 'Users can view their own active hunts'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own active hunts" ON public.active_hunts FOR SELECT USING (auth.uid() = user_id);';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'active_hunts'
      AND policyname = 'Users can insert their own active hunts'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert their own active hunts" ON public.active_hunts FOR INSERT WITH CHECK (auth.uid() = user_id);';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'active_hunts'
      AND policyname = 'Users can update their own active hunts'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own active hunts" ON public.active_hunts FOR UPDATE USING (auth.uid() = user_id);';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'active_hunts'
      AND policyname = 'Users can delete their own active hunts'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete their own active hunts" ON public.active_hunts FOR DELETE USING (auth.uid() = user_id);';
  END IF;
END $$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_caught_shinies_updated_at ON public.caught_shinies;
CREATE TRIGGER update_caught_shinies_updated_at
BEFORE UPDATE ON public.caught_shinies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_shiny_playlists_updated_at ON public.shiny_playlists;
CREATE TRIGGER update_shiny_playlists_updated_at
BEFORE UPDATE ON public.shiny_playlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_active_hunts_updated_at ON public.active_hunts;
CREATE TRIGGER update_active_hunts_updated_at
BEFORE UPDATE ON public.active_hunts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();