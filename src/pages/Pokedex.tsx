import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePokemonList, getPokemonSpriteUrl, GENERATION_RANGES, POKEMON_WITH_GENDER_DIFF, PokemonBasic } from '@/hooks/use-pokemon';
import { Skeleton } from '@/components/ui/skeleton';
import { PokedexCard } from '@/components/pokedex/PokedexCard';
import { useRandomColor } from '@/lib/random-color-context';
import { POKEMON_FORM_COUNTS } from '@/lib/pokemon-data';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

export default function Pokedex() {
    const { pokemon, loading: pokemonLoading, error: pokemonError } = usePokemonList();
    const { accentColor } = useRandomColor();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const [search, setSearch] = useState('');
    const [generationFilter, setGenerationFilter] = useState('all');

    // Fetch caught counts/data
    const { data: caughtData, isLoading: caughtLoading } = useQuery({
        queryKey: ['caughtData', user?.id],
        queryFn: async () => {
            if (!user) return {};
            const { data, error } = await supabase
                .from('caught_shinies')
                .select('pokemon_id, gender, form');
            if (error) throw error;

            const caught: Record<number, { count: number, genders: Set<string>, forms: Set<string> }> = {};
            data?.forEach(row => {
                const id = row.pokemon_id;
                if (!caught[id]) {
                    caught[id] = { count: 0, genders: new Set(), forms: new Set() };
                }
                caught[id].count++;
                if (row.gender) caught[id].genders.add(row.gender);
                if (row.form) caught[id].forms.add(row.form);
            });
            return caught;
        },
        enabled: !!user,
        initialData: {}
    });

    // Restore scroll position after data is loaded
    useEffect(() => {
        if (!pokemonLoading && !caughtLoading) {
            const savedPosition = sessionStorage.getItem(`scroll-${pathname}`);
            if (savedPosition) {
                // Use a small timeout to ensure DOM is fully rendered
                setTimeout(() => {
                    window.scrollTo(0, parseInt(savedPosition));
                }, 100);
            }
        }
    }, [pokemonLoading, caughtLoading, pathname]);

    // Grouping logic
    const speciesGroups = useMemo(() => {
        if (!pokemon || !Array.isArray(pokemon)) return [];
        const map = new Map<string, PokemonBasic[]>();
        pokemon.forEach(p => {
            // Group by base ID AND name prefix (to group gender variants, but separate regional variants)
            // Clean name key: remove gender suffixes
            const nameKey = p.name.replace(/-male$|-female$/, '');
            // Key includes baseId to sort by dex number, but nameKey to distinguish Alola/Galar etc.
            const key = `${p.baseId}-${nameKey}`;

            if (!map.has(key)) map.set(key, []);
            map.get(key)?.push(p);
        });

        // Sort groups by baseId
        return Array.from(map.values()).sort((a, b) => a[0].baseId - b[0].baseId);
    }, [pokemon]);

    // Filtering logic
    const filteredGroups = useMemo(() => {
        const searchLower = search.toLowerCase();

        return speciesGroups.filter(group => {
            const p = group[0]; // Representative

            // Search
            const matchesSearch = !search || p.displayName.toLowerCase().includes(searchLower) || p.id.toString().includes(search);
            if (!matchesSearch) return false;

            // Generation Filter
            if (generationFilter !== 'all') {
                const isAlolan = p.name.includes('-alola');
                const isGalarian = p.name.includes('-galar');
                const isHisuian = p.name.includes('-hisui');
                const isPaldean = p.name.includes('-paldea');
                const isRegional = isAlolan || isGalarian || isHisuian || isPaldean;

                if (generationFilter === 'Alola') return isAlolan;
                if (generationFilter === 'Galar') return isGalarian;
                if (generationFilter === 'Hisui') return isHisuian;
                if (generationFilter === 'Paldea') return isPaldean; // Only shows actual Paldean forms

                // Numbered Gens: Exclude Regional forms
                const genNum = parseInt(generationFilter);
                if (p.generation !== genNum) return false;
                if (isRegional) return false;
            }

            return true;
        });
    }, [speciesGroups, search, generationFilter]);

    // Total caught count
    const totalCaughtCount = Object.values(caughtData || {}).reduce((a, b) => (Number(a.count) || 0) + (Number(b) || 0), 0);

    return (
        <div className="min-h-screen bg-background transition-colors duration-1000" style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}15 0%, transparent 70%)` }}>
            <Navbar />
            <main className="container mx-auto py-8 px-4">
                <div className="space-y-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between text-center md:text-left">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${accentColor}, color-mix(in srgb, ${accentColor}, white 30%))` }}>
                                Shiny Pokédex
                            </h1>
                            <p className="text-muted-foreground mt-1 font-medium">
                                {totalCaughtCount} Pokémon catturati
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cerca Pokémon..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-10 h-11 bg-white/5 border-primary/20 focus:border-primary transition-all text-foreground"
                                />
                            </div>
                            <Select value={generationFilter} onValueChange={setGenerationFilter}>
                                <SelectTrigger className="w-full sm:w-[160px] h-11 bg-white/5 border-primary/20">
                                    <SelectValue placeholder="Generazione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tutti</SelectItem>
                                    {Object.keys(GENERATION_RANGES).map(g => (
                                        <SelectItem key={g} value={g}>Gen {g}</SelectItem>
                                    ))}
                                    <SelectItem value="Alola">Alola Forms</SelectItem>
                                    <SelectItem value="Galar">Galar Forms</SelectItem>
                                    <SelectItem value="Hisui">Hisui Forms</SelectItem>
                                    <SelectItem value="Paldea">Paldea Forms</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Errors */}
                    {pokemonError && (
                        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-destructive text-center">
                            Errore: {pokemonError}
                        </div>
                    )}

                    {/* Grid */}
                    {pokemonLoading || caughtLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {Array.from({ length: 24 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {filteredGroups.length === 0 && !pokemonError && (
                                <div className="col-span-full py-20 text-center text-muted-foreground">
                                    Nessun Pokémon trovato.
                                </div>
                            )}
                            {filteredGroups.map(group => {
                                // Sort to ensure base form or "Single Strike" is first
                                group.sort((a, b) => a.id - b.id);
                                const p = group[0];

                                const isRegional = p.name.includes('-alola') || p.name.includes('-galar') || p.name.includes('-hisui') || p.name.includes('-paldea');

                                // Gender diff logic
                                const hasGenderDiff = !isRegional && (p.id < 10000) && POKEMON_WITH_GENDER_DIFF.includes(p.baseId);
                                const femaleVariant = group.find(v => v.name.endsWith('-female') && v.id !== p.id);
                                const femaleId = femaleVariant ? femaleVariant.id : undefined;

                                // Form diff logic (e.g. Urshifu 892)
                                const hasFormDiff = p.baseId === 892 && group.length >= 2;
                                const secondaryForm = hasFormDiff ? group.find(v => v.id !== p.id) : undefined;

                                const hasMultipleSprites = hasGenderDiff || hasFormDiff;

                                // Granular caught status
                                // 1. Primary sprite (Male or Single Strike)
                                const isPrimaryCaught = caughtData[p.id]?.count > 0 &&
                                    (!hasGenderDiff || caughtData[p.id]?.genders.has('male') || caughtData[p.id]?.forms.has(p.name));

                                // 2. Secondary sprite (Female or Rapid Strike)
                                let isSecondaryCaught = false;
                                if (hasGenderDiff) {
                                    isSecondaryCaught = (femaleId && caughtData[femaleId]?.count > 0) ||
                                        (!femaleId && caughtData[p.id]?.genders.has('female'));
                                } else if (hasFormDiff && secondaryForm) {
                                    isSecondaryCaught = caughtData[secondaryForm.id]?.count > 0 ||
                                        caughtData[p.id]?.forms.has(secondaryForm.name);
                                }

                                const isCaught = isPrimaryCaught || isSecondaryCaught;

                                let totalVars = 1;
                                if (hasMultipleSprites) totalVars = 2;
                                if (POKEMON_FORM_COUNTS[p.id]) totalVars = POKEMON_FORM_COUNTS[p.id];

                                const caughtCount = (isPrimaryCaught ? 1 : 0) + (isSecondaryCaught ? 1 : 0);
                                const pct = Math.min(100, (caughtCount / totalVars) * 100);

                                return (
                                    <PokedexCard
                                        key={p.id}
                                        pokemonId={p.id}
                                        baseId={p.baseId}
                                        displayName={p.displayName}
                                        spriteUrl={getPokemonSpriteUrl(p.id, { shiny: true, name: p.name })}
                                        secondarySprite={hasMultipleSprites
                                            ? getPokemonSpriteUrl(secondaryForm?.id || femaleId || p.id, {
                                                shiny: true,
                                                female: hasGenderDiff && !femaleId,
                                                name: secondaryForm?.name || p.name
                                            })
                                            : undefined
                                        }
                                        hasMultipleSprites={hasMultipleSprites}
                                        isPrimaryCaught={isPrimaryCaught}
                                        isSecondaryCaught={isSecondaryCaught}
                                        caughtPercentage={pct}
                                        hasCaughtAny={isCaught}
                                        onClick={() => {
                                            navigate(`/pokedex/${p.id}`);
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
