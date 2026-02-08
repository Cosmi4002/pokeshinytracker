import { useState, useEffect } from 'react';
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
import type { Tables } from '@/integrations/supabase/types';

type ActiveHuntRow = Tables<'active_hunts'>;

export default function Hunts() {
    const { user } = useAuth();
    const { accentColor } = useRandomColor();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { preferences } = useUserPreferences();
    const [hunts, setHunts] = useState<ActiveHuntRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingHunt, setEditingHunt] = useState<ActiveHuntRow | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

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
                            {hunts.map((hunt) => (
                                <HuntCard
                                    key={hunt.id}
                                    hunt={hunt}
                                    onDelete={handleDeleteHunt}
                                    onEdit={handleEditHunt}
                                    onContinue={handleContinueHunt}
                                    layoutStyle={preferences.layout_style || 'grid'}
                                />
                            ))}
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
