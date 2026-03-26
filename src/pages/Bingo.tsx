import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCcw, Pencil } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { usePokemonList, getPokemonSpriteUrl, PokemonBasic } from '@/hooks/use-pokemon';
import { useRandomColor } from '@/lib/random-color-context';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { PokemonSelector } from '@/components/counter/PokemonSelector';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const SIZE_OPTIONS = [5] as const;
const MARK_COLOR = '#22c55e';
const STORAGE_KEY = 'bingo-shiny-state';

interface GameCell {
  readonly type: 'game';
  readonly id: number;
  readonly name: string;
  readonly generation: number;
  readonly logo: string;
}

type BingoCell = PokemonBasic | GameCell;

const GAME_ID_BASE = 20000;

const GAMES: Pick<GameCell, 'id' | 'name' | 'generation' | 'logo'>[] = [
  // Gen 3
  {id: GAME_ID_BASE + 0, name: 'Ruby', generation: 3, logo: '/img/game-logos/ruby.png'},
  {id: GAME_ID_BASE + 1, name: 'Sapphire', generation: 3, logo: '/img/game-logos/sapphire.png'},
  {id: GAME_ID_BASE + 2, name: 'Emerald', generation: 3, logo: '/img/game-logos/emerald.png'},
  {id: GAME_ID_BASE + 3, name: 'FireRed', generation: 3, logo: '/img/game-logos/firered.png'},
  {id: GAME_ID_BASE + 4, name: 'LeafGreen', generation: 3, logo: '/img/game-logos/leafgreen.png'},
  // Gen 4
  {id: GAME_ID_BASE + 5, name: 'Diamond', generation: 4, logo: '/img/game-logos/diamond.png'},
  {id: GAME_ID_BASE + 6, name: 'Pearl', generation: 4, logo: '/img/game-logos/pearl.png'},
  {id: GAME_ID_BASE + 7, name: 'Platinum', generation: 4, logo: '/img/game-logos/platinum.png'},
  {id: GAME_ID_BASE + 8, name: 'HeartGold', generation: 4, logo: '/img/game-logos/heartgold.png'},
  {id: GAME_ID_BASE + 9, name: 'SoulSilver', generation: 4, logo: '/img/game-logos/soulsilver.png'},
  // Gen 5
  {id: GAME_ID_BASE + 10, name: 'Black', generation: 5, logo: '/img/game-logos/black.png'},
  {id: GAME_ID_BASE + 11, name: 'White', generation: 5, logo: '/img/game-logos/white.png'},
  {id: GAME_ID_BASE + 12, name: 'Black 2', generation: 5, logo: '/img/game-logos/black2.png'},
  {id: GAME_ID_BASE + 13, name: 'White 2', generation: 5, logo: '/img/game-logos/white2.png'},
  // Gen 6
  {id: GAME_ID_BASE + 14, name: 'X', generation: 6, logo: '/img/game-logos/x.png'},
  {id: GAME_ID_BASE + 15, name: 'Y', generation: 6, logo: '/img/game-logos/y.png'},
  {id: GAME_ID_BASE + 16, name: 'Omega Ruby', generation: 6, logo: '/img/game-logos/omegaruby.png'},
  {id: GAME_ID_BASE + 17, name: 'Alpha Sapphire', generation: 6, logo: '/img/game-logos/alphasapphire.png'},
  // Gen 7
  {id: GAME_ID_BASE + 18, name: 'Sun', generation: 7, logo: '/img/game-logos/sun.png'},
  {id: GAME_ID_BASE + 19, name: 'Moon', generation: 7, logo: '/img/game-logos/moon.png'},
  {id: GAME_ID_BASE + 20, name: "Let's Go Pikachu", generation: 7, logo: '/img/game-logos/lgp.png'},
  {id: GAME_ID_BASE + 21, name: "Let's Go Eevee", generation: 7, logo: '/img/game-logos/lge.png'},
  // Gen 8
  {id: GAME_ID_BASE + 22, name: 'Sword', generation: 8, logo: '/img/game-logos/sword.png'},
  {id: GAME_ID_BASE + 23, name: 'Shield', generation: 8, logo: '/img/game-logos/shield.png'},
  {id: GAME_ID_BASE + 24, name: 'Brilliant Diamond', generation: 8, logo: '/img/game-logos/brilliantdiamond.png'},
  {id: GAME_ID_BASE + 25, name: 'Shining Pearl', generation: 8, logo: '/img/game-logos/shiningpearl.png'},
  {id: GAME_ID_BASE + 26, name: 'Legends Arceus', generation: 8, logo: '/img/game-logos/pla.png'},
  // Gen 9
  {id: GAME_ID_BASE + 27, name: 'Scarlet', generation: 9, logo: '/img/game-logos/scarlet.png'},
  {id: GAME_ID_BASE + 28, name: 'Violet', generation: 9, logo: '/img/game-logos/violet.png'},
];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  const rng = mulberry32(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}


export default function Bingo() {
  const { pokemon, loading } = usePokemonList();
  const { accentColor } = useRandomColor();
  const { user } = useAuth();
  const [gridSize, setGridSize] = useState<(typeof SIZE_OPTIONS)[number]>(5);
  const [pendingGridSize, setPendingGridSize] = useState<(typeof SIZE_OPTIONS)[number]>(5);
  const [grid, setGrid] = useState<BingoCell[]>([]);
  const [marked, setMarked] = useState<Set<number>>(new Set()); // indices 0 to grid.length-1
  const [includedGenerations, setIncludedGenerations] = useState<Set<number>>(new Set());
  const [pendingGenerations, setPendingGenerations] = useState<Set<number>>(new Set());
  const [restored, setRestored] = useState(false);
  const [gensTouched, setGensTouched] = useState(false);
  const [replaceMode, setReplaceMode] = useState(false);
  const [syncReady, setSyncReady] = useState(false);
  const [lastRemoteUpdatedAt, setLastRemoteUpdatedAt] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetIndex, setPickerTargetIndex] = useState<number | null>(null);
  const [pickerValue, setPickerValue] = useState<number | null>(null);
const [pickerValueName, setPickerValueName] = useState<string | undefined>(undefined);

  const [includeGames, setIncludeGames] = useState(true);
  const [gameRatio, setGameRatio] = useState(0.2);
  const [gridSeed, setGridSeed] = useState(0);

  const persistBoard = useCallback((payload: {
    gridSize: number;
    gridIds: number[];
    markedIds: number[];
    generations: number[];
    gridSeed: number;
    includeGames: boolean;
    gameRatio: number;
  }) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }

    if (!user) return;
    void supabase
      .from('bingo_boards')
      .upsert(
        {
          user_id: user.id,
          grid_size: payload.gridSize,
          grid_ids: payload.gridIds,
          marked_ids: payload.markedIds,
          generations: payload.generations,
        },
        { onConflict: 'user_id' }
      )
      .catch((error) => {
        console.warn('Supabase upsert failed:', error);
        setLastRemoteUpdatedAt(new Date().toISOString());
      });
  }, [user]);

const applyBoardState = useCallback((state: {
    gridSize?: number;
    gridIds?: number[];
    gridSeed?: number;
    includeGames?: boolean;
    gameRatio?: number;
    markedIds?: number[];
    markedPositions?: number[];
    generations?: number[];
    updatedAt?: string | null;
  }) => {
    const { gridSize: size, gridIds, gridSeed: incomingSeed, includeGames: incomingIncludeGames, gameRatio: incomingGameRatio, markedIds, markedPositions, generations, updatedAt } = state;
    if (size && SIZE_OPTIONS.includes(size as any)) {
      const safe = size as (typeof SIZE_OPTIONS)[number];
      setGridSize(safe);
      setPendingGridSize(safe);
    }
    if (Array.isArray(generations) && generations.length > 0) {
      setIncludedGenerations(new Set(generations));
      setPendingGenerations(new Set(generations));
      setGensTouched(true);
    }
    if (typeof incomingIncludeGames === 'boolean') setIncludeGames(incomingIncludeGames);
    if (typeof incomingGameRatio === 'number') setGameRatio(incomingGameRatio);
    if (typeof incomingSeed === 'number' && incomingSeed > 0) {
      setGridSeed(incomingSeed);
    }
    // Fallback old format
    if (Array.isArray(gridIds) && gridIds.length > 0) {
      const byId = new Map<number, BingoCell>();
      pokemon.forEach((p) => byId.set(p.id, p as BingoCell));
      GAMES.forEach((g) => byId.set(g.id, { ...g, type: 'game' as const }));

      const nextGrid = gridIds.map((id) => byId.get(id)).filter(Boolean) as BingoCell[];
      if (nextGrid.length === gridIds.length) {
        setGrid(nextGrid);
        const mIds = markedIds || markedPositions || [];
        setMarked(new Set(mIds));
        setRestored(true);
      }
    }
    if (updatedAt) {
      setLastRemoteUpdatedAt(updatedAt);
    }
  }, [pokemon]);

  const basePool = useMemo(() => {
    const byBase = new Map<number, PokemonBasic>();
    pokemon.forEach((p) => {
      if (p.hideFromPokedex) return;
      const baseId = p.baseId ?? p.id;
      const existing = byBase.get(baseId);
      if (!existing || p.id === baseId) {
        byBase.set(baseId, p);
      }
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

  const shuffle = (items: PokemonBasic[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

const generateGrid = useCallback(() => {
    // If there's a pending debounced save from previous interactions, cancel it.
    // Otherwise it can overwrite the freshly generated board a moment later.
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const needed = pendingGridSize * pendingGridSize;
    const filterActive = pendingGenerations.size > 0;
    const matchesGen = (p: PokemonBasic | Pick<GameCell, 'generation'>) => {
      if (!filterActive) return false;
      if (typeof p.generation !== 'number') return false;
      return pendingGenerations.has(p.generation);
    };
    const seed = Date.now();
    const filteredBase = basePool.filter(matchesGen);
    const filteredAll = pokemon.filter((p) => !p.hideFromPokedex && matchesGen(p));
    if (!filterActive) {
      setGrid([]);
      setMarked(new Set());
      setRestored(false);
      setGridSeed(0);
      return;
    }
    const pokemonPool = filteredBase.length >= needed ? filteredBase : filteredAll;
    let next: BingoCell[] = [];
    if (includeGames) {
      const filteredGamesRaw = GAMES.filter(matchesGen);
      const numGames = Math.floor(needed * gameRatio);
      const gamesAll = filteredGamesRaw.map((g) => ({ ...g, type: 'game' as const }));
      const pickedGames = seededShuffle(gamesAll, seed).slice(0, numGames);

      const neededPokes = needed - pickedGames.length;
      const pickedPokes = seededShuffle(pokemonPool, seed + 1).slice(0, neededPokes) as PokemonBasic[];

      next = [...pickedPokes, ...pickedGames];
      next = seededShuffle(next, seed + 2);
    } else {
      next = seededShuffle(pokemonPool, seed).slice(0, needed) as PokemonBasic[];
    }
    setGridSeed(seed);
    setGridSize(pendingGridSize);
    setIncludedGenerations(new Set(pendingGenerations));
    setGrid(next);
    setMarked(new Set());
    setRestored(false);

    // Save immediately so changing page right after "Rigenera" keeps the new board.
    persistBoard({
      gridSize: pendingGridSize,
      gridIds: next.map((c) => c.id),
      markedIds: [],
      generations: Array.from(pendingGenerations),
      gridSeed: seed,
      includeGames,
      gameRatio,
    });
  }, [basePool, pendingGridSize, pokemon, pendingGenerations, includeGames, gameRatio]);

  const getActivePool = useCallback((): BingoCell[] => {
    const matchesGen = (p: PokemonBasic | Pick<GameCell, 'generation'>) => {
      if (typeof p.generation !== 'number') return false;
      return includedGenerations.has(p.generation);
    };
    const filterActive = includedGenerations.size > 0;
    if (!filterActive) return [];
    const filteredBase = basePool.filter(matchesGen);
    const filteredAll = pokemon.filter((p) => !p.hideFromPokedex && matchesGen(p));
    const pokemonPool = filteredBase.length > 0 ? filteredBase : filteredAll;
    if (includeGames) {
      const gamesAll = GAMES.filter(matchesGen).map((g) => ({ ...g, type: 'game' as const }));
      return [...pokemonPool, ...gamesAll];
    }
    return pokemonPool;
  }, [basePool, pokemon, includedGenerations, gridSize, includeGames, gameRatio]);

  useEffect(() => {
    if (loading) return;
    if (!gensTouched && !restored && includedGenerations.size === 0 && availableGenerations.length > 0) {
      setIncludedGenerations(new Set(availableGenerations));
      setPendingGenerations(new Set(availableGenerations));
    }
  }, [loading, availableGenerations, includedGenerations.size, gensTouched, restored]);

  useEffect(() => {
    if (loading) return;
    if (user) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        gridSize?: number;
        gridIds?: number[];
        markedIds?: number[];
        gridSeed?: number;
        includeGames?: boolean;
        gameRatio?: number;
        generations?: number[];
      };
      applyBoardState({
        gridSize: parsed.gridSize,
        gridIds: parsed.gridIds,
        gridSeed: parsed.gridSeed,
        includeGames: parsed.includeGames,
        gameRatio: parsed.gameRatio,
        markedIds: parsed.markedIds,
        generations: parsed.generations,
      });
    } catch {
      // ignore corrupted storage
    } finally {
      setSyncReady(true);
    }
  }, [loading, user, applyBoardState]);

  useEffect(() => {
    if (!user || loading) return;
    let active = true;
    const fetchRemote = async () => {
      const { data, error } = await supabase
        .from('bingo_boards')
        .select('grid_size, grid_ids, marked_ids, generations, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!active) return;
      if (error || !data) {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as {
              gridSize?: number;
              gridIds?: number[];
              markedIds?: number[];
              gridSeed?: number;
              includeGames?: boolean;
              gameRatio?: number;
              generations?: number[];
            };
            applyBoardState({
              gridSize: parsed.gridSize,
              gridIds: parsed.gridIds,
              gridSeed: parsed.gridSeed,
              includeGames: parsed.includeGames,
              gameRatio: parsed.gameRatio,
              markedIds: parsed.markedIds,
              generations: parsed.generations,
            });
            await supabase.from('bingo_boards').upsert(
              {
                user_id: user.id,
                grid_size: parsed.gridSize ?? gridSize,
                grid_ids: parsed.gridIds ?? [],
                marked_ids: parsed.markedIds ?? [],
                generations: parsed.generations ?? [],
              },
              { onConflict: 'user_id' }
            );
          }
        } catch {
          // ignore
        } finally {
          setSyncReady(true);
        }
        return;
      }
      applyBoardState({
        gridSize: data.grid_size,
        gridIds: data.grid_ids ?? [],
        markedIds: data.marked_ids ?? [],
        generations: data.generations ?? [],
        updatedAt: data.updated_at ?? null,
      });
      setSyncReady(true);
    };
    fetchRemote();
    return () => {
      active = false;
    };
  }, [user?.id, loading, applyBoardState]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`bingo-boards-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bingo_boards', filter: `user_id=eq.${user.id}` },
        async () => {
          const { data, error } = await supabase
            .from('bingo_boards')
            .select('grid_size, grid_ids, marked_ids, generations, updated_at')
            .eq('user_id', user.id)
            .maybeSingle();
          if (error || !data) return;
          if (lastRemoteUpdatedAt && data.updated_at && new Date(data.updated_at) <= new Date(lastRemoteUpdatedAt)) return;
          applyBoardState({
            gridSize: data.grid_size,
            gridIds: data.grid_ids ?? [],
            markedIds: data.marked_ids ?? [],
            generations: data.generations ?? [],
            updatedAt: data.updated_at ?? null,
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, applyBoardState, lastRemoteUpdatedAt]);

useEffect(() => {
    if (loading || grid.length === 0 || !syncReady) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      persistBoard({
        gridSize,
        gridIds: grid.map((c) => c.id),
        markedIds: Array.from(marked),
        generations: Array.from(includedGenerations),
        gridSeed,
        includeGames,
        gameRatio,
      });
    }, 300);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [gridSize, gridSeed, includeGames, gameRatio, grid, marked, includedGenerations, loading, syncReady, persistBoard]);

const toggleMark = (index: number) => {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const replaceCell = (index: number) => {
    const pool = getActivePool();
    if (pool.length === 0) return;
    setGrid((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const usedIds = new Set(prev.map((p) => p.id).filter(id => id !== prev[index]?.id));
      const available = pool.filter((p) => !usedIds.has(p.id));
      const source = available.length > 0 ? available : pool;
      const nextPick = source[Math.floor(Math.random() * source.length)];
      const next = [...prev];
      next[index] = nextPick;
      return next;
    });
    // Unmark the cell on replace
    setMarked((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const openPickerForCell = (index: number) => {
    const current = grid[index];
    setPickerTargetIndex(index);
    setPickerValue(current?.id ?? null);
    setPickerValueName(current?.name);
    setPickerOpen(true);
  };

  const applySelectedPokemon = (pokemonId: number | null, pokemonName: string) => {
    if (pokemonId === null || pickerTargetIndex === null) return;
    const selected = pokemon.find((p) => p.id === pokemonId && p.name === pokemonName) ?? pokemon.find((p) => p.id === pokemonId);
    if (!selected) return;
    const target = pickerTargetIndex;
    let removedId: number | undefined;
    setGrid((prev) => {
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      removedId = next[target]?.id;
      next[target] = selected;
      return next;
    });
    setMarked((prev) => {
      const next = new Set(prev);
      if (removedId) next.delete(removedId);
      return next;
    });
    setPickerOpen(false);
  };


  const toggleGeneration = (gen: number) => {
    setGensTouched(true);
    setPendingGenerations((prev) => {
      const next = new Set(prev);
      if (next.has(gen)) next.delete(gen);
      else next.add(gen);
      return next;
    });
    setRestored(false);
  };

  const selectAllGenerations = () => {
    setGensTouched(true);
    setPendingGenerations(new Set(availableGenerations));
    setRestored(false);
  };
  const clearGenerations = () => {
    setGensTouched(true);
    setPendingGenerations(new Set());
    setRestored(false);
  };

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
                    onClick={() => {
                      setPendingGridSize(size);
                      setRestored(false);
                    }}
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
                        const p = grid[index] as BingoCell;
                        if (!p) {
                          return (
                            <td key={`cell-${row}-${col}`} className="border border-white/10 bg-black/20 aspect-square" />
                          );
                        }
const isMarked = marked.has(index);
                        const isAlt = (row + col) % 2 === 1;
                        const isGame = 'type' in p && p.type === 'game';
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
                                        src={p.logo}
                                        alt={p.name}
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
                                        {p.name}
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <img
                                        src={getPokemonSpriteUrl(p.id, { shiny: true, name: (p as PokemonBasic).name })}
                                        alt={(p as PokemonBasic).displayName || (p as PokemonBasic).name}
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
                                        {(p as PokemonBasic).displayName || (p as PokemonBasic).name}
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
            <DialogTitle>Scegli Pokemon</DialogTitle>
            <DialogDescription>Seleziona il Pokemon da inserire nella casella.</DialogDescription>
          </DialogHeader>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



