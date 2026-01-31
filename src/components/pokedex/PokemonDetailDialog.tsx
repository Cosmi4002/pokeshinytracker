import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePokemonDetails, PokemonBasic } from "@/hooks/use-pokemon";
import { ShinyButton } from "./ShinyButton";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PokemonDetailDialogProps {
    pokemon: PokemonBasic | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Type for all form variants we'll display
interface FormVariant {
    id: number;
    name: string;
    displayName: string;
    category: 'base' | 'regional' | 'mega' | 'gmax' | 'seasonal' | 'form' | 'gender';
    gender: 'male' | 'female' | 'genderless';
    spriteUrl: string;
}

// Seasonal forms mapping
const SEASONAL_POKEMON: Record<number, { variants: string[]; baseFormName: string }> = {
    585: { variants: ['spring', 'summer', 'autumn', 'winter'], baseFormName: 'deerling' }, // Deerling
    586: { variants: ['spring', 'summer', 'autumn', 'winter'], baseFormName: 'sawsbuck' }, // Sawsbuck
    412: { variants: ['plant', 'sandy', 'trash'], baseFormName: 'burmy' }, // Burmy
    413: { variants: ['plant', 'sandy', 'trash'], baseFormName: 'wormadam' }, // Wormadam
    422: { variants: ['west', 'east'], baseFormName: 'shellos' }, // Shellos
    423: { variants: ['west', 'east'], baseFormName: 'gastrodon' }, // Gastrodon
    479: { variants: ['heat', 'wash', 'frost', 'fan', 'mow'], baseFormName: 'rotom' }, // Rotom
    550: { variants: ['red-striped', 'blue-striped', 'white-striped'], baseFormName: 'basculin' }, // Basculin
    666: { variants: ['meadow', 'icy-snow', 'polar', 'tundra', 'continental', 'garden', 'elegant', 'modern', 'marine', 'archipelago', 'high-plains', 'sandstorm', 'river', 'monsoon', 'savanna', 'sun', 'ocean', 'jungle', 'fancy', 'pokeball'], baseFormName: 'vivillon' }, // Vivillon
    669: { variants: ['red', 'yellow', 'orange', 'blue', 'white'], baseFormName: 'flabebe' }, // Flabébé
    670: { variants: ['red', 'yellow', 'orange', 'blue', 'white'], baseFormName: 'floette' }, // Floette
    671: { variants: ['red', 'yellow', 'orange', 'blue', 'white'], baseFormName: 'florges' }, // Florges
    710: { variants: ['small', 'average', 'large', 'super'], baseFormName: 'pumpkaboo' }, // Pumpkaboo
    711: { variants: ['small', 'average', 'large', 'super'], baseFormName: 'gourgeist' }, // Gourgeist
    741: { variants: ['baile', 'pom-pom', 'pau', 'sensu'], baseFormName: 'oricorio' }, // Oricorio
    774: { variants: ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'], baseFormName: 'minior' }, // Minior
    898: { variants: ['ice', 'shadow'], baseFormName: 'calyrex' }, // Calyrex
};

export function PokemonDetailDialog({ pokemon, open, onOpenChange }: PokemonDetailDialogProps) {
    const { pokemon: details, loading: detailsLoading } = usePokemonDetails(pokemon?.id || null);
    const { user } = useAuth();
    const { toast } = useToast();
    const [caughtForms, setCaughtForms] = useState<Set<string>>(new Set());
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (user && pokemon && open) {
            fetchCaughtStatus();
        }
    }, [user, pokemon, open, details]);

    const fetchCaughtStatus = async () => {
        if (!user || !pokemon) return;

        try {
            const { data, error } = await supabase
                .from('caught_shinies')
                .select('pokemon_id, gender, pokemon_name, form')
                .eq('user_id', user.id)
                .or(`pokemon_id.eq.${pokemon.id},pokemon_name.ilike.${pokemon.name}%`);

            if (error) throw error;

            if (data) {
                const caughtSet = new Set<string>();
                data.forEach(row => {
                    // Use form if available, otherwise use pokemon_id + gender
                    const formKey = row.form || `${row.pokemon_id}-${row.gender || 'genderless'}`;
                    caughtSet.add(formKey);
                    // Also add the standard key format
                    caughtSet.add(`${row.pokemon_id}-${row.gender || 'genderless'}`);
                });
                setCaughtForms(caughtSet);
            }
        } catch (err) {
            console.error("Error fetching status:", err);
        }
    };

    // Build all form variants
    const allVariants = useMemo((): FormVariant[] => {
        if (!details) return [];

        const variants: FormVariant[] = [];
        const pokemonId = details.id;

        // Base Male/Default
        variants.push({
            id: pokemonId,
            name: details.name,
            displayName: details.hasGenderDifference ? 'Maschio' : 'Default',
            category: details.hasGenderDifference ? 'gender' : 'base',
            gender: details.hasGenderDifference ? 'male' : 'genderless',
            spriteUrl: details.sprites.shiny,
        });

        // Female variant
        if (details.hasGenderDifference && details.sprites.femaleShiny) {
            variants.push({
                id: pokemonId,
                name: `${details.name}-female`,
                displayName: 'Femmina',
                category: 'gender',
                gender: 'female',
                spriteUrl: details.sprites.femaleShiny,
            });
        }

        // Check for seasonal forms
        if (SEASONAL_POKEMON[pokemonId]) {
            const seasonal = SEASONAL_POKEMON[pokemonId];
            seasonal.variants.forEach(variant => {
                const formName = `${seasonal.baseFormName}-${variant}`;
                variants.push({
                    id: pokemonId,
                    name: formName,
                    displayName: variant.charAt(0).toUpperCase() + variant.slice(1).replace('-', ' '),
                    category: 'seasonal',
                    gender: 'genderless',
                    spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemonId}.png`, // Default sprite, API may have form-specific
                });
            });
        }

        // Add forms from species varieties (regional, mega, gmax, etc.)
        details.forms.forEach(form => {
            const name = form.formName.toLowerCase();
            let category: FormVariant['category'] = 'form';

            if (name.includes('alola') || name.includes('galar') || name.includes('hisui') || name.includes('paldea')) {
                category = 'regional';
            } else if (name.includes('mega')) {
                category = 'mega';
            } else if (name.includes('gmax')) {
                category = 'gmax';
            }

            variants.push({
                id: form.id,
                name: form.formName,
                displayName: form.displayName,
                category,
                gender: 'genderless',
                spriteUrl: form.sprites.shiny,
            });
        });

        return variants;
    }, [details]);

    // Group variants by category
    const groupedVariants = useMemo(() => {
        const groups: Record<string, FormVariant[]> = {
            base: [],
            gender: [],
            regional: [],
            seasonal: [],
            mega: [],
            gmax: [],
            form: [],
        };

        allVariants.forEach(v => {
            if (v.category === 'base' || v.category === 'gender') {
                groups.base.push(v);
            } else {
                groups[v.category].push(v);
            }
        });

        return groups;
    }, [allVariants]);

    // Category labels
    const categoryLabels: Record<string, string> = {
        base: '🔹 Forme Base',
        regional: '🌍 Forme Regionali',
        seasonal: '🍂 Forme Stagionali',
        mega: '⚡ Mega Evoluzioni',
        gmax: '🌟 Gigantamax',
        form: '🔄 Altre Forme',
    };

    const toggleCaught = async (variant: FormVariant) => {
        if (!user) {
            toast({ title: "Login richiesto", description: "Effettua il login per salvare la collezione.", variant: "destructive" });
            return;
        }

        const key = `${variant.id}-${variant.gender}`;
        const isCaught = caughtForms.has(key);
        setLoadingAction(key);

        try {
            if (isCaught) {
                // Delete from DB
                const { error } = await supabase
                    .from('caught_shinies')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('pokemon_id', variant.id)
                    .eq('gender', variant.gender);

                if (error) throw error;

                const newSet = new Set(caughtForms);
                newSet.delete(key);
                setCaughtForms(newSet);
            } else {
                // Insert
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

                const newSet = new Set(caughtForms);
                newSet.add(key);
                setCaughtForms(newSet);
            }
        } catch (err: any) {
            toast({ title: "Errore", description: err.message, variant: "destructive" });
        } finally {
            setLoadingAction(null);
        }
    };

    if (!pokemon) return null;

    const availableCategories = Object.entries(groupedVariants)
        .filter(([_, variants]) => variants.length > 0)
        .map(([key]) => key);

    const totalForms = allVariants.length;
    const caughtCount = allVariants.filter(v => caughtForms.has(`${v.id}-${v.gender}`)).length;
    const completionPct = totalForms > 0 ? Math.round((caughtCount / totalForms) * 100) : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <span className="shiny-text capitalize">{pokemon.displayName}</span>
                        <span className="text-muted-foreground text-lg">#{pokemon.id.toString().padStart(4, '0')}</span>
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-4">
                        <span>Clicca su uno sprite per segnarlo come catturato.</span>
                        <span className="text-primary font-semibold">
                            {caughtCount}/{totalForms} ({completionPct}%)
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 pt-2">
                    {detailsLoading ? (
                        <div className="flex items-center justify-center h-40">Caricamento dettagli...</div>
                    ) : details ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 mb-4">
                                <TabsTrigger value="all">Tutti</TabsTrigger>
                                {availableCategories.map(cat => (
                                    <TabsTrigger key={cat} value={cat} className="text-xs">
                                        {categoryLabels[cat].split(' ')[0]}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <TabsContent value="all" className="space-y-6">
                                {availableCategories.map(category => (
                                    <div key={category} className="space-y-3">
                                        <h3 className="text-lg font-semibold border-b border-primary/20 pb-2 text-primary/80">
                                            {categoryLabels[category]}
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                            {groupedVariants[category].map((variant) => {
                                                const key = `${variant.id}-${variant.gender}`;
                                                return (
                                                    <ShinyButton
                                                        key={variant.name + variant.gender}
                                                        label={variant.displayName}
                                                        spriteUrl={variant.spriteUrl}
                                                        isCaught={caughtForms.has(key)}
                                                        isLoading={loadingAction === key}
                                                        onClick={() => toggleCaught(variant)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </TabsContent>

                            {availableCategories.map(category => (
                                <TabsContent key={category} value={category}>
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold border-b border-primary/20 pb-2 text-primary/80">
                                            {categoryLabels[category]}
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                            {groupedVariants[category].map((variant) => {
                                                const key = `${variant.id}-${variant.gender}`;
                                                return (
                                                    <ShinyButton
                                                        key={variant.name + variant.gender}
                                                        label={variant.displayName}
                                                        spriteUrl={variant.spriteUrl}
                                                        isCaught={caughtForms.has(key)}
                                                        isLoading={loadingAction === key}
                                                        onClick={() => toggleCaught(variant)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
