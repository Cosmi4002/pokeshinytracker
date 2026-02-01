
# IMPORTANTE: Correzione Errore Database

L'errore "Could not find the table 'public.user_preferences'" appare perché manca una tabella nel database Supabase.

## Come risolvere:
1. Vai sulla dashboard del tuo progetto Supabase.
2. Clicca su **SQL Editor** (barra laterale sinistra).
3. Clicca su **New Query**.
4. Copia e incolla il seguente codice SQL:

```sql
-- Crea la tabella preferenze
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_color varchar(7) DEFAULT '#8b5cf6',
  background_color varchar(7) DEFAULT '#0f172a',
  layout_style varchar(50) DEFAULT 'grid',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Abilita la sicurezza (RLS)
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Crea le policy di accesso
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON user_preferences FOR DELETE USING (auth.uid() = user_id);

-- Crea indice per velocità
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

5. Clicca su **Run**.

Dopo questo passaggio, le impostazioni funzioneranno correttamente e l'errore sparirà.
Le modifiche al codice (Settings -> Luna) sono state salvate su GitHub.
