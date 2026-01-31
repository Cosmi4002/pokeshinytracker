import { useState, useEffect, useCallback } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { PokemonSelector } from './PokemonSelector';
import { MethodSelector } from './MethodSelector';
import { calculateShinyStats, HUNTING_METHODS, HuntingMethod, SHINY_CHARM_ICON } from '@/lib/pokemon-data';
import { getPokemonSpriteUrl } from '@/hooks/use-pokemon';

export function ShinyCounter() {
  const [counter, setCounter] = useState(0);
  const [incrementAmount, setIncrementAmount] = useState(1);
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const [selectedPokemonName, setSelectedPokemonName] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<HuntingMethod>(HUNTING_METHODS[0]);
  const [hasShinyCharm, setHasShinyCharm] = useState(false);
  const [customOdds, setCustomOdds] = useState(4096);

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

  const increment = () => setCounter(prev => prev + incrementAmount);
  const decrement = () => setCounter(prev => Math.max(0, prev - incrementAmount));
  const reset = () => setCounter(0);

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
