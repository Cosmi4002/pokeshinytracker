import { useState, useEffect, useCallback, useRef } from 'react';
import { Minus, Plus, RotateCcw, Cloud, CloudOff, Loader2 } from 'lucide-react';
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

export function ShinyCounter() {
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

  // Load active hunt from Supabase when user is logged in
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadHunt = async () => {
      try {
        const { data, error } = await supabase
          .from('active_hunts')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          activeHuntIdRef.current = data.id;
          setCounter(data.counter ?? 0);
          setIncrementAmount(data.increment_amount ?? 1);
          setSelectedPokemonId(data.pokemon_id ?? null);
          setSelectedPokemonName(data.pokemon_name ?? '');
          setSelectedMethod(HUNTING_METHODS.find((m) => m.id === data.method) ?? HUNTING_METHODS[0]);
          setHasShinyCharm(data.has_shiny_charm ?? false);
        }
      } catch {
        // Silently fail - use default state
      } finally {
        setLoading(false);
      }
    };

    loadHunt();
  }, [user?.id]);

  // Save to Supabase when state changes (debounced)
  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(async () => {
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
          await supabase
            .from('active_hunts')
            .update(payload)
            .eq('id', activeHuntIdRef.current);
        } else {
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

  // Calculate current odds based on method and shiny charm
  const getCurrentOdds = useCallback(() => {
    if (selectedMethod.id === 'custom') {
      return customOdds;
    }
    if (hasShinyCharm && selectedMethod.supportsShinyCharm && selectedMethod.shinyCharmOdds) {
      return selectedMethod.shinyCharmOdds;
    }
    return selectedMethod.baseOdds;
  }, [selectedMethod, hasShinyCharm, customOdds]);

  const stats = calculateShinyStats(counter, getCurrentOdds());

  const increment = () => setCounter((prev) => prev + incrementAmount);
  const decrement = () => setCounter((prev) => Math.max(0, prev - incrementAmount));
  const reset = async () => {
    setCounter(0);
    if (user && activeHuntIdRef.current) {
      try {
        await supabase.from('active_hunts').update({ counter: 0, updated_at: new Date().toISOString() }).eq('id', activeHuntIdRef.current);
      } catch {
        // Silently fail
      }
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
      <div className="w-full max-w-lg mx-auto flex justify-center py-12">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {/* Counter Display */}
      <div className="text-center space-y-4">
        <div className="text-8xl font-bold tabular-nums shiny-text">
          {counter.toLocaleString()}
        </div>

        {/* Counter Buttons */}
        <div className="flex justify-center gap-2">
          <Button
            size="lg"
            variant="outline"
            onClick={decrement}
            className="h-14 px-8 text-2xl"
          >
            <Minus className="h-6 w-6" />
          </Button>
          <Button
            size="lg"
            onClick={increment}
            className="h-14 px-8 text-2xl shiny-glow"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {/* Increment Amount */}
        <div className="flex items-center justify-center gap-2">
          <Label htmlFor="increment" className="text-sm text-muted-foreground">
            Amount to increase/decrease by:
          </Label>
          <Input
            id="increment"
            type="number"
            min={1}
            value={incrementAmount}
            onChange={(e) => setIncrementAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 h-8 text-center"
          />
        </div>

        {user && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground animate-in fade-in h-6">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Cloud className="h-3 w-3" />
                Saved to cloud
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <CloudOff className="h-3 w-3 text-destructive" />
                <span className="text-destructive">Sync error</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Statistics */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Probability:</span>
            <span className="font-mono font-semibold text-lg">{stats.probability}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Binomial Probability:</span>
            <span className="font-mono font-semibold text-lg">{stats.binomialProbability}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Until 50%:</span>
            <span className="font-mono font-semibold text-lg">{stats.until50.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Until 90%:</span>
            <span className="font-mono font-semibold text-lg">{stats.until90.toLocaleString()}</span>
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
    </div>
  );
}
