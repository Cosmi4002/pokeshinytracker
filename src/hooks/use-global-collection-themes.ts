import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GAME_THEMES, type GameTheme } from '@/lib/game-themes';
import { isCardFilterId, type CardFilterId } from '@/lib/card-effects';

const GLOBAL_CONFIG_ID = 'global';
const COLLECTION_THEME_ROW = {
  pokemon_id: -9999,
  pokemon_name: 'collection-theme-config',
};
const LOCAL_STORAGE_KEY = 'collection_theme_overrides';
const CONFIG_UPDATED_EVENT = 'collection-theme-config-updated';

export type CollectionThemeOverrides = Record<string, Partial<GameTheme>>;
export interface CollectionThemeEffects {
  blackEffectEnabled: boolean;
  pokedexCardFilter: CardFilterId;
  collectionCardFilter: CardFilterId;
}
interface CollectionThemeConfig {
  overrides: CollectionThemeOverrides;
  effects: CollectionThemeEffects;
}

const DEFAULT_EFFECTS: CollectionThemeEffects = {
  blackEffectEnabled: false,
  pokedexCardFilter: 'none',
  collectionCardFilter: 'none',
};

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

function sanitizeEffects(input: unknown): CollectionThemeEffects {
  if (!input || typeof input !== 'object') return DEFAULT_EFFECTS;
  const raw = input as Record<string, unknown>;
  const normalizeFilter = (value: unknown, fallback: CardFilterId): CardFilterId => {
    if (value === 'frost') return 'prism';
    if (value === 'comic') return 'none';
    return isCardFilterId(value) ? value : fallback;
  };

  return {
    blackEffectEnabled: raw.blackEffectEnabled === true,
    pokedexCardFilter: normalizeFilter(raw.pokedexCardFilter, DEFAULT_EFFECTS.pokedexCardFilter),
    collectionCardFilter: normalizeFilter(raw.collectionCardFilter, DEFAULT_EFFECTS.collectionCardFilter),
  };
}

function parseStoredConfig(input: unknown): CollectionThemeConfig {
  if (!input || typeof input !== 'object') {
    return { overrides: {}, effects: DEFAULT_EFFECTS };
  }

  const raw = input as Record<string, unknown>;
  const hasStructuredConfig = 'overrides' in raw || 'effects' in raw;

  if (hasStructuredConfig) {
    return {
      overrides: sanitizeOverrides(raw.overrides),
      effects: sanitizeEffects(raw.effects),
    };
  }

  // Backward compatibility: old payload was just overrides map.
  return {
    overrides: sanitizeOverrides(raw),
    effects: DEFAULT_EFFECTS,
  };
}

export function useGlobalCollectionThemes() {
  const [overrides, setOverrides] = useState<CollectionThemeOverrides>({});
  const [effects, setEffects] = useState<CollectionThemeEffects>(DEFAULT_EFFECTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let hasLocalConfig = false;

    try {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        const parsedLocal = parseStoredConfig(JSON.parse(localData));
        setOverrides(parsedLocal.overrides);
        setEffects(parsedLocal.effects);
        hasLocalConfig = true;
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

        const row = data as { custom_display_name?: string } | null;
        if (error || !row?.custom_display_name || hasLocalConfig) return;
        const parsed = parseStoredConfig(JSON.parse(row.custom_display_name));
        setOverrides(parsed.overrides);
        setEffects(parsed.effects);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        // Ignore remote fetch errors to keep UI resilient.
      } finally {
        setLoading(false);
      }
    }

    fetchGlobalThemeOverrides();

    const handleConfigUpdate = (event: Event) => {
      const nextConfig = (event as CustomEvent<CollectionThemeConfig>).detail;
      if (!nextConfig) return;
      setOverrides(nextConfig.overrides);
      setEffects(nextConfig.effects);
    };

    window.addEventListener(CONFIG_UPDATED_EVENT, handleConfigUpdate);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, handleConfigUpdate);
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

  const saveConfig = async (nextOverrides: CollectionThemeOverrides, nextEffects: CollectionThemeEffects = effects) => {
    const clean = sanitizeOverrides(nextOverrides);
    const cleanEffects = sanitizeEffects(nextEffects);
    const fullConfig: CollectionThemeConfig = {
      overrides: clean,
      effects: cleanEffects,
    };

    setOverrides(clean);
    setEffects(cleanEffects);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fullConfig));
    window.dispatchEvent(new CustomEvent(CONFIG_UPDATED_EVENT, { detail: fullConfig }));
  };

  return {
    overrides,
    mergedThemes,
    effects,
    loading,
    saveConfig,
  };
}
