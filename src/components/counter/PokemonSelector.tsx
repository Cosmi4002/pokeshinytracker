import { useState, useMemo, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { usePokemonList, getPokemonSpriteUrl } from '@/hooks/use-pokemon';

interface PokemonSelectorProps {
  value: number | null;
  valueName?: string;
  onChange: (pokemonId: number | null, pokemonName: string, pokemonBaseId?: number) => void;
}

export function PokemonSelector({ value, valueName, onChange }: PokemonSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { pokemon, loading } = usePokemonList();

  const selectedPokemon = useMemo(() => {
    if (value === null) return undefined;
    if (valueName) {
      const exact = pokemon.find(p => p.id === value && p.name === valueName);
      if (exact) return exact;
    }
    return pokemon.find(p => p.id === value);
  }, [pokemon, value, valueName]);

  const filteredPokemon = useMemo(() => {
    if (!searchTerm) return pokemon;
    const searchLower = searchTerm.toLowerCase();
    return pokemon
      .filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.displayName.toLowerCase().includes(searchLower) ||
        p.baseId.toString().includes(searchLower)
      );
  }, [pokemon, searchTerm]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12"
        >
          {selectedPokemon ? (
            <div className="flex items-center gap-2">
              <img
                key={getPokemonSpriteUrl(selectedPokemon.id, { shiny: true, name: selectedPokemon.name })}
                src={getPokemonSpriteUrl(selectedPokemon.id, { shiny: true, name: selectedPokemon.name })}
                alt={selectedPokemon.displayName}
                className="h-8 w-8 pokemon-sprite object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <span>#{selectedPokemon.baseId.toString().padStart(4, '0')} {selectedPokemon.displayName}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select Pokémon...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search Pokémon..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            {loading && <div className="p-4 text-sm text-center text-muted-foreground">Loading...</div>}
            {!loading && filteredPokemon.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">No Pokémon found.</div>
            )}
            <CommandGroup>
              {filteredPokemon.map((p) => (
                <CommandItem
                  key={`${p.id}-${p.name}`}
                  value={`${p.id}-${p.name}`}
                  onSelect={() => {
                    onChange(p.id, p.name, p.baseId);
                    setOpen(false);
                    setSearchTerm('');
                  }}
                  className="flex items-center gap-2"
                >
                  <img
                    key={getPokemonSpriteUrl(p.id, { shiny: true, name: p.name })}
                    src={getPokemonSpriteUrl(p.id, { shiny: true, name: p.name })}
                    alt={p.displayName}
                    className="h-8 w-8 pokemon-sprite object-contain"
                    decoding="async"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <span>#{p.baseId.toString().padStart(4, '0')} {p.displayName}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === p.id && (!valueName || valueName === p.name) ? "opacity-100" : "opacity-0"
                      )}
                    />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
