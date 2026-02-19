import { useState, useMemo } from 'react';
import { Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { getPokemonSpriteUrl } from '@/hooks/use-pokemon';
import { usePokemonList } from '@/hooks/use-pokemon';
import { canEvolve, getNextEvolutions } from '@/lib/evolution-data';
import type { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type CaughtShinyRow = Tables<'caught_shinies'>;

interface EvolveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: CaughtShinyRow | null;
  onSuccess: () => void;
}

export function EvolveDialog({ open, onOpenChange, entry, onSuccess }: EvolveDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { pokemon } = usePokemonList();
  const [loading, setLoading] = useState(false);
  const [selectedEvolution, setSelectedEvolution] = useState<number | null>(null);

  // Get the current Pokemon details
  const currentPokemon = useMemo(() => {
    if (!entry || !pokemon) return null;
    return pokemon.find(p => p.id === entry.pokemon_id);
  }, [entry, pokemon]);

  // Get available evolutions
  const availableEvolutions = useMemo(() => {
    if (!entry || !pokemon) return [];
    
    const nextIds = getNextEvolutions(entry.pokemon_id);
    return nextIds.map(id => {
      const poke = pokemon.find(p => p.id === id);
      return poke ? { id: poke.id, name: poke.name, displayName: poke.displayName } : null;
    }).filter(Boolean) as { id: number; name: string; displayName: string }[];
  }, [entry, pokemon]);

  // Check if current Pokemon can evolve
  const canEvolveThis = useMemo(() => {
    if (!entry) return false;
    return canEvolve(entry.pokemon_id);
  }, [entry]);

  const currentSpriteUrl = useMemo(() => {
    if (!entry) return '';
    return getPokemonSpriteUrl(entry.pokemon_id, {
      shiny: true,
      name: entry.pokemon_name,
      form: entry.form || undefined,
      female: entry.gender === 'female'
    });
  }, [entry]);

  const handleEvolve = async () => {
    if (!entry || !user || !selectedEvolution) return;

    setLoading(true);
    try {
      // Get the evolution Pokemon details
      const evolutionPokemon = pokemon?.find(p => p.id === selectedEvolution);
      if (!evolutionPokemon) {
        throw new Error('Pokemon evolution not found');
      }

      // Generate the new sprite URL
      const newSpriteUrl = getPokemonSpriteUrl(selectedEvolution, {
        shiny: true,
        name: evolutionPokemon.name,
      });

      // Update the caught_shinies table
      const { error } = await supabase
        .from('caught_shinies')
        .update({
          pokemon_id: selectedEvolution,
          pokemon_name: evolutionPokemon.displayName,
          sprite_url: newSpriteUrl,
          is_evolved: true,
        })
        .eq('id', entry.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Evoluzione completata! 🎉',
        description: `${entry.pokemon_name} si è evoluto in ${evolutionPokemon.displayName}!`,
      });
      
      onOpenChange(false);
      onSuccess();
      
      // Reset state
      setSelectedEvolution(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error.message || 'Impossibile completare l\'evoluzione.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedEvolution(null);
    onOpenChange(false);
  };

  if (!entry) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Gestisci Evoluzione
          </DialogTitle>
          <DialogDescription>
            Seleziona l'evoluzione per {currentPokemon?.displayName || entry.pokemon_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Pokemon */}
          <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-amber-500/10 to-purple-500/10 rounded-xl border border-amber-500/20">
            <div className="relative">
              <img
                src={currentSpriteUrl}
                alt={entry.pokemon_name}
                className="h-32 w-32 pokemon-sprite object-contain drop-shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <ChevronRight className="absolute -right-8 top-1/2 -translate-y-1/2 h-8 w-8 text-amber-400" />
            </div>
            
            <div className="text-center">
              <p className="text-lg font-bold text-white">
                {currentPokemon?.displayName || entry.pokemon_name}
              </p>
              <p className="text-sm text-white/60">Forma attuale</p>
            </div>
          </div>

          {/* Evolution options or message */}
          {!canEvolveThis ? (
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">
                Questo Pokémon non può evolversi ulteriormente.
              </p>
            </div>
          ) : availableEvolutions.length === 0 ? (
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">
                Nessuna evoluzione disponibile per questo Pokémon.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-white/80">Seleziona l'evoluzione:</p>
              <div className="grid grid-cols-1 gap-2">
                {availableEvolutions.map((evolution) => (
                  <button
                    key={evolution.id}
                    onClick={() => setSelectedEvolution(evolution.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                      selectedEvolution === evolution.id
                        ? "border-green-500 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                        : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                    )}
                  >
                    <img
                      src={getPokemonSpriteUrl(evolution.id, { shiny: true, name: evolution.name })}
                      alt={evolution.displayName}
                      className="h-16 w-16 pokemon-sprite object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    <div className="flex-1 text-left">
                      <p className="font-bold text-white">{evolution.displayName}</p>
                      <p className="text-xs text-white/60">Evoluzione</p>
                    </div>
                    {selectedEvolution === evolution.id && (
                      <div className="h-4 w-4 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              onClick={handleEvolve}
              disabled={!selectedEvolution || loading || !canEvolveThis}
              className={cn(
                "flex-1",
                selectedEvolution && "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              )}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Evolvo...' : 'Conferma Evoluzione'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
