# Istruzioni Database

L'errore `Could not find the table 'public.user_preferences'` indica che manca la tabella `user_preferences` nel tuo database Supabase.

Esegui questo codice SQL nell'Editor SQL di Supabase per creare la tabella e risolvere il problema.

```sql
-- Crea la tabella user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    theme_color TEXT DEFAULT '#8b5cf6',
    background_color TEXT DEFAULT '#0f172a',
    layout_style TEXT DEFAULT 'grid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Abilita RLS (Row Level Security)
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy per permettere agli utenti di vedere solo le proprie preferenze
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences FOR SELECT 
USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di inserire le proprie preferenze
CREATE POLICY "Users can insert their own preferences" 
ON public.user_preferences FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy per permettere agli utenti di aggiornare le proprie preferenze
CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences FOR UPDATE 
USING (auth.uid() = user_id);

-- Esempio di inserimento automatico al signup (opzionale, ma utile)
-- create function public.handle_new_user_preferences() 
-- returns trigger as $$
-- begin
--   insert into public.user_preferences (user_id)
--   values (new.id);
--   return new;
-- end;
-- $$ language plpgsql security definer;
--
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user_preferences();
```
