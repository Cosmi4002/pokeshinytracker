import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GAME_THEMES, type GameTheme } from '@/lib/game-themes';

const GLOBAL_CONFIG_ID = 'global';
const COLLECTION_THEME_ROW = {
  pokemon_id: -9999,
  pokemon_name: 'collection-theme-config',
};
const LOCAL_STORAGE_KEY = 'collection_theme_overrides';

export type CollectionThemeOverrides = Record<string, Partial<GameTheme>>;

function isValidHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

function sanitizeOverrides(input: unknown): CollectionThemeOverrides {
  if (!input || typeof input !== 'object') return {};
  const raw = input as Record<string, unknown>;
  const clean: CollectionThemeOverrides = {};

  Object.entries(raw).forEach(([gameId, value]) => {
    if (!value || typeof value !== 'object') return;
    const partial = value as Record<string, unknown>;
    const next: Partial<GameTheme> = {};

    if (isValidHex(partial.primary)) next.primary = partial.primary;
    if (isValidHex(partial.secondary)) next.secondary = partial.secondary;
    if (isValidHex(partial.accent)) next.accent = partial.accent;

    if (next.primary || next.secondary || next.accent) {
      clean[gameId] = next;
    }
  });

  return clean;
}

export function useGlobalCollectionThemes() {
  const [overrides, setOverrides] = useState<CollectionThemeOverrides>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        setOverrides(sanitizeOverrides(JSON.parse(localData)));
      }
    } catch {
      // Ignore local parse errors.
    }

    async function fetchGlobalThemeOverrides() {
      try {
        const { data, error } = await supabase
          .from('pokedex_overrides' as any)
          .select('custom_display_name')
          .eq('user_id', GLOBAL_CONFIG_ID)
          .eq('pokemon_id', COLLECTION_THEME_ROW.pokemon_id)
          .eq('pokemon_name', COLLECTION_THEME_ROW.pokemon_name)
          .maybeSingle();

        if (error || !data?.custom_display_name) return;
        const parsed = sanitizeOverrides(JSON.parse(data.custom_display_name));
        setOverrides(parsed);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        // Ignore remote fetch errors to keep UI resilient.
      } finally {
        setLoading(false);
      }
    }

    fetchGlobalThemeOverrides();
  }, []);

  const mergedThemes = useMemo<Record<string, GameTheme>>(() => {
    const next: Record<string, GameTheme> = {};
    Object.entries(GAME_THEMES).forEach(([gameId, base]) => {
      next[gameId] = {
        primary: overrides[gameId]?.primary || base.primary,
        secondary: overrides[gameId]?.secondary || base.secondary,
        accent: overrides[gameId]?.accent || base.accent,
      };
    });
    return next;
  }, [overrides]);

  const saveOverrides = async (nextOverrides: CollectionThemeOverrides) => {
    const clean = sanitizeOverrides(nextOverrides);
    setOverrides(clean);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clean));

    const payload = {
      user_id: GLOBAL_CONFIG_ID,
      pokemon_id: COLLECTION_THEME_ROW.pokemon_id,
      pokemon_name: COLLECTION_THEME_ROW.pokemon_name,
      custom_display_name: JSON.stringify(clean),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('pokedex_overrides' as any)
      .upsert(payload, { onConflict: 'user_id,pokemon_id,pokemon_name' } as any);

    if (error) {
      throw new Error(error.message);
    }
  };

  return {
    overrides,
    mergedThemes,
    loading,
    saveOverrides,
  };
}

