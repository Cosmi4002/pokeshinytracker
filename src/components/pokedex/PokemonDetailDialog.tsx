import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePokemonDetails, PokemonBasic } from "@/hooks/use-pokemon";
import { ShinyButton } from "./ShinyButton";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

interface PokemonDetailDialogProps {
    pokemon: PokemonBasic | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PokemonDetailDialog({ pokemon, open, onOpenChange }: PokemonDetailDialogProps) {
    const { pokemon: details, loading: detailsLoading } = usePokemonDetails(pokemon?.id || null);
    const { user } = useAuth();
    const { toast } = useToast();
    const [caughtForms, setCaughtForms] = useState<Set<string>>(new Set());
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    useEffect(() => {
        if (user && pokemon && open) {
            fetchCaughtStatus();
        }
    }, [user, pokemon, open, details]); // Dependency on details ensures we fetch after form IDs are known

    const fetchCaughtStatus = async () => {
        if (!user || !pokemon) return;

        if (!details) {
            // If details are loading, we can at least fetch by name to be faster
        }

        try {
            // Fetch all caught shinies for this user that match the pokemon name
            // This is a broader search to catch all forms
            // In a real scalability scenario we would rely on IDs, but name is safer for now given the ambiguity of some API IDs
            const { data, error } = await supabase
                .from('caught_shinies')
                .select('pokemon_id, gender, pokemon_name')
                .eq('user_id', user.id)
                .ilike('pokemon_name', `${pokemon.name}%`); // Match name pattern

            if (error) throw error;

            if (data) {
                const caughtSet = new Set<string>();
                data.forEach(row => {
                    // composite key: "id-gender"
                    caughtSet.add(`${row.pokemon_id}-${row.gender || 'genderless'}`);
                });
                setCaughtForms(caughtSet);
            }
        } catch (err) {
            console.error("Error fetching status:", err);
        }
    };

    const toggleCaught = async (id: number, name: string, gender: 'male' | 'female' | 'genderless', sprite: string) => {
        if (!user) {
            toast({ title: "Login Required", description: "Please login to save your shiny collection.", variant: "destructive" });
            return;
        }

        const key = `${id}-${gender}`;
        const isCaught = caughtForms.has(key);
        setLoadingAction(key);

        try {
            if (isCaught) {
                // Delete
                const { error } = await supabase
                    .from('caught_shinies')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('pokemon_id', id)
                    .eq('gender', gender);

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
                        pokemon_id: id,
                        pokemon_name: name, // We use the specific form name
                        gender: gender,
                        sprite_url: sprite,
                        shiny_type: 'star',
                        method: 'unknown',
                        caught_date: new Date().toISOString()
                    });

                if (error) throw error;

                const newSet = new Set(caughtForms);
                newSet.add(key);
                setCaughtForms(newSet);
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setLoadingAction(null);
        }
    };

    if (!pokemon) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <span className="shiny-text capitalize">{pokemon.displayName}</span>
                        <span className="text-muted-foreground text-lg">#{pokemon.id.toString().padStart(4, '0')}</span>
                    </DialogTitle>
                    <DialogDescription>
                        Click on a sprite to mark it as caught.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 pt-2">
                    {detailsLoading ? (
                        <div className="flex items-center justify-center h-40">Loading details...</div>
                    ) : details ? (
                        <div className="space-y-8">
                            {/* Base Forms */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">Base Forms</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                    {/* Male / Genderless */}
                                    <ShinyButton
                                        label={details.hasGenderDifference ? "Male" : "Default"}
                                        spriteUrl={details.sprites.shiny}
                                        isCaught={caughtForms.has(`${details.id}-male`) || caughtForms.has(`${details.id}-genderless`)}
                                        isLoading={loadingAction === `${details.id}-${details.hasGenderDifference ? 'male' : 'genderless'}`}
                                        onClick={() => toggleCaught(details.id, details.displayName, details.hasGenderDifference ? 'male' : 'genderless', details.sprites.shiny)}
                                    />

                                    {/* Female */}
                                    {details.hasGenderDifference && details.sprites.femaleShiny && (
                                        <ShinyButton
                                            label="Female"
                                            spriteUrl={details.sprites.femaleShiny}
                                            isCaught={caughtForms.has(`${details.id}-female`)}
                                            isLoading={loadingAction === `${details.id}-female`}
                                            onClick={() => toggleCaught(details.id, details.displayName, 'female', details.sprites.femaleShiny!)}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Grouping Varieties */}
                            {(() => {
                                const categories: Record<string, typeof details.forms> = {
                                    "Regional Forms": [],
                                    "Mega Evolutions": [],
                                    "Gigantamax": [],
                                    "Other Forms": []
                                };

                                details.forms.forEach(form => {
                                    const name = form.formName.toLowerCase();
                                    if (name.includes('alola') || name.includes('galar') || name.includes('hisui') || name.includes('paldea')) {
                                        categories["Regional Forms"].push(form);
                                    } else if (name.includes('mega')) {
                                        categories["Mega Evolutions"].push(form);
                                    } else if (name.includes('gmax')) {
                                        categories["Gigantamax"].push(form);
                                    } else {
                                        categories["Other Forms"].push(form);
                                    }
                                });

                                return Object.entries(categories).map(([title, forms]) => {
                                    if (forms.length === 0) return null;
                                    return (
                                        <div key={title} className="space-y-4">
                                            <h3 className="text-lg font-semibold border-b border-primary/20 pb-2 text-primary/80">{title}</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                                {forms.map((form) => {
                                                    const formId = form.id;
                                                    const key = `${formId}-genderless`;
                                                    return (
                                                        <ShinyButton
                                                            key={form.formName}
                                                            label={form.displayName}
                                                            spriteUrl={form.sprites.shiny}
                                                            isCaught={caughtForms.has(key)}
                                                            isLoading={loadingAction === key}
                                                            onClick={() => toggleCaught(formId, form.displayName, 'genderless', form.sprites.shiny)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}

                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
