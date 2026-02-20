import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, ArrowRight, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { HuntCard } from '@/components/hunts/HuntCard';
import { EditHuntDialog } from '@/components/hunts/EditHuntDialog';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useRandomColor } from '@/lib/random-color-context';
import { usePokemonList, formatPokemonName } from '@/hooks/use-pokemon';
import { getGameSpecificSpriteUrl } from '@/lib/pokemon-data';
import type { Tables } from '@/integrations/supabase/types';

type ActiveHuntRow = Tables<'active_hunts'>;
type ResolvedHunt = {
    hunt: ActiveHuntRow;
    displayName: string;
    spriteUrl: string;
    resolvedPokemon?: {
        id: number;
        baseId: number;
        name: string;
        displayName: string;
    };
};

export default function Hunts() {
    const { user } = useAuth();
    const { accentColor } = useRandomColor();
    const { pokemon } = usePokemonList();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { preferences } = useUserPreferences();
    const [hunts, setHunts] = useState<ActiveHuntRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingHunt, setEditingHunt] = useState<ActiveHuntRow | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const normalize = (value: string | null | undefined) =>
        (value || '')
            .toLowerCase()
            .trim()
            .replace(/[()]/g, '')
            .replace(/\s+/g, '-')
            .replace(/_+/g, '-');

    const pokemonByName = useMemo(() => {
        const m = new Map<string, any[]>();
        pokemon.forEach((p) => {
            const key = normalize(p.name);
            if (!m.has(key)) m.set(key, []);
            m.get(key)!.push(p);
        });
        return m;
    }, [pokemon]);

    const pokemonByDisplayName = useMemo(() => {
        const m = new Map<string, any[]>();
        pokemon.forEach((p) => {
            const key = normalize(p.displayName);
            if (!m.has(key)) m.set(key, []);
            m.get(key)!.push(p);
        });
        return m;
    }, [pokemon]);

    const pokemonById = useMemo(() => {
        const m = new Map<number, any[]>();
        pokemon.forEach((p) => {
            if (!m.has(p.id)) m.set(p.id, []);
            m.get(p.id)!.push(p);
        });
        return m;
    }, [pokemon]);

    const pickBest = (items: any[] | undefined, hunt: ActiveHuntRow) => {
        if (!items || items.length === 0) return undefined;
        if (items.length === 1) return items[0];
        const target = hunt.pokemon_id || 0;
        return (
            items.find((p) => p.id === target) ||
            items.find((p) => p.baseId === target) ||
            items[0]
        );
    };

    const resolveHuntPokemon = (hunt: ActiveHuntRow) => {
        const formSlug = normalize(hunt.form);
        if (formSlug) {
            const byForm = pickBest(pokemonByName.get(formSlug), hunt);
            if (byForm) return byForm;
        }

        const huntNameSlug = normalize(hunt.pokemon_name);
        if (huntNameSlug) {
            const byName = pickBest(pokemonByName.get(huntNameSlug), hunt);
            if (byName) return byName;
            const byDisplay = pickBest(pokemonByDisplayName.get(huntNameSlug), hunt);
            if (byDisplay) return byDisplay;
        }

        const candidates = pokemonById.get(hunt.pokemon_id || 0) || [];
        if (candidates.length === 0) return undefined;
        if (candidates.length === 1) return candidates[0];

        const byDisplay = candidates.find((p) => normalize(p.displayName) === huntNameSlug);
        if (byDisplay) return byDisplay;

        return candidates[0];
    };

    const resolvedHunts = useMemo<ResolvedHunt[]>(() => {
        return hunts.map((hunt) => {
            const resolved = resolveHuntPokemon(hunt);
            const displayName = resolved?.displayName
                || formatPokemonName(hunt.form || hunt.pokemon_name || '', hunt.pokemon_id);

            const spritePokemonId = resolved?.id || hunt.pokemon_id || 0;
            const spriteName = resolved?.name || hunt.form || hunt.pokemon_name || undefined;
            const spriteForm = resolved && resolved.id !== resolved.baseId
                ? resolved.name
                : hunt.form || undefined;

            const spriteUrl = getGameSpecificSpriteUrl(
                spritePokemonId,
                hunt.method || 'gen9-random',
                spriteName,
                spriteForm,
                hunt.gender || undefined
            ) || '';

            return {
                hunt,
                displayName,
                spriteUrl,
                resolvedPokemon: resolved
                    ? {
                        id: resolved.id,
                        baseId: resolved.baseId,
                        name: resolved.name,
                        displayName: resolved.displayName,
                    }
                    : undefined,
            };
        });
    }, [hunts, pokemonById, pokemonByDisplayName, pokemonByName]);

    // Auto-fix stale hunt rows (old/wrong name/form) to keep hunts aligned with current pokedex data.
    useEffect(() => {
        if (!user || resolvedHunts.length === 0) return;

        const staleRows = resolvedHunts.filter(({ hunt, resolvedPokemon, displayName }) => {
            if (!resolvedPokemon) return false;
            const expectedForm = resolvedPokemon.id !== resolvedPokemon.baseId ? resolvedPokemon.name : null;
            const expectedPokemonId = resolvedPokemon.baseId;
            return (
                (hunt.pokemon_name || '') !== displayName ||
                (hunt.form || null) !== expectedForm ||
                (hunt.pokemon_id || 0) !== expectedPokemonId
            );
        });

        if (staleRows.length === 0) return;

        const syncRows = async () => {
            for (const row of staleRows) {
                if (!row.resolvedPokemon) continue;
                const expectedForm = row.resolvedPokemon.id !== row.resolvedPokemon.baseId ? row.resolvedPokemon.name : null;

                await supabase
                    .from('active_hunts')
                    .update({
                        pokemon_id: row.resolvedPokemon.baseId,
                        pokemon_name: row.displayName,
                        form: expectedForm,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', row.hunt.id)
                    .eq('user_id', user.id);
            }

            setHunts((prev) =>
                prev.map((h) => {
                    const fixed = staleRows.find((r) => r.hunt.id === h.id);
                    if (!fixed || !fixed.resolvedPokemon) return h;
                    return {
                        ...h,
                        pokemon_id: fixed.resolvedPokemon.baseId,
                        pokemon_name: fixed.displayName,
                        form: fixed.resolvedPokemon.id !== fixed.resolvedPokemon.baseId ? fixed.resolvedPokemon.name : null,
                    };
                })
            );
        };

        void syncRows();
    }, [resolvedHunts, user?.id]);

    const fetchHunts = async () => {
        if (!user) {
            setHunts([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('active_hunts')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            // Filter out hunts that don't have a pokemon_id assigned yet (incomplete hunts)
            setHunts(data?.filter(h => h.pokemon_id !== null) || []);
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Errore',
                description: err.message || 'Impossibile caricare le cacce',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHunts();
    }, [user?.id]);

    const handleEditHunt = (hunt: ActiveHuntRow) => {
        setEditingHunt(hunt);
        setIsEditOpen(true);
    };

    const handleDeleteHunt = async (huntId: string) => {
        try {
            const { error } = await supabase
                .from('active_hunts')
                .delete()
                .eq('id', huntId)
                .eq('user_id', user!.id);

            if (error) throw error;

            setHunts((prev) => prev.filter((h) => h.id !== huntId));
            toast({
                title: 'Caccia eliminata',
                description: 'La caccia è stata rimossa',
            });
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Errore',
                description: err.message || 'Impossibile eliminare la caccia',
            });
        }
    };

    const handleContinueHunt = async (huntId: string) => {
        try {
            // Re-enable visibility on counter
            await supabase
                .from('active_hunts')
                .update({ is_visible_on_counter: true })
                .eq('id', huntId);

            navigate(`/counter/${huntId}`);
        } catch (error) {
            console.error("Error updating visibility:", error);
            // Navigate anyway
            navigate(`/counter/${huntId}`);
        }
    };

    const handleCreateHunt = () => {
        // Navigate to counter page with 'new' param to force creation of a new hunt
        navigate('/counter/new');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto py-8 px-4">
                    <p className="text-center text-muted-foreground">Caricamento...</p>
                </main>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-background transition-colors duration-1000"
            style={{
                backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}15 0%, transparent 70%)`
            }}
        >
            <Navbar />
            <main className="container mx-auto py-8 px-4">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1
                                className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r"
                                style={{
                                    backgroundImage: `linear-gradient(to right, ${accentColor}, color-mix(in srgb, ${accentColor}, white 30%))`
                                }}
                            >
                                Le mie cacce attive
                            </h1>
                            <p className="text-muted-foreground">
                                {hunts.length} {hunts.length === 1 ? 'caccia attiva' : 'cacce attive'}
                            </p>
                        </div>
                        <Button
                            className="text-white hover:opacity-90 transition-opacity"
                            onClick={handleCreateHunt}
                            style={{
                                backgroundColor: accentColor,
                                boxShadow: `0 0 20px ${accentColor}40`
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Nuova caccia
                        </Button>
                    </div>

                    {/* Hunts Grid */}
                    {!user ? (
                        <Card
                            className="border-primary/50 bg-primary/5 transition-all duration-500"
                            style={{
                                borderColor: accentColor,
                                boxShadow: `0 0 20px ${accentColor}20`
                            }}
                        >
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground mb-4">
                                    Accedi per salvare e gestire le tue cacce shiny
                                </p>
                                <Link to="/auth">
                                    <Button
                                        className="shadow-lg hover:shadow-xl transition-all duration-300"
                                        style={{
                                            backgroundColor: accentColor,
                                            boxShadow: `0 0 15px ${accentColor}60`
                                        }}
                                    >
                                        Accedi / Registrati
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : hunts.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground mb-4">
                                    Non hai ancora cacce attive. Inizia a cacciare!
                                </p>
                                <Button onClick={handleCreateHunt} className="shiny-glow">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Inizia una nuova caccia
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className={
                            preferences.layout_style === 'list'
                                ? 'flex flex-col gap-3'
                                : preferences.layout_style === 'compact'
                                    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
                                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                        }>
                            {resolvedHunts.map(({ hunt, displayName, spriteUrl }) => {
                                return (
                                <HuntCard
                                    key={hunt.id}
                                    hunt={hunt}
                                    onDelete={handleDeleteHunt}
                                    onEdit={handleEditHunt}
                                    onContinue={handleContinueHunt}
                                    layoutStyle={preferences.layout_style || 'grid'}
                                    resolvedDisplayName={displayName}
                                    resolvedSpriteUrl={spriteUrl}
                                />
                                );
                            })}
                        </div>
                    )}
                </div>

                <EditHuntDialog
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    hunt={editingHunt}
                    onSuccess={fetchHunts}
                />
            </main>
        </div>
    );
}
