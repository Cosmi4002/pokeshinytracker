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

export function usePokedexOverrides() {
    const { user } = useAuth();
    const [overrides, setOverrides] = useState<Record<string, PokedexOverride>>({});
    const [loading, setLoading] = useState(true);

    // Initial load from LocalStorage (for instant feedback) 
    // and then fetch from Supabase if authenticated
    useEffect(() => {
        const localData = localStorage.getItem('pokedex_overrides');
        if (localData) {
            try {
                setOverrides(JSON.parse(localData));
            } catch (e) {
                console.error("Failed to parse local overrides", e);
            }
        }

        async function fetchSupabaseOverrides() {
            if (!user) {
                setLoading(false);
                return;
            }

            // Note: This relies on the table 'pokedex_overrides' existing.
            // If it doesn't, we'll just stick to localStorage as a fallback.
            const { data, error } = await supabase
                .from('pokedex_overrides' as any)
                .select('*')
                .eq('user_id', user.id);

            if (data && !error) {
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
            setLoading(false);
        }

        fetchSupabaseOverrides();
    }, [user?.id]);

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

        if (user) {
            try {
                // Upsert to Supabase
                const { error } = await supabase
                    .from('pokedex_overrides' as any)
                    .upsert({
                        user_id: user.id,
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
                .eq('user_id', user.id)
                .eq('pokemon_id', pokemon_id)
                .eq('pokemon_name', pokemon_name);
        }
    };

    return { overrides, loading, saveOverride, deleteOverride };
}
