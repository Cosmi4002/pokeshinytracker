import { useState, useMemo, useEffect } from 'react';
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
import { useGlobalCollectionThemes } from '@/hooks/use-global-collection-themes';
import { resolvePokemonEntity } from '@/lib/pokemon-entity-resolver-v2';

type CaughtEntryStats = { count: number; legacyCount: number; genders: Set<string>; forms: Set<string> };
type CaughtDataMap = Record<number, CaughtEntryStats>;
const POKEDEX_VIEW_STATE_KEY = 'pokedex-view-state';

type PokedexViewState = {
    scrollY: number;
    search: string;
    generationFilter: string;
};

const normalizePokedexForm = (value?: string | null) => (value || '').toString().trim().toLowerCase();

const hasCaughtForm = (stats: CaughtEntryStats | undefined, formName?: string | null) => {
    const normalizedForm = normalizePokedexForm(formName);
    if (!stats || !normalizedForm) return false;
    return Array.from(stats.forms).some(form => normalizePokedexForm(form) === normalizedForm);
};

export default function Pokedex() {
    const { pokemon, loading: pokemonLoading, error: pokemonError } = usePokemonList();
    const { accentColor } = useRandomColor();
    const { user } = useAuth();
    const { effects } = useGlobalCollectionThemes();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const [search, setSearch] = useState(() => {
        try {
            const saved = sessionStorage.getItem(POKEDEX_VIEW_STATE_KEY);
            return saved ? (JSON.parse(saved) as Partial<PokedexViewState>).search || '' : '';
        } catch {
            return '';
        }
    });
    const [generationFilter, setGenerationFilter] = useState(() => {
        try {
            const saved = sessionStorage.getItem(POKEDEX_VIEW_STATE_KEY);
            return saved ? (JSON.parse(saved) as Partial<PokedexViewState>).generationFilter || 'all' : 'all';
        } catch {
            return 'all';
        }
    });

    // Define setCaughtData to manage caught data state
    const [caughtData, setCaughtData] = useState<CaughtDataMap>({});

    // Fetch caught counts/data
    const { data: caughtDataFromQuery, isLoading: caughtLoading } = useQuery({
        queryKey: ['caughtData', user?.id],
        queryFn: async () => {
            if (!user) return {} as CaughtDataMap;
            const { data, error } = await supabase
                .from('caught_shinies')
                .select('pokemon_id, entity_key, pokemon_name, gender, form')
                .eq('user_id', user.id)
                .or('is_fail.is.false,is_fail.is.null')
                .or('is_unobtainable.is.false,is_unobtainable.is.null');
            if (error) throw error;

            const caught: CaughtDataMap = {};
            const rows = (data || []) as Array<{ pokemon_id: number; entity_key: string | null; pokemon_name: string | null; gender: string | null; form: string | null }>;
            rows.forEach(row => {
                const id = row.pokemon_id;
                if (!caught[id]) {
                    caught[id] = { count: 0, legacyCount: 0, genders: new Set(), forms: new Set() };
                }
                caught[id].count++;
                if (row.gender) caught[id].genders.add(row.gender);
                if (row.form) caught[id].forms.add(row.form);
                else caught[id].legacyCount++;

                const entity = resolvePokemonEntity({
                    pokemonId: row.pokemon_id,
                    pokemonName: row.pokemon_name,
                    form: row.form,
                    entityKey: row.entity_key,
                });
                if (entity) {
                    const entityStats = caught[entity.speciesId] || { count: 0, legacyCount: 0, genders: new Set(), forms: new Set() };
                    entityStats.forms.add(entity.canonicalName);
                    entity.legacy.formNames.forEach(formName => entityStats.forms.add(formName));
                    if (row.gender) entityStats.genders.add(row.gender);
                    caught[entity.speciesId] = entityStats;
                }
            });
            return caught;
        },
        enabled: !!user,
        initialData: {} as CaughtDataMap
    });

    useEffect(() => {
        setCaughtData(caughtDataFromQuery || {});
    }, [caughtDataFromQuery]);

    const caughtFormNames = useMemo(() => {
        const names = new Set<string>();
        Object.values(caughtData).forEach(stats => {
            stats.forms.forEach(form => names.add(normalizePokedexForm(form)));
        });
        return names;
    }, [caughtData]);

    // Restore the exact view after returning from a Pokémon detail page.
    useEffect(() => {
        if (!pokemonLoading && !caughtLoading) {
            let savedScroll = 0;
            try {
                const savedState = sessionStorage.getItem(POKEDEX_VIEW_STATE_KEY);
                if (savedState) savedScroll = Number((JSON.parse(savedState) as Partial<PokedexViewState>).scrollY) || 0;
            } catch {
                savedScroll = 0;
            }

            // The grid can gain height for a few frames while images settle. Retry
            // briefly so mobile and desktop restore the same card reliably.
            let frame = 0;
            let frameId: number;
            const restore = () => {
                window.scrollTo(0, savedScroll);
                frame += 1;
                if (frame < 8) frameId = window.requestAnimationFrame(restore);
            };
            frameId = window.requestAnimationFrame(restore);
            return () => window.cancelAnimationFrame(frameId);
        }
    }, [pokemonLoading, caughtLoading, pathname]);

    // Grouping logic
    const speciesGroups = useMemo(() => {
        if (!pokemon || !Array.isArray(pokemon)) return [];
        const map = new Map<string, PokemonBasic[]>();
        const preferredBaseForms: Record<number, string> = {
            201: 'unown',
            493: 'arceus',
            669: 'flabebe',
            670: 'floette',
            671: 'florges',
            676: 'furfrou',
            773: 'silvally',
            741: 'oricorio-baile',
            774: 'minior-red-meteor',
            801: 'magearna',
            849: 'toxtricity-amped',
            869: 'alcremie-vanilla-cream-strawberry-sweet',
            925: 'maushold-family-of-three',
            931: 'squawkabilly-green-plumage',
            982: 'dudunsparce-three-segment',
            1017: 'ogerpon',
            1024: 'terapagos',
        };
        // Always show these full species lines even if some forms were hidden via overrides.
        const forceVisibleBaseIds = new Set([351, 386, 666]);
        const forceSingleCardBaseIds = new Set([646, 647, 800]);
        // Some species are easier to track as separate entries (each form as its own "base" card).
        // Keep them as individual Pokédex cards instead of a single % card.
        const splitIntoSeparateCardsBaseIds = new Set([
            201, // Unown letters
            493, // Arceus types
            412, // Burmy cloaks
            413, // Wormadam cloaks
            422, // Shellos seas
            423, // Gastrodon seas
            479, // Rotom appliances
            483, // Dialga forms
            484, // Palkia forms
            487, // Giratina Altered and Origin
            492, // Shaymin Land and Sky
            550, // Basculin (Red-Striped, Blue-Striped and White-Striped)
            585, // Deerling seasonal forms
            586, // Sawsbuck seasonal forms
            641, // Tornadus forms
            642, // Thundurus forms
            645, // Landorus forms
            710, // Pumpkaboo sizes
            711, // Gourgeist sizes
            669, // Flabebe colors
            670, // Floette colors
            671, // Florges colors
            676, // Furfrou trims
            773, // Silvally types
            741, // Oricorio forms
            774, // Minior forms
            745, // Lycanroc forms
            849, // Toxtricity
            854, // Sinistea authenticity
            855, // Polteageist authenticity
            892, // Urshifu
            905, // Enamorus forms
            925, // Maushold
            931, // Squawkabilly
            978, // Tatsugiri (Curly/Droopy/Stretchy)
            982, // Dudunsparce
            1012, // Poltchageist authenticity
            1013, // Sinistcha authenticity
            1017, // Ogerpon masks
            1024, // Terapagos forms
        ]);
        pokemon.forEach(p => {
            const isCanonicalBase = p.id === p.baseId;
            const isPreferredBase = preferredBaseForms[p.baseId] === p.name;
            const isForceVisible = forceVisibleBaseIds.has(p.baseId);
            if (p.hideFromPokedex && !isCanonicalBase && !isPreferredBase && !isForceVisible) return;

            // Group by base ID AND name prefix (to group gender variants, but separate regional variants)
            // Clean name key: remove gender suffixes
            let nameKey = p.name.replace(/-male$|-female$/, '');
            const alcremieSweet = p.baseId === 869
                ? p.name.match(/-(strawberry|berry|love|star|clover|flower|ribbon)(?:-sweet)?$/)?.[1]
                : null;

            if (forceSingleCardBaseIds.has(p.baseId)) nameKey = `base-${p.baseId}`;

            // Key includes baseId to sort by dex number, but nameKey to distinguish Alola/Galar etc.
            const key = alcremieSweet
                ? `${p.baseId}-sweet-${alcremieSweet}`
                : splitIntoSeparateCardsBaseIds.has(p.baseId)
                ? `${p.id}-${p.name}`
                : `${p.baseId}-${nameKey}`;

            if (!map.has(key)) map.set(key, []);
            map.get(key)?.push(p);
        });

        // Sort groups by baseId
        return Array.from(map.values()).sort((a, b) => a[0].baseId - b[0].baseId);
    }, [pokemon]);

    // Filtering logic
    const filteredGroups = useMemo(() => {
        const searchLower = search.toLowerCase();

        const ONLY_BASE_FORM = [646, 647, 800];
        const BASE_FORM_NAME: Record<number, string> = {
            646: 'kyurem',
            647: 'keldeo',
            800: 'necrozma',
        };

        return speciesGroups.filter(group => {
            let p = group[0]; // Representative

            if (ONLY_BASE_FORM.includes(p.baseId)) {
                p = group.find(g => g.name === BASE_FORM_NAME[p.baseId]) || p;
                group = [p];
            }

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
    const totalCaughtCount = Object.values(caughtData || {}).reduce((a, b) => (Number(a) || 0) + (Number(b.count) || 0), 0);

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
                                {totalCaughtCount} Pokémon caught
                            </p>
                        </div>

                        <div className="flex w-full flex-col items-center gap-3 rounded-xl border border-border/80 bg-gradient-to-b from-muted/95 to-card/95 p-3 shadow-md backdrop-blur sm:w-auto sm:flex-row dark:border-white/15 dark:from-[#202020]/95 dark:to-[#151515]/95 dark:shadow-[0_14px_34px_rgba(0,0,0,0.35)]">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/75" />
                                <Input
                                    placeholder="Search Pokémon..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="h-11 border-border/80 bg-gradient-to-b from-muted/90 to-background/95 pl-10 text-[0.95rem] font-bold text-foreground shadow-inner transition-all placeholder:font-semibold placeholder:text-foreground/70 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/15 dark:from-[#242424]/95 dark:to-[#171717]/95 dark:text-white dark:placeholder:text-white/55"
                                />
                            </div>
                            <Select value={generationFilter} onValueChange={setGenerationFilter}>
                                <SelectTrigger className="h-11 w-full border-border/80 bg-gradient-to-b from-muted/90 to-background/95 text-[0.95rem] font-bold text-foreground shadow-inner transition-all hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-[160px] dark:border-white/15 dark:from-[#242424]/95 dark:to-[#171717]/95 dark:text-white">
                                    <SelectValue placeholder="Generation" />
                                </SelectTrigger>
                                <SelectContent className="border-border bg-gradient-to-b from-muted to-popover text-popover-foreground shadow-lg dark:border-white/15 dark:from-[#202020] dark:to-[#141414] dark:text-white">
                                    <SelectItem value="all" className="font-bold text-foreground">All</SelectItem>
                                    {Object.keys(GENERATION_RANGES).map(g => (
                                        <SelectItem key={g} value={g} className="font-bold text-foreground">Gen {g}</SelectItem>
                                    ))}
                                    <SelectItem value="Alola" className="font-bold text-foreground">Alola Forms</SelectItem>
                                    <SelectItem value="Galar" className="font-bold text-foreground">Galar Forms</SelectItem>
                                    <SelectItem value="Hisui" className="font-bold text-foreground">Hisui Forms</SelectItem>
                                    <SelectItem value="Paldea" className="font-bold text-foreground">Paldea Forms</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Errors */}
                    {pokemonError && (
                        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-destructive text-center">
                            Error: {pokemonError}
                        </div>
                    )}

                    {/* Grid */}
                    {pokemonLoading || caughtLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                            {Array.from({ length: 24 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                            {filteredGroups.length === 0 && !pokemonError && (
                                <div className="col-span-full py-20 text-center text-muted-foreground">
                                    No Pokémon found.
                                </div>
                            )}
                            {filteredGroups.map(group => {
                                // Sort to ensure base form or "Single Strike" is first
                                group.sort((a, b) => a.id - b.id);
                                const p = group[0];

                                const isRegional = p.name.includes('-alola') || p.name.includes('-galar') || p.name.includes('-hisui') || p.name.includes('-paldea');

                                // Gender diff logic
                                let hasGenderDiff = !isRegional && (p.id < 10000) && POKEMON_WITH_GENDER_DIFF.includes(p.baseId);
                                // Litleo non deve mai avere doppio sprite
                                if (p.baseId === 667) hasGenderDiff = false;
                                const femaleVariant = group.find(v => v.name.endsWith('-female') && v.id !== p.id);
                                const femaleId = femaleVariant ? femaleVariant.id : undefined;

                                // Form diff logic
                                const hasFormDiff = false;
                                const secondaryForm = hasFormDiff ? group.find(v => v.id !== p.id) : undefined;

                                const hasMultipleSprites = hasGenderDiff || hasFormDiff;

                                // Granular caught status
                                // 1. Primary sprite (Male or Single Strike)
                                const statsForPrimary = caughtData[p.id];
                                const isSpecialFormId = p.id > 10000 || p.id !== p.baseId;
                                const hasFormMatch = caughtFormNames.has(normalizePokedexForm(p.name));
                                const hasPrimaryCaughtRows = (statsForPrimary?.count || 0) > 0;
                                // Vivillon's historical synthetic IDs overlap other form IDs, so its
                                // cards must rely on the explicit form slug instead of an ID-only fallback.
                                const permitsLegacyFormFallback = p.baseId !== 666;
                                const hasPrimaryLegacyRows = permitsLegacyFormFallback && (statsForPrimary?.legacyCount || 0) > 0;
                                const isPrimaryCaught = Boolean(hasPrimaryCaughtRows &&
                                    (isSpecialFormId
                                        ? hasFormMatch || hasPrimaryLegacyRows
                                        : hasGenderDiff
                                            ? statsForPrimary?.genders.has('male')
                                            : hasFormMatch || hasPrimaryLegacyRows || hasPrimaryCaughtRows));

                                // 2. Secondary sprite (Female or Rapid Strike)
                                let isSecondaryCaught = false;
                                if (hasGenderDiff) {
                                    isSecondaryCaught = Boolean((femaleId && caughtData[femaleId]?.count > 0) ||
                                        statsForPrimary?.genders.has('female'));
                                } else if (hasFormDiff && secondaryForm) {
                                    isSecondaryCaught = caughtData[secondaryForm.id]?.count > 0 ||
                                        hasCaughtForm(statsForPrimary, secondaryForm.name);
                                }

                                let totalVars = 1;
                                if (hasMultipleSprites) totalVars = 2;
                                // Do not show % completion for these (treat as single entry even if multiple "forms" exist).
                                const noPercentBaseIds = new Set([964]); // Palafin (Zero/Hero) should not be a % tracker
                                const formTotal = (!noPercentBaseIds.has(p.baseId) && group.length > 1)
                                    ? (p.baseId === 869 ? 9 : (POKEMON_FORM_COUNTS[p.baseId] || POKEMON_FORM_COUNTS[p.id]))
                                    : undefined;
                                if (formTotal) totalVars = formTotal;

                                // Species with tracked multi-form totals (e.g. Tatsugiri 978) store each form on its own ID.
                                // Count caught across the whole species group, with a legacy fallback for older rows saved on base ID.
                                let caughtCount = (isPrimaryCaught ? 1 : 0) + (isSecondaryCaught ? 1 : 0);
                                if (formTotal && formTotal > 1) {
                                    const caughtForms = new Set<string>();
                                    group.forEach(v => {
                                        const stats = caughtData[v.id];
                                        const isFormId = v.id > 10000 || v.id !== v.baseId;
                                        const formHit = (isFormId ? hasCaughtForm(stats, v.name) : (stats?.count || 0) > 0);
                                        const legacyHit = hasCaughtForm(statsForPrimary, v.name);
                                        if (formHit || legacyHit) caughtForms.add(v.name);
                                    });
                                    if (caughtForms.size > 0) caughtCount = caughtForms.size;
                                }
                                // Only use the ID fallback for legacy rows that do not identify a form.
                                // A row with an explicit, different form must never mark this card as caught
                                // (for example, Vivillon Fancy must not mark Vivillon Monsoon).
                                const hasAnyLegacyRows = permitsLegacyFormFallback && group.some(v => (caughtData[v.id]?.legacyCount || 0) > 0);
                                if (caughtCount === 0 && hasAnyLegacyRows) caughtCount = 1;
                                const isCaught = isPrimaryCaught || isSecondaryCaught || caughtCount > 0 || hasAnyLegacyRows;
                                const pct = Math.min(100, (caughtCount / totalVars) * 100);
                                const alcremieSweet = p.baseId === 869
                                    ? p.name.match(/-(strawberry|berry|love|star|clover|flower|ribbon)(?:-sweet)?$/)?.[1]
                                    : null;
                                const cardDisplayName = alcremieSweet
                                    ? `Alcremie (${alcremieSweet.charAt(0).toUpperCase()}${alcremieSweet.slice(1)} Sweet)`
                                    : p.displayName;

                                // Add a safeguard to prevent errors when clicking on non-evolving Pokémon icons
                                return (
                                    <PokedexCard
                                        key={p.id}
                                        pokemonId={p.id}
                                        baseId={p.baseId}
                                        displayName={cardDisplayName}
                                        shinyAvailability={p.shinyAvailability}
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
                                        cardFilter={effects.pokedexCardFilter}
                                        onClick={() => {
                                            try {
                                                sessionStorage.setItem(POKEDEX_VIEW_STATE_KEY, JSON.stringify({
                                                    scrollY: window.scrollY,
                                                    search,
                                                    generationFilter,
                                                } satisfies PokedexViewState));
                                            } catch {
                                                // Ignore storage failures in private browsing modes.
                                            }
                                            navigate(`/pokedex/${p.id}`, { state: { fromPokedex: true } });
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
