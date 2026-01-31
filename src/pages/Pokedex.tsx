import { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePokemonList, getPokemonSpriteUrl, GENERATION_RANGES, POKEMON_WITH_GENDER_DIFF } from '@/hooks/use-pokemon';
import { Skeleton } from '@/components/ui/skeleton';

export default function Pokedex() {
  const { pokemon, loading } = usePokemonList();
  const [search, setSearch] = useState('');
  const [generation, setGeneration] = useState<string>('all');

  const filteredPokemon = useMemo(() => {
    return pokemon.filter((p) => {
      // Search filter
      const matchesSearch = p.displayName.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toString().includes(search);
      
      // Generation filter
      let matchesGen = true;
      if (generation !== 'all') {
        const genNum = parseInt(generation);
        const [start, end] = GENERATION_RANGES[genNum];
        matchesGen = p.id >= start && p.id <= end;
      }
      
      return matchesSearch && matchesGen;
    });
  }, [pokemon, search, generation]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h1 className="text-3xl font-bold shiny-text">Shiny Pokédex</h1>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Pokémon..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={generation} onValueChange={setGeneration}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Generation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Gens</SelectItem>
                  {Object.keys(GENERATION_RANGES).map((gen) => (
                    <SelectItem key={gen} value={gen}>
                      Gen {gen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pokemon count */}
          <p className="text-muted-foreground">
            Showing {filteredPokemon.length} of {pokemon.length} Pokémon
          </p>

          {/* Pokemon Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {Array.from({ length: 24 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {filteredPokemon.map((p) => {
                const hasGenderDiff = POKEMON_WITH_GENDER_DIFF.includes(p.id);
                
                return (
                  <Card
                    key={p.id}
                    className="group cursor-pointer hover:border-primary transition-colors overflow-hidden"
                  >
                    <CardContent className="p-2 text-center space-y-1">
                      <div className="flex justify-center gap-1">
                        {/* Default/Male shiny sprite */}
                        <img
                          src={getPokemonSpriteUrl(p.id, { shiny: true })}
                          alt={`${p.displayName} shiny`}
                          className="h-16 w-16 pokemon-sprite group-hover:scale-110 transition-transform"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        
                        {/* Female shiny sprite if has gender difference */}
                        {hasGenderDiff && (
                          <img
                            src={getPokemonSpriteUrl(p.id, { shiny: true, female: true })}
                            alt={`${p.displayName} shiny female`}
                            className="h-16 w-16 pokemon-sprite group-hover:scale-110 transition-transform"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        #{p.id.toString().padStart(4, '0')}
                      </p>
                      <p className="text-sm font-medium truncate">
                        {p.displayName}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
