import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePokemonDetails, PokemonBasic, getPokemonSpriteUrl } from "@/hooks/use-pokemon";
import { ShinyButton } from "./ShinyButton";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

// Seasonal form keywords
const SEASONAL_KEYWORDS = ['spring', 'summer', 'autumn', 'winter', 'plant', 'sandy', 'trash',
    'west', 'east', 'heat', 'wash', 'frost', 'fan', 'mow', 'red-striped', 'blue-striped', 'white-striped',
    'meadow', 'icy-snow', 'polar', 'tundra', 'continental', 'garden', 'elegant', 'modern', 'marine',
    'fancy', 'pokeball', 'small', 'average', 'large', 'super', 'baile', 'pom-pom', 'pau', 'sensu'];

export function PokemonDetailDialog({ pokemon, open, onOpenChange }: PokemonDetailDialogProps) {
    const { pokemon: details, loading: detailsLoading } = usePokemonDetails(pokemon?.id || null);
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
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
                .eq('pokemon_id', pokemon.id);

            if (error) {
                console.error("Error fetching caught status:", error);
                return;
            }

            if (data) {
                const caughtSet = new Set<string>();
                data.forEach(row => {
                    const formKey = row.form || `${row.pokemon_id}-${row.gender || 'genderless'}`;
                    caughtSet.add(formKey);
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

        // Base/Male
        variants.push({
            id: pokemonId,
            name: details.name,
            displayName: 'Maschio / Standard',
            category: 'base',
            gender: 'male',
            spriteUrl: details.sprites.shiny,
        });

        // Female
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

        const representativeNameKey = details.name.replace(/-male$|-female$/, '');

        // Add Varieties (Regional, etc.)
        if (details.varieties) {
            for (const variety of details.varieties) {
                if (variety.isDefault) continue; // Skip default as it's added above

                const vn = variety.pokemon.name.toLowerCase();
                const vnKey = vn.replace(/-male$|-female$/, '');

                // Only relevant forms
                if (vnKey !== representativeNameKey) continue;

                // Skip Mega/Gmax
                if (vn.includes('-mega') || vn.includes('-gmax')) continue;

                // Determine category
                let category: FormVariant['category'] = 'form';
                if (vn.includes('-alola') || vn.includes('-galar') || vn.includes('-hisui') || vn.includes('-paldea')) {
                    category = 'regional';
                }

                variants.push({
                    id: variety.pokemon.id,
                    name: vn,
                    displayName: variety.pokemon.name,
                    category: category,
                    gender: 'genderless', // Most varieties don't show gender diffs here
                    spriteUrl: variety.pokemon.spriteUrl,
                });
            }
        }

        // Add Forms (Seasonal, etc.)
        if (details.forms) {
            for (const form of details.forms) {
                if (form.formName === details.name) continue; // Skip base
                // Skip Mega/Gmax/Regional (covered by varieties usually)
                if (form.formName.includes('mega') || form.formName.includes('gmax')) continue;
                // Skip redundant
                if (form.formName === `${details.name}-normal` || form.formName === `${details.name}-standard`) continue;

                let category: FormVariant['category'] = 'form';

                // Check if it's a regional form (e.g. totem-alola)
                if (form.formName.includes('-alola') || form.formName.includes('-galar') ||
                    form.formName.includes('-hisui') || form.formName.includes('-paldea')) {
                    category = 'regional';
                } else if (SEASONAL_KEYWORDS.some(kw => form.formName.includes(kw))) {
                    category = 'seasonal';
                }

                // Skip if already exists (check ID or Name)
                if (variants.some(v => v.name === form.formName)) continue;


                variants.push({
                    id: form.id,
                    name: form.formName,
                    displayName: form.displayName,
                    category: category,
                    gender: 'genderless',
                    spriteUrl: form.sprites.shiny
                });
            }
        }

        return variants;
    }, [details]);

    // Group variants
    const groupedVariants = useMemo(() => {
        const groups: Record<string, FormVariant[]> = {
            base: [],
            gender: [], // merging gender into base usually, but let's keep separate tabs or merge?
            regional: [],
            seasonal: [],
            form: [],
            mega: [],
            gmax: []
        };

        allVariants.forEach(v => {
            if (v.category === 'base' || v.category === 'gender') {
                groups.base.push(v);
            } else {
                groups[v.category]?.push(v);
            }
        });
        return groups;
    }, [allVariants]);

    const categoryLabels: Record<string, string> = {
        base: '🔹 Forme Base',
        regional: '🌍 Forme Regionali',
        seasonal: '🍂 Forme Stagionali',
        form: '🔄 Altre Forme',
        mega: '⚡ Mega',
        gmax: '🌟 Gigamax'
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
                        method: 'unknown', // Default
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
        .filter(([_, variants]) => variants && variants.length > 0)
        .map(([key]) => key);

    const totalForms = allVariants.length;
    const caughtCount = allVariants.filter(v => caughtForms.has(`${v.id}-${v.gender}`)).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <span className="shiny-text capitalize">{pokemon.displayName}</span>
                        <span className="text-muted-foreground text-lg">#{pokemon.id.toString().padStart(4, '0')}</span>
                    </DialogTitle>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-1">
                        <DialogDescription>
                            {caughtCount}/{totalForms} Catturati
                        </DialogDescription>
                        <Button variant="outline" size="sm" className="ml-auto" onClick={() => {
                            onOpenChange(false);
                            navigate(`/counter?pokemon=${encodeURIComponent(pokemon.name)}`);
                        }}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Counter
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
                    {detailsLoading ? (
                        <div className="flex justify-center p-10">Caricamento...</div>
                    ) : details ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="mb-4 flex flex-wrap h-auto gap-2">
                                <TabsTrigger value="all">Tutti</TabsTrigger>
                                {availableCategories.map(cat => (
                                    <TabsTrigger key={cat} value={cat}>{categoryLabels[cat]}</TabsTrigger>
                                ))}
                            </TabsList>

                            <TabsContent value="all" className="space-y-6">
                                {availableCategories.map(category => (
                                    <div key={category} className="space-y-3">
                                        <h3 className="font-semibold text-primary">{categoryLabels[category]}</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                            {groupedVariants[category].map(variant => (
                                                <ShinyButton
                                                    key={`${variant.id}-${variant.gender}`}
                                                    label={variant.displayName}
                                                    spriteUrl={variant.spriteUrl}
                                                    isCaught={caughtForms.has(`${variant.id}-${variant.gender}`)}
                                                    isLoading={loadingAction === `${variant.id}-${variant.gender}`}
                                                    onClick={() => toggleCaught(variant)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </TabsContent>

                            {availableCategories.map(category => (
                                <TabsContent key={category} value={category}>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                        {groupedVariants[category].map(variant => (
                                            <ShinyButton
                                                key={`${variant.id}-${variant.gender}`}
                                                label={variant.displayName}
                                                spriteUrl={variant.spriteUrl}
                                                isCaught={caughtForms.has(`${variant.id}-${variant.gender}`)}
                                                isLoading={loadingAction === `${variant.id}-${variant.gender}`}
                                                onClick={() => toggleCaught(variant)}
                                            />
                                        ))}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
