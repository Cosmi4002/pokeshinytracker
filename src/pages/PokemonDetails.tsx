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
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    CheckCircle2,
    Lock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
    const { user } = useAuth();
    const { toast } = useToast();
    const { accentColor } = useRandomColor();

    const [caughtForms, setCaughtForms] = useState<Set<string>>(new Set());
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Fetch caught status
    useEffect(() => {
        if (user && pokemonId) {
            fetchCaughtStatus();
        }
    }, [user, pokemonId, details]);

    const fetchCaughtStatus = async () => {
        if (!user || !pokemonId) return;
        try {
            const { data, error } = await supabase
                .from('caught_shinies')
                .select('pokemon_id, gender, form')
                .eq('user_id', user.id)
                .eq('pokemon_id', Number(pokemonId));

            if (error) throw error;

            const caughtSet = new Set<string>();
            data?.forEach(row => {
                const key = row.form || `${row.pokemon_id}-${row.gender || 'genderless'}`;
                caughtSet.add(key);
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
            displayName: details.hasGenderDifference ? 'Maschio' : 'Standard',
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
            if (f.formName.includes('-normal') || f.formName.includes('-standard')) return;

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
            if (items.some(i => i.id === v.pokemon.id)) return;

            let category: FormVariant['category'] = 'regional';
            items.push({
                id: v.pokemon.id,
                name: v.pokemon.name,
                displayName: v.pokemon.name, // Will be formatted by hook ideally or CSS
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

    return (
        <div className="min-h-screen bg-background selection:bg-primary/20">
            {/* Ambient Background */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03] transition-colors duration-1000"
                style={{
                    background: `radial-gradient(circle at 50% -20%, ${accentColor} 0%, transparent 70%)`
                }}
            />

            <Navbar />

            <main className="container mx-auto py-8 px-4 relative z-10">
                {/* Back & Navigation Header */}
                <div className="flex items-center justify-between mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/pokedex')}
                        className="group text-muted-foreground hover:text-foreground font-medium"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Pokedex
                    </Button>

                    <div className="flex gap-2">
                        {prevId && (
                            <Button variant="outline" size="icon" onClick={() => navigate(`/pokedex/${prevId}`)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        )}
                        {nextId && (
                            <Button variant="outline" size="icon" onClick={() => navigate(`/pokedex/${nextId}`)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Visuals */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="relative aspect-square rounded-[2rem] bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center group overflow-hidden shadow-2xl">
                            {/* Decorative elements */}
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/10 rounded-full blur-[100px] opacity-20 pointer-events-none" />

                            <img
                                src={details.sprites.shiny}
                                alt={details.displayName}
                                className="w-[85%] h-[85%] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform transition-all duration-700 group-hover:scale-110 group-hover:rotate-2 relative z-10"
                            />

                            <Badge className="absolute top-6 right-6 px-4 py-1.5 bg-primary/20 backdrop-blur-md text-primary-foreground border-primary/30 flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5 fill-current" />
                                Shiny
                            </Badge>

                            <div className="absolute bottom-6 left-6 text-5xl font-black text-white/5 select-none uppercase tracking-tighter">
                                #{String(details.id).padStart(4, '0')}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                className="w-full h-14 text-lg font-bold rounded-2xl group relative overflow-hidden active:scale-[0.98] transition-transform"
                                onClick={() => navigate(`/counter?pokemon=${encodeURIComponent(details.name)}`)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative flex items-center justify-center gap-2">
                                    <ExternalLink className="h-5 w-5" />
                                    Avvia Caccia
                                </span>
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full h-14 text-lg font-semibold rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm"
                                onClick={() => window.open(`https://www.serebii.net/pokedex-sv/${details.name.toLowerCase()}`, '_blank')}
                            >
                                <span className="flex items-center gap-2">
                                    Info Serebii
                                </span>
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Info & Variants */}
                    <div className="lg:col-span-7 space-y-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <h1 className="text-5xl md:text-6xl font-black tracking-tight capitalize bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                                    {details.displayName}
                                </h1>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {details.types.map(type => (
                                    <Badge
                                        key={type}
                                        variant="secondary"
                                        className={cn(
                                            "px-5 py-2 text-sm font-bold rounded-full uppercase tracking-wider backdrop-blur-xl border border-white/10 shadow-lg",
                                            `type-${type.toLowerCase()}`
                                        )}
                                    >
                                        {type}
                                    </Badge>
                                ))}
                                <Badge variant="outline" className="px-5 py-2 text-sm font-semibold rounded-full border-white/10 text-muted-foreground uppercase">
                                    Gen {details.generation}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <span className="w-2 h-8 bg-primary rounded-full" />
                                    Collezione Forme
                                </h2>
                                <span className="text-sm font-medium text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                    {caughtForms.size} / {variants.length} completato
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                {variants.map(variant => {
                                    const isCaught = caughtForms.has(variant.name);
                                    const isLoading = actionLoading === variant.name;

                                    return (
                                        <button
                                            key={variant.name}
                                            disabled={isLoading}
                                            onClick={() => toggleCaught(variant)}
                                            className={cn(
                                                "group relative flex flex-col items-center justify-center p-4 rounded-[1.5rem] transition-all duration-500 transform active:scale-95",
                                                "border outline-none focus:ring-2 ring-primary/40 focus:ring-offset-4 ring-offset-background",
                                                isCaught
                                                    ? "bg-primary/5 border-primary/30 shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)]"
                                                    : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                                            )}
                                        >
                                            <div className="relative w-full aspect-square mb-3 flex items-center justify-center">
                                                <img
                                                    src={variant.spriteUrl}
                                                    alt={variant.displayName}
                                                    className={cn(
                                                        "w-full h-full object-contain transition-all duration-700",
                                                        isCaught ? "drop-shadow-[0_10px_20px_rgba(var(--primary),0.2)]" : "opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0"
                                                    )}
                                                />
                                                {isCaught && (
                                                    <div className="absolute top-0 right-0 p-1 bg-primary rounded-full shadow-lg transform translate-x-1/4 -translate-y-1/4 animate-in zoom-in-50 duration-300">
                                                        <CheckCircle2 className="w-4 h-4 text-primary-foreground font-bold" />
                                                    </div>
                                                )}
                                                {isLoading && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-full">
                                                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-center w-full">
                                                <div className={cn(
                                                    "text-sm font-bold truncate transition-colors",
                                                    isCaught ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                                )}>
                                                    {variant.displayName}
                                                </div>
                                                <div className="text-[10px] font-medium opacity-50 uppercase tracking-widest mt-0.5">
                                                    {variant.category}
                                                </div>
                                            </div>

                                            {!user && (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/60 backdrop-blur-[1px] rounded-[1.5rem]">
                                                    <Lock className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
