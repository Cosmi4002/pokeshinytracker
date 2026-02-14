import { useParams, useNavigate } from "react-router-dom";
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
    Edit3,
    EyeOff,
    Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { isFormEliminated, POKEMON_DATA_OVERRIDES } from "@/lib/form-filters";
import { usePokedexOverrides } from "@/hooks/use-pokedex-overrides";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FormVariant {
    id: number;
    name: string;
    displayName: string;
    category: 'base' | 'regional' | 'seasonal' | 'form' | 'gender';
    gender: 'male' | 'female' | 'genderless';
    spriteUrl: string;
}

export default function PokemonDetails() {
    const { pokemonId } = useParams();
    const navigate = useNavigate();
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

    const getTypeIconUrl = (type: string) => `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type.toLowerCase()}.svg`;


    const [caughtForms, setCaughtForms] = useState<Set<string>>(new Set());
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Fetch caught status
    useEffect(() => {
        if (user && pokemonId) {
            fetchCaughtStatus();
        }
    }, [user, pokemonId, details]);

    const fetchCaughtStatus = async () => {
        if (!user || !details) return;
        try {
            // Fetch all IDs present in our variants list
            const variantIds = Array.from(new Set(variants.map(v => v.id)));

            const { data, error } = await supabase
                .from('caught_shinies')
                .select('pokemon_id, gender, form')
                .eq('user_id', user.id)
                .in('pokemon_id', variantIds);

            if (error) throw error;

            const caughtSet = new Set<string>();
            data?.forEach(row => {
                // Priority 1: Exact form name match (new standard)
                if (row.form) {
                    caughtSet.add(row.form);
                } else {
                    // Priority 2: Legacy fallback using ID and gender
                    const g = row.gender || 'genderless';
                    let matchedVariant = variants.find(v => v.id === row.pokemon_id && v.gender === g);

                    // Second-chance fallback for base forms (often saved as genderless)
                    if (!matchedVariant && g === 'genderless') {
                        matchedVariant = variants.find(v => v.id === row.pokemon_id && v.category === 'base');
                    }

                    if (matchedVariant) {
                        caughtSet.add(matchedVariant.name);
                    }
                }
            });
            setCaughtForms(caughtSet);
        } catch (err) {
            console.error("Error fetching caught status:", err);
        }
    };

    // Flatten all variants from the hook data
    const variants = useMemo((): FormVariant[] => {
        if (!details) return [];
        const items: FormVariant[] = [];

        // Base/Male
        items.push({
            id: details.id,
            name: details.name,
            displayName: details.hasGenderDifference ? 'Maschio' : details.displayName,
            category: 'base',
            gender: 'male',
            spriteUrl: details.sprites.shiny
        });

        // Female diff
        if (details.hasGenderDifference && details.sprites.femaleShiny) {
            items.push({
                id: details.id,
                name: `${details.name}-female`,
                displayName: 'Femmina',
                category: 'gender',
                gender: 'female',
                spriteUrl: details.sprites.femaleShiny
            });
        }

        // Add Forms (avoid redundant ones)
        details.forms.forEach(f => {
            if (f.formName === details.name) return;

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
                spriteUrl: f.sprites.shiny
            });
        });

        // Add Varieties (Regionals usually)
        details.varieties.forEach(v => {
            if (v.isDefault) return;

            const isExcluded = isFormEliminated(v.pokemon.name) || (overrides[`${v.pokemon.id}-${v.pokemon.name}`] as any)?.is_excluded;
            if (isExcluded) return;

            if (items.some(i => i.id === v.pokemon.id)) return;

            let category: FormVariant['category'] = 'regional';
            items.push({
                id: v.pokemon.id,
                name: v.pokemon.name,
                displayName: v.pokemon.name,
                category,
                gender: 'genderless',
                spriteUrl: v.pokemon.spriteUrl
            });
        });

        return items;
    }, [details]);

    const toggleCaught = async (variant: FormVariant) => {
        if (!user) {
            toast({
                title: "Accesso richiesto",
                description: "Effettua il login per salvare la tua collezione.",
                variant: "destructive"
            });
            return;
        }

        const key = variant.name;
        const isCaught = caughtForms.has(key);
        setActionLoading(key);

        try {
            if (isCaught) {
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
            } else {
                const { error } = await supabase
                    .from('caught_shinies')
                    .insert({
                        user_id: user.id,
                        pokemon_id: variant.id,
                        pokemon_name: variant.displayName,
                        gender: variant.gender,
                        form: variant.name,
                        sprite_url: variant.spriteUrl,
                        shiny_type: 'star',
                        method: 'unknown',
                        game: 'unknown',
                        pokeball: 'pokeball',
                        caught_date: new Date().toISOString()
                    });
                if (error) throw error;

                const next = new Set(caughtForms);
                next.add(key);
                setCaughtForms(next);
            }
        } catch (err: any) {
            toast({ title: "Errore", description: err.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
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

    const currentId = details.id;
    const prevId = currentId > 1 && currentId < 10000 ? currentId - 1 : null;
    const nextId = currentId < 1025 ? currentId + 1 : null;

    const TYPE_COLORS: Record<string, string> = {
        normal: "#A8A77A",
        fire: "#EE8130",
        water: "#6390F0",
        electric: "#F7D02C",
        grass: "#7AC74C",
        ice: "#96D9D6",
        fighting: "#C22E28",
        poison: "#A33EA1",
        ground: "#E2BF65",
        flying: "#A98FF3",
        psychic: "#F95587",
        bug: "#A6B91A",
        rock: "#B6A136",
        ghost: "#735797",
        dragon: "#6F35FC",
        dark: "#705746",
        steel: "#B7B7CE",
        fairy: "#D685AD",
    };

    return (
        <div className="min-h-screen bg-background selection:bg-primary/20">
            {/* Ambient Background */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.05] transition-colors duration-1000"
                style={{
                    background: `radial-gradient(circle at 50% 20%, ${accentColor} 0%, transparent 60%)`
                }}
            />

            <Navbar />

            <main className="container mx-auto py-8 px-4 relative z-10 max-w-5xl">
                {/* Back Navigation */}
                <div className="flex items-center justify-between mb-12">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/pokedex')}
                        className="group text-muted-foreground hover:text-foreground font-medium bg-white/5 hover:bg-white/10 rounded-xl px-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Pokedex
                    </Button>

                    <div className="flex gap-3">
                    </div>
                </div>

                <div className="flex flex-col items-center text-center space-y-10">
                    {/* Centered Header */}
                    <div className="space-y-6 w-full max-w-3xl">
                        <div className="flex flex-col items-center gap-4">
                            <h1 className="text-7xl md:text-8xl font-black tracking-tighter capitalize bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/30 drop-shadow-2xl py-2">
                                {(overrides[`${details.id}-${details.name}`] as any)?.custom_display_name || details.displayName}
                            </h1>

                            {user && isEditorEnabled && (
                                <div className="flex items-center gap-2">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-white/5"
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
                                            <TooltipContent>Rinomina Pokémon</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => {
                                                        if (confirm(`Sei sicuro di voler eliminare ${details.displayName} dal Pokédex?`)) {
                                                            saveOverride(details.id, details.name, { is_excluded: true });
                                                            navigate('/pokedex');
                                                            toast({
                                                                title: "Pokemon eliminato",
                                                                description: `${details.displayName} è stato rimosso dalla visualizzazione.`
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <EyeOff className="h-5 w-5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Elimina dal Pokédex</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            )}
                        </div>

                        {/* Official-style Type Badges */}
                        <div className="flex justify-center flex-wrap gap-4">
                            {details.types.map(type => (
                                <div
                                    key={type}
                                    style={{ backgroundColor: TYPE_COLORS[type.toLowerCase()] || '#777' }}
                                    className="px-6 py-2 rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center gap-3 transition-transform hover:scale-105 border border-white/20"
                                >
                                    <div className="w-5 h-5 flex items-center justify-center brightness-0 invert opacity-90">
                                        <img
                                            src={getTypeIconUrl(type)}
                                            alt=""
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <span className="text-sm font-black text-white uppercase tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                                        {type}
                                    </span>
                                </div>
                            ))}
                            <div className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center">
                                Gen {details.generation}
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-widest"
                                onClick={() => window.open(`https://www.serebii.net/pokedex-sv/${details.name.toLowerCase()}`, '_blank')}
                            >
                                Info Serebii
                            </Button>
                        </div>
                    </div>

                    {/* Form Collection Section - Main Focus */}
                    <div className="w-full space-y-8 pt-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
                            <div className="text-left">
                                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                    <span className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                                    Collezione Forme
                                </h2>
                                <p className="text-muted-foreground mt-1 font-medium">Visualizza e segna le varianti cromatiche catturate.</p>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="text-sm font-bold text-foreground">
                                    {caughtForms.size} <span className="text-muted-foreground mx-1">/</span> {variants.length}
                                </span>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-2">completato</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {variants.map(variant => {
                                const isCaught = caughtForms.has(variant.name);
                                const isLoading = actionLoading === variant.name;

                                return (
                                    <button
                                        key={variant.name}
                                        onClick={() => toggleCaught(variant)}
                                        className={cn(
                                            "group relative flex flex-col items-center justify-center p-4 rounded-[1.5rem] transition-all duration-500 transform active:scale-95",
                                            isCaught
                                                ? "bg-white/5 border-2 shadow-lg"
                                                : "bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                                        )}
                                        style={{
                                            borderColor: isCaught ? accentColor : undefined,
                                            boxShadow: isCaught ? `0 0 20px ${accentColor}40` : undefined
                                        }}
                                    >
                                        <div className="relative w-full aspect-square mb-3 flex items-center justify-center">
                                            <img
                                                src={variant.spriteUrl}
                                                alt={variant.displayName}
                                                className={cn(
                                                    "w-full h-full object-contain pokemon-sprite transition-all duration-500",
                                                    isCaught ? "scale-110 drop-shadow-lg" : "brightness-[0.3] grayscale group-hover:brightness-100 group-hover:grayscale-0"
                                                )}
                                            />

                                            {isCaught && (
                                                <div
                                                    className="absolute -top-2 -right-2 p-1.5 rounded-full shadow-lg z-30 animate-in zoom-in-50 duration-300"
                                                    style={{ backgroundColor: accentColor }}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 text-white font-bold" />
                                                </div>
                                            )}
                                            {isLoading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-full z-30">
                                                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-center w-full relative z-10 space-y-1">
                                            <div className={cn(
                                                "text-xs font-black uppercase tracking-widest transition-colors",
                                                isCaught ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                            )}>
                                                {(overrides[`${variant.id}-${variant.name}`] as any)?.custom_display_name || variant.displayName}
                                            </div>
                                            <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
                                                {variant.category}
                                            </div>
                                        </div>

                                        {/* In-card elimination toggle */}
                                        {user && isEditorEnabled && (
                                            <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg bg-black/20 hover:bg-destructive/20 text-white/50 hover:text-destructive backdrop-blur-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm(`Eliminare la forma ${variant.displayName}?`)) {
                                                            saveOverride(variant.id, variant.name, { is_excluded: true });
                                                            toast({ title: "Forma eliminata", description: `${variant.displayName} rimossa.` });
                                                        }
                                                    }}
                                                >
                                                    <EyeOff className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}

                                        {!user && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/40 backdrop-blur-sm rounded-[2rem] z-20">
                                                <Lock className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

