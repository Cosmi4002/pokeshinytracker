import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Dice5, Gamepad2, Grid3X3, Pencil, RefreshCcw, Shuffle, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { PokemonSelector } from '@/components/counter/PokemonSelector';
import { usePokemonList, getPokemonSpriteUrl, PokemonBasic } from '@/hooks/use-pokemon';
import { useRandomColor } from '@/lib/random-color-context';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SIZE_OPTIONS = [5] as const;
const STORAGE_KEY = 'bingo-shiny-state';
const MARK_COLOR = '#22c55e';
const GAME_ID_BASE = 20000;

interface GameCell {
  readonly type: 'game';
  readonly id: number;
  readonly name: string;
  readonly generation: number;
  readonly logo: string;
}

type BingoCell = PokemonBasic | GameCell;

const GAMES: Pick<GameCell, 'id' | 'name' | 'generation' | 'logo'>[] = [
  // Gen 3
  { id: GAME_ID_BASE + 0, name: 'Ruby', generation: 3, logo: '/img/game-logos/ruby.png' },
  { id: GAME_ID_BASE + 1, name: 'Sapphire', generation: 3, logo: '/img/game-logos/sapphire.png' },
  { id: GAME_ID_BASE + 2, name: 'Emerald', generation: 3, logo: '/img/game-logos/emerald.png' },
  { id: GAME_ID_BASE + 3, name: 'FireRed', generation: 3, logo: '/img/game-logos/firered.png' },
  { id: GAME_ID_BASE + 4, name: 'LeafGreen', generation: 3, logo: '/img/game-logos/leafgreen.png' },
  // Gen 4
  { id: GAME_ID_BASE + 5, name: 'Diamond', generation: 4, logo: '/img/game-logos/diamond.png' },
  { id: GAME_ID_BASE + 6, name: 'Pearl', generation: 4, logo: '/img/game-logos/pearl.png' },
  { id: GAME_ID_BASE + 7, name: 'Platinum', generation: 4, logo: '/img/game-logos/platinum.png' },
  { id: GAME_ID_BASE + 8, name: 'HeartGold', generation: 4, logo: '/img/game-logos/heartgold.png' },
  { id: GAME_ID_BASE + 9, name: 'SoulSilver', generation: 4, logo: '/img/game-logos/soulsilver.png' },
  // Gen 5
  { id: GAME_ID_BASE + 10, name: 'Black', generation: 5, logo: '/img/game-logos/black.png' },
  { id: GAME_ID_BASE + 11, name: 'White', generation: 5, logo: '/img/game-logos/white.png' },
  { id: GAME_ID_BASE + 12, name: 'Black 2', generation: 5, logo: '/img/game-logos/black2.png' },
  { id: GAME_ID_BASE + 13, name: 'White 2', generation: 5, logo: '/img/game-logos/white2.png' },
  // Gen 6
  { id: GAME_ID_BASE + 14, name: 'X', generation: 6, logo: '/img/game-logos/x.png' },
  { id: GAME_ID_BASE + 15, name: 'Y', generation: 6, logo: '/img/game-logos/y.png' },
  { id: GAME_ID_BASE + 16, name: 'Omega Ruby', generation: 6, logo: '/img/game-logos/omegaruby.png' },
  { id: GAME_ID_BASE + 17, name: 'Alpha Sapphire', generation: 6, logo: '/img/game-logos/alphasapphire.png' },
  // Gen 7
  { id: GAME_ID_BASE + 18, name: 'Sun', generation: 7, logo: '/img/game-logos/sun.png' },
  { id: GAME_ID_BASE + 19, name: 'Moon', generation: 7, logo: '/img/game-logos/moon.png' },
  { id: GAME_ID_BASE + 20, name: 'Ultra Sun', generation: 7, logo: '/img/game-logos/ultrasun.png' },
  { id: GAME_ID_BASE + 21, name: 'Ultra Moon', generation: 7, logo: '/img/game-logos/ultramoon.png' },
  { id: GAME_ID_BASE + 22, name: "Let's Go Pikachu", generation: 7, logo: '/img/game-logos/lgp.png' },
  { id: GAME_ID_BASE + 23, name: "Let's Go Eevee", generation: 7, logo: '/img/game-logos/lge.png' },
  // Gen 8
  { id: GAME_ID_BASE + 24, name: 'Sword', generation: 8, logo: '/img/game-logos/sword.png' },
  { id: GAME_ID_BASE + 25, name: 'Shield', generation: 8, logo: '/img/game-logos/shield.png' },
  { id: GAME_ID_BASE + 26, name: 'Brilliant Diamond', generation: 8, logo: '/img/game-logos/brilliantdiamond.png' },
  { id: GAME_ID_BASE + 27, name: 'Shining Pearl', generation: 8, logo: '/img/game-logos/shiningpearl.png' },
  // Gen 9
  { id: GAME_ID_BASE + 29, name: 'Scarlet', generation: 9, logo: '/img/game-logos/scarlet.png' },
  { id: GAME_ID_BASE + 30, name: 'Violet', generation: 9, logo: '/img/game-logos/violet.png' },
  { id: GAME_ID_BASE + 28, name: 'Legends Arceus', generation: 8, logo: '/img/game-logos/pla.png' },
  { id: GAME_ID_BASE + 31, name: 'Pokemon Legends Z-A', generation: 9, logo: '/img/game-logos/za.png' },
];

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

type PersistedState = {
  gridSize?: number;
  gridIds?: number[];
  markedIds?: number[];
  generations?: number[];
  includeGames?: boolean;
  gameRatio?: number;
  selectedGameIds?: number[];
  randomPokemonId?: number | null;
  randomPokemonName?: string | null;
  randomGenerationFilter?: number | 'all' | null;
};

export default function Games() {
  const { pokemon, loading } = usePokemonList();
  const { accentColor } = useRandomColor();
  const { user } = useAuth();
  const randomSpriteOutlineId = `random-sprite-outline-${useId().replace(/:/g, '')}`;

  const [gridSize, setGridSize] = useState<(typeof SIZE_OPTIONS)[number]>(5);
  const [pendingGridSize, setPendingGridSize] = useState<(typeof SIZE_OPTIONS)[number]>(5);

  const [includeGames, setIncludeGames] = useState(true);
  const [gameRatio, setGameRatio] = useState(0.2);
  const [replaceMode, setReplaceMode] = useState(false);
  const [selectedGameIds, setSelectedGameIds] = useState<Set<number>>(() => new Set(GAMES.map((g) => g.id)));
  const [gamePickerOpen, setGamePickerOpen] = useState(false);

  const [includedGenerations, setIncludedGenerations] = useState<Set<number>>(new Set());
  const [pendingGenerations, setPendingGenerations] = useState<Set<number>>(new Set());
  const [gensTouched, setGensTouched] = useState(false);

  const [gridIds, setGridIds] = useState<number[]>([]);
  const [marked, setMarked] = useState<Set<number>>(new Set()); // indices 0..(gridIds.length-1)

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetIndex, setPickerTargetIndex] = useState<number | null>(null);
  const [pickerValue, setPickerValue] = useState<number | null>(null);
  const [pickerValueName, setPickerValueName] = useState<string | undefined>(undefined);
  const [pickerMode, setPickerMode] = useState<'pokemon' | 'logo'>('pokemon');
  const [randomPokemon, setRandomPokemon] = useState<PokemonBasic | null>(null);
  const [randomGenerationFilter, setRandomGenerationFilter] = useState<'all' | number>('all');

  const saveTimerRef = useRef<number | null>(null);
  const didInitRef = useRef(false);

  const basePool = useMemo(() => {
    const byBase = new Map<number, PokemonBasic>();
    pokemon.forEach((p) => {
      if (p.hideFromPokedex) return;
      // Never include shiny locked / no own OT in bingo.
      if (p.shinyAvailability && p.shinyAvailability !== 'ok') return;
      const baseId = p.baseId ?? p.id;
      const existing = byBase.get(baseId);
      if (!existing || p.id === baseId) byBase.set(baseId, p);
    });
    return Array.from(byBase.values());
  }, [pokemon]);

  const allRandomPokemon = useMemo(() => {
    const byName = new Map<string, PokemonBasic>();
    pokemon.forEach((p) => {
      if (p.hideFromPokedex) return;
      // Event / No Own OT Pokémon are obtainable and remain eligible.
      // Only genuinely shiny-locked Pokémon are excluded.
      if (p.shinyAvailability === 'unobtainable') return;
      if (!byName.has(p.name)) byName.set(p.name, p);
    });
    return Array.from(byName.values());
  }, [pokemon]);

  const randomAvailableGenerations = useMemo(() => {
    const gens = new Set<number>();
    allRandomPokemon.forEach((p) => {
      if (typeof p.generation === 'number') gens.add(p.generation);
    });
    return Array.from(gens).sort((a, b) => a - b);
  }, [allRandomPokemon]);

  const randomPokemonPool = useMemo(() => {
    if (randomGenerationFilter === 'all') return allRandomPokemon;
    return allRandomPokemon.filter((p) => p.generation === randomGenerationFilter);
  }, [allRandomPokemon, randomGenerationFilter]);

  const availableGenerations = useMemo(() => {
    const gens = new Set<number>();
    basePool.forEach((p) => {
      if (typeof p.generation === 'number') gens.add(p.generation);
    });
    return Array.from(gens).sort((a, b) => a - b);
  }, [basePool]);

  const idToCell = useMemo(() => {
    const m = new Map<number, BingoCell>();
    pokemon.forEach((p) => m.set(p.id, p as BingoCell));
    GAMES.forEach((g) => m.set(g.id, { ...g, type: 'game' as const }));
    return m;
  }, [pokemon]);

  const grid = useMemo(() => gridIds.map((id) => idToCell.get(id)).filter(Boolean) as BingoCell[], [gridIds, idToCell]);

  const persist = useCallback(async (state: PersistedState) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
    if (!user) return;
    await supabase
      .from('bingo_boards')
      .upsert(
        {
          user_id: user.id,
          grid_size: state.gridSize ?? gridSize,
          grid_ids: state.gridIds ?? [],
          marked_ids: state.markedIds ?? [],
          generations: state.generations ?? [],
          random_pokemon_id: state.randomPokemonId ?? null,
          random_pokemon_name: state.randomPokemonName ?? null,
          random_generation_filter: state.randomGenerationFilter === 'all' ? null : state.randomGenerationFilter ?? null,
        },
        { onConflict: 'user_id' }
      );
  }, [user, gridSize]);

  const applyPersisted = useCallback((parsed: PersistedState | null) => {
    if (!parsed) return;

    const size = parsed.gridSize;
    if (size && SIZE_OPTIONS.includes(size as any)) {
      const safe = size as (typeof SIZE_OPTIONS)[number];
      setGridSize(safe);
      setPendingGridSize(safe);
    }

    if (typeof parsed.includeGames === 'boolean') setIncludeGames(parsed.includeGames);
    if (typeof parsed.gameRatio === 'number' && Number.isFinite(parsed.gameRatio)) {
      const clamped = Math.max(0, Math.min(1, parsed.gameRatio));
      setGameRatio(clamped);
    }

    if (Array.isArray(parsed.generations) && parsed.generations.length > 0) {
      setIncludedGenerations(new Set(parsed.generations));
      setPendingGenerations(new Set(parsed.generations));
      setGensTouched(true);
    }

    if (Array.isArray(parsed.selectedGameIds) && parsed.selectedGameIds.length > 0) {
      const next = parsed.selectedGameIds.filter((id) => GAMES.some((g) => g.id === id));
      if (next.length > 0) setSelectedGameIds(new Set(next));
    }

    if (Array.isArray(parsed.gridIds) && parsed.gridIds.length > 0) {
      const nextGridIds = parsed.gridIds.filter((id) => idToCell.has(id));
      if (nextGridIds.length === parsed.gridIds.length) {
        setGridIds(nextGridIds);
        const nextMarked = Array.isArray(parsed.markedIds) ? parsed.markedIds : [];
        setMarked(new Set(nextMarked));
      }
    }

    if (parsed.randomGenerationFilter === 'all' || typeof parsed.randomGenerationFilter === 'number') {
      setRandomGenerationFilter(parsed.randomGenerationFilter);
    }

    if (typeof parsed.randomPokemonId === 'number') {
      const restored =
        allRandomPokemon.find((p) => p.id === parsed.randomPokemonId && p.name === parsed.randomPokemonName) ??
        allRandomPokemon.find((p) => p.id === parsed.randomPokemonId);
      if (restored) setRandomPokemon(restored);
    }
  }, [allRandomPokemon, idToCell]);

  const makePersistedState = useCallback((overrides: PersistedState = {}): PersistedState => ({
    gridSize,
    gridIds,
    markedIds: Array.from(marked),
    generations: Array.from(includedGenerations),
    includeGames,
    gameRatio,
    selectedGameIds: Array.from(selectedGameIds),
    randomPokemonId: randomPokemon?.id ?? null,
    randomPokemonName: randomPokemon?.name ?? null,
    randomGenerationFilter,
    ...overrides,
  }), [gameRatio, gridIds, gridSize, includeGames, includedGenerations, marked, randomGenerationFilter, randomPokemon, selectedGameIds]);

  const pickRandomPokemon = useCallback(() => {
    if (randomPokemonPool.length === 0) return;
    const candidates = randomPokemon && randomPokemonPool.length > 1
      ? randomPokemonPool.filter((p) => p.name !== randomPokemon.name)
      : randomPokemonPool;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    setRandomPokemon(next);
    void persist(makePersistedState({
      randomPokemonId: next.id,
      randomPokemonName: next.name,
      randomGenerationFilter,
    }));
  }, [makePersistedState, persist, randomGenerationFilter, randomPokemon, randomPokemonPool]);

  const setRandomGeneration = useCallback((nextFilter: 'all' | number) => {
    const shouldClear = randomPokemon && nextFilter !== 'all' && randomPokemon.generation !== nextFilter;
    setRandomGenerationFilter(nextFilter);
    if (shouldClear) setRandomPokemon(null);
    void persist(makePersistedState({
      randomPokemonId: shouldClear ? null : randomPokemon?.id ?? null,
      randomPokemonName: shouldClear ? null : randomPokemon?.name ?? null,
      randomGenerationFilter: nextFilter,
    }));
  }, [makePersistedState, persist, randomPokemon]);

  const buildPools = useCallback((gens: Set<number>) => {
    const matchesGen = (p: { generation?: number } | Pick<GameCell, 'generation'>) =>
      typeof p.generation === 'number' && gens.has(p.generation);

    const filteredBase = basePool.filter(matchesGen);
    const filteredAll = pokemon.filter((p) => !p.hideFromPokedex && (!p.shinyAvailability || p.shinyAvailability === 'ok') && matchesGen(p));
    const pokemonPool = filteredBase.length > 0 ? filteredBase : filteredAll;
    const gamesPool = GAMES.filter((g) => matchesGen(g) && selectedGameIds.has(g.id)).map((g) => ({ ...g, type: 'game' as const }));
    return { pokemonPool, gamesPool };
  }, [basePool, pokemon, selectedGameIds]);

  const generateGrid = useCallback(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (pendingGenerations.size === 0) {
      setGridIds([]);
      setMarked(new Set());
      return;
    }

    const needed = pendingGridSize * pendingGridSize;
    const { pokemonPool, gamesPool } = buildPools(pendingGenerations);

    const numGames = includeGames ? Math.min(gamesPool.length, Math.floor(needed * gameRatio)) : 0;
    const pickedGames = shuffleInPlace([...gamesPool]).slice(0, numGames);

    const neededPokes = needed - pickedGames.length;
    const pickedPokes = shuffleInPlace([...pokemonPool]).slice(0, neededPokes);

    const ids = shuffleInPlace([...pickedPokes.map((p) => p.id), ...pickedGames.map((g) => g.id)]).slice(0, needed);

    setGridSize(pendingGridSize);
    setIncludedGenerations(new Set(pendingGenerations));
    setGridIds(ids);
    setMarked(new Set());

    void persist(makePersistedState({
      gridSize: pendingGridSize,
      gridIds: ids,
      markedIds: [],
      generations: Array.from(pendingGenerations),
      includeGames,
      gameRatio,
      selectedGameIds: Array.from(selectedGameIds),
    }));
  }, [pendingGenerations, pendingGridSize, includeGames, gameRatio, persist, buildPools, selectedGameIds, makePersistedState]);

  const toggleMark = useCallback((index: number) => {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const getActivePoolIds = useCallback(() => {
    if (includedGenerations.size === 0) return [];
    const { pokemonPool, gamesPool } = buildPools(includedGenerations);
    const ids = [...pokemonPool.map((p) => p.id)];
    if (includeGames) ids.push(...gamesPool.map((g) => g.id));
    return ids;
  }, [includedGenerations, buildPools, includeGames]);

  const replaceCell = useCallback((index: number) => {
    const poolIds = getActivePoolIds();
    if (poolIds.length === 0) return;
    setGridIds((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const used = new Set(prev);
      used.delete(prev[index]);
      const candidates = poolIds.filter((id) => !used.has(id));
      const source = candidates.length > 0 ? candidates : poolIds;
      const pick = source[Math.floor(Math.random() * source.length)];
      const next = [...prev];
      next[index] = pick;
      return next;
    });
    setMarked((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, [getActivePoolIds]);

  const openPickerForCell = useCallback((index: number) => {
    const cell = grid[index];
    setPickerTargetIndex(index);
    setPickerValue(cell?.id ?? null);
    setPickerValueName((cell as any)?.name);
    setPickerMode((cell as any)?.type === 'game' ? 'logo' : 'pokemon');
    setPickerOpen(true);
  }, [grid]);

  const applySelectedPokemon = useCallback((pokemonId: number | null, pokemonName: string) => {
    if (pokemonId === null || pickerTargetIndex === null) return;
    const selected =
      pokemon.find((p) => p.id === pokemonId && p.name === pokemonName) ??
      pokemon.find((p) => p.id === pokemonId);
    if (!selected) return;
    if (selected.shinyAvailability && selected.shinyAvailability !== 'ok') return;

    const idx = pickerTargetIndex;
    setGridIds((prev) => {
      if (idx < 0 || idx >= prev.length) return prev;
      const next = [...prev];
      next[idx] = selected.id;
      return next;
    });
    setMarked((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
    setPickerOpen(false);
  }, [pickerTargetIndex, pokemon]);

  const applySelectedGameLogo = useCallback((gameId: number) => {
    if (pickerTargetIndex === null) return;
    if (!GAMES.some((g) => g.id === gameId)) return;

    const idx = pickerTargetIndex;
    setGridIds((prev) => {
      if (idx < 0 || idx >= prev.length) return prev;
      const next = [...prev];
      next[idx] = gameId;
      return next;
    });
    setMarked((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
    setPickerOpen(false);
  }, [pickerTargetIndex]);

  const toggleGeneration = useCallback((gen: number) => {
    setGensTouched(true);
    setPendingGenerations((prev) => {
      const next = new Set(prev);
      if (next.has(gen)) next.delete(gen);
      else next.add(gen);
      return next;
    });
  }, []);

  const selectAllGenerations = useCallback(() => {
    setGensTouched(true);
    setPendingGenerations(new Set(availableGenerations));
  }, [availableGenerations]);

  const clearGenerations = useCallback(() => {
    setGensTouched(true);
    setPendingGenerations(new Set());
  }, []);

  // Default generations on first load.
  useEffect(() => {
    if (loading) return;
    if (gensTouched) return;
    if (availableGenerations.length === 0) return;
    if (includedGenerations.size > 0 || pendingGenerations.size > 0) return;
    setIncludedGenerations(new Set(availableGenerations));
    setPendingGenerations(new Set(availableGenerations));
  }, [loading, gensTouched, availableGenerations, includedGenerations.size, pendingGenerations.size]);

  // Initial hydrate from remote (if logged in) or local storage.
  useEffect(() => {
    if (loading) return;
    if (didInitRef.current) return;
    didInitRef.current = true;

    const hydrateLocal = () => {
      const parsed = safeParseJson<PersistedState>(window.localStorage.getItem(STORAGE_KEY));
      applyPersisted(parsed);
    };

    if (!user) {
      hydrateLocal();
      return;
    }

    void (async () => {
      const { data, error } = await supabase
        .from('bingo_boards')
        .select('grid_size, grid_ids, marked_ids, generations, random_pokemon_id, random_pokemon_name, random_generation_filter')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        hydrateLocal();
        return;
      }

      applyPersisted({
        gridSize: data.grid_size,
        gridIds: data.grid_ids ?? [],
        markedIds: data.marked_ids ?? [],
        generations: data.generations ?? [],
        randomPokemonId: data.random_pokemon_id ?? null,
        randomPokemonName: data.random_pokemon_name ?? null,
        randomGenerationFilter: data.random_generation_filter ?? 'all',
      });
    })();
  }, [loading, user, applyPersisted]);

  // Debounced persistence for marking/replacing/manual edits.
  useEffect(() => {
    if (loading) return;
    if (!didInitRef.current) return;
    if (gridIds.length === 0) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void persist(makePersistedState());
    }, 250);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [loading, gridIds, persist, makePersistedState]);

  const totalCells = grid.length || gridSize * gridSize;
  const markedCount = marked.size;
  const progress = totalCells > 0 ? Math.round((markedCount / totalCells) * 100) : 0;

  return (
    <div
      className="min-h-screen bg-background transition-colors duration-1000"
      style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}18 0%, transparent 70%)` }}
    >
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 py-5 sm:px-4 lg:px-6">
        <header className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background">
              <Gamepad2 className="h-5 w-5" style={{ color: accentColor }} />
            </span>
            <div>
              <h1 className="text-3xl font-black leading-tight">Games</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick a random shiny target or play Shiny Bingo.
              </p>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Dice5 className="h-5 w-5" style={{ color: accentColor }} />
                </span>
                <div>
                  <h2 className="text-xl font-black">Random Pokémon</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose a random Pokémon from every available species and form. Shiny-locked Pokémon are excluded.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Generation
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={randomGenerationFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRandomGeneration('all')}
                    className="h-8 px-3"
                    style={randomGenerationFilter === 'all' ? { backgroundColor: accentColor } : undefined}
                  >
                    All
                  </Button>
                  {randomAvailableGenerations.map((gen) => {
                    const isActive = randomGenerationFilter === gen;
                    return (
                      <Button
                        key={gen}
                        type="button"
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setRandomGeneration(gen)}
                        className="h-8 px-3"
                        style={isActive ? { backgroundColor: accentColor } : undefined}
                      >
                        Gen {gen}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={pickRandomPokemon}
                  disabled={loading || randomPokemonPool.length === 0}
                  className="gap-2"
                >
                  <Dice5 className="h-4 w-4" />
                  {randomPokemon ? 'Pick another' : 'Pick a random Pokémon'}
                </Button>

                <span className="text-xs text-muted-foreground">
                  {loading ? 'Loading Pokémon...' : `${randomPokemonPool.length} available choices`}
                </span>
              </div>

              {!loading && randomPokemonPool.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No Pokémon available for this generation.
                </p>
              )}
            </div>

            <div className="flex min-h-64 items-center justify-center rounded-lg border border-border bg-background/70 p-4">
              {randomPokemon ? (
                <div className="flex w-full flex-col items-center text-center">
                  <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
                    <filter id={randomSpriteOutlineId} x="-32%" y="-32%" width="164%" height="164%" colorInterpolationFilters="sRGB">
                      <feMorphology in="SourceAlpha" operator="dilate" radius="0.5" result="outline" />
                      <feFlood floodColor="#050505" result="outlineColor" />
                      <feComposite in="outlineColor" in2="outline" operator="in" result="outlineShape" />
                      <feMerge>
                        <feMergeNode in="outlineShape" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </svg>
                  <img
                    key={`${randomPokemon.id}-${randomPokemon.name}`}
                    src={getPokemonSpriteUrl(randomPokemon.id, { shiny: true, name: randomPokemon.name })}
                    alt={randomPokemon.displayName}
                    className="h-40 w-40 object-contain"
                    style={{
                      imageRendering: 'auto',
                      filter: `url(#${randomSpriteOutlineId}) drop-shadow(0 8px 16px rgba(0,0,0,0.75))`,
                    }}
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  <div className="mt-2 text-xl font-black">{randomPokemon.displayName}</div>
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md border border-border bg-card px-2 py-1">
                      #{randomPokemon.baseId.toString().padStart(4, '0')}
                    </span>
                    <span className="rounded-md border border-border bg-card px-2 py-1">
                      Gen {randomPokemon.generation}
                    </span>
                    {randomPokemon.shinyAvailability === 'not_own_ot' && (
                      <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-amber-600 dark:text-amber-300">
                        Event / No Own OT
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  <Dice5 className="mx-auto mb-3 h-10 w-10 opacity-40" />
                  Press the button to reveal a Pokémon.
                </div>
              )}
            </div>
          </div>
        </section>

        <header className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                  <Sparkles className="h-5 w-5" style={{ color: accentColor }} />
                </span>
                <div>
                  <h1 className="text-2xl font-bold leading-tight">Shiny Bingo</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1">
                      <Grid3X3 className="h-3.5 w-3.5" />
                      {pendingGridSize}x{pendingGridSize}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {markedCount}/{totalCells}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1">
                      <Gamepad2 className="h-3.5 w-3.5" />
                      {selectedGameIds.size} logos
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <Button
                variant={replaceMode ? 'default' : 'outline'}
                onClick={() => setReplaceMode((prev) => !prev)}
                className="h-10 justify-center gap-2"
                title="Change one square at a time"
              >
                <Shuffle className="h-4 w-4" />
                {replaceMode ? 'Swap ON' : 'Swap OFF'}
              </Button>
              <Button onClick={generateGrid} className="h-10 justify-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                Regenerate
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="order-2 lg:order-1">
            {loading ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                Loading Pokémon...
              </div>
            ) : pendingGenerations.size === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                Select at least one generation.
              </div>
            ) : grid.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                Press Regenerate.
              </div>
            ) : (
              <div className="mx-auto w-full max-w-[680px]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-muted-foreground">{progress}% complete</div>
                  <div className="h-2 w-36 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, backgroundColor: MARK_COLOR }}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-2 shadow-sm sm:p-3">
                  <div
                    className="grid gap-1.5 sm:gap-2"
                    style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: gridSize * gridSize }).map((_, index) => {
                      const cell = grid[index];
                      if (!cell) {
                        return (
                          <div
                            key={`cell-empty-${index}`}
                            className="aspect-square rounded-md border border-border bg-muted/30"
                          />
                        );
                      }

                      const isMarked = marked.has(index);
                      const isAlt = index % 2 === 1;
                      const isGame = (cell as any).type === 'game';
                      const label = isGame
                        ? (cell as GameCell).name
                        : (cell as PokemonBasic).displayName || (cell as PokemonBasic).name;

                      return (
                        <div
                          key={`cell-${index}`}
                          onClick={() => {
                            if (replaceMode) replaceCell(index);
                            else toggleMark(index);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if (replaceMode) replaceCell(index);
                              else toggleMark(index);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          className={cn(
                            'group relative aspect-square overflow-hidden rounded-md border text-card-foreground transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
                            isMarked
                              ? 'border-green-500/80 bg-green-500/10 shadow-[0_0_0_1px_rgba(34,197,94,0.25)]'
                              : isAlt
                                ? 'border-border bg-background/85 hover:border-primary/50'
                                : 'border-border bg-muted/40 hover:border-primary/50'
                          )}
                          style={{ outlineColor: MARK_COLOR }}
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-1">
                            <img
                              src={
                                isGame
                                  ? (cell as GameCell).logo
                                  : getPokemonSpriteUrl((cell as PokemonBasic).id, {
                                      shiny: true,
                                      name: (cell as PokemonBasic).name,
                                    })
                              }
                              alt={label}
                              className={cn(
                                'h-[44%] max-h-16 min-h-8 w-[60%] object-contain drop-shadow-sm transition-transform group-hover:scale-105',
                                isMarked ? 'saturate-125' : 'saturate-95'
                              )}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                            <div className="max-h-8 w-full overflow-hidden px-1 text-center text-[9px] font-semibold leading-tight sm:text-[10px] [overflow-wrap:anywhere]">
                              {label}
                            </div>
                          </div>

                          {isMarked && (
                            <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPickerForCell(index);
                            }}
                            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card/95 text-card-foreground shadow-sm opacity-100 transition hover:bg-accent sm:opacity-0 sm:group-hover:opacity-100"
                            title="Choose content"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="order-1 space-y-4 lg:order-2">
            <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Generations</div>
                  <div className="text-xs text-muted-foreground">
                    {pendingGenerations.size} of {availableGenerations.length} active
                  </div>
                </div>
                <div className="flex overflow-hidden rounded-md border border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllGenerations}
                    className="h-8 rounded-none px-2.5 text-xs"
                  >
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearGenerations}
                    className="h-8 rounded-none border-l border-border px-2.5 text-xs"
                  >
                    None
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                {availableGenerations.map((gen) => {
                  const isActive = pendingGenerations.has(gen);
                  return (
                    <Button
                      key={gen}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleGeneration(gen)}
                      className={cn(
                        'h-12 justify-start gap-2 rounded-md px-3 text-left transition-all',
                        isActive ? 'shadow-sm' : 'bg-background/60'
                      )}
                    >
                      <span
                        className={cn(
                          'h-2.5 w-2.5 rounded-full border',
                          isActive ? 'border-primary-foreground bg-primary-foreground' : 'border-muted-foreground/50'
                        )}
                      />
                      <span className="font-semibold">Gen {gen}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Gamepad2 className="h-4 w-4" />
                  Game logos
                </div>
                <Switch checked={includeGames} onCheckedChange={setIncludeGames} />
              </div>
              <div className={cn('mt-4 space-y-3', !includeGames && 'opacity-50')}>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Square ratio</span>
                  <span>{Math.round(gameRatio * 100)}%</span>
                </div>
                <Slider
                  value={[Math.round(gameRatio * 100)]}
                  min={0}
                  max={60}
                  step={5}
                  disabled={!includeGames}
                  onValueChange={([value]) => setGameRatio(value / 100)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full justify-center gap-2"
                  onClick={() => setGamePickerOpen(true)}
                  disabled={!includeGames}
                >
                  <Gamepad2 className="h-4 w-4" />
                  {selectedGameIds.size} selected
                </Button>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-xl max-h-[85dvh] overflow-hidden p-0">
          <DialogHeader className="border-b border-border p-4 pr-10 text-left">
            <DialogTitle>Choose content</DialogTitle>
            <DialogDescription>You can place a Pokémon or a game logo in the square.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 px-4 pt-4">
            <Button
              type="button"
              variant={pickerMode === 'pokemon' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPickerMode('pokemon')}
              className="h-9 flex-1"
            >
              Pokémon
            </Button>
            <Button
              type="button"
              variant={pickerMode === 'logo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPickerMode('logo')}
              className="h-9 flex-1"
            >
              Logo
            </Button>
          </div>

          {pickerMode === 'pokemon' ? (
            <div className="max-h-[60dvh] space-y-3 overflow-y-auto p-4">
              <PokemonSelector
                value={pickerValue}
                valueName={pickerValueName}
                onChange={(id, name) => {
                  setPickerValue(id);
                  setPickerValueName(name);
                  applySelectedPokemon(id, name);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Note: “Shiny Locked” and “No Own OT” Pokémon are not available in Bingo.
              </p>
            </div>
          ) : (
            <div className="grid max-h-[60dvh] grid-cols-1 gap-2 overflow-y-auto p-4 sm:grid-cols-2">
              {GAMES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => applySelectedGameLogo(g.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-accent"
                >
                  <span className="flex items-center gap-3">
                    <img
                      src={g.logo}
                      alt={g.name}
                      className="h-8 w-8 object-contain"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/placeholder.svg')}
                    />
                    <span className="text-sm">{g.name}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">Gen {g.generation}</span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={gamePickerOpen} onOpenChange={setGamePickerOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-xl max-h-[85dvh] overflow-hidden p-0">
          <DialogHeader className="border-b border-border p-4 pr-10 text-left">
            <DialogTitle>Select Logos</DialogTitle>
            <DialogDescription>Choose which games can appear in Bingo.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 px-4 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedGameIds(new Set(GAMES.map((g) => g.id)))}
              className="h-9 flex-1"
            >
              All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedGameIds(new Set())}
              className="h-9 flex-1"
            >
              None
            </Button>
            <div className="text-xs text-muted-foreground">
              Selected: {selectedGameIds.size}
            </div>
          </div>

          <div className="grid max-h-[58dvh] grid-cols-1 gap-2 overflow-y-auto p-4 sm:grid-cols-2">
            {GAMES.map((g) => {
              const checked = selectedGameIds.has(g.id);
              return (
                <label
                  key={g.id}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 transition-colors',
                    checked ? 'border-primary/60 ring-1 ring-primary/20' : 'border-border'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <img
                      src={g.logo}
                      alt={g.name}
                      className="h-8 w-8 object-contain"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/placeholder.svg')}
                    />
                    <span className="text-sm">{g.name}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(selectedGameIds);
                      if (e.target.checked) next.add(g.id);
                      else next.delete(g.id);
                      setSelectedGameIds(next);
                    }}
                    className="w-4 h-4 rounded border-gray-400"
                  />
                </label>
              );
            })}
          </div>

          <div className="border-t border-border p-4 flex justify-end">
            <Button onClick={() => setGamePickerOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
