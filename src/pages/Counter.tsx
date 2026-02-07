import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, Maximize2, X } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { ShinyCounter } from '@/components/counter/ShinyCounter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { useRandomColor } from '@/lib/random-color-context';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type ActiveHunt = Tables<'active_hunts'>;

export default function Counter() {
  const { huntId } = useParams<{ huntId?: string }>();
  const { user } = useAuth();
  const { accentColor } = useRandomColor();
  const navigate = useNavigate();
  const [activeHunts, setActiveHunts] = useState<ActiveHunt[]>([]);
  const [loading, setLoading] = useState(true);

  // If huntId is present, we are in "Single Focus Mode"
  const isSingleView = !!huntId;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchHunts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('active_hunts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_visible_on_counter', true) // Solo cacce visibili
        .order('order_index', { ascending: true }) // Ordina per indice
        .order('updated_at', { ascending: false })
        .limit(6); // Fetch up to 6 most recent hunts

      if (data) {
        setActiveHunts(data);
      }
      setLoading(false);
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
      is_visible_on_counter: true, // Visibile nel multi-counter
      started_at: new Date().toISOString(), // Auto start date
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
        .limit(6);

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
      <main className="container mx-auto py-8 px-4">

        {/* View Switcher Header (only if logged in) */}
        {user && !isSingleView && (
          <div className="mb-6 flex justify-between items-center">
            <h1
              className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r"
              style={{
                backgroundImage: `linear-gradient(to right, ${accentColor}, color-mix(in srgb, ${accentColor}, white 30%))`
              }}
            >
              Multi-Counter View
            </h1>
            <div className="text-sm text-muted-foreground">
              Mostrando fino a 6 cacce attive
            </div>
          </div>
        )}

        {/* CONTENT */}
        {isSingleView ? (
          /* Single Counter View (Focused) */
          <div>
            <div className="mb-4">
              <Button variant="ghost" onClick={() => navigate('/counter')}>
                <LayoutGrid className="mr-2 h-4 w-4" /> Torna alla vista Multipla
              </Button>
            </div>
            <ShinyCounter huntId={huntId} />
          </div>
        ) : !user ? (
          /* Guest View (Single Demo) */
          <ShinyCounter />
        ) : (
          /* Multi Counter Grid */
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-3 text-center py-12">Caricamento counters...</div>
            ) : (
              <>
                {/* Render Active Hunts */}
                {activeHunts.map((hunt) => (
                  <div
                    key={hunt.id}
                    className="border rounded-xl p-4 shadow-sm relative hover:shadow-md transition-shadow group/card"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--card), transparent 50%)' }}
                  >
                    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
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
                          handleHideHunt(hunt.id);
                        }}
                        title="Chiudi (Nascondi)"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Minimal variant could be created, but standard is fine currently as it fits in columns */}
                    <div className="scale-85 sm:scale-90 origin-top text-xs">
                      <ShinyCounter huntId={hunt.id} />
                    </div>
                  </div>
                ))}

                {/* Empty Slots */}
                {activeHunts.length < 6 && (
                  Array.from({ length: 6 - activeHunts.length }).map((_, index) => (
                    <Card
                      key={`empty-${index}`}
                      className="border-dashed border-2 flex items-center justify-center min-h-[500px] transition-colors cursor-pointer group"
                      onClick={handleCreateNew}
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--muted), transparent 90%)',
                      }}
                    >
                      <CardContent className="text-center pt-6 group-hover:bg-muted/10 transition-colors">
                        <div className="mb-4 flex justify-center">
                          <div
                            className="h-16 w-16 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--primary), transparent 90%)' }}
                          >
                            <Plus className="h-8 w-8 text-primary" />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Slot Vuoto</h3>
                        <p className="text-muted-foreground mb-4">Aggiungi una nuova caccia qui</p>
                        <Button className="shiny-glow">Nuova Caccia</Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
