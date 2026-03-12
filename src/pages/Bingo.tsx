import { useCallback, useMemo, useState, useEffect } from 'react';
import { Sparkles, RefreshCcw } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { usePokemonList, getPokemonSpriteUrl, PokemonBasic } from '@/hooks/use-pokemon';
import { useRandomColor } from '@/lib/random-color-context';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

const SIZE_OPTIONS = [5] as const;
const MARK_COLOR = '#22c55e';
const STORAGE_KEY = 'bingo-shiny-state';

export default function Bingo() {
  const { pokemon, loading } = usePokemonList();
  const { accentColor } = useRandomColor();
  const { user } = useAuth();
  const [gridSize, setGridSize] = useState<(typeof SIZE_OPTIONS)[number]>(5);
  const [pendingGridSize, setPendingGridSize] = useState<(typeof SIZE_OPTIONS)[number]>(5);
  const [grid, setGrid] = useState<PokemonBasic[]>([]);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [includedGenerations, setIncludedGenerations] = useState<Set<number>>(new Set());
  const [pendingGenerations, setPendingGenerations] = useState<Set<number>>(new Set());
  const [restored, setRestored] = useState(false);
  const [gensTouched, setGensTouched] = useState(false);
  const [replaceMode, setReplaceMode] = useState(false);

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
    const needed = pendingGridSize * pendingGridSize;
    const filterActive = pendingGenerations.size > 0;
    const matchesGen = (p: PokemonBasic) => {
      if (!filterActive) return false;
      if (typeof p.generation !== 'number') return false;
      return pendingGenerations.has(p.generation);
    };
    const filteredBase = basePool.filter(matchesGen);
    const filteredAll = pokemon.filter((p) => !p.hideFromPokedex && matchesGen(p));
    if (!filterActive) {
      setGrid([]);
      setMarked(new Set());
      setRestored(false);
      return;
    }
    const pool = filteredBase.length >= needed ? filteredBase : filteredAll;
    const next = shuffle(pool).slice(0, needed);
    setGridSize(pendingGridSize);
    setIncludedGenerations(new Set(pendingGenerations));
    setGrid(next);
    setMarked(new Set());
    setRestored(false);
  }, [basePool, pendingGridSize, pokemon, pendingGenerations]);

  const getActivePool = useCallback(() => {
    const matchesGen = (p: PokemonBasic) => {
      if (typeof p.generation !== 'number') return false;
      return includedGenerations.has(p.generation);
    };
    const filteredBase = basePool.filter((p) => includedGenerations.size > 0 && matchesGen(p));
    const filteredAll = pokemon.filter((p) => !p.hideFromPokedex && includedGenerations.size > 0 && matchesGen(p));
    return filteredBase.length > 0 ? filteredBase : filteredAll;
  }, [basePool, pokemon, includedGenerations]);

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
    const loadLocal = () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as {
          gridSize?: number;
          gridIds?: number[];
          markedIds?: number[];
          generations?: number[];
        };
        if (parsed.gridSize && SIZE_OPTIONS.includes(parsed.gridSize as any)) {
          const size = parsed.gridSize as (typeof SIZE_OPTIONS)[number];
          setGridSize(size);
          setPendingGridSize(size);
        }
        if (Array.isArray(parsed.generations) && parsed.generations.length > 0) {
          setIncludedGenerations(new Set(parsed.generations));
          setPendingGenerations(new Set(parsed.generations));
          setGensTouched(true);
        }
        if (
          Array.isArray(parsed.gridIds) &&
          parsed.gridIds.length > 0 &&
          (!parsed.gridSize || parsed.gridIds.length === (parsed.gridSize as number) * (parsed.gridSize as number))
        ) {
          const byId = new Map(pokemon.map((p) => [p.id, p]));
          const nextGrid = parsed.gridIds.map((id) => byId.get(id)).filter(Boolean) as PokemonBasic[];
          if (nextGrid.length === parsed.gridIds.length) {
            setGrid(nextGrid);
            if (Array.isArray(parsed.markedIds)) {
              setMarked(new Set(parsed.markedIds));
            }
            setRestored(true);
          }
        }
      } catch {
        // ignore corrupted storage
      }
    };
    loadLocal();
  }, [loading, pokemon, user]);

  useEffect(() => {
    if (!user || loading) return;
    let active = true;
    const fetchRemote = async () => {
      const { data, error } = await supabase
        .from('bingo_boards')
        .select('grid_size, grid_ids, marked_ids, generations')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!active) return;
      if (error || !data) {
        // fallback to local if remote not found
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (!raw) return;
          const parsed = JSON.parse(raw) as {
            gridSize?: number;
            gridIds?: number[];
            markedIds?: number[];
            generations?: number[];
          };
          if (parsed.gridSize && SIZE_OPTIONS.includes(parsed.gridSize as any)) {
            const size = parsed.gridSize as (typeof SIZE_OPTIONS)[number];
            setGridSize(size);
            setPendingGridSize(size);
          }
          if (Array.isArray(parsed.generations) && parsed.generations.length > 0) {
            setIncludedGenerations(new Set(parsed.generations));
            setPendingGenerations(new Set(parsed.generations));
            setGensTouched(true);
          }
          if (
            Array.isArray(parsed.gridIds) &&
            parsed.gridIds.length > 0 &&
            (!parsed.gridSize || parsed.gridIds.length === (parsed.gridSize as number) * (parsed.gridSize as number))
          ) {
            const byId = new Map(pokemon.map((p) => [p.id, p]));
            const nextGrid = parsed.gridIds.map((id) => byId.get(id)).filter(Boolean) as PokemonBasic[];
            if (nextGrid.length === parsed.gridIds.length) {
              setGrid(nextGrid);
              if (Array.isArray(parsed.markedIds)) {
                setMarked(new Set(parsed.markedIds));
              }
              setRestored(true);
            }
          }
        } catch {
          // ignore corrupted storage
        }
        return;
      }
      const { grid_size, grid_ids, marked_ids, generations } = data;
      if (grid_size && SIZE_OPTIONS.includes(grid_size as any)) {
        setGridSize(grid_size as (typeof SIZE_OPTIONS)[number]);
        setPendingGridSize(grid_size as (typeof SIZE_OPTIONS)[number]);
      }
      if (Array.isArray(generations) && generations.length > 0) {
        setIncludedGenerations(new Set(generations));
        setPendingGenerations(new Set(generations));
        setGensTouched(true);
      }
      if (Array.isArray(grid_ids) && grid_ids.length > 0) {
        const byId = new Map(pokemon.map((p) => [p.id, p]));
        const nextGrid = grid_ids.map((id) => byId.get(id)).filter(Boolean) as PokemonBasic[];
        if (nextGrid.length === grid_ids.length) {
          setGrid(nextGrid);
          if (Array.isArray(marked_ids)) {
            setMarked(new Set(marked_ids));
          }
          setRestored(true);
        }
      }
    };
    fetchRemote();
    return () => {
      active = false;
    };
  }, [user?.id, loading, pokemon]);

  useEffect(() => {
    if (loading || grid.length === 0) return;
    try {
      const payload = {
        gridSize,
        gridIds: grid.map((p) => p.id),
        markedIds: Array.from(marked),
        generations: Array.from(includedGenerations),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
    if (user) {
      void supabase
        .from('bingo_boards')
        .upsert(
          {
            user_id: user.id,
            grid_size: gridSize,
            grid_ids: grid.map((p) => p.id),
            marked_ids: Array.from(marked),
            generations: Array.from(includedGenerations),
          },
          { onConflict: 'user_id' }
        );
    }
  }, [gridSize, grid, marked, includedGenerations, loading, user?.id]);

  const toggleMark = (pokemonId: number) => {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(pokemonId)) next.delete(pokemonId);
      else next.add(pokemonId);
      return next;
    });
  };

  const replaceCell = (index: number) => {
    const pool = getActivePool();
    if (pool.length === 0) return;
    let removedId: number | undefined;
    setGrid((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const currentId = prev[index]?.id;
      removedId = currentId;
      const usedIds = new Set(prev.map((p) => p.id));
      usedIds.delete(currentId);
      const available = pool.filter((p) => !usedIds.has(p.id));
      const source = available.length > 0 ? available : pool;
      const nextPick = source[Math.floor(Math.random() * source.length)];
      const next = [...prev];
      next[index] = nextPick;
      return next;
    });
    setMarked((prev) => {
      const next = new Set(prev);
      if (removedId) next.delete(removedId);
      return next;
    });
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
            <div className="w-full max-w-[840px] rounded-2xl border border-white/20 bg-card/70 shadow-lg">
              <table className="w-full table-fixed border-collapse">
                <tbody>
                  {Array.from({ length: gridSize }).map((_, row) => (
                    <tr key={`row-${row}`}>
                      {Array.from({ length: gridSize }).map((__, col) => {
                        const index = row * gridSize + col;
                        const p = grid[index];
                        if (!p) {
                          return (
                            <td key={`cell-${row}-${col}`} className="border border-white/10 bg-black/20 aspect-square" />
                          );
                        }
                        const isMarked = marked.has(p.id);
                        const sprite = getPokemonSpriteUrl(p.id, { shiny: true, name: p.name });
                        const isAlt = (row + col) % 2 === 1;
                        return (
                          <td
                            key={`cell-${row}-${col}`}
                            className={`border-2 border-white/20 ${isAlt ? 'bg-black/25' : 'bg-black/15'} align-middle`}
                          >
                            <div
                              onClick={() => {
                                if (replaceMode) replaceCell(index);
                                else toggleMark(p.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  if (replaceMode) replaceCell(index);
                                  else toggleMark(p.id);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              className="group relative aspect-square w-full focus:outline-none focus:ring-2 focus:ring-offset-2"
                              style={{ outlineColor: MARK_COLOR }}
                            >
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-0.5">
                                <img
                                  src={sprite}
                                  alt={p.displayName || p.name}
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
                                  {p.displayName || p.name}
                                </div>
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
    </div>
  );
}

