import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePokemonDetails, PokemonBasic, getPokemonSpriteUrl } from "@/hooks/use-pokemon";
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

// Seasonal form keywords to detect from API form names
const SEASONAL_KEYWORDS = ['spring', 'summer', 'autumn', 'winter', 'plant', 'sandy', 'trash',
    'west', 'east', 'heat', 'wash', 'frost', 'fan', 'mow', 'red-striped', 'blue-striped', 'white-striped',
    'meadow', 'icy-snow', 'polar', 'tundra', 'continental', 'garden', 'elegant', 'modern', 'marine',
    'fancy', 'pokeball', 'small', 'average', 'large', 'super', 'baile', 'pom-pom', 'pau', 'sensu'];

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

    // Build all form variants from API data
    const allVariants = useMemo((): FormVariant[] => {
        if (!details) return [];

        const variants: FormVariant[] = [];
        const pokemonId = details.id;

        // Base Male/Default
        const isPartnerCap = details.id === 10148;
        const showGenderLabels = details.hasGenderDifference && !isPartnerCap;

        // Skip adding Base variant for Minior (it's the Meteor form, user wants only Cores)
        if (details.name !== 'minior') {
            variants.push({
                id: pokemonId,
                name: details.name,
                displayName: showGenderLabels ? 'Maschio' : 'Default',
                category: showGenderLabels ? 'gender' : 'base',
                gender: showGenderLabels ? 'male' : 'genderless',
                spriteUrl: details.sprites.shiny,
            });
        }

        // Female variant
        if (details.hasGenderDifference && details.sprites.femaleShiny && !isPartnerCap) {
            variants.push({
                id: pokemonId,
                name: `${details.name}-female`,
                displayName: 'Femmina',
                category: 'gender',
                gender: 'female',
                spriteUrl: details.sprites.femaleShiny,
            });
        }

        // Add forms from API (includes seasonal, regional, mega, gmax, etc.)
        for (const form of details.forms) {
            // Skip ALL Pikachu cap forms — user only wants Male/Female + Partner Cap (separate entry)
            if (details.id === 25) continue;

            // Skip ALL forms for Partner Cap Pikachu (it's a standalone form)
            if (details.id === 10148) continue;

            const name = form.formName.toLowerCase();

            // Skip regional forms here - they are independent entries or handled elsewhere
            // UNLESS the current pokemon is that regional form (e.g. darmanitan-galar should see darmanitan-galar-zen)
            const isRegionalForm = name.includes('-alola') || name.includes('-galar') || name.includes('-hisui') || name.includes('-paldea');

            if (isRegionalForm) {
                const myName = details.name.toLowerCase();
                // If I am NOT regional, filter out regional forms (they are separate entries)
                if (!myName.includes('-alola') && !myName.includes('-galar') && !myName.includes('-hisui') && !myName.includes('-paldea')) {
                    continue;
                }
                // If I AM regional, filter out OTHER regions
                if (myName.includes('-galar') && !name.includes('-galar')) continue;
                if (myName.includes('-alola') && !name.includes('-alola')) continue;
                if (myName.includes('-hisui') && !name.includes('-hisui')) continue;
                if (myName.includes('-paldea') && !name.includes('-paldea')) continue;
            }

            // Skip redundant "normal" or "standard" forms (e.g. Silvally-Normal) which are same as base
            if (name === `${details.name}-normal` || name === `${details.name}-standard`) continue;

            // Skip Minior Meteor forms (redundant with Base)
            if (name.startsWith('minior-') && name.includes('-meteor')) continue;

            let category: FormVariant['category'] = 'form';
            let variantDisplayName = form.displayName;

            if (name.includes('mega')) {
                category = 'mega';
            } else if (name.includes('gmax')) {
                category = 'gmax';
            } else if (name.includes('-alola') || name.includes('-galar') || name.includes('-hisui') || name.includes('-paldea')) {
                category = 'regional';
            } else if (SEASONAL_KEYWORDS.some(kw => name.includes(kw))) {
                category = 'seasonal';
            }

            // --- Custom Overrides & Cleanups ---

            // Urshifu Rapid Strike: Move to Base, Remove Altre Forme
            if (details.id === 892 || (details.baseId === 892)) {
                if (name === 'urshifu-rapid-strike') {
                    category = 'base';
                } else if (category === 'form') {
                    continue; // Remove other forms
                }
            }

            // Oinkologne Male/Female: Move to Base, Remove Altre Forme
            if (details.id === 916 || details.baseId === 916) {
                if (name === 'oinkologne-male' || name === 'oinkologne-female') {
                    category = 'base';
                } else if (category === 'form') {
                    continue;
                }
            }

            // Lycanroc Midnight: Move to Base
            if (details.id === 745 || details.baseId === 745) {
                if (name === 'lycanroc-midnight') {
                    category = 'base';
                }
            }

            // Poltchageist: Remove Altre Forme
            if (details.id === 1012 || details.baseId === 1012) {
                if (category === 'form') continue;
            }

            // Ogerpon: Wellspring to Altre, remove Seasonal category
            if (details.id === 1017 || details.baseId === 1017) {
                if (name === 'ogerpon-wellspring-mask') {
                    category = 'form';
                }
                if (category === 'seasonal') category = 'form'; // Merge seasonal into forms
            }

            // Mimikyu: Rename Disguised to just "Mimikyu", remove Altre (Busted)
            if (details.id === 778 || details.baseId === 778) {
                if (name.includes('busted')) continue;
            }

            // Minior: Handle color naming in parens
            if (details.name.includes('minior')) {
                const colorMatch = name.match(/minior-(red|orange|yellow|green|blue|indigo|violet)/);
                if (colorMatch) {
                    const color = colorMatch[1].charAt(0).toUpperCase() + colorMatch[1].slice(1);
                    variantDisplayName = `Minior (${color})`;
                    category = 'base';
                }
            }

            // Wishiwashi: Rename Solo to "Wishiwashi", remove School/Seasonal
            if (details.id === 746 || details.baseId === 746) {
                if (name.includes('school')) continue;
                if (category === 'seasonal') continue;
            }

            // Meowstic: Rename Male to "Meowstic", remove Altre
            if (details.id === 678 || details.baseId === 678) {
                if (category === 'form') continue;
            }

            // Xerneas: Remove Altre
            if (details.id === 716 || details.baseId === 716) {
                if (category === 'form') continue;
            }

            // Greninja: Remove Battle Bond and Ash
            if (details.id === 658 || details.baseId === 658) {
                if (name.includes('battle-bond') || name.includes('ash')) continue;
            }

            variants.push({
                id: form.id,
                name: form.formName,
                displayName: variantDisplayName,
                category,
                gender: 'genderless',
                spriteUrl: getPokemonSpriteUrl(form.id, { shiny: true, name: form.formName, animated: true }),
            });
        }

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
        seasonal: pokemon?.name.toLowerCase().includes('oricorio') ? '💃 Dance Styles' : '🍂 Forme Stagionali',
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
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
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

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <div className="p-6 pt-2">
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
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
