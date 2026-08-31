import { useParams, useNavigate, useLocation } from "react-router-dom";
import { usePokemonDetails, getPokemonSpriteUrl } from "@/hooks/use-pokemon";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { useRandomColor } from "@/lib/random-color-context";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    CheckCircle2,
    Lock,
    UserX,
    Edit3,
    EyeOff,
    Trash2,
    Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { isFormEliminated, POKEMON_DATA_OVERRIDES } from "@/lib/form-filters";
import { usePokedexOverrides } from "@/hooks/use-pokedex-overrides";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { todayLocalISODate } from "@/lib/date";
import { getGameTheme, GAME_LOGOS } from "@/lib/game-themes";
import { GAMES } from "@/lib/pokemon-data";
import {
    getAvailabilitySourceLinks,
    getCuratedShinyOriginGameIds
} from "@/lib/pokemon-game-availability";
import { resolveEntityKeyForSelectedPokemon, resolvePokemonEntityKey } from "@/lib/pokemon-entity-resolver-v2";
import { getGameSpecificShinySpriteUrl } from "@/lib/game-sprites";

interface FormVariant {
    id: number;
    name: string;
    displayName: string;
    category: 'base' | 'regional' | 'seasonal' | 'form' | 'gender';
    gender: 'male' | 'female' | 'genderless';
    spriteUrl: string;
}

interface CaughtGameRow {
    pokemon_id: number;
    entity_key: string | null;
    gender: string | null;
    form: string | null;
    game: string | null;
    secondary_game: string | null;
    is_evolved: boolean | null;
    pokemon_name: string | null;
    evolved_from_name: string | null;
}

type CaughtGender = 'male' | 'female';
type CaughtGameGenderMap = Record<string, CaughtGender[]>;
type AcquisitionInfo = {
    sourcePokemonName: string;
    originGameName: string;
    originGameId: string;
    transferGameId: string | null;
};

const normalizeCaughtGender = (gender?: string | null): CaughtGender | null => {
    const normalized = (gender || '').trim().toLowerCase();
    if (normalized === 'female' || normalized === 'f' || normalized === '♀') return 'female';
    if (normalized === 'male' || normalized === 'm' || normalized === '♂') return 'male';
    return null;
};

const isCaughtGender = (gender?: string | null): gender is CaughtGender => normalizeCaughtGender(gender) !== null;

const addCaughtGameGender = (
    map: CaughtGameGenderMap,
    gameId: string | null,
    gender: CaughtGender | null
) => {
    if (!gameId || gameId === 'unknown' || !GAME_LOGOS[gameId] || !gender) return;
    const existing = map[gameId] || [];
    if (!existing.includes(gender)) {
        map[gameId] = [...existing, gender];
    }
};

export default function PokemonDetails() {
    const { pokemonId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { pokemon: details, loading } = usePokemonDetails(Number(pokemonId));
    const { overrides, saveOverride } = usePokedexOverrides();
    const { user } = useAuth();
    const { toast } = useToast();
    const { accentColor } = useRandomColor();

    const [isEditorEnabled, setIsEditorEnabled] = useState(() => {
        return localStorage.getItem('pokedex-editor-enabled') === 'true';
    });

    useEffect(() => {
        const handleEditorChange = () => {
            setIsEditorEnabled(localStorage.getItem('pokedex-editor-enabled') === 'true');
        };
        window.addEventListener('editor-mode-changed', handleEditorChange);
        return () => window.removeEventListener('editor-mode-changed', handleEditorChange);
    }, []);



    const [caughtForms, setCaughtForms] = useState<Set<string>>(new Set());
    const [caughtGames, setCaughtGames] = useState<Set<string>>(new Set());
    const [caughtGameGenders, setCaughtGameGenders] = useState<CaughtGameGenderMap>({});
    const [acquisitionInfo, setAcquisitionInfo] = useState<AcquisitionInfo | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Fetch caught status
    useEffect(() => {
        if (user && pokemonId) {
            fetchCaughtStatus();
        } else {
            setCaughtForms(new Set());
            setCaughtGames(new Set());
            setCaughtGameGenders({});
            setAcquisitionInfo(null);
        }
    }, [user, pokemonId, details]);

    const fetchCaughtStatus = async () => {
        if (!user || !details) return;
        try {
            // Fetch all IDs present in our variants list
            const variantIds = Array.from(new Set(variants.map(v => v.id)));

            const { data, error } = await supabase
                .from('caught_shinies')
                .select('pokemon_id, entity_key, gender, form, game, secondary_game, is_evolved, pokemon_name, evolved_from_name')
                .eq('user_id', user.id)
                .or('is_fail.is.false,is_fail.is.null')
                .or('is_unobtainable.is.false,is_unobtainable.is.null')
                .in('pokemon_id', variantIds);

            if (error) throw error;

            const caughtSet = new Set<string>();
            const gameSet = new Set<string>();
            const gameGenderMap: CaughtGameGenderMap = {};
            let nextAcquisitionInfo: AcquisitionInfo | null = null;
            const rows = (data || []) as CaughtGameRow[];

            rows.forEach(row => {
                let matchedThisPokemon = false;
                let matchedGender: CaughtGender | null = normalizeCaughtGender(row.gender);
                const resolvedKey = resolvePokemonEntityKey({
                    pokemonId: row.pokemon_id,
                    form: row.form,
                    entityKey: row.entity_key,
                });
                const matchedByEntity = resolvedKey
                    ? variants.find(v => resolveEntityKeyForSelectedPokemon({
                        pokemonId: v.id,
                        pokemonName: v.displayName,
                        form: v.name,
                    }) === resolvedKey)
                    : null;

                if (matchedByEntity) {
                    caughtSet.add(matchedByEntity.name);
                    if (!matchedGender && isCaughtGender(matchedByEntity.gender)) {
                        matchedGender = matchedByEntity.gender;
                    }
                    matchedThisPokemon = true;
                }

                // Priority 1: Exact form name match (new standard)
                if (!matchedThisPokemon && row.form) {
                    caughtSet.add(row.form);
                    const matchedVariant = variants.find(v => v.name === row.form);
                    if (!matchedGender && isCaughtGender(matchedVariant?.gender)) {
                        matchedGender = matchedVariant.gender;
                    }
                    matchedThisPokemon = true;
                } else if (!matchedThisPokemon) {
                    // Priority 2: Legacy fallback using ID and gender
                    const g = row.gender || 'genderless';
                    let matchedVariant = variants.find(v => v.id === row.pokemon_id && v.gender === g);

                    // Second-chance fallback for base forms (often saved as genderless)
                    if (!matchedVariant && g === 'genderless') {
                        matchedVariant = variants.find(v => v.id === row.pokemon_id && v.category === 'base');
                    }

                    // Third-chance fallback: entries salvate come female/male per specie senza sprite gender-diff.
                    if (!matchedVariant) {
                        const hasGenderVariantForId = variants.some(v => v.id === row.pokemon_id && v.category === 'gender');
                        if (!hasGenderVariantForId) {
                            matchedVariant = variants.find(v => v.id === row.pokemon_id && v.category === 'base');
                        }
                    }

                    if (matchedVariant) {
                        caughtSet.add(matchedVariant.name);
                        if (!matchedGender && isCaughtGender(matchedVariant.gender)) {
                            matchedGender = matchedVariant.gender;
                        }
                        matchedThisPokemon = true;
                    }
                }

                if (matchedThisPokemon) {
                    const sourcePokemonName = row.evolved_from_name || (
                        /origin(?: forme)?\)?$/i.test(row.pokemon_name || details.name)
                            ? (row.pokemon_name || details.name).replace(/\s*\(Origin(?: Forme)?\)\s*$/i, '')
                            : null
                    );
                    const originGame = GAMES.find((game) => game.id === row.game);
                    if (!nextAcquisitionInfo && sourcePokemonName && originGame) {
                        nextAcquisitionInfo = {
                            sourcePokemonName,
                            originGameName: originGame.name,
                            originGameId: originGame.id,
                            transferGameId: row.secondary_game,
                        };
                    }

                    // For an evolved entry, the secondary game is the game where
                    // the current species/form was obtained. The primary game
                    // remains provenance only and must not mark this form as caught.
                    const gamesForCurrentPokemon = row.is_evolved && row.secondary_game
                        ? [row.secondary_game]
                        : [row.game, row.secondary_game];
                    gamesForCurrentPokemon.forEach(gameId => {
                        if (gameId && gameId !== 'unknown' && GAME_LOGOS[gameId]) {
                            gameSet.add(gameId);
                            addCaughtGameGender(gameGenderMap, gameId, matchedGender);
                        }
                    });
                }
            });
            setCaughtForms(caughtSet);
            setCaughtGames(gameSet);
            setCaughtGameGenders(gameGenderMap);
            setAcquisitionInfo(nextAcquisitionInfo);
        } catch (err) {
            console.error("Error fetching caught status:", err);
        }
    };

    // Flatten all variants from the hook data
    const variants = useMemo((): FormVariant[] => {
        if (!details) return [];
        const items: FormVariant[] = [];

        const baseVariant: FormVariant = {
            id: details.id,
            name: details.name,
            displayName: details.hasGenderDifference ? 'Male' : details.displayName,
            category: 'base',
            gender: details.hasGenderDifference ? 'male' : 'genderless',
            spriteUrl: baseSpriteUrl
        };
        items.push(baseVariant);

        if (details.hasGenderDifference && femaleSpriteUrl) {
            items.push({
                id: details.id,
                name: `${details.name}-female`,
                displayName: 'Female',
                category: 'gender',
                gender: 'female',
                spriteUrl: femaleSpriteUrl
            });
        }

        // Add all other local forms/varieties (relatives sharing same baseId)
        details.forms.forEach(f => {
            // Avoid duplicating gender variants as "forms" when gender sprites already exist.
            if (details.hasGenderDifference) {
                const fnLower = f.formName.toLowerCase();
                if (fnLower.endsWith('-female') || fnLower.endsWith('-male')) return;
            }
            // Inclusion check: static filters + dynamic user overrides
            const isExcluded = isFormEliminated(f.formName) || (overrides[`${f.id}-${f.formName}`] as any)?.is_excluded;
            if (isExcluded) return;

            // Basic categorization
            let category: FormVariant['category'] = 'form';
            const fn = f.formName.toLowerCase();
            if (fn.includes('-alola') || fn.includes('-galar') || fn.includes('-hisui') || fn.includes('-paldea')) {
                category = 'regional';
            }

            items.push({
                id: f.id,
                name: f.formName,
                displayName: f.displayName,
                category,
                gender: 'genderless',
                spriteUrl: getPokemonSpriteUrl(f.id, { name: f.formName })
            });
        });

        return items;
    }, [details, overrides]);

    const curatedGameIds = useMemo(() => {
        if (!details) return null;
        return getCuratedShinyOriginGameIds(details.baseId || details.id, details.name);
    }, [details]);

    const availabilitySourceLinks = useMemo(() => {
        if (!details) return [];
        const defaultSpeciesName = details.varieties.find(variant => variant.isDefault)?.pokemon.name || details.name;
        return getAvailabilitySourceLinks(details.displayName, defaultSpeciesName);
    }, [details]);

    const availableGames = useMemo(() => {
        if (!details) return [];

        const firstPlayableGeneration = Math.max(details.generation || 1, 2);
        const curatedGameIdSet = curatedGameIds ? new Set<string>(curatedGameIds) : null;

        return GAMES
            .filter(game => (
                GAME_LOGOS[game.id]
                && (curatedGameIdSet ? curatedGameIdSet.has(game.id) : game.generation >= firstPlayableGeneration)
            ))
            .map(game => ({
                ...game,
                logo: GAME_LOGOS[game.id],
                theme: getGameTheme(game.id),
                isCaught: caughtGames.has(game.id)
            }));
    }, [caughtGames, curatedGameIds, details]);

    const gamesByGeneration = useMemo(() => {
        const groups = new Map<number, typeof availableGames>();

        availableGames.forEach(game => {
            const games = groups.get(game.generation);

            if (games) {
                games.push(game);
            } else {
                groups.set(game.generation, [game]);
            }
        });

        return Array.from(groups.entries()).map(([generation, games]) => ({ generation, games }));
    }, [availableGames]);

    const caughtGameCount = availableGames.filter(game => game.isCaught).length;

    const originFormNote = details?.name === 'dialga-origin'
        ? 'Non è un incontro shiny separato: trasferisci un Dialga shiny legittimo in Leggende: Arceus o Pokémon Scarlatto/Violetto e usa l’Adamant Crystal. Il Dialga della storia in Leggende: Arceus è shiny-locked.'
        : details?.name === 'palkia-origin'
            ? 'Non è un incontro shiny separato: trasferisci un Palkia shiny legittimo in Leggende: Arceus o Pokémon Scarlatto/Violetto e usa il Lustrous Globe. Il Palkia della storia in Leggende: Arceus è shiny-locked.'
            : null;

    const toggleCaught = async (variant: FormVariant) => {
        if (!user) {
            toast({
                title: "Sign-in required",
                description: "Sign in to save your collection.",
                variant: "destructive"
            });
            return;
        }

        const key = variant.name;
        const isCaught = caughtForms.has(key);
        const entityKey = resolveEntityKeyForSelectedPokemon({
            pokemonId: variant.id,
            pokemonName: variant.displayName,
            form: variant.name,
        });
        setActionLoading(key);

        try {
            if (isCaught) {
                if (entityKey) {
                    const { error } = await supabase
                        .from('caught_shinies')
                        .delete()
                        .eq('user_id', user.id)
                        .eq('entity_key', entityKey);
                    if (error) throw error;
                }
                const { error } = await supabase
                    .from('caught_shinies')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('pokemon_id', variant.id)
                    .eq('form', variant.name);
                if (error) throw error;

                const next = new Set(caughtForms);
                next.delete(key);
                setCaughtForms(next);
                await fetchCaughtStatus();
            } else {
                const { error } = await supabase
                    .from('caught_shinies')
                    .insert({
                        user_id: user.id,
                        pokemon_id: variant.id,
                        entity_key: entityKey,
                        pokemon_name: variant.displayName,
                        gender: variant.gender,
                        form: variant.name,
                        sprite_url: variant.spriteUrl,
                        shiny_type: 'star',
                        method: 'unknown',
                        game: 'unknown',
                        pokeball: 'pokeball',
                        show_total_seen: false,
                        total_seen_count: null,
                        caught_date: todayLocalISODate()
                    });
                if (error) throw error;

                const next = new Set(caughtForms);
                next.add(key);
                setCaughtForms(next);
                await fetchCaughtStatus();
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div
                className="min-h-screen bg-background text-foreground transition-colors duration-1000"
                style={{
                    backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}15 0%, transparent 70%)`
                }}
            >
                <Navbar />
                <div className="container mx-auto py-12 px-4 space-y-8 animate-pulse">
                    <div className="h-64 rounded-3xl bg-muted" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-3/4" />
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-1/2" />
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!details) return null;

    const baseSpriteUrl = getPokemonSpriteUrl(details.id, { name: details.name });
    const femaleSpriteUrl = details.hasGenderDifference
        ? getPokemonSpriteUrl(details.id, { female: true, name: details.name })
        : null;

    const currentId = details.id;
    const prevId = currentId > 1 && currentId < 10000 ? currentId - 1 : null;
    const nextId = currentId < 1025 ? currentId + 1 : null;
    const heroVariant = variants.find(variant => variant.category === 'base') || variants[0];
    const heroIsCaught = heroVariant ? caughtForms.has(heroVariant.name) : false;
    const gameSpriteGroups = heroVariant
        ? [
            {
                id: 'hgss',
                label: 'HeartGold / SoulSilver',
                description: 'Original animated shiny sprite shared by HeartGold and SoulSilver.',
                games: ['heartgold', 'soulsilver'],
            },
            {
                id: 'bw',
                label: 'Black / White',
                description: 'Original animated shiny sprite shared by Black and White.',
                games: ['black', 'white'],
            },
            {
                id: 'bw2',
                label: 'Black 2 / White 2',
                description: 'Original animated shiny sprite shared by Black 2 and White 2.',
                games: ['black2', 'white2'],
            },
        ].map(group => {
            const caughtGamesForGroup = group.games.filter(gameId => caughtGames.has(gameId));
            const gameId = group.games[0];

            return {
                ...group,
                maleSpriteUrl: getGameSpecificShinySpriteUrl(heroVariant.id, gameId, {
                    name: heroVariant.name,
                    form: heroVariant.name,
                    gender: 'male',
                }) || getGameSpecificShinySpriteUrl(heroVariant.id, gameId, {
                    name: heroVariant.name,
                    form: heroVariant.name,
                }),
                femaleSpriteUrl: details.hasGenderDifference
                    ? getGameSpecificShinySpriteUrl(heroVariant.id, gameId, {
                        name: details.name,
                        form: details.name,
                        gender: 'female',
                    })
                    : null,
                caughtGames: caughtGamesForGroup,
            };
        }).filter(group => Boolean(group.maleSpriteUrl))
        : [];
    const collectibleVariants = variants.filter(variant => variant.category !== 'gender');
    const hasMultipleForms = collectibleVariants.length > 1;
    const panelClass = "border-border/70 bg-card/95 text-card-foreground shadow-[0_18px_42px_rgba(0,0,0,0.16)] backdrop-blur dark:border-white/15 dark:bg-[#171717]/95 dark:text-white dark:shadow-[0_18px_42px_rgba(0,0,0,0.42)]";

    return (
        <div
            className="min-h-screen bg-background text-foreground selection:bg-primary/20 transition-colors duration-1000"
            style={{
                backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}15 0%, transparent 70%)`
            }}
        >
            <Navbar />

            <main className="container mx-auto py-8 px-4 relative z-10 max-w-5xl">
                {/* Back Navigation */}
                <div className="flex items-center justify-between mb-12">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            if (location.state && typeof location.state === 'object' && 'fromPokedex' in location.state) {
                                navigate(-1);
                            } else {
                                navigate('/pokedex');
                            }
                        }}
                        className="group rounded-lg border border-border/70 bg-card/95 px-4 font-medium text-muted-foreground shadow-sm backdrop-blur hover:bg-muted hover:text-foreground dark:border-white/15 dark:bg-[#171717]/95"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Pokedex
                    </Button>

                    <div className="flex gap-3">
                    </div>
                </div>

                <div className="flex flex-col items-center text-center space-y-10">
                    {/* Centered Header */}
                    <section className="w-full max-w-3xl space-y-6">
                        <div className="flex flex-col items-center gap-4">
                            <h1 className="text-7xl md:text-8xl font-black tracking-tighter capitalize text-foreground drop-shadow-sm py-2">
                                {(overrides[`${details.id}-${details.name}`] as any)?.custom_display_name || details.displayName}
                            </h1>

                            {details.shinyAvailability && details.shinyAvailability !== 'ok' && (
                                <div
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-lg border bg-card/90 px-4 py-2 text-sm font-extrabold shadow-sm",
                                        details.shinyAvailability === 'unobtainable'
                                            ? "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-200"
                                            : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200"
                                    )}
                                    title={details.shinyAvailability === 'unobtainable'
                                        ? 'Shiny Locked'
                                        : 'No Own OT'
                                    }
                                >
                                    {details.shinyAvailability === 'unobtainable' ? (
                                        <>
                                            <Lock className="h-4 w-4" />
                                            <span>Shiny Locked</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserX className="h-4 w-4" />
                                            <span>No Own OT</span>
                                        </>
                                    )}
                                </div>
                            )}

                            {user && isEditorEnabled && (
                                <div className="flex items-center gap-2">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-lg border border-border/70 bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground dark:border-white/15 dark:bg-white/10"
                                                    onClick={() => {
                                                        const currentName = (overrides[`${details.id}-${details.name}`] as any)?.custom_display_name || details.displayName;
                                                        const newName = prompt("Personalizza nome display:", currentName);
                                                        if (newName !== null) {
                                                            saveOverride(details.id, details.name, { custom_display_name: newName });
                                                        }
                                                    }}
                                                >
                                                    <Edit3 className="h-5 w-5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Rename Pokémon</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => {
                                                        if (confirm(`Are you sure you want to remove ${details.displayName} from the Pokédex?`)) {
                                                            saveOverride(details.id, details.name, { is_excluded: true });
                                                            navigate('/pokedex');
                                                            toast({
                                                                title: "Pokémon deleted",
                                                                description: `${details.displayName} has been removed from view.`
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <EyeOff className="h-5 w-5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Remove from Pokédex</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            )}
                        </div>

                        {/* Generation Badge */}
                        <div className="flex justify-center flex-wrap gap-4">
                            <div className="flex items-center px-6 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Gen {details.generation}
                            </div>
                        </div>

                        {heroVariant && (
                            <div className={cn(
                                "mx-auto flex w-full items-center justify-center gap-3 px-4",
                                details.hasGenderDifference ? "max-w-xl flex-wrap sm:flex-nowrap" : "max-w-sm"
                            )}>
                                <img
                                    src={baseSpriteUrl}
                                    alt={heroVariant.displayName}
                                    className={cn(
                                        "h-48 w-48 object-contain pokemon-sprite transition-all duration-500 sm:h-56 sm:w-56",
                                        heroIsCaught ? "scale-105 drop-shadow-2xl" : "opacity-75 grayscale saturate-50"
                                    )}
                                />
                                {details.hasGenderDifference && femaleSpriteUrl && (
                                    <img
                                        src={femaleSpriteUrl}
                                        alt={`${details.displayName} female`}
                                        className={cn(
                                            "h-44 w-44 object-contain pokemon-sprite transition-all duration-500 sm:h-52 sm:w-52",
                                            heroIsCaught ? "scale-105 drop-shadow-2xl" : "opacity-75 grayscale saturate-50"
                                        )}
                                    />
                                )}
                            </div>
                        )}

                    </section>

                    {(availableGames.length > 0 || curatedGameIds) && (
                        <section className={cn("w-full space-y-5 rounded-lg border p-6", panelClass)}>
                            <div className="flex flex-col gap-3 border-b border-border pb-5 text-left sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight">
                                        <span className="h-7 w-2 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                                        Obtained in
                                    </h2>
                                    {availabilitySourceLinks.length > 0 && (
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            <span>Info: various sources</span>
                                            {availabilitySourceLinks.map(source => (
                                                <a
                                                    key={source.url}
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded-full border border-border/70 bg-background/80 px-2 py-1 text-card-foreground transition-colors hover:bg-muted hover:text-primary dark:border-white/15 dark:bg-white/10"
                                                    onClick={(event) => event.stopPropagation()}
                                                >
                                                    {source.label}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex w-fit items-center gap-2 rounded-lg border border-border/70 bg-background/80 px-4 py-2 text-sm font-bold text-card-foreground shadow-sm dark:border-white/15 dark:bg-white/10">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    <span className="text-foreground">{caughtGameCount}</span>
                                    <span className="text-muted-foreground">/</span>
                                    <span className="text-muted-foreground">{availableGames.length}</span>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {originFormNote && (
                                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-left text-sm font-medium text-muted-foreground">
                                        {originFormNote}
                                    </div>
                                )}
                                {availableGames.length === 0 && curatedGameIds && (
                                    <div className="rounded-lg border border-border/70 bg-background/80 p-4 text-sm font-bold text-muted-foreground dark:border-white/15 dark:bg-white/10">
                                        No valid console game is available for the shiny origin.
                                    </div>
                                )}

                                {gamesByGeneration.map(({ generation, games }) => (
                                    <div key={generation} className="space-y-3">
                                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/70">
                                            <span className="h-px flex-1 bg-border" />
                                            Gen {generation}
                                            <span className="h-px flex-1 bg-border" />
                                        </div>

                                        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                                            {games.map(game => (
                                                <div
                                                    key={game.id}
                                                    title={game.name}
                                                    className={cn(
                                                        "relative flex min-h-[112px] flex-col items-center justify-start gap-1.5 overflow-hidden rounded-xl border px-2.5 pb-2 pt-4 shadow-md transition-all duration-300",
                                                        game.isCaught
                                                            ? "scale-[1.01] border-2 text-white shadow-xl"
                                                            : "border-border/80 bg-gradient-to-b from-muted/85 to-card/95 text-foreground opacity-95 hover:from-muted hover:to-background dark:from-muted/45 dark:to-card/95"
                                                    )}
                                                    style={{
                                                        borderColor: game.isCaught
                                                            ? game.id === acquisitionInfo?.transferGameId && acquisitionInfo.originGameId !== game.id
                                                                ? `color-mix(in srgb, ${getGameTheme(acquisitionInfo.originGameId).accent} 50%, ${game.theme.accent} 50%)`
                                                                : `color-mix(in srgb, ${game.theme.accent} 82%, white 18%)`
                                                            : undefined,
                                                        background: game.isCaught
                                                            ? game.id === acquisitionInfo?.transferGameId && acquisitionInfo.originGameId !== game.id
                                                                ? `radial-gradient(120% 140% at 14% 18%, color-mix(in srgb, ${getGameTheme(acquisitionInfo.originGameId).accent} 68%, transparent) 0%, transparent 44%), radial-gradient(120% 140% at 86% 22%, color-mix(in srgb, ${game.theme.accent} 68%, transparent) 0%, transparent 46%), radial-gradient(150% 120% at 18% 78%, color-mix(in srgb, ${getGameTheme(acquisitionInfo.originGameId).primary} 72%, #111) 0%, transparent 52%), radial-gradient(150% 120% at 82% 82%, color-mix(in srgb, ${game.theme.primary} 72%, #111) 0%, transparent 52%), linear-gradient(135deg, color-mix(in srgb, ${getGameTheme(acquisitionInfo.originGameId).secondary} 72%, #090909) 0%, color-mix(in srgb, #111 52%, ${getGameTheme(acquisitionInfo.originGameId).primary}) 38%, color-mix(in srgb, #111 48%, ${game.theme.primary}) 62%, color-mix(in srgb, ${game.theme.secondary} 72%, #090909) 100%)`
                                                                : `linear-gradient(160deg, color-mix(in srgb, ${game.theme.primary} 72%, black 28%) 0%, color-mix(in srgb, ${game.theme.secondary} 58%, black 42%) 62%, color-mix(in srgb, ${game.theme.accent} 42%, black 58%) 100%)`
                                                            : undefined,
                                                        boxShadow: game.isCaught
                                                            ? `inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -18px 30px rgba(0,0,0,0.22), 0 14px 32px ${game.theme.primary}45`
                                                            : undefined
                                                    }}
                                                >
                                                    {game.isCaught && game.id === acquisitionInfo?.transferGameId && (
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute left-1.5 top-1.5 z-10 h-5 w-5 rounded-full bg-black/20 p-0 text-white/75 hover:bg-black/35 hover:text-white"
                                                                    aria-label="Acquisition information"
                                                                    title="Acquisition information"
                                                                >
                                                                    <Info className="h-3 w-3" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-56 space-y-2 p-3 text-xs" align="start">
                                                                <div className="font-black uppercase tracking-[0.12em] text-muted-foreground">Acquisition info</div>
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <span className="text-muted-foreground">Source Pokémon</span>
                                                                    <span className="text-right font-bold">{acquisitionInfo.sourcePokemonName}</span>
                                                                </div>
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <span className="text-muted-foreground">Origin game</span>
                                                                    <span className="text-right font-bold">{acquisitionInfo.originGameName}</span>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )}
                                                    {game.isCaught && (
                                                        <div
                                                            className="absolute inset-x-4 top-1 h-1 rounded-full opacity-95"
                                                            style={{
                                                                backgroundImage: `linear-gradient(90deg, transparent, ${game.theme.accent}, transparent)`,
                                                                boxShadow: `0 0 12px ${game.theme.accent}`
                                                            }}
                                                        />
                                                    )}

                                                    <div className="flex h-[62px] w-full flex-col items-center justify-center gap-2">
                                                        <img
                                                            src={game.logo}
                                                            alt={game.name}
                                                            loading="lazy"
                                                            className={cn(
                                                                "h-7 w-full object-contain transition-all duration-300 sm:h-8",
                                                                game.isCaught
                                                                    ? "opacity-100 saturate-150 brightness-110 drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]"
                                                                    : "opacity-55 grayscale saturate-0"
                                                            )}
                                                        />

                                                        <span
                                                            className={cn(
                                                                "flex min-h-[1.35rem] max-w-full items-center text-center text-[10px] font-black uppercase leading-[1.05] tracking-wide",
                                                                game.isCaught
                                                                    ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                                                                    : "text-foreground/80"
                                                            )}
                                                        >
                                                            {game.name}
                                                        </span>
                                                    </div>

                                                    {game.isCaught && (
                                                        <span
                                                            className="absolute right-2 top-2 rounded-full p-0.5"
                                                            style={{
                                                                backgroundColor: 'rgba(0,0,0,0.35)',
                                                                boxShadow: `0 0 10px ${game.theme.accent}`
                                                            }}
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
                                                        </span>
                                                    )}
                                                    {details.hasGenderDifference && game.isCaught && (
                                                        <span className="flex h-5 items-center gap-1 rounded-full border border-white/15 bg-black/40 px-1.5 py-0.5 text-[12px] font-black leading-none shadow-sm backdrop-blur-sm">
                                                            <span
                                                                className={cn(
                                                                    "transition-all",
                                                                    caughtGameGenders[game.id]?.includes('male')
                                                                        ? "text-blue-200 drop-shadow-[0_0_5px_rgba(147,197,253,0.95)]"
                                                                        : "text-white/25"
                                                                )}
                                                                title="Male"
                                                            >
                                                                ♂
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    "transition-all",
                                                                    caughtGameGenders[game.id]?.includes('female')
                                                                        ? "text-pink-200 drop-shadow-[0_0_5px_rgba(251,207,232,0.95)]"
                                                                        : "text-white/25"
                                                                )}
                                                                title="Female"
                                                            >
                                                                ♀
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {gameSpriteGroups.length > 0 && (
                        <section className={cn("w-full space-y-5 rounded-lg border p-6", panelClass)}>
                            <div className="border-b border-border pb-4 text-left">
                                <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight">
                                    <span className="h-7 w-2 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                                    Game sprites
                                </h2>
                                <p className="mt-1 text-sm font-medium text-muted-foreground">
                                    Original animated shiny sprites from each supported game set.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                {gameSpriteGroups.map(group => (
                                    <div
                                        key={group.id}
                                        className={cn(
                                            "relative flex flex-col items-center overflow-hidden rounded-xl border p-5 transition-all",
                                            group.caughtGames.length > 0
                                                ? "border-amber-300/70 bg-gradient-to-br from-amber-500/15 via-card to-slate-400/15 shadow-lg"
                                                : "border-border bg-muted/35"
                                        )}
                                    >
                                        <p className="text-center text-sm font-black">{group.label}</p>
                                        <p className="mt-1 min-h-10 text-center text-xs text-muted-foreground">{group.description}</p>
                                        <div className={cn(
                                            "mt-2 flex items-center justify-center gap-2",
                                            details.hasGenderDifference ? "w-full" : "w-auto"
                                        )}>
                                            <img
                                                src={group.maleSpriteUrl!}
                                                alt={`${heroVariant?.displayName || details.displayName} male shiny in ${group.label}`}
                                                loading="lazy"
                                                decoding="async"
                                                className={cn(
                                                    "h-32 w-32 object-contain pokemon-sprite scale-[0.9] [image-rendering:pixelated]",
                                                    group.caughtGames.length === 0 && "opacity-35 grayscale"
                                                )}
                                            />
                                            {details.hasGenderDifference && group.femaleSpriteUrl && (
                                                <img
                                                    src={group.femaleSpriteUrl}
                                                    alt={`${details.displayName} female shiny in ${group.label}`}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className={cn(
                                                        "h-32 w-32 object-contain pokemon-sprite scale-[0.9] [image-rendering:pixelated]",
                                                        group.caughtGames.length === 0 && "opacity-35 grayscale"
                                                    )}
                                                />
                                            )}
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                                            {group.games.map(gameId => {
                                                const caught = caughtGames.has(gameId);
                                                const game = GAMES.find(item => item.id === gameId)!;
                                                return (
                                                    <div key={gameId} className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1", caught ? "border-primary/50 bg-primary/10" : "border-border bg-background/60 opacity-45")}>
                                                        <img src={GAME_LOGOS[gameId]} alt="" className={cn("h-4 w-8 object-contain", !caught && "grayscale")} />
                                                        <span className="text-[10px] font-black uppercase tracking-wide">{game.name}</span>
                                                        {caught && <CheckCircle2 className="h-3 w-3 text-primary" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                </div>
                        </section>
                    )}

                    {/* Form Collection Section - Main Focus */}
                    {hasMultipleForms && (
                    <div className={cn("w-full space-y-8 rounded-lg border p-6", panelClass)}>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/80">
                            <div className="text-left">
                                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                    <span className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                                    Form Collection
                                </h2>
                                <p className="text-muted-foreground mt-1 font-medium">View and mark the shiny variants you have caught.</p>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/80 px-5 py-2.5 text-card-foreground shadow-inner dark:border-white/15 dark:bg-white/10">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="text-sm font-bold text-foreground">
                                    {caughtForms.size} <span className="text-muted-foreground mx-1">/</span> {collectibleVariants.length}
                                </span>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-2">complete</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {collectibleVariants.map(variant => {
                                const isCaught = caughtForms.has(variant.name);
                                const isLoading = actionLoading === variant.name;
                                const caughtCardColor = `color-mix(in srgb, ${accentColor} 52%, hsl(var(--card)) 48%)`;

                                return (
                                    <button
                                        key={variant.name}
                                        onClick={() => toggleCaught(variant)}
                                        className={cn(
                                            "group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-border/80 p-4 text-card-foreground shadow-md transition-all duration-500 transform active:scale-95",
                                            isCaught
                                                ? "border-2"
                                                : "bg-gradient-to-b from-muted/85 to-card/95 hover:from-muted hover:to-background dark:from-muted/45 dark:to-card/95"
                                        )}
                                        style={{
                                            borderColor: isCaught ? accentColor : undefined,
                                            background: isCaught ? caughtCardColor : undefined,
                                        }}
                                    >
                                        <div className="relative z-10 mb-3 flex aspect-square w-full items-center justify-center rounded-lg">
                                            <img
                                                src={variant.spriteUrl}
                                                alt={variant.displayName}
                                                className={cn(
                                                    "w-full h-full object-contain pokemon-sprite transition-all duration-500",
                                                    isCaught ? "scale-110 drop-shadow-lg" : "opacity-45 grayscale saturate-0 group-hover:opacity-100 group-hover:grayscale-0 group-hover:saturate-100"
                                                )}
                                            />

                                            {isCaught && (
                                                <div
                                                    className="absolute -top-2 -right-2 p-1.5 rounded-full shadow-lg z-30 animate-in zoom-in-50 duration-300"
                                                    style={{
                                                        backgroundImage: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 92%, white 8%), color-mix(in srgb, ${accentColor} 74%, black 26%))`,
                                                        boxShadow: `0 0 14px ${accentColor}70`
                                                    }}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]" />
                                                </div>
                                            )}
                                            {isLoading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-card/70 backdrop-blur-sm rounded-lg z-30">
                                                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-center w-full relative z-10 space-y-1">
                                            <div className={cn(
                                                "text-xs font-black uppercase tracking-widest transition-colors drop-shadow-[0_1px_1px_rgba(0,0,0,0.28)]",
                                                isCaught ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                                            )}>
                                                {(overrides[`${variant.id}-${variant.name}`] as any)?.custom_display_name || variant.displayName}
                                            </div>
                                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                                {variant.category}
                                            </div>
                                        </div>

                                        {/* In-card administrative controls */}
                                        {user && isEditorEnabled && (
                                            <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg border border-border bg-card/90 text-muted-foreground shadow-sm hover:bg-muted hover:text-primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const currentName = (overrides[`${variant.id}-${variant.name}`] as any)?.custom_display_name || variant.displayName;
                                                        const newName = prompt(`Rename form "${variant.displayName}":`, currentName);
                                                        if (newName !== null) {
                                                            saveOverride(variant.id, variant.name, { custom_display_name: newName });
                                                        }
                                                    }}
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg border border-border bg-card/90 text-muted-foreground shadow-sm hover:bg-muted hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm(`Remove the ${variant.displayName} form?`)) {
                                                            saveOverride(variant.id, variant.name, { is_excluded: true });
                                                            toast({ title: "Form removed", description: `${variant.displayName} was removed.` });
                                                        }
                                                    }}
                                                >
                                                    <EyeOff className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}

                                        {!user && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-card/70 backdrop-blur-sm rounded-lg z-20">
                                                <Lock className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    )}
                </div>
            </main>
        </div>
    );
}
