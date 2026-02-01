import { useState, useEffect, useCallback, useRef } from 'react';
import { Minus, Plus, RotateCcw, Cloud, CloudOff, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { PokemonSelector } from './PokemonSelector';
import { MethodSelector } from './MethodSelector';
import { calculateShinyStats, HUNTING_METHODS, HuntingMethod, SHINY_CHARM_ICON } from '@/lib/pokemon-data';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { FinishHuntDialog } from './FinishHuntDialog';

interface ShinyCounterProps {
  huntId?: string;
}

export function ShinyCounter({ huntId }: ShinyCounterProps) {
  const { user } = useAuth();
  const [counter, setCounter] = useState(0);
  const [incrementAmount, setIncrementAmount] = useState(1);
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const [selectedPokemonName, setSelectedPokemonName] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<HuntingMethod>(HUNTING_METHODS[0]);
  const [hasShinyCharm, setHasShinyCharm] = useState(false);
  const [customOdds, setCustomOdds] = useState(4096);
  const [loading, setLoading] = useState(!!user);
  const activeHuntIdRef = useRef<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isEditingCounter, setIsEditingCounter] = useState(false);
  const [tempCounterValue, setTempCounterValue] = useState('');
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([]);
  const isInitialLoadRef = useRef(true);

  // Load active hunt and playlists from Supabase when user is logged in
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const promises: Promise<any>[] = [
          supabase.from('shiny_playlists').select('id, name').eq('user_id', user.id)
        ];

        let huntToLoadId = huntId;
        // If no specific huntId is provided in URL, try to load the most recent active hunt for the user.
        // This is primarily for the multi-counter view to display an existing hunt by default.
        if (!huntToLoadId) {
          const { data: recentHuntData } = await supabase.from('active_hunts').select('id').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1).maybeSingle();
          if (recentHuntData) {
            huntToLoadId = recentHuntData.id;
          }
        }

        if (huntToLoadId) {
          promises.push(supabase.from('active_hunts').select('*').eq('id', huntToLoadId).maybeSingle());
        }

        const [playlistsRes, huntRes] = await Promise.all(promises);

        if (playlistsRes.data) {
          setPlaylists(playlistsRes.data);
        }

        if (huntRes && huntRes.data) {
          const data = huntRes.data;
          activeHuntIdRef.current = data.id;
          setCounter(data.counter ?? 0);
          setIncrementAmount(data.increment_amount ?? 1);
          setSelectedPokemonId(data.pokemon_id ?? null);
          setSelectedPokemonName(data.pokemon_name ?? '');
          setSelectedMethod(HUNTING_METHODS.find((m) => m.id === data.method) ?? HUNTING_METHODS[0]);
          setHasShinyCharm(data.has_shiny_charm ?? false);
        } else {
          // No hunt found for ID or no recent hunt. Reset to default new hunt state.
          activeHuntIdRef.current = null;
          setCounter(0);
          setIncrementAmount(1);
          setSelectedPokemonId(null);
          setSelectedPokemonName('');
          setSelectedMethod(HUNTING_METHODS[0]);
          setHasShinyCharm(false);
        }
      } catch {
        // Silently fail - use default state
      } finally {
        setLoading(false);
        // Mark initial load as complete after data is loaded
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 100);
      }
    };

    loadData();
  }, [user?.id, huntId]);

  // Save to Supabase when state changes (debounced)
  useEffect(() => {
    if (!user) return;

    // Skip auto-save during initial load to prevent duplicates
    if (isInitialLoadRef.current) return;

    const timer = setTimeout(async () => {
      // Only save if we have an existing hunt ID OR if user has actually started hunting
      // (selected a pokemon or has counter > 0)
      const hasValidHunt = activeHuntIdRef.current !== null;
      const hasUserData = selectedPokemonId !== null || counter > 0;

      if (!hasValidHunt && !hasUserData) {
        // Don't create a new hunt for default/empty state
        return;
      }

      setSaveStatus('saving');
      try {
        const payload = {
          user_id: user.id,
          pokemon_id: selectedPokemonId,
          pokemon_name: selectedPokemonName ?? '',
          method: selectedMethod.id,
          counter,
          has_shiny_charm: hasShinyCharm,
          increment_amount: incrementAmount,
          updated_at: new Date().toISOString(),
        };

        if (activeHuntIdRef.current) {
          // Update existing hunt
          await supabase
            .from('active_hunts')
            .update(payload)
            .eq('id', activeHuntIdRef.current);
        } else {
          // Create new hunt only if we have user data
          const { data, error } = await supabase.from('active_hunts').insert(payload).select('id').single();
          if (!error && data) activeHuntIdRef.current = data.id;
        }
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [user?.id, loading, counter, incrementAmount, selectedPokemonId, selectedPokemonName, selectedMethod, hasShinyCharm]);

  // Calculate stats based on current counter and method
  const stats = calculateShinyStats(counter, selectedMethod.id, hasShinyCharm, selectedMethod.id === 'custom' ? customOdds : undefined);

  const increment = () => setCounter((prev) => prev + incrementAmount);
  const decrement = () => setCounter((prev) => Math.max(0, prev - incrementAmount));

  const handleCounterClick = () => {
    setTempCounterValue(counter.toString());
    setIsEditingCounter(true);
  };

  const handleCounterBlur = () => {
    const newValue = parseInt(tempCounterValue);
    if (!isNaN(newValue) && newValue >= 0) {
      setCounter(newValue);
    }
    setIsEditingCounter(false);
  };

  const handleCounterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCounterBlur();
    } else if (e.key === 'Escape') {
      setIsEditingCounter(false);
    }
  };

  const getPokemonAnimatedSpriteUrl = (pokemonId: number | null): string | null => {
    if (!pokemonId) return null;
    // Try animated shiny sprite from Pokemon Showdown (Gen 5 B/W style)
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/${pokemonId}.gif`;
  };
  const reset = async () => {
    setCounter(0);
    if (user && activeHuntIdRef.current) {
      await supabase.from('active_hunts').update({ counter: 0 }).eq('id', activeHuntIdRef.current);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        increment();
      } else if (e.key === '-') {
        e.preventDefault();
        decrement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [incrementAmount]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-4">
      {/* Counter Display */}
      <div className="text-center space-y-4">
        {/* Pokemon Sprite */}
        {selectedPokemonId && (
          <div className="flex justify-center mb-4">
            <img
              src={getPokemonAnimatedSpriteUrl(selectedPokemonId) || ''}
              alt={selectedPokemonName}
              className="w-32 h-32 object-contain pokemon-sprite animate-in fade-in zoom-in duration-500"
              onError={(e) => {
                // Fallback to static shiny sprite if animated fails
                const target = e.target as HTMLImageElement;
                target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${selectedPokemonId}.png`;
              }}
            />
          </div>
        )}

        {/* Counter Number - Editable */}
        {isEditingCounter ? (
          <Input
            type="number"
            value={tempCounterValue}
            onChange={(e) => setTempCounterValue(e.target.value)}
            onBlur={handleCounterBlur}
            onKeyDown={handleCounterKeyDown}
            autoFocus
            className="text-6xl font-bold tabular-nums text-center h-24 border-2 border-primary"
            style={{ fontSize: '4rem' }}
          />
        ) : (
          <div
            onClick={handleCounterClick}
            className="text-6xl font-bold tabular-nums shiny-text cursor-pointer hover:scale-105 transition-transform duration-200"
            title="Click to edit counter"
          >
            {counter.toLocaleString()}
          </div>
        )}

        {/* Counter Buttons */}
        <div className="flex justify-center gap-2">
          <Button
            size="lg"
            variant="outline"
            onClick={decrement}
            className="h-12 px-6 text-xl"
          >
            <Minus className="h-5 w-5" />
          </Button>
          <Button
            size="lg"
            onClick={increment}
            className="h-12 px-6 text-xl shiny-glow"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Increment Amount */}
        <div className="flex items-center justify-center gap-2">
          <Label htmlFor="increment" className="text-xs text-muted-foreground">
            Step:
          </Label>
          <Input
            id="increment"
            type="number"
            min={1}
            value={incrementAmount}
            onChange={(e) => setIncrementAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 h-8 text-center"
          />
        </div>

        {user && (
          <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground h-6">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Salvataggio...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Cloud className="h-3 w-3" />
                <span>Salvato</span>
              </>
            ) : (
              <>
                <CloudOff className="h-3 w-3 text-destructive" />
                <span className="text-destructive">Errore</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Odds Correnti</div>
            <div className="font-mono font-bold text-lg text-primary">
              1 / {stats.currentOdds.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.percentage}%
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Prob. Totale</div>
            <span className="font-mono font-bold text-lg text-primary">{stats.binomialProbability}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Setup Section */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg">Setup</h3>

          {/* Pokemon Selector */}
          <div className="space-y-2">
            <Label>Pokémon</Label>
            <PokemonSelector
              value={selectedPokemonId}
              onChange={(id, name) => {
                setSelectedPokemonId(id);
                setSelectedPokemonName(name);
              }}
            />
          </div>

          {/* Method Selector */}
          <div className="space-y-2">
            <Label>Method</Label>
            <MethodSelector
              value={selectedMethod.id}
              onChange={setSelectedMethod}
            />
          </div>

          {/* Custom Odds (only if custom method selected) */}
          {selectedMethod.id === 'custom' && (
            <div className="space-y-2">
              <Label>Custom Odds (1 out of)</Label>
              <Input
                type="number"
                min={1}
                value={customOdds}
                onChange={(e) => setCustomOdds(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          )}

          {/* Shiny Charm Toggle */}
          {selectedMethod.supportsShinyCharm && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <img
                  src={SHINY_CHARM_ICON}
                  alt="Shiny Charm"
                  className="h-6 w-6 pokemon-sprite"
                />
                <Label htmlFor="shiny-charm">Shiny Charm</Label>
              </div>
              <Switch
                id="shiny-charm"
                checked={hasShinyCharm}
                onCheckedChange={setHasShinyCharm}
              />
            </div>
          )}

          {/* Finish Hunt Button - only show if user is logged in and hunt exists */}
          {user && activeHuntIdRef.current && selectedPokemonId && (
            <Button
              variant="default"
              onClick={() => setIsFinishDialogOpen(true)}
              className="w-full shiny-glow"
            >
              <Check className="mr-2 h-4 w-4" />
              Termina caccia e salva
            </Button>
          )}

          {/* Reset Button */}
          <Button
            variant="destructive"
            onClick={reset}
            className="w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Counter
          </Button>
        </CardContent>
      </Card>

      <FinishHuntDialog
        open={isFinishDialogOpen}
        onOpenChange={setIsFinishDialogOpen}
        huntId={activeHuntIdRef.current || ''}
        pokemonId={selectedPokemonId || 0}
        pokemonName={selectedPokemonName}
        counter={counter}
        method={selectedMethod.id}
        hasShinyCharm={hasShinyCharm}
        playlists={playlists}
      />
    </div>
  );
}
