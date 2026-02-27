import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Minus, Plus, RotateCcw, Cloud, CloudOff, Loader2, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PokemonSelector } from './PokemonSelector';
import { MethodSelector } from './MethodSelector';
import { calculateShinyStats, HUNTING_METHODS, HuntingMethod, SHINY_CHARM_ICON, getGameSpecificSpriteUrl } from '@/lib/pokemon-data';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { FinishHuntDialog } from './FinishHuntDialog';
import { useRandomColor } from '@/lib/random-color-context';
import { usePokemonDetails, formatPokemonName } from '@/hooks/use-pokemon';

interface ShinyCounterProps {
  huntId?: string;
  enableKeyboardShortcuts?: boolean;
  allowGlobalPlusMinusHotkeys?: boolean;
}

export function ShinyCounter({
  huntId,
  enableKeyboardShortcuts = true,
  allowGlobalPlusMinusHotkeys = true,
}: ShinyCounterProps) {
  const { user } = useAuth();
  const { accentColor } = useRandomColor();
  const [counter, setCounter] = useState(0);
  const [incrementAmount, setIncrementAmount] = useState(1);
  const [incrementHotkey, setIncrementHotkey] = useState('');
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const [selectedPokemonName, setSelectedPokemonName] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<HuntingMethod>(HUNTING_METHODS[0]);
  const [hasShinyCharm, setHasShinyCharm] = useState(false);
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [customOdds, setCustomOdds] = useState(4096);
  const [loading, setLoading] = useState(!!user);
  const activeHuntIdRef = useRef<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isEditingCounter, setIsEditingCounter] = useState(false);
  const [tempCounterValue, setTempCounterValue] = useState('');
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isAssigningHotkey, setIsAssigningHotkey] = useState(false);
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([]);
  const [huntCreatedAt, setHuntCreatedAt] = useState<string | null>(null);
  const isInitialLoadRef = useRef(true);
  const skipNextVariantResetRef = useRef(false);

  const { pokemon: pokemonDetails } = usePokemonDetails(selectedPokemonId || 0);

  // Build all forms/varieties from pokemon details without exclusion filters.
  const formOptions = useMemo(() => {
    if (!pokemonDetails) return [];

    const items: { id: number, name: string, displayName: string }[] = [];

    pokemonDetails.forms.forEach((f) => {
      if (f.formName === pokemonDetails.name) return;
      if (items.some((i) => i.name === f.formName)) return;
      items.push({
        id: f.id,
        name: f.formName,
        displayName: f.displayName,
      });
    });

    pokemonDetails.varieties.forEach((v) => {
      if (v.isDefault) return;
      if (items.some((i) => i.name === v.pokemon.name)) return;
      items.push({
        id: v.pokemon.id,
        name: v.pokemon.name,
        displayName: formatPokemonName(v.pokemon.name, v.pokemon.id, pokemonDetails.baseId),
      });
    });

    return items.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [pokemonDetails]);

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
          setIncrementHotkey(data.increment_hotkey ?? '');
          setSelectedPokemonId(data.pokemon_id ?? null);
          setSelectedPokemonName(data.pokemon_name ?? '');
          setSelectedMethod(HUNTING_METHODS.find((m) => m.id === data.method) ?? HUNTING_METHODS[0]);
          setHasShinyCharm(data.has_shiny_charm ?? false);
          setSelectedForm(data.form ?? '');
          setSelectedGender(data.gender ?? '');
          setHuntCreatedAt(data.created_at);
        } else {
          // No hunt found for ID or no recent hunt. Reset to default new hunt state.
          activeHuntIdRef.current = null;
          setCounter(0);
          setIncrementAmount(1);
          setIncrementHotkey('');
          setSelectedPokemonId(null);
          setSelectedPokemonName('');
          setSelectedMethod(HUNTING_METHODS[0]);
          setHasShinyCharm(false);
          setSelectedForm('');
          setSelectedGender('');
          setHuntCreatedAt(null);
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

  // Sync state and clear variants when Pokémon changes
  useEffect(() => {
    if (selectedPokemonId) {
      const isInitial = isInitialLoadRef.current;
      if (skipNextVariantResetRef.current) {
        skipNextVariantResetRef.current = false;
        return;
      }
      // If we're not in the initial load of a hunt (which sets its own variants),
      // reset form/gender to avoid stale variant data from the previous Pokemon
      if (!isInitial) {
        setSelectedForm('');
        setSelectedGender('');
      }
    }
  }, [selectedPokemonId]);

  // Handle pre-selection from query params (e.g. ?pokemon=bulbasaur)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pokemonName = params.get('pokemon');
    if (pokemonName && !activeHuntIdRef.current) {
      // We set the name, and PokemonSelector will likely need to resolve the ID
      // or we can just hope the name is enough for initial display.
      setSelectedPokemonName(pokemonName);
    }
  }, []);

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
          increment_hotkey: incrementHotkey || null,
          form: selectedForm || null,
          gender: selectedGender || null,
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
          const insertPayload = { ...payload, created_at: new Date().toISOString() };
          const { data, error } = await supabase.from('active_hunts').insert(insertPayload).select('id').single();
          if (!error && data) {
            activeHuntIdRef.current = data.id;
            setHuntCreatedAt(insertPayload.created_at);
          }
        }
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [user?.id, loading, counter, incrementAmount, incrementHotkey, selectedPokemonId, selectedPokemonName, selectedMethod, hasShinyCharm, selectedForm, selectedGender]);

  // Fast-sync variant/name changes so Hunts page reflects them immediately after navigation.
  useEffect(() => {
    if (!user || isInitialLoadRef.current) return;
    if (!activeHuntIdRef.current) return;

    const syncVariantNow = async () => {
      try {
        await supabase
          .from('active_hunts')
          .update({
            pokemon_id: selectedPokemonId,
            pokemon_name: selectedPokemonName ?? '',
            form: selectedForm || null,
            gender: selectedGender || null,
            method: selectedMethod.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', activeHuntIdRef.current)
          .eq('user_id', user.id);
      } catch {
        // non-blocking best-effort sync
      }
    };

    void syncVariantNow();
  }, [user?.id, selectedPokemonId, selectedPokemonName, selectedForm, selectedGender, selectedMethod.id]);

  // Calculate stats based on current counter and method
  const stats = useMemo(() => {
    if (!selectedMethod) return calculateShinyStats(0, HUNTING_METHODS[0].id, false);
    return calculateShinyStats(counter, selectedMethod.id, hasShinyCharm, selectedMethod.id === 'custom' ? customOdds : undefined);
  }, [counter, selectedMethod, hasShinyCharm, customOdds]);

  const increment = () => setCounter((prev) => prev + incrementAmount);
  const decrement = () => setCounter((prev) => Math.max(0, prev - incrementAmount));

  const normalizeHotkey = useCallback((rawKey: string) => {
    if (rawKey === ' ') return 'space';
    return rawKey.toLowerCase();
  }, []);

  const formatHotkeyLabel = useCallback((hotkey: string) => {
    if (!hotkey) return 'Nessuno';
    if (hotkey === 'space') return 'Space';
    if (hotkey.length === 1) return hotkey.toUpperCase();
    return hotkey.charAt(0).toUpperCase() + hotkey.slice(1);
  }, []);

  const handleHotkeyAssignment = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      setIsAssigningHotkey(false);
      return;
    }

    e.preventDefault();

    if (e.key === 'Escape') {
      setIsAssigningHotkey(false);
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      setIncrementHotkey('');
      setIsAssigningHotkey(false);
      return;
    }

    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

    setIncrementHotkey(normalizeHotkey(e.key));
    setIsAssigningHotkey(false);
  }, [normalizeHotkey]);

  // Ensure selectedMethod is never null in render
  const safeSelectedMethod = selectedMethod || HUNTING_METHODS[0];

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

  const reset = async () => {
    setCounter(0);
    if (user && activeHuntIdRef.current) {
      await supabase.from('active_hunts').update({ counter: 0 }).eq('id', activeHuntIdRef.current);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      const pressedKey = normalizeHotkey(e.key);
      if (incrementHotkey && pressedKey === incrementHotkey) {
        e.preventDefault();
        increment();
        return;
      }

      if (allowGlobalPlusMinusHotkeys) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          increment();
        } else if (e.key === '-') {
          e.preventDefault();
          decrement();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allowGlobalPlusMinusHotkeys, enableKeyboardShortcuts, incrementAmount, incrementHotkey, normalizeHotkey]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  try {
    return (
      <div className="w-full h-full space-y-3">
        {/* Counter Display */}
        <div className="text-center space-y-4">
          {/* Pokemon Sprite */}
          {selectedPokemonId && (
            <div key={`sprite-container-${selectedPokemonId}`} className="relative group/sprite flex justify-center mb-4">
              {(() => {
                const currentVariant = formOptions.find(f => f.name === selectedForm);
                const displayId = currentVariant ? currentVariant.id : selectedPokemonId;

                const spriteUrl = getGameSpecificSpriteUrl(displayId, safeSelectedMethod.id, selectedPokemonName, selectedForm, selectedGender);

                return (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      key={spriteUrl}
                      src={spriteUrl}
                      alt={selectedPokemonName}
                      className="w-40 h-40 object-contain pokemon-sprite animate-in fade-in zoom-in duration-500"
                      style={{ imageRendering: 'auto' }}
                      loading="eager"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />

                    {/* Variant/Gender Controls */}
                    <div className="flex flex-col items-center gap-1.5 mt-2 w-full">
                      {formOptions.length > 0 && (
                        <Select value={selectedForm || 'default'} onValueChange={(v) => setSelectedForm(v === 'default' ? '' : v)}>
                          <SelectTrigger
                            className="h-8 min-w-[200px] max-w-[340px] px-3 rounded-full text-xs"
                            style={{ borderColor: accentColor }}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Sparkles className="h-3 w-3" style={{ color: accentColor }} />
                              <SelectValue placeholder="Forma base" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Forma base</SelectItem>
                            {formOptions.map((f) => (
                              <SelectItem key={f.name} value={f.name}>
                                {f.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {pokemonDetails?.hasGenderDifference && (
                        <Select value={selectedGender || 'male'} onValueChange={(v) => setSelectedGender(v === 'female' ? 'female' : '')}>
                          <SelectTrigger
                            className="h-8 min-w-[140px] px-3 rounded-full text-xs"
                            style={{ borderColor: accentColor }}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Maschio</SelectItem>
                            <SelectItem value="female">Femmina</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                );
              })()}
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
              className="text-6xl font-bold tabular-nums text-center h-24 border-2 bg-background focus:ring-0"
              style={{
                fontSize: '4rem',
                color: accentColor,
                borderColor: accentColor,
                backgroundColor: 'var(--background)' // Force background color
              }}
            />
          ) : (
            <div
              onClick={handleCounterClick}
              className="text-6xl font-bold tabular-nums cursor-pointer hover:scale-105 transition-transform duration-200 text-center flex justify-center items-center h-24"
              title="Click to edit counter"
            >
              <span
                style={{
                  color: accentColor,
                  filter: `drop-shadow(0 0 15px ${accentColor}60)`
                }}
                className="transition-all duration-300"
              >
                {counter.toLocaleString()}
              </span>
            </div>
          )}

          {/* Counter Buttons */}
          <div className="flex justify-center gap-2">
            <Button
              size="lg"
              onClick={decrement}
              variant="outline"
              className="h-12 px-6 text-xl hover:bg-background"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              <Minus className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              onClick={increment}
              className="h-12 px-6 text-xl"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 20px ${accentColor}40`
              }}
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
              className="w-16 h-8 text-center bg-white text-black border-2 border-input"
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            <Label htmlFor="increment-hotkey" className="text-xs text-muted-foreground">
              Tasto +1:
            </Label>
            <Input
              id="increment-hotkey"
              value={isAssigningHotkey ? 'Premi un tasto...' : formatHotkeyLabel(incrementHotkey)}
              readOnly
              onFocus={() => setIsAssigningHotkey(true)}
              onBlur={() => setIsAssigningHotkey(false)}
              onKeyDown={handleHotkeyAssignment}
              className="w-36 h-8 text-center bg-white text-black border-2 border-input"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3"
              onClick={() => setIncrementHotkey('')}
            >
              Reset
            </Button>
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
          <CardContent className="pt-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Odds Correnti</div>
              <div className="font-mono font-bold text-base sm:text-lg text-primary break-all">
                1 / {stats.currentOdds.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.percentage}%
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Prob. Totale</div>
              <span className="font-mono font-bold text-base sm:text-lg text-primary">{stats.binomialProbability}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Setup Section */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <h3 className="font-semibold text-lg">Setup</h3>

            {/* Pokemon Selector */}
            <div className="space-y-2">
              <Label>Pokémon</Label>
              <PokemonSelector
                value={selectedPokemonId}
                valueName={selectedPokemonName}
                onChange={(id, name, baseId) => {
                  if (id === null) {
                    setSelectedPokemonId(null);
                    setSelectedPokemonName('');
                    setSelectedForm('');
                    setSelectedGender('');
                    return;
                  }

                  const isFemaleVariant = name.endsWith('-female');
                  const isMaleVariant = name.endsWith('-male');
                  const resolvedBaseId = baseId ?? id;
                  const isDirectVariantSelection = resolvedBaseId !== id || isFemaleVariant || isMaleVariant;
                  skipNextVariantResetRef.current = isDirectVariantSelection;

                  setSelectedPokemonId(resolvedBaseId);
                  setSelectedPokemonName(name);

                  if (isFemaleVariant) {
                    setSelectedGender('female');
                    setSelectedForm('');
                  } else if (isMaleVariant) {
                    setSelectedGender('');
                    setSelectedForm('');
                  } else if (resolvedBaseId !== id) {
                    // Selecting a variant directly from the picker should also preselect the form.
                    setSelectedForm(name);
                    setSelectedGender('');
                  } else {
                    setSelectedForm('');
                    setSelectedGender('');
                  }
                }}
              />
            </div>

            {/* Method Selector */}
            <div className="space-y-2">
              <Label>Method</Label>
              <MethodSelector
                value={safeSelectedMethod.id}
                onChange={setSelectedMethod}
              />
            </div>

            {/* Custom Odds (only if custom method selected) */}
            {safeSelectedMethod.id === 'custom' && (
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
            {safeSelectedMethod.supportsShinyCharm && (
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'color-mix(in srgb, var(--muted), transparent 50%)' }}
              >
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
              variant="secondary"
              onClick={() => setIsResetDialogOpen(true)}
              className="w-full transition-all duration-300 hover:scale-[1.02]"
              style={{
                boxShadow: `0 0 15px ${accentColor}40`,
                border: `1px solid ${accentColor}60`
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" style={{ color: accentColor }} />
              Reset Counter
            </Button>
          </CardContent>
        </Card>

        <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
              <AlertDialogDescription>
                Questa azione riporterà il counter a 0. I dati salvati verranno aggiornati.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                reset();
                setIsResetDialogOpen(false);
              }}>Conferma</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <FinishHuntDialog
          open={isFinishDialogOpen}
          onOpenChange={setIsFinishDialogOpen}
          huntId={activeHuntIdRef.current || ''}
          pokemonId={selectedPokemonId || 0}
          pokemonName={selectedPokemonName}
          counter={counter}
          method={safeSelectedMethod.id}
          hasShinyCharm={hasShinyCharm}
          playlists={playlists}
          startDate={huntCreatedAt}
          initialForm={selectedForm}
          initialGender={selectedGender}
        />
      </div>
    );
  } catch (err: any) {
    return (
      <div className="p-4 border-2 border-destructive bg-destructive/10 rounded-lg text-destructive">
        <h3 className="font-bold mb-2">Errore di rendering</h3>
        <pre className="text-xs overflow-auto max-h-40">{err.message}</pre>
        <pre className="text-[10px] mt-2 opacity-50 overflow-auto">{err.stack}</pre>
      </div>
    );
  }
}
