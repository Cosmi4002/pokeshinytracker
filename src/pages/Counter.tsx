import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, LayoutGrid, Maximize2, Plus, Target, X } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { ShinyCounter } from '@/components/counter/ShinyCounter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/lib/auth-context';
import { useRandomColor } from '@/lib/random-color-context';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type ActiveHunt = Tables<'active_hunts'>;
const MAX_ACTIVE_COUNTERS = 15;

export default function Counter() {
  const { huntId } = useParams<{ huntId?: string }>();
  const { user } = useAuth();
  const { accentColor } = useRandomColor();
  const navigate = useNavigate();
  const [activeHunts, setActiveHunts] = useState<ActiveHunt[]>([]);
  const [loading, setLoading] = useState(true);
  const [huntToHideId, setHuntToHideId] = useState<string | null>(null);
  const remainingSlots = Math.max(0, MAX_ACTIVE_COUNTERS - activeHunts.length);
  const isAbortLikeError = (err: unknown) => {
    if (!err || typeof err !== 'object') return false;
    const maybe = err as { name?: string; message?: string };
    const name = (maybe.name || '').toLowerCase();
    const message = (maybe.message || '').toLowerCase();
    return name.includes('abort') || message.includes('aborted');
  };

  // If huntId is present, we are in "Single Focus Mode"
  const isSingleView = !!huntId;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchHunts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('active_hunts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_visible_on_counter', true) // Solo cacce visibili
          .order('order_index', { ascending: true }) // Ordina per indice
          .order('updated_at', { ascending: false })
          .limit(MAX_ACTIVE_COUNTERS); // Fetch up to 15 most recent hunts

        if (error && !isAbortLikeError(error)) {
          console.error('Error fetching hunts:', error);
        }

        if (data) {
          setActiveHunts(data);
        }
      } catch (err) {
        if (!isAbortLikeError(err)) {
          console.error('Unexpected fetch hunts error:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHunts();
  }, [user, huntId]); // Refetch when huntId changes (e.g. navigation)

  const handleHideHunt = async (huntId: string) => {
    // Optimistic update
    setActiveHunts(prev => prev.filter(h => h.id !== huntId));

    const { error } = await supabase
      .from('active_hunts')
      .update({ is_visible_on_counter: false })
      .eq('id', huntId);

    if (error) {
      console.error("Error hiding hunt:", error);
      // Revert optimistic update if needed, or just let the next fetch handle it
    }
  };

  const handleCreateNew = async () => {
    if (!user) {
      // For guests, we can navigate to a demo counter or prompt login
      navigate('/auth'); // Or some other handling
      return;
    }

    // Create a new active hunt entry in Supabase
    const { data, error } = await supabase.from('active_hunts').insert({
      user_id: user.id,
      pokemon_id: null, // Initial empty state
      pokemon_name: null, // Initial empty state
      method: 'gen9-random', // Default method
      counter: 0,
      has_shiny_charm: false,
      increment_amount: 1,
      increment_hotkey: null,
      is_visible_on_counter: true, // Visibile nel multi-counter
      created_at: new Date().toISOString(), // Auto start date
    }).select('id').single();

    if (error) {
      console.error("Error creating new hunt:", error);
      // Handle error, maybe show a toast
      return;
    }

    // Refresh local state instead of navigating
    if (data?.id) {
      // Refresh list
      const { data: newData } = await supabase
        .from('active_hunts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_visible_on_counter', true)
        .order('order_index', { ascending: true })
        .order('updated_at', { ascending: false })
        .limit(MAX_ACTIVE_COUNTERS);

      if (newData) setActiveHunts(newData);
    }
  };

  return (
    <div
      className="min-h-screen bg-background transition-colors duration-1000"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}15 0%, transparent 70%)`
      }}
    >
      <Navbar />
      <main className="container mx-auto px-4 py-6 space-y-5">

        {/* View Switcher Header (only if logged in) */}
        {user && !isSingleView && (
          <section className="rounded-lg border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Activity className="h-3.5 w-3.5" />
                    {activeHunts.length}/{MAX_ACTIVE_COUNTERS} attive
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Target className="h-3.5 w-3.5" />
                    {remainingSlots} libere
                  </Badge>
                </div>
                <h1
                  className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${accentColor}, color-mix(in srgb, ${accentColor}, white 35%))`
                  }}
                >
                  Counter
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tieni le cacce attive in vista e apri il focus quando devi configurare i dettagli.
                </p>
              </div>
              <Button
                onClick={handleCreateNew}
                disabled={activeHunts.length >= MAX_ACTIVE_COUNTERS}
                className="w-full md:w-auto"
                style={{ backgroundColor: accentColor }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuova caccia
              </Button>
            </div>
          </section>
        )}

        {/* CONTENT */}
        {isSingleView ? (
          /* Single Counter View (Focused) */
          <div className="mx-auto max-w-3xl space-y-4">
            <div>
              <Button variant="ghost" onClick={() => navigate('/counter')}>
                <LayoutGrid className="mr-2 h-4 w-4" /> Torna alla vista Multipla
              </Button>
            </div>
            <ShinyCounter huntId={huntId} enableKeyboardShortcuts />
          </div>
        ) : !user ? (
          /* Guest View (Single Demo) */
          <ShinyCounter enableKeyboardShortcuts />
        ) : (
          /* Multi Counter Grid */
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <div className="col-span-full rounded-lg border border-border/70 bg-card/70 py-12 text-center text-sm text-muted-foreground">
                Caricamento counter...
              </div>
            ) : (
              <>
                {/* Render Active Hunts */}
                {activeHunts.map((hunt) => (
                  <div
                    key={hunt.id}
                    className="group/card relative overflow-hidden rounded-lg border border-border/70 bg-card/85 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-1"
                      style={{ backgroundColor: accentColor }}
                    />
                    <div className="absolute right-2 top-2 z-10 flex gap-1 rounded-md border border-border/70 bg-background/80 p-1 opacity-100 shadow-sm backdrop-blur sm:opacity-0 sm:transition-opacity sm:group-hover/card:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/counter/${hunt.id}`);
                        }}
                        title="Focus mode"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHuntToHideId(hunt.id);
                        }}
                        title="Chiudi (Nascondi)"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="pt-8">
                      <ShinyCounter
                        huntId={hunt.id}
                        enableKeyboardShortcuts
                        allowGlobalPlusMinusHotkeys={false}
                        compact
                        showSetup={false}
                      />
                    </div>
                  </div>
                ))}

                {activeHunts.length === 0 && (
                  <div className="col-span-full rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md border border-border bg-background">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h2 className="text-lg font-bold">Nessuna caccia attiva</h2>
                    <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                      Crea un counter e poi aprilo in focus mode per scegliere Pokemon, metodo e dettagli.
                    </p>
                    <Button className="mt-4" onClick={handleCreateNew} style={{ backgroundColor: accentColor }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nuova caccia
                    </Button>
                  </div>
                )}

                {activeHunts.length > 0 && activeHunts.length < MAX_ACTIVE_COUNTERS && (
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="min-h-[220px] rounded-lg border border-dashed border-border bg-muted/20 p-4 text-left transition-colors hover:bg-muted/35 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-background">
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-bold">Aggiungi counter</div>
                        <div className="mt-1 text-sm text-muted-foreground">{remainingSlots} slot disponibili</div>
                      </div>
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <AlertDialog open={!!huntToHideId} onOpenChange={(open) => !open && setHuntToHideId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione counter</AlertDialogTitle>
            <AlertDialogDescription>
              Vuoi davvero rimuovere questo counter dalla vista multipla? Potrai riaggiungerlo in seguito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setHuntToHideId(null)}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (huntToHideId) void handleHideHunt(huntToHideId);
                setHuntToHideId(null);
              }}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
