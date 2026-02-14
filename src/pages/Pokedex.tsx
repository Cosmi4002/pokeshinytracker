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
import { useNavigate } from 'react-router-dom';

export default function Pokedex() {
  const { pokemon, loading } = usePokemonList();
  const { accentColor } = useRandomColor();
  const { getCaughtCountForPokemon, isCaught, loading: caughtLoading } = usePokedexCaught();
  const [search, setSearch] = useState('');
  const [generationFilter, setGenerationFilter] = useState<string>('all');
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonBasic | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Group all pokemon by species (baseId + name prefix for gender variants)
  const speciesGroups = useMemo(() => {
    const map = new Map<string, PokemonBasic[]>();
    pokemon.forEach(p => {
      // Strip gender suffixes to keep male/female together
      // But keep regional suffixes (alola, galar, etc.) separate
      const nameKey = p.name.replace(/-male$|-female$/, '');
      const key = `${p.baseId}-${nameKey}`;

      const g = map.get(key) || [];
      g.push(p);
      map.set(key, g);
    });
    // Sort by baseId first (National Dex order), then by nameKey
    return Array.from(map.values()).sort((a, b) => {
      if (a[0].baseId !== b[0].baseId) return a[0].baseId - b[0].baseId;
      return a[0].name.localeCompare(b[0].name);
    });
  }, [pokemon]);

  const filteredGroups = useMemo(() => {
    const searchLower = search.toLowerCase();

    return speciesGroups.filter((group) => {
      // Does ANY pokemon in this group match the filter?
      return group.some(p => {
        // Search filter
        const matchesSearch = !search || p.displayName.toLowerCase().includes(searchLower) ||
          p.id.toString().includes(search);

        // Generation filter
        let matchesGen = true;
        if (generationFilter !== 'all') {
          if (generationFilter === 'Alola') {
            matchesGen = p.generation === 7 && p.name.includes('-alola');
          } else if (generationFilter === 'Galar') {
            matchesGen = p.generation === 8 && p.name.includes('-galar');
          } else if (generationFilter === 'Hisui') {
            matchesGen = p.generation === 8 && p.name.includes('-hisui');
          } else if (generationFilter === 'Paldea') {
            matchesGen = p.generation === 9 && (p.name.includes('-paldea') || (p.id > 10000 && p.baseId >= 906));
          } else {
            matchesGen = p.generation === parseInt(generationFilter);
          }
        }

        return matchesSearch && matchesGen && !p.hideFromPokedex;
      });
    });
  }, [speciesGroups, search, generationFilter]);

  // Calculate completion stats
  const completionStats = useMemo(() => {
    let totalCaught = 0;
    filteredGroups.forEach(group => {
      // Any variant caught counts as species caught for the summary? 
      // Or should it be 100% caught? Usually "At least one" is the Pokedex standard.
      const hasAnyCaught = group.some(p => {
        const { caught } = getCaughtCountForPokemon(p.id);
        return caught > 0;
      });
      if (hasAnyCaught) totalCaught++;
    });
    return { caught: totalCaught, total: filteredGroups.length };
  }, [filteredGroups, getCaughtCountForPokemon]);

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

              <Select value={generationFilter} onValueChange={setGenerationFilter}>
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
                  <SelectItem value="Alola">Alola Forms</SelectItem>
                  <SelectItem value="Galar">Galar Forms</SelectItem>
                  <SelectItem value="Hisui">Hisui Forms</SelectItem>
                  <SelectItem value="Paldea">Paldea Forms</SelectItem>
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
              {filteredGroups.map((group) => {
                // Representatives: pick the one with lowest ID (usually the base form)
                // We sort each group by ID to ensure consistency
                const sortedGroup = [...group].sort((a, b) => a.id - b.id);
                const p = sortedGroup[0];

                // Show gender diff if the base species has it
                const hasGenderDiff = POKEMON_WITH_GENDER_DIFF.includes(p.baseId);

                // Calculate percentage across ALL variants in the group
                let totalSpeciesCaught = 0;
                let totalPossibleVariants = 0;

                group.forEach(variant => {
                  const { caught } = getCaughtCountForPokemon(variant.id);
                  totalSpeciesCaught += caught;

                  // Basic form count
                  let formsForVariant = 1;
                  if (POKEMON_FORM_COUNTS[variant.id]) {
                    formsForVariant = POKEMON_FORM_COUNTS[variant.id];
                  } else if (variant.id === p.baseId && hasGenderDiff) {
                    formsForVariant = 2; // Male + Female
                  }
                  totalPossibleVariants += formsForVariant;
                });

                const caughtPct = totalPossibleVariants > 0
                  ? Math.min(100, (totalSpeciesCaught / totalPossibleVariants) * 100)
                  : 0;

                const hasCaughtAny = totalSpeciesCaught > 0;

                return (
                  <PokedexCard
                    key={p.baseId}
                    pokemonId={p.id}
                    baseId={p.baseId}
                    displayName={p.displayName}
                    spriteUrl={getPokemonSpriteUrl(p.id, { shiny: true, name: p.name })}
                    femaleSprite={hasGenderDiff ? getPokemonSpriteUrl(p.id, { shiny: true, female: true, name: p.name }) : undefined}
                    hasGenderDiff={hasGenderDiff}
                    caughtPercentage={caughtPct}
                    hasCaughtAny={hasCaughtAny}
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
