import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { POKEMON_DATA_OVERRIDES, BANNED_FORM_NAMES } from '@/lib/form-filters';

export interface PokedexOverride {
    pokemon_id: number;
    pokemon_name: string;
    custom_display_name?: string;
    is_excluded?: boolean;
}

const GLOBAL_CONFIG_ID = 'global';

export function usePokedexOverrides() {
    const { user } = useAuth();
    const [overrides, setOverrides] = useState<Record<string, PokedexOverride>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load from LocalStorage for instant perceived performance
        const localData = localStorage.getItem('pokedex_overrides');
        if (localData) {
            try {
                setOverrides(JSON.parse(localData));
            } catch (e) {
                console.error("Failed to parse local overrides", e);
            }
        }

        async function fetchGlobalOverrides() {
            try {
                // Everyone (including guest users) gets the global config
                const { data, error } = await supabase
                    .from('pokedex_overrides' as any)
                    .select('*')
                    .eq('user_id', GLOBAL_CONFIG_ID);

                if (error) {
                    console.warn("Pokedex overrides table might be missing:", error.message);
                } else if (data) {
                    const formatted: Record<string, PokedexOverride> = {};
                    data.forEach((row: any) => {
                        formatted[`${row.pokemon_id}-${row.pokemon_name}`] = {
                            pokemon_id: row.pokemon_id,
                            pokemon_name: row.pokemon_name,
                            custom_display_name: row.custom_display_name,
                            is_excluded: row.is_excluded
                        };
                    });
                    setOverrides(formatted);
                    localStorage.setItem('pokedex_overrides', JSON.stringify(formatted));
                }
            } catch (err) {
                console.error("Error fetching global overrides:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchGlobalOverrides();
    }, []);

    const saveOverride = async (pokemon_id: number, pokemon_name: string, update: Partial<PokedexOverride>) => {
        const key = `${pokemon_id}-${pokemon_name}`;
        const newOverrides = {
            ...overrides,
            [key]: {
                ...(overrides[key] || { pokemon_id, pokemon_name }),
                ...update
            }
        };

        setOverrides(newOverrides);
        localStorage.setItem('pokedex_overrides', JSON.stringify(newOverrides));

        // Only authenticated users can save to the global config
        if (user) {
            try {
                const { error } = await supabase
                    .from('pokedex_overrides' as any)
                    .upsert({
                        user_id: GLOBAL_CONFIG_ID,
                        pokemon_id,
                        pokemon_name,
                        ...update,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id,pokemon_id,pokemon_name' } as any);

                if (error) console.error("Supabase sync failed", error);
            } catch (e) {
                console.warn("Supabase table might not exist yet", e);
            }
        }
    };

    const deleteOverride = async (pokemon_id: number, pokemon_name: string) => {
        const key = `${pokemon_id}-${pokemon_name}`;
        const { [key]: deleted, ...remaining } = overrides;

        setOverrides(remaining);
        localStorage.setItem('pokedex_overrides', JSON.stringify(remaining));

        if (user) {
            await supabase
                .from('pokedex_overrides' as any)
                .delete()
                .eq('user_id', GLOBAL_CONFIG_ID)
                .eq('pokemon_id', pokemon_id)
                .eq('pokemon_name', pokemon_name);
        }
    };

    return { overrides, loading, saveOverride, deleteOverride };
}
