import { useState, useMemo } from 'react';
import { Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { usePokemonList } from '@/hooks/use-pokemon';
import { canEvolve, getNextEvolutions } from '@/lib/evolution-data';
import type { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { resolveEntityKeyForSelectedPokemon, resolvePokemonEntityKey } from '@/lib/pokemon-entity-resolver-v2';
import { getArchiveShinySpriteUrl, getPokemonSpriteUrl, getSelectedGameSpriteUrl } from '@/lib/pokemon-data';

type CaughtShinyRow = Tables<'caught_shinies'>;

interface EvolveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: CaughtShinyRow | null;
  onSuccess: () => void;
}

function isMissingIsEvolvedColumn(error: unknown): boolean {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: string }).message || '')
      : '';
  return message.includes('is_evolved') && message.toLowerCase().includes('column');
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
    if (entry.form) {
      const formMatch = pokemon.find(p => p.name === entry.form);
      if (formMatch) return formMatch;
    }
    return pokemon.find(p => p.id === entry.pokemon_id);
  }, [entry, pokemon]);

  const evolutionSourceId = useMemo(() => {
    if (!entry) return null;
    return currentPokemon?.baseId ?? entry.pokemon_id;
  }, [entry, currentPokemon]);

  const currentFormSuffix = useMemo(() => {
    const source = (entry?.form || currentPokemon?.name || '').toLowerCase();
    if (source.includes('-')) {
      return source.split('-').slice(1).join('-');
    }
    const display = (entry?.pokemon_name || '').toLowerCase();
    const seasonMatch = display.match(/\((spring|summer|autumn|winter)\)/i);
    if (seasonMatch) return seasonMatch[1].toLowerCase();
    return '';
  }, [entry?.form, currentPokemon?.name, entry?.pokemon_name]);

  // Get available evolutions
  const availableEvolutions = useMemo(() => {
    if (!entry || !pokemon || !evolutionSourceId) return [];

    const nextIds = getNextEvolutions(evolutionSourceId);
    return nextIds.map(id => {
      const baseEvolution = pokemon.find(p => p.id === id);
      if (!baseEvolution) return null;

      // Preserve form suffix when possible (e.g. deerling-summer -> sawsbuck-summer)
      const matchedForm =
        currentFormSuffix
          ? pokemon.find(
              p => p.baseId === id && p.name.toLowerCase().endsWith(`-${currentFormSuffix}`)
            )
          : null;

      const poke = matchedForm || baseEvolution;
      return poke ? { id: poke.id, baseId: poke.baseId, name: poke.name, displayName: poke.displayName } : null;
    }).filter(Boolean) as { id: number; baseId: number; name: string; displayName: string }[];
  }, [entry, pokemon, evolutionSourceId, currentFormSuffix]);

  // Check if current Pokemon can evolve
  const canEvolveThis = useMemo(() => {
    if (!evolutionSourceId) return false;
    return canEvolve(evolutionSourceId);
  }, [evolutionSourceId]);

  const currentSpriteUrl = useMemo(() => {
    if (!entry) return '';
    return getSelectedGameSpriteUrl({
      pokemonId: entry.pokemon_id,
      pokemonName: entry.pokemon_name,
      form: entry.form || undefined,
      gender: entry.gender || undefined,
      game: entry.game,
      secondaryGame: (entry as any).secondary_game || undefined,
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

      const nextForm = evolutionPokemon.id !== evolutionPokemon.baseId ? evolutionPokemon.name : null;

      // Generate the new sprite URL
      const newSpriteUrl = getSelectedGameSpriteUrl({
        pokemonId: selectedEvolution,
        pokemonName: evolutionPokemon.name,
        form: nextForm || undefined,
        gender: entry.gender || undefined,
        game: entry.game,
        secondaryGame: (entry as any).secondary_game || undefined,
      });
      const nextEntityKey = resolveEntityKeyForSelectedPokemon({
        pokemonId: selectedEvolution,
        pokemonName: evolutionPokemon.displayName,
        form: nextForm || evolutionPokemon.name,
      });
      const previousEntityKey = resolvePokemonEntityKey({
        pokemonId: entry.pokemon_id,
        pokemonName: entry.pokemon_name,
        form: entry.form,
        entityKey: entry.entity_key,
      });

      // Update the caught_shinies table
      let { error } = await supabase
        .from('caught_shinies')
        .update({
          pokemon_id: selectedEvolution,
          entity_key: nextEntityKey,
          pokemon_name: evolutionPokemon.displayName,
          sprite_url: newSpriteUrl,
          form: nextForm,
          is_evolved: true,
          evolved_from_entity_key: previousEntityKey,
        })
        .eq('id', entry.id)
        .eq('user_id', user.id);

      if (error && isMissingIsEvolvedColumn(error)) {
        const fallback = await supabase
          .from('caught_shinies')
          .update({
            pokemon_id: selectedEvolution,
            entity_key: nextEntityKey,
            pokemon_name: evolutionPokemon.displayName,
            sprite_url: newSpriteUrl,
            form: nextForm,
            evolved_from_entity_key: previousEntityKey,
          })
          .eq('id', entry.id)
          .eq('user_id', user.id);
        error = fallback.error;
      }

      if (error) throw error;

      toast({
        title: 'Evoluzione completata! 🎉',
        description: `${entry.pokemon_name} evolved into ${evolutionPokemon.displayName}!`,
      });
      
      onOpenChange(false);
      onSuccess();
      
      // Reset state
      setSelectedEvolution(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Unable to complete the evolution.',
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
            Select the evolution for {currentPokemon?.displayName || entry.pokemon_name}
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
                This Pokémon cannot evolve any further.
              </p>
            </div>
          ) : availableEvolutions.length === 0 ? (
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">
                No evolution is available for this Pokémon.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-white/80">Select the evolution:</p>
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
            >Cancel</Button>
            <Button
              onClick={handleEvolve}
              disabled={!selectedEvolution || loading || !canEvolveThis}
              className={cn(
                "flex-1",
                selectedEvolution && "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              )}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Evolving...' : 'Confirm Evolution'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
