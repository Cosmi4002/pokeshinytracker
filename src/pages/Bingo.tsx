import { useCallback, useMemo, useState, useEffect } from 'react';
import { Sparkles, RefreshCcw } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { usePokemonList, getPokemonSpriteUrl, PokemonBasic } from '@/hooks/use-pokemon';
import { useRandomColor } from '@/lib/random-color-context';

const SIZE_OPTIONS = [5, 6, 7, 8] as const;

export default function Bingo() {
  const { pokemon, loading } = usePokemonList();
  const { accentColor } = useRandomColor();
  const [gridSize, setGridSize] = useState<(typeof SIZE_OPTIONS)[number]>(5);
  const [grid, setGrid] = useState<PokemonBasic[]>([]);
  const [marked, setMarked] = useState<Set<number>>(new Set());

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

  const shuffle = (items: PokemonBasic[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const generateGrid = useCallback(() => {
    const needed = gridSize * gridSize;
    const pool = basePool.length >= needed ? basePool : pokemon.filter((p) => !p.hideFromPokedex);
    const next = shuffle(pool).slice(0, needed);
    setGrid(next);
    setMarked(new Set());
  }, [basePool, gridSize, pokemon]);

  useEffect(() => {
    if (!loading) generateGrid();
  }, [loading, generateGrid]);

  const toggleMark = (index: number) => {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const resetMarks = () => setMarked(new Set());

  return (
    <div
      className="min-h-screen bg-background transition-colors duration-1000"
      style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}18 0%, transparent 70%)` }}
    >
      <Navbar />
      <main className="container mx-auto py-8 px-4 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Bingo Shiny
            </h1>
            <p className="text-sm text-muted-foreground">
              Genera una griglia casuale di Pokémon shiny da trovare. Clicca una casella per segnare.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 p-1">
              {SIZE_OPTIONS.map((size) => (
                <Button
                  key={size}
                  variant={gridSize === size ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGridSize(size)}
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

        {loading ? (
          <div className="rounded-xl border p-8 text-center text-muted-foreground">Caricamento Pokemon...</div>
        ) : (
          <div
            className="grid gap-2 sm:gap-3"
            style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
          >
            {grid.map((p, index) => {
              const isMarked = marked.has(index);
              const sprite = getPokemonSpriteUrl(p.id, { shiny: true, name: p.name });
              return (
                <button
                  key={`${p.id}-${index}`}
                  type="button"
                  onClick={() => toggleMark(index)}
                  className="group relative overflow-hidden rounded-lg border bg-card/70 p-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{
                    borderColor: isMarked ? accentColor : 'rgba(255,255,255,0.08)',
                    boxShadow: isMarked ? `0 0 18px ${accentColor}40` : undefined,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle at 50% 20%, ${accentColor}22, transparent 60%)`,
                    }}
                  />
                  <div className="relative flex flex-col items-center gap-2">
                    <img
                      src={sprite}
                      alt={p.displayName || p.name}
                      className="h-14 w-14 sm:h-16 sm:w-16 object-contain"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                      }}
                      style={{
                        filter: isMarked ? 'grayscale(0) brightness(1.05)' : 'grayscale(0.15)',
                      }}
                    />
                    <div className="text-[11px] sm:text-xs font-semibold text-center leading-tight">
                      {p.displayName || p.name}
                    </div>
                  </div>
                  {isMarked && (
                    <div className="absolute inset-0 border-2 pointer-events-none" style={{ borderColor: accentColor }} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
