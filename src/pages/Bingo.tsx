import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, RefreshCcw, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { PokemonSelector } from '@/components/counter/PokemonSelector';
import { usePokemonList, getPokemonSpriteUrl, PokemonBasic } from '@/hooks/use-pokemon';
import { useRandomColor } from '@/lib/random-color-context';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
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
  { id: GAME_ID_BASE + 28, name: 'Legends Arceus', generation: 8, logo: '/img/game-logos/pla.png' },
  // Gen 9
  { id: GAME_ID_BASE + 29, name: 'Scarlet', generation: 9, logo: '/img/game-logos/scarlet.png' },
  { id: GAME_ID_BASE + 30, name: 'Violet', generation: 9, logo: '/img/game-logos/violet.png' },
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
};

export default function Bingo() {
  const { pokemon, loading } = usePokemonList();
  const { accentColor } = useRandomColor();
  const { user } = useAuth();

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
  }, [idToCell]);

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

    void persist({
      gridSize: pendingGridSize,
      gridIds: ids,
      markedIds: [],
      generations: Array.from(pendingGenerations),
      includeGames,
      gameRatio,
      selectedGameIds: Array.from(selectedGameIds),
    });
  }, [pendingGenerations, pendingGridSize, includeGames, gameRatio, persist, buildPools, selectedGameIds]);

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
        .select('grid_size, grid_ids, marked_ids, generations')
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
      void persist({
        gridSize,
        gridIds,
        markedIds: Array.from(marked),
        generations: Array.from(includedGenerations),
        includeGames,
        gameRatio,
        selectedGameIds: Array.from(selectedGameIds),
      });
    }, 250);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [loading, gridSize, gridIds, marked, includedGenerations, includeGames, gameRatio, persist, selectedGameIds]);

  return (
    <div
      className="min-h-screen bg-background transition-colors duration-1000"
      style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}18 0%, transparent 70%)` }}
    >
      <Navbar />
      <main className="container mx-auto py-8 px-4 space-y-6">
        <div className="rounded-2xl border border-white/10 bg-card/60 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold flex items-center gap-2 justify-center sm:justify-start">
                <Sparkles className="h-5 w-5" />
                Bingo Shiny
              </h1>
              <p className="text-sm text-muted-foreground">
                Genera una griglia casuale di Pokemon shiny da trovare. Clicca una casella per segnare.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 p-1">
                {SIZE_OPTIONS.map((size) => (
                  <Button
                    key={size}
                    variant={pendingGridSize === size ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPendingGridSize(size)}
                    className="h-8 px-3"
                  >
                    {size}x{size}
                  </Button>
                ))}
              </div>
              <Button
                variant={replaceMode ? 'default' : 'outline'}
                onClick={() => setReplaceMode((prev) => !prev)}
                className="h-8 px-3"
                title="Attiva per cambiare una casella alla volta"
              >
                {replaceMode ? 'Cambia: ON' : 'Cambia: OFF'}
              </Button>
              <Button variant="outline" onClick={generateGrid} className="h-8 px-3">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Rigenera
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
            <div className="text-sm text-muted-foreground">Generazioni:</div>
            <div className="flex flex-wrap items-center gap-1.5 justify-center">
              {availableGenerations.map((gen) => {
                const isActive = pendingGenerations.has(gen);
                return (
                  <Button
                    key={gen}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleGeneration(gen)}
                    className="h-7 px-2.5"
                  >
                    Gen {gen}
                  </Button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectAllGenerations} className="h-7 px-2.5">
                Tutte
              </Button>
              <Button variant="ghost" size="sm" onClick={clearGenerations} className="h-7 px-2.5">
                Nessuna
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Includi Giochi:</label>
              <input
                type="checkbox"
                checked={includeGames}
                onChange={(e) => setIncludeGames(e.target.checked)}
                className="w-4 h-4 rounded border-gray-400"
              />
              <span className="text-xs">({Math.round(gameRatio * 100)}% caselle)</span>
              {includeGames && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5"
                  onClick={() => setGamePickerOpen(true)}
                  title="Scegli quali loghi possono uscire"
                >
                  Seleziona loghi
                </Button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border p-8 text-center text-muted-foreground max-w-2xl mx-auto">
            Caricamento Pokemon...
          </div>
        ) : pendingGenerations.size === 0 ? (
          <div className="rounded-xl border p-8 text-center text-muted-foreground max-w-2xl mx-auto">
            Seleziona almeno una generazione per generare il bingo.
          </div>
        ) : grid.length === 0 ? (
          <div className="rounded-xl border p-8 text-center text-muted-foreground max-w-2xl mx-auto">
            Nessuna griglia generata. Premi "Rigenera".
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-full max-w-[600px] rounded-2xl border border-white/20 bg-card/70 shadow-lg">
              <table className="w-full table-fixed border-collapse">
                <tbody>
                  {Array.from({ length: gridSize }).map((_, row) => (
                    <tr key={`row-${row}`}>
                      {Array.from({ length: gridSize }).map((__, col) => {
                        const index = row * gridSize + col;
                        const cell = grid[index];
                        if (!cell) {
                          return (
                            <td key={`cell-${row}-${col}`} className="border border-white/10 bg-black/20 aspect-square" />
                          );
                        }

                        const isMarked = marked.has(index);
                        const isAlt = (row + col) % 2 === 1;
                        const isGame = (cell as any).type === 'game';

                        return (
                          <td
                            key={`cell-${row}-${col}`}
                            className={`border-2 border-white/20 ${isAlt ? 'bg-black/25' : 'bg-black/15'} align-middle`}
                          >
                            <div
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
                              className="group relative aspect-square w-full focus:outline-none focus:ring-2 focus:ring-offset-2"
                              style={{ outlineColor: MARK_COLOR }}
                            >
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-0.5">
                                {isGame ? (
                                  <>
                                    <img
                                      src={(cell as GameCell).logo}
                                      alt={(cell as GameCell).name}
                                      className="h-10 w-10 sm:h-14 sm:w-14 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]"
                                      loading="lazy"
                                      decoding="async"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                                      }}
                                      style={{
                                        filter: isMarked
                                          ? 'grayscale(0) brightness(1.05) saturate(1.05)'
                                          : 'grayscale(0.3) brightness(1.1)',
                                      }}
                                    />
                                    <div className="text-[9px] sm:text-[10px] font-semibold text-center leading-tight text-gray-200">
                                      {(cell as GameCell).name}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <img
                                      src={getPokemonSpriteUrl((cell as PokemonBasic).id, { shiny: true, name: (cell as PokemonBasic).name })}
                                      alt={(cell as PokemonBasic).displayName || (cell as PokemonBasic).name}
                                      className="h-10 w-10 sm:h-14 sm:w-14 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]"
                                      loading="lazy"
                                      decoding="async"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                                      }}
                                      style={{
                                        filter: isMarked
                                          ? 'grayscale(0) brightness(1.05) saturate(1.05)'
                                          : 'grayscale(0.2) brightness(0.95)',
                                      }}
                                    />
                                    <div className="text-[9px] sm:text-[10px] font-semibold text-center leading-tight">
                                      {(cell as PokemonBasic).displayName || (cell as PokemonBasic).name}
                                    </div>
                                  </>
                                )}
                              </div>

                              {isMarked && (
                                <>
                                  <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      boxShadow: `inset 0 0 0 3px ${MARK_COLOR}`,
                                      backgroundColor: `${MARK_COLOR}22`,
                                    }}
                                  />
                                  <div
                                    className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-[0.12em] border"
                                    style={{
                                      color: MARK_COLOR,
                                      borderColor: `${MARK_COLOR}99`,
                                      backgroundColor: 'rgba(0,0,0,0.45)',
                                    }}
                                  >
                                    Trovato
                                  </div>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPickerForCell(index);
                                }}
                                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full border border-white/20 bg-black/50 text-white/80 backdrop-blur hover:text-white hover:bg-black/70 transition-opacity opacity-0 group-hover:opacity-100"
                                title="Scegli Pokemon"
                              >
                                <Pencil className="h-3.5 w-3.5 mx-auto" />
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Scegli contenuto</DialogTitle>
            <DialogDescription>Puoi inserire un Pokémon o un logo gioco nella casella.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={pickerMode === 'pokemon' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPickerMode('pokemon')}
              className="h-8"
            >
              Pokémon
            </Button>
            <Button
              type="button"
              variant={pickerMode === 'logo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPickerMode('logo')}
              className="h-8"
            >
              Logo
            </Button>
          </div>

          {pickerMode === 'pokemon' ? (
            <div className="space-y-3">
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
                Nota: i Pokémon “Shiny Locked” e “No Own OT” non sono disponibili nel Bingo.
              </p>
            </div>
          ) : (
            <div className="mt-1 max-h-[55vh] overflow-y-auto rounded-lg border border-white/10 p-3 space-y-2">
              {GAMES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => applySelectedGameLogo(g.id)}
                  className="w-full flex items-center justify-between gap-3 rounded-lg border border-transparent hover:border-white/15 hover:bg-white/5 px-2 py-1.5 text-left transition-colors"
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Seleziona Loghi</DialogTitle>
            <DialogDescription>Scegli quali giochi possono comparire nel bingo.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedGameIds(new Set(GAMES.map((g) => g.id)))}
              className="h-8"
            >
              Tutti
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedGameIds(new Set())}
              className="h-8"
            >
              Nessuno
            </Button>
            <div className="text-xs text-muted-foreground">
              Selezionati: {selectedGameIds.size}
            </div>
          </div>

          <div className="mt-3 max-h-[55vh] overflow-y-auto rounded-lg border border-white/10 p-3 space-y-2">
            {GAMES.map((g) => {
              const checked = selectedGameIds.has(g.id);
              return (
                <label key={g.id} className="flex items-center justify-between gap-3">
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

          <div className="mt-3 flex justify-end">
            <Button onClick={() => setGamePickerOpen(false)}>Chiudi</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
