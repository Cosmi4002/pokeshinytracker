import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

/**
 * Hook to manage Pokédex caught status.
 * - Syncs FROM collection (caught_shinies table)
 * - Local toggle state for Pokédex-only marks (not persisted to collection)
 */

export interface CaughtFormKey {
    pokemonId: number;
    formId: number; // Can be same as pokemonId for base form, or different for variants
    gender: 'male' | 'female' | 'genderless';
}

function makeKey(pokemonId: number, formId: number, gender: string): string {
    return `${pokemonId}-${formId}-${gender}`;
}

export function usePokedexCaught() {
    const { user } = useAuth();

    // Caught shinies from collection (persisted)
    const [collectionCaught, setCollectionCaught] = useState<Set<string>>(new Set());
    // Local Pokédex marks (not persisted to collection)
    const [localMarks, setLocalMarks] = useState<Set<string>>(new Set());

    const [loading, setLoading] = useState(true);

    // Fetch from collection on mount
    useEffect(() => {
        if (!user) {
            setCollectionCaught(new Set());
            setLoading(false);
            return;
        }

        async function fetchCaughtShinies() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('caught_shinies')
                    .select('pokemon_id, gender, form')
                    .eq('user_id', user!.id);

                if (error) throw error;

                const caughtSet = new Set<string>();
                data?.forEach(row => {
                    // For collection entries, use pokemon_id as both base and form
                    const formId = row.form ? parseInt(row.form) || row.pokemon_id : row.pokemon_id;
                    caughtSet.add(makeKey(row.pokemon_id, formId, row.gender || 'genderless'));
                });
                setCollectionCaught(caughtSet);
            } catch (err) {
                console.error('Error fetching caught shinies:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchCaughtShinies();
    }, [user?.id]);

    // Combined caught status (collection OR local marks)
    const isCaught = useCallback((pokemonId: number, formId: number, gender: string): boolean => {
        const key = makeKey(pokemonId, formId, gender);
        return collectionCaught.has(key) || localMarks.has(key);
    }, [collectionCaught, localMarks]);

    // Toggle local mark (Pokédex only, not persisted)
    const toggleLocalMark = useCallback((pokemonId: number, formId: number, gender: string) => {
        const key = makeKey(pokemonId, formId, gender);
        setLocalMarks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    }, []);

    // Check if caught via collection (not just local mark)
    const isInCollection = useCallback((pokemonId: number, formId: number, gender: string): boolean => {
        const key = makeKey(pokemonId, formId, gender);
        return collectionCaught.has(key);
    }, [collectionCaught]);

    // Calculate caught percentage for a Pokémon (for partial illumination)
    const getCaughtPercentage = useCallback((pokemonId: number, allForms: Array<{ formId: number; gender: string }>) => {
        if (allForms.length === 0) return 0;
        const caughtCount = allForms.filter(f => isCaught(pokemonId, f.formId, f.gender)).length;
        return (caughtCount / allForms.length) * 100;
    }, [isCaught]);

    // Group caught by base Pokemon ID for grid display
    const getCaughtCountForPokemon = useCallback((pokemonId: number): { caught: number; total: number } => {
        // Count all entries for this pokemonId
        let caught = 0;
        const checked = new Set<string>();

        collectionCaught.forEach(key => {
            if (key.startsWith(`${pokemonId}-`)) {
                caught++;
                checked.add(key);
            }
        });

        localMarks.forEach(key => {
            if (key.startsWith(`${pokemonId}-`) && !checked.has(key)) {
                caught++;
            }
        });

        // We don't know total forms without fetching details, return caught only
        return { caught, total: -1 };
    }, [collectionCaught, localMarks]);

    return {
        loading,
        isCaught,
        isInCollection,
        toggleLocalMark,
        getCaughtPercentage,
        getCaughtCountForPokemon,
        // Expose raw sets for advanced usage
        collectionCaught,
        localMarks,
    };
}
