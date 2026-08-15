import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Minus, Plus, RotateCcw, Cloud, CloudOff, Loader2, Check, Sparkles, X, ArrowUp, ArrowDown } from 'lucide-react';
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
import { calculateShinyStats, findHuntingMethod, HUNTING_METHODS, HuntingMethod, POKEMON_EGG_ICON, SHINY_CHARM_ICON, getGameSpecificSpriteUrl, formatOdds, isBreedingMethod } from '@/lib/pokemon-data';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { FinishHuntDialog } from './FinishHuntDialog';
import { useRandomColor } from '@/lib/random-color-context';
import { usePokemonDetails, formatPokemonName } from '@/hooks/use-pokemon';
import { cn } from '@/lib/utils';

interface ShinyCounterProps {
  huntId?: string;
  enableKeyboardShortcuts?: boolean;
  allowGlobalPlusMinusHotkeys?: boolean;
  compact?: boolean;
  showSetup?: boolean;
}

type PokemonSlot = {
  id: number | null;
  name: string;
  form: string;
  gender: string;
};

type PokemonDetails = ReturnType<typeof usePokemonDetails>['pokemon'];
type PersistedPokemonSlot = {
  id: number | null;
  name: string;
  form: string;
  gender: string;
};

const COUNTER_SLOTS_PREFIX = '__counter_slots_v1__:';
const COUNTER_SPRITE_EDGE_SHADOW = 'drop-shadow(0 1px 0 rgba(0,0,0,0.88)) drop-shadow(1px 0 0 rgba(0,0,0,0.72)) drop-shadow(0 3px 4px rgba(0,0,0,0.28))';

const getFormOptions = (pokemonDetails: PokemonDetails) => {
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
};

const normalizePersistedSlot = (slot?: Partial<PersistedPokemonSlot> | null): PersistedPokemonSlot => ({
  id: typeof slot?.id === 'number' ? slot.id : null,
  name: typeof slot?.name === 'string' ? slot.name : '',
  form: typeof slot?.form === 'string' ? slot.form : '',
  gender: typeof slot?.gender === 'string' ? slot.gender : '',
});

const encodePokemonSlots = (slots: PersistedPokemonSlot[]) => {
  const normalized = slots.map(normalizePersistedSlot).filter((slot) => slot.id);
  if (normalized.length <= 1) return normalized[0]?.name || '';
  return `${COUNTER_SLOTS_PREFIX}${JSON.stringify(normalized)}`;
};

const decodePokemonSlots = (
  savedName: string | null | undefined,
  pokemonId: number | null | undefined,
  form: string | null | undefined,
  gender: string | null | undefined
): PersistedPokemonSlot[] => {
  if (savedName?.startsWith(COUNTER_SLOTS_PREFIX)) {
    try {
      const parsed = JSON.parse(savedName.slice(COUNTER_SLOTS_PREFIX.length));
      if (Array.isArray(parsed)) {
        return [0, 1, 2].map((index) => normalizePersistedSlot(parsed[index]));
      }
    } catch {
      // Fall through to legacy single-Pokemon shape.
    }
  }

  return [
    normalizePersistedSlot({ id: pokemonId ?? null, name: savedName || '', form: form || '', gender: gender || '' }),
    normalizePersistedSlot(),
    normalizePersistedSlot(),
  ];
};

export function ShinyCounter({
  huntId,
  enableKeyboardShortcuts = true,
  allowGlobalPlusMinusHotkeys = true,
  compact = false,
  showSetup = true,
}: ShinyCounterProps) {
  const { user } = useAuth();
  const { accentColor } = useRandomColor();
  const [counter, setCounter] = useState(0);
  const [incrementAmount, setIncrementAmount] = useState(1);
  const [incrementHotkey, setIncrementHotkey] = useState('');
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const [selectedPokemonName, setSelectedPokemonName] = useState<string>('');
  const [selectedPokemon2Id, setSelectedPokemon2Id] = useState<number | null>(null);
  const [selectedPokemon2Name, setSelectedPokemon2Name] = useState<string>('');
  const [selectedPokemon3Id, setSelectedPokemon3Id] = useState<number | null>(null);
  const [selectedPokemon3Name, setSelectedPokemon3Name] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<HuntingMethod>(HUNTING_METHODS[0]);
  const [hasShinyCharm, setHasShinyCharm] = useState(false);
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [selectedPokemon2Form, setSelectedPokemon2Form] = useState<string>('');
  const [selectedPokemon3Form, setSelectedPokemon3Form] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedPokemon2Gender, setSelectedPokemon2Gender] = useState<string>('');
  const [selectedPokemon3Gender, setSelectedPokemon3Gender] = useState<string>('');
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
  const { pokemon: pokemon2Details } = usePokemonDetails(selectedPokemon2Id || 0);
  const { pokemon: pokemon3Details } = usePokemonDetails(selectedPokemon3Id || 0);
  const selectedPokemonSlots = useMemo(() => [
    { slot: 1, id: selectedPokemonId, name: selectedPokemonName, form: selectedForm, gender: selectedGender, details: pokemonDetails },
    { slot: 2, id: selectedPokemon2Id, name: selectedPokemon2Name, form: selectedPokemon2Form, gender: selectedPokemon2Gender, details: pokemon2Details },
    { slot: 3, id: selectedPokemon3Id, name: selectedPokemon3Name, form: selectedPokemon3Form, gender: selectedPokemon3Gender, details: pokemon3Details },
  ].filter((slot): slot is { slot: number; id: number; name: string; form: string; gender: string; details: PokemonDetails } => !!slot.id), [
    selectedPokemonId,
    selectedPokemonName,
    selectedForm,
    selectedGender,
    pokemonDetails,
    selectedPokemon2Id,
    selectedPokemon2Name,
    selectedPokemon2Form,
    selectedPokemon2Gender,
    pokemon2Details,
    selectedPokemon3Id,
    selectedPokemon3Name,
    selectedPokemon3Form,
    selectedPokemon3Gender,
    pokemon3Details,
  ]);

  // Load active hunt and playlists from Supabase when user is logged in
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const promises: any[] = [
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
          const savedSlots = decodePokemonSlots(data.pokemon_name, data.pokemon_id, (data as any).form, (data as any).gender);
          setSelectedPokemonId(savedSlots[0].id);
          setSelectedPokemonName(savedSlots[0].name);
          setSelectedForm(savedSlots[0].form);
          setSelectedGender(savedSlots[0].gender);
          setSelectedPokemon2Id(savedSlots[1].id);
          setSelectedPokemon2Name(savedSlots[1].name);
          setSelectedPokemon2Form(savedSlots[1].form);
          setSelectedPokemon2Gender(savedSlots[1].gender);
          setSelectedPokemon3Id(savedSlots[2].id);
          setSelectedPokemon3Name(savedSlots[2].name);
          setSelectedPokemon3Form(savedSlots[2].form);
          setSelectedPokemon3Gender(savedSlots[2].gender);
          setSelectedMethod(findHuntingMethod(data.method) ?? HUNTING_METHODS[0]);
          setHasShinyCharm(data.has_shiny_charm ?? false);
          setHuntCreatedAt(data.created_at);
        } else {
          // No hunt found for ID or no recent hunt. Reset to default new hunt state.
          activeHuntIdRef.current = null;
          setCounter(0);
          setIncrementAmount(1);
          setIncrementHotkey('');
          setSelectedPokemonId(null);
          setSelectedPokemonName('');
          setSelectedPokemon2Id(null);
          setSelectedPokemon2Name('');
          setSelectedPokemon2Form('');
          setSelectedPokemon2Gender('');
          setSelectedPokemon3Id(null);
          setSelectedPokemon3Name('');
          setSelectedPokemon3Form('');
          setSelectedPokemon3Gender('');
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
        const pokemonSlotsPayload = [
          { id: selectedPokemonId, name: selectedPokemonName, form: selectedForm, gender: selectedGender },
          { id: selectedPokemon2Id, name: selectedPokemon2Name, form: selectedPokemon2Form, gender: selectedPokemon2Gender },
          { id: selectedPokemon3Id, name: selectedPokemon3Name, form: selectedPokemon3Form, gender: selectedPokemon3Gender },
        ];
        const payload = {
          user_id: user.id,
          pokemon_id: selectedPokemonId,
          pokemon_name: encodePokemonSlots(pokemonSlotsPayload),
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
          const { error } = await supabase
            .from('active_hunts')
            .update(payload)
            .eq('id', activeHuntIdRef.current);
          if (error) throw error;
        } else {
          // Create new hunt only if we have user data
          const insertPayload = { ...payload, created_at: new Date().toISOString() };
          const { data, error } = await supabase.from('active_hunts').insert(insertPayload).select('id').single();
          if (error) throw error;
          if (data) {
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
  }, [user?.id, loading, counter, incrementAmount, incrementHotkey, selectedPokemonId, selectedPokemonName, selectedPokemon2Id, selectedPokemon2Name, selectedPokemon2Form, selectedPokemon2Gender, selectedPokemon3Id, selectedPokemon3Name, selectedPokemon3Form, selectedPokemon3Gender, selectedMethod, hasShinyCharm, selectedForm, selectedGender]);

  // Fast-sync variant/name changes so Hunts page reflects them immediately after navigation.
  useEffect(() => {
    if (!user || isInitialLoadRef.current) return;
    if (!activeHuntIdRef.current) return;
    const currentHuntId = activeHuntIdRef.current;

    const syncVariantNow = async () => {
      try {
        const pokemonSlotsPayload = [
          { id: selectedPokemonId, name: selectedPokemonName, form: selectedForm, gender: selectedGender },
          { id: selectedPokemon2Id, name: selectedPokemon2Name, form: selectedPokemon2Form, gender: selectedPokemon2Gender },
          { id: selectedPokemon3Id, name: selectedPokemon3Name, form: selectedPokemon3Form, gender: selectedPokemon3Gender },
        ];
        const payload = {
          pokemon_id: selectedPokemonId,
          pokemon_name: encodePokemonSlots(pokemonSlotsPayload),
          form: selectedForm || null,
          gender: selectedGender || null,
          method: selectedMethod.id,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('active_hunts')
          .update(payload)
          .eq('id', currentHuntId)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch {
        // non-blocking best-effort sync
      }
    };

    void syncVariantNow();
  }, [user?.id, selectedPokemonId, selectedPokemonName, selectedPokemon2Id, selectedPokemon2Name, selectedPokemon2Form, selectedPokemon2Gender, selectedPokemon3Id, selectedPokemon3Name, selectedPokemon3Form, selectedPokemon3Gender, selectedForm, selectedGender, selectedMethod.id]);

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

  const getPokemonSlot = useCallback((index: number): PokemonSlot => {
    if (index === 0) return { id: selectedPokemonId, name: selectedPokemonName, form: selectedForm, gender: selectedGender };
    if (index === 1) return { id: selectedPokemon2Id, name: selectedPokemon2Name, form: selectedPokemon2Form, gender: selectedPokemon2Gender };
    return { id: selectedPokemon3Id, name: selectedPokemon3Name, form: selectedPokemon3Form, gender: selectedPokemon3Gender };
  }, [
    selectedPokemonId,
    selectedPokemonName,
    selectedForm,
    selectedGender,
    selectedPokemon2Id,
    selectedPokemon2Name,
    selectedPokemon2Form,
    selectedPokemon2Gender,
    selectedPokemon3Id,
    selectedPokemon3Name,
    selectedPokemon3Form,
    selectedPokemon3Gender,
  ]);

  const setPokemonSlot = useCallback((index: number, slot: PokemonSlot) => {
    if (index === 0) {
      setSelectedPokemonId(slot.id);
      setSelectedPokemonName(slot.name);
      setSelectedForm(slot.form);
      setSelectedGender(slot.gender);
      return;
    }

    if (index === 1) {
      setSelectedPokemon2Id(slot.id);
      setSelectedPokemon2Name(slot.name);
      setSelectedPokemon2Form(slot.form);
      setSelectedPokemon2Gender(slot.gender);
      return;
    }

    setSelectedPokemon3Id(slot.id);
    setSelectedPokemon3Name(slot.name);
    setSelectedPokemon3Form(slot.form);
    setSelectedPokemon3Gender(slot.gender);
  }, []);

  const movePokemonSlot = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex > 2) return;

    const fromSlot = getPokemonSlot(fromIndex);
    if (!fromSlot.id) return;

    const toSlot = getPokemonSlot(toIndex);
    setPokemonSlot(fromIndex, toSlot);
    setPokemonSlot(toIndex, fromSlot);

    if (fromIndex === 0 || toIndex === 0) {
      skipNextVariantResetRef.current = true;
    }
  }, [getPokemonSlot, setPokemonSlot]);

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
      <div className={cn("w-full h-full", compact ? "mx-auto max-w-[390px] space-y-3" : "space-y-4")}>
        {/* Counter Display */}
        <div
          className={cn(
            "text-center",
            compact
              ? "space-y-3 px-2 py-3"
              : "space-y-4 rounded-lg border border-border/70 bg-card/70 p-4 text-card-foreground shadow-sm dark:border-white/15 dark:bg-[#171717]/95 dark:text-white dark:shadow-[0_18px_42px_rgba(0,0,0,0.42)]"
          )}
        >
          {/* Pokemon Sprite */}
          {selectedPokemonSlots.length > 0 && (
            <div key={`sprite-container-${selectedPokemonSlots.map((slot) => slot.id).join('-')}`} className={cn("relative group/sprite flex justify-center", compact ? "mb-5" : "mb-4")}>
              {(() => {
                return (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-wrap justify-center gap-2">
                      {selectedPokemonSlots.map((slot) => {
                        const slotFormOptions = getFormOptions(slot.details);
                        const currentVariant = slotFormOptions.find(f => f.name === slot.form);
                        const spriteId = currentVariant ? currentVariant.id : slot.id;
                        const eggMethod = isBreedingMethod(safeSelectedMethod.id);
                        const spriteUrl = getGameSpecificSpriteUrl(
                          spriteId || slot.id,
                          safeSelectedMethod.id,
                          slot.name,
                          slot.form,
                          slot.gender
                        );
                        const displaySpriteUrl = eggMethod ? POKEMON_EGG_ICON : spriteUrl;
                        const setSlotForm = slot.slot === 1
                          ? setSelectedForm
                          : slot.slot === 2
                            ? setSelectedPokemon2Form
                            : setSelectedPokemon3Form;
                        const setSlotGender = slot.slot === 1
                          ? setSelectedGender
                          : slot.slot === 2
                            ? setSelectedPokemon2Gender
                            : setSelectedPokemon3Gender;

                        return (
                          <div
                            key={`${slot.slot}-${slot.id}-${slot.name}`}
                            className={cn("flex flex-col items-center gap-1.5", compact ? "w-28 sm:w-32" : "w-32 sm:w-40")}
                          >
                            <img
                              src={displaySpriteUrl}
                              alt={slot.name}
                              className={cn(
                                "object-contain pokemon-sprite animate-in fade-in zoom-in duration-500",
                                compact ? "h-28 w-28 sm:h-[8.5rem] sm:w-[8.5rem]" : "h-32 w-32 sm:h-40 sm:w-40"
                              )}
                              style={{
                                imageRendering: 'auto',
                                filter: COUNTER_SPRITE_EDGE_SHADOW,
                              }}
                              loading="eager"
                              decoding="async"
                              onError={(e) => {
                                const image = e.target as HTMLImageElement;
                                image.src = eggMethod && !image.src.endsWith(POKEMON_EGG_ICON)
                                  ? POKEMON_EGG_ICON
                                  : '/placeholder.svg';
                              }}
                            />
                            {slotFormOptions.length > 0 && (
                              <Select value={slot.form || 'default'} onValueChange={(v) => setSlotForm(v === 'default' ? '' : v)}>
                                <SelectTrigger
                                  className="h-8 w-full px-2 rounded-full text-xs"
                                  style={{ borderColor: accentColor }}
                                >
                                  <div className="flex min-w-0 items-center gap-1.5 truncate">
                                    <Sparkles className="h-3 w-3 shrink-0" style={{ color: accentColor }} />
                                    <SelectValue placeholder="Forma base" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="default">Forma base</SelectItem>
                                  {slotFormOptions.map((f) => (
                                    <SelectItem key={f.name} value={f.name}>
                                      {f.displayName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {slot.details?.hasGenderDifference && (
                              <div className="flex w-full justify-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className={[
                                    "h-9 w-9 rounded-full border-2 bg-card text-lg font-bold shadow-sm transition-all duration-200 hover:bg-muted",
                                    slot.gender === 'female'
                                      ? "border-border text-blue-500 opacity-70 hover:opacity-100"
                                      : "border-blue-500 text-blue-500 ring-2 ring-blue-500/30 scale-105",
                                  ].join(' ')}
                                  onClick={() => setSlotGender('')}
                                  aria-pressed={slot.gender !== 'female'}
                                  title="Maschio"
                                >
                                  <span className="text-base leading-none" aria-hidden="true">♂</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className={[
                                    "h-9 w-9 rounded-full border-2 bg-card text-lg font-bold shadow-sm transition-all duration-200 hover:bg-muted",
                                    slot.gender === 'female'
                                      ? "border-pink-500 text-pink-500 ring-2 ring-pink-500/30 scale-105"
                                      : "border-border text-pink-500 opacity-70 hover:opacity-100",
                                  ].join(' ')}
                                  onClick={() => setSlotGender('female')}
                                  aria-pressed={slot.gender === 'female'}
                                  title="Femmina"
                                >
                                  <span className="text-base leading-none" aria-hidden="true">♀</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
              className={cn(
                "font-bold tabular-nums text-center border-2 bg-background focus:ring-0",
                compact ? "h-16 text-4xl" : "h-24 text-6xl"
              )}
              style={{
                fontSize: compact ? '3rem' : '4rem',
                color: accentColor,
                borderColor: accentColor,
                backgroundColor: 'var(--background)' // Force background color
              }}
            />
          ) : (
            <div
              onClick={handleCounterClick}
              className={cn(
                "font-bold tabular-nums cursor-pointer hover:scale-105 transition-transform duration-200 text-center flex justify-center items-center",
                compact ? "h-16 text-5xl" : "h-24 text-6xl"
              )}
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
          <div className="flex justify-center gap-3">
            <Button
              size="lg"
              onClick={decrement}
              variant={compact ? "default" : "outline"}
              className={cn("text-xl", compact ? "h-11 min-w-20 px-6" : "h-12 px-6 hover:bg-background")}
              style={{
                borderColor: compact ? undefined : accentColor,
                color: compact ? undefined : accentColor,
                backgroundColor: compact ? accentColor : undefined,
                boxShadow: compact ? `0 0 20px ${accentColor}40` : undefined,
              }}
            >
              <Minus className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              onClick={increment}
              className={cn("text-xl", compact ? "h-11 min-w-20 px-6" : "h-12 px-6")}
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
              className={cn(
                "w-16 h-8 text-center bg-background text-foreground",
                compact ? "border border-border/70 bg-background/80 text-foreground shadow-none dark:border-white/15 dark:bg-white/10 dark:text-white" : "border-2 border-input"
              )}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
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
              className={cn(
                "w-36 h-8 text-center bg-background text-foreground",
                compact ? "border border-border/70 bg-background/80 text-foreground shadow-none dark:border-white/15 dark:bg-white/10 dark:text-white" : "border-2 border-input"
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-8 px-3",
                compact && "border-border/70 bg-background/80 text-foreground hover:bg-muted hover:text-foreground dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:hover:text-white"
              )}
              onClick={() => setIncrementHotkey('')}
            >
              Reset
            </Button>
          </div>

          {user && !compact && (
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
        <Card
          className={cn(
            "border-border/70 bg-card/70 text-card-foreground shadow-sm dark:border-white/15 dark:bg-[#171717]/95 dark:text-white dark:shadow-[0_18px_42px_rgba(0,0,0,0.38)]",
            compact && "border-0 bg-transparent shadow-none dark:bg-transparent dark:shadow-none"
          )}
        >
          <CardContent className={cn("grid grid-cols-2 gap-3 text-center", compact ? "px-2 py-1" : "pt-4 pb-4")}>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">Odds</div>
              <div className="font-mono font-bold text-base sm:text-lg text-primary break-all">
                1 / {formatOdds(stats.currentOdds)}
              </div>
              <div className={cn("text-xs text-muted-foreground", compact && "hidden")}>
                {stats.percentage}%
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">Chance</div>
              <span className="font-mono font-bold text-base sm:text-lg text-primary">{stats.binomialProbability}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Setup Section */}
        {showSetup && (
        <Card className="border-border/70 bg-card/70 text-card-foreground shadow-sm dark:border-white/15 dark:bg-[#171717]/95 dark:text-white dark:shadow-[0_18px_42px_rgba(0,0,0,0.38)]">
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

              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => movePokemonSlot(0, 1)}
                  disabled={!selectedPokemonId}
                  title="Sposta giu Pokemon 1"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-3 pt-1">
                {[
                  {
                    label: 'Pokemon 2',
                    value: selectedPokemon2Id,
                    valueName: selectedPokemon2Name,
                    setId: setSelectedPokemon2Id,
                    setName: setSelectedPokemon2Name,
                    setForm: setSelectedPokemon2Form,
                    setGender: setSelectedPokemon2Gender,
                  },
                  {
                    label: 'Pokemon 3',
                    value: selectedPokemon3Id,
                    valueName: selectedPokemon3Name,
                    setId: setSelectedPokemon3Id,
                    setName: setSelectedPokemon3Name,
                    setForm: setSelectedPokemon3Form,
                    setGender: setSelectedPokemon3Gender,
                  },
                ].map((slot, index) => (
                  <div key={slot.label} className="flex items-end gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <Label className="text-xs text-muted-foreground">{slot.label}</Label>
                      <PokemonSelector
                        value={slot.value}
                        valueName={slot.valueName}
                        onChange={(id, name, baseId) => {
                          if (id === null) {
                            slot.setId(null);
                            slot.setName('');
                            slot.setForm('');
                            slot.setGender('');
                            return;
                          }

                          slot.setId(baseId ?? id);
                          slot.setName(name);
                          slot.setForm('');
                          slot.setGender('');
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => movePokemonSlot(index + 1, index)}
                      disabled={!slot.value}
                      title={`Sposta su ${slot.label}`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => movePokemonSlot(index + 1, index + 2)}
                      disabled={!slot.value || index === 1}
                      title={`Sposta giu ${slot.label}`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    {slot.value && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => {
                          slot.setId(null);
                          slot.setName('');
                          slot.setForm('');
                          slot.setGender('');
                        }}
                        title={`Rimuovi ${slot.label}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Method Selector */}
            <div className="space-y-2">
              <Label>Method</Label>
              <MethodSelector
                value={safeSelectedMethod.id}
                onChange={setSelectedMethod}
                currentOdds={stats.currentOdds}
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
        )}

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
