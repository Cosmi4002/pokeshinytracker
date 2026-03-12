import { useCallback, useMemo, useState, useEffect } from 'react';
import { Sparkles, RefreshCcw } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { usePokemonList, getPokemonSpriteUrl, PokemonBasic } from '@/hooks/use-pokemon';
import { useRandomColor } from '@/lib/random-color-context';

const SIZE_OPTIONS = [4, 5, 6] as const;
const STORAGE_KEY = 'bingo-shiny-state';

export default function Bingo() {
  const { pokemon, loading } = usePokemonList();
  const { accentColor } = useRandomColor();
  const [gridSize, setGridSize] = useState<(typeof SIZE_OPTIONS)[number]>(4);
  const [pendingGridSize, setPendingGridSize] = useState<(typeof SIZE_OPTIONS)[number]>(4);
  const [grid, setGrid] = useState<PokemonBasic[]>([]);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [includedGenerations, setIncludedGenerations] = useState<Set<number>>(new Set());
  const [pendingGenerations, setPendingGenerations] = useState<Set<number>>(new Set());
  const [restored, setRestored] = useState(false);
  const [gensTouched, setGensTouched] = useState(false);

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
      return typeof p.generation !== 'number' ? true : pendingGenerations.has(p.generation);
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
      return typeof p.generation !== 'number' ? true : includedGenerations.has(p.generation);
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
  }, [loading, pokemon]);

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
  }, [gridSize, grid, marked, includedGenerations, loading]);

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

  const resetMarks = () => setMarked(new Set());

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center text-center">
          <div className="sm:pr-4">
            <h1 className="text-2xl font-bold flex items-center gap-2 justify-center">
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
            <Button variant="outline" onClick={generateGrid} className="h-8 px-3">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Rigenera
            </Button>
            <Button variant="ghost" onClick={resetMarks} className="h-8 px-3">
              Reset
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-center">
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
            <div
              className="grid gap-2 sm:gap-3 w-full max-w-5xl"
              style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
            >
            {grid.map((p, index) => {
              const isMarked = marked.has(p.id);
              const sprite = getPokemonSpriteUrl(p.id, { shiny: true, name: p.name });
              return (
                <div
                  key={`${p.id}-${index}`}
                  onClick={() => toggleMark(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleMark(p.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="group relative overflow-hidden rounded-2xl border bg-card/70 p-2 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg aspect-square focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    borderColor: isMarked ? accentColor : 'rgba(255,255,255,0.08)',
                    boxShadow: isMarked ? `0 0 18px ${accentColor}40` : undefined,
                    outlineColor: accentColor,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      background: `radial-gradient(circle at 50% 15%, ${accentColor}18, transparent 60%)`,
                    }}
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.06),transparent_45%)]" />
                  <div className="relative flex flex-col items-center gap-2">
                    <img
                      src={sprite}
                      alt={p.displayName || p.name}
                      className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.45)]"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                      }}
                      style={{
                        filter: isMarked ? 'grayscale(0) brightness(1.08) saturate(1.15)' : 'grayscale(0.2) brightness(0.95)',
                      }}
                    />
                    <div className="text-[11px] sm:text-xs font-semibold text-center leading-tight">
                      {p.displayName || p.name}
                    </div>
                  </div>
                  {isMarked && (
                    <div className="absolute inset-0 border-2 pointer-events-none" style={{ borderColor: accentColor }} />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      replaceCell(index);
                    }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full border border-white/10 bg-black/40 text-white/80 backdrop-blur hover:text-white hover:bg-black/60 transition-opacity opacity-0 group-hover:opacity-100"
                    title="Cambia Pokemon"
                  >
                    <RefreshCcw className="h-3.5 w-3.5 mx-auto" />
                  </button>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

