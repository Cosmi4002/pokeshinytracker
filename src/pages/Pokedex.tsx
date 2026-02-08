import { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePokemonList, getPokemonSpriteUrl, GENERATION_RANGES, POKEMON_WITH_GENDER_DIFF } from '@/hooks/use-pokemon';
import { POKEMON_FORM_COUNTS } from '@/lib/pokemon-data';
import { Skeleton } from '@/components/ui/skeleton';
import { PokemonDetailDialog } from '@/components/pokedex/PokemonDetailDialog';
import { PokedexCard } from '@/components/pokedex/PokedexCard';
import { PokemonBasic } from '@/hooks/use-pokemon';
import { usePokedexCaught } from '@/hooks/use-pokedex-caught';
import { useRandomColor } from '@/lib/random-color-context';

export default function Pokedex() {
  const { pokemon, loading } = usePokemonList();
  const { accentColor } = useRandomColor();
  const { getCaughtCountForPokemon, isCaught, loading: caughtLoading } = usePokedexCaught();
  const [search, setSearch] = useState('');
  const [generation, setGeneration] = useState<string>('all');
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonBasic | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredPokemon = useMemo(() => {
    const searchLower = search.toLowerCase();
    const genNum = generation !== 'all' ? parseInt(generation) : null;
    const genRange = genNum !== null ? GENERATION_RANGES[genNum] : null;

    return pokemon.filter((p) => {
      // Search filter
      const matchesSearch = !search || p.displayName.toLowerCase().includes(searchLower) ||
        p.id.toString().includes(search);

      // Generation filter
      let matchesGen = true;
      if (genRange) {
        matchesGen = p.baseId >= genRange[0] && p.baseId <= genRange[1];
      }

      return matchesSearch && matchesGen;
    });
  }, [pokemon, search, generation]);

  // Calculate completion stats
  const completionStats = useMemo(() => {
    let totalCaught = 0;
    filteredPokemon.forEach(p => {
      const { caught } = getCaughtCountForPokemon(p.id);
      if (caught > 0) totalCaught++;
    });
    return { caught: totalCaught, total: filteredPokemon.length };
  }, [filteredPokemon, getCaughtCountForPokemon]);

  return (
    <div
      className="min-h-screen bg-background transition-colors duration-1000"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}15 0%, transparent 70%)`
      }}
    >
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Header & Filters */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between text-center md:text-left">
            <div>
              <h1
                className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r"
                style={{
                  backgroundImage: `linear-gradient(to right, ${accentColor}, color-mix(in srgb, ${accentColor}, white 30%))`
                }}
              >
                Shiny Pokédex
              </h1>
              <p className="text-muted-foreground mt-1 font-medium">
                {completionStats.caught} / {completionStats.total} catturati
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca Pokémon..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 bg-white/5 border-primary/20 focus:border-primary transition-all text-foreground"
                />
              </div>

              <Select value={generation} onValueChange={setGeneration}>
                <SelectTrigger className="w-full sm:w-[160px] h-11 bg-white/5 border-primary/20">
                  <SelectValue placeholder="Generazione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte Gen</SelectItem>
                  {Object.keys(GENERATION_RANGES).map((gen) => (
                    <SelectItem key={gen} value={gen}>
                      Gen {gen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pokemon Grid */}
          {loading || caughtLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: 24 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredPokemon.map((p) => {
                // Show gender diff if the species has it, but hide for Partner Cap form specifically
                const hasGenderDiff = POKEMON_WITH_GENDER_DIFF.includes(p.baseId) && p.id !== 10148;
                const { caught } = getCaughtCountForPokemon(p.id);

                // For percentage, we need to know total forms
                let totalForms = 1;
                if (POKEMON_FORM_COUNTS[p.baseId]) {
                  totalForms = POKEMON_FORM_COUNTS[p.baseId];
                } else if (hasGenderDiff) {
                  totalForms = 2;
                }

                const caughtPct = totalForms > 0
                  ? Math.min(100, (caught / totalForms) * 100)
                  : 0;

                return (
                  <PokedexCard
                    key={p.id}
                    pokemonId={p.id}
                    baseId={p.baseId}
                    displayName={p.displayName}
                    spriteUrl={getPokemonSpriteUrl(p.id, { shiny: true, name: p.name })}
                    femaleSprite={hasGenderDiff ? getPokemonSpriteUrl(p.id, { shiny: true, female: true, name: p.name }) : undefined}
                    hasGenderDiff={hasGenderDiff}
                    caughtPercentage={caughtPct}
                    hasCaughtAny={caught > 0}
                    onClick={() => {
                      setSelectedPokemon(p);
                      setIsDialogOpen(true);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      <PokemonDetailDialog
        pokemon={selectedPokemon}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
